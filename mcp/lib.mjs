/* ============================================================
 * Ramping It Up Studio — MCP tool logic (shared by both transports)
 * ============================================================
 * stdio transport (server.mjs) is for local MCP clients — Claude Desktop,
 * Claude Code, Cursor. HTTP transport (http-server.mjs) is for remote
 * clients that connect over a URL instead of spawning a local process —
 * Manus and similar hosted agents. Both import this file so the tool
 * behavior (and the bill it runs up) is identical either way.
 * ============================================================ */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const FAL_KEY = process.env.FAL_KEY || "";
const QUEUE_BASE = process.env.FAL_QUEUE_BASE || "https://queue.fal.run";
const POLL_MS = 2500;
const TIMEOUT_MS = 15 * 60 * 1000;

const ELEVEN_KEY = process.env.ELEVEN_KEY || "";
const ELEVEN_BASE = process.env.ELEVEN_API_BASE || "https://api.elevenlabs.io";
const AUDIO_OUTPUT_DIR = process.env.RIU_MCP_OUTPUT_DIR || path.join(homedir(), "Documents", "Ramping It Up Studio", "mcp-audio");

/* The page's one fixed signature music file, hosted as a static asset by
 * http-server.mjs (see mcp/assets/signature-music.mp3) so fal.ai's servers
 * can fetch it for mix_audio. Never generated, never swapped per video. */
const DEFAULT_SIGNATURE_MUSIC_URL = process.env.SIGNATURE_MUSIC_URL || "https://ramping-it-up-mcp.onrender.com/assets/signature-music.mp3";

/* Estimated from the file's size and its 320kbps bitrate — this environment
 * has no ffprobe to measure it exactly. Override via env var if this track
 * is ever replaced, or if the estimate turns out to be off once heard. Used
 * to loop the track rather than let it go silent partway through a longer
 * narration — narration/music start together at 0 and both need to cover
 * the full runtime. LOOP_TRIM_SEC shaves a touch off each loop so sequential
 * repeats never overlap even if the real file is a little longer than estimated. */
const SIGNATURE_MUSIC_DURATION_SEC = Number(process.env.SIGNATURE_MUSIC_DURATION_SEC) || 66;
const LOOP_TRIM_SEC = 0.3;

function buildMusicTrack(musicUrl, totalSec) {
  // fal.ai's compose tool requires an explicit `duration` on every keyframe
  // (confirmed via its own validation error: "tracks[2].keyframes[0].duration
  // — Field required") — there is no "play once, let it run" option.
  if (!totalSec) throw new Error("narration_duration is required — fal.ai's compose tool needs an explicit duration on every keyframe, including music.");
  const loopLenMs = Math.round((SIGNATURE_MUSIC_DURATION_SEC - LOOP_TRIM_SEC) * 1000);
  const totalMs = Math.round(totalSec * 1000);
  const keyframes = [];
  let t = 0;
  while (t < totalMs) {
    keyframes.push({ url: musicUrl, timestamp: t, duration: Math.min(loopLenMs, totalMs - t) });
    t += loopLenMs;
  }
  return { id: "music", type: "audio", keyframes };
}

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

/* ---------------- ElevenLabs client ----------------
 * Unlike fal, ElevenLabs returns raw audio bytes rather than a hosted URL,
 * so generated narration is saved to a local folder and the file path is
 * returned to the MCP client. Only meaningful for the stdio transport —
 * see the note in http-server.mjs about why these tools are omitted there. */
function requireElevenKey() {
  if (!ELEVEN_KEY) throw new Error("ELEVEN_KEY is not set. Add it to the MCP server env (see mcp/README.md).");
}

export async function elVoices() {
  requireElevenKey();
  const res = await fetch(`${ELEVEN_BASE}/v1/voices`, { headers: { "xi-api-key": ELEVEN_KEY } });
  if (!res.ok) throw new Error(`ElevenLabs voices failed (${res.status}): ${await res.text()}`);
  return (await res.json()).voices || [];
}

