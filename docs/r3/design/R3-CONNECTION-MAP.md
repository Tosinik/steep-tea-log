# SlowCup R3 — Connection Map

> **R3 CLOSED (v4.09) — kept for rationale; do not build from this.** The `MISSING` edges below were
> built; "build it (#03)" etc. are discharged. This is the 2026-07-18 connection snapshot, not current.
> See `STATE.md`.
2026-07-18 · From Design, to Niklas + planning lane. The companion to the surface inventory:
the inventory lists the **nodes** (what surfaces exist); this lists the **edges** (what links
to what). Third time this class of gap surfaced — nav completeness → surface inventory → now
connections. Nodes + edges together close it: no screen ships correct-in-isolation but
orphaned-in-practice.

**How to read.** Each surface lists **Out** (what it links *to*) and **In** (what links *into*
it). Tags on each edge:
- `drawn` — the link exists in a screen already built
- `MISSING` — the link should exist and isn't drawn yet (this is the work)
- `app` — exists in the live app today, not yet in the R3 mocks
- `new` — new capability, not in the app — becomes a Code slice at hand-off
- `p2` — lands in phase-2 (reference database / Go Deeper)
- `TBD` — entry point not yet decided (a real open question)

---

## ★ Worked example — Session detail (a hub, not a leaf)

**Out of a session**
- → **Tea detail** — open the tea from the session · `MISSING` (the most obvious one)
- → **Vessel** — open the vessel · `MISSING` (pending vessel screens)
- → **Edit session** · `app` (session-edit modal exists; edits per-steep fields via `es_setSteep`)
- → **Delete session** · `app` (`removeSession` / `dropSession`) — inline two-step confirm, no native alert
- → **New session** — "Brew this again" · `new` (`startSessionFor()` carries tea only, not vessel/method)
- → **Social** — share this sitting / pass this tea · `app` (`is_shared` is stored) + `new` (pass-to-circle)
- → **Go Deeper** — via the tea · `p2`

**Into a session**
- ← **Home** · "Earlier today" recents rows · `MISSING` (recents drawn, link not)
- ← **Tea detail** · the tea's own sessions list · `MISSING` (tea detail not built yet)
- ← **Insights** · drill from a stat into the sittings behind it · `MISSING`
- ← **Sessions list** · `drawn`

None of the Out-links are on the built Session detail yet — that's D-fix territory. The map
says *which* links each screen owes before it's done.

---

## Core loop

### Home  `drawn`
- **Out:** → Session setup (Start steeping) `drawn` · → Log a cup `drawn` · → Tea detail (tap a recent's tea) `MISSING` · → Session detail (tap a recent) `MISSING` · → Sessions / Library / Insights (tabs) `drawn` · → Settings / Social / Shopping (avatar ⊙) `drawn`
- **In:** ← app launch (post first-run) `MISSING` · ← every tab bar `drawn` · ← steeping / Focus close `drawn`

### Library — tea list  `drawn`
- **Out:** → Tea detail `MISSING` · → Add tea `MISSING` · → Go Deeper "Browse" `p2` · filter / sort (in place) `drawn`
- **In:** ← tab bar `drawn` · ← Home `drawn`

### Tea detail  `#03 — building next`
- **Out:** → Go Deeper `p2` · → Edit tea `MISSING` · → Start a session with this tea (setup, prefilled) `MISSING` · → **this tea's sessions** → Session detail `MISSING` · → Shopping (add to wishlist / mark low) `MISSING` · → Social (pass this tea) `new` · → **Origins** (this tea's region) `MISSING` — resolves the open O2 "reachable from a tea?" question
- **In:** ← Library `MISSING` · ← Session detail `MISSING` · ← tea picker (preview) `MISSING` · ← Social "Read more" `new` · ← Shopping `MISSING` · ← Origins (tap region → tea) `MISSING`

### Sessions — list  `drawn`
- **Out:** → Session detail `drawn` · → Session setup (＋) `drawn` · period filter (in place) `drawn`
- **In:** ← tab bar `drawn`

