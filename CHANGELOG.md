# Steep — changelog

Newest first. "Deploy" = files to push to GitHub Pages. SQL = run once in the Supabase SQL editor.

## Module map (after the v3 split)
`app.js` was split into feature modules loaded in order by `index.html`. They share one
global scope (plain scripts, not ES modules), so cross-file function calls just work.
Concatenating them in this order reproduces the old `app.js` byte-for-byte.

1. `steep-core.js` — constants, `state`, settings/persist helpers, small utils, stars,
   image upload, the pixel logo, `render()`, header, `goView`, `bindDynamic`.
2. `steep-settings.js` — backup/export/import, settings modal, `setSetting`.
3. `steep-dashboard.js` — `computeStats`, persona, brewing clock, achievements
   (compute/badge/sync/confetti), heatmap, streak card, recap, onboarding,
   achievements page, `viewDashboard`.
4. `steep-teas.js` — tea cards, vendor list, sort/filter, `viewTeas`, tea form, tea detail.
5. `steep-social.js` — friends/feed/profile/follow.
6b. `steep-passport.js` — world dot-map, origin→country matching, tea click-through.
6. `steep-sessions.js` — sessions calendar, vessels, session-edit modal, session flow
   (setup/steeping/finish/quick), timer, tags, `commitSession`.
7. `steep-boot.js` — `SteepDB.boot(init)` + service-worker registration (loads last).

Data layer stays in `steep-data.js`; Supabase keys in `supabase-config.js`.

---
## v3.31 — mood/energy check-in (enabler)
Deploy: `service-worker.js` (v42), `steep-sessions.js`, `steep-data.js`, `steep-teas.js`.
SQL: `v3_7-mood.sql` (adds nullable `sessions.mood`).
- **Optional pre-brew mood/energy** at session setup (Drained · Low · Steady · Lively · Wired),
  one tap, skippable, applies to cold brew too. Captured *before* you start so it's tied to the
  session and time of day — the reading the later Garmin/caffeine-sleep correlation (Tier 4) leans on.
  Editable afterwards on the session-edit form. Stored in `sessions.mood`; `MOODS`/`moodChipsHTML`/
  `d_setMood`/`setEditSessionMood` in steep-sessions.
- **Fix:** removed the leaf-form line from the tea detail page (looked cluttered) — the field still
  lives in the tea edit form, it's just no longer auto-listed on the detail grid.

## v3.30 — in-session micro-adjust
Deploy: `service-worker.js` (v41), `steep-sessions.js`. No SQL.
- **Adjustments now stick.** Previously each steep re-prefilled from the fixed schedule, so lowering
  a steep's time did nothing — the next steep snapped back to the guide's upward march. A session-local
  `timeShift` now carries the gap between what you actually brewed and what the schedule predicted, so
  the next steep continues from where you landed (the curve still rises, but from your level). Clamped
  ±45s, reset on brew-mode change and each new session. Ephemeral — the tea's saved guide is untouched.
- **"How was that pour?"** After the first steep, a small Weak → longer / Just right / Strong → shorter
  row nudges the next steep ±5s without retyping, showing the live offset ("next steep −6s vs guide").
  Same weak/ok/strong vocabulary as the between-session advice, at per-steep granularity.
  (`d_nudgeNextSteep`, `brewNudgeRowHTML`, carry logic in `saveSteepAndContinue`/`applyScheduleToCurrentSteep`.)

## v3.29 — leaf-form steep curves + seconds-first advice
Deploy: `service-worker.js` (v40), `steep-core.js`, `steep-sessions.js`, `steep-teas.js`, `steep-data.js`.
SQL: `v3_6-leaf-form.sql` (adds nullable `teas.leaf_form`).
- **Leaf form drives the steep progression.** Steep times now follow *leaf morphology*, not a single
  ramp. Six families, each with its own curve: rolled/balled (opens slowly → small early increments),
  strip/open leaf (strong early → ramps from the start), bud/needle (slow, steady, long), green
  pan-fired (Chinese — S2 flash-dip then climb), green steamed (Japanese — deeper dip, lower base),
  compressed/cake (breaks & opens like rolled). `LEAF_PROFILES` + `scheduleTimeForIndex` (now
  form-aware) in steep-core.
