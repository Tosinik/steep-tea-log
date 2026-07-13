# R3-BRIEF — SlowCup visual level-up (design round 3)

**Status:** exploration phase. Nothing here is implementation-ready until a direction is
chosen and locked bundles are produced, reconciled, and handed to Code.
**Owner:** Niklas. **Consumer:** Claude Design. **Reconciler:** claude.ai (bundles are
checked against the live repo before Code implements — same pipeline as R2).

---

## 1 · What SlowCup is, in one paragraph

A personal, calm-first tea-logging PWA, live at https://slowcup.app. Ritual over
gamification: no popups, no streaks, no XP (cut deliberately), sound opt-in and off by
default. Vanilla JS, no build step, one `styles.css`, two themes resolved entirely
through CSS variables, offline via service-worker cache, hosted on GitHub Pages.
Currently a beta of one, about to open to a small circle — so first-run states and an
install story are becoming real surfaces for the first time.

## 2 · The problem R3 exists to solve

Feedback on the current build: **"looks like the Claude design."** Diagnosis: the
tokens are not the problem — R2 established a real identity (Shippori Mincho, hairline
SVG icons, the two-arc ensō timer, jade accents). What still reads generic is
**structure**: nearly every surface is the same rounded card in the same vertical
rhythm. R3's job is to make SlowCup unmistakably a tea app — and unmistakably *this*
tea app — primarily by breaking structural sameness, not by re-rolling the palette.

## 3 · Deliverable

**Three named directions, deliberately different from each other**, each carried
through the **same four screens** at phone width (390 px first):

1. Home (with greeting card)
2. Library (grid density, chips + sort visible)
3. Steeping incl. Focus mode (ensō mid-arc)
4. Log form (core trio + More-details fold + flavour capture)

Each direction states its philosophy in a few sentences. Suggested divergence axes —
seeds, not prescriptions: **illustration-led** (traced teaware, see §5),
**editorial/typographic**, **material/textural** (paper, unglazed clay). Two earlier
captured seeds may be used, merged, or discarded: *warm atelier* vs *saturated
botanical*, plus the reserved-colour idea. Design is explicitly invited to propose
beyond all of these.

After Niklas picks a direction (hybrids allowed), R3 moves to per-workstream locked
bundles, R2-style.

## 4 · R2 heritage — protected / open

**Protected by default:** the two-arc ensō timer; Shippori Mincho.
**Open:** jade as the accent; the card language; spacing/density rhythm; icon styling
(hairline weight preferred but not sacred).

Design has standing to contest a protected item — but must make the case explicitly in
the direction's philosophy note. Final call is Niklas's at direction review.

## 5 · Asset pipeline: Niklas's own teaware

Raw photographs/scans of Niklas's actual kyusu, cups, and tea leaves are provided in
the project base. **These are source material, not UI assets.** Design's job is to
trace them into **hairline SVG line art**, tintable via CSS variables so both themes
resolve them (same mechanism as the existing icon sprite / `favLeaf` pattern).
Rationale: uniqueness (his objects, not stock tea clip-art), near-zero weight, theme
compatibility. Toned monochrome photo treatments are permitted sparingly as textures
for hero/empty states only, and each use must justify its cache weight.

## 6 · Scope

Everything user-visible is in the visual pass. In addition, the full R3-gated backlog
joins this round as design work:

- **#7 — boards/passport** *(treat as its own workstream inside R3)* — the shipped dot-map
  was rejected as unrecognisable ("just dots") and never sat well at phone width; the
  parsing/aggregation layer is reusable — only the rendering gets redesigned, toward drawn
  country outlines/borders.
- **#8 — settings overhaul** — the settings screen never received an R2 pass: a long
  undifferentiated toggle list that needs its own designed structure.
- **#10 — app icon from the gaiwan** — rework the app icon around Niklas's own gaiwan
  (photo on the issue); needs human art — pairs with the icon/theme-color/splash surface
  in §6 and the teaware pipeline in §5.
