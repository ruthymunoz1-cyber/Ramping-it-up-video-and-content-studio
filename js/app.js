/* ============ Ramping It Up Studio — app ============ */

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------------- state ---------------- */
const Store = {
  get(k, fallback) {
    try { const v = localStorage.getItem("riu." + k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(k, v) { localStorage.setItem("riu." + k, JSON.stringify(v)); },
};

const State = {
  characters: Store.get("characters", []),
  gallery: Store.get("gallery", []),      // { kind, url, prompt, model, cost, ts }
  scripts: Store.get("scripts", []),
  storyboards: Store.get("storyboards", []), // { id, title, style, charId, model, panels: [{shot, desc, imgUrl}] }
  locations: Store.get("locations", []),     // { id, name, desc, url }
  sounds: Store.get("sounds", []),           // { id, name, url }
  activeBoardId: null,
  saveCharacters() { Store.set("characters", this.characters); },
  saveGallery() { Store.set("gallery", this.gallery.slice(0, 200)); },
  saveScripts() { Store.set("scripts", this.scripts); },
  saveStoryboards() { Store.set("storyboards", this.storyboards); },
  saveLocations() { Store.set("locations", this.locations); },
  saveSounds() { Store.set("sounds", this.sounds); },
  addToGallery(item) { this.gallery.unshift({ ...item, ts: Date.now() }); this.saveGallery(); },
};

/* Editable model registry: overrides from Settings merge over RIU_DATA. */
function models(category) {
  const overrides = Store.get("modelOverrides", {});
  return overrides[category] || RIU_DATA.models[category];
}

/* ---------------- character consistency engine ---------------- */
function compileCharacterToken(c) {
  const parts = [];
  parts.push(`${c.name}, a ${c.ethnicity ? c.ethnicity + " " : ""}${c.gender || "person"}${c.age ? " " + c.age : ""}`);
  const tone = RIU_DATA.skinTones.find(t => t.mst === c.mst);
  if (tone) parts.push(`with ${tone.desc} skin (Monk Skin Tone ${tone.mst})${c.undertone ? `, ${c.undertone} undertones` : ""}`);
  if (c.hairTexture || c.hairStyle) {
    const tex = RIU_DATA.hairTextures.find(h => h.code === c.hairTexture);
    parts.push(`${c.hairColor || ""} ${tex ? tex.label.toLowerCase() : ""} hair styled as ${c.hairStyle || "natural"}`.trim());
  }
  if (c.eyes) parts.push(`${c.eyes} eyes`);
  if (c.face) parts.push(c.face);
  if (c.build) parts.push(c.build);
  if (c.wardrobe) parts.push(`wearing ${c.wardrobe}`);
  if (c.vibe) parts.push(`overall vibe: ${c.vibe}`);
  let token = parts.filter(Boolean).join(", ");
  if (c.mst >= 6) token += ". " + RIU_DATA.melaninLighting;
  return token;
}

function characterPrefix(charId) {
  if (!charId) return "";
  const c = State.characters.find(x => x.id === charId);
  return c ? compileCharacterToken(c) + ". " : "";
}
function characterSeed(charId) {
  const c = State.characters.find(x => x.id === charId);
  return c ? c.seed : undefined;
}
/* Reference images for a character: the turnaround sheet is the strongest
 * anchor (it carries every angle), the uploaded photo second. Max 2 refs —
 * more muddies edit-model results. */
function characterRefs(charId) {
  const c = State.characters.find(x => x.id === charId);
  return c ? [c.sheetUrl, c.refImage].filter(Boolean).slice(0, 2) : [];
}
function characterRef(charId) { return characterRefs(charId)[0] || null; }

/* ---------------- shared UI helpers ---------------- */
function charSelectHtml(id, label = "Character (optional — keeps your host consistent)") {
  const opts = State.characters.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
  return `<label class="f-label">${label}</label>
    <select id="${id}"><option value="">— none —</option>${opts}</select>`;
}

function modelsIn(...categories) {
  return categories.flatMap(c => models(c));
}
function modelSelectHtml(id, ...categories) {
  const opts = modelsIn(...categories).map(m =>
    `<option value="${esc(m.id)}" data-cost="${m.cost}" data-unit="${m.unit}">${esc(m.name)} — ~$${m.cost}/${m.unit}</option>`).join("");
  return `<label class="f-label">Model</label><select id="${id}">${opts}</select>
    <div class="hint">Prices are provider estimates. Edit the registry in ⚙️ Settings when new models ship.</div>`;
}

function chipsHtml(id, items, getLabel = x => x.name || x.label || x) {
  return `<div class="chips" id="${id}">${items.map((x, i) =>
    `<button type="button" class="chip" data-i="${i}">${esc(getLabel(x))}</button>`).join("")}</div>`;
}
function bindChips(containerId, single = true) {
  const box = $("#" + containerId);
  box.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    if (single) $$(".chip", box).forEach(c => { if (c !== chip) c.classList.remove("on"); });
    chip.classList.toggle("on");
  });
}
function chipValue(containerId, items, field = "prompt") {
  const on = $$("#" + containerId + " .chip.on");
  return on.map(c => items[+c.dataset.i][field]).join(", ");
}

function setStatus(id, kind, msg) {
  const el = $("#" + id);
  el.className = `status show ${kind}`;
  el.innerHTML = kind === "info" ? `<span class="spinner"></span>${esc(msg)}` : esc(msg);
}
function clearStatus(id) { const el = $("#" + id); if (el) el.className = "status"; }

function showMedia(containerId, kind, url) {
  const box = $("#" + containerId);
  const dl = `<div class="mt"><a class="btn sm" href="${url}" download target="_blank" rel="noopener">⬇ Download / open</a></div>`;
  if (kind === "image") box.innerHTML = `<img src="${url}" alt="result">` + dl;
  else if (kind === "video") box.innerHTML = `<video src="${url}" controls></video>` + dl;
  else box.innerHTML = `<audio src="${url}" controls></audio>` + dl;
}

/* Per-word start/end estimated from the measured audio duration, weighted by
 * word length so long words get proportionally more screen time. This is the
 * standard estimation approach; for frame-exact timing from raw footage use
 * the perfect-cuts skill (Whisper-based). Drives both SRT export and the
 * Whiteboard Studio's word-reveal animation. */
function buildWordTimings(text, duration) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length || !duration) return [];
  const weights = words.map(w => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = 0;
  return words.map((word, i) => {
    const dur = (weights[i] / total) * duration;
    const start = t; t += dur;
    return { word, start, end: t };
  });
}

const srtTime = (s) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor(ms / 60000) % 60).padStart(2, "0");
  const sec = String(Math.floor(ms / 1000) % 60).padStart(2, "0");
  return `${h}:${m}:${sec},${String(ms % 1000).padStart(3, "0")}`;
};

/* Word-timed SRT — group N words per caption card (1 = strict word-by-word
 * "appearing words" style for whiteboards/faceless videos; 4-7 = normal captions). */
function buildSrt(text, duration, wordsPerLine = 4) {
  const timings = buildWordTimings(text, duration);
  if (!timings.length) return "";
  let out = [], n = 1;
  for (let i = 0; i < timings.length; i += wordsPerLine) {
    const chunk = timings.slice(i, i + wordsPerLine);
    out.push(`${n++}\n${srtTime(chunk[0].start)} --> ${srtTime(chunk[chunk.length - 1].end)}\n${chunk.map(c => c.word).join(" ")}\n`);
  }
  return out.join("\n");
}

function downloadText(name, content, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click();
}

async function runFalJob({ statusId, resultId, kind, modelId, input, prompt, cost }) {
  try {
    setStatus(statusId, "info", "Submitting job…");
    const result = await Providers.falRun(modelId, input, s => setStatus(statusId, "info", s));
    const url = Providers.extractMedia(result);
    if (!url) throw new Error("Job finished but no media URL found in: " + JSON.stringify(result).slice(0, 400));
    setStatus(statusId, "ok", `Done. Estimated cost: ~$${cost.toFixed(3)}`);
    showMedia(resultId, kind, url);
    State.addToGallery({ kind, url, prompt: prompt || "", model: modelId, cost });
  } catch (err) {
    setStatus(statusId, "err", err.message);
  }
}

/* ================================================================
 * VIEWS
 * ================================================================ */