- **New `leafForm` field on teas** (Auto by default). Auto **infers from the name first**
  (cultivar/region/leaf: Da Hong Pao/Wuyi/yancha→open, gyokuro/sencha→steamed, silver needle/
  yinzhen→bud, cake/bing/tuo→compressed) then the type default — because vendor type labels are
  unreliable. Overridable per tea; shown on tea detail. Nullable column, no backfill.
- **Suggested schedules with no guide.** A tea with no brew guide now gets a leaf-form-generated
  schedule in setup (labelled "Suggested · <form>"), so the timer prefills sensibly from day one.
  Explicit guide times always win; the curve only fills gaps and **extrapolates past the last listed
  steep** (validated against a real Da Hong Pao card: 10-15s/15-20s + "add 5-10s each" → 13, 18, 24,
  30, 38, 47, 57s).
- **Parser hardening.** `parseBrewGuide` now understands ranges ("10-15s" → midpoint), ordinals
  ("1st/2nd"), and "add 5-10s (each/thereafter)" ramp instructions (dropped, not read as a steep) —
  so real-world guide text stops producing junk steeps. Slash/comma/clock notations unchanged.
- **Advice in seconds, not percent.** The tuning suggestion reads "≈+5s/steep" off a representative
  steep instead of "+8%", since a percentage is hard to act on mid-brew. (`adviceSuggestionText`.)

## v3.28 — inventory-over-time + restock v2
Deploy: `service-worker.js` (v39), `steep-dashboard.js`, `steep-teas.js`. No SQL.
- **Sharper run-out estimate.** `teaForecast` now prefers a *purchase-date ledger* — real net
  drawdown `(grams bought − on hand) ÷ days since purchase` — over the old session-span guess.
  It's anchored to a real buy date and captures untracked use too, so "how long will this last"
  is meaningfully sharper on any tea logged with a price/pack size + purchase date. Falls back to
  the session estimate when there's no usable anchor; guarded against bad data (on-hand > bought,
  <3 days elapsed). Return shape is unchanged, so the Home "Running low" card and the tea-detail
  forecast line both sharpen with no other edits. The line adds a quiet "· from your purchase date"
  when the ledger is used (vs "· rough estimate…" while a session estimate is still settling).
- **Inventory drawdown sparkline** on tea detail. A calm SVG: a jade spine from the purchase
  anchor (full pack) down to today's on-hand amount, a soft area fill, and a dashed amber
  projection to the estimated run-out date, with buy-date/amount and "runs out ~date" captions.
  Only renders when a real buy anchor exists (teas you already had have no chart). Info, not
  gamification — no toggle, shows in Quiet/Calm mode too. `inventoryHistory` + `inventorySparkline`
  live in steep-dashboard. First payoff of the v3.26 purchase-date enabler.
- Parked (noted in ROADMAP): a per-session drawdown *staircase* overlaid on the spine, and the
  same sparkline on the Home restock card — deferred to keep this a small deploy.

