> **Deep source for `SPEC-brew-advice-v4.md`** (filed 2026-08-30). The peer-reviewed + specialty-educator
> reference the v4 brew-advice model is grounded in — its levers, mechanisms, by-type shapes, and the
> bitterness≠astringency split. Treat specific temperatures/times as starting points, not constants (see
> Caveats). Reference only — not loaded by the app.

# Tea Brewing Extraction & Tasting Science: A Grounded Reference for a Brew-Feedback Model

## TL;DR
- **Build your mapping on the causal split between concentration and extraction quality:** leaf-to-water ratio controls how *strong/intense* a cup is; water temperature and steep time control *which compounds* dominate and therefore whether the cup reads as bitter/astringent (over-extracted) or flat/thin/hollow (under-extracted). The single most important product rule is that "too weak" should first prompt *more leaf*, not *longer time*, because longer time disproportionately extracts bitter/astringent compounds.
- **Bitterness and astringency are genuinely different and have different fixes:** bitterness is a *taste* (gustatory) driven mainly by caffeine and non-galloylated catechins; astringency is a *tactile drying/puckering* sensation driven by galloylated catechins and other tannins/polyphenols that bind and precipitate salivary proteins. Both are primarily over-extraction phenomena; temperature is the strongest lever for both in delicate teas, with time as the co-lever.
- **The model must respect "light by design":** in gongfu brewing a light, aromatic opening steep is intended, not a defect — so the feedback engine needs to know tea type, brew style, and which infusion number it is before recommending a correction. And it should frame everything as optimization-toward-balance plus personal preference, not a single "correct" cup.

## Key Findings

**1. There are three distinct fault axes, and conflating them is the main risk.** Tea professionals separate (a) *strength/intensity* (concentration), (b) *over-extraction character* (bitterness, astringency, harshness, coarseness), and (c) *under-extraction character* (flat, thin, watery, weak, hollow, "common"). A cup can be simultaneously strong and unbalanced, or weak but clean. Your UI taps should map to these three axes independently.

**2. Bitterness ≠ astringency — this is the highest-value distinction in the whole feature.** Bitterness is one of the five basic tastes, sensed gustatorily; in tea it comes mainly from caffeine and from catechins (especially the non-galloylated ones). Astringency is *not a taste* — it is a mouthfeel: a drying, puckering, rough sensation produced when tannins/polyphenols (especially galloylated catechins like EGCG and ECG, plus flavonol glycosides) bind and precipitate the proline-rich proteins and mucins in saliva, stripping the mouth of lubrication. Because they have different chemical drivers, they can be dialed somewhat independently.

**3. The levers and what each primarily controls:**
- **Leaf-to-water ratio → concentration/strength/body.** More leaf = a stronger, fuller, more concentrated cup that stays *in balance*; it raises all compounds proportionally.
- **Water temperature → extraction selectivity (which compounds, and how aggressively).** Higher temperature preferentially and rapidly pulls catechins and caffeine (bitterness + astringency); lower temperature favors the readily-soluble amino acids (theanine → umami/sweetness/body) while leaving catechins behind. Temperature is the "master control" for harshness.
- **Steep time → total extraction / how far toward equilibrium.** Longer time pulls more of everything, but the slow-diffusing catechins keep climbing, so long steeps disproportionately add astringency/bitterness.
- **Leaf form / surface area (broken vs whole) → rate.** More surface area (broken leaf, fannings, dust) extracts everything faster, so it "punishes" long steeps and hot water.

**4. The defensible lever-to-problem mapping (the heart of the feature):**
- **Astringent (drying/puckering) →** lower temperature first (it most directly suppresses galloylated-catechin/tannin extraction), then shorten time. Confirmed by both mechanism and vendor troubleshooting consensus.
- **Bitter (harsh taste) →** shorten time and/or lower temperature (both caffeine and catechins extract faster hot and longer). For green/white, temperature first; for already-cool brews, time.
- **Too strong but clean/intense →** reduce leaf-to-water ratio (or add water). This is a concentration problem, not a time problem.
- **Flat / weak / thin / watery →** add leaf first (raises concentration in balance). Only if that's insufficient, raise temperature (to extract more body/aromatics) before reaching for longer time, which risks tipping into bitterness — the "bitter tea trap."

