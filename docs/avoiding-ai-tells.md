# Avoiding AI Tells — Writing, Images & Video

A working reference for making generated and AI-assisted content read and look
human. Sourced from 8 researched videos on AI detection and manuscript
editing, supplemented with well-documented general knowledge where the
research had gaps (flagged explicitly below — don't mistake supplemented
sections for video-sourced claims).

**Coverage note:** Only 3 of the 8 source videos were actually about *AI
detection* specifically. The other 4 were general fiction-craft videos from
professional editors — included because "amateur manuscript" symptoms
overlap heavily with AI-writing symptoms, but they never mention AI. None of
the 8 covered AI-video artifacts (blinking, morphing, lip-sync) or the
specific photoreal image tells (hands, skin, faces, background text) —
those sections below are general knowledge, not from these sources.

---

## 1. Writing tells

The core insight, from the two AI-detection-focused videos: **no single
technique here is disqualifying on its own** — humans use rule-of-three,
metaphor, and contrast too. The tell is **density and clustering**: several
of these patterns repeating every paragraph, rather than surfacing
organically once in a while.

### Vocabulary to sweep out
`delve`, `tapestry` (of culture/innovation/flavors), `testament to`, `realm`,
`landscape` (especially "digital landscape"), `underscore`, `pivotal`,
`robust`, `leverage`, `navigate` (as in "navigate challenges"), `foster`,
`in today's fast-paced world`. These are statistically overrepresented in
LLM output and read as generic filler. **Fix:** swap for a plain, specific
word — or better, a concrete image.

### Sentence-level patterns
- **"Not X, it's Y" / "not just X, it's Y" contrast construction** — sounds
  profound once, becomes a tic after the second use per page. Cut most
  instances.