## v3.27 — update prompt + editable dashboard
Deploy: `service-worker.js` (v38), `steep-boot.js`, `steep-dashboard.js`, `steep-core.js`.
- **"New version available" prompt.** The service worker no longer auto-`skipWaiting()`s; on an
  update it waits, and `steep-boot.js` shows a small bottom banner ("A new version of Steep is
  ready — Refresh"). Tapping it messages the waiting worker to activate, then reloads once on
  `controllerchange`. Also an hourly `reg.update()` so long-lived installed PWAs notice.
  This ends the "deployed but still on the old UI / hard-reload dance" problem — no session is
  interrupted mid-brew, and the user opts in to refresh.
- **Editable dashboard.** Home cards are now a named registry rendered from a saved order + a
  hidden set (`settings.dashLayout`, synced — no migration). An "✎ Edit layout" chip enters edit
  mode: each card gets ↑ / ↓ / Hide, plus a "Hidden cards" panel to restore, and "Reset to
  default order". Cards: persona, recap, Wrapped, running-low, recent, totals, brewing clock,
  insights, what-you-brewed, most-brewed/top-rated, favorites, cost. Unknown/new cards fall back
  to the default order (forward-compatible), so future cards appear automatically. `renderDashboard`
  + the layout helpers live in steep-dashboard; edit mode clears on navigation.

## v3.26 — monthly spend overview (+ purchase-date enabler)
DB: run `v3_5-purchase-date.sql` (adds a nullable `purchase_date` to `teas`).
Deploy: `service-worker.js` (v37), `steep-data.js`, `steep-teas.js`, `steep-shopping.js`,
        `steep-core.js`, `steep-dashboard.js`.
- **Purchase date** on teas, distinct from date-added (created_at). The tea form gains a
  "Purchase date" field with a "Today" quick-set; leaving it blank means "stock I already had"
  so an initial backlog isn't counted as this month's spend. Teas added from the shopping list
  default to today. Shown on the tea detail. (Architecture enabler — also unblocks
  inventory-over-time and sharper restock timing.)
- **Spending view** (tap "Total spent" on the Home cost overview): current-month total, a
  12-month bar series (this month highlighted), avg per active month, tracked total, and the
  list of teas bought this month (tap through to the tea). Priced teas without a purchase date
  are excluded from the monthly view and summarised separately. Home cost overview also shows a
  quiet "This month: N across M teas" teaser. No new module; `computeMonthlySpend()` +
  `viewSpend()` live in steep-dashboard, `monthKey`/`monthLabel` in steep-core.

## v3.25 — brew advice
DB: run `v3_4-brew-advice.sql` (adds a nullable `feedback` column to `sessions`).
Deploy: `service-worker.js` (v36), `steep-core.js`, `steep-sessions.js`, `steep-settings.js`,
        `steep-data.js`.
- Optional one-tap **"How was this cup?"** (Just right / A bit strong / A bit weak) on the
  wrap-up and quick-log screens. Stored per session; tap again to clear. Sessions stay loose —
  it's never required.
- `computeBrewAdvice()` (steep-core) turns a tea's recent sessions into a gentle tuning of its
  brew guide: each session's signal is the explicit pick, else inferred from tasting tags
  (bitter/astringent → strong, watery/thin → weak). Net signal → a small, capped temp/time
  nudge (±6° / ±24%) off the parsed baseline.
- Session setup now shows a **Guide / Your tuning / Off** selector (replaces the v3.24 on/off
  toggle) plus a memory line ("Logged 5× · 3 just right · 2 a bit strong — suggests cooler…").
  Picking "Your tuning" prefills the adjusted schedule; the steeping strip labels it. A
  **Save this tuning as the tea's brew guide** action writes it back to the brewGuide text and
  marks a "tuned as of now" timestamp (in synced settings) so saved tunings don't re-nudge.
- Skipped for cold brew. New synced setting **Brew advice** (default on). Only one small SQL
  migration; no new tea column, no new module.

## v3.24 — brew-guide → prefilled steep schedule
Deploy: `service-worker.js` (v35), `steep-core.js`, `steep-sessions.js`, `steep-settings.js`,
        `steep-dashboard.js`.
- Parses each tea's free-text "How to brew" note into a light schedule
  (`{tempC, rinseSeconds, times[]}`) via `parseBrewGuide()` in steep-core. Rule-based and
  forgiving: gongfu slash-runs (`15s / 20s / 30s`), comma lists, `m:ss` clocks, Western
  minute steeps, °F→°C, "boiling"/"degrees"; strips grams/ml/years/infusion-counts so they
  aren't read as times; returns null when nothing usable is found (calm-first — no schedule,
  no fuss).
- Session setup shows a "From your brew guide" preview (temp · rinse · times) with a
  per-session toggle. During steeping, each infusion's timer target + temperature are
  prefilled; a quiet strip shows the plan with the current step marked and extrapolated
  steeps flagged `~` (extends past the listed steeps by repeating the last gap). Everything
  stays editable; "turn off" disables it mid-session.
- Skipped for cold brew (which already has its own single-long-steep path). New synced
  setting **Brew-guide autofill** (default on). No SQL, no CSS, no new module.
- Also in this batch: moved the **Data & account** section (export/import/move-photos/sign-out)
  off Home into the bottom of the Settings modal (reachable via ⚙, styled as a settings row).

