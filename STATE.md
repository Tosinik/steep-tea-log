# SlowCup — STATE (handoff)

> **App renamed Steep → SlowCup (user-facing brand) in v3.59.** Internal names — `steep-*.js`
> files, functions, `tealog_*` keys, the `steep-tea-log` repo/URL/cache prefix — keep the old name
> (the repo/URL rename is deferred to the slowcup.app domain migration). "steep/steeps" tea
> terminology stays. Below, "Steep" in historical notes = the old brand; don't rewrite them.


Seed a fresh chat with: this file + ROADMAP-v3-next.md + CHANGELOG.md + the current
source files. That keeps each session cheap (a long thread re-reads everything every turn).

## What it is
Personal tea-logging PWA, **calm-first** (ritual over gamification; achievements/XP gated behind
toggles). Private + small beta. Hosted on GitHub Pages: https://tosinik.github.io/steep-tea-log/

## Stack
Vanilla JS (no framework) · Supabase (Postgres + RLS + Auth + Storage) · service-worker PWA · GitHub Pages.
Supabase project: https://duuosbgjozjjfyfusjzf.supabase.co (anon key in project knowledge).

## Modules (index.html load order; boot last)
steep-data → steep-knowledge → steep-core → steep-settings → steep-dashboard → steep-teas →
steep-shopping → steep-passport → steep-social → steep-sessions → steep-boot.
- **steep-data**: Supabase client, loadKey/saveKey, mappers, per-row CRUD, offline write queue.
- **steep-knowledge**: curated tea KB; `kbResolve(text)` → {style,type,leafForm,tempC,ratio,first,
  country}. Feeds inferLeafForm + tea-form prefill. Loads before core (no deps of its own).
- **steep-core**: state, render() view-router, header/nav, theme, init/refresh, achievements.
- Feature modules own their view + logic. Plain scripts sharing global scope (functions hoist;
  cross-module calls resolve at runtime, so feature-module order is flexible).

## Data layer
- **Offline write queue (Option B)**: writes are local-first — cache optimistically, and on a
  network failure queue the op (FIFO, localStorage `tealog_writeQueue`) and replay on reconnect/boot.
  Idempotent (upsert/delete by id). Non-network errors still surface. Social + bulk stay online-only.
- **loadKey('sessions'/'steeps') is scoped to `user_id`** (v3.21 hotfix) — a social RLS policy lets
  followers read *shared* sessions, so an unfiltered load leaked others' data into personal stats.
  The feed uses getFeed() separately.
- Public API: `window.SteepDB.{loadKey,saveKey,loadSettings,saveSettings,uploadImage,boot,signIn,
  putTea,removeTea,putVessel,removeVessel,putSession,removeSession,addTag,putWishItem,removeWishItem,
  flushQueue,pendingWrites, ...social}`.

## Models
- **Session**: `{id,teaId,vesselId,date(ISO),isColdBrew,gramsUsed,steeps[],rating,description,tags,
  isShared,photoUrl,feedback,teaName,teaType,...}`. Timed sessions have steeps[]; quick/cold-brew have
  infusionCount + steeps=[]. Cold brew skips the timer (single long steep).
- **Wishlist** (`wishlist` table): `{id,name,vendor,type,note,done,createdAt}`.

## DB migrations run (Supabase SQL editor, in order)
schema.sql · v2_1-migration · v2_2-photos-storage · v3_0-social · v3_1-quick-log ·
v3_2-session-photos · v3_3-wishlist · v3_4-brew-advice · v3_5-purchase-date · v3_6-leaf-form · v3_7-mood.

## Conventions / principles
- Calm-first; achievements/XP behind Show-achievements + Quiet Mode toggles.
- **Escape all user text in rendered HTML** (v3.36): use `escapeHtml` (data values, incl. attribute
  values) and `escapeJsArg` (inline `onclick` string args) from steep-core. Never interpolate raw
  tea/vessel/session/profile/tag text into an innerHTML template. Escape the data, never the markup.
- No browser confirm()/prompt() — inline UI (a couple of legacy alert()s remain in sessions; backlog).
- Generated art is placeholder; **human art for any public release**.
- Settings are synced; **theme is device-local** (`tealog_theme` in localStorage, not synced).
- Offline: read-only offline, queued writes. Photos on offline sessions are deferred (re-add online).

