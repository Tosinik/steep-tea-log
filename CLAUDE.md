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
- **Run `node fixtures/export-gate-test.js` FIRST, before any other suite.** Real data only helps
  if it is the *current* real data. On 2026-07-26 a fresh export was added without the old files
  being deleted; browser downloads land suffixed (`sessions_rows (3).csv`), so every suite kept
  reading the stale unsuffixed paths and kept reporting green — against a **mixed-vintage** set
  (28 sessions beside a 3-row vessels file, 5 of those sessions referencing vessels missing from
  it) that the database never held. The gate asserts count floors, `senchado`'s presence, and
  referential integrity across sessions→vessels/teas and steeps→sessions. **When you re-export,
  replace the whole set** — never the files that look wrong — and move superseded copies to
  `fixtures/archive/`, which nothing reads.
- **`node fixtures/figures-report.js` generates the R3 hand-off §1 snapshot block** — counts, grams,
  litres, method split, type mix, clock buckets, running-low, vendors, origins. Snapshot figures are
  **never hand-copied** (R67): run it, check the output, paste. It calls the shipped engine
  (`gridStats`/`computeStats`/`isRunningLow`/`distinctVendors`) in a `vm` sandbox rather than
  recomputing, so it can't drift from what the app renders, and it **scopes by `user_id`** — the
  export is not user-scoped (one `teas` row belongs to another account), and an unscoped read
  silently reports two vendorless teas where there is one.

**Non-automatable surfaces ship a gate, not just a suite.** Some behaviour has no `vm` reach at all —
the DOM **History API** (`pushState`/`popstate`, the back gesture), the **Screen Wake Lock API**, the
service-worker update flow, real **touch gestures**, actual storage **eviction**. A suite can assert
the *source facts* around them (the fence is present, the single writer is the writer, the handler
never loops) but cannot exercise the behaviour, so a green suite is **not** a pass. **A slice that
ships one of these surfaces ships an entry in `smoke.md` and a phone check by Niklas** — the
non-automatable check does the certifying; record the pass in `smoke.md`. **But *when* that check runs
depends on the surface, and it must NEVER hold a green build unpushed.** A **pre-push** phone check
applies *only where a local server can drive the surface* — static layout, legibility, a rendered
component the dev machine can serve and inspect (or a phone can reach on the LAN). Anything that
**exists only on the served PWA** — the **service-worker lifecycle** (install / update banner), the
**deep-link scroll**, real **install/update behaviour** — is **inherently post-deploy**: **ship on
green (fixtures + suites), push, then run the phone look on the LIVE app, fix-forward** if it fails.
Green build + a check that can only happen after deploy = **push, don't wait** (a private beta's blast
radius is tiny; a bad push is a fast follow-up version, not a rollback). *(Niklas, 2026-08-29, v4.29/
v4.30 — "we can only do the on device checks after they deployed.")* Worked example: **#34's back
gesture (v4.17)** — `session-draft-test.js` pins that the session flow is absent from `HISTORY_VIEWS`
and that `popstate` never calls `goView`, but only a swipe on a real phone proves Back steps back
instead of exiting; the History API rides any served page, so that one *was* locally drivable and was
verified on device before v4.17 pushed — the served-PWA-only cases above are not, and ship first.
Same family as `landing-test.js` asserting the door's *source* because `renderLogin` can't be sandboxed.

## Deploy ritual (do this every deploy)

"Deploy" = push the changed static files to GitHub Pages. There is no CI. Every deploy:

1. **Bump `CACHE_NAME` in `service-worker.js`** (check `service-worker.js` for the
   current value; always bump it). Skipping this leaves users on stale cached files
   after a push — this is the single most important step.
2. **If you added a new module/asset, add it to `FILES_TO_CACHE`** in
   `service-worker.js` (and to the `<script>` list in `index.html`).
2b. **Bump `APP_VERSION` in `steep-version.js`** (moved there v4.25/R158; was steep-core.js) to match the
   new version. It's the user-visible version string — the Settings footer label and the feedback-mailto
   subject — so a stale value silently mislabels every feedback email. Keep it in lockstep with the
   CHANGELOG heading.
