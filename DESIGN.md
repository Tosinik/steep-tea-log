# SlowCup — design guidelines (DESIGN.md)

For any design tool or session working on SlowCup (and for `/design-sync`). The token source
of truth is `styles.css` `:root` + `html[data-theme="dark"]`; this file carries what a token
scan can't: the principles, the voice, and the constraints. App state as of v3.65 (design round 1
complete: v3.63 WS3 language · v3.64 WS1 Wrapped · WS4 landing · v3.65 WS2 Insights).

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
- **Shippori Mincho** (`--font-display`, serif) — display: h1–h3, the greeting line, tea names as
  headings, the wordmark. Weight 700 for headings (v3.63 replaced Fraunces; its Latin glyphs carry
  the calligraphic stroke logic and handle long pinyin/romaji/German tea names).
- **Inter** — body and UI text.
- **IBM Plex Mono** (`--font-mono`) — the "ledger" voice: eyebrows/labels (11px, uppercase,
  `.06em` tracking), numbers, the steep timer, schedules. Replaced a pixel font (v3.53); the
  brand logo is still a 16×16 pixel-art teapot (`steepLogoSVG`) — that pixel heritage stays
  in the logo only, never in type.

**Icons & accents (v3.63 WS3; placements extended by WS1/WS2/WS4):** header/action icons are a **hairline
stroke set** (24×24, `fill:none; stroke:currentColor`, 1.7 light / 1.9 dark) from the `<svg><defs>` sprite
in `index.html`, emitted via `icon(id,px,cls)` in steep-core. **Emoji are banned in UI — and the sweep is
COMPLETE**: WS3 replaced the header set, the v3.76 focus rebuild retired the last 🧘, and v3.78 cleared the
remaining thumb/toast sites. `steep-*.js` is emoji-free (only the ✕ / ✓ / ★ / — glyph vocabulary remains);
don't add new emoji anywhere. **Accent vocabulary — one home each, placement rules as shipped** (never button trim, card
borders, spinners, or general decoration):
- **tea leaf** (`fav-leaf`, jade) — the favourite mark (tea cards/rows, running-low, favourites filter,
  shopping) and the Insights "most reached-for" note.
- **hanko seal** (`hanko`, `var(--red)`) — the single standout / highest mark only: the Wrapped "to keep"
  card and the Insights "highest note".
- **ensō ring** (`enso`, `--enso`) — the steep-timer / focus ring (fills as the steep completes) and, faint
  and oversized, a **hero backdrop** on the Wrapped cover card and the landing hero.
- **seigaiha** (`seigaiha`) — reserved for **empty states, the Wrapped closing card, and the landing CTA
  wash** only; kept faint (≤7% light / ≤14% dark).

**Core tokens (light | dark):** porcelain `#F6F2E9|#15140F` · ink `#2B2320|#EDE6D6` ·
ink-soft `#5C5148|#A79C87` · jade `#3F5E42|#6F9A66` · jade-pale `#E4EAE0|#233024` ·
jade-deep `#2A4130|#8FBE83` · amber `#C17A3E|#E3A15C` · amber-pale `#F1DFC7|#3A2C1A` ·
clay `#8B5E4A|#C99872` · line `#D8CFB9|#332F24` · surface/white `#FFFEFB|#1C1A14` ·
red (errors/destructive only) `#B5504A|#E08C82`. Both themes are first-class; every design
must be checked in both.

**Low-stock tone rule (recorded 2026-07-13):** one predicate (`stockTier`/`isRunningLow`),
two deliberate tones — **clay on ritual surfaces** (shelf status line, Home "Running low"
card) and **red on analytics/ledger surfaces** (Cost-overview rows, tea-detail "On hand").
Not drift; keep new surfaces on the side they belong to.

**Component vocabulary (reuse before inventing):** cards on porcelain; jade-pale "insight"
cards (brew guide, suggested brew, greeting); segmented controls (`seg`) for small mode
choices; ghost text-buttons for quiet affordances; pill chips (steep times, tags; amber =
current); the eyebrow label pattern above every field; toasts bottom-anchored, non-blocking;
inline two-step confirm replacing all browser popups; sparklines/heatmap for tiny data viz.

