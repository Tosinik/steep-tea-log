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