**5. The chemistry, concisely:**
- **Polyphenols/catechins (EGCG, ECG, EGC, EC)** constitute 70–80% of total tea polyphenols (flavan-3-ols are the major phenolics in the leaf; roughly 59% EGCG, 19% EGC, 13.6% ECG, 6.4% EC) → the primary drivers of astringency and a major driver of bitterness. Galloylated/ester-type catechins (EGCG, ECG) are more bitter *and* more astringent than non-ester types.
- **Caffeine** → bitterness (intensely bitter in pure form); extracts fast and early.
- **L-theanine and other amino acids (glutamate, etc.)** → umami, sweetness, body/mouthfeel; highly water-soluble, extract readily even in cool water; theanine also chemically counteracts/masks catechin bitterness and astringency.
- **Kinetics:** L-theanine extracts fast and at low temperature; caffeine extracts fast; catechins are the slowest and most temperature-dependent — they stay largely in the leaf below ~70°C and dissolve efficiently above ~75–80°C. This is *why* cool water yields a sweet, umami, low-astringency cup and hot water yields a sharp one from the identical leaf.

**6. Tea type changes the defaults and the failure modes** (see Details for the table). The less oxidized and more bud-heavy a tea, the cooler it is brewed, because delicate teas over-extract catechins into bitterness/astringency at high heat, while robust/oxidized/aged teas (black, roasted oolong, shou pu-erh) need near-boiling water to extract their larger-molecule compounds and are hard to over-brew.

**7. Optimization vs. preference is a real and citable framing:** there is genuine, settled science to *balanced extraction* (what compounds come out under what conditions), but the "right" cup is ultimately found by the drinker through experimentation. The feature should present science-based *diagnoses and directions*, framed as experiments, not verdicts.

## Details

### Sensory vocabulary (professional, organized by axis)

**Positive / target descriptors:** *brisk* (lively, palate-pleasing, with appropriate—not excessive—astringency), *bright*, *clean*, *full-bodied / full* (fullness + strength; round, smooth mouthfeel), *body* (tactile weight/viscosity of the liquor), *mellow* (smooth, not bitter or flat), *complex*, *sweet*, *umami* (savory/brothy depth, from amino acids), *huigan* (回甘, "returning sweetness" — a prized lingering sweetness that emerges in the mouth/throat after an initial bitterness), *shengjin* (生津, mouth-watering/salivation), aroma/nose.

**Over-extraction descriptors:** *bitter*, *astringent* (drying/puckering), *harsh*, *coarse* (rough, from too much bitterness/acidity), *rasping*, *hard*, *brassy* (strong bitter/metallic), *raw*. Note that *brisk* and *pungent* denote *desirable* astringency in black teas — astringency is not automatically a flaw; it's a balance question.

**Under-extraction descriptors:** *flat* (off, lifeless, lacking briskness), *thin* (lacking body), *weak*, *watery*, *hollow*, *soft* (opposite of brisk, lacking "live" character), *common/plain* (light, thin liquor with no distinct flavor), *short* (leaves little trace in the mouth). A hollow/thin cup has low concentration of the mid- and late-extracting compounds that provide body and balance.

### Bitterness vs astringency — mechanism detail
Peer-reviewed sensory chemistry supports treating these separately. Zhang et al. (2018, *Food Chemistry*, "Quantitative analyses of the bitterness and astringency of catechins from green tea," PMID 29655718) found bitterness "highly correlated with...EGCG and (−)-epicatechin gallate (ECG) (R² = 0.7769, p < 0.01), and the astringency (R² = 0.7878, p < 0.01) was highly correlated with...ECG and flavonol glycosides (myricetin 3-O-galactoside and quercetin-3-O-rutinoside)." The accepted astringency mechanism is the interaction and precipitation of salivary proteins — particularly proline-rich proteins (PRPs) and mucins — by tannins, causing loss of oral lubrication (a tactile, build-up sensation that intensifies over repeated sips). Bitterness, by contrast, is transduced by T2R bitter taste receptors. Practically: astringency *builds and lingers* and is felt on the cheeks/tongue surface as dryness; bitterness is a sharp taste, often at the back of the tongue. Amino acids (theanine, glutamate) suppress both. (Note that secondary astringency mechanisms — tannin binding to oral epithelial cells and to lipid membranes — are also documented, so salivary-protein precipitation is the dominant but not the sole cause.)

### Extraction kinetics — the temperature/time evidence
- A controlled green-tea catechin-solubilization dataset (US Patent 7,510,736, "Method for selectively and sequentially extracting catechins from green tea leaf") shows the temperature dependence starkly: total catechins after a 5-minute steep were 499.69 µg/mL at 50°C versus 1,959.51 µg/mL at 70°C, EGCG solubilization was "intimately bound to temperature and to infusion time," caffeine at 90°C reached 348.6 µg/mL by 10 minutes, and — importantly — "the brewing temperature does not affect significantly the solubilisation of EC" (non-galloylated epicatechin). In other words, the harsh galloylated catechins are the temperature-sensitive ones.
- ACS material (Michelle M. Francl, PhD, Bryn Mawr College, ACS webinar "Steeped in Science: The Chemistry Inside Your Perfect Cup of Tea") states: "At 100°C, approximately 100% of caffeine is extracted within 5 minutes. Caffeine is extracted more readily than tannins."
- Camellia Sinensis Tea House — authors of the reference work *Tea: History, Terroirs, Varieties* (Gascoyne, Américi, Desharnais & Marchand, 2018) — documents the temperature effect on caffeine directly: "Brewing 5 grams of tea leaves in 100ml of water at 20 degrees Celsius yields 2.2 mg of caffeine, same tea and water ratio brewed at 100 degrees Celsius yields 67 mg of caffeine" — roughly a 30× increase driven by temperature alone.
- A useful practitioner heuristic (Tea Epicure / Tony Gebely): time and temperature are inversely tradeable — roughly, each 20°C rise lets you halve the steep time for a similar strength — but changing temperature also changes the *composition* (and thus taste), while changing time mostly changes overall *strength*.