- **Rule-of-three addiction** — triadic lists everywhere ("furious,
  frightened, undone"; "cold, cruel, calculating"). AI can't resist
  symmetry. **Fix:** cut one item, or add a deliberately awkward fourth to
  break the rhythm.
- **Metaphor/simile stacking** — a dense image in nearly every sentence,
  often nonsensical when parsed literally ("a thunderstorm folded into
  velvet"). **Fix:** one grounded image per scene, not per line.
- **Clean pivot sentences overused** as a scene-transition crutch (e.g. "But
  it was already too late.").
- **Insecure paragraph-ending summaries** — restating the point just made
  ("Understanding X is crucial for Y..."). **Fix:** delete the last (often
  the first) sentence of the paragraph and see if it still works — it
  almost always does.
- **Emotional flatlining ("no burstiness")** — every sentence is a similar
  length regardless of the scene's emotional temperature; a breakfast scene
  and a breakup scene read the same. **Fix:** sentence length should track
  stakes — longer, flowing sentences for calm, short fragments under
  tension.
- **The vague plague** — generic description ("the vehicle moved swiftly
  down the road") instead of one invented, specific detail (a brand, a
  smell, a number). **Fix:** force one concrete specific per description.
- **Explanation addiction** — narrating the emotion right after showing it
  ("she slammed the door, angry and frustrated, because..."). **Fix:** cut
  the explanation; trust the action.
- **Therapy-speak dialogue** — characters state feelings in complete,
  balanced sentences. Real speech interrupts, contradicts, and trails off.
- **Missing sensory/setting grounding** — long dialogue exchanges with no
  physical staging or concrete world detail.
- **Overwriting** — more than two stacked adjectives. One strong verb beats
  five modifiers.
- **Em dash pileups** — the most "viral" tell online, but not sufficient by
  itself; a manuscript can be em-dash-free and still read as AI, or contain
  a few and read as fine.

### Self-editing techniques (from the source videos)
- **The one-breath test:** read three consecutive sentences aloud without
  a natural pause. If you can do it easily, the rhythm is too smooth —
  vary sentence length.
- **The chaos prompt (for AI-assisted first drafts):** when asking a model
  to draft, explicitly instruct it to avoid the patterns above — ban the
  vocabulary list, ban rule-of-three, ban paragraph-summary endings, and
  force mixed sentence length. This produces a rougher, less-detectable
  first draft that needs less manuscript cleanup later. **This studio's
  Director pipeline now does this by default** (see §4).

---

## 2. Image tells

The source videos barely touched this (one anecdote about AI-art red flags
in a very different context — VTuber character art, not photoreal images).
**Everything below is general, well-documented knowledge, not from the
researched videos** — treat it as a starting checklist, not a sourced claim.

- **Hands and fingers** — extra/missing fingers, fused fingers, unnatural
  bends. Still the most common tell in 2026-era models, though much
  improved. Always zoom into hands before publishing.
- **Eyes and background text** — mismatched pupil direction, garbled or
  nonsensical text in signs/labels/book spines in the background.
- **Skin texture** — overly smooth, waxy, or plastic-looking skin with no
  pores, texture, or asymmetry. (Note: this studio's melanin-lighting
  guidance already fights a *different* failure mode — deep skin rendered
  grey/ashen — which is not the same issue as waxy over-smoothing on any
  tone.)
- **Facial symmetry** — real human faces are subtly asymmetric; AI often
  over-corrects toward perfect symmetry, which reads as uncanny.
  Illogical accessory placement (an earring that isn't structurally
  attached to the ear, hair that merges into an accessory) is a related
  giveaway.
- **Lighting/shadow inconsistency** — a shadow falling the wrong direction
  relative to the visible light source, or multiple light sources with no
  visible fixtures.
- **Repeated background elements** — a crowd or pattern where the same face
  or texture tile repeats.

### Fixable via prompting vs. not
- **Fixable:** explicitly prompt against symmetry ("naturally asymmetric
  face, not perfectly symmetric"), specify exact accessory attachment
  points, ban "garbled text" by keeping text out of the frame entirely
  (this studio's 📖 "reserve blank text area" toggle already does this for
  book pages), and use one consistent character/style reference across a
  series (this studio's turnaround sheets already do this).
- **Not fixable retroactively by prompting:** hands, eyes, and skin texture
  need a **manual visual QA pass** — zoom into hands, eyes, and any visible
  text on every generated image before publishing. No prompt reliably
  prevents this 100% of the time yet.

---

## 3. Video tells

Not covered by any of the 8 source videos. General knowledge, offered with
the same caveat as §2:

- **Unnatural or absent blinking**, or blinking at a mechanically regular
  interval.
- **Morphing/warping mid-motion** — an object or facial feature subtly
  changing shape as the camera or subject moves, most visible on hands and
  hair.
- **Object permanence failures** — background objects that shift, duplicate,
  or vanish between frames.
- **Lip-sync drift** — mouth shapes that don't quite match phonemes,
  especially on consonants (this studio's Relight and Lip Sync skills
  specifically target keeping mouth movement locked to the source audio —
  worth a manual check on any lip-synced output regardless).

---

## 4. What this studio already does about it

- **Director pipeline** — the free-LLM script-drafting prompt now
  explicitly instructs the model to avoid the writing tells above (banned
  vocabulary, no rule-of-three, no paragraph-summary endings, varied
  sentence length) — producing a rougher, more human-sounding first draft
  by construction, not just as an editing afterthought.
- **Image Studio** — a "🕵️ Reduce AI-look artifacts" toggle appends
  prompting against facial symmetry, background text, and waxy skin.
- **Book Outline** — a condensed self-editing checklist is shown directly
  in the studio so you can check a manuscript against it without leaving
  the app.

None of this replaces a human read-aloud pass and a zoomed-in look at hands/
eyes/text before you publish — it just removes the easiest, most common
tells before you get there.

---

## Source map

| Video | What it covered |
|---|---|
| How to Spot AI Writing Tells (Pattern Density) — The Novelist Studio | Writing — metaphor stacking, rule-of-three, clean pivots; the clustering/density insight |
| Agents Can Tell If You Used AI — The Novelist Studio | Writing — nonsensical metaphors, emotional flatlining, missing sensory detail |
| I Can Spot AI Writing in 5 Seconds — Writing Secrets | Writing — vocabulary list, em dash, burstiness, vague plague, chaos prompt, one-breath test |
| Author CAUGHT Using AI — kat 'n chat | Image (VTuber art context) — misplaced accessories, blended features, asymmetric eyes, watermarks |
| I Edited 100 Manuscripts... 7 Mistakes — Patrick Walsh | Craft only — explanation addiction, therapy-speak dialogue, overwriting |
| 9 Ways to Build Characters — Patrick Walsh | Craft only, not AI-tell focused |
| I Analysed 100 Opening Lines — Patrick Walsh | Craft only, not AI-tell focused |
| I'm an Editor. 7 Signs Your Book Will Flop — Alyssa Matesic | Craft only, not AI-tell focused |