const Views = {

  /* ---------------- dashboard ---------------- */
  dashboard() {
    const tiles = [
      ["director", "🎥", "Director", "Topic in → script, board, panels, narration & captions out"],
      ["characters", "🎭", "Character Lab", "Build consistent hosts & avatars — melanin-true by design"],
      ["image", "🖼️", "Image Studio", "Stills, thumbnails, curriculum art"],
      ["video", "🎥", "Video Studio", "Text/image → video, shorts & cinematic"],
      ["relight", "💡", "Relight", "Change the light in any clip — audio kept"],
      ["animate", "🎞️", "Restyle & Animate", "Photo ↔ realistic / 3D / anime, then animate"],
      ["lipsync", "👄", "Lip Sync", "Sync any voice to any face"],
      ["voice", "🗣️", "Voice Studio", "Clone your voice, generate narration"],
      ["music", "🎵", "Music Studio", "Scores, intros, full songs"],
      ["soundLibrary", "🔊", "Sound Library", "Ambient loops + free-library links"],
      ["mixer", "🎚️", "Audio Mixer", "Narration + music + ambient → one file"],
      ["whiteboard", "📋", "Whiteboard & Recap", "Word-reveal captions for faceless videos"],
      ["sequencer", "📽️", "Clip Sequencer", "Stitch clips into one video, captions optional"],
      ["avatar", "🧑‍🚀", "Avatar Pipeline", "Portrait → narration → talking host"],
      ["script", "✍️", "Script Builder", "Curriculum, shorts & longform beat sheets"],
      ["storyboard", "🎬", "Storyboard Studio", "Script → printable shot-by-shot board + batch animate"],
      ["thumbs", "🖼️", "Thumbnail Lab", "A/B test high-CTR thumbnail variants"],
      ["locations", "🗺️", "Location Scout", "Landmarks, museums, sets — a reusable library"],
      ["cost", "💰", "Cost Planner", "Budget a whole project before spending"],
    ];
    return `
      <div class="hero">
        <h2>Ramping It Up Studio</h2>
        <p>Your own AI production house — character-consistent, melanin-true, and pay-as-you-go.
        Create a character once in the <b>Character Lab</b>, then every studio keeps them looking
        like the same person across your whole channel.</p>
        <p class="muted mt">First time here? 1) Add your API keys in ⚙️ Settings → 2) Create a character → 3) Generate.</p>
      </div>
      <div class="tiles">${tiles.map(([v, i, n, d]) =>
        `<div class="tile" data-nav="${v}"><div class="t-ico">${i}</div><div class="t-name">${n}</div><div class="t-desc">${d}</div></div>`).join("")}
      </div>
      <div class="card mt">
        <h3>Recent creations</h3>
        ${State.gallery.length ? `<div class="gallery">${State.gallery.slice(0, 8).map(g => galleryItem(g)).join("")}</div>`
          : `<p class="muted">Nothing yet — your generated images, videos and audio will appear here.</p>`}
      </div>`;
  },

  /* ---------------- character lab ---------------- */
  characters() {
    const list = State.characters.map(c => {
      const tone = RIU_DATA.skinTones.find(t => t.mst === c.mst);
      return `<div class="card char-card">
        ${c.refImage ? `<img class="char-avatar" src="${c.refImage}" alt="">` : `<div class="char-avatar">🎭</div>`}
        <div class="char-body">
          <div class="char-name">${esc(c.name)}</div>
          <div>
            ${c.ethnicity ? `<span class="tag">${esc(c.ethnicity)}</span>` : ""}
            <span class="tag gold">MST ${c.mst}${tone ? " · " + esc(tone.desc.split(",")[0]) : ""}</span>
            ${c.hairStyle ? `<span class="tag">${esc(c.hairStyle)}</span>` : ""}
            <span class="tag">seed ${c.seed}</span>
          </div>
          <div class="char-token">${esc(compileCharacterToken(c))}</div>
          ${c.sheetUrl ? `
          <div class="mt"><span class="tag gold">✓ Turnaround sheet on file — used as the master reference in every generation</span></div>
          <div class="result-media"><img src="${c.sheetUrl}" alt="character sheet" style="max-height:220px"></div>
          <label class="f-label">Generate a single angle shot from the sheet</label>
          <div class="row">
            <select data-angle-sel="${c.id}">${RIU_DATA.angleShots.map((a, i) => `<option value="${i}">${a.name}</option>`).join("")}</select>
            <button class="btn sm fixed" data-gen-angle="${c.id}">📐 Generate angle (~$0.04)</button>
          </div>` : ""}
          <div class="mt row">
            <button class="btn sm fixed" data-gen-sheet="${c.id}">🧩 ${c.sheetUrl ? "Regenerate" : "Generate"} character sheet (all angles)</button>
            <button class="btn sm fixed" data-gen-portrait="${c.id}">🖼 Master portrait</button>
            <button class="btn sm danger fixed" data-del-char="${c.id}">Delete</button>
          </div>
          <div class="status" data-char-status="${c.id}"></div>
          <div class="result-media" data-char-result="${c.id}"></div>
        </div>
      </div>`;
    }).join("");

    return `
      <div class="page-head"><div class="page-title">🎭 Character Lab</div>
      <div class="page-desc">Define a character once — the studio compiles a precise <b>consistency token</b>,
      locks a seed, and builds a <b>multi-angle turnaround sheet</b> (front, profiles, back, ¾ views + close-ups)
      that anchors their likeness from <b>any camera angle</b> in every studio. The skin-tone system uses the
      Monk Skin Tone (MST) scale and adds lighting guidance so deep skin renders luminous, never ashy.
      <br><span class="muted">Workflow: create character → 🧩 generate the sheet → everything else stays consistent automatically.</span></div></div>

      ${list || `<p class="pill-note">No characters yet — create your first host below.</p>`}

      <div class="card">
        <h3>New character</h3>
        <div class="row">
          <div><label class="f-label">Name</label><input type="text" id="c-name" placeholder="e.g. Ms. Ruthy"></div>
          <div><label class="f-label">Age</label><input type="text" id="c-age" placeholder="e.g. in her 30s"></div>
          <div><label class="f-label">Gender / identity</label><input type="text" id="c-gender" placeholder="e.g. woman"></div>
        </div>
        <label class="f-label">Ethnicity / ancestry (optional — any race/ethnicity works; this pins it explicitly rather than leaving it to guesswork)</label>
        <input type="text" id="c-ethnicity" placeholder="e.g. Japanese, Irish, Nigerian, Mexican, Korean-American, mixed Filipino-Italian…">

        <label class="f-label">Skin tone — Monk Skin Tone scale (full range, fair to deepest — pick whichever matches)</label>
        <div class="tone-row" id="c-tones">
          ${RIU_DATA.skinTones.map(t => `<div class="tone" data-mst="${t.mst}" style="background:${t.hex}" title="${esc(t.desc)}"><span>${t.mst}</span></div>`).join("")}
        </div>

        <div class="row">
          <div><label class="f-label">Undertone</label>
            <select id="c-undertone">${RIU_DATA.undertones.map(u => `<option>${u}</option>`).join("")}</select></div>
          <div><label class="f-label">Hair texture</label>
            <select id="c-hairtex">${RIU_DATA.hairTextures.map(h => `<option value="${h.code}">${h.label}</option>`).join("")}</select></div>
          <div><label class="f-label">Hair style</label>
            <select id="c-hairstyle">${RIU_DATA.hairStyles.map(h => `<option>${h}</option>`).join("")}</select></div>
          <div><label class="f-label">Hair color</label><input type="text" id="c-haircolor" placeholder="e.g. dark brown with honey highlights"></div>
        </div>
        <div class="row">
          <div><label class="f-label">Eyes</label><input type="text" id="c-eyes" placeholder="e.g. warm dark brown, almond-shaped"></div>
          <div><label class="f-label">Face details</label><input type="text" id="c-face" placeholder="e.g. round face, dimples, gold hoop earrings"></div>
          <div><label class="f-label">Build</label><input type="text" id="c-build" placeholder="e.g. average height, curvy build"></div>
        </div>
        <div class="row">
          <div><label class="f-label">Signature wardrobe</label><input type="text" id="c-wardrobe" placeholder="e.g. mustard blazer over black tee"></div>
          <div><label class="f-label">Vibe / personality</label><input type="text" id="c-vibe" placeholder="e.g. warm, energetic teacher energy"></div>
        </div>
        <label class="f-label">Reference photo (optional but recommended — used by edit models for exact likeness)</label>
        <input type="file" id="c-ref" accept="image/*">
        <div class="mt"><button class="btn primary" id="c-save">＋ Create character</button></div>
        <div class="status" id="c-status"></div>
      </div>`;
  },

  /* ---------------- image studio ---------------- */
  image() {
    return `
      <div class="page-head"><div class="page-title">🖼️ Image Studio</div>
      <div class="page-desc">Cinematic stills, thumbnails and curriculum illustrations. Pick a character to keep your host consistent; pick a style; generate. If your character has a reference photo, use a Nano Banana Edit model for exact likeness.</div></div>
      <div class="card">
        ${charSelectHtml("img-char")}
        ${modelSelectHtml("img-model", "image", "imageEdit")}
        <div class="hint">Tip: when your character has a turnaround sheet or reference photo, pick an <b>Edit</b> model — it anchors on the sheet for exact likeness from any angle.</div>
        <label class="f-label">Setting (optional — from your 🗺️ Location Scout library)</label>
        <select id="img-loc"><option value="">— none —</option>${State.locations.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join("")}</select>
        <label class="f-label">Scene prompt</label>
        <textarea id="img-prompt" placeholder="e.g. standing at a bright modern whiteboard explaining fractions, medium shot, smiling at camera"></textarea>
        <label class="f-label">Style preset</label>
        ${chipsHtml("img-style", RIU_DATA.stylePresets)}
        <label class="f-label">Aspect ratio</label>
        ${chipsHtml("img-ar", RIU_DATA.aspectRatios, x => x.label)}
        <div class="mt"><button class="btn primary" id="img-go">✨ Generate image <span class="cost" id="img-cost"></span></button></div>
        <div class="status" id="img-status"></div>
        <div class="result-media" id="img-result"></div>
      </div>`;
  },

  /* ---------------- video studio ---------------- */
  video() {
    return `
      <div class="page-head"><div class="page-title">🎥 Video Studio</div>
      <div class="page-desc">Text→video or image→video. For character consistency, generate a still of your host in the Image Studio first, then animate it here (image→video). Finish with a 4K upscale pass for hero shots.</div></div>
      <div class="card">
        ${charSelectHtml("vid-char")}
        ${modelSelectHtml("vid-model", "video")}
        <label class="f-label">Start image (required for image→video models) — upload or paste a URL from your gallery</label>
        <div class="row">
          <input type="file" id="vid-image" accept="image/*">
          <input type="text" id="vid-image-url" placeholder="…or https:// image URL">
        </div>
        <label class="f-label">Motion / scene prompt</label>
        <textarea id="vid-prompt" placeholder="e.g. she gestures enthusiastically while explaining, classroom in background, natural motion"></textarea>
        <label class="f-label">Camera move</label>
        ${chipsHtml("vid-cam", RIU_DATA.cameraMoves)}
        <label class="f-label">Style</label>
        ${chipsHtml("vid-style", RIU_DATA.stylePresets)}
        <div class="row mt">
          <div><label class="f-label">Duration (seconds)</label><input type="number" id="vid-secs" value="5" min="3" max="10"></div>
          <div><label class="f-label">Aspect ratio</label>
            <select id="vid-ar">${RIU_DATA.aspectRatios.map(a => `<option value="${a.value}">${a.label}</option>`).join("")}</select></div>
        </div>
        <div class="mt"><button class="btn primary" id="vid-go">🎬 Generate video <span class="cost" id="vid-cost"></span></button></div>
        <div class="status" id="vid-status"></div>
        <div class="result-media" id="vid-result"></div>
      </div>
      <div class="card">
        <h3>⬆️ 4K upscale pass</h3>
        <p class="muted">Paste the URL of a finished video (from above or your gallery) to upscale it for hero shots and longform masters.</p>
        <label class="f-label">Video URL</label>
        <input type="text" id="up-url" placeholder="https://…mp4">
        ${modelSelectHtml("up-model", "upscale")}
        <div class="mt"><button class="btn" id="up-go">Upscale</button></div>
        <div class="status" id="up-status"></div>
        <div class="result-media" id="up-result"></div>
      </div>`;
  },

  /* ---------------- relight (Higgsfield-style, raw fal) ---------------- */
  relight() {
    return `
      <div class="page-head"><div class="page-title">💡 Relight Studio</div>
      <div class="page-desc">Change the lighting or drop your clip into any scene — Higgsfield's signature "Relight", done directly on the models with no middleman. Two steps with an approval gate: ① relight one frame (~$0.10) → check it → ② push that exact look onto the whole clip with your <b>original audio preserved</b> (~$0.17/sec). Clips must be 3–10 seconds.</div></div>
      <div class="card">
        <h3>① Relight a frame</h3>
        <label class="f-label">Your clip (3–10s) — or a single photo</label>
        <div class="row"><input type="file" id="rl-video" accept="video/*"><input type="file" id="rl-image" accept="image/*"></div>
        <div class="hint" id="rl-clipinfo"></div>
        <label class="f-label">New scene / lighting</label>
        <textarea id="rl-prompt" placeholder="e.g. golden-hour rooftop at dusk — hard warm key from front-left sculpts the face, cool blue rim from behind, city bokeh background, amber-and-teal grade, warm natural skin"></textarea>
        <div class="hint">Rules that make it work: keep the SAME framing/pose (only light + background change), give the light a direction, name a color palette, and keep a warm key on the face so skin stays true — never grey.</div>
        <div class="mt"><button class="btn primary" id="rl-still-go">💡 Relight frame (~$0.10)</button></div>
        <div class="status" id="rl-status"></div>
        <div class="result-media" id="rl-still-result"></div>
      </div>
      <div class="card">
        <h3>② Approve → relight the whole clip</h3>
        <p class="muted">Happy with the still above? This pushes that exact look onto every frame of your clip — identity, lip movement and original audio preserved (Kling O3 Pro Edit).</p>
        <label class="f-label">Background motion (subtle — name what should drift)</label>
        <input type="text" id="rl-motion" value="haze drifting slowly, background lights shimmering gently; subject stays locked, all original motion and timing preserved">
        <div class="mt"><button class="btn primary" id="rl-video-go" disabled>🎬 Relight full clip <span class="cost" id="rl-cost"></span></button></div>
        <div class="status" id="rl-vstatus"></div>
        <div class="result-media" id="rl-video-result"></div>
      </div>`;
  },

  /* ---------------- restyle & animate ---------------- */
  animate() {
    return `
      <div class="page-head"><div class="page-title">🎞️ Restyle & Animate</div>
      <div class="page-desc">Turn anything into anything: a photo into a 3D animated character, a drawing into a realistic human, your host into anime — identity preserved — then bring the result to life as video. Two steps: ① restyle (image) → ② animate (video).</div></div>
      <div class="card">
        <h3>① Restyle</h3>
        ${charSelectHtml("an-char", "Start from a character (uses their reference photo)…")}
        <label class="f-label">…or upload any image (photo, drawing, cartoon, product)</label>
        <input type="file" id="an-image" accept="image/*">
        <label class="f-label">Target style</label>
        ${chipsHtml("an-style", RIU_DATA.restylePresets)}
        <label class="f-label">Extra notes (optional)</label>
        <input type="text" id="an-notes" placeholder="e.g. keep the gold hoop earrings; brighter palette">
        <div class="mt"><button class="btn primary" id="an-go">🎨 Restyle (~$0.04)</button></div>
        <div class="status" id="an-status"></div>
        <div class="result-media" id="an-result"></div>
      </div>
      <div class="card">
        <h3>② Animate the result</h3>
        ${modelSelectHtml("an-vmodel", "video")}
        <label class="f-label">Motion prompt — what HAPPENS (different from what it looks like)</label>
        <textarea id="an-motion" placeholder="e.g. she turns her head and smiles at the camera, hair moving softly, slow cinematic dolly-in"></textarea>
        <div class="row">
          <div><label class="f-label">Duration (s)</label><input type="number" id="an-secs" value="5" min="3" max="10"></div>
          <div><label class="f-label">Aspect</label><select id="an-ar">${RIU_DATA.aspectRatios.map(a => `<option value="${a.value}">${a.label}</option>`).join("")}</select></div>
        </div>
        <div class="mt"><button class="btn primary" id="an-vgo" disabled>🎬 Animate <span class="cost" id="an-vcost"></span></button></div>
        <div class="status" id="an-vstatus"></div>
        <div class="result-media" id="an-vresult"></div>
      </div>`;
  },

  /* ---------------- editor's room ---------------- */
  editor() {
    return `
      <div class="page-head"><div class="page-title">✂️ Editor's Room</div>
      <div class="page-desc">The post-production half of your pipeline. This studio generates footage; these workflows turn footage into finished videos.</div></div>
      <div class="card">
        <h3>Perfect Cuts — automatic clean cuts for talking-head footage</h3>
        <p class="muted">This repo ships the <code class="k">perfect-cuts</code> skill (in the <code class="k">skills/</code> folder). Open this project in Claude Code, drop a raw recording, and say <b>"perfect cut this"</b> — it removes retakes, false starts and dead air with frame-accurate cuts, then delivers a package: finished MP4, Premiere/Resolve timeline XML, captions SRT, EDL, and a cut log you can revive cuts from.</p>
        <div class="divider"></div>
        <h3>The locked cutting rules (use these even when editing by hand)</h3>
        <table class="plain">
          <tr><th>Rule</th><th>Why</th></tr>
          <tr><td>Cut IN where the voice crosses <b>-30dB</b> — zero padding</td><td>Breaths and mouth noise live below -30dB; starting earlier reads as dead frames.</td></tr>
          <tr><td>Cut OUT where speech drops below <b>-38dB</b>, +1 frame</td><td>Word tails are quiet — cutting at -30dB clips the ends of words.</td></tr>
          <tr><td>A ≥0.25s pause mid-sentence = probable false start</td><td>Transcripts merge restarts and hide them; the waveform tells the truth. Keep the later take.</td></tr>
          <tr><td>Keep the LAST take of a repeated line</td><td>…unless an earlier take flows better into what follows. Read the words, don't count takes.</td></tr>
          <tr><td>Don't surgically remove "ums" mid-flow</td><td>It forces jump cuts that damage more than they fix.</td></tr>
        </table>
        <div class="divider"></div>
        <h3>Also in <code class="k">skills/</code></h3>
        <p class="muted"><b>media-gen</b> — generate images/video from the command line with the same 2026 model registry this app uses. <b>re-light</b> — the full relight pipeline with frame-exact audio-preserving conform (the in-app 💡 Relight Studio is the browser version of it).</p>
      </div>`;
  },

  /* ---------------- lip sync ---------------- */
  lipsync() {
    return `
      <div class="page-head"><div class="page-title">👄 Lip Sync Studio</div>
      <div class="page-desc">Sync a voice track to a face video. Combine with the Voice Studio (clone your voice → narrate) and Video Studio (animate your character) — or jump to the Avatar Pipeline which chains all three automatically.</div></div>
      <div class="card">
        ${modelSelectHtml("ls-model", "lipsync")}
        <label class="f-label">Face video</label>
        <div class="row"><input type="file" id="ls-video" accept="video/*"><input type="text" id="ls-video-url" placeholder="…or https:// video URL"></div>
        <label class="f-label">Voice audio</label>
        <div class="row"><input type="file" id="ls-audio" accept="audio/*"><input type="text" id="ls-audio-url" placeholder="…or https:// audio URL"></div>
        <div class="mt"><button class="btn primary" id="ls-go">👄 Sync lips</button></div>
        <div class="status" id="ls-status"></div>
        <div class="result-media" id="ls-result"></div>
      </div>`;
  },

  /* ---------------- voice studio ---------------- */
  voice() {
    return `
      <div class="page-head"><div class="page-title">🗣️ Voice Studio</div>
      <div class="page-desc">Powered by ElevenLabs. Clone your own voice from a 1–3 minute clean recording (Starter plan+), then generate narration in 30+ languages. Generated audio can go straight into Lip Sync or your editor.</div></div>
      <div class="card">
        <h3>FREE voiceover — no API key, $0</h3>
        <p class="muted">Six solid stock voices at zero cost (Pollinations). Great for drafts, timing passes and budget projects. For your own cloned voice, use ElevenLabs below.</p>
        <div class="row">
          <div><label class="f-label">Voice</label>
            <select id="fv-voice">${Providers.freeVoices.map(v => `<option>${v}</option>`).join("")}</select></div>
        </div>
        <label class="f-label">Script</label>
        <textarea id="fv-text" placeholder="Paste your narration…"></textarea>
        <div class="mt"><button class="btn primary" id="fv-go">🎙 Generate FREE narration</button></div>
        <div class="status" id="fv-status"></div>
        <div class="result-media" id="fv-result"></div>
      </div>
      <div class="card">
        <h3>Narrate (ElevenLabs — your cloned voice)</h3>
        <label class="f-label">Voice</label>
        <div class="row">
          <select id="vo-voice"><option value="">Load voices first…</option></select>
          <button class="btn sm fixed" id="vo-load">↻ Load my voices</button>
        </div>
        <label class="f-label">Script</label>
        <textarea id="vo-text" placeholder="Paste your narration script here…"></textarea>
        <div class="hint">~$0.10–0.30 per 1,000 characters depending on plan. This box: <span id="vo-chars">0</span> characters.</div>
        <div class="mt"><button class="btn primary" id="vo-go">🎙 Generate narration</button></div>
        <div class="status" id="vo-status"></div>
        <div class="result-media" id="vo-result"></div>
      </div>
      <div class="card">
        <h3>📝 Auto-captions (SRT) — word-timed, free</h3>
        <p class="muted">Captions boost Shorts retention massively. Upload the narration audio + paste its script — you get a word-timed .srt for CapCut, Premiere, Resolve, or YouTube. (For frame-exact captions from raw camera footage, use the perfect-cuts skill.)</p>
        <label class="f-label">Narration audio file</label>
        <input type="file" id="cap-audio" accept="audio/*">
        <label class="f-label">Exact script that was spoken</label>
        <textarea id="cap-text"></textarea>
        <div class="row">
          <div class="fixed"><label class="f-label">Words per caption</label>
            <select id="cap-wpl"><option value="3">3 — Shorts style</option><option value="4" selected>4 — snappy</option><option value="7">7 — longform</option></select></div>
        </div>
        <div class="mt"><button class="btn primary" id="cap-go">📝 Build captions</button></div>
        <div class="status" id="cap-status"></div>
        <pre id="cap-preview" class="muted" style="white-space:pre-wrap;font-size:12px;margin-top:10px"></pre>
      </div>
      <div class="card">
        <h3>🎭 Multi-voice dialogue — one downloadable file</h3>
        <p class="muted">Write a script with speaker names, assign a voice to each speaker, and generate one combined audio file — perfect for two-host explainer videos, interview-style edutainment, or character conversations.</p>
        <label class="f-label">Script (format: <code class="k">Speaker: line</code>, one per line)</label>
        <textarea id="dlg-script" placeholder="Maya: Have you ever wondered where rain comes from?
Jordan: Actually, yeah — where DOES it go after it falls?
Maya: Let's find out together."></textarea>
        <div class="mt"><button class="btn sm" id="dlg-scan">🔍 Detect speakers</button></div>
        <div id="dlg-speakers" class="mt"></div>
        <label class="f-label">Gap between lines (seconds)</label>
        <input type="number" id="dlg-gap" value="0.4" min="0" max="2" step="0.1" style="max-width:120px">
        <div class="mt"><button class="btn primary" id="dlg-go">🎬 Generate combined dialogue file</button></div>
        <div class="status" id="dlg-status"></div>
        <div class="result-media" id="dlg-result"></div>
      </div>
      <div class="card">
        <h3>Clone a voice</h3>
        <p class="muted">Upload 1–3 clean voice samples (each 30s–3min, no background noise/music). The clone appears in your voice list above.</p>
        <label class="f-label">Voice name</label><input type="text" id="vc-name" placeholder="e.g. Ruthy Narration Voice">
        <label class="f-label">Samples</label><input type="file" id="vc-files" accept="audio/*" multiple>
        <div class="mt"><button class="btn" id="vc-go">🧬 Clone voice</button></div>
        <div class="status" id="vc-status"></div>
      </div>
      <div class="card">
        <h3>ElevenLabs pricing quick-reference</h3>
        <table class="plain"><tr><th>Tier</th><th>Price</th><th>Included</th><th>Cloning</th></tr>
        ${RIU_DATA.voicePricing.map(p => `<tr><td>${p.tier}</td><td class="price">${p.price}</td><td>${p.chars}</td><td>${p.clone}</td></tr>`).join("")}
        </table>
      </div>`;
  },

  /* ---------------- music ---------------- */
  music() {
    return `
      <div class="page-head"><div class="page-title">🎵 Music Studio</div>
      <div class="page-desc">Background scores, intro/outro stingers and full songs with lyrics — royalty questions disappear when you generate your own.</div></div>
      <div class="card">
        ${modelSelectHtml("mu-model", "music")}
        <label class="f-label">Describe the music</label>
        <textarea id="mu-prompt" placeholder="e.g. upbeat playful educational background music, light percussion, marimba and claps, 100 BPM, loopable, no vocals"></textarea>
        <label class="f-label">Lyrics (MiniMax Music only — leave blank for instrumental)</label>
        <textarea id="mu-lyrics" placeholder="[Verse]…"></textarea>
        <div class="mt"><button class="btn primary" id="mu-go">🎶 Generate track</button></div>
        <div class="status" id="mu-status"></div>
        <div class="result-media" id="mu-result"></div>
      </div>`;
  },

  /* ---------------- avatar pipeline ---------------- */
  avatar() {
    return `
      <div class="page-head"><div class="page-title">🧑‍🚀 Avatar Pipeline</div>
      <div class="page-desc">The full talking-host chain in one click: <b>① portrait</b> of your character → <b>② animate</b> it subtly → <b>③ narrate</b> your script in your (cloned) voice → <b>④ lip-sync</b>. The result is a presenter clip ready for your curriculum or channel.</div></div>
      <div class="card">
        ${charSelectHtml("av-char", "Character (required)")}
        <label class="f-label">Voice</label>
        <div class="row">
          <select id="av-voice"><option value="">Load voices…</option></select>
          <button class="btn sm fixed" id="av-load">↻ Load voices</button>
        </div>
        <label class="f-label">What should they say?</label>
        <textarea id="av-text" placeholder="Welcome back to class! Today we're learning about…"></textarea>
        <label class="f-label">Setting / framing</label>
        <input type="text" id="av-setting" value="professional studio background, warm lighting, chest-up framing, looking at camera">
        <div class="row mt">
          <div><label class="f-label">Aspect</label><select id="av-ar"><option value="9:16">9:16 Shorts</option><option value="16:9">16:9 YouTube</option></select></div>
        </div>
        <div class="mt"><button class="btn primary" id="av-go">🚀 Build talking avatar (runs 4 steps)</button></div>
        <div class="status" id="av-status"></div>
        <div class="result-media" id="av-result"></div>
        <p class="hint mt">Estimated total: ~$0.40–0.80 per 15-second presenter clip with default models — versus $2–5 on credit-based platforms.</p>
      </div>`;
  },

  /* ---------------- script builder ---------------- */
  script() {
    const saved = State.scripts.map((s, i) => `
      <div class="card scene-card">
        <div class="row"><b class="fixed">${esc(s.title)}</b><span class="muted fixed">${esc(s.template)}</span>
        <span class="fixed right" style="margin-left:auto"><button class="btn sm danger" data-del-script="${i}">Delete</button></span></div>
        <table class="plain mt"><tr><th>Beat</th><th>Target</th><th>Your content</th></tr>
        ${s.beats.map(b => `<tr><td><b>${esc(b.beat)}</b><div class="hint">${esc(b.tip)}</div></td><td>${b.secs}s</td><td>${esc(b.content || "—")}</td></tr>`).join("")}
        </table>
      </div>`).join("");

    return `
      <div class="page-head"><div class="page-title">✍️ Script & Scene Builder</div>
      <div class="page-desc">Proven structures for each format. Pick a template, fill in your beats, and use each beat as the prompt for a scene in the Image/Video studios.</div></div>
      <div class="card">
        <label class="f-label">Template</label>
        <select id="sc-template">${RIU_DATA.scriptTemplates.map(t => `<option value="${t.id}">${t.name}</option>`).join("")}</select>
        <p class="muted mt" id="sc-desc"></p>
        <label class="f-label">Video title / topic</label>
        <input type="text" id="sc-title" placeholder="e.g. Why the Water Cycle Never Stops">
        <div id="sc-beats"></div>
        <div class="mt row">
          <button class="btn primary fixed" id="sc-save">💾 Save script</button>
          <button class="btn fixed" id="sc-export">⬇ Export as text</button>
        </div>
      </div>
      ${saved}`;
  },

  /* ---------------- director: one-click pipeline ---------------- */
  director() {
    return `
      <div class="page-head"><div class="page-title">🎥 Director</div>
      <div class="page-desc">The one-click pipeline: type a topic and the Director drafts the script (free writing model), builds a storyboard with your character, generates every panel, records the narration, and produces word-timed captions — ready for batch animation. Script + images can run <b>100% free</b>; video animation is the only paid step and is always quoted first.</div></div>
      <div class="card scene-card">
        <h3>🎬 The Director's Checklist (enforced by this pipeline)</h3>
        <table class="plain">
          <tr><td><b>1. Lock the look</b></td><td>One proof shot is generated FIRST. Nothing else renders until you approve it — re-roll for pennies until it's right, then that look anchors every panel.</td></tr>
          <tr><td><b>2. Pacing is everything</b></td><td>The script plan assigns each scene a target length (3–10s) based on its job. Batch animation renders each shot at its planned length — no flat 5s-everything pacing.</td></tr>
          <tr><td><b>3. Every scene has an emotional job</b></td><td>Each scene is broken down with the feeling it must deliver (curiosity, tension, awe, relief…). The emotion is shown on the panel and baked into its animation prompt.</td></tr>
          <tr><td><b>4. Keep the action continuous</b></td><td>Every animation prompt carries "action flows continuously from the previous shot" so cuts feel like one moving story, not disconnected clips.</td></tr>
        </table>
      </div>
      <div class="card">
        <div class="row">
          <div style="flex:2"><label class="f-label">Topic</label>
            <input type="text" id="dir-topic" placeholder="e.g. Why the water cycle never stops — for 4th graders"></div>
          <div><label class="f-label">Format</label>
            <select id="dir-format">${RIU_DATA.directorFormats.map((f, i) => `<option value="${i}">${f.name}</option>`).join("")}</select></div>
        </div>
        ${charSelectHtml("dir-char", "Host character (recommended)")}
        <div class="row">
          <div>${modelSelectHtml("dir-model", "image", "imageEdit")}</div>
          <div><label class="f-label">Narration voice (free)</label>
            <select id="dir-voice">${Providers.freeVoices.map(v => `<option>${v}</option>`).join("")}</select>
            <div class="hint">Want your cloned voice instead? Run the narration in the Voice Studio after — the script will be saved there.</div></div>
        </div>
        <label class="f-label">Visual style</label>
        ${chipsHtml("dir-style", RIU_DATA.stylePresets)}
        <div class="mt"><button class="btn primary" id="dir-go">🎬 Direct it</button></div>
        <div class="status" id="dir-status"></div>
        <div id="dir-log" class="mt"></div>
        <div id="dir-out" class="mt"></div>
      </div>`;
  },

  /* ---------------- thumbnail A/B lab ---------------- */
  thumbs() {
    return `
      <div class="page-head"><div class="page-title">🖼️ Thumbnail A/B Lab</div>
      <div class="page-desc">The thumbnail decides whether anyone sees the video. Generate 2–4 variants using proven high-CTR compositions, compare side by side, upload your favorites to YouTube's own Test & Compare. Tip: GPT Image 2 renders title text best; free models are fine for exploring compositions.</div></div>
      <div class="card">
        ${charSelectHtml("th-char")}
        ${modelSelectHtml("th-model", "image", "imageEdit")}
        <div class="row">
          <div style="flex:2"><label class="f-label">Title text on the thumbnail (3–5 words max)</label>
            <input type="text" id="th-headline" placeholder="e.g. WATER NEVER DIES?!"></div>
          <div><label class="f-label">Emotion</label>
            <select id="th-emotion">${RIU_DATA.thumbEmotions.map(e => `<option>${e}</option>`).join("")}</select></div>
        </div>
        <label class="f-label">Compositions to test (each selected = one variant)</label>
        ${chipsHtml("th-comp", RIU_DATA.thumbCompositions)}
        <label class="f-label">Extra context (optional)</label>
        <input type="text" id="th-notes" placeholder="e.g. holding a glowing water droplet, classroom background">
        <div class="mt"><button class="btn primary" id="th-go">🧪 Generate variants</button></div>
        <div class="status" id="th-status"></div>
        <div class="gallery mt" id="th-grid"></div>
      </div>`;
  },

  /* ---------------- storyboard studio ---------------- */
  storyboard() {
    const board = State.storyboards.find(b => b.id === State.activeBoardId);
    const scriptOpts = State.scripts.map((s, i) => `<option value="${i}">${esc(s.title)} (${esc(s.template)})</option>`).join("");

    const boardEditor = board ? `
      <div class="card">
        <div class="row">
          <h3 class="fixed" style="margin:0">🎬 ${esc(board.title)}</h3>
          <span class="fixed" style="margin-left:auto">
            <button class="btn sm" id="sb-gen-all">✨ Generate all missing panels</button>
            <button class="btn sm" id="sb-print">🖨 Print / save PDF</button>
            <button class="btn sm" id="sb-close">Close</button>
          </span>
        </div>
        <div class="status" id="sb-status"></div>
        <div class="board-grid mt">
          ${board.panels.map((p, i) => `
            <div class="panel">
              <div class="panel-img" data-panel-img="${i}">
                ${p.imgUrl ? `<img src="${p.imgUrl}" alt="panel ${i + 1}">` : `<div class="panel-empty">panel ${i + 1}</div>`}
              </div>
              <div class="panel-meta">
                <div class="row" style="gap:6px">
                  <span class="fixed panel-num">${i + 1}</span>
                  <select data-panel-shot="${i}" class="fixed" style="width:auto">${RIU_DATA.shotTypes.map(s =>
                    `<option${s === p.shot ? " selected" : ""}>${s}</option>`).join("")}</select>
                  ${p.emotion ? `<span class="tag fixed">${esc(p.emotion)}</span>` : ""}
                  ${p.secs ? `<span class="tag gold fixed">${p.secs}s</span>` : ""}
                  <button class="btn sm fixed" data-panel-gen="${i}" style="margin-left:auto">🎨</button>
                </div>
                <textarea data-panel-desc="${i}" placeholder="What happens in this panel…">${esc(p.desc)}</textarea>
                ${p.videoUrl ? `<a href="${p.videoUrl}" target="_blank" rel="noopener" style="color:var(--mint);font-size:12px">▶ animated clip ready — open</a>` : ""}
              </div>
            </div>`).join("")}
        </div>
        <div class="mt row">
          <button class="btn sm fixed" id="sb-add-panel">＋ Add panel</button>
          <span class="muted fixed">Panels save automatically. 🎨 regenerates one panel; edits to text are picked up on the next generate.</span>
        </div>
        <div class="divider"></div>
        <h3>📦 Batch-animate this board</h3>
        <p class="muted">Queues an image→video job for every panel that has art. The total cost is quoted before anything runs.</p>
        <div class="row">
          <div>${modelSelectHtml("sb-vmodel", "video")}</div>
          <div class="fixed"><label class="f-label">Secs/clip</label><input type="number" id="sb-vsecs" value="5" min="3" max="10" style="width:80px"></div>
        </div>
        <label class="f-label">Motion notes added to every clip</label>
        <input type="text" id="sb-vmotion" value="natural cinematic motion, subtle camera movement">
        <div class="mt"><button class="btn primary" id="sb-batch">📦 Batch-animate <span class="cost" id="sb-batch-cost"></span></button></div>
        <div class="status" id="sb-batch-status"></div>
      </div>` : "";

    return `
      <div class="page-head"><div class="page-title">🎬 Storyboard Studio</div>
      <div class="page-desc">Plan every shot before you spend a cent on video. Import a saved script (each beat becomes a panel) or start blank, generate consistent panel art with your character, then print the board or use each approved panel as the start-image for the Video Studio.</div></div>
      ${boardEditor}
      <div class="card">
        <h3>New storyboard</h3>
        <div class="row">
          <div><label class="f-label">Title</label><input type="text" id="sb-title" placeholder="e.g. Water Cycle — Episode 1"></div>
          <div><label class="f-label">Start from</label>
            <select id="sb-source">
              <option value="">Blank — 6 panels</option>
              <option value="blank9">Blank — 9 panels</option>
              <option value="blank12">Blank — 12 panels</option>
              ${scriptOpts ? `<optgroup label="Your saved scripts">${scriptOpts}</optgroup>` : ""}
            </select></div>
        </div>
        ${charSelectHtml("sb-char")}
        ${modelSelectHtml("sb-model", "image", "imageEdit")}
        <label class="f-label">Art style</label>
        ${chipsHtml("sb-style", RIU_DATA.stylePresets)}
        <div class="mt"><button class="btn primary" id="sb-create">＋ Create storyboard</button></div>
      </div>
      ${State.storyboards.length ? `<div class="card"><h3>Saved storyboards</h3>
        <table class="plain">${State.storyboards.map(b => `<tr>
          <td><b>${esc(b.title)}</b></td><td>${b.panels.length} panels</td>
          <td class="right">
            <button class="btn sm" data-open-board="${b.id}">Open</button>
            <button class="btn sm danger" data-del-board="${b.id}">Delete</button>
          </td></tr>`).join("")}</table></div>` : ""}`;
  },

  /* ---------------- location scout ---------------- */
  locations() {
    return `
      <div class="page-head"><div class="page-title">🗺️ Location Scout</div>
      <div class="page-desc">Build a library of establishing shots and set plates — city landmarks, museums & exhibitions, classrooms, nature, historical eras. Saved locations appear as a "Setting" option in the Image Studio so your character can be placed anywhere, consistently.</div></div>
      <div class="card">
        <h3>Scout a location</h3>
        <label class="f-label">Ideas by category (click to use as a starting point)</label>
        ${chipsHtml("loc-cat", RIU_DATA.locationCategories, x => x.name)}
        <div class="hint" id="loc-hint"></div>
        <label class="f-label">Describe the place</label>
        <textarea id="loc-desc" placeholder="e.g. the Eiffel Tower esplanade at golden hour, warm haze, wide cinematic view"></textarea>
        <div class="row">
          <div><label class="f-label">Save as (name)</label><input type="text" id="loc-name" placeholder="e.g. Paris — Eiffel golden hour"></div>
          <div>${modelSelectHtml("loc-model", "image")}</div>
        </div>
        <div class="mt"><button class="btn primary" id="loc-go">🗺 Generate location plate</button></div>
        <div class="status" id="loc-status"></div>
        <div class="result-media" id="loc-result"></div>
        <div class="mt"><button class="btn" id="loc-save" disabled>💾 Save to library</button></div>
      </div>
      ${State.locations.length ? `<div class="card"><h3>Your location library</h3>
        <div class="gallery">${State.locations.map(l => `
          <div class="g-item"><img src="${l.url}" loading="lazy">
          <div class="g-meta"><b>${esc(l.name)}</b><br>${esc(l.desc.slice(0, 50))}…<br>
          <a href="${l.url}" target="_blank" rel="noopener">open ↗</a> · <a href="#" data-del-loc="${l.id}">delete</a></div></div>`).join("")}
        </div></div>` : ""}`;
  },

  /* ---------------- sound library ---------------- */
  soundLibrary() {
    return `
      <div class="page-head"><div class="page-title">🔊 Sound Library</div>
      <div class="page-desc">Ambient beds and natural sound loops for backgrounds — generate your own (~$0.03/track, seamless loop) or pull from genuinely free libraries when $0 matters most.</div></div>
      <div class="card">
        <h3>Generate an ambient / nature loop</h3>
        <label class="f-label">Preset (click to load, then tweak)</label>
        ${chipsHtml("snd-preset", RIU_DATA.ambientPresets)}
        <label class="f-label">Description</label>
        <textarea id="snd-prompt" placeholder="e.g. gentle rain on a window, seamless loop, no music, no voices"></textarea>
        <div class="mt"><button class="btn primary" id="snd-go">🎵 Generate ambient track (~$0.03)</button></div>
        <div class="status" id="snd-status"></div>
        <div class="result-media" id="snd-result"></div>
        <div class="mt"><button class="btn" id="snd-save" disabled>💾 Save to library</button></div>
      </div>
      ${State.sounds?.length ? `<div class="card"><h3>Your saved ambient tracks</h3>
        <table class="plain">${State.sounds.map(s => `<tr><td>${esc(s.name)}</td>
          <td class="right"><audio src="${s.url}" controls style="height:32px"></audio></td>
          <td class="right"><a href="#" data-del-sound="${s.id}">delete</a></td></tr>`).join("")}</table></div>` : ""}
      <div class="card">
        <h3>Genuinely free libraries (no API, $0)</h3>
        <p class="muted">For when a hand-picked pre-made track beats a generated one, or you want zero cost with zero limits. Licenses vary by track — always check before commercial use.</p>
        <table class="plain">${RIU_DATA.royaltyFreeSources.map(s => `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.url)}</td><td class="muted">${esc(s.note)}</td></tr>`).join("")}</table>
      </div>`;
  },

  /* ---------------- audio mixer ---------------- */
  mixer() {
    return `
      <div class="page-head"><div class="page-title">🎚️ Audio Mixer</div>
      <div class="page-desc">Combine narration + music + ambient sound into one downloadable file — the layered soundtrack every finished video needs. Upload each layer (or use files you've already generated), set the balance, and render.</div></div>
      <div class="card">
        <h3>🗣️ Narration (required)</h3>
        <input type="file" id="mx-voice" accept="audio/*">
        <label class="f-label">Volume</label>
        <input type="range" id="mx-voice-vol" min="0" max="150" value="100">
      </div>
      <div class="card">
        <h3>🎵 Music bed (optional)</h3>
        <input type="file" id="mx-music" accept="audio/*">
        <label class="f-label">Volume <span class="hint">(keep low — 15–30% under narration is typical)</span></label>
        <input type="range" id="mx-music-vol" min="0" max="150" value="20">
        <label class="row" style="align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="mx-music-loop" style="width:auto" checked> Loop to fill the full length</label>
      </div>
      <div class="card">
        <h3>🌿 Ambient / background sound (optional)</h3>
        <input type="file" id="mx-ambient" accept="audio/*">
        <label class="f-label">Volume</label>
        <input type="range" id="mx-ambient-vol" min="0" max="150" value="25">
        <label class="row" style="align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="mx-ambient-loop" style="width:auto" checked> Loop to fill the full length</label>
      </div>
      <div class="card">
        <div class="mt"><button class="btn primary" id="mx-go">🎚️ Mix down to one file</button></div>
        <div class="status" id="mx-status"></div>
        <div class="result-media" id="mx-result"></div>
      </div>`;
  },

  /* ---------------- whiteboard studio ---------------- */
  whiteboard() {
    return `
      <div class="page-head"><div class="page-title">📋 Whiteboard & Recap Studio</div>
      <div class="page-desc">Word-by-word text reveal timed to your narration — for whiteboard-style explainers, faceless videos, and end-of-lesson recaps. Preview it live, then record an actual downloadable video.</div></div>
      <div class="card">
        <label class="f-label">Recap / lesson script</label>
        <textarea id="wb-text" placeholder="Today we learned that water never disappears — it just changes form and location, over and over, forever. That's the water cycle."></textarea>
        <div class="row">
          <div><label class="f-label">Background style</label>
            <select id="wb-style">${RIU_DATA.whiteboardStyles.map(s => `<option value="${s.id}">${s.name}</option>`).join("")}</select></div>
          <div><label class="f-label">Words per reveal</label>
            <select id="wb-wpl"><option value="1">1 — strict word-by-word</option><option value="2" selected>2 — snappy</option><option value="4">4 — phrase-by-phrase</option></select></div>
        </div>
        <label class="f-label">Narration</label>
        <div class="row">
          <input type="file" id="wb-audio" accept="audio/*">
          <select id="wb-voice">${Providers.freeVoices.map(v => `<option>${v}</option>`).join("")}</select>
          <button class="btn sm fixed" id="wb-narrate">🎙 Generate free narration from the script</button>
        </div>
        <div class="hint" id="wb-audioinfo"></div>
        <canvas id="wb-canvas" width="1280" height="720" style="width:100%;max-width:640px;border-radius:10px;border:1px solid var(--line);margin-top:14px;display:block"></canvas>
        <div class="mt row">
          <button class="btn fixed" id="wb-preview" disabled>▶ Preview</button>
          <button class="btn primary fixed" id="wb-record" disabled>🎬 Record video (.webm)</button>
          <button class="btn fixed" id="wb-srt" disabled>⬇ Word-timed captions (.srt)</button>
        </div>
        <div class="status" id="wb-status"></div>
        <div class="result-media" id="wb-result"></div>
        <p class="hint">Recording uses your browser's built-in camera/screen recording engine (MediaRecorder) — nothing uploads anywhere. Works best in Chrome/Edge. The .webm plays everywhere and most editors (CapCut, Premiere, Resolve) import it directly.</p>
      </div>`;
  },

  /* ---------------- clip sequencer ---------------- */
  sequencer() {
    return `
      <div class="page-head"><div class="page-title">📽️ Clip Sequencer</div>
      <div class="page-desc">Stitch your generated clips into one continuous video, right in your browser (ffmpeg.wasm — no upload, no server, $0). This isn't Shorts-specific: feed it 16:9 clips for a longform video, 9:16 for a Short/Reel, whatever you pick as the output size. Captions are optional — burn them in, or skip burning and just grab the matching .srt for your editor instead.</div></div>
      <div class="card">
        <h3>Clips (in order)</h3>
        <div id="sq-clips"></div>
        <div class="mt"><button class="btn sm" id="sq-add">＋ Add clip</button></div>
        <label class="f-label">Output size</label>
        <select id="sq-size">
          <option value="1280x720">1280×720 (16:9 — YouTube / cinematic)</option>
          <option value="720x1280">720×1280 (9:16 — Shorts / Reels / TikTok)</option>
          <option value="1080x1080">1080×1080 (1:1 — Square)</option>
        </select>
        <label class="f-label">Caption script (optional — the whole stitched video's dialogue, in order)</label>
        <textarea id="sq-caption-text" placeholder="Leave blank for no captions at all."></textarea>
        <div class="row">
          <label class="row" style="align-items:center;gap:8px"><input type="checkbox" id="sq-captions" style="width:auto"> 🔥 Burn captions into the video</label>
          <select id="sq-caption-wpl"><option value="1">1 word per reveal</option><option value="3" selected>3 words per reveal</option><option value="5">5 words per reveal</option></select>
        </div>
        <p class="hint">Leave the checkbox OFF and you still get the stitched video with no captions baked in — write a script anyway and you can download a matching .srt afterward for soft captions in CapCut/Premiere/Resolve/YouTube.</p>
        <div class="mt"><button class="btn primary" id="sq-go">🧵 Stitch clips together</button></div>
        <div class="status" id="sq-status"></div>
        <div id="sq-log" class="muted" style="font-size:11.5px;white-space:pre-wrap;margin-top:8px"></div>
        <div class="result-media" id="sq-result"></div>
        <div class="mt" id="sq-srtrow" style="display:none"><button class="btn" id="sq-srt-go">⬇ Download matching .srt (soft captions)</button></div>
        <p class="hint">First use downloads the video engine (~30MB, one-time, cached by your browser afterward). Works in Chrome, Edge, and Firefox; caption burn-in additionally needs your browser's video capture (best in Chrome/Edge). All clips need an audio track — silent is fine, missing is not.</p>
      </div>`;
  },

  /* ---------------- cost planner ---------------- */
  cost() {
    const img = models("image"), vid = models("video"), mus = models("music"), lip = models("lipsync");
    return `
      <div class="page-head"><div class="page-title">💰 Cost Planner</div>
      <div class="page-desc">Know the bill before you generate. Estimate a full project below, and compare raw provider prices — you pay the model makers directly, with no credit-system markup.</div></div>
      <p class="pill-note">💚 Completely-free mode: images (Pollinations) + voiceover (free voices) + scripts cost $0. Only video generation has real compute cost — the cheapest quality path is Kling v3 Pro at ~$0.17/sec.</p>
      <div class="card">
        <h3>Project estimator</h3>
        <div class="row">
          <div><label class="f-label"># of scenes (video clips)</label><input type="number" id="cp-scenes" value="8" min="0"></div>
          <div><label class="f-label">Seconds per clip</label><input type="number" id="cp-secs" value="5" min="1"></div>
          <div><label class="f-label">Takes per scene (retries)</label><input type="number" id="cp-takes" value="2" min="1"></div>
        </div>
        <div class="row">
          <div><label class="f-label">Video model</label><select id="cp-vmodel">${vid.map(m => `<option value="${m.cost}">${esc(m.name)}</option>`).join("")}</select></div>
          <div><label class="f-label"># images (thumbs, stills)</label><input type="number" id="cp-images" value="6" min="0"></div>
          <div><label class="f-label"># music tracks</label><input type="number" id="cp-music" value="1" min="0"></div>
        </div>
        <div class="row">
          <div><label class="f-label">Narration characters</label><input type="number" id="cp-chars" value="4000" min="0"></div>
          <div><label class="f-label">Lip-synced seconds</label><input type="number" id="cp-lip" value="30" min="0"></div>
          <div><label class="f-label">4K-upscaled seconds</label><input type="number" id="cp-up" value="0" min="0"></div>
        </div>
        <div class="mt"><button class="btn primary" id="cp-go">Calculate</button></div>
        <div class="status" id="cp-status"></div>
      </div>
      <div class="card"><h3>Raw price reference</h3>
        <table class="plain"><tr><th>Capability</th><th>Model</th><th>Est. price</th></tr>
          ${[...img.map(m => ["Image", m]), ...vid.map(m => ["Video", m]), ...lip.map(m => ["Lip sync", m]), ...mus.map(m => ["Music", m])]
            .map(([k, m]) => `<tr><td>${k}</td><td>${esc(m.name)}</td><td class="price">~$${m.cost}/${m.unit}</td></tr>`).join("")}
        </table>
      </div>`;
  },

  /* ---------------- gallery ---------------- */
  galleryView() {
    return `
      <div class="page-head"><div class="page-title">🗂 Gallery</div>
      <div class="page-desc">Everything you've generated in this browser. Media is hosted by the provider and <b>URLs can expire after a few days</b> — use the Asset Vault below to pull everything onto your computer, then drop the folder into Google Drive or Dropbox for permanent, shareable storage.</div></div>
      ${State.gallery.length ? `
      <div class="card">
        <h3>🗄️ Asset Vault</h3>
        <div class="row">
          <button class="btn primary fixed" id="gal-dl-all">⬇ Download everything (${State.gallery.length} items)</button>
          <button class="btn fixed danger" id="gal-clear">Clear gallery list</button>
        </div>
        <div class="status" id="gal-status"></div>
        <p class="hint">Files download one by one into your Downloads folder. Move them into a synced Google Drive / Dropbox folder and they're safe forever and shareable with collaborators.</p>
      </div>
      <div class="gallery">${State.gallery.map(g => galleryItem(g)).join("")}</div>`
        : `<div class="card"><p class="muted">Nothing here yet.</p></div>`}`;
  },

  /* ---------------- settings ---------------- */
  settings() {
    const keys = Providers.keys();
    return `
      <div class="page-head"><div class="page-title">⚙️ Settings</div>
      <div class="page-desc">Keys are stored only in this browser (localStorage) and sent only to the provider you're calling.</div></div>
      <div class="card">
        <h3>API keys</h3>
        <label class="f-label">fal.ai API key — powers image, video, lip sync, music, upscale</label>
        <input type="password" id="set-fal" value="${esc(keys.fal)}" placeholder="Get one at fal.ai/dashboard/keys">
        <label class="f-label">ElevenLabs API key — powers voice cloning & narration</label>
        <input type="password" id="set-eleven" value="${esc(keys.eleven)}" placeholder="Get one at elevenlabs.io → Settings → API keys">
        <div class="mt"><button class="btn primary" id="set-save">Save keys</button></div>
        <div class="status" id="set-status"></div>
      </div>
      <div class="card">
        <h3>✅ Test my setup (live)</h3>
        <p class="muted">Runs real generations with your keys so you know everything works before a big project. Each step tells you exactly what passed or failed.</p>
        <div class="row">
          <button class="btn fixed" id="test-free">1️⃣ Test FREE image ($0)</button>
          <button class="btn fixed" id="test-fal">2️⃣ Test fal.ai image (~$0.04)</button>
          <button class="btn fixed" id="test-eleven">3️⃣ Test ElevenLabs ($0)</button>
        </div>
        <div class="status" id="test-status"></div>
        <div class="result-media" id="test-result"></div>
        <div class="divider"></div>
        <p class="muted">Step 4 — the real video test. Uses the image from step 2 and animates it for 5 seconds with Kling v3 Pro.</p>
        <button class="btn primary" id="test-video" disabled>4️⃣ Test video (~$0.84 — the only paid test)</button>
        <div class="status" id="test-vstatus"></div>
        <div class="result-media" id="test-vresult"></div>
      </div>
      <div class="card">
        <h3>Model registry (advanced)</h3>
        <p class="muted">When providers release new models, update IDs/prices here — no code changes needed. JSON format matching the built-in registry.</p>
        <textarea id="set-models" style="min-height:200px">${esc(JSON.stringify(Store.get("modelOverrides", RIU_DATA.models), null, 2))}</textarea>
        <div class="mt row">
          <button class="btn fixed" id="set-models-save">Save registry</button>
          <button class="btn fixed" id="set-models-reset">Reset to defaults</button>
        </div>
      </div>
      <div class="card">
        <h3>Backup</h3>
        <div class="row">
          <button class="btn fixed" id="set-export">⬇ Export studio data</button>
          <input type="file" id="set-import" accept=".json" class="fixed">
        </div>
        <p class="hint">Exports characters, scripts, gallery links and model overrides (not API keys).</p>
      </div>`;
  },
};

