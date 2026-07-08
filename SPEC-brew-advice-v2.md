# Spec — Brew advice v2: the leaf-to-water ratio axis

Status: **DECIDED — ready to build** (Niklas, 2026-07-08). Decisions inline below; the
original questions are kept at the bottom for context.
**D1:** ratio adjusts the **prefilled schedule itself** (not just advice text).
**D2:** **default OFF — strict opt-in** via Settings → Brew guidance → "Ratio adjustment".
When off, ratio touches nothing anywhere.
**D3:** yes — optional per-session **waterMl override** (defaults to vessel capacity).
One nullable column: migration `sql/v3_8-water-ml.sql` (`alter table sessions add column
water_ml integer;` + mapper pairs + both write paths, per CLAUDE.md mapper rule).
This absorbs the parked Tier-2 "partial vessel fill" item.
**D4:** k=0.6, caps ±40% shipped as tunable constants next to LEAF_PROFILES.
**D5:** capacity-capture precursor ships **first as its own small deploy**.
The longest-parked, highest-leverage item: advice currently tunes **temperature + time**
(v3.25 feedback nudges on v3.24/v3.29 schedules, v3.30 timeShift). This adds the missing
third axis — **how much leaf for how much water** — and is the gate for learned defaults.

## What exists already
- `sessions.gramsUsed` — populated per session.
- `vessels.capacityMl` — exists but **nullable and sparse** (the practical blocker).
- `steep-knowledge.js` `KB_STYLES[*].ratio` — per-style baseline ratios (g per 100ml).
- Guide parse (`parseBrewGuide`) currently strips gram/ml tokens; it does not extract them.
- Settings block "Brew guidance" (v3.34) — natural home for the toggle.

## The model
All ratios in **g per 100ml**.

1. `actualRatio = gramsUsed / (waterMl / 100)` where `waterMl` = vessel `capacityMl`
   (or per-session override — see Q3).
2. `baselineRatio` resolution order:
   a. parsed from the tea's brew guide if it states grams+ml ("5g / 100ml", "6 g auf 100 ml")
      — extend `bg_extractGrams` to *capture* instead of just strip;
   b. else `kbResolve(name+cultivar+origin).ratio` from steep-knowledge;
   c. else per-leaf-form default (add a `ratio` to each `LEAF_PROFILES` family).
3. `ratioFactor = actualRatio / baselineRatio`
4. **Time scaling:** `timeFactor = clamp(1 / ratioFactor^k, 0.6, 1.4)` with **k = 0.6**.
   Apply to the whole schedule (every steep — curve shape preserved, scaled uniformly).
   Sanity-checked: half the leaf → +40% (capped); double → −34%; 5g/100ml gongfu vs a
   1.6 baseline → floor (−40%). Feels right; k and caps are tunables next to LEAF_PROFILES.
5. **Temperature is NOT ratio-adjusted.** Temp stays owned by the feedback-tuning axis.
6. **Ordering with existing adjustments:** base schedule (guide or leaf-form) → ratio scale
   → feedback tuning (v3.25) → in-session timeShift (v3.30). Ratio is a *structural*
   correction, so it applies before behavioural nudges.
7. **Exclusions:** cold brew (no timed steeps); sessions with no gramsUsed or no waterMl
   → ratio silently not applied (no nagging — calm-first).

## Precursor: capacity capture (ship first, tiny deploy)
Ratio fails silently on every vessel without `capacityMl`. To make it real:
- Vessel form: make capacity a visible, encouraged (not required) field with unit hint.
- Vessels list: quiet "· ml?" affordance on capacity-less vessels (tap → edit). No banners.
- Session setup: if the chosen vessel has no capacity, one inline "set capacity" link in
  the (hidden-by-default) ratio line. Never a modal, never blocks logging.

## UX
- Advice memory line (v3.25 pattern) gains a ratio sentence when it applied, e.g.:
  "Heavier pour than the baseline (2.1 vs 1.4 g/100ml) — times shortened ≈19%."
- Settings → Brew guidance: new toggle **Ratio adjustment** — **default OFF** (D2). The
  set-sub copy should sell it gently: what it does, in one calm sentence.
- Display unit: g/100ml everywhere.

## Learned defaults (phase 2, gated on this shipping)
Once ratio normalisation exists: good sessions ("how was it?" = good) contribute their
*ratio-normalised* real steep times to a per-leaf-form running baseline; `LEAF_PROFILES`
becomes the prior, learned values the posterior. Separate spec once phase 1 has data.

## Non-goals
- No schema change (Q3 may add one column, else zero SQL).
- No change to stock math (that's the parked derived-stock item).
- Not touching the mood/Garmin axis.

## Decisions needed (Niklas)
- **Q1 — Scope of effect:** ratio adjusts (a) only the advice text, or (b) the *prefilled
  schedule* itself (recommended — autofill already has a per-session opt-out)?
- **Q2 — Default state:** ratio adjustment default ON under Brew guidance, or default OFF
  (strict opt-in)? Recommend ON given the per-session escape hatch; OFF is the calmer call.
- **Q3 — Partial fills:** vessel capacity ≠ water actually poured (half-filled kyusu).
  Add an optional per-session `waterMl` override (one nullable column, one quiet field,
  defaults to capacity)? This also absorbs the parked Tier-2 "partial vessel fill" item.
  Recommend yes — without it, ratio is wrong exactly for careful brewers.
- **Q4 — Tunables:** accept k=0.6, caps ±40% as shipped defaults (tunable constants)?
- **Q5 — Sequencing:** capacity-capture precursor as its own small deploy first (recommend),
  or bundled with phase 1?
