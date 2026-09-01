# SPEC · Smart Restock — one entry, a purchase log (retires R11)

**Status:** planning, decision-complete on shape + identity rule; the storage mechanism and cost math are
build questions for the plan-gate.
**Supersedes:** **R11** (a rebuy creates a new tea row). This spec **retires that ruling** — file the
reversal as a new ledger entry, don't silently drop it.
**Round:** r5 stock-management. Standalone; the **sample flag** pairs with it. Independent of guided mode.

---

## 1 · The reversal

R11 ruled that rebuying a tea creates a **new tea row** (`purchaseType: 'first'|'repeat'`, the `isRepeat`
checkbox, the `teaPrefill` flow). Niklas has reversed it: rebuying the **exact same tea** now **tops up one
entry** via a Restock button — no second row. R11's new-row path is retired; §7 covers the transition.

## 2 · Identity — what counts as "the same tea" (one entry)

An entry is **one tea** when **name + vendor (`source`) + harvest year** all match. If **any** differ →
a **separate entry**:

- **Different vendor** → separate entry (a similar tea from someone else is its own thing).
- **Different harvest year** → separate entry — new character, a new freshness clock, and last year's
  tasting notes must **stay** last year's, never relabelled.

So restock (top-up into one entry) is for rebuying **this crop from this vendor**. Anything else is a new
entry, and §5 links them read-only rather than merging them.

## 3 · The Restock button

On the tea entry, a **Restock** button → **grams bought · date · cost**. On submit:

- `amountGrams += grams` — the single-writer stock predicate (`stockTier`) reads the new total; restock
  only *sets the amount*, never re-implements the tier.
- `openedDate ← restock date` (you open the new bag) → freshness refreshes through **`freshnessReading`**
  (the single writer; `openedDate → harvest → nothing`). **No new freshness logic** — restock only sets
  the date. *(Honesty note: a small remnant of the prior bag now reads fresh too. Acceptable — the model
  already treats the entry as one stock, and the remnant is by definition small.)*
- **Append a purchase-log event** (§4).
- **`wouldRebuy ← true`** — you literally rebought it. The existing control still lets the user unset it.

## 4 · The purchase log — the "smart" engine

Each entry carries an **ordered purchase log**: `{grams, date, cost}` per buy. The **initial add is buy
#1**; each restock appends. Everything "smart" falls out of this one structure — it *is* the feature, not
an add-on:

- **Purchase history** — "100 g · 12 Mar 2024 · €18 → 50 g · 9 Jan 2025 · €10."
- **Per-batch lifespan / real consumption rate** — `openedDate` → next restock (or → depletion): "this
  one lasts you about seven weeks."
- **Total spend on this tea** + a **true weighted cost-per-gram** across all buys, not just the latest.
- **"You keep coming back"** — restock count feeds a calm reflection insight ("teas you return to"); the
  `wouldRebuy` confirm above is the same signal.

Without the log none of these are honest, which is why a plain "sum the grams and move on" update is
rejected: it forgets the entry was bought twice.

## 5 · Soft-linking across entries

Because a new harvest or vendor is a **separate** entry, the same tea across years lives in several entries.
**Soft-link** them by **name + vendor** — a read-only grouping — so "you come back to this every spring"
surfaces **across** the per-harvest entries, without merging them or muddying any one entry's harvest or
freshness. (A looser **name-only** grouping across vendors is possible if wanted — a build question, not
ruled here.)

## 6 · Invariants

- **Single-writer freshness** (`freshnessReading`) — restock sets `openedDate` and nothing else; it never
  computes freshness.
- **Single-writer stock** (`stockTier`) — restock sets `amountGrams` and nothing else.
- **Calm-first / Tea-First** — restock is a quiet action on the entry, never a nag; the log and insights
  are observational, never gamified.
- **Escaping** on any surfaced purchase-log/vendor text.

## 7 · Migration / transition

- R11 has **already created separate rows** for past rebuys. **Do NOT auto-merge them** — a migration
  guessing which rows are "the same tea" is exactly the guess to avoid. Leave existing rows as-is; the new
  behaviour is **forward-only**, and the §5 soft-link groups them read-only anyway. *(Confirm this is the
  wanted call at the plan-gate.)*
- The R11 create path (`isRepeat` / `purchaseType:'repeat'` → new row) is **superseded** by the Restock
  button. How the old checkbox/flow retires (removed vs repurposed) is Code's call at the plan-gate.

## 8 · Data-model & build questions (for the plan-gate — Code proposes, Planning reconciles)

- **Storage of the purchase log:** a **JSONB column** on `teas` (e.g. `purchase_log`) vs a related
  `purchases` table. *Lean:* the JSONB column, consistent with the app's no-heavy-relational bias — but
  Code argues it. Either way it's a **migration → SQL-first**: push the `sql/vN_M-*.sql` file **alone,
  first**, per the deploy ritual, before the code commit exists.
- **Cost math:** weighted cost-per-gram across the log; how `cost_total` / `cost_original_grams` relate to
  or are derived from the log (or are retired in its favour).
- **The soft-link mechanism** (name+vendor grouping) and where it surfaces.
- **One path or two:** does the initial-add form and the Restock form share a single "purchase event"
  path, or stay separate?
- **Sample → full-buy conversion — DEFERRED to the sample-flag slice** (a sample you decide to buy
  properly: does the full bag restock/convert the sample entry, or open a new one?). Flagged so it's
  known; not scoped here.

---

*Retires R11. Mints a new ledger ruling on ship. SQL-first. Stock-management round; the sample flag pairs
with it. Independent of guided mode — safe to build in parallel with the cupping research.*
