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
4. `steep-teas.js` — tea cards, vendor list, sort/filter, `viewTeas` (Teas|Vessels segments), tea form, tea detail.
5. `steep-social.js` — friends/feed/profile/follow.
6b. `steep-passport.js` — world dot-map, origin→country matching, tea click-through.
6. `steep-sessions.js` — sessions calendar, vessels, session-edit modal, session flow
   (setup/steeping/finish/quick), timer, tags, `commitSession`.
7. `steep-boot.js` — `SteepDB.boot(init)` + service-worker registration (loads last).

Data layer stays in `steep-data.js`; Supabase keys in `supabase-config.js`.

---
## v3.50 — sweep confirm()/alert() → inline UI (sessions + teas)
Deploy: `service-worker.js` (v61), `steep-core.js`, `steep-sessions.js`, `steep-teas.js`. No SQL.
- **No more browser popups in steep-sessions/steep-teas.** New shared **`armConfirm(btn, message, onYes)`**
  (steep-core.js): a destructive button hides itself in place and shows "message · Yes / Cancel" right
  after it via DOM — non-blocking, and **no re-render**, so unsaved form fields nearby survive (verified:
  typing an edit in the tea form then arming Delete keeps the text). Any later `render()` just redraws the
  plain button. The 5 `confirm()`s converted: remove vessel, remove steep, delete session, discard session
  log, delete tea.
- **The 5 `alert()`s → `showToast`** (existing non-blocking notice): min-steep guard, "add a tea/vessel
  first", "enter a steep time", "log at least one steep".
- **Guards verified per site** (v3.37 re-entrancy): only `deleteSession` has one (`_sessionSaving`), and
  since the action now fires directly on Yes it still protects the stock-readd on a double-click — no flow
  depended on `confirm()` blocking. Verified the stock readd (20→26g) still runs exactly once.
- Remaining popups (out of scope): steep-settings bulk import / photo-migrate, and steep-core's
  offline-sync error `alert()`.

