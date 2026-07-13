/* ============ Ramping It Up Studio — model registry & creative data ============
 * Model IDs and prices change as providers ship new models. Everything here is
 * editable at runtime from ⚙️ Settings → Model Registry, so the app never goes
 * stale. Prices are estimates (USD) from public provider pricing pages.
 */

const RIU_DATA = {

  /* ---------- generative models (fal.ai queue API) ----------
   * Registry refreshed 2026-07 from the media-gen / re-light skill packs.
   * "FREE:" entries run on Pollinations.ai — no API key, no cost. */
  models: {
    image: [
      { id: "pollinations:flux",            name: "FREE — Pollinations Flux (no API key needed!)", cost: 0, unit: "image", free: true },
      { id: "pollinations:turbo",           name: "FREE — Pollinations Turbo (fast drafts)",       cost: 0, unit: "image", free: true },
      { id: "fal-ai/nano-banana-pro",       name: "Nano Banana Pro — photoreal, top prompt adherence (2K)", cost: 0.04, unit: "image" },
      { id: "fal-ai/gpt-image-2",           name: "GPT Image 2 — complex multi-subject scenes & text", cost: 0.06, unit: "image" },
      { id: "fal-ai/flux/schnell",          name: "FLUX Schnell — cheap drafts",         cost: 0.003, unit: "image" },
    ],
    imageEdit: [
      { id: "fal-ai/nano-banana-pro/edit",  name: "Nano Banana Pro Edit — reference-based, exact character likeness", cost: 0.04, unit: "image" },
      { id: "fal-ai/nano-banana-2/edit",    name: "Nano Banana 2 Edit — identity-locked relight/re-scene", cost: 0.10, unit: "image" },
    ],
    video: [
      { id: "fal-ai/kling-video/v3/pro/image-to-video",   name: "Kling v3 Pro (image→video) — cinematic + native audio, best value", cost: 0.168, unit: "second" },
      { id: "bytedance/seedance-2.0/fast/image-to-video", name: "Seedance 2.0 Fast (image→video) — cheap drafts, 720p", cost: 0.2419, unit: "second" },
      { id: "bytedance/seedance-2.0/image-to-video",      name: "Seedance 2.0 Pro (image→video) — flagship, synced audio, 1080p", cost: 0.6804, unit: "second" },
      { id: "fal-ai/kling-video/v3/4k/image-to-video",    name: "Kling v3 4K (image→video) — native 4K masters", cost: 0.42, unit: "second" },
      { id: "fal-ai/minimax/hailuo-02/standard/text-to-video", name: "Hailuo 02 (text→video, no start image)", cost: 0.045, unit: "second" },
    ],
    videoEdit: [
      { id: "fal-ai/kling-video/o3/pro/video-to-video/edit", name: "Kling O3 Pro Edit — relight/re-scene a clip, audio preserved", cost: 0.168, unit: "second" },
      { id: "fal-ai/kling-video/o1/video-to-video/edit",     name: "Kling O1 Edit — faster/cheaper draft", cost: 0.168, unit: "second" },
    ],
    lipsync: [
      { id: "fal-ai/sync-lipsync",          name: "Sync LipSync — video + audio",       cost: 0.06, unit: "second" },
      { id: "veed/lipsync",                 name: "VEED LipSync — alternative",         cost: 0.08, unit: "second" },
    ],
    music: [
      { id: "fal-ai/stable-audio",          name: "Stable Audio — instrumentals & scores", cost: 0.03, unit: "track" },
      { id: "fal-ai/minimax-music",         name: "MiniMax Music — full songs w/ lyrics",  cost: 0.10, unit: "track" },
      { id: "CassetteAI/music-generator",   name: "Cassette — fast background beds",       cost: 0.02, unit: "track" },
    ],
    upscale: [
      { id: "fal-ai/topaz/upscale/video",   name: "Topaz Video Upscale — clean + sharpen to HD/4K", cost: 0.02, unit: "second" },
      { id: "fal-ai/topaz/upscale/image",   name: "Topaz Image Upscale — Standard V2",   cost: 0.01, unit: "image" },
    ],
  },

  /* Character turnaround sheet — the master reference for any-angle consistency. */
  sheetPrompt:
    "Character reference turnaround sheet on a single image: the EXACT same character shown " +
    "full-body from five angles side by side — front view, three-quarter left view, left profile, " +
    "back view, three-quarter right view — plus a chest-up front close-up and a side-face close-up. " +
    "Identical face, identical hairstyle, identical outfit and colors in every view. Neutral relaxed " +
    "standing pose, arms at sides, plain light-grey seamless studio background, soft even professional " +
    "lighting, photorealistic, highly detailed, no text, no labels, no props.",

  angleShots: [
    { name: "Front",            prompt: "straight-on front view, looking at camera" },
    { name: "¾ Left",           prompt: "three-quarter view from the left" },
    { name: "¾ Right",          prompt: "three-quarter view from the right" },
    { name: "Left profile",     prompt: "exact left side profile" },
    { name: "Right profile",    prompt: "exact right side profile" },
    { name: "Back",             prompt: "view from directly behind" },
    { name: "Face close-up",    prompt: "front face close-up portrait, chest-up" },
    { name: "Low-angle hero",   prompt: "dramatic low-angle hero shot looking up at the character" },
    { name: "Over-the-shoulder",prompt: "over-the-shoulder view from behind, face turned slightly toward camera" },
  ],

  /* Restyle presets for the Restyle & Animate studio (photo ↔ animation). */
  restylePresets: [
    { name: "→ Realistic human (from cartoon/drawing)", prompt: "Recreate the subject from the reference image as a hyper-realistic photograph of a real human — photorealistic skin with natural texture and true-to-life undertones, real fabric, natural lighting, shot on a cinema camera, 4K detail. Keep the same identity, outfit, pose and framing." },
    { name: "→ 3D animated film (Pixar-class)",        prompt: "Recreate the subject from the reference image as a high-end 3D animated film character — expressive stylized proportions, subsurface skin scattering, soft global illumination, detailed hair groom, cinematic render. Keep the same identity, outfit, pose and framing." },
    { name: "→ Anime",                                  prompt: "Recreate the subject from the reference image in high-quality anime style — clean line art, expressive eyes, dramatic cel lighting, detailed painted background. Keep the same identity, outfit, pose and framing." },
    { name: "→ Claymation",                             prompt: "Recreate the subject from the reference image as a handcrafted stop-motion claymation character — visible clay texture, miniature set, shallow depth of field. Keep the same identity, outfit, pose and framing." },
    { name: "→ Comic / graphic novel",                  prompt: "Recreate the subject from the reference image as bold graphic-novel art — inked lines, halftone shading, dramatic composition. Keep the same identity, outfit, pose and framing." },
    { name: "→ Watercolor storybook",                   prompt: "Recreate the subject from the reference image as a soft watercolor children's-storybook illustration — gentle washes, warm paper texture. Keep the same identity, outfit, pose and framing." },
  ],

  /* ElevenLabs pricing reference (subscription credits, approx per-1k chars) */
  voicePricing: [
    { tier: "Free",    price: "$0/mo",  chars: "10k credits/mo", clone: "No" },
    { tier: "Starter", price: "$5/mo",  chars: "30k credits/mo", clone: "Instant clone ✓" },
    { tier: "Creator", price: "$22/mo", chars: "100k credits/mo + usage-based", clone: "Instant + Professional ✓" },
  ],

  /* ---------- Monk Skin Tone scale (1–10) ---------- */
  skinTones: [
    { mst: 1,  hex: "#f6ede4", desc: "very fair, cool porcelain" },
    { mst: 2,  hex: "#f3e7db", desc: "fair, neutral ivory" },
    { mst: 3,  hex: "#f7ead0", desc: "light, warm beige" },
    { mst: 4,  hex: "#eadaba", desc: "light-medium, golden beige" },
    { mst: 5,  hex: "#d7bd96", desc: "medium, warm tan" },
    { mst: 6,  hex: "#a07e56", desc: "medium-deep, rich caramel brown" },
    { mst: 7,  hex: "#825c43", desc: "deep, warm chestnut brown" },
    { mst: 8,  hex: "#604134", desc: "deep, rich mahogany brown" },
    { mst: 9,  hex: "#3a312a", desc: "very deep, espresso brown" },
    { mst: 10, hex: "#292420", desc: "deepest, luminous ebony" },
  ],

  undertones: ["golden", "warm red", "neutral", "olive", "cool blue-red", "copper"],

  hairTextures: [
    { code: "1A-1C", label: "Straight (1A–1C)" },
    { code: "2A-2C", label: "Wavy (2A–2C)" },
    { code: "3A", label: "Loose curls (3A)" },
    { code: "3B", label: "Springy curls (3B)" },
    { code: "3C", label: "Tight corkscrew curls (3C)" },
    { code: "4A", label: "Coily (4A)" },
    { code: "4B", label: "Z-pattern coils (4B)" },
    { code: "4C", label: "Dense tight coils (4C)" },
  ],

  hairStyles: [
    "short natural afro", "tapered fro", "box braids", "knotless braids", "cornrows",
    "locs", "twist-out", "bantu knots", "high puff", "silk press", "fade with waves",
    "curly shag", "long layers", "protective updo", "head wrap", "custom (type below)",
  ],

  /* Lighting guidance injected for deeper skin tones (MST 6+). This is the
   * detail most AI tools miss: default gradings wash deep skin into grey. */
  melaninLighting:
    "skin properly exposed and color-graded for deep melanin-rich skin — luminous, " +
    "even, with warm golden rim light and soft key light; true-to-life undertones, " +
    "no ashen or grey cast, no over-brightening",

  /* ---------- cinematic camera & motion presets (video prompts) ---------- */
  cameraMoves: [
    { name: "Slow dolly-in", prompt: "slow cinematic dolly-in toward subject, shallow depth of field" },
    { name: "Crash zoom", prompt: "rapid crash zoom punch-in on subject's face, energetic" },
    { name: "Orbit / arc", prompt: "smooth 180-degree orbit around subject, parallax background" },
    { name: "Crane up reveal", prompt: "crane shot rising up and tilting down for an epic reveal" },
    { name: "Handheld vlog", prompt: "natural handheld camera sway, casual vlog energy" },
    { name: "Bullet-time", prompt: "frozen-moment bullet time rotation around subject" },
    { name: "FPV drone", prompt: "fast FPV drone fly-through, dynamic banking turns" },
    { name: "Static tripod", prompt: "locked-off static tripod shot, subject motion only" },
    { name: "Whip pan", prompt: "fast whip pan transition to subject" },
    { name: "Dutch angle push", prompt: "tilted dutch-angle slow push-in, tense mood" },
  ],

  stylePresets: [
    { name: "Human realistic 4K", prompt: "hyper-realistic, photorealistic skin texture with visible pores, 4K detail, cinematic color grade, shot on ARRI Alexa, 35mm lens" },
    { name: "3D animated (Pixar-style)", prompt: "high-end 3D animated film style, expressive stylized character, soft global illumination, subsurface skin scattering, rendered in high detail" },
    { name: "Edutainment bold", prompt: "bright, high-contrast edutainment style, clean modern set, punchy saturated colors, crisp studio lighting" },
    { name: "Cinematic drama", prompt: "moody cinematic lighting, anamorphic lens flare, teal-and-amber grade, film grain, epic composition" },
    { name: "Anime", prompt: "high-quality anime style, clean line art, dramatic lighting, detailed background" },
    { name: "Claymation", prompt: "stop-motion claymation style, handcrafted texture, miniature set depth of field" },
    { name: "Documentary natural", prompt: "natural documentary look, soft window light, true-to-life color, unobtrusive framing" },
    { name: "Whiteboard / explainer", prompt: "clean explainer illustration style, flat design, generous white space, friendly shapes" },
  ],

  aspectRatios: [
    { label: "9:16 Shorts/Reels/TikTok", value: "9:16" },
    { label: "16:9 YouTube/Cinematic", value: "16:9" },
    { label: "1:1 Square", value: "1:1" },
    { label: "4:5 Feed", value: "4:5" },
  ],

  /* ---------- script & scene templates ---------- */
  scriptTemplates: [
    {
      id: "curriculum",
      name: "📚 Curriculum lesson (3–8 min)",
      desc: "Hook → objective → teach in chunks → worked example → recap & quiz. Great for course modules and classroom content.",
      beats: [
        { beat: "Cold-open hook", secs: 15, tip: "Open with a surprising question or scenario from the lesson topic. No intro yet." },
        { beat: "Welcome + objective", secs: 20, tip: "Host on camera: 'By the end of this video you'll be able to…' (one sentence)." },
        { beat: "Concept chunk 1", secs: 60, tip: "Teach ONE idea. Cut to b-roll/diagram every 8–12 seconds." },
        { beat: "Concept chunk 2", secs: 60, tip: "Second idea. Callback to the hook." },
        { beat: "Worked example", secs: 75, tip: "Walk through a real example step by step on screen." },
        { beat: "Common mistake", secs: 30, tip: "'Most people get this wrong…' — builds trust and retention." },
        { beat: "Recap + quiz question", secs: 30, tip: "3-bullet recap, then leave a question for comments/classwork." },
      ],
    },
    {
      id: "short",
      name: "⚡ Viral short (30–60 sec)",
      desc: "Pattern-interrupt hook in second 1, fast payoff loop. For Shorts, Reels, TikTok.",
      beats: [
        { beat: "Hook (0–2s)", secs: 2, tip: "Visual + verbal pattern interrupt. Start mid-action. Never say 'hey guys'." },
        { beat: "Stakes / promise (2–7s)", secs: 5, tip: "Why should they keep watching? Tease the payoff." },
        { beat: "Delivery", secs: 35, tip: "Rapid value: 3 points max, hard cuts every 2–4 seconds, captions on." },
        { beat: "Payoff + loop", secs: 8, tip: "Land the payoff, then end on a line that loops back to the opening frame." },
      ],
    },
    {
      id: "edutainment",
      name: "🎪 Edutainment (8–15 min)",
      desc: "Story-driven learning with characters, stakes and cinematic b-roll. MrBeast-meets-classroom pacing.",
      beats: [
        { beat: "Cinematic cold open", secs: 30, tip: "Drop viewers into the most dramatic moment of the story/experiment." },
        { beat: "The question", secs: 30, tip: "Frame the lesson as a mystery or challenge with real stakes." },
        { beat: "Act 1 — first attempt", secs: 150, tip: "Character tries, partially fails. Teach concepts through the failure." },
        { beat: "Act 2 — deeper dive", secs: 180, tip: "Bring in the science/method. Diagrams + host explanation." },
        { beat: "Act 3 — the payoff", secs: 150, tip: "Apply the learning, succeed dramatically. Cinematic shots." },
        { beat: "Reflect + CTA", secs: 45, tip: "What did we learn? Point to the next video / lesson." },
      ],
    },
    {
      id: "longform",
      name: "🎬 Longform cinematic (15–40 min)",
      desc: "Documentary / video-essay structure with chapters, tension arcs and re-hooks every 2–3 minutes.",
      beats: [
        { beat: "Cold open montage", secs: 60, tip: "Best 4–6 shots of the whole video, cut to music. End on the central question." },
        { beat: "Chapter 1 — setup", secs: 240, tip: "Context and characters. End the chapter on a mini-cliffhanger." },
        { beat: "Chapter 2 — rising tension", secs: 300, tip: "Complications. Re-hook at the top ('but that's when everything changed')." },
        { beat: "Chapter 3 — turning point", secs: 300, tip: "The big reveal or shift. Your most cinematic sequence." },
        { beat: "Chapter 4 — resolution", secs: 240, tip: "Resolve the arcs. Slower pacing, emotional grade." },
        { beat: "Epilogue + CTA", secs: 60, tip: "Zoom out to the bigger meaning. Invite to the next video." },
      ],
    },
  ],

  /* fal endpoints that accept these common params — used to build inputs */
  falQueueBase: "https://queue.fal.run",
};
