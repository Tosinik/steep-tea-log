# SPEC — Freshness model

2026-07-19 · Design → Code hand-off. Joins the **swatch data-model** and the **per-origin
script data-model** as a pinned spec at the Bundle 1 + 2 hand-off. This one supersedes the
earlier "re-anchor freshness on harvest" instruction — harvest is a *fallback*, not the anchor.

**Status:** the reading logic below (opened-date clock, per-type windows, ageing-as-history)
is **NEW capability** — a Code slice, not a description of what ships today. The live engine
knows only `freshnessClass` (delicate vs neutral) and has no concept of *opened*, of per-type
windows, or of oolong *ageing*. Flag it as new wherever it renders.

---

## The headline: opened-vs-sealed, not age

The variable the app has been missing isn't shelf age — it's **whether the pouch is open.**
Once the seal is broken, oxygen, light and moisture start the real clock, and the difference
between a sealed and an opened bag is roughly a **5–10× swing** in how long the tea holds.
The app tracks neither today. That's the gap this model closes.

Consequence: a freshness reading is only trustworthy if we know **when the tea was opened.**
Everything else is an estimate, and we say so.

---

## Grounding — a confidence ladder

The *reading's confidence* is set by what anchors its clock. Each rung is visibly less certain
than the one above, and the lower rungs state their own assumption out loud. Never guess — when
nothing grounds it, show nothing, exactly as the swatch renders per-origin script rather than
inventing a colour.

| Rung | Anchor | Confidence | Reading |
|---|---|---|---|
| **1 · Measured** | `teas.opened_date` | trusted | Clock from opening; the **opened** window applies. |
| **2 · Estimated** | `harvest` (no opened_date) | softer — *assumes sealed* | Clock from harvest; the **sealed** window applies, tagged *assumes sealed until opened*. |
| **3 · None** | neither grounded | — | **No reading.** The block is absent — not a guess, not a zero. |

**Purchase is not on the ladder.** It tempts as a fallback because it's more-filled than
harvest (~35% vs ~14%), but that is exactly the trap: purchase tells you when the tea reached
*you*, not when it was made — a 2023 harvest bought in 2026 would read as fresh. Anchoring
freshness on it is a *guess*, and the app's rule is **never guess** (the swatch's Tier-3, a
null `freshnessWeeksLeft` when ungrounded, "not tracked ≠ empty"). Purchase supports only a
**floor** claim — "owned since June 2024" — which is provenance, and is already shown. So the
freshness ladder is opened_date → harvest → nothing, and purchase keeps **every one of its
other jobs**: the stock curve, the ledger consumption rate, `monthKey` cost-by-month, and
provenance display.

---

## Windows — per-type catalog data (Tier-2 provenance)

Windows live in the **catalog, per type, as sealed/opened pairs** — the same three-tier
provenance as the swatch default (catalog value, user override wins). This is what lets matcha
and shincha stop sharing sencha's numbers, and lets roasted oolong carry a long window instead
of falling through to "no reading."

> ⚠ **These are SEED VALUES, not settled fact.** Published guidance disagrees by up to ~2×,
> which is *why* they live in editable catalog data rather than hard-coded. Do not present any
> number below as authoritative in UI copy — show the reading, keep the precise figure soft.

| Type | Sealed (seed) | Opened (seed) | Ageing? |
|---|---|---|---|
| Matcha | ~12 mo (cold) | ~3–4 wks | no |
| Japanese green (shincha/sencha/gyokuro) | ~6–12 mo | ~1–2 mo | no |
| Chinese/other green | ~12 mo | ~2–3 mo | no |
| Yellow | ~12 mo | ~2 mo | no |
| Oolong | ~1–3 yr | ~4–12 mo | **per-tea flag** — widens with roast; see below |
| Black | ~2–3 yr | ~6–12 mo | no |
| Herbal / tisane | ~1–2 yr | ~6 mo | no |
| White | — | — | **yes** (default) |
| Puer / dark | — | — | **yes** (default) |

One **Oolong** row, not two: a green TGY and a heavily-roasted Wuyi are both oolong and their
windows differ by roast, not by family — so the sealed/opened seeds span the range and the
specific tea's roast (and whether it *ages*) is a per-tea flag, not a second type.

---

## Ageing — a per-tea flag, not a family

**Ageing is a boolean on the catalog entry, not a property of the family.** Roast level belongs
to the specific tea: a light TGY and a heavily-roasted, re-fired Wuyi are both "oolong," and
only the second one ages. So there is no "roasted" vs "heavily-roasted" oolong boundary to draw
in the type table — there is one **Oolong** type and an `ageing` flag the catalog sets per tea
(defaulting **off** for oolong, **on** for white and puer/dark). It's already catalog data, so
it stays editable and a tea can be re-flagged as its owner learns how they keep it.

When `ageing` is **true** the block shows **elapsed time as history** — "3 yrs rested," "ages
gracefully" — with **no countdown, no warning tone, no urgency colour.** It still reads
opened_date if present (an opened puer cake does change), but the framing is a record, never an
alarm. When **false**, the windows above apply as a countdown.

This closes the specific thing the old engine got wrong by omission: a comment in
`steep-teas.js` already flagged that "the app's existing `freshnessClass` never calls oolong
'ages'." The flag makes ageing real without hard-coding which teas qualify — the owner's call,
per tea.

---

## Schema additions (Code slice)

- **`teas.opened_date`** *(date, nullable)* — new field. Entry point on the tea form beside
  purchase date (same provenance cluster); show-when-present on Tea detail. The rung-1 anchor.
- **Catalog freshness windows** — `{ sealed_days, opened_days }` per **type**, plus an
  `ageing` boolean that **defaults per type but is overridable per tea** (roast level is a tea
  property). Editable catalog rows, seeded from the table above.

## What already exists (leave alone)

- **`sincePurchaseDays`** — stays with the **consumption forecast** (`ledgerRate → daysLeft`),
  the more trustworthy of the two forecast methods, confident at ≥10 days of ledger. It is not
  a freshness input.
- **`inventoryHistory` / `inventorySparkline`** (v3.28) — the stock curve. Anchored by
  `purchase_date` + grams bought. R3 had dropped it to a flat bar; restored on Tea detail.
- **`freshnessClass`** — superseded by the per-type windows above (which subsume its
  delicate/neutral split and add the ageing class + the opened/sealed pair).

---

## Why purchase_date still earns its promotion

The last round promoted `purchase_date` above the fold on Add. That was right — just for the
right reasons: it anchors the **inventory sparkline** and the **ledger consumption rate**, and
it drives `monthKey` for cost-by-month. It is **not** the freshness anchor. Prominence follows
load-bearing: purchase_date is the freshness-*adjacent* cost + inventory join; `opened_date` is
the freshness join proper.
