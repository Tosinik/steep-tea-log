# TASK — #23 interim sort (Library)

> **Shipped v3.84** (commit `173950c`, cache v94; #23 F1+F3 ticked). Kept as the build record —
> #23 still holds F2 (vendor filter) / F7 (focus-mode actions) / F8 (per-steep library chips).

**Scope:** reinstate a sort control on the tea shelf. Interim = function now, R3 restyles.
This is the "ships now" slice of #23 only — vendor filter (F2), focus-mode actions (F7),
and per-steep library chips (F8) stay parked in #23 pending reinstate-vs-accept decisions.
Drafted 2026-07-13 against HEAD `58f1ba2` (v3.83 / cache v93).

## Decisions (settled — do not re-open)

1. **All seven sort options return**, mapping to the existing engine keys in
   `filteredSortedTeas` (steep-teas.js:181–201, intact, zero changes needed):
   `type` · `newest` · `oldest` · `name` · `stock-high` · `stock-low` · `rating`.
   Labels: **Type (default) · Recently added · Oldest first · Name A–Z · Most stock ·
   Least stock · Highest rated**. Default stays `type`; state key stays `state.teaSort`
   (already initialized in steep-core.js:131).
2. **Reinstate `setTeaSort` as the handler** (steep-teas.js:283 — it was held from the
   F11 cleanup precisely as this hook). Do not add a parallel writer.
3. **Running-low float is default-sort-only.** `shelfSort` (steep-teas.js:78) currently
   applies unconditionally in `teaShelfHTML` (:260) — under an explicit sort that would
   silently reorder the user's chosen order. New rule: `state.teaSort==='type'` → float
   as today; any explicit sort → engine order untouched. Finished teas group at the
   bottom in **all** sorts (unchanged).
4. **UI: one compact native `<select>`**, right-aligned on the count line
   (`.lib-count` row, steep-teas.js:248), WS1 styled-trio pattern (`appearance:none`).
   Native picker on mobile is the recorded accepted tradeoff (DESIGN.md, F29). No new
   chips — the chip row stays filters-only. No popups, obviously.
5. **Session-scoped state.** `teaSort` lives in in-memory state and resets on reload —
   acceptable for interim; persistence is an R3 question. Note it in the CHANGELOG.
6. **Search-node caveat:** `onTeaSearchInput` swaps only `#teaShelf` innerHTML (comment
   at steep-teas.js:255). The sort control lives *outside* that node, so keystroke
   re-renders are unaffected; `setTeaSort` does a full `render()` — fine, no input to
   lose focus on. Verify grid *and* rows densities both follow the sort (they share
   `renderShelf`'s input list — should be free).

## Fixture (required — decision 3 is a branch)

New `fixtures/shelf-order-test.js` (or extend status-line-test if cleaner), pinning:
- default `type`: low-stock actives float top; type-then-name preserved within
  (shelfSort is stable over the pre-sorted list)
- explicit `rating`: NO float — a low-stock 3★ tea sits below a plenty 5★ tea
- explicit `stock-low`: ascending grams among actives
- finished teas at bottom under default AND explicit sorts
- null handling (grounded on real CSV 2026-07-13): unrated → 0 → rating tail;
  empty/0 grams → 0 → stock-low head (moot for actives if 0g ⇒ finished)
- real-CSV section with graceful skip on fresh clones, per convention

## Ship checklist

One commit, cache bump (touches render + behavior): CACHE_NAME v94 · APP_VERSION v3.84 ·
WHATS_NEW ("Sort your shelf again — by stock, rating, or age.") · CHANGELOG entry naming
exact files (expected: steep-teas.js, steep-core.js if state init changes, styles.css,
service-worker.js, fixture). `node --check` clean. Emoji sweep. Update #23: check off
F1, note F3's count-line segment if you restore it (optional rider — "N in stock" back
into the count line is in-scope if cheap, skip if not). Plan-review pause before
implementation — this touches shelf render + a behavior branch, so the pause is
mandatory, not optional.

## Out of scope

Vendor filter UI (F2), focus-mode log/reset (F7), per-steep library chips (F8),
sort persistence, any visual restyle beyond the styled-select pattern (R3),
`setTeaFilter` (stays held).
