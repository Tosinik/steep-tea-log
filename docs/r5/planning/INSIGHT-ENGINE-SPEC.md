# INSIGHT-ENGINE-SPEC — the reflection engine (Home's lead + Insights' record)

> **Written 2026-08-29, planning lane. Docs push on write.** The forward spec for the engine that makes
> SlowCup **reflect the user back to themselves**. **Not yet built** — it ships *with* Home (the combined
> R159 slice), and its governing ruling (the baseline principle below) **mints when the engine ships**, not
> now. Companion to `HOME-VISION.md` (Home = the moment), `PHASE2-PRESPEC-NOTES.md` +
> `SPEC-brew-advice-v3-feedback.md` (the brewing side), and `IDEA-tasting-mode.md` (the character capture).

## Purpose

The engine is what makes the app **the tea diary its byline claims** ("a tea diary") — it **reflects the
user back to themselves** rather than only storing what they type. A store of sessions is a database; a
diary tells you something about yourself you hadn't put into words.

Two surfaces, one engine:

- **Home surfaces one revelation — the moment.** A single insight, present-tense, timely (`HOME-VISION.md`:
  Home = the moment).
- **Insights holds the full reflection — the record.** The deep pages, the maps, the archive. This is what
  **warms Insights from "boring data"** — not more numbers, but the app noticing things *for* you.

## The baseline principle (the governing rule)

Every reflection and recommendation reads **behaviour × the tea's character** — **never noisy free-text
self-reports.** What you *did* (sessions, ratings, times, vessels, origins) crossed with what the tea
*authoritatively is*. Free-typed notes are signal the engine must distrust; behaviour and curated profile
are not.

**No single vendor is authoritative, and vendor reliability varies.** A gongfu-specialist's parameters are a
solid starting point; a generic vendor's are rough. So a vendor is treated as **one weighted source**, never
the truth. That splits into two rules:

**Brewing → guided discovery, not a verdict.** Vendor numbers are a **starting guess, weighted by vendor
expertise** — never a "correct brew." The right brew is a matter of **preference, found by experimenting.**
Tea is **part science** — temperature, leaf, time, ratio are real **extraction levers** the app can nudge —
and **part preference** — whether *you* like it. So the engine:

- starts from a reasonable guess (KB / vendor baseline, weighted by expertise),
- suggests tweaks **along the science levers** (hotter / cooler, more / less leaf, longer / shorter),
- helps the user **notice what they like** (the per-steep feedback already captured),
- **converges on their ideal, per tea** — their brew, not the vendor's.

It **guides toward the user's own preference; it never dictates a correct brew.** And it keeps two questions
distinct: **"am I getting the most out of this tea?"** (optimization — the science levers) vs **"do I like it
this way?"** (preference — the taste). This is the forward home of the brew-advice work (`computeBrewAdvice`,
`PHASE2-PRESPEC-NOTES.md`, `SPEC-brew-advice-v3-feedback.md`).

**Character / flavour → a curated, cross-referenced profile.** A tea's character comes from a **curated
profile** — the catalog (`steep-tea-types.js`), the flavour tree (`docs/r3/planning/DATA-flavour-tree.md`),
and reference works — with **vendor notes weighed, not copied**, and **never one vendor's word.** This is the
authoritative half of "behaviour × character," and the destination the **structured tasting-input**
(`IDEA-tasting-mode.md`) feeds.

> **Mints as a ruling when the engine ships** (with Home, R159). Recorded here as the governing principle so
> the build *satisfies* it rather than rediscovering it.

## The pool — 7 curated insight types (data-chosen; final copy TBD)

Each is a **shape, not a locked sentence** — phrasing is chosen from the data at build time:

1. **Palate-lean** — the type(s) you reach for and rate highest.
2. **Morning-truth** — your true time-of-day pattern; **fires only on a real time-of-day skew** (no skew →
   no line).
3. **Highest-rated-&-why** — the top tea, tied to *why* (its type / origin / how you brewed it).
4. **Temperatures-by-type** — the temperatures you actually brew a type at.
5. **Freshness** — **dated teas only** (never invented from an undated tea).
6. **Haven't-reached-for** — a tea gone quiet you might return to.
7. **Little-notice** — a small, true observation that doesn't fit the others.

The **suggest → drink → notice** loop rides on the **guide types** (the brewing-discovery ones): the engine
suggests a tweak, you brew, you notice, it learns.

## Pick / floor

- **Pick** = the **most specifically-true** type that **hasn't fired recently** (a cooldown, so the lead
  never repeats). Specificity beats generality — a true, particular observation over a safe, vague one.
- **Floor** = a **warm neutral line, or nothing.** **Never a fabricated stat.** When nothing specifically
  true can be said, the engine says something warm-but-honest or stays quiet — the never-guess guardrail
  (`HOME-VISION.md`).

