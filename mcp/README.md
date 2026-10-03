# 🔌 Ramping It Up Studio — MCP server

Your own Higgsfield-style MCP: it lets Claude (Desktop, Code, or any MCP
client) generate images, video, music and lip sync through **your** fal.ai
account — same models as the studio app, no middleman, no markup.

Once connected you can just say things like:
> "Generate an image of my host explaining fractions, then animate it for 5 seconds."

and Claude calls your studio's tools directly.

Two ways to connect, depending on where the AI runs:

- **Local client** (Claude Desktop, Claude Code, Cursor) → `server.mjs`, stdio transport, spawned as a subprocess on your own machine.
- **Remote/cloud agent** (Manus or similar — anything that connects over a URL instead of running on your computer) → `http-server.mjs`, deployed somewhere with a public address. See "Setup — remote agents (Manus)" below.

## Tools exposed

| Tool | What it does | Cost guide | Transport |
|---|---|---|---|
| `generate_image` | Nano Banana Pro / GPT Image 2, with optional character reference images and the studio's melanin-true lighting flag | ~$0.04 | both |
| `animate_image` | Image → video. Default Kling v3 Pro; pass `model: "bytedance/seedance-2.5/image-to-video"` for the flagship Seedance 2.5 | ~$0.17–0.47/s | both |
| `generate_video` | Text → video, no start image. Default Hailuo 2.3 (cheap B-roll); pass `model: "bytedance/seedance-2.5/text-to-video"` for Seedance 2.5 | ~$0.05–0.47/s | both |
| `lip_sync` | Voice audio + face video → talking clip | ~$0.06/s | both |
| `generate_music` | Scores & full songs (lyrics switch to the song model) | ~$0.03–0.10 | both |
| `upscale_video` | Topaz clean/sharpen/upscale | ~$0.02/s | both |
| `list_voices` | List your ElevenLabs voices (built-in + cloned) with their voice_ids | free | both |
| `generate_narration` | Text → speech, saved as a local MP3 | your ElevenLabs plan | **stdio only** |
| `clone_voice` | Clone a new voice from 1–3 local audio samples | your ElevenLabs plan | **stdio only** |

The last two write to local disk, which only means something for a client
running on your own machine — the remote/HTTP transport doesn't expose them
at all (a cloud agent has no "local disk" of yours to write to).

ElevenLabs tools need a plan tier that supports the feature (voice cloning
requires Starter or above). Generated narration files are saved to
`~/Documents/Ramping It Up Studio/mcp-audio/` by default — override with the
`RIU_MCP_OUTPUT_DIR` env var.

## Setup — Claude Code (one command)

```bash
claude mcp add ramping-it-up -e FAL_KEY=YOUR-FAL-KEY -e ELEVEN_KEY=YOUR-ELEVENLABS-KEY -- node /full/path/to/this/repo/mcp/server.mjs
```

(Omit `-e ELEVEN_KEY=...` if you only want the fal.ai tools — the ElevenLabs
tools will just report they need a key when called.)

## Setup — Claude Desktop

Add to your `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "ramping-it-up": {
      "command": "node",
      "args": ["/full/path/to/this/repo/mcp/server.mjs"],
      "env": { "FAL_KEY": "YOUR-FAL-KEY", "ELEVEN_KEY": "YOUR-ELEVENLABS-KEY" }
    }
  }
}
```

Requirements: [Node.js](https://nodejs.org) 18+ installed. No npm install
needed — the server has zero dependencies.

## Setup — remote agents (Manus)

Manus (and similar hosted/cloud agents) can't spawn a process on your
computer — they need a URL they can reach over the network. `http-server.mjs`
is that: the same tools, same fal.ai billing, running as a small HTTP server
instead of a local subprocess.

**1. Deploy it somewhere with a public URL.** Any Node 18+ host works — it's
zero-dependency, so there's no `npm install` step. [Render](https://render.com)'s
free web service tier is the simplest: connect this GitHub repo, set the
root directory to `mcp`, start command `node http-server.mjs`, and add the
environment variables below. Fly.io and Railway work the same way. Running
it on your own machine only works if that machine stays on and reachable
the whole time Manus might call it — fine for testing, not for production.

**2. Set these environment variables on the host:**

| Variable | Value |
|---|---|
| `FAL_KEY` | your fal.ai API key |
| `ELEVEN_KEY` | your ElevenLabs key (optional — only `list_voices` uses it remotely) |
| `MCP_AUTH_TOKEN` | a long random string you generate yourself — **this is the password that protects your fal.ai account from anyone who finds the URL.** The server refuses to start without it. Generate one with `node -e "console.log(require('crypto').randomUUID())"` or any password generator. |

**3. In Manus:** Settings → Connectors → Add Custom MCP →

- **Transport**: HTTP
- **Server URL**: `https://your-deployed-url/mcp`
- **Authentication**: Bearer token — paste the same `MCP_AUTH_TOKEN` value from step 2

**4. Verify it's live** by opening `https://your-deployed-url/health` in a
browser — it should return `{"ok":true,...}` with a list of tool names. If
it doesn't load, the deploy failed or the env vars are missing; check the
host's logs before touching the Manus side.

Once connected, tell Manus explicitly which model to use if you want
Seedance 2.5 specifically — e.g. "animate this with
`bytedance/seedance-2.5/image-to-video`" — otherwise it'll use whichever
tool default is cheaper (Kling v3 Pro for image→video, Hailuo 2.3 for
text→video).

## Notes

- Costs are billed to your fal.ai account; the `animate_image`,
  `generate_video` and `upscale_video` tool descriptions instruct the model
  to quote cost first.
- Generated URLs are hosted by fal and expire after a few days — download
  anything you want to keep.
- Keep your `FAL_KEY`, `ELEVEN_KEY`, and `MCP_AUTH_TOKEN` out of git: they
  live only in your MCP client config or host environment variables, never
  committed to this repo.