function galleryItem(g) {
  const media = g.kind === "image" ? `<img src="${g.url}" loading="lazy">`
    : g.kind === "video" ? `<video src="${g.url}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`
    : `<div style="aspect-ratio:1;display:grid;place-items:center;font-size:34px">🎵</div>`;
  return `<div class="g-item">${media}
    <div class="g-meta">${esc((g.prompt || g.model || "").slice(0, 60))}<br>
    <a href="${g.url}" target="_blank" rel="noopener">open ↗</a> · ~$${(g.cost || 0).toFixed(3)}</div></div>`;
}

/* ================================================================
 * WIRING (per-view bindings)
 * ================================================================ */
const Bind = {

  characters() {
    let selMst = 6;
    const tones = $("#c-tones");
    $$(".tone", tones)[5].classList.add("on");
    tones.addEventListener("click", e => {
      const t = e.target.closest(".tone"); if (!t) return;
      $$(".tone", tones).forEach(x => x.classList.remove("on"));
      t.classList.add("on"); selMst = +t.dataset.mst;
    });

    $("#c-save").onclick = async () => {
      const name = $("#c-name").value.trim();
      if (!name) return setStatus("c-status", "err", "Give your character a name.");
      let refImage = null;
      const f = $("#c-ref").files[0];
      if (f) refImage = await Providers.fileToDataUri(f);
      State.characters.push({
        id: "c" + Date.now(),
        name, age: $("#c-age").value.trim(), gender: $("#c-gender").value.trim(),
        ethnicity: $("#c-ethnicity").value.trim(),
        mst: selMst, undertone: $("#c-undertone").value,
        hairTexture: $("#c-hairtex").value, hairStyle: $("#c-hairstyle").value,
        hairColor: $("#c-haircolor").value.trim(),
        eyes: $("#c-eyes").value.trim(), face: $("#c-face").value.trim(),
        build: $("#c-build").value.trim(), wardrobe: $("#c-wardrobe").value.trim(),
        vibe: $("#c-vibe").value.trim(),
        seed: Math.floor(Math.random() * 999999),
        refImage,
      });
      State.saveCharacters();
      render("characters");
    };

    $$("[data-del-char]").forEach(b => b.onclick = () => {
      State.characters = State.characters.filter(c => c.id !== b.dataset.delChar);
      State.saveCharacters(); render("characters");
    });

    const charSay = (id, kind, msg) => {
      const el = $(`[data-char-status="${id}"]`);
      el.className = `status show ${kind}`;
      el.innerHTML = kind === "info" ? `<span class="spinner"></span>${esc(msg)}` : esc(msg);
    };

    /* Turnaround sheet: the master any-angle reference. Built from the
     * uploaded photo when there is one (exact likeness), otherwise from the
     * consistency token + locked seed. Free provider used when no fal key. */
    $$("[data-gen-sheet]").forEach(b => b.onclick = async () => {
      const c = State.characters.find(x => x.id === b.dataset.genSheet);
      const prompt = compileCharacterToken(c) + ". " + RIU_DATA.sheetPrompt;
      b.disabled = true;
      try {
        let url, cost = 0;
        if (Providers.keys().fal) {
          if (c.refImage) {
            const m = models("imageEdit").find(x => /nano-banana-pro/.test(x.id)) || models("imageEdit")[0];
            charSay(c.id, "info", "Building turnaround sheet from your reference photo…");
            const res = await Providers.falRun(m.id,
              { prompt: "Using the exact person in the reference image: " + prompt, image_urls: [c.refImage], aspect_ratio: "16:9", resolution: "2K", num_images: 1 },
              s => charSay(c.id, "info", s));
            url = Providers.extractMedia(res); cost = m.cost;
          } else {
            const m = models("image").find(x => !x.free) || models("image")[0];
            charSay(c.id, "info", "Building turnaround sheet…");
            const res = await Providers.falRun(m.id, { prompt, seed: c.seed, aspect_ratio: "16:9" }, s => charSay(c.id, "info", s));
            url = Providers.extractMedia(res); cost = m.cost;
          }
        } else {
          charSay(c.id, "info", "Building turnaround sheet on the FREE provider (20–60s)…");
          const out = await Providers.freeImage(prompt, { width: 1792, height: 1024, seed: c.seed });
          url = out.sourceUrl;
        }
        if (!url) throw new Error("No sheet returned — try again.");
        c.sheetUrl = url;
        State.saveCharacters();
        State.addToGallery({ kind: "image", url, prompt: "Character turnaround sheet: " + c.name, model: "character-sheet", cost });
        render("characters");
      } catch (e) { charSay(c.id, "err", e.message); b.disabled = false; }
    });

    /* Single angle shot pulled off the sheet — any camera angle, same person. */
    $$("[data-gen-angle]").forEach(b => b.onclick = async () => {
      const c = State.characters.find(x => x.id === b.dataset.genAngle);
      if (!Providers.keys().fal)
        return charSay(c.id, "err", "Angle shots use a reference-based edit model, which needs your fal.ai key (⚙️ Settings). The sheet itself can be made free.");
      const angle = RIU_DATA.angleShots[+$(`[data-angle-sel="${c.id}"]`).value];
      const m = models("imageEdit").find(x => /nano-banana-pro/.test(x.id)) || models("imageEdit")[0];
      const prompt = `The exact same character as in the reference turnaround sheet — same face, same hairstyle, same outfit and colors — now shown as a single ${angle.prompt}. Photorealistic, highly detailed, plain studio background.`;
      b.disabled = true;
      try {
        charSay(c.id, "info", `Generating ${angle.name} shot…`);
        const res = await Providers.falRun(m.id, { prompt, image_urls: [c.sheetUrl], num_images: 1 }, s => charSay(c.id, "info", s));
        const url = Providers.extractMedia(res);
        if (!url) throw new Error("No image returned.");
        charSay(c.id, "ok", `${angle.name} shot ready — also saved to the Gallery.`);
        $(`[data-char-result="${c.id}"]`).innerHTML = `<img src="${url}" alt="${esc(angle.name)}">`;
        State.addToGallery({ kind: "image", url, prompt: `${c.name} — ${angle.name} angle`, model: m.id, cost: m.cost });
      } catch (e) { charSay(c.id, "err", e.message); }
      b.disabled = false;
    });

    $$("[data-gen-portrait]").forEach(b => b.onclick = async () => {
      const c = State.characters.find(x => x.id === b.dataset.genPortrait);
      b.disabled = true; b.textContent = "Generating…";
      const prompt = compileCharacterToken(c) +
        ". Professional master portrait, chest-up, looking at camera, neutral studio background, photorealistic, extremely detailed";
      try {
        let url, m;
        const refs = characterRefs(c.id);
        if (Providers.keys().fal && refs.length) {
          // exact likeness: edit model anchored on the sheet / reference photo
          m = models("imageEdit").find(x => /nano-banana-pro/.test(x.id)) || models("imageEdit")[0];
          const result = await Providers.falRun(m.id, {
            prompt: "Using the exact person in the reference image(s): " + prompt,
            image_urls: refs, aspect_ratio: "3:4", num_images: 1,
          });
          url = Providers.extractMedia(result);
        } else if (Providers.keys().fal) {
          m = models("image").find(x => !x.free) || models("image")[0];
          const result = await Providers.falRun(m.id, { prompt, seed: c.seed, aspect_ratio: "3:4" });
          url = Providers.extractMedia(result);
        } else {
          // no fal key yet — use the free provider
          m = { id: "pollinations:flux", cost: 0 };
          const out = await Providers.freeImage(prompt, { width: 1024, height: 1280, seed: c.seed });
          url = out.sourceUrl;
        }
        if (url) {
          State.addToGallery({ kind: "image", url, prompt: "Master portrait: " + c.name, model: m.id, cost: m.cost });
          alert("Master portrait ready! Find it in the Gallery — save it and set it as this character's reference photo for exact likeness in edits.");
        }
      } catch (e) { alert(e.message); }
      render("characters");
    });
  },

  image() {
    bindChips("img-style"); bindChips("img-ar");
    const updateCost = () => {
      const opt = $("#img-model").selectedOptions[0];
      $("#img-cost").textContent = `~$${(+opt.dataset.cost).toFixed(3)}`;
    };
    $("#img-model").onchange = updateCost; updateCost();

    $("#img-go").onclick = async () => {
      const modelId = $("#img-model").value;
      const m = modelsIn("image", "imageEdit").find(x => x.id === modelId);
      const charId = $("#img-char").value;
      const style = chipValue("img-style", RIU_DATA.stylePresets);
      const arSel = $$("#img-ar .chip.on")[0];
      const ar = arSel ? RIU_DATA.aspectRatios[+arSel.dataset.i].value : "16:9";
      const loc = State.locations.find(l => l.id === $("#img-loc").value);
      const prompt = characterPrefix(charId) + $("#img-prompt").value.trim() +
        (loc ? `. Setting: ${loc.desc}` : "") + (style ? ". Style: " + style : "");
      if (!$("#img-prompt").value.trim()) return setStatus("img-status", "err", "Describe the scene first.");
      const seed = characterSeed(charId);

      if (modelId.startsWith("pollinations:")) {
        // FREE path — no API key, no cost
        const dims = { "9:16": [720, 1280], "16:9": [1280, 720], "1:1": [1024, 1024], "4:5": [1024, 1280] }[ar] || [1280, 720];
        try {
          setStatus("img-status", "info", "Generating on the FREE provider (can take 20–60s)…");
          const out = await Providers.freeImage(prompt, { width: dims[0], height: dims[1], seed, model: modelId.split(":")[1] });
          setStatus("img-status", "ok", "Done — cost: $0.00 (free tier)");
          showMedia("img-result", "image", out.blobUrl);
          State.addToGallery({ kind: "image", url: out.sourceUrl, prompt, model: modelId, cost: 0 });
        } catch (e) { setStatus("img-status", "err", e.message); }
        return;
      }

      const sizeMap = { "9:16": "portrait_16_9", "16:9": "landscape_16_9", "1:1": "square_hd", "4:5": "portrait_4_3" };
      const input = { prompt, image_size: sizeMap[ar] || "landscape_16_9" };
      if (/nano-banana|gpt-image/.test(modelId)) { delete input.image_size; input.aspect_ratio = ar; }
      if (seed != null) input.seed = seed;
      // Reference-based models take image_urls for likeness — the turnaround
      // sheet (if the character has one) is the strongest anchor
      const refs = characterRefs(charId);
      if (refs.length && /edit|kontext/i.test(modelId)) input.image_urls = refs;
      runFalJob({ statusId: "img-status", resultId: "img-result", kind: "image", modelId, input, prompt, cost: m.cost });
    };
  },

  video() {
    bindChips("vid-cam"); bindChips("vid-style");
    const updateCost = () => {
      const opt = $("#vid-model").selectedOptions[0];
      const secs = +$("#vid-secs").value || 5;
      $("#vid-cost").textContent = `~$${((+opt.dataset.cost) * secs).toFixed(2)}`;
    };
    $("#vid-model").onchange = updateCost; $("#vid-secs").oninput = updateCost; updateCost();

    $("#vid-go").onclick = async () => {
      const modelId = $("#vid-model").value;
      const m = models("video").find(x => x.id === modelId);
      const secs = +$("#vid-secs").value || 5;
      const cam = chipValue("vid-cam", RIU_DATA.cameraMoves);
      const style = chipValue("vid-style", RIU_DATA.stylePresets);
      const prompt = characterPrefix($("#vid-char").value) + $("#vid-prompt").value.trim()
        + (cam ? ". Camera: " + cam : "") + (style ? ". Style: " + style : "");
      const input = { prompt, duration: secs, aspect_ratio: $("#vid-ar").value };
      const f = $("#vid-image").files[0];
      const urlIn = $("#vid-image-url").value.trim();
      if (f) input.image_url = await Providers.fileToDataUri(f);
      else if (urlIn) input.image_url = urlIn;
      if (/image-to-video/.test(modelId) && !input.image_url)
        return setStatus("vid-status", "err", "This model needs a start image — upload one or paste a URL (tip: generate your character in the Image Studio first).");
      runFalJob({ statusId: "vid-status", resultId: "vid-result", kind: "video", modelId, input, prompt, cost: m.cost * secs });
    };

    $("#up-go").onclick = () => {
      const url = $("#up-url").value.trim();
      if (!url) return setStatus("up-status", "err", "Paste a video URL first.");
      const modelId = $("#up-model").value;
      const m = models("upscale").find(x => x.id === modelId);
      runFalJob({ statusId: "up-status", resultId: "up-result", kind: "video", modelId, input: { video_url: url }, prompt: "4K upscale", cost: m.cost * 5 });
    };
  },

  relight() {
    const st = { frameUri: null, videoUri: null, duration: 0, stillUrl: null };
    const updateCost = () => {
      const secs = Math.min(st.duration || 5, 10);
      $("#rl-cost").textContent = `~$${(secs * 0.168 + 0.1).toFixed(2)}`;
    };
    updateCost();

    $("#rl-video").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        setStatus("rl-status", "info", "Reading clip…");
        const fr = await Providers.videoFrame(f, 0.5);
        if (fr.duration < 3 || fr.duration > 10.5)
          return setStatus("rl-status", "err", `Clip is ${fr.duration.toFixed(1)}s — it must be 3–10 seconds. Trim it first.`);
        st.frameUri = fr.dataUri; st.duration = fr.duration;
        st.videoUri = await Providers.fileToDataUri(f);
        $("#rl-clipinfo").textContent = `Clip loaded: ${fr.duration.toFixed(1)}s, ${fr.width}×${fr.height}. Reference frame extracted.`;
        clearStatus("rl-status"); updateCost();
      } catch (err) { setStatus("rl-status", "err", err.message); }
    };
    $("#rl-image").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      st.frameUri = await Providers.fileToDataUri(f); st.videoUri = null; st.duration = 0;
      $("#rl-clipinfo").textContent = "Photo loaded — step ① will relight it (step ② needs a clip).";
    };

    $("#rl-still-go").onclick = async () => {
      if (!st.frameUri) return setStatus("rl-status", "err", "Upload a clip or photo first.");
      const scene = $("#rl-prompt").value.trim();
      if (!scene) return setStatus("rl-status", "err", "Describe the new scene/lighting.");
      const prompt = `Relight and re-scene this exact shot: ${scene}. CRITICAL: keep the same camera angle, framing, crop, subject size, head pose and expression as the source image — only the lighting and background change. Preserve the subject's identity and skin fidelity exactly: warm healthy true-to-life skin tones, no added texture or age, never grey or ashen.`;
      try {
        setStatus("rl-status", "info", "Relighting frame…");
        const m = models("imageEdit").find(x => /nano-banana-2/.test(x.id)) || models("imageEdit")[0];
        const result = await Providers.falRun(m.id, {
          prompt, image_urls: [st.frameUri], aspect_ratio: "16:9", resolution: "2K", num_images: 1,
        }, s => setStatus("rl-status", "info", s));
        st.stillUrl = Providers.extractMedia(result);
        if (!st.stillUrl) throw new Error("No still returned.");
        setStatus("rl-status", "ok", "Frame relit — check it below. Re-run with a tweaked prompt until it's right (pennies per try), then run step ②.");
        showMedia("rl-still-result", "image", st.stillUrl);
        State.addToGallery({ kind: "image", url: st.stillUrl, prompt: "Relight still: " + scene.slice(0, 50), model: m.id, cost: 0.1 });
        if (st.videoUri) $("#rl-video-go").disabled = false;
      } catch (e) { setStatus("rl-status", "err", e.message); }
    };

    $("#rl-video-go").onclick = async () => {
      if (!st.videoUri || !st.stillUrl) return;
      const motion = $("#rl-motion").value.trim();
      const prompt = `Place the person from the video into the environment and lighting of the reference image; match its background and lighting exactly; preserve identity, exact lip and mouth movements, clothing, and all original motion and timing. ${motion}`;
      const mv = models("videoEdit")[0];
      try {
        setStatus("rl-vstatus", "info", "Relighting full clip (1–3 min)…");
        const result = await Providers.falRun(mv.id, {
          video_url: st.videoUri, prompt, image_urls: [st.stillUrl], keep_audio: true,
        }, s => setStatus("rl-vstatus", "info", s));
        const url = Providers.extractMedia(result);
        if (!url) throw new Error("No video returned.");
        setStatus("rl-vstatus", "ok", "Clip relit — original audio preserved. 🎉");
        showMedia("rl-video-result", "video", url);
        State.addToGallery({ kind: "video", url, prompt: "Relit clip", model: mv.id, cost: st.duration * 0.168 });
      } catch (e) { setStatus("rl-vstatus", "err", e.message); }
    };
  },

  animate() {
    bindChips("an-style");
    let restyledUrl = null;
    const vcost = () => {
      const opt = $("#an-vmodel").selectedOptions[0];
      $("#an-vcost").textContent = `~$${((+opt.dataset.cost) * (+$("#an-secs").value || 5)).toFixed(2)}`;
    };
    $("#an-vmodel").onchange = vcost; $("#an-secs").oninput = vcost; vcost();

    $("#an-go").onclick = async () => {
      const sel = $$("#an-style .chip.on")[0];
      if (!sel) return setStatus("an-status", "err", "Pick a target style.");
      const preset = RIU_DATA.restylePresets[+sel.dataset.i];
      let ref = null;
      const f = $("#an-image").files[0];
      if (f) ref = await Providers.fileToDataUri(f);
      else ref = characterRef($("#an-char").value);
      if (!ref) return setStatus("an-status", "err", "Upload an image, or pick a character that has a reference photo.");
      const notes = $("#an-notes").value.trim();
      const prompt = preset.prompt + (notes ? " " + notes : "");
      try {
        setStatus("an-status", "info", "Restyling…");
        const m = models("imageEdit").find(x => /nano-banana-pro/.test(x.id)) || models("imageEdit")[0];
        const result = await Providers.falRun(m.id, { prompt, image_urls: [ref], resolution: "2K", num_images: 1 },
          s => setStatus("an-status", "info", s));
        restyledUrl = Providers.extractMedia(result);
        if (!restyledUrl) throw new Error("No image returned.");
        setStatus("an-status", "ok", "Restyled! Now animate it below.");
        showMedia("an-result", "image", restyledUrl);
        State.addToGallery({ kind: "image", url: restyledUrl, prompt: "Restyle: " + preset.name, model: m.id, cost: m.cost });
        $("#an-vgo").disabled = false;
      } catch (e) { setStatus("an-status", "err", e.message); }
    };

    $("#an-vgo").onclick = () => {
      if (!restyledUrl) return;
      const modelId = $("#an-vmodel").value;
      const m = models("video").find(x => x.id === modelId);
      const secs = +$("#an-secs").value || 5;
      const motion = $("#an-motion").value.trim() || "subtle natural motion, cinematic";
      runFalJob({
        statusId: "an-vstatus", resultId: "an-vresult", kind: "video", modelId,
        input: { prompt: motion, image_url: restyledUrl, duration: secs, aspect_ratio: $("#an-ar").value },
        prompt: "Animate restyled: " + motion.slice(0, 50), cost: m.cost * secs,
      });
    };
  },

  editor() { /* static page — no bindings */ },

  lipsync() {
    $("#ls-go").onclick = async () => {
      const modelId = $("#ls-model").value;
      const m = models("lipsync").find(x => x.id === modelId);
      const vf = $("#ls-video").files[0], af = $("#ls-audio").files[0];
      const video_url = vf ? await Providers.fileToDataUri(vf) : $("#ls-video-url").value.trim();
      const audio_url = af ? await Providers.fileToDataUri(af) : $("#ls-audio-url").value.trim();
      if (!video_url || !audio_url) return setStatus("ls-status", "err", "Both a face video and a voice audio are required.");
      runFalJob({ statusId: "ls-status", resultId: "ls-result", kind: "video", modelId, input: { video_url, audio_url }, prompt: "lip sync", cost: m.cost * 10 });
    };
  },

  voice() {
    const loadVoices = async (selectId, statusId) => {
      try {
        setStatus(statusId, "info", "Loading voices…");
        const voices = await Providers.elVoices();
        $("#" + selectId).innerHTML = voices.map(v => `<option value="${v.voice_id}">${esc(v.name)}${v.category === "cloned" ? " 🧬" : ""}</option>`).join("");
        setStatus(statusId, "ok", `${voices.length} voices loaded.`);
      } catch (e) { setStatus(statusId, "err", e.message); }
    };
    $("#fv-go").onclick = async () => {
      const text = $("#fv-text").value.trim();
      if (!text) return setStatus("fv-status", "err", "Write a script first.");
      try {
        setStatus("fv-status", "info", "Generating free narration…");
        const { blobUrl } = await Providers.freeSpeak(text, $("#fv-voice").value);
        setStatus("fv-status", "ok", "Done — cost: $0.00. Download it for lip sync or your editor.");
        showMedia("fv-result", "audio", blobUrl);
      } catch (e) { setStatus("fv-status", "err", e.message); }
    };

    $("#vo-load").onclick = () => loadVoices("vo-voice", "vo-status");
    $("#vo-text").oninput = () => $("#vo-chars").textContent = $("#vo-text").value.length;

    $("#vo-go").onclick = async () => {
      const voiceId = $("#vo-voice").value, text = $("#vo-text").value.trim();
      if (!voiceId) return setStatus("vo-status", "err", "Load and pick a voice first.");
      if (!text) return setStatus("vo-status", "err", "Write a script first.");
      try {
        setStatus("vo-status", "info", "Generating narration…");
        const { blobUrl } = await Providers.elSpeak(voiceId, text);
        setStatus("vo-status", "ok", "Narration ready — play below or download for lip sync.");
        showMedia("vo-result", "audio", blobUrl);
      } catch (e) { setStatus("vo-status", "err", e.message); }
    };

    $("#cap-go").onclick = async () => {
      const f = $("#cap-audio").files[0];
      const text = $("#cap-text").value.trim();
      if (!f || !text) return setStatus("cap-status", "err", "Both the audio file and its script are needed.");
      try {
        const dur = await Providers.audioDuration(f);
        const srt = buildSrt(text, dur, +$("#cap-wpl").value);
        downloadText(f.name.replace(/\.\w+$/, "") + ".srt", srt);
        $("#cap-preview").textContent = srt.split("\n").slice(0, 12).join("\n") + "\n…";
        setStatus("cap-status", "ok", `Captions built for ${dur.toFixed(1)}s of audio — .srt downloaded. Import into CapCut/Premiere/Resolve or upload to YouTube.`);
      } catch (e) { setStatus("cap-status", "err", e.message); }
    };

    /* multi-voice dialogue: parse "Speaker: line", assign a voice per
     * speaker, generate each line, stitch into one file */
    const parseDialogue = () => {
      const lines = $("#dlg-script").value.split("\n").map(l => l.trim()).filter(Boolean);
      const parsed = lines.map(l => {
        const m = l.match(/^([^:]{1,24}):\s*(.+)$/);
        return m ? { speaker: m[1].trim(), text: m[2].trim() } : { speaker: "Narrator", text: l };
      });
      const speakers = [...new Set(parsed.map(p => p.speaker))];
      return { parsed, speakers };
    };

    $("#dlg-scan").onclick = () => {
      const { speakers } = parseDialogue();
      if (!speakers.length) return setStatus("dlg-status", "err", "Write at least one line first.");
      $("#dlg-speakers").innerHTML = speakers.map((s, i) => `
        <div class="row" style="margin-bottom:6px">
          <span class="fixed" style="min-width:100px;font-weight:600">${esc(s)}</span>
          <select data-dlg-voice="${esc(s)}">${Providers.freeVoices.map((v, vi) =>
            `<option${vi === i % Providers.freeVoices.length ? " selected" : ""}>${v}</option>`).join("")}</select>
        </div>`).join("");
      clearStatus("dlg-status");
    };

    $("#dlg-go").onclick = async () => {
      const { parsed } = parseDialogue();
      if (!parsed.length) return setStatus("dlg-status", "err", "Write a script first (Speaker: line, one per line).");
      if (!$("#dlg-speakers").children.length) $("#dlg-scan").click();
      const voiceFor = (speaker) => $(`[data-dlg-voice="${speaker}"]`)?.value || Providers.freeVoices[0];
      const gap = +$("#dlg-gap").value || 0.4;
      const btn = $("#dlg-go"); btn.disabled = true;
      try {
        const blobs = [];
        for (let i = 0; i < parsed.length; i++) {
          setStatus("dlg-status", "info", `Recording line ${i + 1}/${parsed.length} (${parsed[i].speaker})…`);
          const { blob } = await Providers.freeSpeak(parsed[i].text, voiceFor(parsed[i].speaker));
          blobs.push(blob);
        }
        setStatus("dlg-status", "info", "Stitching into one file…");
        const { blob, duration } = await Providers.concatTracks(blobs, gap);
        const url = URL.createObjectURL(blob);
        setStatus("dlg-status", "ok", `Combined dialogue ready — ${parsed.length} lines, ${duration.toFixed(1)}s, cost $0.00.`);
        showMedia("dlg-result", "audio", url);
      } catch (e) { setStatus("dlg-status", "err", e.message); }
      btn.disabled = false;
    };

    $("#vc-go").onclick = async () => {
      const name = $("#vc-name").value.trim(), files = $("#vc-files").files;
      if (!name || !files.length) return setStatus("vc-status", "err", "Name + at least one audio sample required.");
      try {
        setStatus("vc-status", "info", "Cloning voice…");
        const out = await Providers.elCloneVoice(name, [...files]);
        setStatus("vc-status", "ok", `Voice cloned! ID: ${out.voice_id}. Click "Load my voices" above to use it.`);
      } catch (e) { setStatus("vc-status", "err", e.message); }
    };
  },

  music() {
    $("#mu-go").onclick = () => {
      const modelId = $("#mu-model").value;
      const m = models("music").find(x => x.id === modelId);
      const prompt = $("#mu-prompt").value.trim();
      if (!prompt) return setStatus("mu-status", "err", "Describe the music first.");
      const input = { prompt };
      const lyrics = $("#mu-lyrics").value.trim();
      if (lyrics) input.lyrics = lyrics;
      runFalJob({ statusId: "mu-status", resultId: "mu-result", kind: "audio", modelId, input, prompt, cost: m.cost });
    };
  },

  avatar() {
    const loadVoices = async () => {
      try {
        const voices = await Providers.elVoices();
        $("#av-voice").innerHTML = voices.map(v => `<option value="${v.voice_id}">${esc(v.name)}</option>`).join("");
      } catch (e) { setStatus("av-status", "err", e.message); }
    };
    $("#av-load").onclick = loadVoices;

    $("#av-go").onclick = async () => {
      const charId = $("#av-char").value, voiceId = $("#av-voice").value, text = $("#av-text").value.trim();
      if (!charId) return setStatus("av-status", "err", "Pick a character (create one in the Character Lab).");
      if (!voiceId) return setStatus("av-status", "err", "Load and pick a voice.");
      if (!text) return setStatus("av-status", "err", "Write what they should say.");
      const btn = $("#av-go"); btn.disabled = true;
      try {
        // ① portrait
        setStatus("av-status", "info", "Step 1/4 — generating portrait…");
        const refs = characterRefs(charId);
        const imgModel = refs.length
          ? (models("imageEdit").find(x => /nano-banana-pro/.test(x.id)) || models("imageEdit")[0])
          : (models("image").find(x => !x.free) || models("image")[0]);
        const portraitPrompt = (refs.length ? "Using the exact person in the reference image(s): " : "") +
          characterPrefix(charId) + $("#av-setting").value.trim() +
          ", photorealistic, extremely detailed, mouth closed, neutral pleasant expression";
        const imgIn = { prompt: portraitPrompt, aspect_ratio: $("#av-ar").value };
        if (refs.length) imgIn.image_urls = refs;
        const seed = characterSeed(charId); if (seed != null) imgIn.seed = seed;
        const imgRes = await Providers.falRun(imgModel.id, imgIn, s => setStatus("av-status", "info", "Step 1/4 — " + s));
        const portraitUrl = Providers.extractMedia(imgRes);
        if (!portraitUrl) throw new Error("Portrait generation returned no image.");

        // ② animate
        setStatus("av-status", "info", "Step 2/4 — animating (subtle idle motion)…");
        const vidModel = models("video").find(x => /image-to-video/.test(x.id)) || models("video")[0];
        const vidRes = await Providers.falRun(vidModel.id, {
          prompt: "subtle natural idle motion, gentle breathing, small head movements, blinking, keeps looking at camera, mouth stays closed",
          image_url: portraitUrl, duration: 5, aspect_ratio: $("#av-ar").value,
        }, s => setStatus("av-status", "info", "Step 2/4 — " + s));
        const faceVideoUrl = Providers.extractMedia(vidRes);
        if (!faceVideoUrl) throw new Error("Animation step returned no video.");

        // ③ narrate
        setStatus("av-status", "info", "Step 3/4 — generating narration…");
        const { blob } = await Providers.elSpeak(voiceId, text);
        const audioUri = await Providers.blobToDataUri(blob);

        // ④ lip sync
        setStatus("av-status", "info", "Step 4/4 — lip syncing…");
        const lsModel = models("lipsync")[0];
        const lsRes = await Providers.falRun(lsModel.id, { video_url: faceVideoUrl, audio_url: audioUri },
          s => setStatus("av-status", "info", "Step 4/4 — " + s));
        const finalUrl = Providers.extractMedia(lsRes);
        if (!finalUrl) throw new Error("Lip sync returned no video.");

        setStatus("av-status", "ok", "Talking avatar ready! 🎉");
        showMedia("av-result", "video", finalUrl);
        State.addToGallery({ kind: "video", url: finalUrl, prompt: "Avatar: " + text.slice(0, 50), model: "avatar-pipeline", cost: 0.6 });
      } catch (e) {
        setStatus("av-status", "err", e.message);
      }
      btn.disabled = false;
    };
  },

  script() {
    const renderBeats = () => {
      const t = RIU_DATA.scriptTemplates.find(x => x.id === $("#sc-template").value);
      $("#sc-desc").textContent = t.desc;
      $("#sc-beats").innerHTML = t.beats.map((b, i) => `
        <label class="f-label">${esc(b.beat)} <span class="muted">(~${b.secs}s)</span></label>
        <div class="hint" style="margin:0 0 5px">${esc(b.tip)}</div>
        <textarea data-beat="${i}" style="min-height:56px" placeholder="Write this beat…"></textarea>`).join("");
    };
    $("#sc-template").onchange = renderBeats; renderBeats();

    $("#sc-save").onclick = () => {
      const t = RIU_DATA.scriptTemplates.find(x => x.id === $("#sc-template").value);
      const title = $("#sc-title").value.trim() || "Untitled";
      const beats = t.beats.map((b, i) => ({ ...b, content: $(`[data-beat="${i}"]`).value.trim() }));
      State.scripts.unshift({ title, template: t.name, beats });
      State.saveScripts(); render("script");
    };
    $("#sc-export").onclick = () => {
      const t = RIU_DATA.scriptTemplates.find(x => x.id === $("#sc-template").value);
      const title = $("#sc-title").value.trim() || "Untitled";
      const lines = [title, "=".repeat(title.length), ""];
      t.beats.forEach((b, i) => { lines.push(`## ${b.beat} (~${b.secs}s)`, $(`[data-beat="${i}"]`).value.trim(), ""); });
      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = title.replace(/\W+/g, "-") + "-script.txt"; a.click();
    };
    $$("[data-del-script]").forEach(b => b.onclick = () => {
      State.scripts.splice(+b.dataset.delScript, 1); State.saveScripts(); render("script");
    });
  },

  director() {
    bindChips("dir-style");
    const log = (msg, ok = false) => {
      const d = document.createElement("div");
      d.className = "muted"; d.style.padding = "3px 0";
      d.textContent = (ok ? "✅ " : "▸ ") + msg;
      $("#dir-log").appendChild(d);
    };

    $("#dir-go").onclick = async () => {
      const topic = $("#dir-topic").value.trim();
      if (!topic) return setStatus("dir-status", "err", "What's the video about?");
      const fmt = RIU_DATA.directorFormats[+$("#dir-format").value];
      const charId = $("#dir-char").value;
      const modelId = $("#dir-model").value;
      const style = chipValue("dir-style", RIU_DATA.stylePresets);
      const btn = $("#dir-go"); btn.disabled = true;
      $("#dir-log").innerHTML = ""; $("#dir-out").innerHTML = "";

      try {
        /* ① script */
        setStatus("dir-status", "info", "Step 1/4 — drafting the script (free writing model)…");
        let plan;
        try {
          plan = await Providers.freeJson(
            `You are an expert YouTube director. Plan a ${fmt.name} video about: "${topic}". ` +
            `Return ONLY valid JSON, no markdown: {"title": "video title", "scenes": [{"beat": "2-4 word label", ` +
            `"narration": "1-3 sentences of spoken voiceover", "visual": "detailed visual description of the shot for an image generator", ` +
            `"shot": "WIDE" | "MED" | "CLOSE-UP", "emotion": "the ONE emotional job this scene does for the audience (e.g. curiosity, tension, awe, relief, joy)", ` +
            `"seconds": integer 3-10 — this scene's target length; pace it by its job (hooks punchy 3-4s, explanations 6-8s, payoffs 8-10s)}]} ` +
            `with exactly ${fmt.scenes} scenes. Strong hook in scene 1, payoff in the last scene, continuous action from scene to scene.`);
          if (!plan.scenes?.length) throw new Error("empty plan");
        } catch {
          // offline/busy fallback: deterministic plan from the format template
          const tpl = RIU_DATA.scriptTemplates.find(t => t.id === fmt.id) || RIU_DATA.scriptTemplates[0];
          plan = {
            title: topic,
            scenes: tpl.beats.slice(0, fmt.scenes).map(b => ({
              beat: b.beat, narration: "", shot: "MED", emotion: "curiosity",
              seconds: Math.min(10, Math.max(3, Math.round((b.secs || 30) / 8))),
              visual: `${b.beat} of a video about ${topic} — ${b.tip}`,
            })),
          };
          log("Free writing model unavailable — used the template structure instead (fill narration in the Script Builder).");
        }
        State.scripts.unshift({
          title: plan.title, template: "🎥 Director — " + fmt.name,
          beats: plan.scenes.map(s => ({ beat: s.beat, secs: 0, tip: s.visual, content: s.narration })),
        });
        State.saveScripts();
        log(`Script drafted: "${plan.title}" — ${plan.scenes.length} scenes (saved in Script Builder)`, true);

        /* ② storyboard */
        setStatus("dir-status", "info", "Step 2/4 — building the storyboard…");
        const board = {
          id: "b" + Date.now(), title: plan.title, style, charId, model: modelId,
          panels: plan.scenes.map(s => ({
            shot: s.shot || "MED", desc: s.visual, imgUrl: null,
            emotion: s.emotion || "", secs: Math.min(10, Math.max(3, +s.seconds || 5)),
          })),
        };
        State.storyboards.unshift(board);
        State.saveStoryboards();
        const totalSecs = board.panels.reduce((a, p) => a + p.secs, 0);
        log(`Scene breakdown: ${board.panels.map((p, i) => `S${i + 1} ${p.secs}s (${p.emotion || "—"})`).join(" · ")} — ${totalSecs}s total`, true);

        const refs = characterRefs(charId);
        const genDirPanel = async (i) => {
          const p = board.panels[i];
          const prompt = characterPrefix(charId) + p.desc + `. ${p.shot} shot. ` +
            (p.emotion ? `The frame's emotional job: ${p.emotion}. ` : "") +
            (style ? "Style: " + style + ". " : "") + "Single storyboard still frame, strong cinematic composition.";
          const seed = (characterSeed(charId) ?? 1234) + i + (board.seedShift || 0) * 1000;
          if (modelId.startsWith("pollinations:")) {
            p.imgUrl = Providers.freeImageUrl(prompt, { width: fmt.ar === "9:16" ? 720 : 1280, height: fmt.ar === "9:16" ? 1280 : 720, seed, model: modelId.split(":")[1] });
            // force the fetch so failures surface here, not in the <img>
            await Providers.freeImage(prompt, { width: 64, height: 36, seed, model: modelId.split(":")[1] }).catch(() => {});
          } else {
            const input = /edit/.test(modelId) && refs.length
              ? { prompt, image_urls: refs, num_images: 1 }
              : { prompt, aspect_ratio: fmt.ar, seed };
            const res = await Providers.falRun(modelId, input);
            p.imgUrl = Providers.extractMedia(res);
          }
          State.saveStoryboards();
        };

        /* ③ finish: remaining panels + narration + package (runs after look-lock) */
        const finishProduction = async () => {
          for (let i = 1; i < board.panels.length; i++) {
            setStatus("dir-status", "info", `Step 3/4 — panel art ${i + 1}/${board.panels.length}…`);
            await genDirPanel(i);
          }
          log(`Storyboard built: ${board.panels.length} panels (open it in the Storyboard Studio)`, true);

          /* ④ narration + captions */
          const narration = plan.scenes.map(s => s.narration).filter(Boolean).join(" ");
          let narrationHtml = "";
          if (narration) {
            setStatus("dir-status", "info", "Step 4/4 — recording narration + captions…");
            try {
              const { blobUrl, blob } = await Providers.freeSpeak(narration, $("#dir-voice").value);
              const dur = await Providers.audioDuration(blob);
              const srt = buildSrt(narration, dur, fmt.id === "short" ? 3 : 6);
              narrationHtml = `<audio src="${blobUrl}" controls style="width:100%"></audio>
                <div class="mt row">
                  <a class="btn sm fixed" href="${blobUrl}" download="${esc(plan.title)}-narration.mp3">⬇ Narration audio</a>
                  <button class="btn sm fixed" id="dir-srt">⬇ Captions (.srt)</button>
                </div>`;
              window._dirSrt = { name: plan.title.replace(/\W+/g, "-") + ".srt", srt };
              log(`Narration recorded (${dur.toFixed(0)}s) + word-timed captions built`, true);
            } catch (e) { log("Narration skipped: " + e.message); }
          } else {
            log("No narration text yet — write the beats in the Script Builder, then narrate in the Voice Studio.");
          }

          setStatus("dir-status", "ok", "Production package ready 🎬");
          $("#dir-out").innerHTML = `
            <div class="card scene-card">
              <h3>${esc(plan.title)}</h3>
              ${narrationHtml}
              <div class="mt row">
                <button class="btn primary fixed" id="dir-open-board">🎬 Open storyboard → review panels → 📦 batch-animate</button>
              </div>
              <p class="hint">Next: review the board (retry any panel you don't love — pennies each), then batch-animate. Each shot renders at its planned length; the exact total is quoted before anything runs.</p>
            </div>`;
          $("#dir-open-board").onclick = () => { State.activeBoardId = board.id; render("storyboard"); };
          const srtBtn = $("#dir-srt");
          if (srtBtn) srtBtn.onclick = () => downloadText(window._dirSrt.name, window._dirSrt.srt);
          btn.disabled = false;
        };

        /* ② LOCK THE LOOK — one proof shot, approval-gated */
        setStatus("dir-status", "info", "Step 2/4 — proving the look in ONE shot…");
        await genDirPanel(0);
        log("Proof shot rendered — lock the look before anything else spends a cent.", true);
        setStatus("dir-status", "info", "Waiting for your call on the look…");
        const showProof = () => {
          $("#dir-out").innerHTML = `
            <div class="card scene-card">
              <h3>🔒 Lock the look?</h3>
              <p class="muted">Scene 1 — "${esc(board.panels[0].desc.slice(0, 80))}". Every other panel inherits this look.</p>
              <div class="result-media"><img src="${board.panels[0].imgUrl}" alt="proof shot"></div>
              <div class="mt row">
                <button class="btn primary fixed" id="dir-lock">🔒 Lock it — build the rest</button>
                <button class="btn fixed" id="dir-reroll">🔁 Re-roll the look</button>
              </div>
            </div>`;
          $("#dir-lock").onclick = () => { $("#dir-out").innerHTML = ""; finishProduction().catch(e => { setStatus("dir-status", "err", e.message); btn.disabled = false; }); };
          $("#dir-reroll").onclick = async () => {
            board.panels[0].imgUrl = null;
            setStatus("dir-status", "info", "Re-rolling the proof shot…");
            try {
              board.seedShift = (board.seedShift || 0) + 1; // new look for THIS board only
              await genDirPanel(0);
              showProof();
              setStatus("dir-status", "info", "Waiting for your call on the look…");
            } catch (e) { setStatus("dir-status", "err", e.message); btn.disabled = false; }
          };
        };
        showProof();
        return; // finishProduction re-enables the button
      } catch (e) {
        setStatus("dir-status", "err", e.message);
      }
      btn.disabled = false;
    };
  },

  thumbs() {
    bindChips("th-comp", false); // multi-select: each chip = one variant
    $("#th-go").onclick = async () => {
      const headline = $("#th-headline").value.trim();
      if (!headline) return setStatus("th-status", "err", "Write the title text first (3–5 punchy words).");
      let comps = $$("#th-comp .chip.on").map(c => RIU_DATA.thumbCompositions[+c.dataset.i]);
      if (!comps.length) comps = RIU_DATA.thumbCompositions.slice(0, 4);
      const charId = $("#th-char").value;
      const modelId = $("#th-model").value;
      const emotion = $("#th-emotion").value.replace(/\s*\S+$/, ""); // strip emoji
      const notes = $("#th-notes").value.trim();
      const refs = characterRefs(charId);
      const grid = $("#th-grid"); grid.innerHTML = "";
      const btn = $("#th-go"); btn.disabled = true;

      for (let i = 0; i < comps.length; i++) {
        setStatus("th-status", "info", `Variant ${i + 1}/${comps.length} — ${comps[i].name}…`);
        const prompt = characterPrefix(charId) + comps[i].prompt +
          `, ${emotion} expression. Giant bold readable title text on the thumbnail: "${headline}". ` +
          (notes ? notes + ". " : "") + RIU_DATA.thumbSuffix;
        try {
          let url;
          if (modelId.startsWith("pollinations:")) {
            url = Providers.freeImageUrl(prompt, { width: 1280, height: 720, seed: 500 + i, model: modelId.split(":")[1] });
          } else {
            const input = /edit/.test(modelId) && refs.length
              ? { prompt, image_urls: refs, num_images: 1 }
              : { prompt, aspect_ratio: "16:9", seed: 500 + i };
            const res = await Providers.falRun(modelId, input);
            url = Providers.extractMedia(res);
          }
          if (url) {
            grid.insertAdjacentHTML("beforeend",
              `<div class="g-item"><img src="${url}"><div class="g-meta"><b>${esc(comps[i].name)}</b><br><a href="${url}" target="_blank" rel="noopener">open / download ↗</a></div></div>`);
            State.addToGallery({ kind: "image", url, prompt: `Thumb ${comps[i].name}: ${headline}`, model: modelId, cost: modelId.startsWith("pollinations:") ? 0 : (modelsIn("image", "imageEdit").find(x => x.id === modelId)?.cost || 0) });
          }
        } catch (e) { setStatus("th-status", "err", `Variant ${i + 1}: ${e.message}`); btn.disabled = false; return; }
      }
      setStatus("th-status", "ok", `${comps.length} variants ready — compare below, then A/B test the top 2–3 in YouTube Studio → Test & Compare.`);
      btn.disabled = false;
    };
  },

  storyboard() {
    bindChips("sb-style");

    /* Build one panel's prompt from character + shot + description + style. */
    const board = () => State.storyboards.find(b => b.id === State.activeBoardId);
    const panelPrompt = (b, p) =>
      characterPrefix(b.charId) + p.desc + `. ${p.shot} shot. ` +
      (b.style ? "Style: " + b.style + ". " : "") +
      "Single storyboard still frame, strong cinematic composition.";

    const syncPanelEdits = () => {
      const b = board(); if (!b) return;
      $$("[data-panel-desc]").forEach(t => b.panels[+t.dataset.panelDesc].desc = t.value);
      $$("[data-panel-shot]").forEach(s => b.panels[+s.dataset.panelShot].shot = s.value);
      State.saveStoryboards();
    };

    const genPanel = async (i) => {
      const b = board(); syncPanelEdits();
      const p = b.panels[i];
      if (!p.desc.trim()) throw new Error(`Panel ${i + 1} has no description yet.`);
      const prompt = panelPrompt(b, p);
      const seed = (characterSeed(b.charId) ?? 1234) + i;
      if (b.model.startsWith("pollinations:")) {
        p.imgUrl = Providers.freeImageUrl(prompt, { width: 1280, height: 720, seed, model: b.model.split(":")[1] });
      } else {
        const input = /edit/.test(b.model) && characterRefs(b.charId).length
          ? { prompt, image_urls: characterRefs(b.charId), num_images: 1 }
          : { prompt, aspect_ratio: "16:9", seed };
        const res = await Providers.falRun(b.model, input, s => setStatus("sb-status", "info", `Panel ${i + 1} — ${s}`));
        p.imgUrl = Providers.extractMedia(res);
        if (!p.imgUrl) throw new Error(`Panel ${i + 1}: no image returned.`);
        const m = modelsIn("image", "imageEdit").find(x => x.id === b.model);
        State.addToGallery({ kind: "image", url: p.imgUrl, prompt: `${b.title} — panel ${i + 1}`, model: b.model, cost: m?.cost || 0 });
      }
      State.saveStoryboards();
      const box = $(`[data-panel-img="${i}"]`);
      if (box) box.innerHTML = `<img src="${p.imgUrl}" alt="panel ${i + 1}">`;
    };

    $("#sb-create").onclick = () => {
      const title = $("#sb-title").value.trim() || "Untitled board";
      const src = $("#sb-source").value;
      const style = chipValue("sb-style", RIU_DATA.stylePresets);
      let panels;
      if (src === "" || src.startsWith("blank")) {
        const n = src === "blank9" ? 9 : src === "blank12" ? 12 : 6;
        panels = Array.from({ length: n }, () => ({ shot: "MED", desc: "", imgUrl: null }));
      } else {
        const script = State.scripts[+src];
        // only beats the user actually wrote become prompts; empty beats stay
        // empty (the template's coaching tips make poor image prompts)
        panels = script.beats.map(bt => ({ shot: "MED", desc: bt.content || "", imgUrl: null }));
      }
      const b = {
        id: "b" + Date.now(), title, style,
        charId: $("#sb-char").value, model: $("#sb-model").value, panels,
      };
      State.storyboards.unshift(b);
      State.activeBoardId = b.id;
      State.saveStoryboards();
      render("storyboard");
    };

    if (board()) {
      $$("[data-panel-gen]").forEach(btn => btn.onclick = async () => {
        btn.disabled = true;
        try { await genPanel(+btn.dataset.panelGen); clearStatus("sb-status"); }
        catch (e) { setStatus("sb-status", "err", e.message); }
        btn.disabled = false;
      });

      $("#sb-gen-all").onclick = async () => {
        const b = board(); syncPanelEdits();
        for (let i = 0; i < b.panels.length; i++) {
          if (b.panels[i].imgUrl || !b.panels[i].desc.trim()) continue;
          setStatus("sb-status", "info", `Generating panel ${i + 1} of ${b.panels.length}…`);
          try { await genPanel(i); } catch (e) { setStatus("sb-status", "err", e.message); return; }
        }
        setStatus("sb-status", "ok", "Board complete — print it, or animate panels in the Video Studio.");
      };

      $("#sb-add-panel").onclick = () => {
        syncPanelEdits();
        board().panels.push({ shot: "MED", desc: "", imgUrl: null });
        State.saveStoryboards(); render("storyboard");
      };

      $("#sb-close").onclick = () => { syncPanelEdits(); State.activeBoardId = null; render("storyboard"); };

      /* batch-animate: one image→video job per panel with art, quoted first */
      const batchCost = () => {
        const b = board();
        const readyPanels = b.panels.filter(p => p.imgUrl && !p.videoUrl);
        const rate = +($("#sb-vmodel").selectedOptions[0]?.dataset.cost || 0);
        const defSecs = +$("#sb-vsecs").value || 5;
        // pacing: each panel renders at ITS planned length (falls back to the default)
        const totalSecs = readyPanels.reduce((a, p) => a + (p.secs || defSecs), 0);
        $("#sb-batch-cost").textContent = readyPanels.length
          ? `${readyPanels.length} clips · ${totalSecs}s ≈ $${(totalSecs * rate).toFixed(2)}` : "no panels ready";
        return { ready: readyPanels.length, total: totalSecs * rate, defSecs, totalSecs };
      };
      $("#sb-vmodel").onchange = batchCost; $("#sb-vsecs").oninput = batchCost; batchCost();

      $("#sb-batch").onclick = async () => {
        const b = board(); syncPanelEdits();
        const { ready, total, defSecs, totalSecs } = batchCost();
        if (!ready) return setStatus("sb-batch-status", "err", "Generate panel art first — batch animates panels that have images.");
        if (!confirm(`Animate ${ready} panels (${totalSecs}s total, each at its planned length)?\n\nEstimated total: $${total.toFixed(2)}\n\nThis runs one clip at a time; you can leave the tab open.`)) return;
        const modelId = $("#sb-vmodel").value;
        const motion = $("#sb-vmotion").value.trim();
        const btn = $("#sb-batch"); btn.disabled = true;
        let done = 0, failed = 0;
        for (let i = 0; i < b.panels.length; i++) {
          const p = b.panels[i];
          if (!p.imgUrl || p.videoUrl) continue;
          setStatus("sb-batch-status", "info", `Animating panel ${i + 1} (${done + failed + 1}/${ready})…`);
          const clipSecs = p.secs || defSecs;
          try {
            const res = await Providers.falRun(modelId, {
              prompt: p.desc +
                (p.emotion ? `. The shot's emotional job for the audience: ${p.emotion}` : "") +
                ". " + motion +
                (i > 0 ? ", action flows continuously from the previous shot — same energy carrying through the cut" : ""),
              image_url: p.imgUrl, duration: clipSecs,
            }, s => setStatus("sb-batch-status", "info", `Panel ${i + 1} — ${s}`));
            p.videoUrl = Providers.extractMedia(res);
            if (p.videoUrl) {
              State.addToGallery({ kind: "video", url: p.videoUrl, prompt: `${b.title} — shot ${i + 1}`, model: modelId, cost: clipSecs * (+$("#sb-vmodel").selectedOptions[0].dataset.cost) });
              done++;
            } else failed++;
            State.saveStoryboards();
          } catch (e) { failed++; setStatus("sb-batch-status", "err", `Panel ${i + 1}: ${e.message}`); }
        }
        setStatus("sb-batch-status", failed ? "err" : "ok",
          `Batch finished: ${done} clips generated${failed ? `, ${failed} failed (re-run to retry just those)` : ""}. All clips are in the Gallery — download them from the Asset Vault.`);
        btn.disabled = false;
      };

      $("#sb-print").onclick = () => {
        const b = board(); syncPanelEdits();
        const w = window.open("", "_blank");
        w.document.write(`<!DOCTYPE html><html><head><title>${esc(b.title)}</title><style>
          body{font-family:Georgia,serif;background:#f6f2e8;color:#222;padding:24px}
          h1{font-size:20px;letter-spacing:.05em} .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
          .p{background:#fff;border:1px solid #ccc;border-radius:6px;overflow:hidden;page-break-inside:avoid}
          .p img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#ddd}
          .m{padding:8px 10px;font-size:11px} .n{font-weight:bold} .s{color:#8a6d1f;font-size:10px;letter-spacing:.08em}
          footer{margin-top:16px;font-size:10px;color:#777}</style></head><body>
          <h1>${esc(b.title).toUpperCase()}</h1><div class="grid">
          ${b.panels.map((p, i) => `<div class="p">${p.imgUrl ? `<img src="${p.imgUrl}">` : `<div style="aspect-ratio:16/9;background:#eee"></div>`}
            <div class="m"><span class="n">${i + 1}</span> <span class="s">${esc(p.shot)}</span><br>${esc(p.desc)}</div></div>`).join("")}
          </div><footer>Ramping It Up Studio — ${new Date().toLocaleDateString()}</footer>
          <script>window.onload=()=>setTimeout(()=>window.print(),600)<\/script></body></html>`);
        w.document.close();
      };
    }

    $$("[data-open-board]").forEach(b => b.onclick = () => { State.activeBoardId = b.dataset.openBoard; render("storyboard"); });
    $$("[data-del-board]").forEach(b => b.onclick = () => {
      State.storyboards = State.storyboards.filter(x => x.id !== b.dataset.delBoard);
      if (State.activeBoardId === b.dataset.delBoard) State.activeBoardId = null;
      State.saveStoryboards(); render("storyboard");
    });
  },

  locations() {
    bindChips("loc-cat");
    let lastUrl = null;
    $("#loc-cat").addEventListener("click", () => {
      const on = $$("#loc-cat .chip.on")[0];
      $("#loc-hint").textContent = on ? "Ideas: " + RIU_DATA.locationCategories[+on.dataset.i].hint : "";
    });

    $("#loc-go").onclick = async () => {
      const desc = $("#loc-desc").value.trim();
      if (!desc) return setStatus("loc-status", "err", "Describe the place first.");
      const prompt = desc + ". " + RIU_DATA.locationSuffix;
      const modelId = $("#loc-model").value;
      try {
        if (modelId.startsWith("pollinations:")) {
          setStatus("loc-status", "info", "Generating location (FREE, 20–60s)…");
          const out = await Providers.freeImage(prompt, { width: 1600, height: 900, model: modelId.split(":")[1] });
          lastUrl = out.sourceUrl;
          showMedia("loc-result", "image", out.blobUrl);
          setStatus("loc-status", "ok", "Location plate ready — $0.00.");
        } else {
          const m = models("image").find(x => x.id === modelId);
          setStatus("loc-status", "info", "Generating location…");
          const res = await Providers.falRun(modelId, { prompt, aspect_ratio: "16:9" }, s => setStatus("loc-status", "info", s));
          lastUrl = Providers.extractMedia(res);
          if (!lastUrl) throw new Error("No image returned.");
          showMedia("loc-result", "image", lastUrl);
          setStatus("loc-status", "ok", `Location plate ready — ~$${m.cost}.`);
        }
        $("#loc-save").disabled = false;
      } catch (e) { setStatus("loc-status", "err", e.message); }
    };

    $("#loc-save").onclick = () => {
      if (!lastUrl) return;
      const desc = $("#loc-desc").value.trim();
      State.locations.unshift({
        id: "l" + Date.now(),
        name: $("#loc-name").value.trim() || desc.slice(0, 40),
        desc, url: lastUrl,
      });
      State.saveLocations();
      render("locations");
    };

    $$("[data-del-loc]").forEach(a => a.onclick = (e) => {
      e.preventDefault();
      State.locations = State.locations.filter(l => l.id !== a.dataset.delLoc);
      State.saveLocations(); render("locations");
    });
  },

  soundLibrary() {
    bindChips("snd-preset");
    $("#snd-preset").addEventListener("click", () => {
      const on = $$("#snd-preset .chip.on")[0];
      if (on) $("#snd-prompt").value = RIU_DATA.ambientPresets[+on.dataset.i].prompt;
    });
    let lastUrl = null;
    $("#snd-go").onclick = async () => {
      const prompt = $("#snd-prompt").value.trim();
      if (!prompt) return setStatus("snd-status", "err", "Describe the ambient sound first (or click a preset above).");
      try {
        setStatus("snd-status", "info", "Generating ambient loop…");
        const m = models("music")[0];
        const res = await Providers.falRun(m.id, { prompt }, s => setStatus("snd-status", "info", s));
        lastUrl = Providers.extractMedia(res);
        if (!lastUrl) throw new Error("No audio returned.");
        setStatus("snd-status", "ok", `Ready — ~$${m.cost}.`);
        showMedia("snd-result", "audio", lastUrl);
        $("#snd-save").disabled = false;
      } catch (e) { setStatus("snd-status", "err", e.message); }
    };
    $("#snd-save").onclick = () => {
      if (!lastUrl) return;
      const on = $$("#snd-preset .chip.on")[0];
      State.sounds.unshift({ id: "s" + Date.now(), name: on ? RIU_DATA.ambientPresets[+on.dataset.i].name : "Custom ambient", url: lastUrl });
      State.saveSounds(); render("soundLibrary");
    };
    $$("[data-del-sound]").forEach(a => a.onclick = (e) => {
      e.preventDefault();
      State.sounds = State.sounds.filter(s => s.id !== a.dataset.delSound);
      State.saveSounds(); render("soundLibrary");
    });
  },

  mixer() {
    $("#mx-go").onclick = async () => {
      const vf = $("#mx-voice").files[0];
      if (!vf) return setStatus("mx-status", "err", "Narration audio is required.");
      const tracks = [{ blob: vf, volume: +$("#mx-voice-vol").value / 100 }];
      const mf = $("#mx-music").files[0];
      if (mf) tracks.push({ blob: mf, volume: +$("#mx-music-vol").value / 100, loop: $("#mx-music-loop").checked });
      const af = $("#mx-ambient").files[0];
      if (af) tracks.push({ blob: af, volume: +$("#mx-ambient-vol").value / 100, loop: $("#mx-ambient-loop").checked });
      try {
        setStatus("mx-status", "info", `Mixing ${tracks.length} layer(s)…`);
        const { blob, duration } = await Providers.mixTracks(tracks);
        const url = URL.createObjectURL(blob);
        setStatus("mx-status", "ok", `Mixed down — ${duration.toFixed(1)}s, cost $0.00 (runs entirely in your browser).`);
        showMedia("mx-result", "audio", url);
      } catch (e) { setStatus("mx-status", "err", "Mix failed: " + e.message); }
    };
  },

  whiteboard() {
    const state = { audioBuffer: null, audioBlob: null, timings: [], script: "" };
    const canvas = $("#wb-canvas");
    const ctx2d = canvas.getContext("2d");

    const wrapAndDraw = (text, styleId) => {
      const st = RIU_DATA.whiteboardStyles.find(s => s.id === styleId) || RIU_DATA.whiteboardStyles[0];
      ctx2d.fillStyle = st.bg; ctx2d.fillRect(0, 0, canvas.width, canvas.height);
      ctx2d.fillStyle = st.accent;
      ctx2d.fillRect(0, canvas.height - 14, canvas.width, 14);
      ctx2d.fillStyle = st.ink;
      ctx2d.font = "600 52px 'Segoe UI', Arial, sans-serif";
      ctx2d.textBaseline = "top";
      const maxWidth = canvas.width - 140;
      const words = text.split(" ");
      let line = "", lines = [], x = 70;
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx2d.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
        else line = test;
      }
      if (line) lines.push(line);
      lines = lines.slice(-8); // keep the most recent lines on screen
      const lineHeight = 66;
      const startY = canvas.height / 2 - (lines.length * lineHeight) / 2;
      lines.forEach((l, i) => ctx2d.fillText(l, x, startY + i * lineHeight));
    };

    const revealAt = (t) => state.timings.filter(w => w.start <= t).map(w => w.word).join(" ");

    const setupFromDuration = (duration) => {
      state.timings = buildWordTimings(state.script, duration);
      $("#wb-audioinfo").textContent = `Narration loaded: ${duration.toFixed(1)}s, ${state.timings.length} words.`;
      $("#wb-preview").disabled = false; $("#wb-record").disabled = false; $("#wb-srt").disabled = false;
      wrapAndDraw("", $("#wb-style").value);
    };

    $("#wb-audio").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      state.script = $("#wb-text").value.trim();
      if (!state.script) return setStatus("wb-status", "err", "Write the script first — timing is matched to these exact words.");
      try {
        state.audioBlob = f;
        state.audioBuffer = await Providers.decodeAudio(f);
        setupFromDuration(state.audioBuffer.duration);
        clearStatus("wb-status");
      } catch (e2) { setStatus("wb-status", "err", e2.message); }
    };

    $("#wb-narrate").onclick = async () => {
      state.script = $("#wb-text").value.trim();
      if (!state.script) return setStatus("wb-status", "err", "Write the script first.");
      try {
        setStatus("wb-status", "info", "Generating free narration…");
        const { blob } = await Providers.freeSpeak(state.script, $("#wb-voice").value);
        state.audioBlob = blob;
        state.audioBuffer = await Providers.decodeAudio(blob);
        setupFromDuration(state.audioBuffer.duration);
        setStatus("wb-status", "ok", "Narration ready — $0.00.");
      } catch (e) { setStatus("wb-status", "err", e.message); }
    };

    $("#wb-style").onchange = () => wrapAndDraw(revealAt(0), $("#wb-style").value);

    $("#wb-srt").onclick = () => {
      const srt = buildSrt(state.script, state.audioBuffer.duration, +$("#wb-wpl").value);
      downloadText("whiteboard-captions.srt", srt);
    };

    /* live preview: play the narration through Web Audio and animate the
     * canvas in lockstep with the AudioContext clock */
    $("#wb-preview").onclick = () => {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const src = actx.createBufferSource();
      src.buffer = state.audioBuffer;
      src.connect(actx.destination);
      const t0 = actx.currentTime;
      src.start();
      let raf;
      const tick = () => {
        const t = actx.currentTime - t0;
        if (t > state.audioBuffer.duration + 0.15) { wrapAndDraw(revealAt(state.audioBuffer.duration), $("#wb-style").value); return; }
        wrapAndDraw(revealAt(t), $("#wb-style").value);
        raf = requestAnimationFrame(tick);
      };
      tick();
      src.onended = () => cancelAnimationFrame(raf);
    };

    /* record: canvas video + Web-Audio-rendered narration muxed into one
     * downloadable .webm via MediaRecorder — entirely client-side */
    $("#wb-record").onclick = async () => {
      const btn = $("#wb-record"); btn.disabled = true;
      try {
        setStatus("wb-status", "info", "Recording video (real-time — this takes as long as the narration)…");
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = actx.createMediaStreamDestination();
        const src = actx.createBufferSource();
        src.buffer = state.audioBuffer;
        src.connect(dest);

        const videoStream = canvas.captureStream(30);
        const combined = new MediaStream([...videoStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
        const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
          .find(t => window.MediaRecorder?.isTypeSupported?.(t)) || "video/webm";
        const rec = new MediaRecorder(combined, { mimeType });
        const chunks = [];
        rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        const done = new Promise(resolve => rec.onstop = resolve);

        const t0 = actx.currentTime;
        rec.start();
        src.start();
        const tick = () => {
          const t = actx.currentTime - t0;
          if (t > state.audioBuffer.duration + 0.2) return;
          wrapAndDraw(revealAt(t), $("#wb-style").value);
          requestAnimationFrame(tick);
        };
        tick();

        await new Promise(r => setTimeout(r, (state.audioBuffer.duration + 0.4) * 1000));
        rec.stop();
        await done;

        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setStatus("wb-status", "ok", `Video recorded — ${state.audioBuffer.duration.toFixed(1)}s, cost $0.00.`);
        showMedia("wb-result", "video", url);
        State.addToGallery({ kind: "video", url, prompt: "Whiteboard recap: " + state.script.slice(0, 50), model: "whiteboard-recorder", cost: 0 });
      } catch (e) {
        setStatus("wb-status", "err", "Recording failed: " + e.message + (/isTypeSupported|MediaRecorder/.test(e.message) ? " — try Chrome or Edge." : ""));
      }
      btn.disabled = false;
    };

    wrapAndDraw("", "whiteboard");
  },

  sequencer() {
    const state = { clips: [{ file: null, url: "", start: "", end: "" }] };

    const renderClips = () => {
      $("#sq-clips").innerHTML = state.clips.map((c, i) => `
        <div class="row" style="align-items:center;margin-bottom:8px">
          <span class="fixed" style="width:20px;font-weight:600">${i + 1}</span>
          <input type="file" data-clip-file="${i}" accept="video/*" class="fixed" style="width:150px">
          <input type="text" data-clip-url="${i}" placeholder="…or paste a video URL" value="${esc(c.url)}">
          <input type="number" data-clip-start="${i}" placeholder="start s" value="${esc(c.start)}" class="fixed" style="width:80px">
          <input type="number" data-clip-end="${i}" placeholder="end s" value="${esc(c.end)}" class="fixed" style="width:80px">
          <button class="btn sm fixed" data-clip-up="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="btn sm fixed" data-clip-down="${i}" ${i === state.clips.length - 1 ? "disabled" : ""}>↓</button>
          <button class="btn sm danger fixed" data-clip-del="${i}">✕</button>
        </div>`).join("");

      $$("[data-clip-file]").forEach(el => el.onchange = () => { state.clips[+el.dataset.clipFile].file = el.files[0] || null; });
      $$("[data-clip-url]").forEach(el => el.oninput = () => { state.clips[+el.dataset.clipUrl].url = el.value; });
      $$("[data-clip-start]").forEach(el => el.oninput = () => { state.clips[+el.dataset.clipStart].start = el.value; });
      $$("[data-clip-end]").forEach(el => el.oninput = () => { state.clips[+el.dataset.clipEnd].end = el.value; });
      $$("[data-clip-up]").forEach(el => el.onclick = () => {
        const i = +el.dataset.clipUp;
        [state.clips[i - 1], state.clips[i]] = [state.clips[i], state.clips[i - 1]];
        renderClips();
      });
      $$("[data-clip-down]").forEach(el => el.onclick = () => {
        const i = +el.dataset.clipDown;
        [state.clips[i + 1], state.clips[i]] = [state.clips[i], state.clips[i + 1]];
        renderClips();
      });
      $$("[data-clip-del]").forEach(el => el.onclick = () => {
        state.clips.splice(+el.dataset.clipDel, 1);
        if (!state.clips.length) state.clips.push({ file: null, url: "", start: "", end: "" });
        renderClips();
      });
    };
    renderClips();

    $("#sq-add").onclick = () => { state.clips.push({ file: null, url: "", start: "", end: "" }); renderClips(); };
    $("#sq-captions").onchange = () => {}; // checkbox just read at submit time

    const getVideoDuration = (blob) => new Promise((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata"; v.src = URL.createObjectURL(blob);
      v.onloadedmetadata = () => resolve(v.duration);
      v.onerror = () => reject(new Error("Could not read the stitched video's duration."));
    });

    const burnCaptions = (videoBlob, text, wpl) => new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(videoBlob);
      video.muted = false; video.playsInline = true;
      video.onerror = () => reject(new Error("Could not read the stitched video for caption burn-in."));
      video.onloadedmetadata = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        const cx = canvas.getContext("2d");
        const timings = buildWordTimings(text, video.duration);
        const groups = [];
        for (let i = 0; i < timings.length; i += wpl) groups.push(timings.slice(i, i + wpl));
        const captionAt = (t) => {
          const g = groups.find(g => t >= g[0].start && t <= g[g.length - 1].end + 0.15);
          return g ? g.map(w => w.word).join(" ") : "";
        };
        let stream;
        try { stream = video.captureStream(); }
        catch { return reject(new Error("This browser can't capture video for caption burn-in (try Chrome/Edge), or just skip burn-in and use the .srt instead.")); }
        const canvasStream = canvas.captureStream(30);
        const combined = new MediaStream([...canvasStream.getVideoTracks(), ...stream.getAudioTracks()]);
        const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
          .find(t => window.MediaRecorder?.isTypeSupported?.(t)) || "video/webm";
        const rec = new MediaRecorder(combined, { mimeType });
        const chunks = [];
        rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        rec.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
        rec.onerror = reject;
        let raf;
        const draw = () => {
          cx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const cap = captionAt(video.currentTime);
          if (cap) {
            cx.font = "700 " + Math.round(canvas.height * 0.06) + "px 'Segoe UI', Arial, sans-serif";
            cx.textAlign = "center";
            cx.lineWidth = Math.round(canvas.height * 0.012);
            cx.strokeStyle = "rgba(0,0,0,.85)"; cx.fillStyle = "#fff";
            const x = canvas.width / 2, y = canvas.height * 0.86;
            cx.strokeText(cap, x, y); cx.fillText(cap, x, y);
          }
          if (!video.ended) raf = requestAnimationFrame(draw);
        };
        video.onended = () => { cancelAnimationFrame(raf); setTimeout(() => rec.stop(), 200); };
        rec.start();
        await video.play();
        draw();
      };
    });

    $("#sq-go").onclick = async () => {
      const validClips = state.clips.filter(c => c.file || c.url.trim());
      if (!validClips.length) return setStatus("sq-status", "err", "Add at least one clip (upload a file or paste a URL).");
      const [w, h] = $("#sq-size").value.split("x").map(Number);
      const capText = $("#sq-caption-text").value.trim();
      const burnIn = $("#sq-captions").checked;
      const btn = $("#sq-go"); btn.disabled = true;
      $("#sq-log").textContent = ""; $("#sq-srtrow").style.display = "none";

      try {
        setStatus("sq-status", "info", "Loading the video engine (first time only, ~30MB)…");
        const clipsForFf = validClips.map(c => ({
          file: c.file, url: c.url.trim(),
          start: c.start !== "" ? +c.start : 0,
          end: c.end !== "" ? +c.end : undefined,
        }));
        const blob = await Providers.stitchClips(clipsForFf, {
          width: w, height: h,
          onProgress: (p) => setStatus("sq-status", "info", `Stitching ${validClips.length} clip(s)… ${Math.round(p * 100)}%`),
        });

        let finalBlob = blob, duration = null;
        if (burnIn && capText) {
          setStatus("sq-status", "info", "Burning in captions…");
          finalBlob = await burnCaptions(blob, capText, +$("#sq-caption-wpl").value);
        }
        duration = await getVideoDuration(blob).catch(() => null);

        const url = URL.createObjectURL(finalBlob);
        setStatus("sq-status", "ok", `Done — ${validClips.length} clips stitched${burnIn && capText ? " with captions burned in" : ""}, cost $0.00.`);
        showMedia("sq-result", "video", url);
        State.addToGallery({ kind: "video", url, prompt: "Sequenced clip" + (burnIn && capText ? " (captions burned in)" : ""), model: "clip-sequencer", cost: 0 });

        if (capText && duration) {
          $("#sq-srtrow").style.display = "";
          $("#sq-srt-go").onclick = () => downloadText("sequenced-clip-captions.srt", buildSrt(capText, duration, +$("#sq-caption-wpl").value));
        }
      } catch (e) {
        setStatus("sq-status", "err", e.message);
      }
      btn.disabled = false;
    };
  },

  cost() {
    $("#cp-go").onclick = () => {
      const scenes = +$("#cp-scenes").value, secs = +$("#cp-secs").value, takes = +$("#cp-takes").value;
      const vRate = +$("#cp-vmodel").value;
      const imgs = +$("#cp-images").value, music = +$("#cp-music").value;
      const chars = +$("#cp-chars").value, lip = +$("#cp-lip").value, up = +$("#cp-up").value;
      const video = scenes * secs * takes * vRate;
      const image = imgs * 0.04;
      const mus = music * 0.10;
      const voice = (chars / 1000) * 0.20;
      const lipC = lip * 0.06;
      const upC = up * 0.10;
      const total = video + image + mus + voice + lipC + upC;
      setStatus("cp-status", "ok",
        `Video ~$${video.toFixed(2)} · Images ~$${image.toFixed(2)} · Music ~$${mus.toFixed(2)} · ` +
        `Narration ~$${voice.toFixed(2)} · Lip sync ~$${lipC.toFixed(2)} · 4K ~$${upC.toFixed(2)}  →  ` +
        `TOTAL ≈ $${total.toFixed(2)} for this project`);
    };
  },

  galleryView() {
    if (!State.gallery.length) return;
    $("#gal-dl-all").onclick = async () => {
      const btn = $("#gal-dl-all"); btn.disabled = true;
      let ok = 0, fail = 0;
      for (let i = 0; i < State.gallery.length; i++) {
        const g = State.gallery[i];
        setStatus("gal-status", "info", `Downloading ${i + 1}/${State.gallery.length}…`);
        try {
          const res = await fetch(g.url);
          if (!res.ok) throw new Error();
          const blob = await res.blob();
          const ext = blob.type.includes("video") ? "mp4" : blob.type.includes("audio") ? "mp3" :
                      blob.type.includes("png") ? "png" : "jpg";
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `riu-${new Date(g.ts).toISOString().slice(0, 10)}-${i + 1}.${ext}`;
          a.click();
          URL.revokeObjectURL(a.href);
          ok++;
          await new Promise(r => setTimeout(r, 400)); // let the browser breathe
        } catch { fail++; }
      }
      setStatus("gal-status", fail ? "err" : "ok",
        `${ok} files downloaded${fail ? `, ${fail} skipped (expired or blocked URLs)` : ""}. Move them into your Google Drive / Dropbox folder to keep them forever.`);
      btn.disabled = false;
    };
    $("#gal-clear").onclick = () => {
      if (!confirm("Clear the gallery list? (This only clears the list in this browser — downloaded files are untouched.)")) return;
      State.gallery = []; State.saveGallery(); render("galleryView");
    };
  },

  settings() {
    $("#set-save").onclick = () => {
      localStorage.setItem("riu.key.fal", $("#set-fal").value.trim());
      localStorage.setItem("riu.key.eleven", $("#set-eleven").value.trim());
      setStatus("set-status", "ok", "Keys saved (in this browser only).");
    };
    /* ---- live setup tests ---- */
    const TEST_PROMPT = "A joyful Black woman teacher with deep, rich mahogany brown skin (Monk Skin Tone 8), " +
      "knotless braids, warm golden rim light, luminous properly exposed skin, teaching at a bright modern " +
      "whiteboard, chest-up, smiling at camera, photorealistic, extremely detailed";
    let testImageUrl = null;

    $("#test-free").onclick = async () => {
      try {
        setStatus("test-status", "info", "FREE image test — generating on Pollinations (no key needed, 20–60s)…");
        const out = await Providers.freeImage(TEST_PROMPT, { width: 1280, height: 720, seed: 7 });
        setStatus("test-status", "ok", "✅ FREE provider works — image below cost $0.00.");
        showMedia("test-result", "image", out.blobUrl);
      } catch (e) {
        setStatus("test-status", "err", "❌ Free provider: " + e.message);
      }
    };

    $("#test-fal").onclick = async () => {
      if (!Providers.keys().fal) return setStatus("test-status", "err", "Paste your fal.ai key above and click Save keys first.");
      try {
        setStatus("test-status", "info", "fal.ai test — generating with Nano Banana Pro…");
        const m = models("image").find(x => !x.free) || { id: "fal-ai/nano-banana-pro", cost: 0.04 };
        const res = await Providers.falRun(m.id, { prompt: TEST_PROMPT, aspect_ratio: "16:9" },
          s => setStatus("test-status", "info", "fal.ai test — " + s));
        testImageUrl = Providers.extractMedia(res);
        if (!testImageUrl) throw new Error("job finished but returned no image.");
        setStatus("test-status", "ok", `✅ fal.ai works! Key is valid, billing is set up, model responded (~$${m.cost}). Step 4 is now unlocked.`);
        showMedia("test-result", "image", testImageUrl);
        State.addToGallery({ kind: "image", url: testImageUrl, prompt: "Setup test image", model: m.id, cost: m.cost });
        $("#test-video").disabled = false;
      } catch (e) {
        let msg = e.message;
        if (/401|403/.test(msg)) msg += "\n→ The key looks invalid or was revoked. Copy it again from fal.ai → Dashboard → Keys.";
        if (/402|balance|payment/i.test(msg)) msg += "\n→ Add a payment method / credits at fal.ai → Billing.";
        setStatus("test-status", "err", "❌ fal.ai: " + msg);
      }
    };

    $("#test-eleven").onclick = async () => {
      if (!Providers.keys().eleven) return setStatus("test-status", "err", "No ElevenLabs key saved — that's fine, the free voices still work. Add a key to enable voice cloning.");
      try {
        setStatus("test-status", "info", "ElevenLabs test — listing your voices…");
        const voices = await Providers.elVoices();
        setStatus("test-status", "ok", `✅ ElevenLabs works — ${voices.length} voices available (listing is free).`);
      } catch (e) { setStatus("test-status", "err", "❌ ElevenLabs: " + e.message); }
    };

    $("#test-video").onclick = async () => {
      if (!testImageUrl) return;
      const m = models("video")[0];
      if (!confirm(`Run the live video test?\n\n5 seconds × ${m.name}\nEstimated cost: ~$${(m.cost * 5).toFixed(2)}`)) return;
      const btn = $("#test-video"); btn.disabled = true;
      try {
        setStatus("test-vstatus", "info", "Animating your test image (1–3 min — this is the real thing)…");
        const res = await Providers.falRun(m.id, {
          prompt: "she gestures warmly while explaining, natural motion, slow cinematic dolly-in",
          image_url: testImageUrl, duration: 5,
        }, s => setStatus("test-vstatus", "info", "Video test — " + s));
        const url = Providers.extractMedia(res);
        if (!url) throw new Error("job finished but returned no video.");
        setStatus("test-vstatus", "ok", `✅ VIDEO WORKS! Your studio is fully operational. (~$${(m.cost * 5).toFixed(2)})`);
        showMedia("test-vresult", "video", url);
        State.addToGallery({ kind: "video", url, prompt: "Setup test video", model: m.id, cost: m.cost * 5 });
      } catch (e) { setStatus("test-vstatus", "err", "❌ Video: " + e.message); }
      btn.disabled = false;
    };

    $("#set-models-save").onclick = () => {
      try {
        Store.set("modelOverrides", JSON.parse($("#set-models").value));
        alert("Model registry saved.");
      } catch (e) { alert("Invalid JSON: " + e.message); }
    };
    $("#set-models-reset").onclick = () => {
      localStorage.removeItem("riu.modelOverrides");
      render("settings");
    };
    $("#set-export").onclick = () => {
      const data = {
        characters: State.characters, scripts: State.scripts,
        gallery: State.gallery, modelOverrides: Store.get("modelOverrides", null),
      };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      a.download = "ramping-it-up-studio-backup.json"; a.click();
    };
    $("#set-import").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const data = JSON.parse(await f.text());
      if (data.characters) { State.characters = data.characters; State.saveCharacters(); }
      if (data.scripts) { State.scripts = data.scripts; State.saveScripts(); }
      if (data.gallery) { State.gallery = data.gallery; State.saveGallery(); }
      if (data.modelOverrides) Store.set("modelOverrides", data.modelOverrides);
      alert("Imported! "); render("dashboard");
    };
  },
};