### Session setup — the ＋ flow  `#04`
- **Out:** → Tea picker `MISSING` (#14) · → Vessel picker `MISSING` · → method select `MISSING` · → In-session steeping / Focus `drawn` · → matcha steepless mode `MISSING` · cold-brew mode `MISSING`
- **In:** ← ＋ (any screen) `drawn` · ← Home Start steeping `drawn` · ← Tea detail "brew this" `MISSING` · ← "Brew this again" `new`

### In-session steeping · Focus  `drawn`
- **Out:** → Focus (from steeping) `drawn` · → log this steep (CALIBRATE / TASTE capture) `drawn` · → end → Session detail `MISSING`
- **In:** ← Session setup `drawn` · ← Home Start `drawn`

### Log a cup  `drawn`
- **Out:** → Tea picker `MISSING` · → save → Sessions / Home `MISSING`
- **In:** ← ＋ `drawn` · ← Home "Log a cup" `drawn`

### Edit session  `NEW SURFACE — add to inventory, build with D-fixes`
- **Out:** → per-steep field edits (`es_setSteep`) `app` · → save → Session detail `MISSING` · → delete session `app`
- **In:** ← Session detail (edit) `MISSING`

---

## Entities' forms

### Tea picker  `#04 · issue #14`
- **Out:** → select → back to setup `MISSING` · → Add tea (if new) `MISSING`
- **In:** ← Session setup `MISSING` · ← Log a cup `MISSING`

### Add / edit tea  `#06`
- **Out:** → swatch picker `MISSING` · → save → Tea detail / Library `MISSING`
- **In:** ← Library `MISSING` · ← Tea detail (edit) `MISSING` · ← tea picker (add new) `MISSING`

### Vessel library  `#05 · entry point TBD`
- **Out:** → tap vessel → **Add/edit vessel** (detail deferred → straight to edit) `MISSING` · → add vessel `MISSING`
- **In:** ← **TBD** — vessels are not a tab; likely the avatar ⊙ cluster or Settings › Vessels. **Open question the map surfaces: vessels have no drawn home.**

### Add / edit vessel  `#05`
- **Out:** → image slot · save → Vessel library `MISSING`
- **In:** ← Vessel library `MISSING` · ← Vessel picker (add new) `MISSING`

### Vessel picker  `#04`
- **Out:** → select → setup `MISSING` · → Add vessel `MISSING`
- **In:** ← Session setup `MISSING`

---

## Reflective + utility

### Insights  `drawn`
- **Out:** → Origins (nested) `drawn` · → drill a stat → Sessions / Session detail `MISSING` · period selector `MISSING` (I2)
- **In:** ← tab bar `drawn`

### Origins  `drawn`
- **Out:** → tap region → region's tea list → Tea detail `MISSING` (O2 tap-to-navigate)
- **In:** ← Insights (nested) `drawn` · ← Tea detail "where it grows" `MISSING` (O2 reachability — recommend yes)

### Settings  `drawn`
- **Out:** → sub-sections · → feedback / data health / diagnostics `MISSING` (S4) · → export / (erase) `app` / `new`
- **In:** ← avatar ⊙ `drawn`

### Shopping  `drawn`
- **Out:** → Tea detail (tap an item) `MISSING` · → promote running-low → wishlist `MISSING` (Sh1) · → clear acquired → Library `MISSING`
- **In:** ← avatar ⊙ `drawn` · ← Tea detail (add to wishlist) `MISSING` · ← Social (passed → wishlist) `new` (So1)

### Social  `concept`
- **Out:** → passed cup → Tea detail / Go Deeper "Read more" `new` · → add to wishlist `new` (So1) · → vendor (where bought, `source`) `new` · → kindred note appears **on** a tea `new` · → circle (avatar) `new` · → tea-together presence (pull) `new`
- **In:** ← avatar ⊙ · ← Session detail (share / pass) `app`+`new` · ← Tea detail (pass this tea) `new`

---

## System

### First-run / onboarding  `#09`
- **Out:** → Home `MISSING` · → add first tea `MISSING`
- **In:** ← app launch (no account / empty) `MISSING`

### Go Deeper — reference database  `p2`
- **Out:** → back to tea · browse catalog
- **In:** ← Tea detail · ← Library "Browse" · ← Social "Read more" · ← Session (via tea) — all `p2`

### Wrapped  `light R3 pass`
- **Out:** → share as text `drawn (R1)`
- **In:** ← Insights (seasonal card) `MISSING` · ← Home (seasonal-wrapped card, **gated** until Wrapped's R3 pass) `MISSING`

---

## The gaps this map surfaces (the wiring checklist)
1. **Tea detail is the busiest hub** — 6 out-links, 6 in-links, almost all `MISSING`. Build it (#03) knowing it must reach: Go Deeper, edit, start-session, its own sessions, Shopping, Social, Origins.
2. **Vessels have no home** (`TBD`) — decide the entry point (avatar cluster vs Settings) before #05.
3. **Session detail owes 7 out-links** — the D-fixes wire them.
4. **"Brew this again" + pass-to-circle + tea-together + erase** are `new` capabilities — collect them as Code slices at hand-off, not silent assumptions.
5. **Recents (Home) → Session detail / Tea detail** — drawn rows, undrawn links.

## Housekeeping recorded
- **Edit session** added as its own surface (was missing from the inventory — D4).
- **Calendar view** = **deferred**, not dropped (SES1). "This year ▾" is a *period filter*; a
  calendar is a *view* (month grid of brew-days). Different features; the calendar is a later `MISSING`.
- **"Brew this again"** = `new` capability (D7) — flagged for the Code hand-off.
