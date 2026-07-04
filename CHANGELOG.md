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
