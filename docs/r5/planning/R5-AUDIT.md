# R5 — the overhaul-landing audit (drawn vs shipped)

> **Written 2026-08-28, planning lane.** Belongs at `docs/r5/planning/R5-AUDIT.md`. Docs push on write.
>
> This is the founding reference for R5, the round that *lands* the design overhaul the R2/R3 boards
> drew. It is a diagnosis + punch-list + routing + sequence + decisions, verified against
> `origin/main = 5f8a28e` (v4.20) — not chat memory. Every "shipped" claim below was checked in the
> live clone; every "drawn" claim is traced to a board and flagged as drawing, not shipped truth (the
> R81/F2 stale-board family this work keeps catching). Formal R-numbers are assigned to the ledger as
> R5 slices deploy; this doc is the reference they hang off.

> **R5 STATUS — updated 2026-08-28, slice 1 SHIPPED (v4.22, `e8c18fa`).** The spine board is now **banked in-repo** at
> `docs/r5/boards/surface-language-spine.dc.html` (with its `support.js` dep and the two repo rules a
> new-round board needs — `.gitignore` negation + `.gitattributes -text`). **§2 is no longer the sole
> authority**: the board is, and it reconciles cleanly against §2. The v4.21 picker reconciliations are
> minted to the ledger as **R146–R152** (they were deferred to "as R5 slices deploy" in §3). **Slice 1
> (v4.22) SHIPPED:** the four container primitives (RULE/BAND/BOX + the SLAB reconciled to the
> existing `.btn-clay`), `--band` as an alias of `--porcelain-dim` (zero new hex — the near-duplicate
> catch, F32/R128), the **fill-law fence (F31, minted R153)**, and the **shelf** as the single re-dressed
> pilot (containers only; filter chips / type-tints are board-13-rev2, untouched). Radius law reconciled
> **to shipped source**, not the board's drawn numbers (liquor `8/4/7/4` CSS + the `9/4/8/5` SVG-path
> shelf swatch; slab = `.btn-clay` `15/5/13/5`) — per R127/R128, source is the measurement of record.

---

## 1 · The diagnosis — Surimono landed as ink, not paper

The complaint that opened this round, in Niklas's words: *"the way Design drew the screens they
actually looked like a different app — the way we have it now it's some new features packed onto the
same frame."* Verified, and it is literally true.

**What did land** (checked in `styles.css`): Shippori Mincho as `--font-display`, used throughout; the
rationing tokens `--clay`, `--xanthous-wash`, `--enso`, the full `--liquor-*` ramp; the torn-paper
radius on the masthead; the liquor swatch (v4.20). So the *type* and the *material moments* shipped.

**What did not**: the **frame**. Every container is one uniform box — `.card{ background:--white;
border:1px solid --line; border-radius:14px; padding:18px }` — with **119 border-radius declarations**
across the sheet. Surimono (R3 Direction D) was locked to *be* "the quietest frame that makes the
swatch read loudest"; the code reached for a generic rounded box instead and dropped the distinctive
type and colour moments inside it. So the app reads as boring-B with a nice font — which is exactly
"looks the same as before the overhaul." The overhaul was drawn; it was never built as a **surface
system**. That gap is the spine of R5.

---

## 2 · The spine — the surface-language frame system

Design's `R5 · Surface Language Spine` board (reconciled against `styles.css`, banked). It replaces the
single `.card` with **four containers and one law**.

**The law (F31, fenceable):** *the frame never carries a fill.* Paper, line and type only; every fill on
screen belongs to a rationed mark (liquor, clay, xanthous, blue). This converts four style conventions
held in conversation into one assertion a fence can check — and it is what stops the next 119 boxes.

**Four containers replace `.card`:**

- **RULE** (~70%, the default) — no container. Content sits on paper, divided by hairlines; a section
  header takes a 2px ink rule beneath it. `border-bottom:1px --line · header 2px --ink · radius 0 · no
  background`. This is what most of the 119 boxes become.
- **BAND** (1–2/screen) — a full-bleed paper-tone stripe; says where you are or breaks a long screen.
  `background <band tone> · border-top/bottom 1px --line · radius 0 · no side borders`.
- **BOX** (rare) — a real bordered container for a discrete object (one tea, one session, a modal, an
  inline form). Test: delete the border; if the content is still obviously one thing, it was never a
  box. `background --white · border 1px --line · radius 2px · no shadow ever`.
- **SLAB** (exactly 1/screen) — the clay committing action, the only container permitted a torn radius
  because it is the only one carrying a rationed colour. `background --clay · radius 14/5/12/6 · no
  border`.

**Radius law:** `9/4/8/5` = liquor identity only; `14/5/12/6` = clay slab only; everything else `0` or
`2px`. A torn corner anywhere else is a contract breach, visible at a glance and countable in a fence.

