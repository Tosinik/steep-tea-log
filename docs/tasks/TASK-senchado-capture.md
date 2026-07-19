# TASK — senchadō capture + fixture repair

> **Committed for the record (2026-07-19).** The as-handed-off planning-lane task; shipped in v3.91.
> Preserved verbatim below — notably the **B5 reversal** (capture-only → ratio-aware, §B5) and the
> **2.8 senchadō seed** with its gyokuro/shiboridashi gap (§B6), the reason this lives in a committed
> file rather than a chat. Reconciled against the build (details in the v3.91 CHANGELOG):
> - **(a) The 2.8 seed is currently UNREACHABLE**, not just superseded for Shincha — all five of the
>   library's Japanese greens resolve in the KB (`kb.ratioGongfu` 3.0), which sits above the leaf table,
>   so senchadō == gongfu baseline for **every** current tea. The gyokuro revisit must add senchadō
>   ratios **to the KB**, not the leaf table, or the seed stays decorative. 2.8 kept as a KB-miss fallback.
> - **(b) The per-steep gate stays routed through `brewMethodFor`** (B3's "don't route — B5 keeps it
>   two-valued" premise contradicted B5's *three*-valued change). The one vessel where it matters is the
>   **Travel cuppa** (Porcelain teapot → capacity → gongfu): routing preserves today's cards; strict-
>   explicit would silently remove them (failure-mode #4).
> - **(c) §"Niklas's side" overclaims** that Sencha Kagoshima Premium "gets no ratio verdict" without
>   `leaf_form` — false; it resolves via the KB to 3.0 regardless. Worth filling for data completeness +
>   the freshness leaf-form display, not for a ratio.
> - **Added beyond the task (B7):** a method control on the edit-session modal (v3.91), so the after-ship
>   retag is doable in-app rather than in Supabase — the retag list assumed a control that didn't exist.

2026-07-19 · Planning lane → Code. Two independent parts. **Part A is urgent and standalone**
(it unblocks deploys); Part B depends on a product decision that is now made and recorded below.

Repo state at writing: HEAD `892cb0b`.

---

## Context — the decision behind this

Niklas brews **gongfu** (gaiwan) and **Japanese style** (kyusu, shiboridashi). He does not brew
western. The app knows only `gongfu | western`, so his Japanese sessions are currently split
across both by vessel *size*:

| vessel | capacity | classified as | correct? |
|---|---|---|---|
| Dragon Gaiwan | 110 ml | gongfu | ✅ |
| Main Kyusu | 210 ml | **western** | ❌ senchadō |
| Mogake Shiboridashi | 73 ml | **gongfu** | ❌ senchadō |

Measured against the 2026-07-18 exports: **all three sessions in the "western" half of the
phase-2 gate are Kagoshima greens brewed in the kyusu** (Shincha Saemidori 07-08, Kabusecha
07-06, Sencha Kagoshima Premium 07-11). There is no genuine western brewing in the dataset.

**Ruling: phase-2 ships on gongfu + senchadō baselines. Western is deferred** until real western
sessions exist. A method the user doesn't brew must not gate a feature they do. The gate metric
should be recomputed on `brew_style`, not on `brewMethodFor` — that is a phase-2 spec change,
noted here, not in this task.

Second finding driving Part B: per-steep feedback is **gongfu-gated**
(`steep-sessions.js:830`, `brewMethodFor(...)==='gongfu'`). The kyusu classifies western, so
**Japanese sessions never see the per-steep feedback control at all** — they can only contribute
session-level feedback. That is why the Japanese half of the gate is thin.

---

## Part A — repair `fixtures/brew-feedback-test.js` (do this first, standalone)

**Symptom:** six real-data checks fail against the current exports. `/slowcup-deploy`'s
verification runs all fixtures against real CSVs, so **the next deploy fails its own gate.**

**Cause, not a bug:** the R section was written for the legacy export and its own comment says so
— "informational until a FRESH export (with taps) is dropped in." Four sessions now carry
per-steep feedback and two of those have *no* session-level feedback. The assertions expired.
This is the forward-regression guard firing as designed.

**What R should assert instead** (intent; implementation is yours):

1. **Split the no-op check.** Sessions with no steep feedback → `reduce(steeps) === null`, as
   today. Sessions *with* steep feedback → `reduce(steeps) !== null`. That turns a stale
   assumption into a live guard that the reducer actually fires on real data.
2. **Drop the identity check.** `has(s) === !!s.feedback` was only ever true because no steep
   feedback existed. Replace it with the thing worth pinning: **at least one session qualifies
   via steep feedback alone** — currently two do. That proves the v3.89 path is live end to end.
3. **Keep the gate count reported, not pinned.** A hard number needs re-editing on every export.
   Report it, and add the **method split** alongside so the gate's composition is visible at a
   glance. **Split on stored `brew_style`, not on `brewMethodFor`** — the point is to see what was
   actually brewed, not what the capacity heuristic inferred.

**Do not** change `reduceSteepFeedback`, `sessionHasFeedback`, or `computeBrewAdvice`. The app
logic is correct; only the fixture's expectations are stale.

---

## Part B — senchadō capture

Design principle: **make the record true and the advice right.** The method is captured honestly
*and* gets a correct leaf-to-water baseline. What stays deferred is only the phase-2 work —
learned defaults and the senchadō method append.

### B1 · `VESSEL_TYPES` — add Shiboridashi

`steep-core.js:109` is a fixed list rendered as a `<select>`. Niklas's shiboridashi is currently
typed `Other` because there is no better option. Add **`Shiboridashi`** to the list.

Place it next to `Kyusu` rather than at the end — the list is roughly grouped by tradition, and
he'll need to re-pick the type on the existing vessel afterwards.

> R3 board #05 makes vessel type free-text ("+ type your own"). This one-line addition doesn't
> conflict with that and shouldn't wait for it.

### B2 · `SESSION_METHODS` — add senchadō

`steep-sessions.js:539` is `[{gongfu},{western}]`, single definition, rendered at :490. Add a
third entry — **`senchado` / label "Senchadō"**.

### B3 · Per-steep feedback gate — include senchadō

`steep-sessions.js:830` currently gates on `brewMethodFor(...)==='gongfu'`.

Gate on the **explicit `brew_style`** instead, showing per-steep feedback for **gongfu or
senchadō**. Do *not* route this through `brewMethodFor` — see B5 for why that stays two-valued.
Cold brew stays excluded as today.

Rationale: senchadō is a multi-infusion method like gongfu. Per-steep feedback is meaningful
there and currently unreachable. The quietness mechanism the comment describes is preserved —
western and untagged sessions still don't get the cards.

### B4 · Method prefill from vessel type

Today `brewStyle` stays `null` until tapped, and `brewMethodFor` infers from **capacity** —
which is exactly what misclassifies both Japanese vessels, in opposite directions.

When a vessel is selected in the session draft, **prefill `brewStyle` from vessel type**:

| vessel type | prefill |
|---|---|
| Gaiwan | `gongfu` |
| Kyusu · Shiboridashi | `senchado` |
| Cold brew jar | leave null (cold-brew path) |
| everything else | leave null → capacity fallback as today |

This sets `brewStyle` **explicitly**, so it gets captured rather than inferred. It is a
**default, not a lock** — the segmented control stays editable, and an explicit tap always wins.
Three-tier shape, same as everywhere else: session value → vessel-type default → capacity
fallback.

### B5 · `brewMethodFor` becomes three-valued

`steep-core.js:365` currently returns `gongfu | western`. It gains **`senchado`** as a third
return value when `brewStyle === 'senchado'`. The capacity fallback is unchanged for everything
else.

This is a change from an earlier draft of this task, and the reason is worth recording. The
interim plan was capture-only — store the method, leave the ratio math alone. Checking the actual
numbers killed it:

| | green_jp baseline |
|---|---|
| western | 1.8 g/100 ml |
| **senchadō (kyusu, ~5 g / 180 ml)** | **~2.8 g/100 ml** |
| gongfu | 3.0 g/100 ml |

Senchadō sits next to gongfu, not next to western. Under capture-only a kyusu sencha would be
scored against 1.8 and told it was brewing **strong** while brewing correctly — wrong advice, on
the most-repeated session in the log. Four of the five Japanese greens carry `leaf_form
green_jp`, so this is the common path, not an edge.

### B6 · `LEAF_RATIO_DEFAULT` gains a senchadō column

`steep-core.js:356` is keyed by leaf form with `{western, gongfu}` pairs. Add `senchado`
alongside.

**Only `green_jp` needs a considered value; seed the rest by leaving them absent** and let
`baselineRatioFor` fall through (see below) rather than inventing six numbers nobody has grounded.

```
green_jp: { western:1.8, gongfu:3.0, senchado:2.8 }
```

> ⚠ **`2.8` is a SEED, not settled fact** — same discipline as the freshness windows. It reflects
> kyusu sencha at roughly 5 g / 180 ml. **Known gap:** gyokuro and dense shiboridashi brewing run
> far higher (10 g / 60 ml ≈ 16 g/100 ml), so "senchadō" is not one ratio. Niklas currently owns
> no gyokuro, so the single seed is adequate for the real library today. Revisit alongside the
> rinse research — both are per-type Japanese-brewing facts the planning lane owes.

**Fallback order when `senchado` is absent for a leaf form:** use that form's `gongfu` value, not
`western`. The table above is why — senchadō is the nearer neighbour, so a missing value degrades
toward roughly-right instead of badly-wrong.

Same rule in `baselineRatioFor`'s KB branch (`:391`): there is no `kb.ratioSenchado`, so senchadō
reads `kb.ratioGongfu` with `kb.ratio` as the final fallback.

---

## Verification

- Fixtures green, including the repaired R section, against the **fresh** exports.
- **Regression check that matters:** every existing session's ratio verdict is byte-identical
  before and after. No session carries `brew_style = 'senchado'` today, so nothing should move —
  prove it against the fresh exports rather than assume it.
- **Intended future change, not a regression:** once Niklas retags his kyusu sessions to
  senchadō, those verdicts *will* shift (1.8 → 2.8 baseline). That is the point of the slice.
- Per-steep feedback cards now appear for a kyusu session tagged senchadō, and still do not for
  western or cold brew.
- Phone-check (Niklas): selecting the kyusu prefills Senchadō and the tap-to-override works.

## Judgment calls to name in the ship report

- Whether B4's prefill should also apply when *editing* an existing session, or only on new
  drafts. Editing would retro-tag old sessions on save, which changes gate composition silently.
  My read is **new drafts only** — but flag what you chose.
- Whether adding a third method button warrants a `WHATS_NEW` line, given senchadō does nothing
  to brewing advice yet.

## Known downstream consequence — not yours to fix

R3 board **#04 (session setup) is locked with a two-button method segment.** This slice makes it
a three-button control, so #04 needs a revision. That's Design's, routed separately. Shipping
anyway is the right call: the gate is roughly three sessions from filling with mislabelled data,
and waiting for R3 costs more than the board revision does.

---

## Niklas's side, after this ships

- Re-pick the type on **Mogake Shiboridashi**: `Other` → `Shiboridashi`.
- Retag the kyusu/shiboridashi sessions to Senchadō. He's confirmed these are identifiable —
  they're the green-tea sessions.
- **Fill `leaf_form` on `Sencha Kagoshima Premium`** (currently empty). Without it
  `LEAF_RATIO_DEFAULT` misses entirely and `baselineRatioFor` can return null, so that tea gets no
  ratio verdict at all. It is one of the three kyusu sessions currently counted as "western" in
  the gate. Nine of twenty teas have no leaf form; this one matters most.