## v3.23 — theme toggle in Settings only
Deploy: `service-worker.js` (v34), `steep-core.js`.
- Removed the header ☀️/🌙 button; appearance lives in Settings.

## v3.22 — quick-fix batch
Deploy: `service-worker.js` (v33), `steep-teas.js`, `steep-dashboard.js`,
        `steep-core.js`, `steep-settings.js`.
- Favourite-tea filter (★) in the Teas library.
- Light/Dark control in Settings (mirrors the header toggle).
- Steep Wrapped no longer counts cold-brew steep time toward "steeping time".
- Cost overview: tapping "Low stock" opens the Teas list filtered to low stock.
- Cost/session on a tea's detail (cost/gram × avg leaf per session).

## v3.21 — hotfix: shared sessions leaking into personal stats
Deploy: `service-worker.js` (v32), `steep-data.js`.
- loadKey('sessions') / steeps now filter by user_id. A social RLS policy lets
  followers read shared sessions; the unfiltered personal query was pulling those
  into your own stats, streak, insights, persona, and Wrapped. Feed unaffected.

## v3.20 — shopping list
DB: run v3_3-wishlist.sql (new `wishlist` table + RLS).
Deploy: `service-worker.js` (v31), `steep-shopping.js` (new), `steep-data.js`,
        `steep-core.js`, `steep-teas.js`, `index.html`.
- Shopping list behind a 🛒 header icon: manual entries + auto-suggested restocks
  from the forecast (low/out teas, favourites first), check-off, and "add as tea"
  (pre-fills the tea form). Wishlist writes flow through the offline queue.

## v3.19 — richer tea persona
Deploy: `service-worker.js` (v30), `steep-dashboard.js`.
- Persona blends habit signals: a title modifier (Cold-Brew / Gongfu / Nocturnal
  / Morning) on the type core, plus up to two combined subtitle traits (cadence,
  time of day, infusion depth, leaf strength, loyalty vs variety, perfect cups).

## v3.18 — vendor manager → Teas tab
Deploy: `service-worker.js` (v29), `steep-teas.js`, `steep-settings.js`.
- Moved vendor rename/merge out of Settings into an "Edit vendors" toggle beside
  "＋ Add tea" in the Teas tab, as an inline panel. Removed from Settings (pointer
  left behind). Same rename/merge logic; scales better as vendors grow.

## v3.17 — pixel font swap
Deploy: `service-worker.js` (v28), `styles.css`, `index.html`.
- Replaced Silkscreen with Pixelify Sans for the pixel display font, so 4 and 9
  are clearly distinct. "Clean" font toggle unchanged.

## v3.16 — cleanup pass
Deploy: `service-worker.js` (v27), `steep-sessions.js`, `steep-dashboard.js`.
- Cold-brew sessions skip the timed-steep flow — logged as a single long steep
  (no per-steep timer / infusion stepper).
- Streak heatmap starts at your first logged week (clamped 4–13 weeks) instead of
  a fixed 13, so a fresh log no longer shows a long empty run.

## v3.15 — Steep Wrapped
Deploy: `service-worker.js` (v26), `steep-dashboard.js`, `steep-core.js`.
- Steep Wrapped: a seasonal recap view (Northern-hemisphere meteorological
  seasons) built from existing session data — sessions, infusions, grams,
  steeping time, top tea/type, favourite time, new teas, standout cup. Dashboard
  teaser card opens it; share via Web Share API with clipboard fallback (text).
- No new infra. (Bundles the v3.14 insights cadence fix in the same dashboard file.)

## v3.14 — insights cadence fix
Deploy: `service-worker.js` (v25), `steep-dashboard.js`.
- Insights cadence now measures over the span you've actually been logging (not a
  flat 4 weeks), and phrases per-day once you're brewing daily+ ("about 2× a day
  lately"). A steady month-long 2×/week user still reads "2× a week."

## v3.13 — offline write queue
Deploy: `service-worker.js` (v24), `steep-data.js`, `steep-sessions.js`.

