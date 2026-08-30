# Spec — Brew advice v4: character-based feedback + context-gated lever advice

Status: **DECIDED (planning).** Replaces the **feedback model** of `SPEC-brew-advice-v3-feedback.md`;
keeps v3's **engineering** wholesale. Grounded in the research reference *"Tea Brewing Extraction &
Tasting Science"* — filed as `docs/research/brew-extraction-science.md` (the deep source; cite it for the
mechanisms below).

## Why v4, not a v3 edit

v3's feedback model — one `good / strong / weak` axis reduced to a **net verdict** that tunes the whole
schedule uniformly — is too crude. It:

- **(a)** conflates **intensity** with **over-extraction character** (bitterness ≠ astringency: different
  compounds, different fixes);
- **(b)** is **shape-blind** (a by-design-light gongfu/senchadō opening steep tapped "weak" wrongly
  lengthens the schedule);
- **(c)** never **re-flows** to the user's actual timing.

v4 **replaces the model**; the **engineering is reused** (§8).

## 1 · Capture — the five-tap character set

One quiet tap; **Tea-First**: never required, a zero-feedback session is complete and un-nagged. The
options name **character**:

- `good` — just right
- `strong` — intense but clean (a concentration signal)
- `flat` — flat / thin / watery / hollow (under-extraction)
- `astringent` — drying / puckering mouthfeel (over-extraction)
- `bitter` — harsh taste (over-extraction)

**`astringent` and `bitter` are separate taps by design** — different drivers (astringency = tannins
binding salivary proteins, a *mouthfeel*; bitterness = caffeine/catechins, a *taste*), different
first-line fixes, and teaching the user to tell them apart is a core learning goal.

Enum lives on the **same `steep.feedback` / `session.feedback` column** as v3 (nullable text, app-enforced,
no DB CHECK), **widened to `{good, strong, flat, astringent, bitter}`**. If v3_9's column isn't yet
migrated, v4 runs it.

## 2 · Diagnosis → one lever + the "why"

Each tap resolves to **one lever change** with a **one-line mechanism** (the teaching payload), presented
as an **experiment, never a verdict**:

- `astringent` → **cooler water first** (~5–10°C), then shorter. *"Hot water pulls the drying tannins from
  the leaf faster than anything else."*
- `bitter` → **shorter time** (cooler too for green/white). *"Caffeine and catechins are bitter and extract
  fast in hot water."*
- `strong` → **less leaf / more water**. *"That's concentration — dilute it, don't re-time it."*
- `flat` → **more leaf first, then hotter, time last**. *"More leaf makes it stronger in balance; longer
  steeping mostly just adds bitterness."* (The **"bitter-tea trap"** — deliberately flips the naive
  "weak → longer".)

**One change at a time.** This lever+mechanism is the **science-prior**; §5 governs learning toward
preference.

## 3 · Context-gating — no suggestion fires without it

Gated on **three facts**, resolved before advice:

- **Tea type** — by-type temperature defaults + failure modes (§7). Greens/whites/yellows brew cool,
  over-extract to bitter/astringent when hot; roasted oolongs, blacks, shou pu-erh want near-boiling, hard
  to over-brew. Advice shifts with type (e.g., an already-cool green still bitter → switch the lever from
  temp to time).
- **Brew style** — `gongfu / senchadō / western` (live `SESSION_METHODS`). Each carries an **intended
  shape** (§7). **Senchadō's shape is defined here (§7)** — today it falls through to gongfu (decorative
  seed, `core.js:408–413`); v4 makes it real, **in the KB**.
- **Infusion role** — which steep it is. A light opening steep in gongfu/senchadō is **by-design light**;
  `flat` on steep 1 must **never** say "add leaf" — it says *"extend the next steep a few seconds, or you
  may have poured off too fast."* Read each steep against its intended role via the **three-tier cascade**:
  vendor schedule → tea-type/style default → the tea's own learned pattern.

## 4 · Time adaptation — learned-pattern primary, in-session reflow only on ask

The static-guide complaint is answered by **learning**, not naive auto-reflow (which guesses intent and
fights the shape by shrinking deliberately-lengthening late steeps):

- **Primary:** the user's actual logged times feed a **per-tea learned rhythm** (the three-tier cascade).
  Over a handful of sessions the guide's defaults become the user's times — the whole shape, robustly, from
  the **pattern** not one possibly-accidental steep.