## Deploy ritual
Produce updated files → push to GitHub Pages → **bump `CACHE_NAME` in service-worker.js** (and add any
NEW module to its `FILES_TO_CACHE` list) → hard reload. Current cache: **v45**. Keep CHANGELOG.md updated.
Since v3.27 the app shows a "new version — Refresh" banner when a new SW installs, so testers no
longer need a manual hard reload (dev still should, to verify). The SW waits for that tap now.

## Continue here
**NOW (just shipped) — v3.68 in-session brew guide "hide" (issue #1)** (cache **v78**, APP_VERSION v3.68):
second of the cleanup tail (ROADMAP-v4 Pillar F). Fixes the "in-session turn off link gives weird feedback"
bug. Mid-steeping, the schedule strip's **"turn off"** called `d_setBrewMode('off')` — which reset
`timeShift` to 0 (silently discarding the accumulated "+Xs vs guide" nudge) and set `brewMode='off'`, but
never nulled `d.schedule`, so the card stayed put: you tapped it, nothing turned off, and your nudge
vanished. Now the link is **"hide"** (`d_hideStrip()`, steep-sessions.js) — a reversible visual collapse
that leaves `brewMode`/`d.schedule`/`timeShift` intact and sets `d.scheduleHidden=true`; `scheduleStripHTML`
shows a one-line "Brew guide · hidden · show" ghost (`d_showStrip()` restores it), and the nudge row hides
with it and comes back with the same carry. `scheduleHidden` resets at `beginSteeping`. Setup preview's
**Off** segment (`d_setBrewMode('off')`) unchanged. `node --check` clean; both themes browser-verified.
**Issue #1 → close with a comment (needs auth).** **NEXT in the tail:** **v3.69** what's-new banner
(`WHATS_NEW` const) · **v3.70** greeting v4 habit-aware (issues #4+#5). Also newer inbox: issues #6–#11
(remove achievements/confetti · Gaiwan icon · brew-advice "how was it" richer · settings overhaul ·
map/passport into design · favorite-leaf visibility). Close issue #3 (workflow Q). Launch checklist in
ROADMAP-v3-next.md.

**Earlier — v3.67 greeting v3, session-aware** (cache **v77**, APP_VERSION v3.67): first of the
renumbered cleanup tail (ROADMAP-v4 Pillar F). `greetingCardHTML` (steep-dashboard.js) gains a
**session-aware branch** (fixes issue #2): a session logged in the current time-of-day bucket → the card
**acknowledges** it (predicted-vs-actual — "Good choice — the {name} it is." if the day's deterministic
pick was taken, warm surprise "The {name} instead — didn't see that coming." if not; never scores the
prediction) → then **forward-suggests** for a later active window or **rests**, never a third-cup nudge.
**Same-day type-variety guard** (`VARIETY_GUARD_SAME_DAY`, on) keeps it from suggesting the just-logged
type again today ("not two greens in a row"); falls back to rest if every candidate shares the type.
Shared `d_scorePick(target,todayKey,excludeIds,excludeType)` extracted; `d_copyPick` gained a `salt` so
ack + tail draw independently. No-session branch unchanged. Validated local `fixtures/greeting-test.js`
(now 44; normal-branch sweeps moved to a sessionless mocked day); both themes browser-verified.
**Issue #2 → close with a comment (needs auth).** (v3.68 above superseded this block's "NEXT" tail.)

**Earlier — v3.66 feed pagination + social inline notice** (cache **v76**, APP_VERSION v3.66):
resumes the SlowCup batch tail after the design rework. `getFeed(limit,offset)` (steep-data.js) paginates
via `.range()` + secondary `.order('id')` tiebreak and returns `hasMore`; `loadMoreFeed()` (steep-social.js)
appends the next page de-duped by session id; a quiet "Load more" ghost button (no infinite scroll). The
**last `alert()` in the app is gone** — `socialErr` now sets `state.social.err` → a dismissible sticky
`.social-notice` on the Friends view (same message branches; themes both; cleared on next action or ×;
`dismissSocialErr`). Both themes browser-verified; `node --check` clean. **NEXT:** a **docs commit**
reconciling `ROADMAP-v4.md` + `TASK-issues-triage-addendum.md` (Downloads) into the repo, then the cleanup
tail continues: **v3.67** greeting v3 session-aware (issue #2, EXTENDED — predicted-vs-actual acknowledgment
+ same-day type-variety guard) · **v3.68** in-session turn-off fix (issue #1) · **v3.69** what's-new banner
· **v3.70** greeting v4 habit-aware (issues #4+#5 — out-of-habit lines + rediscovery pick; zero-session
line DECIDED guilt-free/playful). Close issue #3 (workflow question) with the convention comment. The
**slowcup.app launch checklist** lives in ROADMAP (register domain · reshoot 3 screenshots · root/index
split · install guide).

**Earlier — v3.65 WS2 Insights overhaul** (cache **v75**, APP_VERSION v3.65): the LAST of the
4-workstream design rework — **the rework is complete**. `viewInsights()` is now a curated reflective room
built from insights-surface dashLayout cards (Home stays editable): a jade-pale **hero observation**
(window-aware eyebrow "This week, mostly"→"Lately"→"Mostly"; Shippori sentence "Green, and mornings.";
12-bar time-of-day rhythm folding in the brewing clock; one supporting line), then hairline-separated
readings in a shared tiny data-viz family — cadence **sparkline** (8 weeks, jade), **type bar** (fixed
`.dot-*` colors) + mono legend, ascending amber **steep-shape** line + ledger caption, two quiet **notes**
(leaf = most reached-for, hanko = highest note), and a deep-jade **Wrapped teaser** into WS1. **Register:
observations, not KPIs** — the old "vs last ↑" arrow row is gone; no arrows/%/targets anywhere (guarded by
`fixtures/insights-room-test.js`, 33). Retired the recap grid + all-time toggle (`recapHTML`/`computeRecap`/
`insightsHTML`/`wrappedTeaser` removed; Home totals still carry raw numbers). New `.ins-*` classes. Both
themes browser-verified (computed styles + screenshots). **NEXT — v3.66 feed pagination** (+ fold `socialErr`
`alert()` → sticky inline notice), resuming the SlowCup batch tail; then the renumbered cleanup order
(v3.67 greeting-v3/issue #2 · v3.68 in-session turn-off/issue #1 · v3.69 what's-new banner). A **slowcup.app
launch checklist** now lives in ROADMAP (register domain · reshoot the 3 landing screenshots · root/index
split · install guide). Niklas: after v3.65, a slow scroll through the whole app on your phone (both themes)
is worth it — the Insights tab's Wrapped teaser is now one tap from the swipeable season.

**Earlier — WS4 slowcup.app landing page** (NO cache/APP_VERSION bump — was cache **v74**,
APP_VERSION v3.64): third of the 4-workstream design rework. New self-contained **`landing.html`** at repo
root + **`landing-assets/*.png`** — a static marketing page: inline CSS + inline SVG sprite, Google Fonts,
**no JS/cookies/analytics**, theme via `@media (prefers-color-scheme: dark)` over the `:root` token set.
Sections: nav · hero (Shippori "The calm tea log." + faint amber ensō, jade "Request an invite") · 3
dark-bezel device screenshots (middle raised) · 3 philosophy beats (leaf/ensō/share chips) · jade-deep CTA
panel (seigaiha + amber button) · footer. All CTAs `mailto:slowcupapp@gmail.com`. **Deliberately no PWA
cache / APP_VERSION bump / FILES_TO_CACHE change** — it touches zero app files, so invalidating testers'
caches would be wrong (flag this reasoning if a future session expects a bump). **Two TODOs before
slowcup.app goes live** (flagged in an HTML comment + CHANGELOG): (1) reshoot the placeholder screenshots —
the bundle ones predate WS3/WS1 and `app-tea-detail.png` still shows the old **"Steep"** wordmark
(pre-v3.59 rename); (2) decide the root/`index.html` split for the domain (part of the deferred domain
migration — slowcup.app not yet registered). Browser-verified both themes + mobile, no console errors.
**Last workstream (own deploy, pause after):** WS2 Insights overhaul (`viewInsights` in steep-insights.js;
inherits WS3+WS1 — hairline top-borders not boxed cards, one jade-pale hero observation, a tiny reusable
data-viz family, observations-not-KPIs copy, quiet Wrapped teaser). Then back to the SlowCup batch's last
item: feed pagination (+ socialErr inline notice).

**Earlier — v3.64 WS1 SlowCup Wrapped** (cache **v74**, APP_VERSION v3.64): second of the
**4-workstream design rework** (order WS3→WS1→WS4→WS2; **pause after each**). `viewWrapped()`
(steep-insights.js) is now a horizontal scroll-snap sequence of full-width `.wrap-card` story cards
(seasonal jade/amber/porcelain wash via new `--wc-*` tokens in both theme blocks + catalogue
numbering + hanko-sealed standout plate; cover ensō, closing seigaiha; reuses the WS3 sprite). Up to
8 cards — cover · sessions · time-at-the-table · companion · rhythm · new-this-season · standout ·
kept/share — degrading gracefully: `wrappedKinds()` drops any missing-stat card and the numbering
re-flows (time card falls back to cold-brew count; cover/sessions/kept always present). Only JS is
dot-tracking (`bindDynamic` in steep-core, rAF-throttled) + tappable dots (`wrapGo`, respects
reduced-motion) + share (`shareWrapped`, kept; `wrappedShareText` reworded to the agreed format).
Empty state + "SlowCup Wrapped" name kept. Validated `fixtures/wrapped-cards-test.js` (committed,
data-free, 22 — degrade/numbering/footer/cold-fallback/overflow/hanko/share). Browser-verified BOTH
themes via injected `computeWrapped()` sample (screenshots still time out on the auth gate, so DOM/
computed-style eval): fields+fonts+accents resolve per theme, dark active dot stays amber (`--wc-enso`).
**Remaining workstreams (own deploys, pause after each):** WS4 slowcup.app static landing page (new
file) · WS2 Insights overhaul (viewInsights). Then back to the SlowCup batch's last item: feed
pagination (+ socialErr inline notice).

**Earlier — v3.63 WS3 design language** (cache **v73**, APP_VERSION v3.63): first of a
**4-workstream design rework** (`design_handoff/`, order WS3→WS1→WS4→WS2). Display font Fraunces →
**Shippori Mincho** (new `--font-display` token, headings weight 700, all inline refs swept); header
emoji → **hairline stroke icons** (hidden `<svg><defs>` sprite in index.html + `icon()` helper in
steep-core; `.hl` stroke 1.7 light/1.9 dark); favourite ♥/★ → **tea leaf** (`favLeaf()`/`.i-fav`) on
tea cards, running-low, detail pill, filter chip, shopping; **ensō ring** on the steep timer (fills via
stroke-dashoffset each tick; new `--enso` token amber-light/dark-jade); hanko+seigaiha defs added for
WS1/WS2. Verified both themes in-browser. **DESIGN.md updated** to Shippori + accent vocab.
**Remaining workstreams (own deploys, pause after each):** WS1 SlowCup Wrapped swipeable story cards
(viewWrapped/steep-insights) · WS4 slowcup.app static landing page (new file) · WS2 Insights overhaul
(viewInsights). Then back to the SlowCup batch's last item: feed pagination (+ socialErr inline notice).

**Earlier — v3.62 freshness cues + sparkline rider + night-copy patch** (cache **v72**,
APP_VERSION v3.62): tea detail gains one soft italic line under Harvest — fresh greens "at its best
young", whites/pu-erh "deepens with age" — requiring a valid year (season optional), silent on
garbage/neutral styles (`freshnessCueHTML` in steep-teas.js; exactly 2 fire on real data). Rider:
"add a purchase date" link where `inventorySparkline` is absent only for want of a date. Night-copy
patch: active-with-history line 3 now reads "tonight" not "this late-night" (steep-dashboard.js).
Validated `fixtures/freshness-test.js` (local, 11) + `greeting-test.js` (now 32). **[Superseded — these
version numbers were reassigned when the design rework (v3.63 WS3 · v3.64 WS1 · v3.65 WS2) pulled ahead;
see "Continue here" + ROADMAP for the real order: v3.66 feed pagination · v3.67 greeting-v3 · v3.68
in-session turn-off · v3.69 what's-new banner.]**

**Earlier — v3.61 greeting copy variety + APP_VERSION** (cache **v71**): each greeting
branch draws from a small approved pool via `d_copyPick(pool,todayKey)` = `d_hash(todayKey+'|copy')
% len` — one voice per calendar day, seeded apart from the tea pick so it doesn't reshuffle on
re-render (steep-dashboard.js). New `APP_VERSION` const in steep-core.js (='v3.61') feeds the feedback
mailto subject + a quiet Settings-footer version label; **deploy ritual now bumps APP_VERSION too**
(CLAUDE.md step 2b). `fixtures/greeting-test.js` extended to 30 assertions (pool membership + variety
+ one tea-name link/line + same-day determinism). **Note for Niklas:** active-with-history line 3
renders "this late-night" for a night-active user — strike/reword if it grates. **SlowCup batch
continues (pause after each):** v3.62 freshness cues (+ sparkline "add a purchase date" rider) ·
v3.63 feed pagination.

**Earlier — v3.60 error log + data health + feedback** (cache **v70**): Settings → Data
gains three read-only tools. A device-local `tealog_errorLog` ring buffer (last 20) fed by
`window.onerror`/`unhandledrejection` + `saveErr` (`logError`/`readErrorLog`/`clearErrorLog` in
steep-core; hooks installed at load; never surfaces proactively — only viewable/clearable in
Settings). An on-demand `dataHealthReport()` (steep-settings): deleted-tea sessions, deleted-vessel
sessions, negative stock, empty sessions (the client-visible stand-in for DB-orphaned steeps, which
the sessions load drops), duplicate pairs (same tea ≤10 min). A `mailto:slowcupapp@gmail.com` feedback
row (subject "SlowCup v3.60 feedback", hardcoded — no APP_VERSION constant yet). Validated
`fixtures/data-health-test.js` (local): real export clean on all 5, each detector fires on injected
bad rows. **SlowCup batch continues (pause after each):** v3.61 greeting copy variety · v3.62 freshness
cues (+ sparkline rider) · v3.63 feed pagination.

**Earlier — v3.59 rename Steep → SlowCup** (cache **v69**): user-facing brand only,
per `TASK-slowcup-batch.md` §1 (supersedes the forgotten-batch TASK). Renamed title/manifest/topbar/
login/onboarding/Wrapped-labels+eyebrows+share-text/backup-filename+import-toast/update-banner/
migration-screen; internal names + repo/URL + "steep" terminology untouched. **The SlowCup batch
continues (pause after each deploy):** v3.60 error log + data health + `mailto:slowcupapp@gmail.com`
feedback row (Settings → Data) · v3.61 greeting copy variety · v3.62 freshness cues (+ sparkline
"add a purchase date" rider) · v3.63 feed pagination. Feedback mailbox DECIDED: slowcupapp@gmail.com.

**Earlier shipped:** v3.29 leaf-form curves · v3.30 in-session micro-adjust · v3.31 mood check-in ·
v3.32 forecast coverage + brew-guide parse · **v3.33 curated passport sub-regions + China/Japan zoom**
(curated tea-region map, not full geo — later REJECTED, see below) · **v3.34 settings declutter**
(settings grouped into sections; new `showMood` toggle to hide the mood check-in — the future Garmin
on/off; brew-guide + advice grouped under one "Brew guidance" block) **+ change vessel on a saved
session** · **v3.35 fix: double stock decrement** (re-entrant `commitSession`/`saveSessionEdit` double-
fire subtracted `gramsUsed` twice; fixed with a shared `_sessionSaving` guard. Offline queue was NOT the
cause — absolute-value upserts replay idempotently. Deeper fix later: derive stock instead of accumulating
it) · **v3.36 XSS sweep** (shared `escapeHtml`/`escapeJsArg`; escaped every user-text render site, fixing
stored cross-user feed XSS; replaced 4 local escapers) · **v3.37 hygiene** (re-entrancy guards on
`deleteSession` + the 3 form submits; `teaToDb` preserves `created_at` insert-only so import keeps dates;
deduped view allowlist → `PERSISTED_VIEWS` and time-of-day → `timeOfDayBuckets()`; cut unused
`getFollowers`) · **v3.38 tea knowledge base** (new `steep-knowledge.js`; `inferLeafForm` consults
`kbResolve` on name+cultivar+origin — fixes the parked Japanese-cultivar/silver-bud misses; gentle
KB type/origin prefill in the tea form) · **v3.39 tea picker grouped by type** (session picker
`<optgroup>`s + Teas-tab default "By type" sort; `TYPE_ORDER`/`groupTeasByType` in core) · **v3.40
tea lifecycle** (`isTeaFinished`/`isAmountTracked`; finished teas group at bottom of Teas tab, hidden
behind "show finished" in the picker but still loggable, one-time "rebuy?" → shopping list; finished
teas still count in all stats — tracked-and-≤0 is finished, untracked-0 is in-stock) · **v3.41 dancong
brew baseline** (own `KB_STYLES.dancong` @ 90°C; dancong keywords remapped off `strip_oolong`; new
`knowledge/brew-guides.md` reference layer — not app-loaded, consult when tuning brew baselines;
deferred: extend the opening-dip to oolong `LEAF_PROFILES` curves) · **v3.42 brew accuracy** (LEAF_PROFILES
retune — opening dip now on oolong/bud/compressed, moderate bases; matched KB style's `first` is the
generation base; KB ball_oolong 95/3.5/45, longjing 78; validated vs fixtures/steeps — Ali Shan → 45/27/27).
· **v3.43 silver needle glass note** (KB `silver_needle` note adds "also classic in glass: 80°C, ~4 min";
baseline unchanged) · **v3.44 Insights tab + dashboard split** (new `steep-insights.js` owns the analytics
cards; nav gains Insights; `DASH_SURFACE` makes the editable `dashLayout` per-tab with lossless migration;
recap gains "All time"; heatmap/streak stay on Sessions per Niklas). **Next: Brew advice v2** — capacity-
capture precursor (v3.56 ✓) and ratio phase 1 (v3.57 ✓ shipped). **Brew advice v2 phase 1 is DONE** —
phase 2 (learned defaults) WAITS on a monitoring window of ratio'd sessions (separate spec). Now working
the **forgotten batch** (`TASK-forgotten-batch.md` in Downloads): v3.58 popup sweep ✓, then v3.59 error
log + data health, v3.60 freshness cues, v3.61 feed pagination — pause after each. Install guide SKIPPED
(parked-with-reason: slowcup.app domain not decided — installed PWAs bind to origin). Cache **v68**
(v3.58: **finished the popup sweep** — last 8 `alert()`/`confirm()` gone. steep-settings.js clean:
photo-migrate confirm → `armConfirm(this)` (+`doMigratePhotos`), import replace-all → state-driven inline
confirm row `state.pendingImport`/`importConfirmHTML()` keeping both counts + friction (NOT a toast),
notices → toast. steep-core `saveErr` offline-sync alert → long-lived toast (~12s); `showToast(msg,ms)`
gained a duration arg. Only `socialErr` alert remains — out of scope, online-only diagnostics.) Cache **v67**
(v3.57: **leaf-to-water ratio — the 3rd advice axis**. STRICT OPT-IN `ratioAdjust` (default OFF; off =
byte-identical). `actualRatio=gramsUsed/(waterMl/100)` vs a per-method baseline → `timeFactor=
clamp(1/ratioFactor^0.6,0.6,1.4)` scales the whole schedule (temp NOT touched). Ordering base→ratio→
feedback→timeShift (`computeBrewAdvice(tea,baseOverride)`). Engine in steep-core.js: `computeSessionRatio`/
`baselineRatioFor`/`ratioScaleSchedule`/`bg_extractRatio`/`brewMethodFor`/`ratioMemoryText` + tunables next
to LEAF_PROFILES. Baseline order: guide grams+ml → KB method ratio → leaf-form default. **Dual-method KB**:
`ratioGongfu`/`ratioWestern` where methods differ (greens g3.0, whites g4.5, yellow g3.5, puerh g5.0, ball
w0.8, dancong w1.0, strip/dark g4.5); **JP-green westerns raised** sencha/shincha 1.8, kabusecha 2.0,
fukamushi 1.8 (agreed w/ Niklas 2026-07-09). Setup (opt-in on): Gongfu|Western switch (prefill cap≤150→gongfu)
+ optional Water(ml) override; `sessions.water_ml`/`brew_style` (`sql/v3_8-water-ml.sql`, applied) via mapper
pairs + both write paths; method stored for phase-2. Validated `fixtures/ratio-test.js` (local, 47) over all
10 real sessions — floors→gentle trims (Fujian White 0.89, Huang Ya 0.98). v3.56: **capacity-capture
precursor** — groundwork for the ratio axis. All vessel/session views live in steep-sessions.js. Vessel form
Capacity field gains a soft hint + example placeholder (still optional); vessels list shows a quiet "· ml?"
tap-to-edit affordance on capacity-less vessels; session setup shows an inline "set capacity" link under the
Vessel picker when the chosen vessel lacks one (`selVes`/`capLink`, opens the edit overlay, draft persists).
Never a banner, never blocks logging. No SQL. v3.55: **greeting card v2 — window-aware**.
`greetingCardHTML` (steep-dashboard.js) now checks whether NOW is inside the user's real drinking window: a
time-of-day bucket is *active* if it holds ≥2 sessions or ≥15% of total, needs ≥5 sessions of signal (else
v3.54 behaviour). Inactive-bucket → scan `BUCKET_CYCLE` forward to the next active window and suggest FOR it
with forward-looking copy (night → "waiting for the morning"; wrap → "tomorrow {bucket}"; later-today →
"{this afternoon/…}"); greeting h2 still truthful to now. Scoring targets the destination bucket;
`brewedToday` excluded only when target window is still today. Validated `fixtures/greeting-test.js` (now
reads from `fixtures/`) against fresh CSVs — Niklas's data: morning 7 / afternoon 5 active, evening/night
inactive → 22:00 forward-to-morning, 19:00 "tomorrow morning", 09:00 now-copy, <5 = v3.54; 21 assertions.
v3.54: **greeting card** replaces the removed
persona slot — `greetingCardHTML` (steep-dashboard.js), first in `DASH_DEFAULT_ORDER`, a time-of-day
greeting + one deterministic-per-day tea suggestion scored by same-bucket history (date-seeded tie-break);
`isTeaFinished`/brewed-today excluded; calm fallbacks; no seasonal word (hemisphere-ambiguous). Validated
in the vm sandbox against real CSVs (`fixtures/greeting-test.js`, local). v3.53: **Pixelify Sans retired →
IBM Plex Mono** via `--font-mono`; Google-Fonts weight swapped, Pixel/Clean Settings toggle + `monoFont` +
`html[data-mono="clean"]` retired, `applySettings` now a no-op, eyebrow tracking `.1em → .06em` so long
"Suggested brew · …" eyebrows don't wrap on 375px. v3.51: tea detail renders a structured
"Brew guide · saved" card for teas WITH a guide — `savedBrewHTML` in steep-teas.js parses via
`effectiveGuideSchedule`, raw text preserved in the card, temp-only guides show the leaf-form schedule
flagged as generated, plain-text fallback when brewAdvice is off or nothing parses. v3.52: **Tea persona
removed** — `computePersona` + the `persona` card + `.persona` CSS deleted; saved dashLayouts self-heal
via the unknown-id filter. **Next: Brew advice v2** — capacity-capture precursor, then ratio phase 1
(`sql/v3_8-water-ml.sql`; see `SPEC-brew-advice-v2.md`). v3.50: swept `confirm()`/`alert()` out of
steep-sessions/steep-teas — new shared `armConfirm(btn,message,onYes)` in steep-core.js does an inline
two-step "Yes / Cancel" via DOM swap (no re-render, so unsaved fields survive); `alert()`s → `showToast`.
Remaining popups only in steep-settings + steep-core offline error. v3.49: `scheduleToGuideText` emits raw-second times so
a saved guide round-trips through `parseBrewGuide` exactly — the old `fmtSecShort` "1m15s" reparsed as 60s
and truncated the run, corrupting any ≥60s+remainder steep in save-tuning-as-guide; `saveSuggestedGuide` now
reuses that one emitter. Locked in by **`fixtures/brew-roundtrip-test.js`** — the first *committed* fixture
test (rest of `fixtures/` stays gitignored), asserting schedule→text→parse identity for every LEAF_PROFILES
family + KB style. v3.48: tea detail shows a calm "Suggested brew" card for teas with no saved guide —
`suggestedBrewHTML`/`saveSuggestedGuide` in steep-teas.js surface the timer's KB/leaf-form schedule
(temp/ratio/first steeps) with a source label and a save-as-guide button; gated on the `brewAdvice` opt-out.
v3.47: dashboard edit
mode can move a card between Home and Insights — `dashMoveToSurface` writes a per-user `dashLayout.surface`
override that `dashSurface` layers over `DASH_SURFACE`; both tabs build the full card map via shared
`dashCards()`. v3.46 folds
Vessels into the Teas tab behind a Teas|Vessels segmented control; nav = Home·Teas·Sessions·Insights;
`state.teaSeg` tracks the segment, `goVessels()` is the deep-link target. Friends is a 👥 topbar icon).
**v3.33 detail:** `PASSPORT_SUB` in steep-passport.js holds curated sub-regions per country (China,
Japan, Taiwan) placed by lat/lon on the existing grid. `passportSubFor(country,tea)` matches within the
parent country only. Tapping China/Japan zooms the SVG viewBox and shows sub-region pins; other
countries surface sub-regions as panel chips. New state `passportZoom`/`passportSub`.
**NEXT (fresh chat):** decide the real focus. The passport is **PARKED** — the dot-map (v3.33/34) was
rejected: you can't recognise countries or borders, "just dots." Redo later with **drawn country
outlines + borders** (simplified SVG/TopoJSON of tea nations only, not full world geo), choropleth by
count, keep the China/Japan drill-down. The parsing/aggregation layer (`passportCountryFor`,
`passportSubFor`, `PASSPORT_GEO/SUB`) is reusable — only the dot rendering gets replaced.
Recommended focus order (my call, Niklas hasn't picked yet): (1) **settings declutter + Insights tab**
— cheap, low-risk, reuses the editable-dashboard registry; (2) **leaf-to-water ratio** (the longest-
parked, highest-leverage item — the missing 3rd advice axis + unlock for learned defaults) with a design
pass first, incl. a `capacityMl`-capture precursor since it's sparse; (3) map redesign when there's appetite.

**Bugs/ideas/feedback now live in GitHub issues, not here.** Open issues (`Tosinik/steep-tea-log`,
public) are the live queue alongside the ROADMAP — fetch them at session start (see CLAUDE.md
"Open issues are the live inbox"). Triage labels: `bug` / `idea` / `feedback`. This replaces the
old beta-feedback batch list. (Leaf-form inference misses — the one previously-listed bug that got
fixed — shipped v3.38: `inferLeafForm` consults `kbResolve` first, so add coverage to the KB tables,
not `inferLeafForm`. The remaining in-session `d_setBrewMode('off')` bug is now issue #1.)

**Product backlog from Niklas (capture — discuss/prioritise in the fresh chat):**
- **Settings declutter:** group settings into sections (getting long). Add a toggle to **hide the mood
  check-in** (one switch, later doubles as the Garmin on/off). Group **brew-guide + advice** under one
  settings block that can hide/disable them individually or together.
- **Separate Insights tab to declutter Home** (Home scroll is long). Keep on Home: standard info. Move
  to Insights: the Insights card, most-brewed, top-rated (cost overview + running-low + brewing-time
  probably stay — confirm with Niklas). Reuses the editable-dashboard registry pattern.
- **All-time option for the recap/Wrapped** (currently period-limited).
- **Leaf-ratio adaptation (leaf:water) — the missing 3rd advice axis.** Still parked as "scale steep
  times by leaf amount". Niklas sees this as central: brew advice should adapt on all three of
  **leaf-to-water ratio (gramsUsed vs vessel ml), temperature, and time**. Today advice tunes temp+time
  only; adding ratio is the parked item AND the unlock for trustworthy "learned defaults" (normalising
  across sessions). Worth a design pass early in the brew-advice v2.
- **Recurring check-in — data captured but under-used:** `harvest_year`/`harvest_season` (freshness
  cues, Wrapped), `cultivar`/`origin` (world map + a future cultivar map), `waterTDS`/`waterType`
  (water-profile insights, parked), `mood` (Garmin/sleep epic), per-steep `feedback`/notes.

**Open enablers:** caffeine field, paused-days, first Edge Function. **Tunable now:** `LEAF_PROFILES`.
Parked/small: v3.28 sparkline staircase + Home-card sparkline; per-form default temps; roll a consistent
in-session nudge into saved tuning.