- **Offline write queue (Option B).** Personal-data writes (teas, vessels,
  sessions, tags, settings) are now local-first: cached immediately and queued
  on network failure, replayed FIFO on reconnect / next write / launch.
  Idempotent (upsert/delete by id); FIFO keeps foreign refs valid. "N waiting
  to sync" pill + "Synced N" toast. Non-network errors still surface.
- Offline session photos are deferred — session saves now, photo re-added when
  online. Data: URLs are never persisted to Postgres.
- Social actions and bulk import remain online-only by design.
  
## v3.12 — insights
Deploy: `service-worker.js` (v23), `steep-dashboard.js`.

- **Insights card** on Home (under the brewing clock). Reads session timestamps +
  grams for gentle, calm-first patterns: weekly cadence with a trend vs the prior
  28 days, weekend-vs-weekday lean, dominant time of day, steepiest weekday, and
  this-month-vs-last (sessions + grams). Signal-gated so rows only appear with
  enough data; the whole card hides below 5 sessions. No CSS/SQL — reuses the
  recap row + stat styles.

## v3.11 — vendor manager
Deploy: `service-worker.js` (v22), `steep-teas.js`, `steep-settings.js`, `styles.css`.

- **Vendor manager** in Settings — lists every shop you've used with its tea count; rename
  to fix typos, or type an existing name to merge duplicates. Updates the `source` on every
  affected tea (per-row writes). No popups.

## v3.10 — consumption forecast, map matching fixes
Deploy: `service-worker.js` (v21), `steep-passport.js`, `steep-dashboard.js`,
`steep-teas.js`, `styles.css`.

- **"Runs out in ~N days" forecast.** From each tea's grams-tracked sessions we estimate a
  weekly consumption rate and project when it'll run out. Shown on the tea detail ("~5g/week,
  about 2 weeks left") and appended to the Running-low card. Needs ≥2 grams-tracked sessions;
  flagged "rough estimate" until ≥4 — it genuinely sharpens as more sessions are logged.
- **Map matching fixes.** (1) Ordering bug: a Taiwan tea ("Ali Shan Fo Shou Dong Pian")
  matched China via "fo shou". Matching now trusts the origin field first, then picks the
  LONGEST/most-specific keyword, so "ali shan"/"dong pian" win. (2) Big keyword expansion for
  China (yunnan, huoshan/huang ya, wuyi, dancong, many regions), Japan and Taiwan.

## v3.9 — meditative focus mode
Deploy: `service-worker.js` (v20), `steep-core.js`, `steep-sessions.js`, `styles.css`.

- **Focus mode** during a steeping session: a "🧘 Focus mode" button opens a calm,
  distraction-free screen (no topbar/tabs) with the tea name, a teacup that fills with amber
  as the steep progresses, a large countdown, and gentle steam. Minimal controls: Start/Pause,
  Reset, "Log this infusion →" (records the time and resets for the next), and exit. The
  character-in-a-tea-garden animation is deferred until there's human-made art; this is the
  mechanic + cup-fill timer.

## v3.8 — streak regression fix, map cleanup, gaiwan app icon
Deploy: `service-worker.js` (v19), `steep-dashboard.js`, `steep-passport.js`,
`steep-teas.js`, and the new `icon-192.png` / `icon-512.png`.

- **Streak fix (regression).** The Monday-alignment shifted the grid start back without
  extending the end, so the last column ended a few days BEFORE today and recent squares
  (incl. today) fell off the grid — no green. Now the last column is anchored to the current
  week, so today is always shown.
- **World map cleanup.** Cropped to the tea hemisphere (Europe/Africa/Asia/Oceania) — the
  Americas are dropped, which zooms everything up so it's readable on mobile. Tapping a tea
  from the map now returns to the passport (back button says "Back to passport").
- **App icon.** New pixel-gaiwan `icon-192.png` / `icon-512.png` (jade bg). Replaces the old
  home-screen icon. On iOS/Android you may need to remove and re-add to the home screen to
  see it, since the OS caches the old icon.

## v3.7 — passport polish, running-low reminder, weigh-with-packaging
Deploy: `service-worker.js` (v18), `steep-passport.js`, `steep-core.js`,
`steep-settings.js`, `steep-teas.js`, `steep-dashboard.js`.

