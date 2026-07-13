# 🎬 Ramping It Up — Video & Content Studio

An all-in-one AI content studio for your curriculum videos and YouTube channels —
shorts, viral clips, edutainment, 3D, 4K, human-realistic avatars, and longform
cinematic projects. Inspired by tools like Higgsfield, but built to be **yours**:
no subscription, no middleman markup, and a character system designed from day
one to render **melanin-rich skin tones beautifully and consistently**.

## ✨ What's inside

| Studio | What it does |
|---|---|
| 🎭 **Character Lab** | Create reusable characters with the Monk Skin Tone scale (1–10), undertones, hair textures (1A–4C), and reference photos — then generate a **multi-angle turnaround sheet** (front, ¾ views, profiles, back, close-ups) that anchors their likeness from any camera angle. Every studio auto-injects the consistency token and uses the sheet as the master reference. Single **angle shots** (low-angle hero, over-the-shoulder, etc.) can be pulled off the sheet on demand. |
| 🖼️ **Image Studio** | **FREE Pollinations models (no key, $0)** plus Nano Banana Pro / GPT Image 2 — cinematic stills, thumbnails, curriculum illustrations. Seed-locking for repeatable results. |
| 🎥 **Video Studio** | Image-to-video and text-to-video (Kling v3 Pro/4K, Seedance 2.0, Hailuo) with shorts (9:16) and cinematic (16:9) presets, plus a Topaz 4K upscale pass. |
| 💡 **Relight Studio** | Higgsfield's signature "change the light in any video," done directly on the models: relight one frame (~$0.10), approve it, then push the look onto the whole 3–10s clip with the **original audio preserved**. |
| 🎞️ **Restyle & Animate** | Turn anything into anything, identity preserved: photo → 3D animated (Pixar-class) / anime / claymation, or a drawing → **realistic human** — then animate the result into video. |
| 👄 **Lip Sync Studio** | Sync any voice track to any face video — the backbone of your talking-avatar pipeline. |
| 🗣️ **Voice Studio** | **FREE voiceover (6 stock voices, $0)**, plus ElevenLabs voice cloning and narration in 30+ languages. |
| 🎵 **Music Studio** | Generate background scores, intros/outros, and full songs with lyrics. |
| 🧑‍🚀 **Avatar Pipeline** | One flow: character portrait → animate → narration → lip-synced talking avatar. Perfect for lesson presenters and channel hosts. |
| ✍️ **Script & Scene Builder** | Curriculum lesson templates (hook → teach → recap), viral shorts beat sheets, edutainment and longform cinematic structures. |
| ✂️ **Editor's Room** | The frame-perfect cutting rules from the `perfect-cuts` skill, plus how to run automatic retake/false-start removal on your raw footage. |
| 💰 **Cost Planner** | Live per-generation price estimates and a whole-project budget calculator, so you always know the cost *before* you hit generate. |

## 💚 Completely-free mode

Images, voiceover, scripts and planning cost **$0** — the Image and Voice studios
include Pollinations.ai free models that need **no API key at all**. Honest note:
there is currently no truly free API for *video* generation — video is the one
thing that costs money everywhere (it's heavy compute). The cheapest quality path
here is Kling v3 Pro at ~$0.17/second (a 5-second clip ≈ $0.85), which is far
below credit-platform pricing. Everything else can be run entirely free.

## 🧰 Bundled Claude Code skills (`skills/`)

This repo also ships three production skills you can use from Claude Code on
your computer (copy them to `~/.claude/skills/`, see `skills/INSTALL.txt`):

- **media-gen** — command-line image/video generation with the same curated 2026
  model registry the app uses (Nano Banana Pro, Seedance 2.0, Kling v3, Topaz).
- **re-light** — the full relight pipeline with frame-exact conform and
  audio-preserving output (the app's 💡 Relight Studio is the browser version).
- **perfect-cuts** — turns raw talking-head footage into a clean edited timeline:
  retakes and false starts removed, frame-accurate cuts, delivered as MP4 +
  Premiere/Resolve XML + SRT captions + EDL + cut log.

## 🚀 Getting started (5 minutes)

1. **Open the app.** Just open `index.html` in your browser — or host the folder
   for free on GitHub Pages / Netlify / Vercel (it's 100% static, no server needed).
2. **Get your API keys** *(optional — free-mode images & voiceover work with no keys at all)*:
   - [fal.ai](https://fal.ai/dashboard/keys) → powers image, video, lip sync, music, upscaling.
   - [ElevenLabs](https://elevenlabs.io/app/settings/api-keys) → powers voice cloning & narration (free tier available).
3. **Paste your keys** into ⚙️ Settings inside the app. Keys are stored only in
   *your* browser (localStorage) — they never touch any server of ours.
4. **Create your first character** in the Character Lab, then generate away.

## 💵 Why this is cost-effective

Platforms like Higgsfield resell compute through a credit system with markup.
Here you pay the model providers directly at wholesale, pay-as-you-go rates:

- Images: from **~$0.003** (FLUX schnell) to ~$0.06 (top-tier) each
- Video: from **~$0.05–0.10 per second** depending on model & resolution
- Narration: ElevenLabs free tier → ~$5/mo starter for creator workloads
- Music: **~$0.03–0.10 per track** with Stable Audio class models

The built-in **Cost Planner** shows a per-click estimate on every generate
button and totals up full projects (e.g. a 10-scene lesson video).

## 🧬 Character consistency — how it works

1. Define a character once: skin tone (Monk scale), undertone, hair texture &
   style, eyes, face, wardrobe, age, vibe — plus optional reference photos.
2. The Lab compiles this into a rich **consistency token** (a precise reusable
   description block) and pins a **seed**.
3. Generate the **turnaround sheet** — one image showing the character full-body
   from five angles plus face close-ups, identical outfit and features. The
   sheet is stored on the character and passed as the primary reference to
   every reference-based generation, which is what keeps the likeness locked
   **from any camera angle** (profiles and backs included, where text prompts
   alone drift).
4. Every studio prepends the token + seed to your prompts, and image-to-video
   flows reuse the same portrait — so your host looks like the *same person*
   across your whole channel.
4. For deep skin tones, prompts automatically include exposure/lighting
   guidance ("properly exposed for deep skin, warm golden rim light, no ashen
   grading") — the detail most tools get wrong.

## 🗂️ Project structure

```
index.html        — the whole app shell
css/styles.css    — cinematic dark theme
js/data.js        — model registry, prices, skin-tone scale, script templates
js/providers.js   — fal.ai (queue + polling) and ElevenLabs API clients
js/app.js         — studios, character lab, projects, gallery, cost planner
```

Model IDs are editable in Settings — when providers ship new models
(they do, monthly), just paste the new model ID. No code changes needed.

## 🔒 Privacy

Everything — keys, characters, projects, generation history — lives in your
browser's localStorage. Export/import your studio data as JSON from Settings.