2c. **Bump `WHATS_NEW` in `steep-version.js`** (moved there v4.25/R158; was steep-core.js) to a
   one-sentence, human summary of what this version changed. The update banner shows the **incoming**
   version's note by messaging it off the waiting SW (which `importScripts` `steep-version.js`), so this
   is the note the *next* deploy's banner displays — a stale value mislabels it. One line — no list, no
   link. `steep-version.js` is the SINGLE source (page + SW both read it); never duplicate the note into
   `service-worker.js` (`fixtures/update-banner-test.js` guards this).
3. **Update CHANGELOG.md** with a new version entry: a version heading, a `Deploy:`
   line naming exactly which files changed (and the new SW cache version), whether any
   SQL must be run, then bullets.
4. **Sweep the documents that instruct future sessions** (R74, v3.96) — this file's cleanup
   backlog and known-bugs list, `STATE.md`, both roadmaps, `docs/r3/R3-BUILD-PLAN.md`, and any
   hand-off section describing engine state. Strike what this deploy shipped, **noting its
   version, never deleting the entry**; never rewrite CHANGELOG entries or historical
   provenance. A fresh session reads these *before* it reads the code, so a stale figure
   misinforms but a stale backlog item **commands** — v3.95 left six such claims across five
   documents, each an instruction to rebuild work already done.
5. **Keep deploys small and explicit** — one coherent change per version, listing the
   precise files. Don't bundle unrelated edits.

**Split-push: docs push on write; code holds for its gate.** The pause-before-push rhythm exists
because *the planning lane cannot review what it cannot clone* — so a **docs-only** change (ledger,
STATE, ROADMAP, CHANGELOG-only, `smoke.md`, this file) is **pushed the moment it is written**, because
pushing is what makes it cloneable and reviewable; holding it back serves the opposite of the rule's
purpose. A change that **touches an app file** (a real deploy) still **pauses UNPUSHED** for review and
for any `smoke.md` on-device gate the slice requires. **The code commit waits unpushed for Niklas's
review; it is pushed on Niklas's go-ahead — Niklas runs `git push` / `/slowcup-deploy`, or authorizes
Claude to push. Nothing goes live without Niklas's authorization** (Claude cannot self-invoke
`/slowcup-deploy` — it is `disable-model-invocation`, so "push" means Claude runs `git push` once
authorized). When a deploy carries both —
docs *and* code — keep them as **separate commits** (the docs push on write; the code commit waits),
so the reviewable record isn't held hostage to the code gate. One rule, two speeds, same reason.

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
SQL editor, in **version order** — `schema.sql` first, then the `vX_Y-*.sql` files by
ascending *version*, which since v3.98 is **no longer the same as filename order**:
`v3_11-opened-date.sql` sorts as a string between `v3_1` and `v3_2`. It happens to be
order-independent (`add column if not exists` on a table `schema.sql` already created),
but read the version, not the sort. **Read the actual `sql/` files for real column
names/types instead of guessing.** When you add a column/table, commit a new
`sql/vX_Y-*.sql` file, hand the user the exact SQL to run, and note it in the CHANGELOG
`Deploy:` line. **A migration is applied BEFORE the code that needs it is pushed** —
adding a nullable column is backward-compatible with the running build, while pushing
first breaks every write to that table until the SQL lands (PostgREST rejects an unknown
column outright).

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

**Tea passport / Origins / terroir** (`steep-passport.js`): the rejected dot-map (v3.33/34,
"just dots") was **replaced by the shipped drawn-outline atlas** (`viewOrigins` — country
outlines + projected pins, R3/#37, with `steep-origins-map.js` holding the Natural-Earth
outline + projection). **v4.36 (R174) re-dressed `viewOrigins` to the reflection spine as
"Your terroir"** (`.reflect-band` masthead + `terroirCensus`/`terroirGravitate` summaries over
the kept atlas). So Origins is **live and extended, not parked** — the atlas render + terroir
summaries build ON the aggregation layer (`passportCountryFor`, `passportSubFor`, `PASSPORT_GEO`,
`PASSPORT_SUB`, `originsRegionMarks`, `originsCountryRows`, `originTier`), which stays the reusable
core. `fixtures/origins-test.js` pins the map geometry as numbers — read it before touching pins.

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

## Copy voice (house style — R180, v4.39)

User-facing copy is plain and declarative. This is a house rule going forward, set by wave-1 #2.5
(`docs/r5/planning/TEA-PAGE-CALM-COPY-POLISH.md` D3). It binds app strings, and it binds specs and prompts
too. Write new docs this way.