export async function resolveVoiceId(nameOrId) {
  /* A raw ElevenLabs voice_id is a 20-char alphanumeric string. If we already
   * have one, skip the /v1/voices list call entirely — some restricted API
   * keys (no separate "Voices" read permission in their scopes) can't read
   * that endpoint at all, which would otherwise break narration even when
   * the exact voice to use is already known. */
  if (/^[A-Za-z0-9]{20}$/.test(String(nameOrId))) {
    return { voice_id: nameOrId, name: nameOrId };
  }
  const voices = await elVoices();
  const byName = voices.find(v => v.name.toLowerCase() === String(nameOrId).toLowerCase());
  if (byName) return byName;
  const names = voices.map(v => `${v.name} (${v.voice_id})`).join(", ");
  throw new Error(`No voice matching "${nameOrId}". Available voices: ${names || "(none — check your ElevenLabs account)"}`);
}

export async function elSpeak(voiceId, text, modelId = "eleven_multilingual_v2") {
  requireElevenKey();
  const res = await fetch(`${ELEVEN_BASE}/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": ELEVEN_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: modelId, voice_settings: { stability: 0.5, similarity_boost: 0.8 } }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS failed (${res.status}): ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function elClone(name, filePaths, description = "") {
  requireElevenKey();
  const form = new FormData();
  form.append("name", name);
  if (description) form.append("description", description);
  for (const p of filePaths) {
    const data = await readFile(p);
    form.append("files", new Blob([data]), path.basename(p));
  }
  const res = await fetch(`${ELEVEN_BASE}/v1/voices/add`, { method: "POST", headers: { "xi-api-key": ELEVEN_KEY }, body: form });
  if (!res.ok) throw new Error(`Voice clone failed (${res.status}): ${await res.text()}`);
  return await res.json();
}

async function saveAudioFile(buffer, stem) {
  await mkdir(AUDIO_OUTPUT_DIR, { recursive: true });
  const safe = stem.replace(/[^\w\- ]/g, "").trim().slice(0, 60) || "narration";
  const file = path.join(AUDIO_OUTPUT_DIR, `${Date.now()}-${safe}.mp3`);
  await writeFile(file, buffer);
  return file;
}

/* Renders the verse reference/text/caption as a clean typographic image via
 * GPT-image-2 (the model already used here for text-heavy graphics, since
 * video models render legible text unreliably — see workflow rule #6: the
 * verse card is always a separate graphic layer, never asked of a video
 * model). Used by finalize_video so the whole assembly is one tool call. */
async function renderVerseCard({ reference, verseText, caption, aspectRatio = "9:16" }) {
  const prompt =
    `A clean, elegant devotional verse card graphic for a social video. Soft neutral background ` +
    `(warm cream or deep navy — no photo, no people, no clutter). Large, perfectly legible serif ` +
    `typography, centered, top to bottom: 1) the reference "${reference}" in smaller gold letters at ` +
    `the top. 2) the verse text "${verseText}" as the largest, most prominent text, wrapped naturally, ` +
    `high contrast against the background.` +
    (caption ? ` 3) the line "${caption}" in smaller italic text near the bottom, softer color.` : "") +
    ` No extra decoration, no watermark, no stock-photo elements — pure clean typography on a simple background.`;
  const url = extractMedia(await falRun("fal-ai/gpt-image-2", { prompt, aspect_ratio: aspectRatio, num_images: 1 }));
  if (!url) throw new Error("No verse card image URL in the result.");
  return url;
}

/* ---------------- tool definitions ---------------- */
const MELANIN_LIGHTING =
  "skin properly exposed and color-graded for deep melanin-rich skin — luminous, even, " +
  "warm golden rim light, true-to-life undertones, no ashen or grey cast";

export const TOOLS = [
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
        model: { type: "string", description: "Default fal-ai/kling-video/v3/pro/image-to-video. Use bytedance/seedance-2.5/image-to-video for the flagship model (~$0.473/s, native 30s generations, up to 50 multimodal references), fal-ai/kling-video/v3/4k/image-to-video for native 4K (~$0.42/s), bytedance/seedance-2.0/fast/image-to-video for cheap drafts (~$0.24/s)." },
      },
      required: ["image_url", "prompt"],
    },
  },
  {
    name: "generate_video",
    description: "Text→video with no start image (e.g. Seedance 2.5 or Hailuo). Use animate_image instead when you already have a still to start from — " +
      "it's usually cheaper and gives more control than generating video from text alone. ALWAYS quote the estimated cost before calling.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Full scene + motion description." },
        duration: { type: "integer", description: "Seconds. Default 5 (Hailuo); Seedance 2.5 natively generates up to 30s." },
        model: { type: "string", description: "Default fal-ai/minimax/hailuo-2.3/standard/text-to-video (~$0.047/s, cheap B-roll). Use bytedance/seedance-2.5/text-to-video for the flagship model (~$0.473/s)." },
      },
      required: ["prompt"],
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
  {
    name: "list_voices",
    description: "List available ElevenLabs voices (built-in library + your cloned voices) with their names and voice_ids. " +
      "Call this before generate_narration if you don't already know which voice to use.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "generate_narration",
    description: "Generate spoken narration with ElevenLabs. Billed to the user's ElevenLabs plan/credits — this is the user's own " +
      "voice account, not a managed/opaque service, so the voice they chose in list_voices is exactly what gets used. " +
      "Over stdio (local client) this saves an MP3 to local disk and returns its path. Over the remote/HTTP transport " +
      "(no local disk to write to) it returns the audio directly as a base64 data URI in the response instead.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The script to speak." },
        voice: { type: "string", description: "A voice name or voice_id from list_voices. Case-insensitive name match." },
        model: { type: "string", description: "ElevenLabs model id. Default eleven_multilingual_v2 (30+ languages)." },
      },
      required: ["text", "voice"],
    },
  },
  {
    name: "merge_videos",
    description: "Concatenate 2+ video clips into one video, in order, using fal.ai's dedicated merge-videos tool (free — $0/compute-sec). " +
      "Simpler and more reliable than finalize_video's all-in-one assembly (which has a known issue combining video with other tracks) — " +
      "use this on its own when you just need the clips joined into one file, e.g. for manual final assembly. " +
      "If clips come from different generation batches/models, pass target_fps to force a uniform frame rate — mismatched source clips " +
      "can otherwise produce a merged file with multiple embedded video tracks (confirmed root cause of finalize_video's known issue: " +
      "fal.ai's own compose tool then rejects that file with \"Multiple video tracks are not supported\", even on a single video_url). " +
      "Returns the merged video's hosted URL.",
    inputSchema: {
      type: "object",
      properties: {
        video_urls: { type: "array", items: { type: "string" }, description: "Clip URLs in the order they should play." },
        target_fps: { type: "number", description: "Force all clips to this frame rate before merging (e.g. 30). Recommended whenever clips come from different generations — without it, mismatched source frame rates can produce a file with multiple video tracks that fal.ai's compose tool then rejects." },
      },
      required: ["video_urls"],
    },
  },
  {
    name: "mix_audio",
    description: "Overlay narration with the page's fixed signature music into one finished audio file, using fal.ai's ffmpeg compose tool " +
      "(~$0.0002/sec — a 30s track is about $0.006). music_url defaults to the page's permanent signature-music.mp3 — never pass a " +
      "different music_url for this page, and never call generate_music instead; this tool exists specifically so that's never necessary. " +
      "narration_duration is REQUIRED — fal.ai's compose tool needs an explicit duration on every keyframe, with no \"play once\" option, " +
      "and it's also used to loop the music track to cover the whole thing (the signature track is roughly 66s and narration often runs " +
      "longer). narration_url must be a URL fal.ai's servers can fetch — use the temporary URL generate_narration returns over the " +
      "remote transport, not the base64 data URI. Returns the merged audio's hosted URL.",
    inputSchema: {
      type: "object",
      properties: {
        narration_url: { type: "string", description: "URL to the narration audio (the temporary URL from generate_narration's remote response)." },
        narration_duration: { type: "number", description: "How long the narration actually runs, in seconds. Required — fal.ai's compose tool rejects a request without an explicit duration on every keyframe." },
        music_url: { type: "string", description: "Optional override. Leave unset — it defaults to the page's one fixed signature music file." },
      },
      required: ["narration_url", "narration_duration"],
    },
  },
  {
    name: "finalize_video",
    description: "Assemble ONE finished video for this page: the scene (a single clip, OR a sequence of clips stitched end-to-end — see " +
      "video_clips) plays first, THEN an auto-generated verse card appears and holds while narration (and the fixed signature music) " +
      "continue — the card is sequenced AFTER the video ends, never overlaid on top of it from the start. Merged via fal.ai's ffmpeg " +
      "compose tool (~$0.0002/sec — a 30s video is about $0.006, on top of whatever the clips/narration already cost). " +
      "This page's format is typically ~45-50s of continuous video motion, then the verse card for the remainder of a ~60s+ narration — " +
      "that usually means several stitched beats (video_clips), not one short clip. " +
      "narration_duration is REQUIRED (not optional) — fal.ai's compose tool rejects a request without an explicit duration on every " +
      "keyframe (video, verse card, narration, AND music all need one — confirmed via the API's own validation error). It's also used " +
      "to hold the card for the right length and loop the music to cover the full runtime. " +
      "duration is likewise required when using video_url (a single clip) — each item in video_clips already requires its own duration. " +
      "Use video_clips instead of video_url whenever the scene has more than one distinct beat/gesture (e.g. she sits, then rises and " +
      "crosses the room, then hands over the cup — each of those is its own still + its own short animation, nailed separately) — a " +
      "single clip can only carry ONE clean gesture convincingly. With 2+ clips they're concatenated into one video first via fal.ai's " +
      "merge-videos tool (free — $0/compute-sec), then that single merged video is composed with the verse card/narration/music — " +
      "compose itself can't take more than one video source directly. " +
      "Generates the verse card automatically from verse_reference/verse_text/caption (skip generation by passing verse_card_url instead). " +
      "music_url always defaults to the page's one fixed signature track — never pass a different one, and never call generate_music. " +
      "IMPORTANT: have the page owner glance at the very first one of these before trusting it for a full batch — exact verse-card " +
      "positioning and multi-clip stitching on fal's compose tool haven't been visually confirmed yet.",
    inputSchema: {
      type: "object",
      properties: {
        video_url: { type: "string", description: "A single approved animated scene clip URL. Use this OR video_clips, not both." },
        video_clips: {
          type: "array",
          description: "A sequence of 2+ clips to stitch end-to-end, in order, for a multi-beat scene. Use this OR video_url, not both.",
          items: {
            type: "object",
            properties: {
              url: { type: "string" },
              duration: { type: "number", description: "This clip's length in seconds (the duration you passed to animate_image/generate_video) — required so the next clip starts at the right time." },
            },
            required: ["url", "duration"],
          },
        },
        narration_url: { type: "string", description: "Temporary narration URL from generate_narration's remote response." },
        verse_reference: { type: "string", description: "e.g. \"Isaiah 41:10\". Required unless verse_card_url is given." },
        verse_text: { type: "string", description: "The verse text to render on the card. Required unless verse_card_url is given." },
        caption: { type: "string", description: "Optional short devotional line under the verse." },
        verse_card_url: { type: "string", description: "Optional — use a pre-made verse card image instead of auto-generating one." },
        music_url: { type: "string", description: "Optional override. Leave unset — defaults to the page's one fixed signature music." },
        duration: { type: "number", description: "Required when using video_url: that single clip's length in seconds. Not needed with video_clips (each clip has its own duration)." },
        narration_duration: { type: "number", description: "How long the narration actually runs, in seconds. Required — fal.ai's compose tool rejects a request without an explicit duration on every keyframe (video, verse card, narration, and music all need one)." },
        aspect_ratio: { type: "string", description: "Verse card aspect ratio. Default 9:16 (reels)." },
      },
      required: ["narration_url", "narration_duration"],
    },
  },
  {
    name: "clone_voice",
    description: "Clone a voice from 1-3 local audio samples (each 30s-3min, clean recording, no background noise/music). " +
      "Creates a new ElevenLabs voice usable immediately with generate_narration. Requires an ElevenLabs plan that supports cloning. " +
      "Local-disk tool, stdio transport only — it reads sample files from the local machine, which a remote client has no access to.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name for the new voice." },
        sample_paths: { type: "array", items: { type: "string" }, description: "Absolute local file paths to the audio samples." },
        description: { type: "string" },
      },
      required: ["name", "sample_paths"],
    },
  },
];

/* Tools that read/write the local filesystem in a way that's fundamentally
 * tied to "this machine's disk" — meaningless (and unsafe to even attempt)
 * from a remote HTTP client. Only clone_voice qualifies: it reads local
 * sample files with no equivalent remote input. generate_narration used to
 * be in this set too, but http-server.mjs now gives it a remote-safe
 * handler (base64 audio in the response) instead of excluding it — a
 * cloud agent still needs to generate narration through the user's own
 * ElevenLabs account, not a managed voice service with no cost visibility. */
export const LOCAL_ONLY_TOOLS = new Set(["clone_voice"]);

/* ---------------- tool implementations ---------------- */
export const HANDLERS = {
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
  async generate_video(a) {
    const model = a.model || "fal-ai/minimax/hailuo-2.3/standard/text-to-video";
    const input = { prompt: a.prompt };
    if (a.duration) input.duration = a.duration;
    const url = extractMedia(await falRun(model, input));
    if (!url) throw new Error("No video URL in the result.");
    return `Video generated with ${model}:\n${url}`;
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
  async list_voices() {
    const voices = await elVoices();
    if (!voices.length) return "No voices found on this ElevenLabs account.";
    return voices.map(v => `${v.name} — voice_id: ${v.voice_id}${v.category ? ` (${v.category})` : ""}`).join("\n");
  },
  async generate_narration(a) {
    const voice = await resolveVoiceId(a.voice);
    const buffer = await elSpeak(voice.voice_id, a.text, a.model || "eleven_multilingual_v2");
    const file = await saveAudioFile(buffer, a.text.slice(0, 40));
    return `Narration generated with voice "${voice.name}":\n${file}`;
  },
  async merge_videos(a) {
    if (!Array.isArray(a.video_urls) || a.video_urls.length < 2) throw new Error("video_urls must be an array of 2 or more clip URLs.");
    const input = { video_urls: a.video_urls };
    if (a.target_fps) input.target_fps = a.target_fps;
    const result = await falRun("fal-ai/ffmpeg-api/merge-videos", input);
    const url = extractMedia(result);
    if (!url) throw new Error("No merged video URL in the result: " + JSON.stringify(result));
    return `Merged video (${a.video_urls.length} clips):\n${url}`;
  },
  async mix_audio(a) {
    // fal.ai's compose tool requires an explicit duration on every keyframe
    // ("tracks[N].keyframes[0].duration — Field required") — fail fast,
    // before any paid call, rather than let an invalid request burn a job.
    if (!a.narration_duration) throw new Error("narration_duration is required (fal.ai's compose tool needs an explicit duration on every keyframe, including narration and music).");
    const musicUrl = a.music_url || DEFAULT_SIGNATURE_MUSIC_URL;
    const narrationMs = Math.round(a.narration_duration * 1000);
    const result = await falRun("fal-ai/ffmpeg-api/compose", {
      tracks: [
        { id: "narration", type: "audio", keyframes: [{ url: a.narration_url, timestamp: 0, duration: narrationMs }] },
        buildMusicTrack(musicUrl, a.narration_duration),
      ],
    });
    const url = extractMedia(result);
    if (!url) throw new Error("No merged audio URL in the result: " + JSON.stringify(result));
    return `Mixed audio (narration + signature music):\n${url}`;
  },
  async finalize_video(a) {
    if (!a.narration_duration) throw new Error("narration_duration is required (fal.ai's compose tool needs an explicit duration on every keyframe — video, verse card, narration, and music all need one).");
    if (!a.video_url && !(Array.isArray(a.video_clips) && a.video_clips.length)) {
      throw new Error("Provide either video_url (single shot, with duration) or video_clips (a sequence of shots, each with duration).");
    }
    if (a.video_url && !a.duration) throw new Error("duration is required when using video_url (the clip's length in seconds).");

    const musicUrl = a.music_url || DEFAULT_SIGNATURE_MUSIC_URL;
    const verseCardUrl = a.verse_card_url || await renderVerseCard({
      reference: a.verse_reference, verseText: a.verse_text, caption: a.caption, aspectRatio: a.aspect_ratio || "9:16",
    });

    /* fal.ai's compose tool rejects multiple keyframes on a single "video"
     * track ("Multiple video tracks are not supported" — confirmed from its
     * own error). A multi-clip scene has to be concatenated into ONE video
     * first via the dedicated merge-videos tool, then composed as a single
     * video keyframe, same as any other video_url. */
    let videoUrl, videoEndSec;
    if (Array.isArray(a.video_clips) && a.video_clips.length) {
      videoEndSec = a.video_clips.reduce((sum, c) => sum + c.duration, 0);
      if (a.video_clips.length === 1) {
        videoUrl = a.video_clips[0].url;
      } else {
        const mergeResult = await falRun("fal-ai/ffmpeg-api/merge-videos", { video_urls: a.video_clips.map(c => c.url) });
        videoUrl = extractMedia(mergeResult);
        if (!videoUrl) throw new Error("No merged video URL in the result: " + JSON.stringify(mergeResult));
      }
    } else {
      videoUrl = a.video_url;
      videoEndSec = a.duration;
    }
    const videoKeyframes = [{ url: videoUrl, timestamp: 0, duration: Math.round(videoEndSec * 1000) }];

    /* The verse card appears AFTER the video's motion ends, not overlaid on
     * top of it from the start — matches the page's actual format: the clip
     * plays through, then the card holds while narration keeps going. */
    const verseCardStartMs = Math.round(videoEndSec * 1000);
    const holdSec = Math.max(0, a.narration_duration - videoEndSec);
    const verseCardKeyframe = { url: verseCardUrl, timestamp: verseCardStartMs, duration: Math.round(holdSec * 1000) };

    const tracks = [
      { id: "video", type: "video", keyframes: videoKeyframes },
      { id: "verse_card", type: "image", keyframes: [verseCardKeyframe] },
      { id: "narration", type: "audio", keyframes: [{ url: a.narration_url, timestamp: 0, duration: Math.round(a.narration_duration * 1000) }] },
      buildMusicTrack(musicUrl, a.narration_duration),
    ];
    const result = await falRun("fal-ai/ffmpeg-api/compose", { tracks });
    const url = extractMedia(result);
    if (!url) throw new Error("No final video URL in the result: " + JSON.stringify(result));
    const sceneDesc = (a.video_clips?.length > 1) ? `${a.video_clips.length} clips merged` : "scene";
    return `Final video (${sceneDesc} + verse card + narration + signature music):\n${url}\nVerse card image used: ${verseCardUrl}`;
  },
  async clone_voice(a) {
    const result = await elClone(a.name, a.sample_paths, a.description || "");
    return `Voice cloned: "${a.name}" — voice_id: ${result.voice_id}\nUse this voice_id (or the name) with generate_narration.`;
  },
};