/* ---------------- router ---------------- */
const NAV = [
  ["dashboard", "🏠", "Dashboard", "Create"],
  ["director", "🎥", "Director", null],
  ["characters", "🎭", "Character Lab", null],
  ["image", "🖼️", "Image Studio", null],
  ["video", "🎥", "Video Studio", null],
  ["relight", "💡", "Relight", null],
  ["animate", "🎞️", "Restyle & Animate", null],
  ["lipsync", "👄", "Lip Sync", null],
  ["voice", "🗣️", "Voice Studio", null],
  ["music", "🎵", "Music Studio", null],
  ["soundLibrary", "🔊", "Sound Library", null],
  ["mixer", "🎚️", "Audio Mixer", null],
  ["whiteboard", "📋", "Whiteboard & Recap", null],
  ["sequencer", "📽️", "Clip Sequencer", null],
  ["avatar", "🧑‍🚀", "Avatar Pipeline", null],
  ["script", "✍️", "Script Builder", "Plan"],
  ["storyboard", "🎬", "Storyboard Studio", null],
  ["thumbs", "🖼️", "Thumbnail Lab", null],
  ["locations", "🗺️", "Location Scout", null],
  ["editor", "✂️", "Editor's Room", null],
  ["cost", "💰", "Cost Planner", null],
  ["galleryView", "🗂", "Gallery", "Library"],
  ["settings", "⚙️", "Settings", null],
];

function render(view) {
  $("#main").innerHTML = Views[view]();
  $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === view));
  if (Bind[view]) Bind[view]();
  $$("[data-nav]").forEach(t => t.onclick = () => render(t.dataset.nav));
  window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", () => {
  const nav = $("#nav");
  nav.innerHTML = NAV.map(([v, ico, name, section]) =>
    (section ? `<div class="nav-section">${section}</div>` : "") +
    `<button class="nav-item" data-view="${v}"><span class="ico">${ico}</span>${name}</button>`).join("");
  nav.addEventListener("click", e => {
    const item = e.target.closest(".nav-item");
    if (item) render(item.dataset.view);
  });
  render("dashboard");
});
