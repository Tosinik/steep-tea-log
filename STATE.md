# Steep — STATE (handoff, current @ v3.27)

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
**NOW (just shipped):** v3.29 leaf-form curves · v3.30 in-session micro-adjust · v3.31 mood check-in ·
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
capture precursor, then ratio phase 1 (see `SPEC-brew-advice-v2.md`). The v3.34 map legibility pass was
built but NOT shipped — map is parked. Cache **v60** (v3.49: `scheduleToGuideText` emits raw-second times so
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
