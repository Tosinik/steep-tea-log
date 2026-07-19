# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**SlowCup** (user-facing brand since v3.59; repo, files, and internal names keep "Steep") —
a personal tea-collection and brewing-session logging PWA. **Calm-first**: ritual over
gamification. Achievements/XP are dormant app-wide (`ACHIEVEMENTS_ENABLED = false` since
v3.72 — the old Show-achievements/Quiet-Mode toggles are hidden while it's off); the one
calendar surface that stayed, the Sessions "Brewing days" heatmap, is deliberately neutral
(streak framing removed v3.83) and deliberately ungated. Vanilla JS (no framework, no bundler, no
`package.json`), backed by Supabase (Postgres + RLS + Auth + Storage), served as a
static site on GitHub Pages at **https://slowcup.app** (custom domain since 2026-07-13;
the old https://tosinik.github.io/steep-tea-log/ 301s there — setup facts in STATE.md
"Domain & auth origins")

Private + small beta.

## Source-of-truth docs — read these first

This repo hands off between sessions via three living documents. Treat them as
authoritative and **keep them current** as you work:

- **STATE.md** — current handoff: what's shipped, the deploy ritual, conventions, open
  bugs, and "continue here" notes. The single best starting point.
- **ROADMAP-v4.md** — the active forward roadmap ("ready for strangers", signed off 2026-07-10):
  single source of truth for open work, incl. the v3.67→v3.70 cleanup tail (Pillar F).
- **ROADMAP-v3-next.md** — v3-series roadmap, now superseded by v4 for forward work; retained for
  the Shipped log, frozen/parked specs, and the slowcup.app launch checklist.
- **CHANGELOG.md** — newest-first, one entry per version. Its top section holds the
  **module map**.
- **DESIGN.md** — design guidelines (calm-first principles, voice, look & feel, tokens,
  layout, hard constraints). Read before any UI/copy/visual work; the token source of truth
  stays `styles.css` `:root` + `html[data-theme="dark"]`.

When you ship a change, update CHANGELOG.md (new version entry) and reflect it in
STATE.md / ROADMAP as appropriate. Don't let these drift.

## Open issues are the live inbox

**At session start, fetch the repo's open GitHub issues and treat them as the live
work queue alongside the ROADMAP** (the ROADMAP holds the planned sequence; issues hold
incoming bugs/ideas/feedback). The repo is `Tosinik/steep-tea-log` and issues are public
— one fetch, no auth needed:

- With the `gh` CLI — **installed and authenticated as `Tosinik`** (since v3.81):
  `gh issue list --state open` (also `gh issue view <n>`), and writes
  (create/label/close/comment) work directly.
- Fallback if `gh` ever breaks: the public REST API —
  `curl -s "https://api.github.com/repos/Tosinik/steep-tea-log/issues?state=open"`
  (returns PRs too; filter out entries that have a `pull_request` key); reads are
  unauthenticated, writes then need a token / the OS git credential.

Issues are triaged with three labels: **`bug`** (something broken), **`idea`** (feature/
enhancement), **`feedback`** (beta-tester notes). This queue replaces the old
"beta-feedback bugs (batch)" lists that used to live in STATE.md — put new bugs/ideas
in issues, not in the handoff docs.

## Running & validating (no build, no test suite)

There is no build step, package manager, linter, or test runner. To run locally, serve
the directory over HTTP (e.g. `npx serve .`) and open `index.html` — it must be HTTP,
not a `file://` URL, for the service worker and Supabase auth redirect to work.

