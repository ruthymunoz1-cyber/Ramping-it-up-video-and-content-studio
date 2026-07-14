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
    { name: "→ Children's picture-book illustration",   prompt: "Recreate the subject from the reference image as a warm, professional children's picture-book illustration — soft painted textures, friendly expressive style, storybook composition, print-quality. Keep the same identity, outfit, pose and framing." },
    { name: "→ Coloring book page (line art, NO color)", prompt: "Convert the subject from the reference image into a clean black-and-white coloring book page — bold smooth black outlines only, absolutely no color, no shading, no grey fills, pure white background, kid-friendly simplified details, large open areas to color, printable quality. Keep the same identity, outfit, pose and framing." },
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
    { name: "Children's book", prompt: "warm children's picture-book illustration, soft painted textures, friendly expressive characters, storybook composition, print-quality" },
    { name: "Coloring book (line art, no color)", prompt: "clean black-and-white coloring book page — bold smooth black outlines only, no color, no shading, no grey fills, pure white background, kid-friendly simplified details, large open areas to color, printable" },
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
      desc: "Video-essay structure with chapters, tension arcs and re-hooks every 2–3 minutes.",
      beats: [
        { beat: "Cold open montage", secs: 60, tip: "Best 4–6 shots of the whole video, cut to music. End on the central question." },
        { beat: "Chapter 1 — setup", secs: 240, tip: "Context and characters. End the chapter on a mini-cliffhanger." },
        { beat: "Chapter 2 — rising tension", secs: 300, tip: "Complications. Re-hook at the top ('but that's when everything changed')." },
        { beat: "Chapter 3 — turning point", secs: 300, tip: "The big reveal or shift. Your most cinematic sequence." },
        { beat: "Chapter 4 — resolution", secs: 240, tip: "Resolve the arcs. Slower pacing, emotional grade." },
        { beat: "Epilogue + CTA", secs: 60, tip: "Zoom out to the bigger meaning. Invite to the next video." },
      ],
    },
    {
      id: "documentary",
      name: "🎥 Documentary (10–30 min)",
      desc: "Narrator + interview-style soundbites over b-roll, evidence-driven chapters. Pairs well with Location Scout for cutaways and Voice Studio's multi-voice dialogue for 'interview' segments.",
      beats: [
        { beat: "Cold open — the hook image", secs: 30, tip: "One arresting image/moment that embodies the whole story, no context yet. Narrator poses the central question." },
        { beat: "Meet the subject", secs: 60, tip: "Introduce who or what this is about. Establishing shots from Location Scout work well here." },
        { beat: "Why it matters", secs: 45, tip: "Narrator explains the stakes — why this story matters now, to this audience." },
        { beat: "Chapter 1 — the evidence", secs: 180, tip: "First part of the case: narration over b-roll, one 'interview' soundbite backing it up." },
        { beat: "Chapter 2 — complication", secs: 180, tip: "A wrinkle, counter-argument, or deepening of the story. A second interview voice for contrast." },
        { beat: "Chapter 3 — turning point", secs: 150, tip: "The pivotal moment or discovery. Your most cinematic b-roll sequence." },
        { beat: "Resolution", secs: 90, tip: "Tie the evidence together. Return to the image or subject from the opening." },
        { beat: "Closing reflection + CTA", secs: 45, tip: "Zoom out to the larger meaning. Point toward the next piece or a call to action." },
      ],
    },
  ],

  /* Location Scout — categories of establishing shots / set plates. */
  locationCategories: [
    { name: "World landmarks",        hint: "the Eiffel Tower at golden hour · the Great Wall of China in morning mist · the Pyramids of Giza at dusk" },
    { name: "Cities & streets",       hint: "a rainy Tokyo neon street at night · a Brooklyn brownstone block in autumn · a sunny Caribbean harbor town" },
    { name: "Museums & exhibitions",  hint: "a grand natural-history museum hall with a dinosaur skeleton · a bright modern art gallery · a science-center exhibition with interactive displays" },
    { name: "Classrooms & campuses",  hint: "a bright modern elementary classroom · a university lecture hall · a cozy school library reading corner" },
    { name: "Nature & wonders",       hint: "the Grand Canyon at sunrise · a bioluminescent beach at night · an African savanna with acacia trees" },
    { name: "Historical eras",        hint: "an ancient Roman forum bustling with life · a 1920s Harlem jazz street · a medieval castle great hall" },
    { name: "Fantasy & sci-fi sets",  hint: "a floating sky city above the clouds · a neon cyberpunk market · an enchanted glowing forest" },
  ],
  locationSuffix: "Cinematic wide establishing shot, no people in frame, photorealistic, rich natural light, high detail, room for a subject to be composited into the scene",

  /* Director one-click pipeline formats. */
  directorFormats: [
    { id: "short",       name: "⚡ Viral Short (30–60s, 9:16)",        scenes: 5,  ar: "9:16" },
    { id: "curriculum",  name: "📚 Curriculum lesson (3–8 min, 16:9)", scenes: 7,  ar: "16:9" },
    { id: "edutainment", name: "🎪 Edutainment (8–15 min, 16:9)",      scenes: 9,  ar: "16:9" },
    { id: "longform",    name: "🎬 Longform cinematic (15+ min, 16:9)",scenes: 12, ar: "16:9" },
    { id: "documentary", name: "🎥 Documentary (10-30 min, 16:9)",     scenes: 8,  ar: "16:9" },
  ],

  /* Thumbnail A/B Lab — proven high-CTR composition patterns. */
  thumbCompositions: [
    { name: "Big face + emotion",   prompt: "extreme close-up of the character's face filling the right half of the frame with a huge exaggerated expression, direct eye contact with camera" },
    { name: "Pointing at the text", prompt: "character on one side pointing emphatically at the giant title text, eyebrows raised" },
    { name: "Before / after split", prompt: "dramatic split composition — left side shows the problem state, right side the amazing result, character reacting in the middle" },
    { name: "Object + shock",       prompt: "character holding up a key object from the video toward the camera, shocked expression, object slightly oversized" },
  ],
  thumbEmotions: ["shocked 😱", "excited 🤩", "curious 🤔", "laughing 😂", "serious 😐", "mind-blown 🤯"],
  thumbSuffix: "YouTube thumbnail style: ultra high contrast, punchy saturated colors, crisp rim lighting on the subject, clean uncluttered background with strong color, sharp focus, composition leaves clear space for the title text, 4K quality",

  /* Ambient / background sound presets — generated via Stable Audio (fal, ~$0.03/track). */
  ambientPresets: [
    { name: "Gentle rain",        prompt: "gentle rain falling ambience, soft steady rhythm, seamless loop, no music, no voices, calm background sound" },
    { name: "Cozy fireplace",     prompt: "crackling wood fireplace ambience, warm cozy room tone, seamless loop, no music, no voices" },
    { name: "Ocean waves",        prompt: "gentle ocean waves rolling onto a beach, seamless loop, no music, no voices" },
    { name: "Forest & birds",     prompt: "peaceful forest ambience, birds chirping, light wind in leaves, seamless loop, no music, no voices" },
    { name: "Classroom hum",      prompt: "soft classroom background room tone, distant quiet chatter, seamless loop, no music" },
    { name: "Coffee shop",        prompt: "cozy coffee shop ambience, distant murmuring, cup clinks, seamless loop, no music, no voices" },
    { name: "Wind & open air",    prompt: "soft open-air wind ambience, outdoor natural room tone, seamless loop, no music, no voices" },
    { name: "City traffic (soft)",prompt: "distant soft city traffic ambience, urban background tone, seamless loop, no music, no voices" },
    { name: "White noise / focus",prompt: "smooth even white noise, focus and study background, seamless loop, no music, no voices" },
    { name: "Night crickets",     prompt: "quiet night ambience, crickets chirping, calm and still, seamless loop, no music, no voices" },
  ],

  /* Genuinely free, no-API royalty-free libraries — for anything the studio
   * doesn't need to generate (or when $0 truly matters and quality of a
   * pre-made track beats a generated one). Licenses vary — always read the
   * specific track's terms; "royalty-free" is not always "attribution-free". */
  royaltyFreeSources: [
    { name: "YouTube Audio Library", url: "https://studio.youtube.com — Audio Library tab", note: "Huge, free for YouTube use, filter by 'no attribution required'." },
    { name: "Pixabay Music & SFX",   url: "https://pixabay.com/music/ and /sound-effects/", note: "Free for commercial use, no attribution required." },
    { name: "Freesound.org",         url: "https://freesound.org", note: "Huge SFX/nature library — check each clip's license (many need attribution)." },
    { name: "Free Music Archive",    url: "https://freemusicarchive.org", note: "Curated free music — check each track's specific license." },
    { name: "Uppbeat",               url: "https://uppbeat.io", note: "Free tier with attribution, or a paid tier for attribution-free." },
  ],

  /* Whiteboard / faceless-video caption styles. */
  whiteboardStyles: [
    { id: "whiteboard", name: "Whiteboard (light)", bg: "#f7f5ef", ink: "#1c1c1c", accent: "#d94f3d" },
    { id: "blackboard", name: "Blackboard (chalk)", bg: "#1f2a24", ink: "#f2efe4", accent: "#f5c04e" },
    { id: "slate",      name: "Slate (faceless video)", bg: "#0f1220", ink: "#f2f0ec", accent: "#59e0b5" },
  ],

  /* Narration delivery styles — shape expressiveness (not the words) via
   * ElevenLabs voice_settings, or via a spoken instruction for the free
   * LLM-based voice (which can genuinely follow delivery direction). */
  deliveryStyles: [
    { name: "Neutral / default", desc: "natural, neutral delivery", stability: 0.5, style: 0 },
    { name: "Warm & encouraging (teacher)", desc: "warm, encouraging, patient teacher's delivery", stability: 0.65, style: 0.15 },
    { name: "Dramatic & authoritative (documentary)", desc: "steady, authoritative documentary-narrator delivery, slowing down on dramatic lines", stability: 0.35, style: 0.4 },
    { name: "Playful & energetic (kids/edutainment)", desc: "playful, high-energy, fun delivery for kids", stability: 0.25, style: 0.5 },
    { name: "Calm & soothing (bedtime/meditation)", desc: "calm, slow, soothing bedtime-story delivery", stability: 0.75, style: 0.1 },
  ],

  /* Language/culture variant suggestions for the Character Lab — SUGGESTIONS
   * only, always shown as editable text the user confirms before generating.
   * Language does not determine ethnicity; these are common-sense starting
   * points for language-learning hosts, not a rule. */
  languageVariants: [
    { lang: "Spanish", suggestion: "Mexican or Latin American" },
    { lang: "Mandarin Chinese", suggestion: "Chinese" },
    { lang: "Hindi", suggestion: "Indian" },
    { lang: "Arabic", suggestion: "Middle Eastern or North African" },
    { lang: "French", suggestion: "French, or West/Central African Francophone" },
    { lang: "Portuguese", suggestion: "Brazilian or Portuguese" },
    { lang: "Japanese", suggestion: "Japanese" },
    { lang: "Korean", suggestion: "Korean" },
    { lang: "Swahili", suggestion: "East African" },
    { lang: "Yoruba", suggestion: "Nigerian (Yoruba)" },
    { lang: "German", suggestion: "German" },
    { lang: "Italian", suggestion: "Italian" },
    { lang: "Vietnamese", suggestion: "Vietnamese" },
    { lang: "Tagalog / Filipino", suggestion: "Filipino" },
    { lang: "Haitian Creole", suggestion: "Haitian" },
  ],

  /* Book outline templates — chapter/beat structures for common bestseller
   * shapes, including representation-forward guidance for the diverse
   * picture-book template given the underserved-communities mission. */
  bookTemplates: [
    {
      id: "diverse-picture-book",
      name: "🌈 Diverse Picture Book (32-page classic structure)",
      desc: "The standard picture-book page-count structure, with prompts at each beat to keep representation authentic and specific rather than tokenistic.",
      chapters: [
        { title: "Title page & dedication", tip: "Establish the character's name and world in one warm image." },
        { title: "Opening spread — meet the character", tip: "Show their everyday life with specific, authentic cultural detail (food, home, family structure, neighborhood) — specificity reads as respect, generic 'diversity' reads as tokenism." },
        { title: "The problem / want", tip: "A relatable want or problem any child understands, seen through this character's particular lens." },
        { title: "First attempt", tip: "They try something and it doesn't fully work. Keep the stakes kid-sized." },
        { title: "Turning point", tip: "Often where community, family, or cultural wisdom (not a generic 'magic fix') helps them see differently." },
        { title: "Climax", tip: "The character solves it themselves, using what they learned." },
        { title: "Resolution & warm ending", tip: "Return to the opening image, changed. End on warmth, not a moral lecture." },
        { title: "Back matter (optional)", tip: "A short author's note on the culture/tradition shown, for parents/teachers — adds authenticity and classroom use value." },
      ],
    },
    {
      id: "middle-grade-adventure",
      name: "📗 Middle-Grade Adventure (3-act, ~20 chapters)",
      desc: "Classic 8-12yo adventure/quest structure.",
      chapters: [
        { title: "Ordinary world", tip: "Establish the hero's normal life and a clear flaw or longing." },
        { title: "Inciting incident", tip: "The event that can't be undone — end of chapter 1 or 2." },
        { title: "Refusal & commitment", tip: "Hero hesitates, then commits by chapter 3-4." },
        { title: "Rising action / allies & obstacles", tip: "A string of escalating challenges, roughly 8-10 chapters, each raising stakes." },
        { title: "Midpoint twist", tip: "New information flips the hero's understanding of the quest." },
        { title: "Low point / all is lost", tip: "The hero's darkest moment, near the 3/4 mark." },
        { title: "Climax", tip: "Hero uses what they've learned (not a new power) to win." },
        { title: "Resolution", tip: "Show the changed ordinary world — 1-2 short chapters." },
      ],
    },
    {
      id: "romance-beats",
      name: "💕 Romance Beat Sheet (bestseller structure)",
      desc: "The reader-expected romance genre beats — deviate from these at your own risk with genre readers.",
      chapters: [
        { title: "Meet cute / first sight", tip: "Establish both leads' goals and what makes them wrong for each other on paper." },
        { title: "The spark", tip: "First real charged interaction — banter, tension, or both." },
        { title: "Deepening attraction", tip: "Vulnerability shared; stakes for the relationship rise." },
        { title: "Midpoint — first kiss / commitment", tip: "The relationship becomes real, raising the cost of losing it." },
        { title: "The complication", tip: "External or internal conflict threatens the relationship — often the goal-vs-love-interest tension pays off here." },
        { title: "Black moment / breakup", tip: "It falls apart, believably, near the 80% mark." },
        { title: "Grand gesture", tip: "One partner proves they've changed — show, don't just declare." },
        { title: "Happily ever after / for now", tip: "Genre readers expect this ending — deliver it fully." },
      ],
    },
    {
      id: "ya-coming-of-age",
      name: "🔍 YA Coming-of-Age",
      desc: "Identity-driven structure for teen readers.",
      chapters: [
        { title: "Who they think they are", tip: "Establish identity/role as others see it." },
        { title: "The crack", tip: "Something challenges that self-image." },
        { title: "Trying on new identities", tip: "Experimentation, mistakes, new relationships." },
        { title: "The cost", tip: "Consequences of the experimentation land." },
        { title: "The reckoning", tip: "A forced confrontation with who they actually are." },
        { title: "Choosing", tip: "The character chooses their real self, even if it's costly." },
        { title: "New equilibrium", tip: "Show who they are now — different from page one, believably earned." },
      ],
    },
    {
      id: "nonfiction-selfhelp",
      name: "📘 Nonfiction / Self-Help (problem–solution)",
      desc: "Structure for teaching or self-help nonfiction.",
      chapters: [
        { title: "The problem, made personal", tip: "Open with a specific story that embodies the reader's problem." },
        { title: "Why it persists", tip: "The real (often counterintuitive) reason common solutions fail." },
        { title: "The framework", tip: "Your core method, named and structured — this is what readers will quote." },
        { title: "Pillar 1", tip: "First component, with a case study or exercise." },
        { title: "Pillar 2", tip: "Second component, building on the first." },
        { title: "Pillar 3", tip: "Third component, completing the framework." },
        { title: "Putting it together", tip: "A combined walkthrough/worksheet chapter." },
        { title: "Sustaining it", tip: "How to keep the change after the book ends." },
      ],
    },
  ],

  /* Book Cover Studio — common cover shapes. Full print wraps (spine width
   * depends on exact page count + paper stock) are best finished in Amazon
   * KDP's free Cover Creator using this front art as the input image. */
  coverFormats: [
    { name: "Ebook / Kindle (1600×2560)", w: 1600, h: 2560 },
    { name: "Print front cover only (1600×2400)", w: 1600, h: 2400 },
    { name: "Square promo (1200×1200)", w: 1200, h: 1200 },
  ],
  coverStyles: [
    "Photoreal cinematic", "3D animated / Pixar-style", "Children's picture-book illustration",
    "Watercolor storybook", "Bold graphic-novel / comic", "Minimalist typographic", "Fantasy painted",
  ],

  /* Storyboard panel shot types. */
  shotTypes: ["WIDE", "ESTABLISHING", "MED", "MED CLOSE-UP", "CLOSE-UP", "EXTREME CU", "OVER-SHOULDER", "LOW ANGLE", "HIGH ANGLE", "POV", "INSERT"],

  /* fal endpoints that accept these common params — used to build inputs */
  falQueueBase: "https://queue.fal.run",
};
