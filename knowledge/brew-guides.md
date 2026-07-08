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

## Template for new entries

## <Tea / style name> — entry <date>
**Identity:** region · cultivar · leaf form.
**Sources:** vendor names + page type.
| Source | Style | Ratio (g/100ml) | Temp | Steeps |
**Consensus shape:** what all sources agree on.
**Divergence:** the honest range.
**Distilled app baseline:** the KB_STYLES line + one-sentence rationale.
