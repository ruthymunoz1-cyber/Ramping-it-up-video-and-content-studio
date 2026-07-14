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

  /* Text-to-speech → returns a blob URL you can play/download or feed to lip sync.
   * voiceSettings lets the Delivery style picker (Voice Studio) shape expressiveness
   * (stability/style) without changing the words themselves. */
  async elSpeak(voiceId, text, modelId = "eleven_multilingual_v2", voiceSettings = {}) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: this.elHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text, model_id: modelId, voice_settings: { stability: 0.5, similarity_boost: 0.8, ...voiceSettings } }),
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

  /* ---------------- Web Audio engine — mixing, concatenation, WAV export ----
   * Everything below is pure browser Web Audio API: no server, no deps.
   * Powers multi-voice dialogue tracks and narration+music+ambient mixdowns.
   */
  _decodeCtx: null,
  async decodeAudio(blobOrFile) {
    this._decodeCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const buf = await blobOrFile.arrayBuffer();
    return await this._decodeCtx.decodeAudioData(buf);
  },

  audioBufferToWav(buffer) {
    const numCh = buffer.numberOfChannels;
    const len = buffer.length * numCh * 2 + 44;
    const out = new ArrayBuffer(len);
    const view = new DataView(out);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, "RIFF"); view.setUint32(4, 36 + buffer.length * numCh * 2, true); ws(8, "WAVE");
    ws(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numCh, true);
    view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * numCh * 2, true);
    view.setUint16(32, numCh * 2, true); view.setUint16(34, 16, true);
    ws(36, "data"); view.setUint32(40, buffer.length * numCh * 2, true);
    const channels = []; for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
    let pos = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numCh; c++) {
        let s = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        pos += 2;
      }
    }
    return new Blob([out], { type: "audio/wav" });
  },

  /* Mix several tracks (narration + music + ambient) into one file. Each
   * track: { blob, volume (0-2), loop (bool) — loop stretches/repeats the
   * track to match the longest track, useful for background music/ambience
   * shorter or longer than the narration }. */
  async mixTracks(tracks) {
    const buffers = await Promise.all(tracks.map(t => this.decodeAudio(t.blob)));
    const sampleRate = buffers[0].sampleRate;
    const maxLen = Math.max(...buffers.map(b => b.length));
    const numCh = 2;
    const offline = new OfflineAudioContext(numCh, maxLen, sampleRate);
    buffers.forEach((buf, i) => {
      const src = offline.createBufferSource();
      src.buffer = buf;
      if (tracks[i].loop) src.loop = true;
      const gain = offline.createGain();
      gain.gain.value = tracks[i].volume ?? 1;
      src.connect(gain).connect(offline.destination);
      src.start(0);
    });
    const rendered = await offline.startRendering();
    return { blob: this.audioBufferToWav(rendered), duration: rendered.duration };
  },

  /* Concatenate audio blobs back-to-back with a small gap — builds a single
   * multi-voice dialogue file from separately generated lines. */
  async concatTracks(blobs, gapSeconds = 0.35) {
    const buffers = await Promise.all(blobs.map(b => this.decodeAudio(b)));
    const sampleRate = buffers[0].sampleRate;
    const gapSamples = Math.round(gapSeconds * sampleRate);
    const totalLen = buffers.reduce((a, b) => a + b.length + gapSamples, 0);
    const numCh = Math.max(...buffers.map(b => b.numberOfChannels));
    const offline = new OfflineAudioContext(numCh, totalLen, sampleRate);
    let cursor = 0;
    buffers.forEach(buf => {
      const src = offline.createBufferSource();
      src.buffer = buf;
      src.connect(offline.destination);
      src.start(cursor / sampleRate);
      cursor += buf.length + gapSamples;
    });
    const rendered = await offline.startRendering();
    return { blob: this.audioBufferToWav(rendered), duration: rendered.duration };
  },

  /* ---------------- ffmpeg.wasm — client-side video stitching ----------------
   * Loaded lazily from a CDN only when the Clip Sequencer is used (~30MB,
   * cached by the browser after first load). Runs entirely in the browser —
   * no upload, no server, no cost. Requires Chrome, Edge, or Firefox.
   */
  _ffmpeg: null,
  async _toBlobURL(url, mimeType) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not fetch ${url} (${res.status}) — check your internet connection.`);
    const buf = await res.arrayBuffer();
    return URL.createObjectURL(new Blob([buf], { type: mimeType }));
  },

  async loadFFmpeg(onLog) {
    if (this._ffmpeg) return this._ffmpeg;
    let FFmpeg;
    try {
      ({ FFmpeg } = await import("https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm"));
    } catch {
      throw new Error("Could not load the video engine — check your internet connection and try again (first load needs ~30MB).");
    }
    const ff = new FFmpeg();
    if (onLog) ff.on("log", ({ message }) => onLog(message));
    const base = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";
    await ff.load({
      coreURL: await this._toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await this._toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    this._ffmpeg = ff;
    return ff;
  },

  /* Trim + reorder + concatenate multiple clips into one MP4. Each clip:
   * { file (File) or url (string), start (sec, optional), end (sec, optional) }.
   * Normalizes every clip to the same size (letterboxed, never cropped) before
   * concatenating — mixing differently-sized/encoded clips is why naive
   * stream-copy concat corrupts; this re-encodes once via a single
   * filter_complex graph, the same safe approach used by the perfect-cuts skill. */
  async stitchClips(clips, { width = 1280, height = 720, onProgress } = {}) {
    const ff = await this.loadFFmpeg();
    let progressHandler;
    if (onProgress) {
      progressHandler = ({ progress }) => onProgress(Math.max(0, Math.min(1, progress)));
      ff.on("progress", progressHandler);
    }
    try {
      const names = [];
      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        const data = c.file
          ? new Uint8Array(await c.file.arrayBuffer())
          : new Uint8Array(await (await fetch(c.url)).arrayBuffer());
        const name = `in${i}.mp4`;
        await ff.writeFile(name, data);
        names.push(name);
      }
      const filters = [];
      clips.forEach((c, i) => {
        const trimArgs = [`start=${c.start || 0}`, ...(c.end ? [`end=${c.end}`] : [])].join(":");
        filters.push(`[${i}:v]trim=${trimArgs},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`);
        filters.push(`[${i}:a]atrim=${trimArgs},asetpts=PTS-STARTPTS[a${i}]`);
      });
      const concatInputs = clips.map((_, i) => `[v${i}][a${i}]`).join("");
      filters.push(`${concatInputs}concat=n=${clips.length}:v=1:a=1[outv][outa]`);

      const args = [];
      names.forEach(n => args.push("-i", n));
      args.push("-filter_complex", filters.join(";"), "-map", "[outv]", "-map", "[outa]",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23", "-c:a", "aac", "out.mp4");
      await ff.exec(args);
      const data = await ff.readFile("out.mp4");
      return new Blob([data.buffer], { type: "video/mp4" });
    } finally {
      if (progressHandler) ff.off("progress", progressHandler);
    }
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

  async freeSpeak(text, voice = "nova", deliveryDesc = "natural delivery") {
    const p = encodeURIComponent(`Read the following text exactly as written, verbatim, in a ${deliveryDesc}: ${text}`);
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