### The ratio-vs-time principle (why "add leaf" beats "steep longer")
Steeping is diffusion toward equilibrium: compounds move from leaf to water until concentrations equalize. Adding more leaf raises the total available compounds and yields a stronger cup that remains proportionally balanced. Extending time instead pushes the system further toward equilibrium on the slowest-diffusing compounds — the catechins — so the marginal extraction is disproportionately astringent/bitter. This is why specialty educators explicitly warn against the "bitter tea trap": the correct fix for weak tea is more leaf (higher ratio), not more time. This high-leaf/low-water/short-time logic is exactly what gongfu brewing formalizes.

### Brewing temperatures and failure modes by tea type

| Tea type | Typical temp | Why / failure mode |
|---|---|---|
| **Green** | ~70–85°C (Japanese greens cooler, 60–80°C; gyokuro 50–60°C) | Bud-rich and catechin-heavy; boiling water "scorches" the leaf and floods the cup with catechins/caffeine → instant bitterness + astringency. Cool water favors theanine → umami/sweetness. Failure mode: harsh/grassy when too hot; flat when too cool. |
| **White** | ~75–90°C | Delicate, bud-heavy (Silver Needle lower; leafier Shou Mei / Bai Mu Dan higher). Over-hot → astringency and loss of aromatics; easy to under-extract given the light leaf. |
| **Yellow** | ~75–85°C | Made like green but with an added "sealing/yellowing" (men huang) step that mellows tannins; sweeter, rounder, less grassy than green, "should never be bitter." Treat like green — never boiling. Failure mode: brewed too hot it loses its subtle amino-acid sweetness and just tastes like an ordinary green. Camellia Sinensis notes it further shifts by vessel — greener/stronger in a gaiwan, softer/sweeter (more white-tea-like) in a teapot. |
| **Oolong (light/floral, e.g. Tie Guan Yin, high-mountain)** | ~85–95°C | Lightly oxidized, rolled; floral/creamy; can turn sharp if brewed too hot/too long. Rolled balls need heat/time to unfurl, so opening steeps can read light by design. |
| **Oolong (dark/roasted, e.g. Wuyi Yancha, roasted TGY)** | ~90–100°C | Higher oxidation + roast (Maillard); needs high heat to open its mineral/nutty/caramel depth. |
| **Black** | ~90–100°C | Robust, fully oxidized; withstands boiling. Failure mode: astringency/"brassy" from over-steeping, especially broken-leaf/CTC with high surface area. |
| **Pu-erh sheng (raw)** | ~90–100°C (young sheng slightly cooler for some) | Young sheng is intensely bitter/astringent by nature (meant to age); rinse first, flash-steep. Rewards short steeps, punishes long ones. |
| **Pu-erh shou (ripe)** | ~95–100°C, full boil | Post-fermented, smooth, low-astringency, earthy; needs boiling to extract depth; very forgiving/hard to over-brew. |

Leaf form matters within every row: broken leaf, fannings, and dust have far greater surface area, extract faster, and therefore need cooler water and/or shorter times than whole leaf of the same type.

### The "intended shape" of a gongfu session
Gongfu uses a high leaf-to-water ratio (~1g per 15–20ml; e.g., 5–7g in a 100ml gaiwan) with many short infusions rather than one long steep. A typical progression starts very short and lengthens across the session — e.g., 8s, 10s, 12s, 15s, 20s, 25s, 35s, 45s, 60s, 90s, 120s — often after a quick "rinse" (discarded flash-steep) for compressed or rolled teas. The intended arc:
- **Early steeps (1–3):** light, bright, aromatic — the tea "opens up," delicate/floral top notes dominate. Short *by design.*
- **Middle steeps (4–7):** peak body and complexity — the "sweet spot."
- **Late steeps (8+):** gentle, sweet, soft as the leaf gives its last reserves; steeps lengthen to compensate for depletion.

