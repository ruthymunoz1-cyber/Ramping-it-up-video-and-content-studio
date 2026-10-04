# Verse-to-Scene Content Workflow

For producing short narrative devotional videos (the comfort-scene/doorway-scene
format — not the older static-photo + narrator + music format). Handed to
Manus as its standing operating process for this content, so it stops
improvising per video and follows one consistent, cost-controlled process
every time, routed through the Ramping It Up Studio via the MCP connector
instead of Manus's own managed media tool.

---

## 0. Fixed brand assets — never regenerated

Two things are **saved files, not something any tool generates per video.**
Treat both as locked:

- **Signature music.** A single mp3, already saved outside Manus. Manus never
  touches this file and never calls `generate_music` for this page, for any
  reason, even "just to try a variation." Manus's job ends at narration +
  video clip — **the final mix (narration + this fixed music + ambient) is
  done by hand, by the page owner, in the Studio's Audio Mixer** (a browser
  tool, not something reachable through the MCP connector — Manus cannot
  open or use it, so it is never asked to).
- **Narration voice — two fixed voice_ids, one per language:**
  - English: `Gubgw9l4dtIoQA9YZHgx`
  - Spanish: `DGhxgogT0bhXlRToPzFs`
  Always pass the exact voice_id matching the narration's language to
  `generate_narration` — never a name, never "pick whichever voice fits,"
  never `list_voices` (the connected ElevenLabs key can't read the voice
  list — these two IDs are all that's needed).

If a step seems to call for new music or a different voice, stop and ask
instead of generating one.

## 1. Start from the verse, not a template

For every video, the verse comes first. Read it, and ask: what moment of
real life does this verse describe or answer? That moment determines
everything else — the scene, the characters, the setting, whether a figure
like Jesus appears at all. Never reuse yesterday's scene or characters just
because they worked — a different verse earns a different scene.

## 2. Choose characters for *this* verse

- Pick age, gender, family configuration, and ethnicity/skin tone that fit
  the verse's situation — and across the page as a whole, rotate who's
  shown, so a wide range of viewers see someone who looks like them over
  time. Don't settle into one recurring "mascot" family.
- Build each character once per video in **Character Lab**, not Image Studio
  alone, so their face, skin tone, and features stay identical across every
  still and clip within that one video — this is what keeps a two-scene
  sequence (comfort scene → walking out the door) from looking like two
  different people.
- Always use accurate, true-to-life skin tone and lighting for every
  character — the Studio's melanin-true lighting guidance applies
  automatically when characters are built through Character Lab. Never skip
  it for speed.

## 3. If the verse calls for depicting Jesus, decide deliberately

Some verses are about presence, companionship, going-with — those may call
for Jesus in the scene. Most don't. When he does appear, don't guess how to
show him — stop and ask which of these fits *that specific verse*, since
this is a conviction call, not a production detail:

- **Not shown directly** — a silhouette, a hand at the doorframe, a figure
  just out of frame.
- **Shown warmly but partially** — present in the scene, soft-focus, felt
  more than seen clearly.
- **Fully depicted, reverently rendered.**

## 4. Nail the still image first — this is where the money is actually saved

Before generating any video, generate the key still frame for the scene in
**Image Studio** — the pose, the gesture (a hand settling on a shoulder,
holding a mug, walking through a doorway), the expressions, all correct in
one frame. This is cheap (~$0.04/image) and fast to redo — regenerate it as
many times as it takes to get right. Do not move to video generation until
this still is approved.

This is the actual lever, not model choice: the hardest part of this
content — hands, faces, physical contact looking right — is far cheaper to
get right in a $0.04 still you can retry ten times than in a $0.47/sec video
generation you can't.

## 5. Animate the approved still — pick the cheapest model that can do the job

- **Default: Kling v3 Pro** (~$0.17/sec, about a third of Seedance 2.5) for
  any shot with a precise human gesture or interaction. It handles subtle
  motion from a correct starting image well.
- **Hailuo 2.3** (~$0.05/sec, about a tenth of Seedance 2.5) for wider,
  simpler shots where precision matters less — an establishing shot of a
  room, a wide walking shot.
- **Seedance 2.5** (~$0.47/sec) only when a shot genuinely needs one long
  continuous take with no cuts, or has to hold several reference images
  consistent at once. A deliberate exception, never the default.
- Always quote the estimated cost before generating, and generate **one**
  clip per shot — never multiple takes hoping one looks better. If a clip
  isn't right, the fix is almost always to fix the *still image* it came
  from and re-animate that, not to regenerate the video blind.

## 6. The verse card is never part of the video generation

The Bible verse overlay (reference, verse text, the devotional paraphrase
line) is a separate text/graphic layer, composited onto a still frame or
over the video afterward — never something asked of the video model itself.
Asking a video model to render legible text is expensive and unreliable; a
text overlay is free and exact every time.

## 7. Generate once, then edit and reuse

Once a clip is approved, treat it as a finished asset. Need a different
length, a different crop, a slower pace, a different caption? Edit that same
footage — retrim, recolor, slow it down, recombine with other approved
clips. Only generate something new when the actual content of the scene is
different, never to chase a better version of the same shot.

## 8. Narration and captions

Keep the writing warm and specific, not generic devotional language — avoid
AI-writing tells and clichés, vary sentence rhythm, and let the caption ask
a real, specific question (the way "¿Hay un dolor que has estado
cargando?" does) rather than a vague platitude. The same anti-AI-tells
guardrail the Studio's Book Outline uses applies here.

## Always, every video

- Use the Ramping It Up Studio tools connected through the MCP connector —
  never Manus's own built-in generator, even as a fallback.
- Never call `generate_music` for this page. Hand off narration + the
  approved video clip and stop — the final music mix is done by hand, not
  by Manus.
- Never pick a narration voice, and never call `list_voices` — use the one
  fixed voice_id for the language being narrated, see section 0.
- Quote the estimated cost before any video generation step.
- Stop and ask before generating anything that doesn't clearly follow from
  this workflow.
