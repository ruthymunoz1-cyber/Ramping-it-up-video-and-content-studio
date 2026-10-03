#!/usr/bin/env node
/* ============================================================
 * Ramping It Up Studio — MCP server (stdio transport)
 * ============================================================
 * For local MCP clients that spawn this as a subprocess — Claude Desktop,
 * Claude Code, Cursor. Exposes the studio's generation pipeline (image,
 * video, lip sync, music, upscale, voice) as MCP tools so any MCP client
 * can generate media through your own fal.ai/ElevenLabs account. Zero npm
 * dependencies: plain Node 18+.
 *
 * For a REMOTE client that connects over a URL instead of spawning a local
 * process (Manus and similar hosted agents), use http-server.mjs instead —
 * see mcp/README.md.
 *
 * Setup (see mcp/README.md):
 *   claude mcp add ramping-it-up -e FAL_KEY=<your-key> -- node <repo>/mcp/server.mjs
 * ============================================================ */

import { createInterface } from "node:readline";
import { TOOLS, HANDLERS } from "./lib.mjs";

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");

const rl = createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  line = line.trim();
  if (!line) return;
  let req;
  try { req = JSON.parse(line); } catch { return; }
  const { id, method, params } = req;

  try {
    if (method === "initialize") {
      send({ jsonrpc: "2.0", id, result: {
        protocolVersion: params?.protocolVersion || "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "ramping-it-up-studio", version: "1.1.0" },
      }});
    } else if (method === "notifications/initialized") {
      // notification — no response
    } else if (method === "tools/list") {
      send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    } else if (method === "tools/call") {
      const { name, arguments: args } = params;
      const handler = HANDLERS[name];
      if (!handler) throw new Error(`Unknown tool: ${name}`);
      const text = await handler(args || {});
      send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }] } });
    } else if (id != null) {
      send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (e) {
    if (id != null) {
      send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: "Error: " + e.message }], isError: true } });
    }
  }
});
