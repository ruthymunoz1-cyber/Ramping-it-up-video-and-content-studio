/* ============ Ramping It Up Studio — model registry & creative data ============
 * Model IDs and prices change as providers ship new models. Everything here is
 * editable at runtime from ⚙️ Settings → Model Registry, so the app never goes
 * stale. Prices are estimates (USD) from public provider pricing pages.
 */

const RIU_DATA = {

  /* ---------- generative models (fal.ai queue API) ---------- */
  models: {
    image: [
      { id: "fal-ai/flux/schnell",          name: "FLUX Schnell — fast drafts",        cost: 0.003, unit: "image" },
      { id: "fal-ai/flux/dev",              name: "FLUX Dev — quality stills",          cost: 0.025, unit: "image" },
      { id: "fal-ai/flux-pro/v1.1-ultra",   name: "FLUX Pro Ultra — 4K-class detail",   cost: 0.06,  unit: "image" },
      { id: "fal-ai/nano-banana",           name: "Nano Banana — edits & realism",      cost: 0.039, unit: "image" },
    ],
    imageEdit: [
      { id: "fal-ai/nano-banana/edit",      name: "Nano Banana Edit — reference-based (best for character consistency)", cost: 0.039, unit: "image" },
      { id: "fal-ai/flux-pro/kontext",      name: "FLUX Kontext — edit with instructions", cost: 0.04, unit: "image" },
    ],
    video: [
      { id: "fal-ai/kling-video/v2.1/standard/image-to-video", name: "Kling 2.1 Standard (image→video) — best value", cost: 0.05, unit: "second" },
      { id: "fal-ai/kling-video/v2.1/master/image-to-video",   name: "Kling 2.1 Master (image→video) — cinematic",    cost: 0.28, unit: "second" },
      { id: "fal-ai/minimax/hailuo-02/standard/image-to-video",name: "Hailuo 02 Standard (image→video) — motion",     cost: 0.045,unit: "second" },
      { id: "fal-ai/minimax/hailuo-02/standard/text-to-video", name: "Hailuo 02 (text→video)",                        cost: 0.045,unit: "second" },
      { id: "fal-ai/wan/v2.2-a14b/text-to-video",              name: "Wan 2.2 (text→video) — budget",                 cost: 0.04, unit: "second" },
      { id: "fal-ai/veo3/fast",                                 name: "Veo 3 Fast (text→video, with audio) — premium", cost: 0.40, unit: "second" },
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
      { id: "fal-ai/topaz/upscale/video",   name: "Topaz Video Upscale — to 4K",         cost: 0.10, unit: "second" },
      { id: "fal-ai/esrgan",                name: "ESRGAN — image upscale",              cost: 0.01, unit: "image" },
    ],
  },

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