- **#12 — matcha / matcha-latte session mode** — counts as tea and toward caffeine but
  has no steeps; the log form needs a designed steep-less variant (the engine change
  itself is a later Code slice, out of R3's hands per §9).
- **#14 — session-setup tea picker** — the selection popup still reads pre-R2 because it
  is a native `<select>`, accepted for now; a custom listbox is real a11y work, so R3 may
  propose one only as a scoped, justified exception (constraint §8.6).
- **#22 — WS4 capture placement** (move "What are you tasting?" below water temp, collapsible by default)
- **#28 — Edit-layout button placement** (triage finding: pure placement change; the edit bar is the first element `renderDashboard` emits on both tabs)
- **#23 F2 / F7 / F8** — remaining Library decisions parked for R3:
  - **F2 — vendor filter**: WS5 dropped the vendor dropdown; since v3.80 Library search
    contains-matches the vendor field — decide reinstate vs accept search as the answer.
  - **F7 — focus-mode actions**: the breath-led rebuild is tap-to-pause / swipe-to-leave
    only, so logging a steep mid-gongfu means leaving focus mode — decide a quiet
    in-focus "log this infusion" affordance vs accept pause-only.
  - **F8 — per-steep personal tag chips**: WS4 replaced the user's own tag-library chips
    with the fixed 20-term KB vocabulary; personal words per steep are type-only now —
    decide accept vs reinstate a "your words" row.

**New surfaces (no current design exists):**

- **App icon, theme-color, splash** — manifest already says SlowCup; `icon192/512`
  predate the identity. The home-screen icon is the most-seen design surface in a PWA.
- **First-run / empty states** — every screen was designed around populated data; a
  new user currently gets nobody's design work.
- **Install guide / beta package** visuals — unblocked by the domain.

## 7 · Content contracts (design for real strings, not lorem)

These are engine outputs. Their copy register is honest and calm and must not be
decorated away. Lengths vary; German user content (tea names, notes, tags) can be
long — text blocks must survive it. English UI chrome, German content, mixed freely.

- **statusLine** (Library rows/cards): `"23g · fresh, plenty"`, `"a few cups left"`,
  `"running low"`, and from v3.86: an **empty** presence plus the
  `"quantity not tracked"` branch for active-but-0g teas (unknown ≠ empty — never
  render unknown as either empty or plenty).
- **Count row** (Library): three segments — `"7 teas · 5 in stock · 3 running low"` —
  gaining `"· E empty"`; must coexist with the sort select at 390 px (currently via a
  blessed wrap; a better answer at phone width is welcome R3 work).
- **Cups-left tiers** are session-aware (cups = grams ÷ personal dose): accepted
  nuance is "tier is cups, not grams". A one-line explanation lives on tea detail
  (v3.86 F-option) — style it, don't move it to the shelf.
- **Greeting** variants (morning/evening) incl. rediscovery/ack lines.
- **Honesty ladder** rendering in flavour capture; **kanji fallback plates** for teas
  without images; grid/rows density toggle — all are engine-rendered structures whose
  variants must each be designed, not just the happy case.
- **Method control**: design it as a **four-way** (gongfu / western / cold brew +
  incoming "japanese" senchadō from phase-2), even though the current build shows three.

## 8 · Hard constraints (violations fail reconciliation)

1. No build step. Plain HTML/CSS/vanilla JS; one `styles.css`; no CSS frameworks,
   no animation libraries.
2. Every colour through CSS variables; both themes must resolve every new token.
3. No pictographic emoji anywhere. Allowed glyphs: ✕ ✓ ★ — . Iconography is the SVG
   sprite.
4. Fonts: free and self-hostable only (Google Fonts acceptable).
5. Asset weight budget: the service worker precaches the app; every asset must earn
   its bytes. Line art over photos by default.
6. 390 px phone-first, with native-control humility — native `<select>` and inputs
   size unpredictably (learned in v3.84); custom controls only as scoped, justified
   proposals.
7. Calm-first copy and interaction: no gamification aesthetics, no urgency patterns,
   no popups; notifications/push are ruled out (decided on #30).
8. Accessibility: contrast holds in both themes; decorative SVGs stay `aria-hidden`.
9. Design must not compromise shipped engine behaviour or block known future work
   (phase-2 brew advice, timestamp-anchored timer, stock tiers incl. empty).

## 9 · Out of scope

Frozen with reasons (do not design for): i18n / TWA / APK, comments + notifications,
label scanner. Cut (do not reintroduce): XP / levels / rewards. Engine changes of any
kind. Push/background notification UX.

## 10 · Inputs provided in the project base

- Screenshot set: every screen at 390 px in populated, characteristic states — taken
  **after v3.86** so the empty-tier surfaces are visible; full set in one theme plus
  representative counterparts in the other; includes edge states (empty/new-user,
  kanji fallback plate, wrapped count row, mid-steep Focus).
- Five inspiration PNGs.
- Teaware photos/scans (see §5).
- Repo access for `styles.css`, the icon sprite, and markup patterns — but screenshots
  are the source of truth for rendered states; most UI is JS-generated DOM that source
  reading will under-represent.

## 11 · Process and sequencing

Exploration now (parallel to phase-2 engine work in Code) → direction review with
Niklas → locked bundles per workstream → claude.ai reconciliation against the live
repo at that date → Code implements **after phase-2 has shipped**. R3 implementation
does not interleave with engine batches.
