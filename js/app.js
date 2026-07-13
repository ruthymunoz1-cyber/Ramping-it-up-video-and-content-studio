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
  saveCharacters() { Store.set("characters", this.characters); },
  saveGallery() { Store.set("gallery", this.gallery.slice(0, 200)); },
  saveScripts() { Store.set("scripts", this.scripts); },
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
  parts.push(`${c.name}, a ${c.gender || "person"}${c.age ? " " + c.age : ""}`);
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
      ["characters", "🎭", "Character Lab", "Build consistent hosts & avatars — melanin-true by design"],
      ["image", "🖼️", "Image Studio", "Stills, thumbnails, curriculum art"],
      ["video", "🎥", "Video Studio", "Text/image → video, shorts & cinematic"],
      ["relight", "💡", "Relight", "Change the light in any clip — audio kept"],
      ["animate", "🎞️", "Restyle & Animate", "Photo ↔ realistic / 3D / anime, then animate"],
      ["lipsync", "👄", "Lip Sync", "Sync any voice to any face"],
      ["voice", "🗣️", "Voice Studio", "Clone your voice, generate narration"],
      ["music", "🎵", "Music Studio", "Scores, intros, full songs"],
      ["avatar", "🧑‍🚀", "Avatar Pipeline", "Portrait → narration → talking host"],
      ["script", "✍️", "Script Builder", "Curriculum, shorts & longform beat sheets"],
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
          <div><label class="f-label">Gender / identity</label><input type="text" id="c-gender" placeholder="e.g. Black woman"></div>
        </div>

        <label class="f-label">Skin tone — Monk Skin Tone scale</label>
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
      <div class="page-desc">Everything you've generated in this browser. Media is hosted by the provider (URLs can expire after a few days — download keepers!).</div></div>
      ${State.gallery.length ? `<div class="gallery">${State.gallery.map(g => galleryItem(g)).join("")}</div>`
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
      const prompt = characterPrefix(charId) + $("#img-prompt").value.trim() + (style ? ". Style: " + style : "");
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

  settings() {
    $("#set-save").onclick = () => {
      localStorage.setItem("riu.key.fal", $("#set-fal").value.trim());
      localStorage.setItem("riu.key.eleven", $("#set-eleven").value.trim());
      setStatus("set-status", "ok", "Keys saved (in this browser only).");
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
  ["characters", "🎭", "Character Lab", null],
  ["image", "🖼️", "Image Studio", null],
  ["video", "🎥", "Video Studio", null],
  ["relight", "💡", "Relight", null],
  ["animate", "🎞️", "Restyle & Animate", null],
  ["lipsync", "👄", "Lip Sync", null],
  ["voice", "🗣️", "Voice Studio", null],
  ["music", "🎵", "Music Studio", null],
  ["avatar", "🧑‍🚀", "Avatar Pipeline", null],
  ["script", "✍️", "Script Builder", "Plan"],
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