## Beyond the lead — the reflection layer (Insights deep pages)

Home shows one; **Insights holds the rest**:

- **Palate map** — types × ratings (what you love, in a picture).
- **Ritual shape** — when / how / vessel (your practice, not a scoreboard).
- **Terroir map** — origins (the Origins surface, deepened).
- **Earned brew guide** — your *own* sessions distilled into a per-tea guide (your brew, per the baseline).
- **Why-you-like-this explainer** — the cross-reference of behaviour × character that names the pattern.

## Data ladder — smart now, deeper as data grows

- **Reliable now:** type, rating, time-of-day, vessel, origin patterns. The engine can ship real insights
  from these **today**.
- **Waits on structured data:** flavour-level depth (the palate map's fine grain, flavour-based
  recommendations) waits on the **structured tasting-input** (`IDEA-tasting-mode.md`) — free-text notes are
  the noise the baseline excludes. Smart now on the reliable axes; deeper as clean flavour data accrues.

## Data caveat (build discipline)

**Every pattern value is computed from live data at runtime — never hardcode an illustrative example.** The
repo's CSV exports are **stale** (a snapshot, not the user's live state); a number pasted from them into the
engine or a mock is wrong the moment the user brews again. **Compute, don't illustrate** — the same
discipline as the figures reporter (R67 — generated, never hand-copied).

## Feasibility / build notes (Code read, 2026-08-29)

A pre-build read of the seven types against the live data model (`teas` / `sessions` / `steeps` columns),
the `steep-insights.js` machinery, and `SPEC-freshness-model.md`. Verdict: **the pool as specced is real
today** — spec it as-is.

**All 7 lead types are buildable now from existing fields**, on the existing `computeInsights` machinery
(`topPart`/`topPartShare` = the time skew, the `sessions.length < 5` floor, type/hour buckets via
`timeOfDayBuckets`/`insHeroData`). **No lead type is flavour-gated.**

| Type | Verdict | Fields |
|---|---|---|
| palate-lean | buildable now | `tea_type` × `rating` + counts |
| morning-truth | buildable now | `session_date`→hour; `computeInsights.topPartShare` *is* the skew |
| highest-rated-&-why | buildable now (structural why) | `rating` + `type` + `origin` + `steeps.temp_c`/`time_seconds`; flavour "why" is a later enhancement, not required to fire |
| temperatures-by-type | buildable now | `steeps.temp_c` × `tea_type` (timed sessions only — see caveats) |
| freshness | buildable now | `purchase_date`/`opened_date` (the shipped freshness model; dated-only = the gate) |
| haven't-reached-for | buildable now | last `session_date` per `tea_id` vs now |
| little-notice | buildable now | catch-all over the reliable axes; its definition is a design choice, not a data need |

**The "can I say this truly today?" gate needs no schema change.** Each type computes its own fire-condition
from existing fields; what it needs is a per-type **"enough signal" threshold** — a design number, not data.
Precedent already in code: `computeInsights`'s `sessions.length < 5 → null` floor.

**The cooldown is the one data-model addition — RULED: device-local localStorage.** A bounded `{type →
lastFired}` map under key **`tealog_insightlog`** (matching the device-local convention of `tealog_theme` /
`tealog_view` / `tealog_statPeriod`). It is **ephemeral UI state, not a synced preference** — this avoids a
DB write on every Home render and stays bounded (one entry per type). **Not synced**; cross-device
repetition of the lead insight is an **accepted minor cost**. (No `sessions`/`steeps`/`teas`/settings
schema change; no SQL.)

**Caveats to spec the copy around** (not blockers):

- **temps-by-type covers *timed* sessions only** — `temp_c` is per-steep, and quick-log / cold-brew carry
  `infusion_count` with no steeps. The copy must not imply it covers quick-logged cups.
- **Flavour-level depth waits on the tasting-input work** — highest-rated's *flavour* "why" and the
  palate-map's fine grain (`IDEA-tasting-mode.md` structured input). Already in the **Data ladder** above;
  restated so the **lead pool** is never specced to need it.

## Related

- `HOME-VISION.md` — Home = the moment (this engine's lead); the warm direction it serves.
- `PHASE2-PRESPEC-NOTES.md` + `SPEC-brew-advice-v3-feedback.md` — the brewing-discovery side
  (`computeBrewAdvice`).
- `IDEA-tasting-mode.md` — the character/flavour capture that feeds the authoritative half.
- `docs/r3/planning/DATA-flavour-tree.md` — the flavour tree (the curated character source).
- `R5-AUDIT.md` §3 — the Home / Insights surfaces this engine warms.
