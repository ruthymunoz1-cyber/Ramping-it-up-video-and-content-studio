/* ============ Provider clients: fal.ai (queue) + ElevenLabs ============
 * Both providers allow direct browser calls with your own API key, so this
 * app needs no server. Keys live only in localStorage on your machine.
 */

const Providers = {

  keys() {
    return {
      fal: localStorage.getItem("riu.key.fal") || "",
      eleven: localStorage.getItem("riu.key.eleven") || "",
    };
  },

  /* ---------------- fal.ai queue API ----------------
   * Submit → poll status → fetch result. Handles long video jobs without
   * browser timeouts. modelId e.g. "fal-ai/flux/dev".
   */
  async falRun(modelId, input, onStatus) {
    const key = this.keys().fal;
    if (!key) throw new Error("No fal.ai API key set. Add it in ⚙️ Settings.");

    const submit = await fetch(`${RIU_DATA.falQueueBase}/${modelId}`, {
      method: "POST",
      headers: { "Authorization": `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!submit.ok) throw new Error(`fal.ai submit failed (${submit.status}): ${await submit.text()}`);
    const job = await submit.json();

    const statusUrl = job.status_url;
    const resultUrl = job.response_url;
    if (!statusUrl || !resultUrl) return job; // some endpoints answer synchronously

    const started = Date.now();
    while (true) {
      await new Promise(r => setTimeout(r, 2500));
      const sRes = await fetch(statusUrl, { headers: { "Authorization": `Key ${key}` } });
      if (!sRes.ok) throw new Error(`fal.ai status failed (${sRes.status})`);
      const s = await sRes.json();
      const mins = ((Date.now() - started) / 60000).toFixed(1);
      if (onStatus) onStatus(`${s.status}${s.queue_position != null ? ` — queue position ${s.queue_position}` : ""} · ${mins} min`);
      if (s.status === "COMPLETED") break;
      if (s.status === "FAILED" || s.status === "ERROR") {
        throw new Error("Generation failed on fal.ai: " + JSON.stringify(s));
      }
      if (Date.now() - started > 15 * 60 * 1000) throw new Error("Timed out after 15 minutes.");
    }

    const rRes = await fetch(resultUrl, { headers: { "Authorization": `Key ${key}` } });
    if (!rRes.ok) throw new Error(`fal.ai result fetch failed (${rRes.status}): ${await rRes.text()}`);
    return await rRes.json();
  },

  /* Pull the first media URL out of any fal result shape. */
  extractMedia(result) {
    if (!result) return null;
    const r = result;
    const cand =
      r.video?.url || r.image?.url ||
      (Array.isArray(r.images) && r.images[0]?.url) ||
      (Array.isArray(r.videos) && r.videos[0]?.url) ||
      r.audio?.url || r.audio_file?.url || r.audio_url ||
      r.output?.url || r.url || null;
    return cand;
  },

  /* Read a local file into a data: URI (fal endpoints accept data URIs). */
  fileToDataUri(file) {
    return new Promise((resolve, reject) => {
      const rd = new FileReader();
      rd.onload = () => resolve(rd.result);
      rd.onerror = reject;
      rd.readAsDataURL(file);
    });
  },

  /* ---------------- ElevenLabs ---------------- */
  elHeaders(extra = {}) {
    const key = this.keys().eleven;
    if (!key) throw new Error("No ElevenLabs API key set. Add it in ⚙️ Settings.");
    return { "xi-api-key": key, ...extra };
  },

  async elVoices() {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: this.elHeaders() });
    if (!res.ok) throw new Error(`ElevenLabs voices failed (${res.status}): ${await res.text()}`);
    return (await res.json()).voices || [];
  },

  /* Text-to-speech → returns a blob URL you can play/download or feed to lip sync. */
  async elSpeak(voiceId, text, modelId = "eleven_multilingual_v2") {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: this.elHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text, model_id: modelId, voice_settings: { stability: 0.5, similarity_boost: 0.8 } }),
    });
    if (!res.ok) throw new Error(`ElevenLabs TTS failed (${res.status}): ${await res.text()}`);
    const blob = await res.blob();
    return { blobUrl: URL.createObjectURL(blob), blob };
  },

  /* Instant voice clone from 1+ audio samples (Starter plan or above). */
  async elCloneVoice(name, files, description = "") {
    const fd = new FormData();
    fd.append("name", name);
    if (description) fd.append("description", description);
    for (const f of files) fd.append("files", f);
    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST", headers: this.elHeaders(), body: fd,
    });
    if (!res.ok) throw new Error(`Voice clone failed (${res.status}): ${await res.text()}`);
    return await res.json(); // { voice_id }
  },

  /* ---------------- Pollinations.ai — 100% FREE, no API key ----------------
   * Image generation and voiceover at zero cost. Quality is below the paid
   * models but perfect for drafts, storyboards, curriculum art and mockups.
   */
  freeImageUrl(prompt, { width = 1280, height = 720, seed, model = "flux" } = {}) {
    const p = encodeURIComponent(prompt);
    let url = `https://image.pollinations.ai/prompt/${p}?width=${width}&height=${height}&nologo=true&model=${model}`;
    if (seed != null) url += `&seed=${seed}`;
    return url;
  },

  async freeImage(prompt, opts, onStatus) {
    if (onStatus) onStatus("Generating on Pollinations (free)…");
    const url = this.freeImageUrl(prompt, opts);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pollinations failed (${res.status}). Try again in a moment — the free tier can be busy.`);
    const blob = await res.blob();
    return { blobUrl: URL.createObjectURL(blob), blob, sourceUrl: url };
  },

  freeVoices: ["nova", "alloy", "echo", "fable", "onyx", "shimmer"],

  /* Free LLM (Pollinations) — used by the Director to draft scripts. */
  async freeText(prompt) {
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
    if (!res.ok) throw new Error(`Free writing model failed (${res.status}) — try again in a moment.`);
    return await res.text();
  },

  /* Ask the free LLM for JSON and parse it defensively (strips code fences,
   * trims to the outermost braces). */
  async freeJson(prompt) {
    let t = await this.freeText(prompt);
    t = t.replace(/```json|```/g, "").trim();
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a === -1 || b === -1) throw new Error("The writing model returned no JSON.");
    return JSON.parse(t.slice(a, b + 1));
  },

  /* Duration (seconds) of an audio blob/URL. */
  audioDuration(src) {
    return new Promise((resolve, reject) => {
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => resolve(a.duration);
      a.onerror = () => reject(new Error("Could not read audio duration."));
      a.src = typeof src === "string" ? src : URL.createObjectURL(src);
    });
  },

  async freeSpeak(text, voice = "nova") {
    const p = encodeURIComponent(`Read the following text exactly as written, verbatim, with natural delivery: ${text}`);
    const res = await fetch(`https://text.pollinations.ai/${p}?model=openai-audio&voice=${voice}`);
    if (!res.ok) throw new Error(`Free TTS failed (${res.status}). Try again — the free tier can be busy — or use ElevenLabs.`);
    const blob = await res.blob();
    if (!/audio/.test(blob.type)) throw new Error("Free TTS returned no audio (service busy). Try again or use ElevenLabs.");
    return { blobUrl: URL.createObjectURL(blob), blob };
  },

  /* Grab a frame from a local video file as a data URI (for Relight). */
  videoFrame(file, atSeconds = 0.5) {
    return new Promise((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "auto"; v.muted = true;
      v.src = URL.createObjectURL(file);
      v.onloadedmetadata = () => { v.currentTime = Math.min(atSeconds, Math.max(0, v.duration - 0.1)); };
      v.onseeked = () => {
        const c = document.createElement("canvas");
        c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        resolve({ dataUri: c.toDataURL("image/png"), duration: v.duration, width: v.videoWidth, height: v.videoHeight });
        URL.revokeObjectURL(v.src);
      };
      v.onerror = () => reject(new Error("Could not read that video file."));
    });
  },

  /* Upload an audio blob somewhere fal can read: we pass data URIs directly. */
  async blobToDataUri(blob) {
    return new Promise((resolve, reject) => {
      const rd = new FileReader();
      rd.onload = () => resolve(rd.result);
      rd.onerror = reject;
      rd.readAsDataURL(blob);
    });
  },
};
