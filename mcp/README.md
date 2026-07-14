# 🔌 Ramping It Up Studio — MCP server

Your own Higgsfield-style MCP: it lets Claude (Desktop, Code, or any MCP
client) generate images, video, music and lip sync through **your** fal.ai
account — same models as the studio app, no middleman, no markup.

Once connected you can just say things like:
> "Generate an image of my host explaining fractions, then animate it for 5 seconds."

and Claude calls your studio's tools directly.

## Tools exposed

| Tool | What it does | Cost guide |
|---|---|---|
| `generate_image` | Nano Banana Pro / GPT Image 2, with optional character reference images and the studio's melanin-true lighting flag | ~$0.04 |
| `animate_image` | Image → video (Kling v3 Pro default, 4K and cheap-draft options) | ~$0.84 / 5s |
| `lip_sync` | Voice audio + face video → talking clip | ~$0.06/s |
| `generate_music` | Scores & full songs (lyrics switch to the song model) | ~$0.03–0.10 |
| `upscale_video` | Topaz clean/sharpen/upscale | ~$0.02/s |
| `list_voices` | List your ElevenLabs voices (built-in + cloned) with their voice_ids | free |
| `generate_narration` | Text → speech in a named voice, saved as a local MP3 (ElevenLabs returns audio bytes, not a URL, so this writes to disk and hands back the path) | your ElevenLabs plan |
| `clone_voice` | Clone a new voice from 1–3 local audio samples | your ElevenLabs plan |

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

## Notes

- Costs are billed to your fal.ai account; the `animate_image` and
  `upscale_video` tool descriptions instruct the model to quote cost first.
- Generated URLs are hosted by fal and expire after a few days — download
  anything you want to keep.
- Keep your `FAL_KEY` out of git: it lives only in your MCP client config.
