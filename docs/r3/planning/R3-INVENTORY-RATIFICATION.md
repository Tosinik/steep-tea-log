# R3 Surface Inventory — ratified, with adjustments
2026-07-18 · From Niklas + planning lane, to Design. Answers the two questions, resolves the
open items, and flags three inconsistencies found in the inventory itself.

**Format note:** text is exactly right for this — an inventory is a checklist, not a visual.
No boards needed here. Boards resume when the missing screens get built.

---

## Ratified

The inventory is accepted as the working map. The entity × surface framing did its job: it
caught vessels, the pickers, the forms — and **you found something we'd missed: the ＋
session-setup flow is entirely undesigned.** That's the primary daily action, and naming it
as the second red slot alongside Sessions is a good catch.

**S2 (edit-layout) is accepted as answered.** Anchor-vs-movable with a declared default owner
surface is the right model — it preserves the function, resolves I3, and brings all four lost
Insights cards back. Confirmed: *Seasonal wrapped* → Insights default, *This week, mostly* →
Home default, both movable.

---

## ⚠ The privacy copy is still not accurate — check before proposing again

Proposed: *"Your diary, your account. Stored privately with encryption at rest, never sold,
never mined for ads. Export or delete everything, anytime."*

Verified against the live repo:
- **Accounts** — true (Supabase Auth). ✓
- **Encryption at rest** — true (Supabase/Postgres default). ✓
- **Never sold / never mined for ads** — true. ✓
- **"Export … anytime"** — true: `exportData()` exists (steep-settings.js — JSON backup). ✓
- **"…or delete everything, anytime"** — **FALSE.** There is no delete-everything /
  account-deletion / data-wipe function anywhere in the codebase.

So the copy written to replace a false privacy claim contains a false claim of its own.
**Two options, Niklas's call:**
1. **Cut the delete half** — "Export everything, anytime." Ships accurate today.
2. **Keep the promise and build it** — a delete-everything function becomes a small Code
   slice. Arguably worth having regardless: a personal diary app that can't be erased is a
   real gap, and it's the kind of thing a beta user will ask for.

Either way: **don't ship copy that promises a function that doesn't exist.** Send the
corrected line back and the planning lane will re-check it against the code.

---

## Three inconsistencies in the inventory

### 1. The Wrapped seam — a restored card pointing at a deferred surface
The card table **restores "Seasonal wrapped"** (default: Insights). The surface table marks
**Wrapped `DEFERRED` — "Round 1, not re-rendered for R3."** So a card in the new design
language links to a screen still in Round-1 language. That's a visible break — exactly what
reads as a half-finished app.
**Resolve:** either Wrapped gets an R3 pass (it can be light — it's a seasonal surface), or
the card doesn't ship pointing at it. Don't ship the seam.

### 2. Landing page — same question, smaller stakes
`DESIGNED` (Round 1 WS4, self-contained). But if the whole app moves to R3 and slowcup.app
stays in R1 language, the front door doesn't match the house — and it's the first thing a
beta user sees. Not urgent, but state whether it's in R3 scope or consciously left alone.

### 3. App icon marked `DESIGNED` — but it hasn't been approved
Your own earlier note said icon round 1 was *"incredibly off"* and the trace-from-photos
pipeline had failed its quality gate twice. The inventory now marks the icon `DESIGNED`
("gaiwan mark, round 2") — but **Niklas has not seen or ratified round 2.**
**Resolve:** show the round-2 icon for approval. `DESIGNED` should mean locked *and* signed
off, not drawn. (Same for **Splash**, which derives from it.)

---

## Your two questions — answered

### Vessel detail — DEFER it (don't design the page)
Three vessels, and the data is thin (name · type · material · capacity · image). A detail
page would show nothing the library row can't carry. **Make the vessel library rich enough
that tapping a vessel goes straight to edit.** Revisit only if vessels gain real depth
(pairings, per-vessel stats). Don't design a page to hold four fields.
→ `Vessel detail: DEFERRED`. `Vessel library` + `Add/edit vessel` stay in scope.

### Matcha steep-less variant (#12) — IN SCOPE, but light
Yes, now — for two reasons:
1. Niklas owns **Matcha Kiri**, so it's a live gap today.
2. More importantly, it **shares structure with grandpa style**, which the phase-2 pre-spec
   already flagged: *"design the schema so a steepless/continuous session is
   representable."* If R3 locks a system that assumes steeps everywhere, both matcha and
   grandpa need retrofitting later.

**Scope it as a *mode*, not a screen family:** the existing Log / session-setup flow needs to
handle "no steeps" — whisked, or continuous top-ups — rather than a parallel set of screens.
Minimal cost now, avoids a rework when the steepless engine work lands.

---

## Open item: dark theme — do it NOW, not at final reconciliation

Bundle 1 carried both themes; Bundle 2's four utility surfaces are light-only. Do dark before
lock, because **dark is where contract violations hide** — the clay-thumb collision and the
blue-ring question both surfaced in dark. Finding those at final reconciliation means finding
them when everything else is already locked.

---

## Build order — accepted, with one move

Your order is good (daily-use first). One change: **move the Settings privacy copy to #01.**
It's a two-line fix, it's the only item flagged as "can't ship," and it costs nothing to
resolve immediately rather than sixth. Everything else stands:

01 · **Settings privacy copy** (corrected per above) → 02 · Sessions + Session detail →
03 · Tea detail → 04 · ＋ session setup + tea/vessel pickers (#14) → 05 · Vessel library +
add/edit → 06 · Add/edit tea → 07 · Settings restorations + icon semantics →
08 · Shopping · Insights · Origins · Social refinements → 09 · First-run · empty states ·
splash → 10 · Bundle 1 + 2 → Code hand-off.

**Gate unchanged:** Bundle 1 + Bundle 2 hand to Code *together*, once both lock, carrying the
pins — swatch 3-tier · per-origin script · five contracts · per-steep tempC · ensō brush
animation · Origins map data-path. Nothing goes to Code piecemeal.
