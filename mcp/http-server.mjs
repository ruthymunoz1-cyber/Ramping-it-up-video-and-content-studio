#!/usr/bin/env node
/* ============================================================
 * Ramping It Up Studio — MCP server (remote HTTP transport)
 * ============================================================
 * For REMOTE MCP clients that connect over a URL instead of spawning a
 * local process — Manus and similar hosted agents. Same tools, same
 * fal.ai/ElevenLabs billing as server.mjs (stdio), just reachable over the
 * network instead of run as a local subprocess. Zero npm dependencies:
 * plain Node 18+, built-in http module only.
 *
 * This must be deployed somewhere with a public URL (Render, Fly.io,
 * Railway, a VPS — see mcp/README.md) for a cloud agent like Manus to
 * reach it; running it on your own laptop only works if the laptop stays
 * on and reachable the whole time the agent might call it.
 *
 * REQUIRES MCP_AUTH_TOKEN to be set — without it the server refuses to
 * start. Anyone who has this URL and the token can run fal.ai/ElevenLabs
 * jobs billed to your account, so treat the token like a password: a long
 * random string, never committed to git, set only as a host env var.
 *
 * Setup:
 *   MCP_AUTH_TOKEN=<random-secret> FAL_KEY=<your-key> node mcp/http-server.mjs
 * ============================================================ */

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { TOOLS, HANDLERS, LOCAL_ONLY_TOOLS, resolveVoiceId, elSpeak } from "./lib.mjs";

const PORT = process.env.PORT || 8787;
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || "";
const MAX_BODY_BYTES = 1_000_000; // 1MB — generous for JSON-RPC tool calls, small enough to block abuse
const MAX_NARRATION_CHARS = 5000; // keeps the base64 response a sane size over HTTP
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "https://ramping-it-up-mcp.onrender.com";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* Short-lived in-memory hosting for generated narration, so fal.ai's compose
 * tool (mix_audio) has a URL it can fetch — ElevenLabs returns raw bytes,
 * not a hosted URL. Entries are small (a few seconds of MP3) and only need
 * to survive the few seconds until fal.ai fetches them. */
const AUDIO_STORE = new Map();
const AUDIO_TTL_MS = 30 * 60 * 1000;
function storeAudio(buffer, contentType) {
  const id = randomUUID();
  AUDIO_STORE.set(id, { buffer, contentType, expires: Date.now() + AUDIO_TTL_MS });
  return id;
}
function getStoredAudio(id) {
  const entry = AUDIO_STORE.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expires) { AUDIO_STORE.delete(id); return null; }
  return entry;
}

if (!AUTH_TOKEN) {
  console.error("MCP_AUTH_TOKEN is not set. Refusing to start an unauthenticated server reachable over the network.");
  console.error("Set it to a long random string and pass the same value to your MCP client's auth/header config.");
  process.exit(1);
}

const REMOTE_TOOLS = TOOLS.filter(t => !LOCAL_ONLY_TOOLS.has(t.name));

/* generate_narration needs a different implementation remotely: the shared
 * handler in lib.mjs saves to local disk and returns a path, which means
 * nothing on a cloud server. This version returns the audio itself, base64-
 * encoded, directly in the tool result. */
const REMOTE_HANDLERS = {
  ...HANDLERS,
  async generate_narration(a) {
    if (a.text.length > MAX_NARRATION_CHARS) throw new Error(`Text is ${a.text.length} chars — keep narration under ${MAX_NARRATION_CHARS} chars per call over the remote transport.`);
    const voice = await resolveVoiceId(a.voice);
    const buffer = await elSpeak(voice.voice_id, a.text, a.model || "eleven_multilingual_v2");
    const dataUri = `data:audio/mpeg;base64,${buffer.toString("base64")}`;
    const id = storeAudio(buffer, "audio/mpeg");
    const tempUrl = `${PUBLIC_BASE_URL}/audio/${id}.mp3`;
    return `Narration generated with voice "${voice.name}" (${buffer.length} bytes):\n${dataUri}\n\n` +
      `Temporary URL (pass this as narration_url to mix_audio — expires in 30 min): ${tempUrl}`;
  },
};

