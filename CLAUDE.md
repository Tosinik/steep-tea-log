# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Steep** — a personal tea-collection and brewing-session logging PWA. **Calm-first**:
ritual over gamification; all achievements/XP/streak surfaces are gated behind toggles
(Show-achievements + Quiet Mode). Vanilla JS (no framework, no bundler, no
`package.json`), backed by Supabase (Postgres + RLS + Auth + Storage), served as a
static site on GitHub Pages: https://tosinik.github.io/steep-tea-log/

Private + small beta.

## Source-of-truth docs — read these first

This repo hands off between sessions via three living documents. Treat them as
authoritative and **keep them current** as you work:

- **STATE.md** — current handoff: what's shipped, the deploy ritual, conventions, open
  bugs, and "continue here" notes. The single best starting point.
- **ROADMAP-v3-next.md** — the tiered roadmap (single source of truth for open work;
  anything finished moves under "Shipped").
- **CHANGELOG.md** — newest-first, one entry per version. Its top section holds the
  **module map**.

When you ship a change, update CHANGELOG.md (new version entry) and reflect it in
STATE.md / ROADMAP as appropriate. Don't let these drift.

## Open issues are the live inbox

**At session start, fetch the repo's open GitHub issues and treat them as the live
work queue alongside the ROADMAP** (the ROADMAP holds the planned sequence; issues hold
incoming bugs/ideas/feedback). The repo is `Tosinik/steep-tea-log` and issues are public
— one fetch, no auth needed:

- With the `gh` CLI: `gh issue list --state open` (also `gh issue view <n>`).
- If `gh` isn't installed (it currently isn't): the public REST API —
  `curl -s "https://api.github.com/repos/Tosinik/steep-tea-log/issues?state=open"`
  (returns PRs too; filter out entries that have a `pull_request` key).

Issues are triaged with three labels: **`bug`** (something broken), **`idea`** (feature/
enhancement), **`feedback`** (beta-tester notes). This queue replaces the old
"beta-feedback bugs (batch)" lists that used to live in STATE.md — put new bugs/ideas
in issues, not in the handoff docs. Writing to issues (create/label/close) needs auth,
so `gh` or a token; unauthenticated is read-only.

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
  notes like "verified render paths + labels in the Node sandbox."
- **Test against real data, not synthetic examples.** Export current rows from Supabase
  as CSV into `fixtures/` (e.g. `teas_rows.csv`; gitignore it if you prefer) and run the
  logic over those. Real data is what catches the actual bugs — Japanese cultivar names,
  quoted commas in descriptions, blank/edge fields — that hand-written cases pass right over.

## Deploy ritual (do this every deploy)

"Deploy" = push the changed static files to GitHub Pages. There is no CI. Every deploy:

1. **Bump `CACHE_NAME` in `service-worker.js`** (currently `steep-tea-log-v45`).
   Skipping this leaves users on stale cached files after a push — this is the single
   most important step.
2. **If you added a new module/asset, add it to `FILES_TO_CACHE`** in
   `service-worker.js` (and to the `<script>` list in `index.html`).
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

Load order (from `index.html`):

```
steep-data → steep-knowledge → steep-core → steep-settings → steep-dashboard →
steep-teas → steep-shopping → steep-passport → steep-social → steep-sessions → steep-boot
```

- **steep-data** — Supabase client, `loadKey`/`saveKey`, snake_case↔camelCase mappers,
  per-row CRUD, the offline write queue. Exposed as `window.SteepDB`.
- **steep-knowledge** — curated tea knowledge base; `kbResolve(text)` returns
  `{style,type,leafForm,tempC,ratio,first,country}` by longest-alias match. Feeds
  `inferLeafForm` and the tea-form prefill. No deps; loads before `steep-core`.
- **steep-core** — the global `state`, `render()` view-router, header/nav, theme,
  `init`/`refresh`, achievements, plus the brew-guide parser & leaf-form logic.
- Feature modules each own their view + logic (settings, dashboard, teas, shopping,
  passport, social, sessions).
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
SQL editor, in order (`schema.sql` → `v2_1-migration` → `v2_2-photos-storage` →
`v3_0-social` → `v3_1-quick-log` → `v3_2-session-photos` → `v3_3-wishlist` →
`v3_4-brew-advice` → `v3_5-purchase-date` → `v3_6-leaf-form` → `v3_7-mood`). **Read the
actual `sql/` files for real column names/types instead of guessing.** When you add a
column/table, commit a new `sql/vX_Y-*.sql` file, hand the user the exact SQL to run,
and note it in the CHANGELOG `Deploy:` line.

**Brew-guide / leaf-form logic** (in `steep-core.js`): a tea's free-text `brewGuide` is
parsed by `parseBrewGuide`/`bg_extractTimes` into `{tempC, rinseSeconds, times}` via
order-sensitive regex (temp/grams/dates are stripped *before* time-token extraction so
they aren't misread as steeps). With no parseable schedule, `generateFormTimes`
synthesizes one from `LEAF_PROFILES` (six leaf-morphology families) via `inferLeafForm`.
`computeBrewAdvice` nudges that baseline by past-session `feedback`. This is
regex-heavy — validate changes with a Node script (see above). `LEAF_PROFILES` is the
tunable knob for the curves. `inferLeafForm` consults `kbResolve` (steep-knowledge.js)
on name+cultivar+origin *before* its name heuristics, mapping the KB's leafForm onto a
`LEAF_PROFILES` family via `KB_LEAFFORM_TO_PROFILE` (v3.38 — fixed the old Japanese-
cultivar/silver-bud misses). To broaden coverage, add aliases to the KB tables, not to
`inferLeafForm`.

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
- **No browser `confirm()` / `prompt()`** — use inline UI. (A couple of legacy
  `alert()`s remain in sessions; on the backlog, don't add more.)
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

## Known open bugs

Live issues (see STATE.md / ROADMAP for the full backlog):

- ~~**Double stock decrement.**~~ **Fixed v3.35.** Cause was a re-entrant double-fire of
  `commitSession` (not the offline queue, which replays idempotent absolute-value
  upserts). Fixed with a shared `_sessionSaving` guard on `commitSession` +
  `saveSessionEdit`. Note the deeper smell remains: stock is an accumulated
  read-modify-write on `amountGrams` rather than derived (`purchased − Σ gramsUsed`) — a
  future data-model change would make it idempotent by construction (see ROADMAP).
- **In-session "turn off" link gives weird feedback** — investigate `d_setBrewMode('off')`
  mid-session.
- **Legacy `alert()`s in sessions** — a couple remain; use inline UI, don't add more.
