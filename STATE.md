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
steep-data → steep-core → steep-settings → steep-dashboard → steep-teas → steep-shopping →
steep-passport → steep-social → steep-sessions → steep-boot.
- **steep-data**: Supabase client, loadKey/saveKey, mappers, per-row CRUD, offline write queue.
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
it). The v3.34 map legibility pass was built but NOT shipped — map is parked. Cache **v46**.
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

**Beta-feedback bugs still open (batch):**
- Leaf-form inference misses (PARKED, do together): Japanese cultivar/region names → steamed green
  (Shincha *Saemidori* *Kagoshima*, *Yutakamidori*, *Kabusecha* went pan-fired); silver-bud whites
  (*Yunnan Silver Bud*) → `bud`. Broaden `inferLeafForm` (cultivars: saemidori, yutakamidori, yabukita,
  gokou…; regions: kagoshima, uji, shizuoka…; shincha; silver bud/tips/yaba). NB `teas.cultivar` +
  `origin` columns exist and are populated — infer from those, not just `name`.
- In-session "turn off" link gives weird feedback — investigate `d_setBrewMode('off')` mid-session.

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