- No em-dash as a connector. Use a period, a colon, a comma with a conjunction, or the app's middot separator.
- No "X, Y, never Z" or "the label, for X, not Y" triple shapes. They are an AI writing tell.
- One idea per sentence. Short and declarative. Say the thing plainly.

The rule is in effect now. The full app-wide em-dash purge across existing strings, and the DESIGN.md
voice-section fold-in, are a later pass. #2.5 rewrote the tea-page strings and set the rule; the rest follows
when the app-wide copy pass runs.

## Cleanup backlog (dead / superseded code — remove when touching the area)

- ~~**`ratioSetupHTML` (steep-sessions.js) is dead as of v3.77.**~~ **DELETED in v3.95** (R3 slice A),
  alongside the four-lane method control that replaced it. It had been dead since WS1 moved the method
  segment into the core-trio card, and doubly stale since v3.91 made `brewMethodFor` three-valued: its
  hard-coded two-button segment would have lit **neither** button for a senchadō session. The trigger
  ("delete it next time steep-sessions.js setup code is edited") fired and was missed twice, at v3.85
  and v3.91 — kept here as the record of why a backlog entry needs a *deploy* to discharge it, not a
  reminder.

- **`KB_FLAVOR_AXES` (steep-knowledge.js) is dead as of R30/v3.93** — an 11-item list declared "a
  separate analytic list" and referenced by nothing (the vocabulary is `KB_FLAVOR_CHIPS`, the capture
  grouping is `KB_FLAVOR_FAMILIES`). **Do not delete yet** — the planning lane may promote its last four
  (`tannin · bitterness · oxidation · complexity` are structural dimensions, not taste notes; the
  two-layer question sits on the brewing-session agenda, ledger §4). Flagged here so it can't quietly
  become a *fourth* vocabulary: don't wire it into `isFlavorVocab`/capture/seeds without that decision.
  If the two-layer question is settled as "no", delete it.

## Known open bugs

Live issues (see STATE.md / ROADMAP for the full backlog):

- ~~**Currency is hard-coded to `$`.**~~ **FIXED in v3.95** (R3 slice A). `DEFAULT_SETTINGS.currency`
  defaults to `'€'` (every vendor on the shelf is German/EU) and **every** cost figure reads
  `currencyFmt()` — the single writer. It was worse than the entry said: **six** sites, not two. Three
  printed the wrong symbol (Tea detail's Cost/gram + Cost/session, plus `big_spender`'s dormant
  `unit:'$'`) and three printed **no symbol at all** (the monthly cost card, Insights' Total-spent and
  Avg-per-gram). The achievement `unit` is now the marker `'cur'`, resolved through `aUnit` →
  `currencySymbol()`, so the symbol is not re-hardcoded a layer down. **Never re-hardcode a currency
  symbol at a render site or in data** — `fixtures/vessel-identity-test.js` §E guards it. The
  user-facing Settings *row* still rides **R3 #07**; only the key and the helper shipped.
- **The session-edit screen's "Tags" is session-level only — and that is now GUARDED, not just noted.**
  It surfaces the session's overall `tags`; **per-steep taste words (`steeps[].tags`) and the per-steep
  `feedback` are not shown or editable there.** ~~The real fix rides the #02b rebuild.~~ **#02b shipped
  in v4.00 and the gap was deliberately left as drawn** — R57 rules it a documented non-destructive gap,
  not a defect to fill in passing. What changed: the surface moved from a modal to its own screen (R58),
  and `sessionEditModal` is now **`viewSessionEdit`**. What did *not* change is the pair of mechanisms
  the non-destructiveness rests on — `openSessionEdit`'s deep copy
  (`state.editingSession = JSON.parse(JSON.stringify(s))`) and `saveSessionEdit`'s whole-object
  writeback (`state.sessions[idx] = e`). **67 field-values ride on them** (30 steeps with real taste
  words, 37 with per-steep feedback, across the current export) and nothing in the UI would surface
  their loss, so **`fixtures/session-edit-test.js` now pins both** — written against the modal, run
  green before the move, unchanged across it. Do not "simplify" either mechanism, and if that suite
  ever needs editing to pass, that is the finding, not the fix.
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