**Before any deploy, validate logic without a browser:**
- Run `node --check <file>.js` on every JS file you touched (catches syntax errors —
  there's no compiler to lean on).
- For non-trivial logic (parsers, schedule/forecast math, matchers), write a small
  throwaway Node test script that requires/exercises the pure function with a few cases
  and prints results. This is how the tricky areas (e.g. `parseBrewGuide`,
  leaf-form curves, passport matching) have historically been checked — see CHANGELOG
  notes like "verified render paths + labels in the Node sandbox." These `fixtures/*-test.js`
  scripts load the non-modular source in a `vm` context with stubbed browser globals — copy
  an existing one (e.g. `fixtures/brew-roundtrip-test.js`) for the harness boilerplate.
- **Permanent, data-free invariant tests are committed** (via a `.gitignore` exception; the
  rest of `fixtures/` — CSV exports, one-off scripts — stays local). `fixtures/brew-roundtrip-test.js`
  is the first: it asserts `schedule → scheduleToGuideText → parseBrewGuide` reproduces identical
  times for every LEAF_PROFILES/KB schedule. **Run `node fixtures/brew-roundtrip-test.js` after any
  change to the brew-guide emitter/parser** (`scheduleToGuideText`, `parseBrewGuide`, `bg_extractTimes`,
  `fmtSecShort`) — it must stay green.
- **Test against real data, not synthetic examples.** Export current rows from Supabase
  as CSV into `fixtures/` (e.g. `teas_rows.csv`; gitignore it if you prefer) and run the
  logic over those. Real data is what catches the actual bugs — Japanese cultivar names,
  quoted commas in descriptions, blank/edge fields — that hand-written cases pass right over.

## Deploy ritual (do this every deploy)

"Deploy" = push the changed static files to GitHub Pages. There is no CI. Every deploy:

1. **Bump `CACHE_NAME` in `service-worker.js`** (check `service-worker.js` for the
   current value; always bump it). Skipping this leaves users on stale cached files
   after a push — this is the single most important step.
2. **If you added a new module/asset, add it to `FILES_TO_CACHE`** in
   `service-worker.js` (and to the `<script>` list in `index.html`).
2b. **Bump `APP_VERSION` in `steep-core.js`** (v3.61+) to match the new version. It's the
   user-visible version string — the Settings footer label and the feedback-mailto subject —
   so a stale value silently mislabels every feedback email. Keep it in lockstep with the
   CHANGELOG heading.
2c. **Bump `WHATS_NEW` in `steep-core.js`** (v3.69+) to a one-sentence, human summary of what
   this version changed. It renders as a second quiet line on the update banner (`showUpdateBanner`,
   steep-boot.js), so a stale value mislabels what users just received. One line — no list, no link.
3. **Update CHANGELOG.md** with a new version entry: a version heading, a `Deploy:`
   line naming exactly which files changed (and the new SW cache version), whether any
   SQL must be run, then bullets.
4. **Keep deploys small and explicit** — one coherent change per version, listing the
   precise files. Don't bundle unrelated edits.

The service worker deliberately does **not** auto-`skipWaiting()`. On a new SW install
`steep-boot.js` shows a "new version — Refresh" banner and only swaps in the new worker
(and reloads) when the user taps it, so an in-progress brewing session is never
interrupted. (Dev should still hard-reload to verify.)

## Architecture

**Plain scripts, one global scope — not ES modules.** `index.html` loads the Supabase
CDN client, then `supabase-config.js`, then each `steep-*.js` in order via `<script>`
tags. All functions and the single global `state` object live in shared global scope,
so any file calls any other file's functions with no imports. Function declarations
hoist and cross-module calls resolve at runtime, so **feature-module order is flexible**
— but two constraints are firm: `steep-data.js` and `steep-core.js` come first, and
`steep-boot.js` loads **last** (it calls `SteepDB.boot(init)`, so `init` must exist).

The authoritative load order is the `<script>` tag sequence in `index.html` — read it
there rather than trusting a copy here (the only firm constraints are the two above:
data + core first, boot last). The modules and what each owns:

- **steep-data** — Supabase client, `loadKey`/`saveKey`, snake_case↔camelCase mappers,
  per-row CRUD, the offline write queue. Exposed as `window.SteepDB`.
- **steep-knowledge** — curated tea knowledge base; `kbResolve(text)` returns
  `{style,type,leafForm,tempC,ratio,first,country}` by longest-alias match. Feeds
  `inferLeafForm` and the tea-form prefill. No deps; loads before `steep-core`.
- **steep-core** — the global `state`, `render()` view-router, header/nav, theme,
  `init`/`refresh`, achievements, plus the brew-guide parser & leaf-form logic.
- Feature modules each own their view + logic (settings, dashboard, teas, shopping,
  passport, social, sessions).
- **steep-dashboard** / **steep-insights** — the two dashboard surfaces (Home / Insights
  tabs), split v3.44. Since WS2 (v3.74) Home owns greeting/running-low/favourites/the week
  number; Insights owns the reflective room (hero/cadence/type mix/steep shape/notes/Wrapped)
  plus the relocated recent/totals/clock/cost cards. (Persona was removed v3.52; the recap
  grid retired v3.65 — the raw six-stat grid lives on Insights with the v3.82 period lens.)
  Both render through the **shared editable-card registry** in steep-dashboard: `DASH_SURFACE`
  assigns each card id a *default* surface ('home'|'insights'), and `renderDashboard(cards, surface)`
  filters by **effective** surface per tab (reorder/hide work per-tab). Since v3.47 edit mode can
  also **move a card between tabs**: `dashMoveToSurface` writes a per-user override into
  `dashLayout.surface` (id→surface) that `dashSurface(id)` layers over `DASH_SURFACE`; because a
  moved card must render on either tab, **both** views build the full card map via the shared
  `dashCards()` (= `dashCardsHome(s)` + `dashCardsInsights(s)`), and `renderDashboard` picks each
  tab's cards by effective surface. Adding a card = add its id to `DASH_DEFAULT_ORDER`, `DASH_LABELS`,
  `DASH_SURFACE`, and build its HTML in the owning surface's `dashCards*` builder.
- **steep-boot** — `SteepDB.boot(init)` + service-worker registration/update banner.

The v3 split of the old single `app.js` into these modules was purely mechanical — no
behavior changed. It has since drifted across a dozen versions, so don't rely on
"concatenates back to `app.js`": new code belongs in whichever module owns that view.

**Render model:** one global `state` object + a global `render()` that does a full
`innerHTML` re-render of `#app` based on `state.view`. No virtual DOM — mutate `state`,
call `render()`. Interactivity is almost all inline `onclick="fnName(...)"` baked into
template-literal HTML; `bindDynamic()` re-wires the few handlers that can't be inline
(file inputs, the tag-suggest field).

**Data layer (`window.SteepDB`):**
- Auth is email magic-link or Google OAuth. `SteepDB.boot(startApp)` subscribes to
  `onAuthStateChange` and starts the app once a session exists (else renders login /
  migration screen).
- **Per-row writes are the default** for every normal mutation (`putTea`, `removeTea`,
  `putVessel`, `removeVessel`, `putSession`, `removeSession`, `addTag`, `putWishItem`,
  `removeWishItem`). `loadKey`/`saveKey` keep the old localStorage-era blob signatures
  only for genuine bulk ops (import, migration) where replace-all is the intent.
- **Offline write queue (Option B):** writes are local-first — cache optimistically;
  on a *network* failure, queue the op (FIFO, localStorage `tealog_writeQueue`) and
  replay on reconnect/boot. Idempotent (upsert/delete by id). Non-network errors
  (auth/RLS/validation) still throw and surface. Social actions + bulk writes stay
  online-only. Inline `data:` images are stripped before queuing (can't be replayed
  offline; must never reach Postgres) — user re-adds them online.
- **`loadKey('sessions'/'steeps')` is scoped to `user_id`** (v3.21 hotfix). A social
  RLS policy lets followers read others' *shared* sessions, so an unfiltered load leaks
  their data into personal stats. The feed uses `getFeed()` separately. Preserve this.
- DB rows are snake_case, JS objects camelCase; each entity has a `*FromDb`/`*ToDb`
  pair. Adding a persisted field means updating **both** mappers **and** every path
  that touches that table (bulk `loadKey`/`saveKey` and the per-row `put*`).

**Schema management:** migrations live in **`sql/`**, applied by hand in the Supabase
SQL editor, in filename order (`schema.sql` first, then the `vX_Y-*.sql` files in
ascending version order — see the `sql/` folder for the current set). **Read the
actual `sql/` files for real column names/types instead of guessing.** When you add a
column/table, commit a new `sql/vX_Y-*.sql` file, hand the user the exact SQL to run,
and note it in the CHANGELOG `Deploy:` line.

**Brew-guide / leaf-form logic** (in `steep-core.js`): a tea's free-text `brewGuide` is
parsed by `parseBrewGuide`/`bg_extractTimes` into `{tempC, rinseSeconds, times}` via
order-sensitive regex (temp/grams/dates are stripped *before* time-token extraction so
they aren't misread as steeps). With no parseable schedule, `generateFormTimes`
synthesizes one from `LEAF_PROFILES` (the leaf-morphology families) via `inferLeafForm`.
`computeBrewAdvice` nudges that baseline by past-session `feedback`. This is
regex-heavy — validate changes with a Node script (see above). `LEAF_PROFILES` is the
tunable knob for the curves. `inferLeafForm` consults `kbResolve` (steep-knowledge.js)
on name+cultivar+origin *before* its name heuristics, mapping the KB's leafForm onto a
`LEAF_PROFILES` family via `KB_LEAFFORM_TO_PROFILE` (v3.38 — fixed the old Japanese-
cultivar/silver-bud misses). To broaden coverage, add aliases to the KB tables, not to
`inferLeafForm`. The **`knowledge/` folder** (`knowledge/brew-guides.md`) is a growing,
vendor-sourced reference layer that grounds the KB baselines — it is NOT loaded by the app
(reference only), but consult and extend it when tuning brew defaults (`KB_STYLES`) or the
`LEAF_PROFILES` curves.

**Tea passport** (`steep-passport.js`): **PARKED.** The shipped dot-map (v3.33/34) was
rejected as unrecognisable ("just dots"). Do not extend the dot rendering — a redesign
toward drawn country outlines/borders is planned. The parsing/aggregation layer
(`passportCountryFor`, `passportSubFor`, `PASSPORT_GEO`, `PASSPORT_SUB`) is reusable;
only the rendering gets replaced. See ROADMAP/STATE.

## Calm-first principles & conventions

- **No unsolicited nudges.** Gamification (achievements, XP, streak celebration) is
  opt-in and gated behind the Show-achievements + Quiet Mode toggles. New "engagement"
  surfaces should default off or live behind a toggle.
- **Features are opt-in.** e.g. brew-guide autofill, brew advice, and the mood check-in
  each have a settings switch to disable them.
- **No browser `confirm()` / `prompt()` / `alert()`** — use inline UI. Destructive actions use
  the shared **`armConfirm(btn, message, onYes)`** (steep-core.js): a two-step "message · Yes / Cancel"
  swapped in place of the button via DOM (no re-render, so unsaved fields survive; any later render
  clears it). Notices use **`showToast(msg)`**. (The sweep is COMPLETE — zero browser popups
  remain anywhere: v3.50 swept sessions/teas, v3.58 moved the import replace-all onto an inline
  confirm row and photo-migrate onto `armConfirm`, v3.66 folded the last `socialErr` alert into
  an inline notice. Don't add new ones.)
- **Never strand existing user data behind a settings toggle.** A switch that hides a
  feature must not hide or orphan data the user already entered — data stays readable/
  editable regardless of the toggle state.
- **Settings are synced; theme is device-local** (`tealog_theme` in localStorage, not
  synced). New per-device preferences follow the theme pattern; everything else syncs
  via settings.
- **Generated/pixel art is a placeholder** — human-made art is required for any public
  release. Keep art as single swappable assets (e.g. `steepLogoSVG`).
- **Offline is read-only + queued writes**; photos attached to offline sessions are
  deferred (re-added when back online).
- **Batch consequential decisions for Niklas — don't quietly make product calls.** For
  a consequential product/design choice (a new surface, a data-model change, anything
  that shapes the UX), stop and ask rather than assuming; batch open questions together
  where you can instead of asking one at a time.

## Code style to match

- Semicolon-terminated, minimal-whitespace JS; small single-purpose functions;
  template-literal HTML with inline `onclick=` handlers, not `addEventListener`.
- Comments are sparse and explain **why** (often the past bug a line guards against),
  not what — match that density; don't add narrative comments.
- Theming is CSS custom properties in `styles.css` under `:root`, overridden by
  `html[data-theme="dark"]` (and `html[data-mono="clean"]` for the non-pixel font). Add
  new UI colors as variables in both blocks — never hardcode.

## Cleanup backlog (dead / superseded code — remove when touching the area)

- **`ratioSetupHTML` (steep-sessions.js) is dead as of v3.77.** WS1 moved the method segment into the
  session-setup core-trio card (`SESSION_METHODS` + `brewMethodFor`) and the optional water(ml) field
  into the "More details" fold, so nothing calls `ratioSetupHTML` any more. Left in place to keep the
  WS1 diff focused; delete it next time steep-sessions.js setup code is edited.
  Now also stale in a second way: as of v3.91 `brewMethodFor` is three-valued
  (`gongfu | senchado | western`), while `ratioSetupHTML`'s hard-coded two-button segment is fed by
  neither `SESSION_METHODS` nor the new value — so if revived, its `method===m` check would light
  **neither** button for a senchadō session. Delete rather than patch.

## Known open bugs

Live issues (see STATE.md / ROADMAP for the full backlog):

- **Currency is hard-coded to `$`.** `steep-teas.js:722–723` print `'$'` for Cost/gram and
  Cost/session. `cost_total` stores a bare number and there is no currency field anywhere in the
  app. Every vendor in the library is German (MainTee Würzburg ×5, Tee Kontor Kiel ×3, Si Fang Guan
  ×3, Bohea Berlin ×2, Diez, Teerausch…), so the figure shown is wrong for every tea. Not urgent, but
  it is a *wrong number shown to the user*, not a missing feature. The intended home for the fix is a
  currency preference in **R3 #07 Settings**, which is unbuilt — flagged to Design as an input rather
  than patched separately.
- ~~**Double stock decrement.**~~ **Fixed v3.35.** Cause was a re-entrant double-fire of
  `commitSession` (not the offline queue, which replays idempotent absolute-value
  upserts). Fixed with a shared `_sessionSaving` guard on `commitSession` +
  `saveSessionEdit`. Note the deeper smell remains: stock is an accumulated
  read-modify-write on `amountGrams` rather than derived (`purchased − Σ gramsUsed`) — a
  future data-model change would make it idempotent by construction (see ROADMAP).
- ~~**In-session "turn off" link gives weird feedback.**~~ **Fixed v3.68** (issue #1) — the
  in-session link is now a reversible **"hide"** (`d_hideStrip`/`d_showStrip`); the old
  `d_setBrewMode('off')` reset `timeShift` and never cleared the card.
- ~~**Legacy `alert()`s in sessions.**~~ **Swept v3.50** — steep-sessions/steep-teas now use
  `armConfirm` (inline two-step) + `showToast`. Remaining `alert()`/`confirm()` live only in
  steep-settings (bulk import/photo-migrate) and steep-core's offline-sync error.
