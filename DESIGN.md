# SlowCup — design guidelines (DESIGN.md)

For any design tool or session working on SlowCup (and for `/design-sync`). The token source
of truth is `styles.css` `:root` + `html[data-theme="dark"]`; this file carries what a token
scan can't: the principles, the voice, and the constraints. App state as of v3.62.

## What SlowCup is
A personal tea-logging PWA — a quiet companion for a daily brewing ritual (sessions, steeps,
teas, brew guidance, light social). Currently private beta, one primary user + testers.
Live at tosinik.github.io/steep-tea-log (auth-gated; design work happens from the repo +
screenshots, not the live app).

## The one rule that governs everything: calm-first
The app serves the ritual; it never gamifies it, urges it, or guilt-trips about it.
Concretely, and non-negotiably:
- **No pressure mechanics.** No streak-shaming, no "you haven't logged", no XP/levels/reward
  shops (explicitly cut 2026-07-08 as off-brand), no badges pushed at the user, no red dots.
- **Opt-in over imposed.** New capabilities default OFF or arrive as quiet affordances
  (a ghost "· ml?" link, not a banner). Nothing modal unless destructive.
- **Suggestions, never imperatives.** Copy asks ("How about the Dancong tonight?") or
  observes ("Heavier pour than the baseline — times shortened ≈19%."). No exclamation marks.
  The app may go deliberately quiet (after the day's sessions are logged, the greeting card
  rests rather than nudging another brew).
- **Honesty in guidance.** Generated/estimated values are always labeled as such ("Suggested
  from the leaf type", "rough estimate, sharpens as you log more"). Never present a guess as
  the user's own data.
- **Destructive actions keep friction** (inline two-step confirm with counts), everything
  else stays out of the way.

## Voice
Warm, a little dry, unhurried. Lowercase-energy even when capitalized. Tea is the subject;
the user is never scored. German-adjacent English (the audience is DE-based, app is EN).
Examples in-product: "The kettle's patient whenever you are." · "Tomorrow morning has the
Dancong's name on it." · "Everything checks out."

## Look & feel
Warm paper and glazed ceramics, not a dashboard. Porcelain background, jade primary, amber
accents; generous whitespace; soft 12–14px card radii; hairline borders over shadows (the
only glow is a faint amber one in dark mode).

**Type (three voices, all via Google Fonts):**
- **Fraunces** (serif, opsz) — display: h1–h3, the greeting line, tea names as headings.
- **Inter** — body and UI text.
- **IBM Plex Mono** (`--font-mono`) — the "ledger" voice: eyebrows/labels (11px, uppercase,
  `.06em` tracking), numbers, the steep timer, schedules. Replaced a pixel font (v3.53); the
  brand logo is still a 16×16 pixel-art teapot (`steepLogoSVG`) — that pixel heritage stays
  in the logo only, never in type.

**Core tokens (light | dark):** porcelain `#F6F2E9|#15140F` · ink `#2B2320|#EDE6D6` ·
ink-soft `#5C5148|#A79C87` · jade `#3F5E42|#6F9A66` · jade-pale `#E4EAE0|#233024` ·
jade-deep `#2A4130|#8FBE83` · amber `#C17A3E|#E3A15C` · amber-pale `#F1DFC7|#3A2C1A` ·
clay `#8B5E4A|#C99872` · line `#D8CFB9|#332F24` · surface/white `#FFFEFB|#1C1A14` ·
red (errors/destructive only) `#B5504A|#E08C82`. Both themes are first-class; every design
must be checked in both.

**Component vocabulary (reuse before inventing):** cards on porcelain; jade-pale "insight"
cards (brew guide, suggested brew, greeting); segmented controls (`seg`) for small mode
choices; ghost text-buttons for quiet affordances; pill chips (steep times, tags; amber =
current); the eyebrow label pattern above every field; toasts bottom-anchored, non-blocking;
inline two-step confirm replacing all browser popups; sparklines/heatmap for tiny data viz.

## Layout & platform
Mobile-first PWA (~380–430px is the real viewport; used one-handed with wet hands). Single
column, sticky header (logo + icon row + tab nav + one primary "Log session" CTA). Desktop
is the same column, centered, max-width — no multi-column layouts exist. Touch targets
≥40px. No horizontal scrolling ever.

## Hard technical constraints (design within these)
- Vanilla JS + plain CSS, **no build step, no framework** — HTML/CSS output integrates
  directly; framework-flavored exports don't.
- Single-page, full-render-on-state-change architecture; styles live in one `styles.css`
  with CSS custom properties. New components must be expressible there.
- System webfonts limited to the three families above (weights already loaded: Fraunces
  400–600, Inter 400–700, Plex Mono 400–700).
- PWA served from GitHub Pages; no server-side anything. Images are user photos (Supabase
  storage) — design must tolerate their absence.
- Auth-gated app: design references come from screenshots + this repo, not a live URL.

## Current surfaces (screens to know)
Home (greeting card, running low, recent, totals, clock — user-reorderable) · Teas (library
grouped by type, tea detail with brew card + freshness cue + stock forecast, vessels) ·
Sessions (setup → steeping with timer + chips → summary; history w/ heatmap) · Insights
(recap, "SlowCup Wrapped", type breakdown) · Settings (appearance, brew guidance, data:
export/import/error log/data health/feedback) · light social feed · shopping list ·
passport (parked).

## What a design session may NOT change casually
The calm-first rules above; the three-font system; the pixel teapot logo; the porcelain/jade
identity; the single-column mobile-first layout; browser-popup-free interaction (no native
alerts/confirms in any flow). Everything else — spacing, hierarchy, individual screens,
empty states, iconography — is fair game to explore.
