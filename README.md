# 🎬 Ramping It Up — Video & Content Studio

An all-in-one AI content studio for your curriculum videos and YouTube channels —
shorts, viral clips, edutainment, 3D, 4K, human-realistic avatars, and longform
cinematic projects. Inspired by tools like Higgsfield, but built to be **yours**:
no subscription, no middleman markup, and a character system designed from day
one to render **melanin-rich skin tones beautifully and consistently**.

## ✨ What's inside

| Studio | What it does |
|---|---|
| 🎭 **Character Lab** | Create reusable characters with the Monk Skin Tone scale (1–10), undertones, hair textures (1A–4C), and reference photos. Every studio auto-injects your character's "consistency token" so they look the same in every image and video. |
| 🖼️ **Image Studio** | FLUX, Nano Banana and more — cinematic stills, thumbnails, curriculum illustrations. Seed-locking for repeatable results. |
| 🎥 **Video Studio** | Text-to-video and image-to-video (Kling, Hailuo/MiniMax, Wan, Veo) with shorts (9:16) and cinematic (16:9) presets, plus a 4K upscale pass. |
| 👄 **Lip Sync Studio** | Sync any voice track to any face video — the backbone of your talking-avatar pipeline. |
| 🗣️ **Voice Studio** | Clone your own voice (ElevenLabs instant clone) and generate narration in any of your voices, in 30+ languages. |
| 🎵 **Music Studio** | Generate background scores, intros/outros, and full songs with lyrics. |
| 🧑‍🚀 **Avatar Pipeline** | One flow: character portrait → narration → lip-synced talking avatar. Perfect for lesson presenters and channel hosts. |
| ✍️ **Script & Scene Builder** | Curriculum lesson templates (hook → teach → recap), viral shorts beat sheets, and longform cinematic structures. Turns a script into a shot list you can generate scene-by-scene. |
| 💰 **Cost Planner** | Live per-generation price estimates and a whole-project budget calculator, so you always know the cost *before* you hit generate. |

## 🚀 Getting started (5 minutes)

1. **Open the app.** Just open `index.html` in your browser — or host the folder
   for free on GitHub Pages / Netlify / Vercel (it's 100% static, no server needed).
2. **Get your API keys** (pay-as-you-go, no subscriptions):
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
3. Every studio prepends that token + seed to your prompts, and image-to-video
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
