# SESSION-FLOW-REDESIGN — the steeping flow, redesigned

> **Written by the Code lane against v4.36 (`dab1197`), read-only clone. Docs push on write.** This is
> the **design authority the build reads from** for **wave-1 item #3** of `AUDIT-REPORT-v4.36.md` (the
> deepest wave-1 item — its design pass, **not a reorder**). It redesigns the **information architecture**
> of the session/steeping flow, which has grown by accretion into a convergence point.
>
> **No R-numbers here** — they mint when the slices build. **Tea-First holds throughout:** nothing in the
> ordinary flow is ever *required*; skipping any capture leaves no gap and earns no nag
> (`IDEA-tasting-mode.md` §"the tension it must resolve"; `PHASE2-PRESPEC-NOTES.md` Tea-First).
>
> Companions: `IDEA-tasting-mode.md` (the guided-mode sequence + the deep/everyday spectrum),
> `docs/r3/planning/DATA-flavour-tree.md` (the 12-family tree the tagger is built on),
> `docs/r5/planning/INSIGHT-ENGINE-SPEC.md` (structured tasting feeds its *character* half — clean signal,
> never free-text noise),
> `docs/r5/planning/TEA-PAGE-CALM-COPY-POLISH.md` (wave-1 #2.5, built before this track; #3's explainers use
> its reusable ⓘ-popover component, and its copy follows the de-AI'd house style).

---

## 1 · Frame — a convergence point that grew by accretion

The steeping screen (`sessionSteepingHTML`, `steep-sessions.js:1249`) is where four separate concerns have
piled up over successive rounds, each added on top of the last rather than into a designed whole:

- the **brew guide** (schedule pills, `scheduleStripHTML`),
- the **timer** (ensō ring, countdown/stopwatch, focus mode),
- the **v4 pour feedback** (the context-gated diagnosis nudge, `brewNudgeRowHTML`),
- the **tasting capture** ("What are you tasting?", `flavorCaptureHTML`).

Each is calm on its own; together they read as a stack of unrelated widgets, and the *order* they stack in
is wrong (see D1). This redesign gives the screen one information architecture, calm-first, with tasting
demoted to a collapsible layer and the objective facts of the cup promoted above it. It also opens a
**second, deliberately-attentive path** (guided tasting, D4) that must *not* leak into the ordinary flow.

**The current render order, read from `sessionSteepingHTML` (so the build sees exactly what moves):**

| # | Block | Source | Note |
|---|-------|--------|------|
| 1 | Titlebar (back · name · mute) | `:1281` | keep |
| 2 | Context line "95°C · guide 25s · Vessel" | `steepContextHTML` `:1287` | facts, read-only, already near top |
| 3 | Brew-guide pills | `scheduleStripHTML` `:1288` | keep |
| 4 | Pour-feedback nudge (v4) | `brewNudgeRowHTML` `:1289` | keep |
| 5 | Timer box (ring, mode, ctrls, focus door) | `:1291` | **D5 reworks the time edit** |
| 6 | **"What are you tasting?"** | `flavorCaptureHTML` `:1313` | **D1: this sits ABOVE the facts inputs — wrong** |
| 7 | Logged-steeps list | `:1315` | keep |
| 8 | **Facts inputs: Water temp · Steep time · Notes** | `form-grid` `:1317` | **D1: these belong above #6** |
| 9 | Save steep / Finish | `:1323` | keep |

The defect is visible at a glance: the **editable objective facts (#8) sit below the tasting prompt (#6)**.

---

## 2 · Settled decisions (designed in)

### D1 · Information order — facts before feelings (origin issue #22)

**Issue #22** (raised 2026-07-13, twice-slipped, now designed-in). The **objective facts of the cup —
water temp · time · ratio — sit ABOVE "What are you tasting?"**; tasting is **collapsible** below.

- **Promote the facts block** (temp · time · ratio) to directly under the timer, above tasting. Temp and
  time are the `form-grid` inputs at `:1318-1319`; **ratio** is `computeSessionRatio` (opt-in, from the
  session's grams + water) — surface it here when it computes, omit it silently when it doesn't (the
  per-part omission pattern `steepContextHTML` already uses, `:1334`). Do **not** invent a ratio input on
  this screen — grams/water are captured at setup; this block *reads* the verdict.
- **Demote tasting to a collapsible section** below the facts — closed by default is acceptable (Tea-First:
  tasting is optional and must never be the first thing demanded). The collapse control names what's inside
  ("What are you tasting?") so it's discoverable, never auto-expanded into the user's face.
- **Rationale, recorded:** facts are what you know *now, at the cup*; feelings are what you *choose* to
  attend to. Facts before feelings is the calm order and the honest one.

### D2 · Tasting model — session-level by default; per-steep is an opt-in layer — SHIPPED v4.41/R182

Tasting notes belong to **the sitting**, not to a timed infusion. **Default tasting is session-level** — one
set of notes for the cup, **no per-steep timing implied.**

- **Why this is correct, not just simpler:** the current per-steep model manufactures a false artifact. A
  taster tags "honey" once and moves on; the absence of a re-tag on later steeps is read by the code as a
  *temporal claim that the note faded*:
  - `sessionFlavorStory` (`steep-sessions.js:1599`) → **"Honey led early; …"** from `first[0]` alone.
  - `flavorObservation` (`steep-teas.js:947`) → **"Honey peaks at steep 1, softens after"** from steep
    positions.
  These read **absence-of-a-re-log as evidence of fade.** Session-level tasting removes the artifact at the
  root: with no per-steep timing implied, a single tag is just "tasted this in this sitting."
- **Per-steep evolution — recognized, never manufactured (Q2, RESOLVED).** The default is session-level;
  genuine per-steep evolution *is* recognized and told back — but **only from real per-steep logging**
  (actually-different notes across steeps that were themselves logged). Its natural home is **guided mode**
  (D4), where re-logging each steep *is* the explicit intent, so the positional reads (`flavorObservation`,
  `sessionFlavorStory`, `teaFlavorProfile.positions`) run only on data that carries per-steep intent, never
  on incidental single-tags. **The read-back must never infer fade/lead from a note's *absence* in later
  steeps** — that inference is the "led early" artifact (D2's core defect).
  - **Implementation note (the fix's shape).** Gate `sessionFlavorStory` (`:1599`) / `flavorObservation`
    (`steep-teas.js:947`) claims on **real per-steep presence *differences*** — a note present in one logged
    steep and genuinely different in another logged steep — **not on absence.** A steep that carried no
    tasting contributes no evidence. Today `sessionFlavorStory` builds "X led early" from `first[0]` alone and
    `flavorObservation` reads a lone steep-0 tag as "peaks at steep 1, softens after" — those are
    absence-inferences and must go.
- **Data model (design note, no migration mandated here):** both arrays already exist — session tasting
  rides `sessions.tags` (the `sessionTags` draft field), per-steep rides `steeps[].tags`. This is the
  **bare + membership** scheme unchanged (WS4), **no SQL.** The reads that currently pull from `steeps[]`
  by default — `distinctVocab`/`teaFlavorProfile` (`steep-teas.js:927/932`) — repoint to session-level as
  the primary source, with per-steep as the opt-in overlay.
- **Free side effect worth banking:** once tasting is session-level, **quick and cold-brew sessions (which
  carry no `steeps[]`) finally feed the tea-page profile** — closing the known WS4 scope edge recorded at
  `ROADMAP-v4.md` Pillar D (the `distinctVocab` choke point). Confirm the profile rungs
  (`teaFlavorProfile.rung`, `:943`) still read sensibly off session counts.

### D3 · The tagger — hierarchical / guided, not a flat wall and not a literal wheel — SHIPPED v4.41/R182 (guided mode itself = slice c)

Built on the **flavour tree** — **12 families → sub-families → notes** (`DATA-flavour-tree.md`, ratified
R31; the wheel's ~111 notes are the ceiling, ~80 curated-seeded today). The interaction: **tap a family →
reveal its children.** It takes the wheel's *guide-me-to-the-note* logic **without the phone-hostile radial
geometry.**

- **This replaces `flavorCaptureHTML`'s flat `KB_FLAVOR_FAMILIES` grid** (`:1210`; the WS4 20-chip / 4-family
  set). The 12-family tree is the structure; a tapped family expands to its sub-families/notes in place
  (progressive disclosure, never a modal — the current "never a modal, never required" contract holds,
  `:1208`).
- **On expanding a family, surface first:**
  1. **(a) the notes this tea's family typically shows** — the tea's own known profile (its catalog row in
     `steep-tea-types.js` / vendor notes / the family's common members). This is the *"anchored to the real
     profile"* principle from `IDEA-tasting-mode.md` §"the everyday counterpart" — picks are a subset of what
     the tea actually is.
  2. **(b) the user's earned vocabulary for that family** — their `tagLibrary` words that resolve into it.
     **This is the fix for Bug B (§3) and a hard requirement of this decision — the tagger is incomplete
     without it.**
- **Resolution / storage contract (unchanged, `DATA-flavour-tree.md` §"Storage contract"):** the specific
  word is **stored and displayed as written**; membership resolves **exact key → alias (EN/DE) → bare**;
  roll-up climbs **term → sub-family → family**. A genuinely novel word stays **bare** and lives in a
  **"your words"** bucket (the honest floor) rather than being force-fit into a family.
- **A free word stays possible** when the user means it — the picker is the default, not a cage
  (`IDEA-tasting-mode.md:113`). Keep the free-word door; it now also feeds earned vocab back into (b).
- **The literal radial wheel is explicitly NOT the default.** It is noted as a *possible later
  colour-as-data artifact to prototype against* — not built now. The geometry is phone-hostile; the tree
  gives the same guided-discovery with tap-friendly hit targets.

### D4 · Guided tasting mode — its own path, NOT the log pipeline

A **separate flow** running the `IDEA-tasting-mode.md` sequence, entered on purpose for **attending properly**
to a tea (usually new, or a sample). It produces a **rich record that feeds the tea's profile** — it is not
the ordinary log with extra fields.

- **Entry door (Q1, RESOLVED — prominent, not buried).** Guided tasting is a **delight / showcase feature**
  and must be surfaced as one, never buried. A **prominent primary entry** (exact placement — a Home action
  vs a dedicated entry — is a design detail for the guided-mode slice), **tea-anchored**: **picking the tea
  is step zero** of the flow. Plus a **secondary contextual "Taste this properly" link on the tea's detail
  page**, since guided tasting is usually *this specific tea*. Rationale: a showcase feature reachable only
  from a tea-detail link would go unfound — surface it primarily; keep the contextual link as the shortcut.
- **The sequence** (`IDEA-tasting-mode.md` §"Rough step sequence"): **dry leaf → wet/rinsed leaf → liquor →
  aroma of the liquor → taste → mouthfeel/texture → where it sits → finish → across steeps.** Order follows
  the tea, not the form.
- **It is deliberately attentive and never the default** — this is how it satisfies Tea-First: ordinary
  logging stays minimal-app; the deep mode is opted into *because* the close attention is the point, and is
  abandonable at any moment without penalty (`IDEA-tasting-mode.md` §"the resolution"). **Nothing about
  guided mode leaks into the normal flow** — that separation is the feature's justification and must be
  stated in the build or it will drift into the default path.
- **The per-steep evolution layer (D2) lives here** — "across steeps" is step 9, and re-logging per steep is
  the intent in this mode, so the positional reads are honest here.
- **Two captures this mode is uniquely placed for:**
  - **Liquor-colour at the perfect moment** — step 3 asks for liquor colour *while you're looking at the
    liquor*: the ideal moment for **Tier-1 swatch capture** (user-set = truth, `liquorFor` cascade), far more
    accurate than picking from memory later.
  - **Fields nothing else captures** — dry-leaf aroma, wet-leaf aroma, mouthfeel, position, finish length.
    Whether these are new columns / a JSON blob / folded into tags is an **implementation question for the
    build**, not settled here (`IDEA-tasting-mode.md` §"Open questions"). Design lean: stay inside the
    existing model where possible (a session variant, like cold brew / steepless matcha).
- **Sample synergy** (not in scope, flagged): a **sample** tea (5–10 g, two–three sittings) is the natural
  home for guided mode. If the sample flag is built, mind the `stockTier` interaction — a 10 g sample reads
  `low` immediately (`IDEA-tasting-mode.md` §"the sample flag"): it must reach the single-writer stock
  predicate, not be a bare label.

### D5 · Timer rework — edit the time on the timer, quick ±5/±10 mid- and post-run

- **Edit the time on the timer itself**, not by scrolling down to the facts/temp inputs. The current inline
  edit exists (`d_beginTimeEdit`/`timerTargetEdit`, `:1409`/`:1275`) but is **gated to stopped-only**
  (`:1410` `if(d.timer.running) return`; the tap affordance only renders when `!tm.running`, `:1276`), and
  the *other* editable time field lives down in the `form-grid` (`:1319`) next to temp — so today you edit
  time by scrolling past the tasting capture to where temp is. **That coupling is wrong**: time editing
  belongs on the ring.
- **Add quick `+5s` / `+10s` (and their negatives) usable mid-run and post-run**, adjusting `timer.target`
  (and `curTime`) live. Route every write through the **single writer `setSteepTime`** (`:1401`) so
  `timer.target` and the logged `curTime` can never drift (#13's invariant — do not add a second writer;
  `fixtures/steeping-timer-test.js` guards this).
- **Keep** the stopped-only inline *type-a-number* edit for setting an exact value; the ±buttons are the
  mid-brew nudge. Blank/zero still reverts (`d_endTimeEdit`, `:1417`) so Start never faces a 0s countdown.

---

## 3 · Two bugs — fix regardless of the redesign (fold into whichever slice touches the surface)

### Bug A · Focus-mode breath cue is stuck on "breathe out" — FIXED v4.40/R181

- **Symptom:** in focus mode the guidance never alternates — it reads "breathe out" the whole time.
- **Root cause (verified):** the ring *does* breathe — `.focus-enso-breathe` runs `sc-breathe-slow 6s
  ease-in-out infinite` (`styles.css:807`; keyframe `:536` scales 1 → 1.05 at 50% → 1, i.e. expand 0–3s,
  contract 3–6s). But the **text cue is hardcoded** to `'breathe out'` in **two** places: the render
  (`sessionFocusHTML`, `steep-sessions.js:1379`) and the per-tick update
  (`updateTimerDisplayOnly`, `:1483`), the latter actively re-forcing "breathe out" every second. The "dead
  loop" is the *cue*, pinned by JS — not the ring.
- **Fix shape:** sync the cue to the ring's 6s cycle — **"breathe in" on the expand half (0–3s), "breathe
  out" on the contract half (3–6s)**. Prefer a **CSS-driven** cue (two labels cross-faded on the same
  `sc-breathe-slow` clock, so they can never drift from the ring and both stop together on pause) and
  **remove the JS override at `:1483`** so nothing pins the text. Honour `prefers-reduced-motion` (the
  reduce block at `styles.css:818` already disables the breathe animation — the cue must degrade to a
  single static, non-misleading label there, not a frozen "breathe out").

### Bug B · Earned "my word" notes never resurface in the tagger

- **Symptom:** a custom note, typed and reused repeatedly, never reappears as a tappable option — only the
  standard set shows. The *"vocabulary grows as you brew"* promise is silently broken.
- **Root cause (verified):** the per-steep tasting UI `flavorCaptureHTML` (`:1210`) renders chips **only from
  `KB_FLAVOR_FAMILIES`** plus the words *currently selected this steep* (`freeSel`, `:1225`). Earned words
  live in `state.tagLibrary` (custom words are saved there via `addTag`/`persistTag`, `:1536`), but the only
  path that resurfaces them here is `renderTagSuggest` (`:1500`), which returns **nothing until you reopen
  the free-word door and retype a query** (`:1503` `if(!query) return`). The chip renderer that *does* show
  all earned words — `tagLibraryChipsHTML` (`:1529`) — is wired to session/finish/edit tagging (`:786`,
  `:1653`, `:520`), **never to the per-steep flavour capture.**
- **Fix shape:** this folds into **D3b** — the hierarchical tagger surfaces each family's earned vocabulary
  (the `tagLibrary` words resolving into that family) as ready-to-tap options, with bare/unresolvable words
  in the "your words" bucket. No word the user has earned should require retyping. **This is a hard
  requirement of D3, not an optional polish.**

---

## 4 · Resolved — the two questions that were open

Both were open in the first draft; **ruled 2026-08-30** and folded into the settled decisions above.

- **Q1 · Guided-mode entry door → RESOLVED (see D4).** Prominent + discoverable — a delight / showcase
  feature, not buried: a prominent primary entry (Home action vs dedicated entry is a design detail for the
  slice), **tea-anchored** (pick the tea as step zero), plus a secondary contextual "Taste this properly"
  link on the tea's detail page. *Rationale: guided tasting is a delight feature and must be surfaced as one.*
- **Q2 · Per-steep evolution presence → RESOLVED (see D2).** Session-level default; genuine per-steep
  evolution is **recognized, never manufactured** — surfaced only from real per-steep logging (actually-
  different notes across logged steeps), **never inferred from a note's absence**. The implementation note
  (gate `sessionFlavorStory`/`flavorObservation` on real presence *differences*, not absence) is in D2.

---

## 5 · Indicative slicing (NOT ruled — sequence decided at build)

A multi-slice track. Likely shape:

- **(a) IA reorg + timer + layout — SHIPPED v4.40/R181.** D1 (facts above tasting, tasting collapsible) + D5 (time-on-timer,
  ±5/±10). Contained, no data-model change. **Bug A** slots here (same focus/timer surface).
- **(b) The hierarchical tagger + earned-vocab resurfacing — SHIPPED v4.41/R182.** D3 replaced
  `flavorCaptureHTML`'s flat grid with the 12-family tree, tea-typical + earned vocab per family. **Bug B**
  *was* this slice's earned-vocab requirement (the "Words you've used" row). **Q1 ruled session-level**: the
  tagger writes `sessionTags`; D2 repointed `distinctVocab`/`flavorObservation`/`sessionFlavorStory` and
  dropped the absence-inferences; both "Overall tags" UIs subsumed.
- **(c) Guided mode as a separate path** — D4, the `IDEA-tasting-mode.md` sequence as its own flow, with the
  per-steep evolution layer and Tier-1 liquor capture. **Q1 ruled** (D4: prominent primary entry,
  tea-anchored, + contextual tea-detail link). Largest slice; may
  itself split (the sequence UI vs the new-field capture vs the profile feed).

**Each slice is its own `/slowcup-deploy`, paused for review; the two bugs ride whichever slice touches their
surface.** Sequence and slice boundaries are ruled at build, not here.

---

## 6 · Invariants this redesign must not break

- **Tea-First** — nothing in the ordinary flow becomes required; every capture stays skippable with no gap
  and no nag. Guided mode is the *only* attentive surface, entered on purpose.
- **Calm-first** — no scores, no streaks, no "you forgot to tag" nudges. Tasting demoted, never demanded.
- **Single writer `setSteepTime`** (#13) — target and logged time stay one value; do not add a second writer
  (`fixtures/steeping-timer-test.js`).
- **Session-edit non-destructiveness** — the deep-copy / whole-object writeback that protects per-steep taste
  words + feedback (`fixtures/session-edit-test.js`) must survive the model change; if session-level tasting
  moves where notes live, that suite is the finding, not the fix (CLAUDE.md known-bugs).
- **Escaping** — all user tasting text stays `escapeHtml`/`escapeJsArg` (the tagger renders user words).
- **bare + membership, no SQL** — the model change rides the existing `tags` arrays; a genuinely novel word
  stays bare and never inflates any count (WS4 pause decision).
- **The reflection engine's clean-signal contract** — structured picks feed the *character* half; they must
  stay a subset of the tea's real profile, never free-text noise the baseline distrusts
  (`INSIGHT-ENGINE-SPEC.md`).
