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

## Grounding — three tiers (same shape as the swatch)

The *reading's confidence* is set by what anchors its clock. Never guess; when nothing
grounds it, show nothing — exactly as the swatch renders per-origin script rather than
inventing a colour.

| Tier | Anchor | Reading |
|---|---|---|
| **Tier-1 · measured** | `teas.opened_date` present | Clock runs from opening; the **opened** window applies. The reading we trust. |
| **Tier-2 · estimated** | no opened_date, but `harvest` (or purchase) present | Clock runs from harvest; the **sealed** window applies, tagged *assumes sealed*. Softer tone, lower confidence. |
| **Tier-3 · none** | neither grounded | **No freshness reading at all.** The block is absent — not a guess, not a zero. |

`purchase_date` is a weak Tier-2 stand-in for harvest only; it is **not** the freshness anchor.
Its real jobs are the stock curve and the ledger consumption rate (see below).

---

## Windows — per-type catalog data (Tier-2 provenance)

Windows live in the **catalog, per type, as sealed/opened pairs** — the same three-tier
provenance as the swatch default (catalog value, user override wins). This is what lets matcha
and shincha stop sharing sencha's numbers, and lets roasted oolong carry a long window instead
of falling through to "no reading."

> ⚠ **These are SEED VALUES, not settled fact.** Published guidance disagrees by up to ~2×,
> which is *why* they live in editable catalog data rather than hard-coded. Do not present any
> number below as authoritative in UI copy — show the reading, keep the precise figure soft.

| Type | Sealed (seed) | Opened (seed) | Class |
|---|---|---|---|
| Matcha | ~12 mo (cold) | ~3–4 wks | delicate |
| Japanese green (shincha/sencha/gyokuro) | ~6–12 mo | ~1–2 mo | delicate |
| Chinese/other green | ~12 mo | ~2–3 mo | delicate |
| Yellow | ~12 mo | ~2 mo | delicate |
| Green / light oolong | ~12–18 mo | ~3–4 mo | neutral |
| Roasted oolong | ~2–3 yr | ~6–12 mo | neutral (long) |
| Black | ~2–3 yr | ~6–12 mo | neutral (long) |
| Herbal / tisane | ~1–2 yr | ~6 mo | neutral (varies widely) |
| **White** | — | — | **ageing** |
| **Puer / dark** | — | — | **ageing** |
| **Heavily-roasted / aged oolong** | — | — | **ageing** |

---

## Ageing types — history, not urgency

Types flagged **ageing** (white, puer/dark, heavily-roasted oolong) improve or hold for years.
For these the block shows **elapsed time as provenance/history** — "3 yrs rested," "ages
gracefully" — with **no countdown, no warning tone, no urgency colour.** They still read the
opened_date if present (an opened puer cake does change), but the framing is a record, never an
alarm.

This is the specific thing the old engine got wrong by omission: a comment in `steep-teas.js`
already flagged that "the app's existing `freshnessClass` never calls oolong 'ages'." The
model makes ageing real — as **catalog data**, not a hard-coded list — so it stays editable.

---

## Schema additions (Code slice)

- **`teas.opened_date`** *(date, nullable)* — new field. Entry point on the tea form beside
  purchase date (same provenance cluster); show-when-present on Tea detail. The Tier-1 anchor.
- **Catalog freshness windows** — per type: `{ sealed_days, opened_days, ageing: bool }`.
  Editable catalog rows, seeded from the table above. The Tier-2 window source.

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