## v3.49 — brew-guide emitter round-trips exactly (+ permanent test)
Deploy: `service-worker.js` (v60), `steep-core.js`, `steep-teas.js`. No SQL.
- **`scheduleToGuideText` now emits times in raw seconds** (`75s`, not `fmtSecShort`'s `1m15s`). The
  compound `1m15s` token was unparseable by `parseBrewGuide`/`bg_extractTimes`: it read back as `60s`
  *and* truncated the run after it, so any schedule with a steep ≥60s + remainder silently corrupted
  on the schedule → text → parse round-trip. This bit **`saveTuningToGuide`** (save-tuning-as-guide),
  not just v3.48's suggestion save. Raw seconds round-trip exactly for every value.
- **`saveSuggestedGuide` now reuses `scheduleToGuideText`** (was a near-duplicate emitter) so there's a
  single, tested formatter; the KB ratio is still appended after.
- **New permanent test `fixtures/brew-roundtrip-test.js`** (82 checks): for every LEAF_PROFILES family
  (× steep counts) and every KB style, `schedule → scheduleToGuideText → parseBrewGuide` must reproduce
  the identical times, plus adversarial ≥60s-remainder cases and a guard that the emitter never emits a
  compound minute token. This is committed (unlike the CSV-driven fixtures) via a `.gitignore` exception,
  since it generates from committed source and needs no private data — so it catches this bug class for
  good, including future emitter changes. Negative-control-verified (buggy emitter fails it).

## v3.48 — Suggested brew on tea detail (for teas without a guide)
Deploy: `service-worker.js` (v59), `steep-teas.js`. No SQL.
- **Tea detail now shows a "Suggested brew" card when a tea has no saved brew guide** — the same
  schedule the session timer would generate (`effectiveGuideSchedule`'s KB/leaf-form path): temp,
  leaf ratio, and the first steeps. Clearly marked as a suggestion (calm jade-pale card, "not a saved
  guide" note), never shown when a real guide exists (that path still renders "How to brew").
- **One-line source label:** a matched KB style names itself (`Suggested brew · dancong style`);
  otherwise the inferred leaf-form family with the `· auto` marker (`Strip / open leaf family · auto`).
  Temp + ratio come from the KB when a style matched; a leaf-form-only fallback shows just the steeps.
- **Save-as-guide button** writes the suggestion into `brewGuide` (`saveSuggestedGuide`), after which
  the tea reads as a normal guided tea. Times are written in **raw seconds** (`75s`, not `fmtSecShort`'s
  `1m15s`, which `parseBrewGuide` reads back as 60s) so the saved guide round-trips to exactly the
  schedule shown; the KB ratio is appended (`4g/100ml`) and harmlessly stripped on re-parse.
- Gated on the same `brewAdvice` opt-out as the in-session generated schedule (calm-first: no generated
  guidance when the toggle is off). Verified in the browser sandbox across KB-match / leaf-form-only /
  already-guided teas + save round-trip; `node --check` green.

## v3.47 — move dashboard cards between Home and Insights
Deploy: `service-worker.js` (v58), `steep-dashboard.js`, `steep-insights.js`. No SQL.
- **Edit mode can now move a card to the other tab.** Each card's edit chrome gains a `→ Insights`
  (on Home) / `→ Home` (on Insights) chip next to ↑ ↓ Hide. `dashMoveToSurface` records a per-user
  override in `settings.dashLayout.surface` (id→'home'|'insights') that `dashSurface` layers over the
  built-in `DASH_SURFACE`; moving a card back to its built-in surface clears the override (no-op
  overrides don't accumulate). The card lands at the bottom of the destination tab; within-tab ↑ ↓
  reorder then works as before.
- **Both tabs now build the full card map** via a shared `dashCards()` (= `dashCardsHome(s)` in
  steep-dashboard + `dashCardsInsights(s)` in steep-insights, one shared `computeStats`). A moved card
  must have its HTML available on whichever tab it lands on; the old split (each view built only its
  own cards) couldn't render a card on the other surface. `viewDashboard`/`viewInsights` are now thin
  wrappers over `renderDashboard(dashCards(), surface)`.
- **Migration-safe:** old saved `dashLayout` (no `surface` key) falls through to `DASH_SURFACE`
  unchanged; `saveDashLayout` preserves the override across hide/reorder; `dashResetLayout` clears it.
- Verified in the Node/browser sandbox: cross-tab move + land-at-bottom, within-tab reorder, move-back
  clears override, reset, and surface persistence across hide ops. `node --check` green.

## v3.46 — Vessels folded into the Teas tab
Deploy: `service-worker.js` (v57), `steep-core.js`, `steep-teas.js`, `steep-sessions.js`. No SQL.
- **Nav is now Home · Teas · Sessions · Insights** — the Vessels tab is gone. Vessels live under Teas
  behind a segmented control (Teas | Vessels), following the v3.18 vendor-manager precedent of folding a
  surface into Teas. `state.teaSeg` ('teas'|'vessels') tracks the active segment; `viewTeas` renders the
  vessels segment via the existing `viewVessels()` (in `steep-sessions.js`), so vessel add/edit/delete are
  unchanged.
- **Deep-links preserved.** `goView('vessels')` and any stray `state.view='vessels'` route to
  `goVessels()` → Teas tab, Vessels segment. The onboarding "Add vessel" button and the "add a vessel
  first" guard on session start both land there. Pre-v3.46 persisted `tealog_view='vessels'` is remapped
  at init (dropped from `PERSISTED_VIEWS`). `render()` keeps a defensive `view==='vessels'` guard.
- `node --check` green on all three touched files.

## v3.45 — nav tidy: Insights last, Friends to the icon row
Deploy: `service-worker.js` (v56), `steep-core.js`. No SQL.
- **Tabs now read Home · Teas · Sessions · Vessels · Insights** — the main tab row concentrates on
  "all things tea", with Insights moved to the end (no longer the second tab).
- **Friends moved to a 👥 icon in the top action row** (next to shopping / passport / settings), via
  `goFriends()`. Frees a tab slot and keeps the primary nav tea-focused. Friends stays fully functional.
- Migration re-validated against Niklas's real saved `dashLayout` (v3.44): his reorder (wrapped before
  recap) and hidden `recent` are preserved with no cross-tab leakage. `node --check` + render suites green.

## v3.44 — Insights tab + dashboard split
Deploy: `index.html`, `service-worker.js` (v55), **new** `steep-insights.js`, `steep-dashboard.js`,
`steep-core.js`. No SQL.
- **Nav gains an Insights tab.** Home now leads with the calm, at-a-glance cards; the analytics move
  to Insights. **Home:** persona, cost overview, running-low, brewing clock, recent sessions, totals,
  favorites. **Insights:** Recap, Steep Wrapped, the Insights reading, "What you brewed" (type
  breakdown), Most-brewed / Top-rated. (Heatmap + streak stay on the Sessions tab, per Niklas — they
  were never on Home.)
- **New module `steep-insights.js`** owns the analytics cards + `viewInsights()` — the tab is the seam
  that splits `steep-dashboard.js` (~1040 → ~740 lines), addressing review finding #10. Added to
  `index.html` load order + `FILES_TO_CACHE`; module map in CLAUDE.md.
- **Surface-aware editable layout.** The `dashLayout` registry gains `DASH_SURFACE` (each card's home
  surface); `renderDashboard(cards, surface)` filters per tab, and reorder/hide work per-tab. Migration
  is automatic and lossless: existing saved `{order,hidden}` keep their visibility and gain surfaces
  from the constant — **nothing a user hid can reappear** (validated).
- **Recap gains an "All time" option** (alongside This week / This month).
- Validated in a vm sandbox against real fixtures: a representative pre-split `dashLayout` migrates with
  hidden cards preserved and no cross-tab leakage; `viewDashboard()`/`viewInsights()` render only their
  own cards — 16 checks green; all prior suites (XSS/KB/lifecycle/tea-order/brew-accuracy) still green;
  `node --check` clean.

## v3.43 — silver needle glass note
Deploy: `service-worker.js` (v54), `steep-knowledge.js`. Reference: `knowledge/brew-guides.md`
(Fujian Silver Needle entry added; removed from pending stubs). No SQL.
- `KB_STYLES.silver_needle` keeps its gongfu baseline (80°C / 1.5 / 90 s) but the note now records the
  classic **glass** method too: "also classic in glass: 80°C, ~4 min" (Teasenz / Fuding). Values
  unchanged; note only. `node --check` + KB suite green.

## v3.42 — brew accuracy: leaf-form retune + KB-first generation
Deploy: `service-worker.js` (v53), `steep-core.js`, `steep-knowledge.js`. Reference: batch-2 entries
merged into `knowledge/brew-guides.md`. No SQL.
- **`LEAF_PROFILES` retune** (from `knowledge/brew-guides.md` batch 2). The oolong/bud/compressed
  families now encode the **opening dip** (2nd steep shorter than 1st) that vendors + Niklas's logs
  confirm, and bases move to the moderate/gaiwan school: `rolled` base 45 mult [1,0.6,0.6,0.75,0.95,1.2]
  growth 1.12; `open` base 40 mult [1,0.7,0.9,1.15,1.45,1.9]; `bud` base 55 mult [1,0.8,1.0,1.25,1.6];
  `compressed` base 22 mult [1,0.9,1.0,1.2,1.5,1.9]. **Greens unchanged.**
- **KB `first` as generation base.** When `kbResolve` matches a style, its canonical first-steep length
  is used as the `generateFormTimes` base over the family base (via a new `baseOverride`), so dancong
  opens at 25s, Tie Guan Yin at 45s, etc. while sharing the family's dip/growth shape.
- **KB updates:** `ball_oolong` tempC 95 / ratio 3.5 / first 45; `longjing` tempC 78.
- Validated against real `fixtures/steeps`: generated oolong schedules land in the logged corridor —
  **Ali Shan generates 45/27/27**, matching TKK's printed 45→25→25 and inside the 60→35→60 shape; every
  oolong shows the dip. 18 brew-accuracy checks green; KB/lifecycle/tea-order/XSS suites still green;
  `node --check` clean.

## v3.41 — dancong brew baseline (knowledge layer)
Deploy: `service-worker.js` (v52), `steep-knowledge.js`. New reference file `knowledge/brew-guides.md`
(not app-loaded/cached — a growing vendor-sourced knowledge layer). No SQL.
- **Phoenix/Feng Huang dancong split into its own KB style.** New `KB_STYLES.dancong`
  (`oolong`/`strip`, **90°C**, ratio 4.0, first 25s) distilled from three vendor sources — cooler =
  sweeter, hotter = stronger; unforgiving; second steep shorter than first. Source table + rationale in
  `knowledge/brew-guides.md`.
- **Remapped the dancong-family keywords** (`dan cong`, `dancong`, `ya shi xiang`, `yashi xiang`,
  `mi lan xiang`, `phoenix`, `feng huang`, `huang zhi xiang`) from `strip_oolong` → `dancong`. Wuyi
  yancha (`da hong pao`, `rou gui`, `shui xian`, `wuyi`, `yancha`, baozhong/pouchong) stays
  `strip_oolong`. Leaf form is unchanged (both map to the `open` curve family), so `inferLeafForm`
  output for existing teas is identical.
- **`knowledge/` folder** = growing reference layer feeding KB baselines; not loaded by the app.
  Consult it when tuning brew defaults (noted in CLAUDE.md).
- Curve-retune note (deferred, in ROADMAP): all three sources — even the flash-steep gongfu school —
  show the **second steep shorter than the first**, so the opening-dip multipliers should extend to the
  oolong `LEAF_PROFILES` curves (`rolled`/`open`), not just greens.
- Validated: `kbResolve("Yashi Xiang Dancong Guandong")` → `dancong` at 90°C; aliases resolve; Wuyi
  stays strip; 32 KB checks green; `node --check` clean.

## v3.40 — tea lifecycle (finished teas)
Deploy: `service-worker.js` (v51), `steep-core.js`, `steep-teas.js`, `steep-sessions.js`. No SQL.
- **Finished vs unknown boundary.** A tea is *finished* only when its grams are **tracked** and ≤0;
  an untracked amount of 0 is treated as in-stock (unknown ≠ empty — the DB defaults `amount_grams`
  to 0, so 0 alone is ambiguous). "Tracked" = current amount >0, OR a recorded purchase quantity
  (`costOriginalGrams`), OR a session that drew it down (`gramsUsed`). New `isAmountTracked` /
  `isTeaFinished` in steep-core.
- **Teas tab** — finished teas group at the bottom under a muted "Finished" divider (count shown);
  their card shows "finished" instead of "0.0g left".
- **Session tea picker** — finished teas hidden by default behind a quiet "show finished (N)" link;
  revealed as a trailing "Finished" `<optgroup>`. They stay fully loggable (re-weighed tins, a true
  last session), and are always shown if the current selection is itself finished. A new session now
  defaults to an in-stock tea.
- **One-time "rebuy?" affordance** on a finished tea's card — Yes → shopping list (via
  `addWishFromTea`) + sets `would_rebuy`; No → dismiss. Device-local memory (`tealog_rebuyAsked`),
  no banners/modals.
- **Stats integrity:** finished teas still count everywhere (Wrapped, passport, insights, totals) —
  only the pickers and the Teas-tab default view treat them apart. No explicit archive state yet.
- Validated against real `fixtures/` (the untracked "Test" tea stays in-stock, not finished) plus
  synthetic boundary cases — 9 checks green; XSS/KB/tea-order tests still green; `node --check` clean.

## v3.39 — tea picker grouped by type
Deploy: `service-worker.js` (v50), `steep-core.js`, `steep-teas.js`, `steep-sessions.js`. No SQL.
- **Session tea picker groups teas by type** — green · white · yellow · oolong · black · puerh · herbal
  (that order), alphabetical within each group, each group a `<optgroup>` header. New shared helpers
  `TYPE_ORDER` / `groupTeasByType` / `sortTeasByTypeThenName` in steep-core.
- **Teas tab default sort is now the same "By type" ordering** (new first option in the sort dropdown;
  `state.teaSort` defaults to `'type'`). Picking any other sort still overrides it — grouping is only
  the default, not forced. (Note: this took the v3.39 slot; the planned Insights tab shifts to v3.40.)
- Validated against real `fixtures/teas_rows.csv`: group order = TYPE_ORDER, alpha within, flat sort =
  grouped concat — 9 checks green; XSS + KB tests still green; `node --check` clean.

## v3.38 — tea knowledge base (fixes leaf-form inference misses)
Deploy: `index.html`, `service-worker.js` (v49), **new** `steep-knowledge.js`, `steep-core.js`,
`steep-teas.js`. No SQL.
- **New module `steep-knowledge.js`** — a curated tea knowledge base (`kbResolve(text)` →
  `{style,type,leafForm,tempC,ratio,first,country}` by longest-alias match over style keywords +
  cultivars + regions, EN/DE terms). Loads before `steep-core` (added to `index.html` and
  `FILES_TO_CACHE`).
- **`inferLeafForm` consults the KB first** (name + cultivar + origin), then maps the KB's finer
  leafForm vocabulary onto our six `LEAF_PROFILES` families via `KB_LEAFFORM_TO_PROFILE`. This fixes
  the long-parked misses: Japanese cultivars/regions (Saemidori, Yutakamidori, Kabusecha, Kagoshima,
  Shincha…) now infer **steamed green** (`green_jp`), and silver-bud whites (Yunnan Silver Bud, Ya Bao)
  infer **bud** — previously they fell through to pan-fired/wrong families. Falls back to the existing
  name/type heuristics when the KB doesn't match; guarded so a missing KB never throws.
- **Gentle KB prefill in the tea form** — as you type a name on a *new* tea, if the KB recognises it and
  type/origin aren't already set, a dismissible "Looks like {type} from {country}" line offers **Use
  this** (calm-first: suggested, never auto-applied). leafForm is left to `inferLeafForm`. Non-`TYPES`
  KB types (e.g. herbal) are never suggested.
- Validated against real `fixtures/teas_rows.csv`: every tea infers a valid `LEAF_PROFILES` family
  (no `leafFormLabel` crash) and the parked cases resolve correctly — 25 checks green; XSS render test
  still green. `node --check` clean on all four JS files.

## v3.37 — hygiene: re-entrancy guards, date preservation, dedupes
Deploy: `service-worker.js` (v48), `steep-sessions.js`, `steep-teas.js`, `steep-social.js`,
`steep-data.js`, `steep-core.js`, `steep-dashboard.js`. No SQL.
- **Re-entrancy guards** on `deleteSession` (shared `_sessionSaving`) and the three async form
  submits — `submitTeaForm`, `submitVesselForm`, `submitProfile` (per-form `_*Saving` flags, set on
  entry, cleared in `finally`). Each does an `await` before mutating `state`, so a double-tapped
  Save/Delete could otherwise double-apply (a duplicate tea/vessel, or a double stock add-back on
  delete — the same class as the v3.35 commitSession fix, which now guards delete too, forward-safe
  for when the legacy `confirm()` is replaced with inline UI).
- **Preserve original creation date across import/restore.** `teaToDb` now sends `created_at` when
  `t.dateAdded` is present (a no-op on update since dateAdded mirrors the DB value; an insert-time
  preserve for imported teas) and omits it when absent so new rows still get the default `now()`.
  Fixes restored teas all looking brand-new — wrong "newest" sort and Wrapped "teas you met".
- **Dedupe:** the persisted-view allowlist is now one `PERSISTED_VIEWS` const (was duplicated in init
  restore + `saveView`); the time-of-day bucketing is one `timeOfDayBuckets()` helper (was inlined
  verbatim in Insights + Wrapped). Cut the unused exported `getFollowers`.
- Validated: `node --check` on all six files; a guard/mapper logic test (guarded double-fire pushes
  once vs twice; created_at sent/omitted correctly) and the v3.36 XSS render test both green.

## v3.36 — security: escape all user text in rendered HTML (XSS fix)
Deploy: `service-worker.js` (v47), `steep-core.js`, `steep-social.js`, `steep-teas.js`,
`steep-sessions.js`, `steep-dashboard.js`, `steep-shopping.js`, `steep-passport.js`,
`steep-settings.js`. No SQL.
- **One shared `escapeHtml` (+ `escapeJsArg`) in `steep-core.js`**, and every render site that
  interpolates user-entered text now escapes the data value (never the surrounding markup). Replaces
  the four inconsistent per-module `esc()` copies (teas ×2, shopping, dashboard, passport).
- **Fixes stored cross-user XSS in the social feed** (the #1 finding): another user's `displayName`,
  `bio`, `username`, session `description`, `teaName`, `tags`, `vesselName`, and `photoUrl` were
  rendered raw into `innerHTML`, so a crafted profile/shared session ran arbitrary JS in every viewer's
  session. Now escaped. Also swept all own-content surfaces (tea/vessel/session/steep names, notes,
  origin/cultivar/source, brew guide, tags, wishlist, spend/recap/Wrapped/rankings, form value attrs).
- **`escapeJsArg` for inline `onclick` string arguments** — JS-string-escape then HTML-escape, so a
  value dropped into `onclick="fn('…')"` can't break out of the JS string or the attribute.
- Validated with a fixture-driven render test (`fixtures/xss-render-test.js`, gitignored): a tea named
  `<img src=x onerror=alert(1)>` plus a quotes/umlauts description renders **inert** (escaped, no live
  `<img>`/`<script>`) through the real render functions, while umlauts and quotes still display
  correctly — 24 checks green. `node --check` clean on all nine changed files.

## v3.35 — fix: double stock decrement on save (re-entrancy guard)
Deploy: `service-worker.js` (v46), `steep-sessions.js`. No SQL.
- **Logging a session no longer subtracts `gramsUsed` from tea stock twice.** Root cause was a
  re-entrant double-fire of `commitSession` (async, with an `await resolveDraftImage()` gap before the
  decrement and `state.sessionDraft` cleared only at the end, and the Save button never disabled): a
  second tap read the same draft and applied the read-modify-write stock decrement to the same in-memory
  tea again — subtracting twice and pushing a duplicate session. Fixed with a shared `_sessionSaving`
  re-entrancy guard (set on entry, cleared in `finally`) on both `commitSession` and `saveSessionEdit`.
  The offline write-queue was ruled out — it replays absolute-value `putTea` upserts, which are
  idempotent. Verified against real exported rows (`fixtures/`) with a Node repro: the two-overlapping-
  saves case went 32g→20g (two sessions) before, 32g→26g (one session) after; the queue-replay case was
  correct both ways. (`fixtures/` is gitignored — repro not committed.)

## v3.34 — settings declutter + vessel edit (map parked)
Deploy: `service-worker.js` (v45), `steep-core.js`, `steep-settings.js`, `steep-sessions.js`. No SQL.
- **Settings grouped into sections.** The flat list was getting long; now organised under labelled
  headings (`.eyebrow`): Brewing · Brew guidance · Session check-in · Inventory · Appearance ·
  Calm & achievements · Data. No behaviour change, just scannability.
- **Hide the mood check-in.** New `showMood` setting (default on) under "Session check-in". Off hides the
  "how are you feeling?" step in session setup and in the edit modal — but the edit modal still shows it
  for any session that already has a mood recorded, so nothing gets trapped. (This one switch is the
  intended future Garmin on/off for the correlation epic.)
- **Brew-guide + advice grouped.** Both toggles now live under one "Brew guidance" block, each still
  independently switchable (or both off). Same `brewGuideAutofill` / `brewAdvice` settings, reorganised.
- **Change the vessel on a saved session** (ships in this batch). Edit-session modal gains a Vessel
  selector (shows capacity where set); Save recomputes `vesselName`; a since-deleted vessel keeps its
  old name as the current option so nothing silently changes.
- **Map: parked, not shipped.** The v3.33 dot-map (and a legibility pass built on it) was rejected —
  you can't recognise countries/borders, "just dots." Held pending a redesign with drawn country
  outlines. The parsing layer is reusable; only the dot rendering gets replaced. See ROADMAP/STATE.

---
## v3.33 — curated passport: sub-regions + China/Japan zoom
Deploy: `service-worker.js` (v44), `steep-passport.js`, `steep-core.js`. No SQL.
- **Sub-region layer on the tea passport.** Beyond the country pins, teas now resolve to a
  curated sub-region (`PASSPORT_SUB`) placed by real lat/lon on the same grid — Kagoshima, Fukuoka,
  Uji, Shizuoka (Japan); Yunnan, Guangdong, Fujian, Zhejiang, Anhui, Guangxi (China); Alishan, Nantou,
  Lishan (Taiwan). `passportSubFor(country,tea)` matches within the parent country only (origin first,
  then name — so "Ali Shan…" places even when origin is just "Taiwan"), longest-alias-wins.
- **Tap China or Japan → zoom into sub-regions.** Selecting a zoomable country retargets the SVG
  viewBox to a window around it (reuses the existing `PASSPORT_LAND` dots — no new geometry) and draws
  sub-region pins sized by tea count, plus a faint marker for region-unspecified teas. "← Zoom out"
  returns to the overview; zoomable countries carry a dashed amber ring + `⊕` on their chip.
- Detail panel gains sub-region chips (incl. "Region unspecified"); tapping one filters the tea list.
- Verified with the real library in a Node sandbox: Japan→Kagoshima ×3 / Fukuoka ×1; China→Guangdong,
  Yunnan, Anhui (Huoshan Huangya) + 2 unspecified; Taiwan→Alishan (from name); all render paths clean.
- New `state`: `passportZoom`, `passportSub` (reset on view change). No schema change.

---
## v3.32 — forecast coverage + brew-guide parse + reload fixes
Deploy: `service-worker.js` (v43), `steep-dashboard.js`, `steep-core.js`, `steep-teas.js`. No SQL.
- **Stock forecast now covers any brewed tea.** Old rule needed 2+ grams-logged sessions, so a tea
  with one weighed session (or sessions where grams weren't typed) showed nothing — while purchase-date
  teas predicted from the ledger. New model = **frequency × dose**: sessions/day (across *all* the tea's
  sessions, incl. cold brew and grams-less ones) × average logged dose, needing just one grams entry to
  anchor. Ledger still preferred when present. (Kabusecha/Ruby/Sencha/Huang Ya now predict.) `teaForecast`.
- **Brew-guide parser — range spreading.** A lone time-range now spreads start→end across the infusion
  count: `60-75°C, 15-30s, 3 infusions` → 68°C, steeps [15, 23, 30] (was one 23s steep). Temperature
  ranges read as midpoint (`60-75°C` → 68°C). German "Aufguss/Aufgüsse" counts recognised. Multi-range
  guides (DHP `10-15s / 15-20s`) still read as one steep each. `parseBrewGuide`.
- **Reload stays on the tea.** Viewing a tea and refreshing now restores that tea's page instead of
  bouncing to Home (tea-detail route persisted alongside the tab route). `openTeaDetail`/boot restore.

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
