# Brew guides — vendor-sourced knowledge (growing file)

Purpose: ground truth for KB_STYLES baselines and LEAF_PROFILES curve tuning. One entry
per tea/style. Facts only (params, ranges, patterns) — no copied prose. When vendors
disagree, record the range and the shared shape; disagreement is itself information.
Template at the bottom. Niklas feeds new entries via screenshots/links; Claude/Code distill.

---

## Ya Shi Xiang Dancong (Phoenix / Feng Huang oolong)  — entry 2026-07-08

**Identity:** Guangdong · Feng Huang Shan (~1200 m) · cultivar Ya Shi · strip oolong.

**Sources (3):** Yoshien (EN product page) · Siam Tee (DE, gongfu-focused) · Teasenz (DE, dual table).

| Source   | Style       | Ratio (g/100ml) | Temp        | Steeps                              |
|----------|-------------|-----------------|-------------|--------------------------------------|
| Yoshien  | western-ish | ~2 tsp/150–200ml| 100°C       | 10–30 s, multiple infusions          |
| Siam Tee | gongfu      | 3–3.5 (6–8g/200ml) | 85–90°C  | ~40 s first, **shorter second**, then rising |
| Teasenz  | western     | 0.6 (3g/500ml)  | 100°C       | 40 s                                 |
| Teasenz  | gongfu      | 5               | 100°C       | **10 → 5 → 5 → 5 → 5 → 10 …**        |

**Consensus shape (all sources):** the second steep is SHORTER than the first — the
opening-dip pattern — then times rise. Present in both the slow school (40s-first) and
the flash school (10s-first). Matches Niklas's own logged oolong sessions.

**Divergence, honestly recorded:** temp 85–100°C; gongfu ratio 3–5 g/100ml; first steep
10–40 s. The slow-cool school (Siam Tee) and fast-hot school (Teasenz) bracket the space.

**Temp is a flavor dial, not a constant (Yoshien):** ≤80°C → sweeter, more aromatic;
90–100°C → stronger, more pronounced. Worth surfacing in the encyclopedia entry — it's
exactly the "knowledgeable friend" nuance.

**Sensitivity note (Siam Tee, widely echoed):** dancong is unforgiving — oversteeping or
too-hot water turns it bitter fast. Advice tuning should nudge gently here.

**Distilled app baseline (KB_STYLES `dancong`):**
`{ type:'oolong', leafForm:'strip', tempC:90, ratio:4.0, first:25, note:'Phoenix dancong —
unforgiving; cooler (≤85) = sweeter, hotter = stronger. Second steep shorter than first.' }`
Rationale: mid-range of sources, biased slightly slow-cool to match Niklas's logged pace;
feedback tuning + (later) learned defaults refine from here.

---

## West Lake Dragon Well (Xi Hu Longjing) — pan-fired green  — entry 2026-07-08
**Identity:** Zhejiang · West Lake · cultivar Qun Ti Zhong · pan-fired green.
**Sources:** Teasenz (structured table).
| Source | Style | Ratio (g/100ml) | Temp | Steeps |
|---|---|---|---|---|
| Teasenz | western | 0.6 (3g/500ml) | 80°C | 60 s; 2nd steep 90–120 s |
| Teasenz | gongfu  | 5               | 80°C | 20 s, rising |
**Distilled:** `longjing` stays `pan_green`; **KB tempC raised 75 → 78** (v3.42). Western default
ratio ~1.2; gongfu-school ratio 5.0 / 20 s noted for later. First steep 20–45 s band.

## Anxi Tie Guan Yin — rolled/ball oolong (green style)  — entry 2026-07-08
**Identity:** Fujian · Anxi (1535 m) · cultivar Tie Guan Yin · rolled.
**Sources:** Teasenz (structured table + prose).
| Source | Style | Ratio (g/100ml) | Temp | Steeps |
|---|---|---|---|---|
| Teasenz | western | 0.6 | 100°C | 60 s |
| Teasenz | gongfu  | 3   | 100°C | 20 s start; 8–9 steeps; **3rd–4th brew peaks** |
**Curve insight:** longevity 8–9 steeps with a mid-session peak — the `rolled` family's late
multipliers stay generous (slow growth 1.12, many steeps), unlike quick-fading greens.

## 2014 Alishan Qingxin Dong Pian — aged rolled oolong (Niklas's vendor & family)  — entry 2026-07-08
**Identity:** Taiwan · Alishan · cultivar Qingxin · Dong Pian (late winter pick) · aged 2014 ·
Meister Atong Chen. **Sources:** Tee Kontor Kiel (printed gaiwan recommendation + flavor axes).
| Source | Style | Ratio (g/100ml) | Temp | Steeps |
|---|---|---|---|---|
| Tee Kontor Kiel | gaiwan | 3.3–4.2 (4–5g/120ml) | ~95°C | **45 → 25 → 25**, then continue until faded |
**Decisive rolled-oolong datapoint:** vendor-printed opening dip (45→25→25) at 95°C, ~3.75 g/100ml.
Matches Niklas's logged Ali Shan session (60→35→60) in shape.
**Flavor axes (TKK, 0–5):** Komplexität 5 · Süße 5 · Fruchtig 4 · Würzig 3 · Floral 2 · Röstnoten 1 ·
Oxidation 1 — first live sample for the tasting-chips data model.
**Format note:** TKK prints Zubereitung as Menge / Temperatur / 1.–3. Aufguss — a stable, parseable
pattern; worth a dedicated case in `parseBrewGuide` for pasted TKK guides.

## Consolidated retune targets — APPLIED v3.42
- `ball_oolong` (KB): tempC 95, ratio 3.5, first 45. `LEAF_PROFILES.rolled`: base 45,
  mult [1, 0.6, 0.6, 0.75, 0.95, 1.2], growth 1.12 (long-lived, mid-peak).
- `strip_oolong`/`dancong`: dip confirmed; `LEAF_PROFILES.open` base 40, mult [1, 0.7, 0.9, 1.15, 1.45, 1.9].
- `LEAF_PROFILES.bud` base 55, mult [1, 0.8, 1.0, 1.25, 1.6]; `LEAF_PROFILES.compressed` base 22,
  mult [1, 0.9, 1.0, 1.2, 1.5, 1.9]. Greens unchanged.
- `longjing`: tempC 78; gongfu note ratio 5.0 / 20 s.
- Generation now uses a matched KB style's `first` as the base over the family base.
- TGY keywords stay `ball_oolong`; 100°C school exists — KB uses 95 (middle).

## Pending vendor fetches (stubs — screenshot the brew block when convenient)
Oriental Beauty (TKK + Yoshien) · Gyokuro Okabe (Yoshien) · Kabusecha Miyazaki (Yoshien) ·
Fujian Silver Needle (Teasenz) · Zhu Ye Qing (Teasenz) · sheng/shou baselines (Teasenz pu-erh pages).
Until fetched, KB canon values stand for these styles.

---

## Template for new entries

## <Tea / style name> — entry <date>
**Identity:** region · cultivar · leaf form.
**Sources:** vendor names + page type.
| Source | Style | Ratio (g/100ml) | Temp | Steeps |
**Consensus shape:** what all sources agree on.
**Divergence:** the honest range.
**Distilled app baseline:** the KB_STYLES line + one-sentence rationale.
