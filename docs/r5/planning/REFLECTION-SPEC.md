# REFLECTION-SPEC — the deep pages behind the door (Insights' record)

> **SHIPPED as of v4.36 — kept for rationale; do not build from this.** The deep pages all shipped —
> Slice A (`viewRitual`/`viewPalate`, v4.30), Slice B (tea-detail why + freshness, v4.34–v4.35), Slice C
> (`viewTimeline`, v4.36); the reflection is complete. Current state: `STATE.md` +
> `docs/r5/planning/AUDIT-REPORT-v4.36.md` (the living seed).

> **Written 2026-08-29, planning lane. Docs push on write.** The deep reflection views that the Home
> lead-insight **door** (R165) opens into. Companion to `INSIGHT-ENGINE-SPEC.md` (the lead engine — the
> door's sentence) and `HOME-VISION.md` (Home = the moment, Insights = the record). **Not yet built** — its
> governing rulings mint when the reflection ships. Brainstorm-settled, buildable in slices.

## Purpose

Home shows **one revelation** (the lead insight, a door). This is **the room behind that door** — the
record to Home's moment. It **completes the diary**: the app stops merely storing sessions and starts
telling you about yourself in depth. And it **closes the door's current dead-end** — today the lead-insight
door opens Insights as a graceful destination, but the *specific* "why" page it promises ("why, on
Insights") does not exist yet (R165: "the deep pages are a later Insights slice"). This is that slice.

The whole surface obeys the **baseline** (INSIGHT-ENGINE-SPEC / R167): reflections read **behaviour × the
tea's character, never noisy free-text**; every figure is computed live, never hardcoded; colour is data.

## The five views

1. **Your palate — why you like what you like.** Ratings × the teas' real **families** (type / catalog /
   flavour tree): which families you reach for and rate highest, and the shape of your taste. The
   destination for **palate-lean** and **highest-rated-&-why**. *(Flavour-level depth deepens as the
   tasting-input data lands — data ladder below.)*

2. **Your ritual — the shape of how you drink.** The **colour clock expanded** (the Insights lead: when ×
   what, at full resolution), **vessels**, **temperatures-by-type**, and **rhythm** (cadence, time-of-day,
   day-of-week — the non-comparative pattern, R161/HOME-VISION). The destination for **morning-truth**,
   **temperatures-by-type**, and the rhythm family.

3. **Your terroir — origins mapped.** Where your teas grew, as discovery (builds on the shipped Origins
   surface, `viewOrigins`). The destination for the origins section.

4. **Each tea's page — why this tea.** Per-tea: **why this tea** (its character, your history with it) +
   the **earned brew guide** (your best-rated parameters for it — the **first taste of guided-discovery
   brewing**, the baseline's "converge on your own preference") + **freshness** (freshness reading,
   haven't-reached-for, the sweet-spot). **Builds on the existing tea-detail screen** (`viewTeaDetail`) —
   the deepening of a surface that already exists, not a new one. The destination for **freshness**,
   **haven't-reached-for**, and per-tea sweet-spot.

5. **Teas over time — a history view.** Your shelf and your drinking **across time**: what you were into
   then vs now, teas coming and going, the seasons of your practice. (Wrapped is the monthly moment; this
   is the continuous record.)

## Navigation — deep-link, never open-and-hunt

The lead-insight door (and any pointer into the reflection) lands **directly on the specific page and
section, scrolled to the relevant "why"** — the reader never opens a surface and hunts for the line that
sent them. The mapping from the lead types (INSIGHT-ENGINE-SPEC pool) to their landing:

| Lead type | Lands on |
|---|---|
| palate-lean, highest-rated-&-why | **Your palate** |
| morning-truth, temperatures-by-type, rhythm | **Your ritual** (the clock/temps/rhythm section) |
| freshness, haven't-reached-for, sweet-spot | **that tea's page** (§freshness / §brew guide) |
| (the origins section) | **Your terroir** |

"why, on Insights" is a promise the door keeps precisely: the tap that named a pattern lands on the page
that explains *that* pattern, scrolled to it.

## Whole-Insights-explorable

The shallow Insights sections **become the doors into their deep views** — the surface the warmth pass just
dressed is the map, not a separate one:

- **Type mix → Your palate** · **the colour clock → Your ritual** · **Origins → Your terroir** · a **tea
  named in Notes → that tea's page**.

**Reuse the existing Insights structure; do not bolt on a parallel one.** Each `.ins-sec` gains a "tap to
open its deep view" affordance (the same door grammar as the lead insight — a register that opens a page),
not a second navigation.

## Future candidates (documented, not built)

Recorded so they're on the map, out of this scope: **mood correlations** (mood × tea/rating — needs the
mood data to accrue); **cost / value analysis** (a deep spend/value view beyond the current spend page);
an annual **"your year"** (Wrapped's yearly sibling); **tea-vs-tea comparisons** (two teas side by side);
**vessel-outcome patterns** (which vessel you rate a tea highest in). None is in the reflection slice; each
is its own later track.

## Data ladder — smart now, deeper as data grows

- **Reliable now:** type, rating, time-of-day, vessel, origin patterns — the palate (family-level), ritual,
  terroir, and teas-over-time views can ship real reflection from these today.
- **Deepens as data lands:** **flavour-level palate depth** (the palate view's fine grain — the fingerprint
  of *what* you taste) waits on the **structured tasting-input** (`IDEA-tasting-mode.md`); the per-tea
  **earned brew guide** deepens as **ratio'd / rated-session** data accrues (enough rated sessions per tea
  to name a best parameter set with confidence — never-guess until then). Ship the reliable spine of each
  view now; let the flavour and brew-guide layers thicken as the inputs arrive.

> **Mints when the reflection ships** (its governing rulings — the deep-link contract, the
> Insights-is-explorable contract, the per-view container rulings — assigned then, not now).

## Related

- `INSIGHT-ENGINE-SPEC.md` — the lead engine; the door's sentence and the 7-type pool that land here.
- `HOME-VISION.md` — Home = the moment, Insights = the record; the door (R165).
- `IDEA-tasting-mode.md` — the structured tasting-input that thickens the palate view's flavour layer.
- `R5-AUDIT.md` §3 — Insights / the reflection layer.