- **Passport cleanup.** Pins now render clay (were black — a CSS class wasn't applying),
  chips/teachips have proper spacing (styling inlined so it no longer depends on fresh CSS),
  map cropped of the empty far-south band. Matching now reads the tea NAME too (not just the
  origin field), so "Yunnan Silver Bud", "... Dancong", "Sencha Kagoshima" auto-place. Added
  aliases: dancong, guandong, ya bao, yashi xiang.
- **Running low** section on Home — favourited/would-rebuy teas under 2× the low-stock
  threshold, flagged "low" (red) / "getting low" (amber), tap to open.
- **Weigh with packaging** — tea form has a "weighed with packaging" checkbox + tare field
  (default from a new Settings value, 10g); net weight is stored so you needn't decant.

## v3.6 — streak date fix, world-map Tea Passport
Deploy: `index.html`, `service-worker.js` (v17), `styles.css`, `steep-core.js`,
`steep-dashboard.js`, and new `steep-passport.js`.

- **Streak fix.** All day-bucketing now uses local calendar dates instead of UTC, so
  late-evening sessions no longer land on the wrong day. Streak also no longer resets to
  0 just because today isn't logged yet (counts from yesterday). Heatmap is Monday-aligned
  with weekday labels + a caption.
- **Tea Passport** (`steep-passport.js`) — world dot-map reached from the 🌍 header button.
  Dots sized by teas owned per country; country-level matching from the `origin` field
  (country names + common regions/cultivars as keywords). Tap a pin/region → teas → tap a
  tea to open it. Unmapped-origin teas listed underneath. Sub-regions/cultivars later.

## v3.5 — modularization, header, logo, critical cache fix
Deploy: `index.html`, `service-worker.js` (v16), `styles.css`, and all `steep-*.js`
modules. **Delete `app.js` from the repo** — it's replaced by the modules.

- **Critical: service worker no longer caches Supabase data.** It was cache-first for
  everything, so added teas/photos only appeared after a hard reload. Now it caches
  only the app shell; all Supabase calls go straight to the network. Fixes the
  disappearing-data and stale-sync problems. (One hard reload after deploying v16.)
- Split `app.js` into 7 modules (above). Byte-identical behavior.
- Header redesigned: brand row (logo + 🏆 ⚙ 🌙) / tab row / full-width Log session.
- New 8-bit gaiwan logo (`steepLogoSVG()` in steep-core) — swap that one function to
  change the logo everywhere. Placeholder until human-made art.
- Dashboard → "Home". Adjustable low-stock threshold (default 15g, Settings).
  Teas tab shows owned / in-stock / low counts.

## v3.4 — streak → Sessions, weekly/monthly recap
Deploy: `app.js`, `styles.css`, `service-worker.js` (v14).
- Drinking-streak heatmap moved from dashboard to the Sessions tab (under the calendar).
- Recap card on Home with This week / This month toggle.

## v3.3 — heatmap polish
Deploy: `app.js`, `styles.css`, `service-worker.js` (v13).
- Compact heatmap; today's cell ringed; legend added.

## v3.2 — session photos
Deploy: `app.js`, `steep-data.js`, `styles.css`, `service-worker.js`. SQL: `v3_2-session-photos.sql`.
- Optional photo per session (wrap-up + quick log), shown in feed and tea detail.

## v3.1 — quick/gongfu log
Deploy: `app.js`, `steep-data.js`, `styles.css`, `service-worker.js`. SQL: `v3_1-quick-log.sql`.
- Quick log (infusion count instead of timed steeps). Quiet mode, achievements page.

## v3.0 — per-row data layer
Deploy: `app.js`, `steep-data.js`.
- Replaced whole-array blob writes with per-row insert/update/delete. Profile/follow
  reliability fixes.

---

## Known / next
- Streak counter vs heatmap likely has a UTC-vs-local date mismatch (fix + weekday labels).
- World-map Tea Passport (own page, globe icon in header) — accurate geography, dots by
  teas owned per region, tea-name click-through.
- Header cleanup follow-ups, favourites low-stock reminder, weight-with-packaging entry,
  vendor manager, predictive "runs out in ~N days".
- Backlog lives in ROADMAP-v3-next.md.
