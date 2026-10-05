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

- **Signature music.** A single mp3, saved once as a fixed file on the MCP
  server (never regenerated, never swapped). Manus never calls
  `generate_music` for this page, for any reason, even "just to try a
  variation." Instead: `finalize_video` (section 9) pulls it in
  automatically as part of assembling the finished video — fully automated,
  no manual step, no review needed per video.
- **Narration voice — two fixed voice_ids, one per language:**
  - English: `Gubgw9l4dtIoQA9YZHgx`
  - Spanish: `DGhxgogT0bhXlRToPzFs`
  Always pass the exact voice_id matching the narration's language to
  `generate_narration` — never a name, never "pick whichever voice fits,"
  never `list_voices` (the connected ElevenLabs key can't read the voice
  list — these two IDs are all that's needed).

If a step seems to call for new music or a different voice, stop and ask
instead of generating one.

## Technical conventions — required on every call, not optional

- **Aspect ratio is always 9:16 (1080×1920, vertical)** — every still, every
  clip, every verse card. Pass `aspect_ratio: "9:16"` explicitly every time;
  never leave it to default. A square or landscape asset is not postable as
  a Reel and the mistake isn't caught until the finished video is reviewed,
  so get it right at generation time.
- **narration_duration is required**, not a nice-to-have, on `mix_audio` and
  `finalize_video` — fal.ai's compose tool rejects a request without an
  explicit duration on every keyframe (video, verse card, narration, and
  music all need one). Always know and pass the narration's actual length
  in seconds.
- **Every slow tool is asynchronous.** `generate_image`, `animate_image`,
  `generate_video`, `lip_sync`, `generate_music`, `upscale_video`,
  `mix_audio`, `merge_videos`, and `finalize_video` all return a `job_id`
  immediately instead of waiting (fal.ai jobs routinely take 1-3+ minutes —
  holding one request open that long gets cut off by hosting limits even
  though the job keeps running). Call `check_job_status` with that `job_id`
  every ~15-20 seconds until it reports done. Never retry the original tool
  or treat a "still running" status as a failure.

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
- **English and Spanish versions get their own casting — never a shared
  scene.** Spanish-language content should reflect the full range of
  Latino identity (not one "representative" look); English content isn't
  limited to any one group either. Reusing one scene across both languages
  to save a couple of dollars works against this — don't do it.
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

**First, decide how many beats this scene actually has — judge it from the
storyboard, not a fixed rule.** One clean gesture (a hand settling on a
shoulder) is one still + one clip, same as always. A scene with several
distinct beats (she sits, then rises and crosses the room, then hands over
the cup) can't be covered by one continuous generation without going mushy
— give each beat its own still (approved separately) and its own short
clip, then pass them all to `finalize_video` as `video_clips` (section 9) to
stitch them into one sequence. Most days are one beat; some aren't — look at
what the storyboard actually calls for each time.

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
line) is never asked of the video model itself — rendering legible text
with a video model is expensive and unreliable. `finalize_video` (section 9)
renders it separately as a text-accurate image and layers it onto the video
automatically — no manual compositing step.

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

## 9. Finalize — one call is meant to produce the finished video

The design: once the clip(s) are approved and narration generated, call
`finalize_video` with the narration URL (from `generate_narration`), the
verse reference, verse text, and caption. For a single-beat scene pass
`video_url` and the clip's duration; for a multi-beat scene (section 5) pass
`video_clips` — an ordered list of `{url, duration}` for each beat's clip.
With 2+ clips, `finalize_video` first merges them into one video via
fal.ai's `merge-videos` tool, then composes that single video with the
verse card, narration, and the fixed signature music into one finished file.

**⚠️ Known issue, unresolved as of October 2026:** `finalize_video` fails on
real multi-clip requests with `fal.ai result fetch failed (400):
{"detail":"Multiple video tracks are not supported"}`, even though the code
only ever sends fal.ai's compose tool a single video keyframe. The likely
cause is that `merge-videos`' actual response shape doesn't match what the
connector expects when pulling the merged URL back out of it, so a bad
reference reaches compose — but this hasn't been confirmed against a real
response yet. **Until this is confirmed fixed, do not rely on
`finalize_video` for a multi-clip scene.** Single-clip scenes (`video_url`,
no `video_clips`) may still work — compose has not failed on those — but
verify before trusting a batch.

### Fallback procedure, while finalize_video's multi-clip path is broken

1. Call `merge_videos` directly with the clip URLs in order → one merged
   video. (This is the same fal.ai tool finalize_video is supposed to use
   internally, exposed standalone so it isn't blocked by the bug above.)
2. Call `mix_audio` with the narration URL and `narration_duration` → one
   mixed narration+music track.
3. Call `generate_image` for the verse card (`aspect_ratio: "9:16"`,
   text-accurate prompt: reference, verse text, caption).
4. Combine the merged video + mixed audio + verse card into one finished
   file — by hand or whatever assembly method is available, since the
   automated version is what's broken. This is explicitly a stopgap, not
   the intended long-term process.

**Before trusting `finalize_video` again (once the bug above is actually
fixed and confirmed)**, generate exactly one end-to-end and have the page
owner glance at it — mainly to confirm the verse card sits where it should
and the output is genuinely 9:16. Once confirmed, run the rest of the month
without asking again.

## Always, every video

- Use the Ramping It Up Studio tools connected through the MCP connector —
  never Manus's own built-in generator, even as a fallback.
- `aspect_ratio: "9:16"` on every still, clip, and verse card — never
  default. English and Spanish each get their own casting, never a shared
  scene (section 2).
- Never call `generate_music` for this page. Use `finalize_video` for
  single-clip scenes once confirmed working; use the fallback procedure
  (section 9) for multi-clip scenes until the known issue is fixed.
- Never pick a narration voice, and never call `list_voices` — use the one
  fixed voice_id for the language being narrated, see section 0.
- Always pass `narration_duration` to `mix_audio`/`finalize_video` — it's
  required, not optional.
- Every slow tool returns a `job_id` — poll `check_job_status`, never retry
  blind or treat "still running" as a failure.
- Quote the estimated cost before any video generation step.
- Stop and ask before generating anything that doesn't clearly follow from
  this workflow.
