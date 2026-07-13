#!/usr/bin/env node
/* ============================================================
 * Ramping It Up Studio — MCP server
 * ============================================================
 * A Higgsfield-style MCP, but yours: exposes the studio's generation
 * pipeline (image, video, lip sync, music, upscale) as MCP tools so any
 * MCP client — Claude Desktop, Claude Code, Cursor — can generate media
 * through your own fal.ai account. Zero npm dependencies: plain Node 18+.
 *
 * Setup (see mcp/README.md):
 *   claude mcp add ramping-it-up -e FAL_KEY=<your-key> -- node <repo>/mcp/server.mjs
 * ============================================================ */

import { createInterface } from "node:readline";

const FAL_KEY = process.env.FAL_KEY || "";
const QUEUE_BASE = process.env.FAL_QUEUE_BASE || "https://queue.fal.run";
const POLL_MS = 2500;
const TIMEOUT_MS = 15 * 60 * 1000;

/* ---------------- fal queue client ---------------- */
async function falRun(modelId, input) {
  if (!FAL_KEY) throw new Error("FAL_KEY is not set. Add it to the MCP server env (see mcp/README.md).");
  const headers = { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" };
  const submit = await fetch(`${QUEUE_BASE}/${modelId}`, { method: "POST", headers, body: JSON.stringify(input) });
  if (!submit.ok) throw new Error(`fal.ai submit failed (${submit.status}): ${await submit.text()}`);
  const job = await submit.json();
  if (!job.status_url || !job.response_url) return job; // synchronous endpoints

  const started = Date.now();
  while (true) {
    await new Promise(r => setTimeout(r, POLL_MS));
    const s = await (await fetch(job.status_url, { headers })).json();
    if (s.status === "COMPLETED") break;
    if (s.status === "FAILED" || s.status === "ERROR") throw new Error("fal.ai job failed: " + JSON.stringify(s));
    if (Date.now() - started > TIMEOUT_MS) throw new Error("fal.ai job timed out after 15 minutes.");
  }
  const res = await fetch(job.response_url, { headers });
  if (!res.ok) throw new Error(`fal.ai result fetch failed (${res.status}): ${await res.text()}`);
  return await res.json();
}

function extractMedia(r) {
  return r?.video?.url || r?.image?.url || r?.images?.[0]?.url || r?.videos?.[0]?.url ||
         r?.audio?.url || r?.audio_file?.url || r?.audio_url || r?.output?.url || r?.url || null;
}

/* ---------------- tool definitions ---------------- */
const MELANIN_LIGHTING =
  "skin properly exposed and color-graded for deep melanin-rich skin — luminous, even, " +
  "warm golden rim light, true-to-life undertones, no ashen or grey cast";

const TOOLS = [
  {
    name: "generate_image",
    description: "Generate an image with the studio's current best model (Nano Banana Pro by default, ~$0.04). " +
      "For melanin-rich subjects the studio's lighting guidance is applied automatically when apply_melanin_lighting is true. " +
      "Returns the hosted image URL (download it promptly — provider URLs expire after a few days).",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Full scene description in natural language." },
        model: { type: "string", description: "fal model id. Default fal-ai/nano-banana-pro. Use fal-ai/gpt-image-2 for text-heavy thumbnails." },
        aspect_ratio: { type: "string", description: "e.g. 16:9, 9:16, 1:1. Default 16:9." },
        reference_image_urls: { type: "array", items: { type: "string" }, description: "1-2 reference images for exact character likeness (switches to the /edit model automatically)." },
        apply_melanin_lighting: { type: "boolean", description: "Append the studio's deep-skin lighting guidance." },
        seed: { type: "integer" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "animate_image",
    description: "Animate a still image into a video clip (image→video). Default Kling v3 Pro (~$0.168/sec — a 5s clip is ~$0.84). " +
      "ALWAYS tell the user the estimated cost before calling. Returns the hosted video URL.",
    inputSchema: {
      type: "object",
      properties: {
        image_url: { type: "string", description: "URL of the start image (from generate_image or elsewhere)." },
        prompt: { type: "string", description: "Motion prompt — what HAPPENS (not what it looks like)." },
        duration: { type: "integer", description: "Seconds, 3-10. Default 5." },
        model: { type: "string", description: "Default fal-ai/kling-video/v3/pro/image-to-video. Use fal-ai/kling-video/v3/4k/image-to-video for native 4K (~$0.42/s), bytedance/seedance-2.0/fast/image-to-video for cheap drafts (~$0.24/s)." },
      },
      required: ["image_url", "prompt"],
    },
  },
  {
    name: "lip_sync",
    description: "Sync a voice audio track to a face video (~$0.06/sec). Returns the hosted video URL.",
    inputSchema: {
      type: "object",
      properties: {
        video_url: { type: "string" },
        audio_url: { type: "string" },
      },
      required: ["video_url", "audio_url"],
    },
  },
  {
    name: "generate_music",
    description: "Generate a music track (~$0.03-0.10). Stable Audio for instrumentals/scores; pass lyrics to use MiniMax Music for full songs.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Style, mood, tempo, instrumentation." },
        lyrics: { type: "string", description: "Optional — providing lyrics switches to the song model." },
      },
      required: ["prompt"],
    },
  },
  {
    name: "upscale_video",
    description: "Clean, sharpen and upscale a video with Topaz (~$0.02/sec at 1080p, ~$0.08/sec above). Quote cost first.",
    inputSchema: {
      type: "object",
      properties: { video_url: { type: "string" } },
      required: ["video_url"],
    },
  },
];

