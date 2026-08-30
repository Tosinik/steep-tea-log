# HOME-VISION — what Home should be (the gating vision for the combined redress)

> **SHIPPED as of v4.27 — kept for rationale; do not build from this.** The combined Home frame+content
> slice landed (`greetingMastheadHTML`/`leadDoorHTML`, steep-dashboard.js). This is the vision it was
> built from; "Home stays HELD" below is discharged. Current state: `STATE.md` +
> `docs/r5/planning/AUDIT-REPORT-v4.36.md` (the living seed).

> **Written 2026-08-29, planning lane. Docs push on write.** Companion to **R159** (Home is HELD — a
> combined frame+content effort, not a containers-only restyle) and **R160** (calm-first is not spare-first).
> The banked FRAME layer is `docs/r5/boards/home-element-mix.dc.html`; this file is the CONTENT + warmth that
> ships *with* it. Brainstorm-open — **not a spec.**

## Purpose

Home should be a **cool screen** — an alive, present-tense landing / identity surface, not a utility floor.
The spine restyle alone can't get there: it redresses a thin floor (masthead + a few RULE sections), and on
the identity surface that reads as **empty, not calm**. Home needs its **own content and its own warmth** —
which is why R159 holds the frame and ships it combined with this, and why R160 says the austerity that is
correct on the utility surfaces is *not* a mandate here.

**The lead insight — the reflection engine.** Home's one present-tense revelation (the Seeds below are its
candidates) is produced by the reflection engine specced in **`INSIGHT-ENGINE-SPEC.md`** — the same engine
whose full reflection warms Insights (Home = the moment, Insights = the record). Its **governing principle
is the refined baseline:** reflections read **behaviour × the tea's character, never noisy free-text**;
**no single vendor is the truth** (vendor reliability varies); and brewing is **guided discovery toward the
user's own preference**, not a dictated correct brew. Every Home insight must satisfy that baseline.

## Guardrails (a Home idea must clear all four)

- **Present / forward tense (R115).** Home answers *"what now"* — the next cup, a forward hook — **never a
  recap.** A retrospective belongs on Insights, not Home.
- **Tea-first.** It helps you *drink* (choose, brew, enjoy); it does not serve the app (no engagement bait,
  no "come back" mechanics).
- **calm ≠ spare (R160).** Warmth, imagery, liquor colour, and character are **allowed and wanted**. What
  stays forbidden: gamification, streaks, nagging, metric-worship. Warmth is not a streak.
- **Never-guess (the three-tier cascade).** Show **nothing** rather than an uncertain value. A blank beats a
  wrong or hollow number on the surface that's supposed to feel alive.
- **The way to start a session is always reachable and visible.** The nav **Log** button (`bn-log`) becomes
  a bold, obvious FAB; Home's **"Start steeping"** shows whenever a tea is proposed. Both may be present, but
  the start-a-session path must **never fully disappear** — it is the app's one indispensable action, and a
  calm surface still keeps its front door in plain sight.

## Seeds (from the brainstorm — verbatim intent, not spec)

- **Today's tea, deepened** — a forward hook about a tea brewed today: origin, a flavour note to catch next
  time, *"you're N brews in, sweet spot ~90°/4g."* *Caveat (Niklas): repeats if mornings are the same tea* —
  so it needs a de-repetition answer.