- **Secondary (on ask only):** on a large single-steep deviation, a quiet *"match the rest to this?"* tap
  offers an in-session reflow — optional, never forced, never overriding intent or shape.

## 5 · Teaching + learning

- Quiet **reason on the tap**; the fuller **"why this, for this tea"** on the tea page.
- **Reflects and nudges:** *"your best cups of this have run cooler"* + *"want to try 5° cooler next time?"*
  — a nudge surfaces only when experimenting could help.
- **Science-prior → preference:** advice starts from the textbook lever direction (§2); when the user's
  confirmed feedback **repeatedly contradicts** it for a given tea, **their preference overrides the
  prior**. The app teaches the science; the user finds their cup.

## 6 · Water / freshness check (before chasing extraction)

`flat / dull / muddy` is frequently a **water-quality or stale-leaf** problem, not extraction. Rule these
out **before** sending the user to temp/time, or it teaches the wrong lesson. Default water target (SCA):
~150 ppm TDS, neutral pH, fresh filtered water.

## 7 · Tea-type & brew-style shapes (the reference the gate reads)

Brewing-temperature defaults + dominant failure mode:

- **green** ~70–85°C (Japanese cooler; harsh/astringent when too hot, flat when too cool)
- **white** ~75–90°C
- **yellow** ~75–85°C (treat like green; should never be bitter)
- **oolong light/floral** ~85–95°C (rolled balls open slowly — early steeps light by design)
- **oolong dark/roasted** ~90–100°C
- **black** ~90–100°C (astringent/brassy when over-steeped)
- **sheng pu-erh** ~90–100°C (bitter by nature, flash-steep)
- **shou pu-erh** ~95–100°C (forgiving)

**Leaf form modifies within each:** more broken surface area → faster extraction → cooler/shorter.

**Senchadō shape — DEFINE IN THE KB (`steep-knowledge.js`), not hardcoded** (the code at `core.js:411`
says the senchadō ratios belong in the KB or the seed stays decorative). **⇦ most worth Niklas's review.**
Cool opening, few short pours, a gentler progression than gongfu:

- **Sencha** ~70–80°C, moderate leaf, short pours that lengthen slightly.
- **Gyokuro** ~50–60°C, high leaf, tiny concentrated pours — "meant to be concentrated and gentle."

The infusion-role gate reads this so a cool, light senchadō opening steep is never mis-flagged.

## 8 · What v4 keeps from v3 (unchanged engineering)

- **Data model:** the `steep.feedback` column + the `steepToDb` / `steepFromDb` mapper pair (v3 §1) — only
  the **enum widens**.
- **Capture-UX quietness** (v3 §3): per-steep affordance only for `gongfu / senchadō` (method-gate),
  collapsed-faint states, observational copy, separation from the ephemeral nudge, Tea-First. The
  **five-tap set replaces the three-chip set**.
- **Tuning stack** `base → ratio → feedback → tuned`; `sessionHasFeedback` gate; the read-side precedence
  ladder (per-steep → session → null). Only the **feedback layer's model** changes: the reducer becomes
  the **diagnosis + lever mapping** (character set, context-gated) rather than a net-sign verdict.
- **v2 ratio axis** (shipped v3.85) — **untouched**.

## 9 · Staging

- **Stage 1 (buildable now):** five-tap capture + diagnosis/lever mapping with mechanisms + full
  context-gating (type / style / infusion-role, senchadō shape defined in the KB) + the water/freshness
  check. Advice from the **science-prior**, gated correctly. **Ship full — gongfu + senchadō + western
  gated from day one.**
- **Stage 2 (post-gate):** the **learned-pattern time adaptation** + **science-prior → preference
  learning** — needs the feedback'd sessions Stage-1 collects (the ~15-session gate v3 defined).

## 10 · Non-goals

No change to v2 ratio math. No matcha (separate). Water chemistry beyond the flat/dull check out of scope.
No learned defaults before the data gate.

---

*Grounding: `docs/research/brew-extraction-science.md` — the peer-reviewed + specialty-educator reference
this spec's levers, mechanisms, and by-type shapes are drawn from. Read it before re-tuning any direction
here; treat its specific temperatures/times as starting points, not constants (its own caveat).*