**Product implication:** a light opening gongfu steep is not under-extraction. The feedback model must condition on (brew style, tea type, infusion index) before flagging "weak," and its correction for a genuinely-too-light *gongfu* steep is usually "extend the next steep a few seconds" or "you may have poured off too fast," not the Western fix of "add leaf."

### Optimization vs. preference — how experts frame it
The consistent expert framing: brewing is a controlled solid–liquid extraction governed by temperature, time, ratio, and surface area — ignoring these produces objectively flat, bitter, or weak infusions, which is *not* "just preference." But within the balanced-extraction envelope, the best cup is personal and found by experimentation and journaling. The defensible product stance: **there is a science of getting a balanced, intended cup, and on top of that a personal optimum the user dials in.** The app should teach the science (diagnose the fault, explain the mechanism, suggest one lever change) while explicitly framing each suggestion as an experiment the user judges.

## Recommendations

**Stage 1 — Model the three axes separately in the UI.** Offer taps that resolve to (a) intensity (too strong / too weak), (b) over-extraction (bitter; drying/astringent; harsh), (c) under-extraction (flat/thin/watery; hollow). Do not collapse "bitter" and "astringent" into one tap — capture them separately, because their first-line fixes differ (time-then-temp vs temp-then-time) and teaching the difference is a core learning goal.

**Stage 2 — Gate every recommendation on context:** tea type/oxidation, brew style (Western vs gongfu), and infusion number. The same "light" report means "add leaf" in Western brewing but "lengthen the next steep / you may have decanted too fast" in a gongfu opening steep. Encode the by-type temperature defaults and failure modes from the table above.

**Stage 3 — Ship this default lever mapping (each with a one-line mechanism the app shows as the "reasoning"):**
- Astringent → lower temp ~5–10°C (then shorten time). *"Hot water pulls drying tannins from the leaf faster than anything else."*
- Bitter → shorten time (and lower temp for green/white). *"Caffeine and catechins are bitter and extract fast in hot water."*
- Too strong but clean → less leaf or more water. *"That's a concentration issue — dilute, don't re-time."*
- Flat/weak/thin → add leaf first; then raise temp; time last. *"More leaf makes it stronger in balance; longer time mostly adds bitterness."*
- Hollow/thin despite adequate strength → raise temp slightly and/or check water quality; flat/dull/muddy is often a water problem, not an extraction one. A good default target (per the SCA water standard) is ~150 ppm TDS (acceptable 75–250 ppm) and neutral pH 7 (range 6.5–7.5), using fresh, filtered water.

**Stage 4 — Always frame as an experiment.** Present one lever change at a time, state the expected sensory result, and ask the user to confirm on the next brew. Log results to personalize toward the user's preference over time. Change your default advice for a given user when their confirmed feedback repeatedly contradicts the textbook direction — that's the preference layer overriding the optimization prior.

**Thresholds that change the advice:** if a tea is already at/below its type's recommended temperature and still bitter, switch the lever from temperature to time (or leaf quality/surface area). If reducing leaf makes it thin rather than clean, the problem was extraction quality (temp/time), not concentration. If a "weak" complaint comes from a gongfu opening steep, do not add leaf — adjust steep time.

## Caveats
- **Settled vs contested.** *Settled:* the direction of extraction effects (hotter/longer → more catechins, caffeine, and thus more bitterness/astringency; cooler favors theanine/umami; more leaf → proportional strength; astringency = tannin–salivary-protein precipitation). *Less settled / secondary mechanisms:* astringency also involves tannin–oral-cell and tannin–lipid membrane interactions, not only salivary-protein precipitation; the exact quantitative temperature curves differ by tea, cultivar, and water chemistry, so treat all specific temperatures/times as starting points, not constants.
- **Preference-dependent by nature.** Whether a given astringency or bitterness level is a "fault" is partly cultural and personal (e.g., brisk Assam and young sheng are *meant* to be astringent). The model should offer directions, not declare defects.
- **Numbers are illustrative.** The 2.2mg→67mg caffeine figure is a single book-attributed data point (specific tea/steep-time context not fully specified); the "each 20°C ≈ halve the time" rule is a practitioner heuristic, not a precise law. Vendor temperature charts vary by several degrees; use ranges.
- **Source tiers.** Chemistry/kinetics claims here rest on peer-reviewed food-science literature (e.g., Zhang et al. 2018) and ACS material; brewing-practice and tasting-vocabulary claims rest on established specialty-tea educators (Camellia Sinensis, Tea Epicure/Tony Gebely, white2tea, Verdant, professional tasting glossaries). Where a claim is vendor-sourced practice rather than peer-reviewed, treat it as well-supported convention rather than proven fact.
- **Water and freshness confounders.** "Flat/dull/muddy" is frequently a water-quality or stale-leaf problem rather than an extraction-lever problem; the model should include a water/freshness check so it doesn't send users chasing temperature/time fixes for a water issue.