**Accepted nuances (recorded at the 2026-07-13 audit — deliberate, don't "fix" without a decision):**
- **Native select pickers** — the WS1 core-trio selects are styled (`appearance:none`, Shippori for
  the tea) but open the OS-native picker sheet. Accepted tradeoff, not a gap.
- **UI-chrome dates** — the greeting eyebrow's weekday is forced English (WS2: chrome never renders
  a locale-mixed "Freitag evening"); the Spending view's month name stays device-locale
  (`toLocaleDateString`, steep-dashboard.js). Both directions accepted as-is.
- **Oolong roast level is untracked** — there is no roast field, so the shelf status line can't
  tell a heavy-roast oolong (which keeps like a white) from a jade one; both read "plenty"
  (the WS5 oolong-reads-"plenty" call). A roast field is a data-model decision, not a copy fix.
- **Stock tier is cups, not grams** (#27, recorded v3.86) — cups left = on-hand ÷ this tea's own
  average logged dose, so 19g at a ~3g dose honestly reads "plenty" (6.3 cups) while 23g at a 5g
  dose reads "a few cups left" (4.6). Deliberate. The explaining line ("≈ 4.6 cups at your usual
  5g") lives on tea detail — the ledger surface — never on the shelf.

## Layout & platform
Mobile-first PWA (~380–430px is the real viewport; used one-handed with wet hands). Single
column inside the WS6 shell (v3.73): a compact header (wordmark + avatar → hub sheet for
friends/shopping/passport/settings) and a **bottom tab bar** (Home · Teas · [Log raised] ·
Sessions · Insights) that recedes to a swipe-up handle while a steep runs. Desktop
is the same column, centered, max-width — no multi-column layouts exist. Touch targets
≥40px. No horizontal scrolling ever.

## Hard technical constraints (design within these)
- Vanilla JS + plain CSS, **no build step, no framework** — HTML/CSS output integrates
  directly; framework-flavored exports don't.
- Single-page, full-render-on-state-change architecture; styles live in one `styles.css`
  with CSS custom properties. New components must be expressible there.
- System webfonts limited to the three families above (weights loaded in `index.html`: Shippori
  Mincho 500/600/700/800, Inter 400–700, IBM Plex Mono 400–700). Fraunces is retired (v3.63).
- PWA served from GitHub Pages; no server-side anything. Images are user photos (Supabase
  storage) — design must tolerate their absence.
- Auth-gated app: design references come from screenshots + this repo, not a live URL.

## Current surfaces (screens to know)
Home (greeting card, running low, recent, totals, clock — user-reorderable) · Teas (library
grouped by type, tea detail with brew card + freshness cue + stock forecast, vessels) ·
Sessions (setup → steeping with timer + chips → summary; history w/ heatmap) · **Insights — the
reflective room** (WS2: one jade-pale hero observation, then hairline-separated readings in a tiny
shared data-viz family — sparkline / type-bar / time-of-day / steep-shape — plus two quiet leaf+hanko
notes and a deep-jade Wrapped teaser; **observation register, not KPIs** — no arrows/%/targets, guarded
by `fixtures/insights-room-test.js`) · **SlowCup Wrapped** (WS1: a horizontal scroll-snap sequence of
full-width seasonal story cards, reached from the Insights teaser) · Settings (appearance, brew guidance,
data: export/import/error log/data health/feedback) · light social feed · shopping list · passport
(parked). **Off-app:** `landing.html` — the static `slowcup.app` marketing page (WS4; own tokens, not part
of the PWA).

## What a design session may NOT change casually
The calm-first rules above; the three-font system; the pixel teapot logo; the porcelain/jade
identity; the single-column mobile-first layout; browser-popup-free interaction (no native
alerts/confirms in any flow). Everything else — spacing, hierarchy, individual screens,
empty states, iconography — is fair game to explore.
