# R3 — the design record

> **R3 CLOSED (v4.09) — kept for rationale; do not build from this.** The whole R3 build package shipped;
> the "remaining #07–#09b + hand-off" list below is done. See `R3-STATUS.md` §7 for what R3 left open and
> `STATE.md` for current state. (The ledger below now runs to R177, not the "29" this file cites.)

The visual level-up round. **Direction D · 摺物 Surimono** is locked. This folder is the
durable record: what was decided, why, and what the screens look like.

Committed because it is **the spec Code builds from** — not reference material. The old
`.gitignore` rule treated design output as local-only, which was right in R2 (inspiration
boards) and wrong here.

## What's here

**`planning/`** — the planning lane's decisions, reconciliation notes, and verified datasets.
The reconciliation notes, in order: the direction lock, then per-bundle and per-screen reviews —
read these for *why* a screen looks the way it does; each records what was caught, what was
ruled, and what was flagged as new capability.

- `R3-RULINGS-LEDGER.md` — **the binding reference for the #09b sweep + hand-off**: 29 numbered
  rulings, corrections-owed per board, shipped-truth. Boards verify against this + the code, never
  against completion summaries.
- `R3-DIRECTION-LOCK.md` — why D won over A/B/C; the five rationing contracts; the liquor
  swatch mini-spec
- `R3-BUNDLE1-RECONCILIATION.md` → `R3-BUNDLE1-REV4.md` — the four canonical screens
- `R3-BUNDLE2-RECONCILIATION.md` — Insights · Origins · Settings · Shopping · Social
- `R3-INVENTORY-RATIFICATION.md` — surface completeness + edit-layout
- `R3-SESSIONS-RECONCILIATION.md` — Sessions, and the connection-map ask
- `SPEC-freshness-model.md` — **a Code hand-off pin** (rev 2 — scope now covers the shelf
  status line, not only Tea detail)
- `DATA-region-coordinates.md` — **verified data table, the authoritative coordinate source** for
  the Origins map (cited by R15/R28; keyed on normalized `teas.origin`, never the catalog)
- `TASK-delete-everything.md` — decided, not yet built

**`design/`** — Design's own structural documents.

- `R3-SURFACE-INVENTORY.md` — every surface, marked designed / undesigned / deferred
- `R3-CONNECTION-MAP.md` — the edges: what links to what (the companion to the inventory)
- `SPEC-freshness-model-DESIGN.md` — Design's version of the freshness spec, kept for the
  record. It differs from the planning lane's copy in **substance**, not framing: it splits
  oolong into two rows (light vs roasted), where the planning copy collapses them into one
  type plus a per-tea `ageing` flag. The planning copy is the authoritative pin.
  Note both files open with the same `Design → Code hand-off` line — that describes the
  document's *purpose*, not its authorship. This one is Design's; `planning/` is the
  planning lane's.

**`boards/`** — the visual record, in two media. The `*-rev*.dc.html` files (plus
`origins-map-v3.html`) are the **current visual authority**: the R3 final export, banked
verbatim and MANIFEST-verified. The `.png` files are the **round-1 and parked record** — kept
because they show what was rejected, and *not* authority for anything being built. `support.js`
and `uploads/` are required dependencies, not clutter: every `.dc.html` loads `./support.js` by
relative path and three boards reference `./uploads/*.jpg`, so the boards render only with both
beside them. (An earlier note here said these exports were deliberately uncommitted at ~10 MB
each of inlined runtime; the final export factors that runtime into the one shared `support.js`,
putting all 21 boards at ~660 KB.)

Current — the final export, listed in `MANIFEST.txt`:

- `02-sessions` · `02b-session-detail-edit` · `03-tea-detail` · `04-session-setup-pickers` ·
  `05-vessels` · `06-add-edit-tea` · `07-settings` · `08-insights` · `08-shopping` ·
  `08-social` · `09-first-run` · `10-focus` · `11-wrapped` · `12-quick-log` ·
  `13-teas-revision` · `37-origins-refinement` · `origins-map-v3`
- `map-1-surface-matrix` · `map-2-navigation` — the entity×surface matrix and the navigation map
- `bundle-1-*-snapshot`, `bundle-2-*-snapshot` — round-1 **behaviour** reference only, never
  visual authority (R53)

Round-1 / parked PNGs:

- `direction-{a,b,c,d}-*.png` — the four directions. The record of why D won.
- `bundle-1-canonical-screens.png`, `bundle-2-reflective-utility.png`
- `02-sessions` · `02b-session-detail` · `03-tea-detail` · `04-setup-pickers` ·
  `05-vessels` · `06-add-edit-tea`
- `app-icon-round-3-PARKED.png` — the icon is parked after 12 rejected concepts across three
  rounds (the brief was over-constrained). Kept so whoever resumes it can see what was already
  tried. Two standing rulings: the icon sits outside the interaction contracts but honours
  Kachi-iro's scarcity; the ensō belongs to the timer alone.

**`HANDOVER-planning-lane.md`** — a **dated snapshot** (2026-07-19) of the planning lane at this
commit, *not* current state; its status sections go stale (see the banner in the file). Kept for
its §6 review method + §7 recurring failure modes — durable discipline. Current state lives in
`STATE.md` / `CHANGELOG.md`.

## The five contracts (invariants — check any new board against these)

1. **liquor swatch = identity only**, never decoration
2. **clay = one committing action per screen**, never selection
3. **xanthous marker = state**
4. **Kachi-iro blue = Focus ring only**, one surface total
5. **washi band = Home masthead only** (on probation)

## Status

Locked: `#02`–`#06`. Remaining: `#07–08` refinements · `#09` first-run/login ·
`#09b` conformance audit · then the **joint Code hand-off** — Bundle 1 + 2 go to Code
together, never piecemeal, carrying the pinned data-models (swatch, per-origin script,
freshness) and the flagged schema questions.

See `../../R3-BRIEF.md` for the original charter.