- **Recently-brewed showcase / carousel** — a rotating **visual** showcase of recent teas; delight and
  identity, **not** a recap (pleasure, not data). The rotation is also what solves the single-card
  repetition problem above. *(Niklas's idea.)*
- **Pass a cup on Home** — social gifting surfaced on Home **once the userbase grows**; deferred until more
  users. *(Niklas's idea.)*
- **Warmth in the frame** — Home carries tea imagery, liquor colour, and a characterful greeting: the visual
  life the utility spine deliberately omits (R160).
- **Existing backlog candidates** — palate-this-season, mood-time patterns, per-tea sweet-spot (the
  smarter-over-time backlog).
- **Cadence's neutral pattern (migrated from Insights, R161)** — Insights culled its Cadence card because
  its observation was a vs-last-month *comparative* ("a touch less than last month"), which broke the
  retrospective register. The **non-comparative** flavor of it — *when/how you brew*, a present-tense
  rhythm rather than a judgement against last month — belongs on Home, not Insights. It overlaps
  mood-time-patterns; keep it non-comparative and forward (never "you brewed less").

## Contrast & warmth (extends R160 — app-wide)

Four spine slices (shelf, Shopping, session-detail, Insights) collapsed the palette to near-monochrome —
porcelain, ink, hairlines, one clay, tiny liquor flecks. **Correct as structure, lifeless as a whole.** The
fix is not to retreat from the spine but to put **the app's own colour on top of it**: liquor swatches used
**boldly**, tea imagery, type tints, and real **figure/ground** contrast. Colour on the spine's bones, not
instead of them. **Home is the proving ground** — if warmth-on-structure works there, the utility surfaces
get a contrast pass too, so R160's "calm ≠ spare" becomes **app-wide**, not Home-only.

- **Palette candidate — a whiter ground.** `--porcelain` today is `#F6F2E9` (warm cream); a whiter, cleaner
  ground makes the liquor colours **pop**. Niklas prefers it. **Test on Home first, possibly app-wide.** A
  token change — measured and changed in one place (`styles.css :root` + the dark block); it touches every
  surface, so it rides its **own** decision, never smuggled into another slice.

## Wrapped is a rhythm, not a card — the model for time-bound Home elements

Wrapped keeps **R103** (it reports the last **complete** month — never a partial). Its life cycle:

- **At each month's turn it arrives on Home as a moment** — *"Your August,"* prominent at the start of the
  new month — **then recedes** as the month goes on.
- **It permanently lives on Insights as a shelf** — the current one plus an **archive** to page back
  through past months.

**Home = the moment; Insights = the record.** This is the model for **any** time-bound element on Home: it
earns the lead by being **timely**, never by being **permanent** (Home stays present-tense, R115; the
archive/retrospective stays on Insights). Note this is a *fuller* life cycle than the current Insights
Wrapped **door** (R161) — that door is the Insights end of the same rhythm; the Home moment is the new half.

## The lead insight is a door — Home = the door, Insights = the room

The lead insight (the moment) is **not a dead-end card — it is a door.** Tapping it opens its **deep
reflection page** on Insights: the *"why"* behind the line — the palate profile, your top five, the spread.
Same split as Wrapped above: **Home = the door** (this slice), **Insights = the room** (a later reflection
slice). It reuses the `.ins-door` BOX the Insights redress already shipped (R161).

**Sequencing — so the door is never dead:**

- **On Home's ship**, the door opens **Insights** as a **graceful destination** — the existing surface, not
  a 404. It always lands somewhere real.
- **The Insights reflection slice, sequenced right after Home**, builds the specific *"why"* pages
  (`INSIGHT-ENGINE-SPEC.md` § *Beyond the lead — the reflection layer*) so the door lands **precisely** on
  the page for that insight.

The door opens a real room from day one, and the *specific* room one slice later — never a dead link.

## Candidates on the record

- **Topbar tagline "a tea diary."** A candidate identity line under the SlowCup wordmark — **liked, not
  currently live**. Present in the reference mockup below.

## Reference

The visual direction for Home is the board banked at **`docs/r5/boards/home-warm-reference.dc.html`** (a
`.dc.html`, the boards-dir convention — the *source* of the screenshot that seeded this direction, not a
flat PNG). **Provenance:** it is the newest cut of the **R4 "Home is the present tense"** revision lineage
(internally badged `R4 · HOME`, export 2026-08-05) — effectively **rev3**, adding the "a tea diary" tagline
that `docs/r4/boards/home-revision-rev1/rev2.dc.html` don't carry; adopted here as the **R5** warm-direction
reference. It is distinct from `docs/r5/boards/home-element-mix.dc.html` (the R159 FRAME layer): this is the
**content + warmth** half.

What it shows: a warm, editorial Home — a serif **"Second pour today — a proper tea day."** greeting over a
"FRIDAY AFTERNOON" eyebrow and a *"Your 42nd cup."* line; a clay **"Start steeping"** beside a quiet **"Log a
cup →"**; the **"a tea diary"** tagline by the wordmark; **Earlier today** rows led by bold liquor swatches;
**Running low** and **Favourites** as light groupings; and a bold green **Log FAB** centred in the nav. It is
the contrast-&-warmth direction executed on Home — colour and imagery on the spine's structure.

## Status

**Brainstorm-open, not spec'd.** When Home is opened for real:

> **brainstorm → spec → the combined Home slice = the banked board's FRAME + this CONTENT + warmth.**

Until then, Home stays HELD (R159). The frame board is banked and must not be shipped frame-alone; the
content here is Home's gating dependency, elevated from parked (R5-AUDIT §6).