**Token reconciliation (planning finding — the rollout is smaller than the board assumed):** every frame
hex the board proposed is *already a shipped token*. Hairline `#D8CFB9` = `--line`; header rule
`#2B2320` = `--ink`; box background `#FFFEFB` = `--white`; slab = `--clay` (#8B5E4A). The paper tone the
board drew as a stand-in it "doesn't know is a token" — `#F6F2E9` — **is `--porcelain`** (already defined,
already used). So the entire token cost of the redesign is: **use five existing tokens, add one** — the
band tone `#EDE7D6`, which still needs a dark-theme value (every other frame token has one).

**Findings carried into the rollout:**

- **F32** — paper tone is the largest visual change and the smallest code change: pointing the frame
  surface at `--porcelain` instead of `--white`. The one item that would improve the app even if nothing
  else here ships.
- **F33** — retiring uniform-14 is *subtractive*: 119 sites lose a radius and most lose their border and
  background too. A box removed from something load-bearing for grouping reads as two lists merged. So
  the rollout is **its own gated slices, BOX-test applied surface by surface — never a global
  find-and-replace** — and it is the highest blast radius on the board, so it **sequences last**, after
  the pickers, so they re-dress with the shelf surface they share a helper with.
- **F34** — two contracts now have a *shape* as well as a colour (liquor swatch radius, clay slab
  radius), so a breach survives greyscale and a theme the contract was not written for — which the
  dark-mode work showed is exactly where colour-only contracts get thin.

---

## 3 · The punch-list (per screen)

| # | Screen | The gap | Lane | Status |
|---|--------|---------|------|--------|
| 1 | **Session-setup pickers** | Tea + vessel are native `<select>` (the OS pop-out); board 04 rev 6 drew them as picker *screens*. #14, unblocked by the v4.20 swatch. | **Code** | **Shipped — v4.21** |
| 2 | **Library shelf** | Flat type-tint chips + dated filtering; clashes with the new liquor swatch beside them. Board 13 rev 1 predates the swatch and never reconciled the tint language against it. | **Design** (board 13 rev 2, swatch-aware) | **Frame SHIPPED v4.22** (spine, containers only — pilot); tint redesign (board 13 rev 2) queued |
| 3 | **Home** | Under-designed (confirmed). Generic-card frame; greeting copy that doesn't match reality; Wrapped too prominent; Favorites placement uncertain. Keep: week card, Earlier today, Running low. | **Design** (element mix) + **Code** (greeting bug) + spine (frame) | **HELD — combined frame+content effort (R159/R160)**; frame board banked `docs/r5/boards/home-element-mix.dc.html`, gated by `HOME-VISION.md` |
| 4 | **Insights** | Reads the same as pre-overhaul; only origins were added. | **Design** (board-vs-shipped read) | **NEXT Design draw** — redress + cull unused cards + non-"AI" copy + re-dress the stat cards (#5); not held |
| 5 | **Stat cards** (all-time/month/week) | Data is right, presentation isn't. | **Design** | Queued |
| 6 | **Steeping** | Temp/time/notes sit *below* the tasting notes (wrong order); tasting-note input needs rework — more vocabulary or a different entry method. | **Code** (reorder) + **Design** (tasting input, touches the flavour model) | Queued — entry-method direction is the **structured note picker** (`IDEA-tasting-mode.md` § "everyday counterpart"); "more vocabulary" is the deep tasting mode there |
| 7 | **Matcha** | No prep *mode*. Wanted: pick the matcha + the preparation (original vs latte), whisked, so no steep ladder. A **new feature**. | **Design → Code**, own track | Queued |

**Session-pickers detail (SHIPPED v4.21):** two searchable picker screens (R58 "screens not
overlays") retiring the three native selects (setup, session flow, edit-modal vessel). Tea rows composed
from a shared `teaRowIdentity` helper (single writer, two wrappers — `shelfRowHTML` and the picker both
call it, so the spine re-dresses both at once). Reconciled rulings folded in: **no long-press colour
correction** (it does not exist to wire — no gesture primitive, and the v4.19 liquor picker is a form
control with no standalone commit path; deferred as its own gesture+commit build); **no per-tea script**
(R129 extends to the picker — a scanning surface); **flat list + one quiet type filter, not optgroups**,
preserving the finished-teas behaviour exactly (hidden default, "show finished (n)" toggle, finished
current selection always shown); **vessel kanji reused as-is**; **picker context is a serializable
`kind` tag + dispatch through the existing setters** (preserving `d_setVessel`'s method-prefill),
**not a stored closure**.

---

## 4 · Sequence

1. **Pickers (v4.21)** — SHIPPED.
2. **Spine rollout** — per-surface, gated (F33's BOX test). **Slice 1 SHIPPED v4.22** (`e8c18fa`, shelf +
   the fence R153); **slice 2 v4.23** (Shopping, R154/R155); **slice 3 v4.24** (session-detail, R156/R157 —
   the first box-less surface). session-detail was the **last clean self-contained surface**; vessels is a
   trivial empty-state tidy still available. What remains is entangled (see below).
3. **Per-screen redraws** — hang off the spine, but **not all are containers-only**:
   - **Home is HELD (R159)** — it exits the containers-only rollout into ONE combined **frame + content**
     slice, gated by the Home-distinct-data feature vision (`HOME-VISION.md`); frame-alone reads as empty,
     not calm, on the identity surface. **calm ≠ spare (R160).** Its frame board is banked.
   - **Insights** — a **containers-plus-copy** redress (not held): redress + cull unused cards + non-"AI"
     copy + re-dress the all-time/month/week **stat cards**.
   - **shelf rev 2** (board-13-rev2 tints), **steeping** (reorder + tasting input) — still queued.
   - **tea-detail** — deferred to **mark-remediation** (inline `var(--jade-pale)` → rationed marks; a
     markup-level guard, not the CSS selector fence — see §6).
4. **Feature track** (separate, never smuggled into the restyle) — matcha prep mode; **Home-distinct data,
   now elevated from parked to Home's gating dependency (R159; `HOME-VISION.md`)**.
5. **Greeting-copy bug** — a Code correctness fix; small, can go early.
6. **Security / legal — F1/F2** — see §5.

First-run experience (Pillar C) and launch infrastructure (Pillar B) are **deprioritised behind this
list** — no point onboarding a stranger into a frame that doesn't match the design yet. Brew-advice
phase 2 (Pillar A, gate met) stays in the important tier.

---

## 5 · Decisions on the record

- **Security (F1/F2) deferred by Niklas's decision (2026-08-28)** — on the basis that he is currently the
  app's only active user. **Not dropped.** F1 (`profiles` readable by all authenticated users) and F2
  (`tea-photos` bucket public) **re-block before the next person logs in** — Ruth returning, or the beta
  widening — because at that point the exposed data is no longer only his. The trigger is *pre-widening*,
  not a date. This is recorded as a decision, not a drift: §8 item 23 names this exact deferral pattern,
  and it is being chosen deliberately, out loud, rather than absorbed. F1/F2 are RLS policies + a bucket
  setting (Supabase, no frontend files) — they cost the design road nothing, which is why deferring buys
  no design velocity, only exposure time.
- **Long-press colour correction: dropped from the picker slice.** New work, not a wiring job (needs a
  touch-gesture primitive that doesn't exist + a standalone in-place liquor picker — the "primary path"
  v4.19 deferred as F6). Colour correction stays in the tea form. If wanted, it is its own gesture+commit
  build with an on-device smoke.
- **Per-tea script on scanning surfaces: none** (R129 extends from the shelf to the picker).
- **New features are not smuggled into the visual restyle** (R3's own rule). Matcha prep mode and
  Home-distinct data are a separate feature track.
- **Matcha is a prep mode, not a method** — pick the matcha + original vs latte, whisked, no steep
  ladder.

---

## 6 · Deferrals / open items

- **Vessel kanji coverage** — `vesselPhoto`'s kanji map covers 3 types; the real photo-less yunomi
  (湯呑) falls through. A small content addition for a vessel/content pass — not smuggled into a
  structural slice.
- **Photo-less vessel fallback = a type-tinted stripe** — a colour-fill on a non-rationed element, which
  the spine's fill-law (F31) is exactly built to catch. Resolved in the rollout, not the picker slice.
- **Greeting copy vs reality** — a correctness bug in the greeting engine (predicted-vs-actual, window
  redirects, the variety guard). Needs a captured live mismatch (what it *said* vs what was *true*) to
  trace.
- **Home-distinct data — ELEVATED from parked to Home's gating dependency (R159).** No longer "brainstorm
  after the frame settles": Home's frame and its content ship as ONE effort, because frame-alone under-
  delivers on the identity surface. The vision is captured in `docs/r5/planning/HOME-VISION.md`
  (brainstorm-open, not spec'd): today's-tea-deepened, a recently-brewed showcase/carousel, pass-a-cup-on-
  Home (deferred until more users), warmth in the frame, plus the smarter-over-time candidates
  (palate-this-season, mood-time patterns, per-tea sweet-spot). When opened: brainstorm → spec → the
  combined Home slice = the banked board's frame + this content + warmth.
- **calm-first is not spare-first (R160).** Recorded here so a future pass does not re-flatten Home into a
  utility list: calm forbids gamification/streaks/nags/metric-worship, but **permits** warmth, imagery,
  liquor colour, and character. Austerity belongs to the utility surfaces' spine, not to Home.