/* ---------------- tool implementations ---------------- */
const HANDLERS = {
  async generate_image(a) {
    let model = a.model || "fal-ai/nano-banana-pro";
    const input = { prompt: a.prompt, aspect_ratio: a.aspect_ratio || "16:9", num_images: 1 };
    if (a.apply_melanin_lighting) input.prompt += ". " + MELANIN_LIGHTING;
    if (a.seed != null) input.seed = a.seed;
    if (a.reference_image_urls?.length) {
      input.image_urls = a.reference_image_urls.slice(0, 2);
      if (!/edit/.test(model)) model = "fal-ai/nano-banana-pro/edit";
    }
    const url = extractMedia(await falRun(model, input));
    if (!url) throw new Error("No image URL in the result.");
    return `Image generated with ${model}:\n${url}\n(Provider URLs expire after a few days — download keepers.)`;
  },
  async animate_image(a) {
    const model = a.model || "fal-ai/kling-video/v3/pro/image-to-video";
    const url = extractMedia(await falRun(model, {
      prompt: a.prompt, image_url: a.image_url, duration: a.duration || 5,
    }));
    if (!url) throw new Error("No video URL in the result.");
    return `Video generated with ${model} (${a.duration || 5}s):\n${url}`;
  },
  async lip_sync(a) {
    const url = extractMedia(await falRun("fal-ai/sync-lipsync", { video_url: a.video_url, audio_url: a.audio_url }));
    if (!url) throw new Error("No video URL in the result.");
    return `Lip-synced video:\n${url}`;
  },
  async generate_music(a) {
    const model = a.lyrics ? "fal-ai/minimax-music" : "fal-ai/stable-audio";
    const input = a.lyrics ? { prompt: a.prompt, lyrics: a.lyrics } : { prompt: a.prompt };
    const url = extractMedia(await falRun(model, input));
    if (!url) throw new Error("No audio URL in the result.");
    return `Music generated with ${model}:\n${url}`;
  },
  async upscale_video(a) {
    const url = extractMedia(await falRun("fal-ai/topaz/upscale/video", { video_url: a.video_url }));
    if (!url) throw new Error("No video URL in the result.");
    return `Upscaled video:\n${url}`;
  },
};

/* ---------------- minimal MCP (JSON-RPC over stdio) ---------------- */
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
        serverInfo: { name: "ramping-it-up-studio", version: "1.0.0" },
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