function authorized(req) {
  const header = req.headers["authorization"] || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return !!match && match[1] === AUTH_TOKEN;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) { reject(new Error("Request body too large.")); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleRpc(req) {
  const { id, method, params } = req;
  if (method === "initialize") {
    return { jsonrpc: "2.0", id, result: {
      protocolVersion: params?.protocolVersion || "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: { name: "ramping-it-up-studio-remote", version: "1.1.0" },
    }};
  }
  if (method === "notifications/initialized") return null; // notification — no response
  if (method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: REMOTE_TOOLS } };
  if (method === "tools/call") {
    const { name, arguments: args } = params;
    if (LOCAL_ONLY_TOOLS.has(name)) {
      return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `${name} writes to local disk and isn't available over the remote transport.` }], isError: true } };
    }
    const handler = REMOTE_HANDLERS[name];
    if (!handler) return { jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${name}` } };
    try {
      const text = await handler(args || {});
      return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text }] } };
    } catch (e) {
      return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: "Error: " + e.message }], isError: true } };
    }
  }
  if (id != null) return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
  return null;
}

const server = createServer(async (req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); res.end(); return; }

  if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
    res.writeHead(200, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, server: "ramping-it-up-studio-remote", tools: REMOTE_TOOLS.map(t => t.name) }));
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/audio/")) {
    const id = req.url.slice("/audio/".length).replace(/\.mp3$/, "");
    const entry = getStoredAudio(id);
    if (!entry) { res.writeHead(404, { ...cors, "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "Not found or expired (narration URLs last 30 minutes)." })); return; }
    res.writeHead(200, { ...cors, "Content-Type": entry.contentType, "Content-Length": entry.buffer.length });
    res.end(entry.buffer);
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/assets/")) {
    const rel = decodeURIComponent(req.url.slice("/assets/".length).split("?")[0]);
    const assetsRoot = path.join(__dirname, "assets");
    const filePath = path.join(assetsRoot, rel);
    if (rel.includes("..") || !filePath.startsWith(assetsRoot + path.sep)) {
      res.writeHead(400, { ...cors, "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid asset path." }));
      return;
    }
    if (!existsSync(filePath)) {
      res.writeHead(404, { ...cors, "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `${rel} has not been uploaded to the server.` }));
      return;
    }
    const buf = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === ".mp4" ? "video/mp4" : ext === ".mp3" ? "audio/mpeg" : "application/octet-stream";
    res.writeHead(200, { ...cors, "Content-Type": contentType, "Content-Length": buf.length });
    res.end(buf);
    return;
  }

  if (req.url !== "/mcp" || req.method !== "POST") {
    res.writeHead(404, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. POST JSON-RPC to /mcp." }));
    return;
  }

  if (!authorized(req)) {
    res.writeHead(401, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized. Send Authorization: Bearer <MCP_AUTH_TOKEN>." }));
    return;
  }

  const reqId = randomUUID().slice(0, 8);
  try {
    const bodyText = await readBody(req);
    let body;
    try { body = JSON.parse(bodyText); } catch { throw new Error("Invalid JSON body."); }
    const requests = Array.isArray(body) ? body : [body];
    console.log(`[${reqId}] ${requests.map(r => r.method).join(", ")}`);
    const results = await Promise.all(requests.map(handleRpc));
    const responses = results.filter(Boolean);
    res.writeHead(200, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify(Array.isArray(body) ? responses : (responses[0] ?? {})));
  } catch (e) {
    console.error(`[${reqId}] error:`, e.message);
    res.writeHead(400, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Ramping It Up Studio MCP (remote) listening on :${PORT}`);
  console.log(`Tools exposed: ${REMOTE_TOOLS.map(t => t.name).join(", ")}`);
  console.log(`Auth required: Bearer token on every request to /mcp.`);
});
