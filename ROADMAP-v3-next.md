# SlowCup — roadmap (single source of truth)

(App renamed Steep → SlowCup, user-facing brand only, v3.59. Internal names/repo/URL keep "steep".)

Tiered by value × ease. Effort: S / M / L. "Heavy infra" = an Edge Function,
packaging, or a map/vision library; a plain new Supabase table is NOT heavy.
Anything finished lives under **Shipped**. The **Agreed sequence** below is the
authoritative order for what's next; everything under it is reference/backlog.

## Agreed sequence (next deploys) — authoritative ORDER
Agreed with Niklas 2026-07-08. **Order is authoritative; version numbers are NOT** — they're
assigned at ship time (see CHANGELOG / Shipped), because items get pulled forward out of order.
Each item is one deploy unless noted; follow the deploy ritual in CLAUDE.md (bump `CACHE_NAME`,
update CHANGELOG/STATE, validate against fixtures). Shipped so far: v3.38 KB · v3.39 tea picker ·
v3.40 tea lifecycle.

1. ~~**Insights tab + dashboard split**~~ ✓ **shipped v3.44** (review finding #10). New
   `steep-insights.js`; nav gains Insights (recap/Wrapped/insights/type-breakdown/most-brewed);
   Home keeps persona/cost/running-low/clock/recent/totals/favorites; heatmap+streak stayed on
   Sessions (they were never on Home). Surface-aware `dashLayout` (`DASH_SURFACE`), per-tab
   reorder/hide, lossless migration. Recap gained an "All time" option (was a Tier backlog item).

1b. ~~**Greeting card v2 — window-aware**~~ ✓ **shipped v3.55** (Niklas's idea, per
   `TASK-brew-advice-v2.md` §1). The greeting no longer suggests a brew at a time the user never
   brews: buckets are "active" (≥2 sessions or ≥15% of total, ≥5-session floor), and an inactive
   current bucket redirects the suggestion forward to the next active window with forward-looking
   copy. `greetingCardHTML` in steep-dashboard.js; validated in `fixtures/greeting-test.js`.

2. **Next — Brew advice v2** (per `SPEC-brew-advice-v2.md` + `TASK-brew-advice-v2.md` in Downloads,
   DECIDED). The missing 3rd advice axis: leaf-to-water ratio. Sequenced (D5) — **v3.56** capacity
   precursor, then **v3.57** ratio phase 1 (pause after each deploy):
   - ~~**Capacity-capture precursor**~~ ✓ **shipped v3.56** (steep-sessions.js). Vessel form
     Capacity gains a soft hint + example placeholder (still optional); vessels list shows a quiet
     "· ml?" tap-to-edit affordance on capacity-less vessels; session setup shows an inline
     "set capacity" link under the Vessel picker when the chosen vessel lacks one (opens the edit
     overlay, session draft persists behind it). No banners, never blocks logging.
   - ~~**Ratio phase 1.**~~ ✓ **shipped v3.57**. `actualRatio = gramsUsed/(waterMl/100)` vs a per-method
     baseline (guide grams+ml via `bg_extractRatio` → KB method ratio → per-`LEAF_PROFILES` default);
     scales the whole schedule by `clamp(1/ratioFactor^0.6, 0.6, 1.4)` before feedback tuning. Temp NOT
     adjusted. **Default OFF, strict opt-in** (`ratioAdjust`, Settings → Brew guidance). **Dual-method
     KB** (`ratioGongfu`/`ratioWestern`) + raised JP-green westerns (agreed w/ Niklas 2026-07-09).
     Per-session Gongfu|Western switch + `waterMl` override; `sql/v3_8-water-ml.sql` (`water_ml` +
     `brew_style`) applied, mapper pairs + both write paths. Validated `fixtures/ratio-test.js` (local,
     47) over all 10 real sessions — the two −40% floors became gentle trims. Absorbed "partial fill".
   - *Learned defaults* = **phase 2**, gated on phase-1 data (separate spec). Now unblocked: sessions
     store `brew_style` so phase 2 can normalise real steep times within-method. **This is the next
     brew-advice item.**
   - ~~**Oolong opening-dip curve retune**~~ ✓ **shipped v3.42** — `rolled`/`open`/`bud`/`compressed`
     now encode the opening dip; matched KB style's `first` supplies the generation base. Validated
     against `fixtures/steeps` (Ali Shan generates 45/27/27, in the logged corridor). Follow-on:
     learned defaults (brew-advice v2 phase 2) refine these from real "good" sessions.

**Open design decisions (2026-07-08) — RESOLVED:**
- ~~**Pixel-font replacement**~~ ✓ **shipped v3.53** — Pixelify Sans → IBM Plex Mono via `--font-mono`;
  Google-Fonts weight swapped, Pixel/Clean toggle + `monoFont` retired, eyebrow tracking `.1em → .06em`.
- ~~**Persona-slot replacement**~~ ✓ **shipped v3.54** — a ritual-first **greeting card** (greeting line +
  one deterministic-per-day same-time-of-day tea suggestion, no identity labels). Home works without one.
  Optional low-priority rider (Niklas OK'd, NOT yet done): where `inventorySparkline` renders nothing
  because a tea has no `purchaseDate` anchor, show a quiet "add a purchase date to see the stock curve"
  link to Edit — a separate tiny deploy or its own issue.

3. **Then — the SlowCup batch** (per `TASK-slowcup-batch.md`, agreed 2026-07-09, supersedes the
   forgotten-batch TASK; small independent deploys, **pause after each**):
   - ~~**Rename Steep → SlowCup**~~ ✓ **shipped v3.59** — user-facing brand only (title, manifest,
     topbar/login/onboarding, Wrapped labels+eyebrows+share text, backup filename+import toast,
     update banner, migration screen). Internal names, `steep-tea-log` repo/URL/cache prefix, and
     "steep" tea terminology untouched. Repo/URL rename deferred to the slowcup.app migration.
   - ~~**Tea lifecycle / at-0g**~~ ✓ **shipped v3.40** (finished-teas grouping + hidden-in-picker +
     one-time rebuy? → shopping list). A full **archive/restore workflow** (hide from library entirely,
     restore later) is deferred — the finished view + rebuy nudge cover the need for now.
   - ~~**Popup sweep (rider, completes v3.50)**~~ ✓ **shipped v3.58** — last 8 `alert()`/`confirm()`
     gone; import replace-all kept as a state-driven inline confirm row (both counts, full friction);
     offline sync-failure → long-lived toast (`showToast(msg,ms)`). Only `socialErr` remains (online-only).
   - ~~**Error log + data health + feedback link**~~ ✓ **shipped v3.60** (Settings → Data).
     `window.onerror` + `unhandledrejection` + `saveErr` → device-local `tealog_errorLog` ring buffer
     (20), View/Clear, never proactive. On-demand `dataHealthReport()`: deleted-tea/-vessel sessions,
     negative stock, empty sessions (client-visible stand-in for DB-orphaned steeps — the sessions
     load drops those), duplicate pairs (same tea ≤10 min, v3.35 signature). `mailto:slowcupapp@gmail.com`
     feedback row. Validated `fixtures/data-health-test.js` (local): real export clean on all 5.
   - ~~**Greeting copy variety**~~ ✓ **shipped v3.61** — each greeting branch draws from a small
     approved pool via `d_copyPick(pool,todayKey)` (`d_hash(todayKey+'|copy') % len`), one voice per
     calendar day, seeded apart from the tea pick (steep-dashboard.js). Rode with a new `APP_VERSION`
     const (steep-core.js) → feedback mailto subject + Settings footer label; deploy ritual bumps it
     now. `fixtures/greeting-test.js` → 30 assertions (pool membership + variety + name-link + same-day
     determinism). Edge flagged: active-with-history line 3 = "this late-night" for night-active users.
   - ~~**Freshness cues + sparkline rider + night-copy patch**~~ ✓ **shipped v3.62** (steep-teas.js +
     steep-dashboard.js). One soft italic line under Harvest on tea detail: fresh greens "at its best
     young", whites/pu-erh "deepens with age"; requires a valid year (season optional), silent on
     garbage/neutral styles — exactly 2 fire on real data. Rider: "add a purchase date" link where
     `inventorySparkline` is absent only for want of a date. Night-copy: active-with-history line 3 →
     "tonight" not "this late-night". Validated `fixtures/freshness-test.js` (local, 11) + greeting (32).
   - **Feed pagination** — `.range()` paging + quiet "load more" (no infinite scroll); page size =
     current cap; verify the shared-session mapper appends page 2+ without duplicate keys. **Fold in**
     `socialErr`'s `alert()` → a sticky inline notice on the social view (multi-sentence setup
     diagnostics, so not a toast) — same file, per `TASK-cleanup-and-issues.md` housekeeping.
     **(Deferred behind the design rework below — still the SlowCup batch's last item.)**

4. **Design rework — 4 workstreams** (`design_handoff/` in Downloads, high-fidelity prototypes; order
   WS3 → WS1 → WS4 → WS2; own deploy each, **pause after each**). Shared language in `DESIGN.md`.
   - ~~**WS3 — design language**~~ ✓ **shipped v3.63**. Shippori Mincho display font (`--font-display`),
     hairline stroke icon sprite + `icon()` helper (header emoji retired), tea-leaf favourite mark
     (`favLeaf`), ensō timer ring (`--enso`), hanko+seigaiha defs staged for WS1/WS2.
   - ~~**WS1 — SlowCup Wrapped**~~ ✓ **shipped v3.64**. `viewWrapped()` (steep-insights.js) is now a
     horizontal CSS scroll-snap sequence of up to 8 full-width `.wrap-card` story cards (seasonal
     jade/amber/porcelain wash via `--wc-*` tokens + catalogue numbering + hanko-sealed standout).
     Dot indicators track scroll + are tappable (`wrapGo`, the only JS besides `shareWrapped`, in
     bindDynamic). `wrappedKinds()` degrades gracefully — missing-stat cards drop and numbering
     re-flows; time card falls back to cold-brew count. Kept share-as-text (reworded), empty state,
     the name. Validated `fixtures/wrapped-cards-test.js` (committed, 22); both themes browser-checked.
   - ~~**WS4 — slowcup.app landing**~~ ✓ **shipped**. New self-contained `landing.html` at repo root +
     `landing-assets/*.png` — inline CSS/SVG, Google Fonts, **no JS/cookies/analytics**, theme via
     `@media (prefers-color-scheme)`. Nav · hero (Shippori "The calm tea log." + amber ensō) · 3 device
     screenshots · 3 philosophy beats · jade-deep CTA panel (seigaiha + amber button) · footer. CTAs are
     `mailto:slowcupapp@gmail.com`. **No cache/APP_VERSION bump** (zero PWA files touched). Both themes +
     mobile browser-verified. **TODO before slowcup.app goes live:** reshoot the placeholder screenshots
     (bundle ones predate WS3/WS1; the tea-detail one still shows the old "Steep" wordmark), and decide the
     root/index split for the domain (part of the deferred domain migration).
   - **WS2 — Insights overhaul** — remake `viewInsights()` as the reflective room: one hero observation
     (jade-pale), a reusable tiny data-viz family (sparkline/type-bar/time-of-day/steep-shape), hairline
     top-borders not boxed cards, observations-not-KPIs copy, quiet Wrapped teaser. Inherits WS3+WS1.

## Shipped
Core: data layer + per-row writes, quick log, modularization, library search/filter/sort,
first-run onboarding + empty states, basic tea passport, basic meditative focus mode,
restock forecast ("runs out in ~N days").
- v3.12 Insights card · v3.13 Offline write queue · v3.14 Insights cadence fix
- v3.15 Steep Wrapped · v3.16 cold-brew skips steeps + heatmap starts at first session
- v3.17 pixel font → Pixelify Sans · v3.18 vendor manager → Teas tab
- v3.19 richer habit-driven persona · v3.20 shopping list (🛒) + restock suggestions
- v3.21 hotfix: followed users' shared sessions no longer counted in personal stats
- v3.22 quick-fix batch (favourite filter, light/dark in Settings, Wrapped ignores cold-brew
  steep time, cost→low-stock link, cost/session) · v3.23 theme toggle → Settings only
- v3.24 brew-guide → prefilled steep schedule (`parseBrewGuide`) · v3.25 brew advice (feedback
  → capped temp/time tuning; `feedback` column)
- v3.26 monthly spend + purchase-date enabler (`purchaseDate`) · v3.27 update-prompt banner +
  editable dashboard (`dashLayout`) · v3.28 inventory-over-time + restock v2
- v3.29 leaf-form steep curves (`LEAF_PROFILES`, `leafForm`) · v3.30 in-session micro-adjust
  (`timeShift`; "how was that pour?" ±5s)
- v3.31 mood check-in (`mood`, `showMood` toggle) · v3.32 forecast coverage + brew-guide parse
  fixes (range spread, freq×dose, reload-to-Home)
- v3.33 curated passport sub-regions + China/Japan zoom · v3.34 settings declutter + change
  vessel on a saved session *(both passport pieces later parked)*
- **v3.35** fix double stock decrement (re-entrancy guard on commitSession/saveSessionEdit)
- **v3.36** security: escape all user text in rendered HTML — shared `escapeHtml`/`escapeJsArg`,
  fixed stored cross-user feed XSS, replaced 4 local escapers
- **v3.37** hygiene: re-entrancy guards (deleteSession + 3 form submits), `created_at` preserved
  on import, deduped view-allowlist + time-of-day helper, cut unused `getFollowers`
- **v3.38** tea knowledge base (`steep-knowledge.js`; KB-backed `inferLeafForm`; tea-form prefill)
- **v3.39** session tea picker grouped by type + Teas-tab default "By type" sort (`TYPE_ORDER`,
  `groupTeasByType`)
- **v3.40** tea lifecycle — finished teas (`isTeaFinished`/`isAmountTracked`): group at bottom of Teas
  tab, hidden-by-default in the session picker, one-time "rebuy?" → shopping list. (No explicit
  archive state yet — deferred; see below.)
- **v3.41** dancong brew baseline — split Phoenix dancong into its own `KB_STYLES` style (90°C,
  ratio 4); new `knowledge/brew-guides.md` reference layer feeding the KB.
- **v3.42** brew accuracy — `LEAF_PROFILES` retune (opening dip on oolong/bud/compressed, moderate
  bases); matched KB style's `first` used as the generation base; KB ball_oolong 95/3.5/45, longjing 78.

## Cut from the roadmap (decided 2026-07-08)
Removed entirely — off-brand for calm-first (gamification-as-engagement is the opposite of
ritual-over-metrics):
- **XP / levels on achievements.**
- **8-bit rewards shop / "tea-corner room" + reward unlocks.**

## Frozen — not now (with reason)
Not cut, but explicitly parked with the reason, so we don't re-litigate each session:
- **Install guide** — SKIPPED for now (decided 2026-07-09). It interacts with the **slowcup.app**
  domain decision: installed PWAs bind to their origin, so pushing installs under `github.io` before
  the domain settles would orphan them. Revisit once the domain is decided (then: install guide →
  beta package). **Time-sensitive (2026-07-10):** the SlowCup name is public in a public repo since the
  v3.59 rename — register `slowcup.app` sooner rather than later to avoid a squat.
- **Brew-advice phase 2 (learned defaults)** — WAITS on a monitoring window (decided 2026-07-09;
  gate concretized 2026-07-10). Niklas logs ~2 sessions/day (10–14/week), so the gate — **≥15 ratio'd
  sessions with feedback answered, spanning both methods** — lands in ~1.5–2 weeks: **review ~2026-07-20
  to -24**. On that date Niklas sends fresh CSV exports and the phase-2 spec gets drafted (claude.ai
  side). **Prerequisite:** `ratioAdjust` must be ON for the window to count. Sessions already store
  `brew_style` so phase 2 can normalise real steep times within-method.
- **German i18n** [L] — large string-extraction pass; not worth it at private-beta scale (a
  handful of EN/DE-comfortable testers). Revisit only if the audience widens.
- **TWA / APK (PWABuilder / Bubblewrap) & Capacitor native** — the installable PWA already
  covers "on my phone"; an APK adds store overhead + a signing key for **no new capability
  yet**. Revisit when push or the label scanner actually needs a native shell.
- **Comments + light notifications** [L] — social is a minor surface; comments need a table +
  moderation + a notifications surface for little payoff at this scale. Frozen behind feed
  pagination + likes proving the feed gets used.
- **Label scanner** [M/L] — needs the first Edge Function + a vision model; the heaviest single
  bet. Frozen until there's a clear pull and appetite to stand up server-side infra.

## Passport — PARKED (dot-map approach rejected)
Shipped as a curated dot-map (v3.33 sub-regions + China/Japan zoom; v3.34 smaller pins + name/count
labels + wider zoom). **Niklas's verdict (2026-07): not good enough — you can't recognise countries or
borders, "just dots basically."** The dot-grid was the wrong foundation. **Parked pending a redesign
toward a real map with drawn country outlines + borders.** Next-attempt decision to make first:
  - **Approach:** lightweight SVG outline map — a hand-simplified / low-poly outline set for just the
    tea countries (China, Japan, Taiwan, India, etc.), NOT a full world GeoJSON. Keeps it calm + small,
    but gives recognisable borders. Alternatively a small pre-simplified TopoJSON of only tea nations.
  - Then: shade each country by tea count (choropleth), and keep the China/Japan sub-region drill-down
    (sub-regions as filled areas or labelled points inside the drawn country).
The parsing/aggregation layer (`passportCountryFor`, `passportSubFor`, `PASSPORT_GEO`, `PASSPORT_SUB`)
is REUSABLE — only the rendering (dots → outlines) gets replaced. Old follow-ups (heat-shading,
more zoomable countries, cultivar layer) fold into that redesign.

## Stock model — PARKED (derive from a ledger, not a running scalar)
**Status: parked spec, not scheduled.** Prompted by the v3.35 double-decrement fix.
**Problem.** `tea.amountGrams` is a single running number, mutated read-modify-write on every
session save/edit/delete (`commitSession`, `saveSessionEdit`, `deleteSession`). Any double-fire,
offline-queue replay against a stale baseline, or edit computed off the wrong starting value
corrupts it — and the error is silent and permanent (there's no source of truth to recompute from).
v3.35 guarded the specific double-fire, but the whole *class* of bug stays as long as stock is an
accumulator.
**Direction.** Stop storing on-hand as a mutable scalar; make it a **fold over an append-only
ledger** of stock events for each tea, so `on_hand = Σ(ledger)`. Event kinds:
  - `purchase` / `refill` (+g) — seeded from `purchase_type` + `cost_original_grams`, or a top-up.
  - `session` (−`gramsUsed`) — *derived directly from the sessions table*, not written separately,
    so it can never double-count and edits/deletes recompute for free.
  - `adjustment` (± to an explicit value) — see the caveat; this is load-bearing, not optional.
Recomputing from the ledger is idempotent under replay, double-fire, and edit **by construction**,
is auditable, and gives the inventory-over-time sparkline a real series instead of the current guess.
**CAVEAT — stock cannot be *purely* derived (spec is incomplete without this).** The user manually
corrects `amountGrams` after **re-weighing on a scale** — physical measurement that overrides any
computed figure (leaf humidity, spillage, uncounted sampling, guessed session doses all drift the
math). A pure `purchased − Σ gramsUsed` model would fight those corrections and lose. So the ledger
**must** include explicit `adjustment` entries: a re-weigh records "measured = X g at time T" as a
correction event, and the fold treats it as a new anchor (on-hand = measured value at T, then ±
subsequent events). Today's "edit the grams field" becomes "append an adjustment", never a silent
overwrite of the scalar.
**Migration.** Seed one `adjustment` (or `purchase`) per tea from the current `amountGrams` as the
opening anchor, so no history is fabricated and existing numbers carry over exactly.
**Effort / infra.** M. New `stock_events` table (or a JSON ledger column) + RLS; a fold helper;
rework the three mutation sites to append events; backfill migration. No heavy infra. Parked until
there's appetite — the v3.35 guard holds the line in the meantime.

## Unscheduled backlog (current stack, no date)
Genuinely open, not sequenced/cut/frozen. Pull into a deploy when it fits:
- **Streak grace day** [S] — one grace/freeze day so a single miss doesn't reset the run.
- **Alternative timer animation** [S/M] — cup filling/emptying as the steep runs.
- **Paused days (holiday / sick)** [M] — mark days exempt; heatmap stripes; excluded from streak/
  insights. (Also an enabler for the Garmin epic's exempt days.)
- **Onboarding / feature-discovery pass** [M] — features surface on thresholds; light guided intro.
- **All-time option** — ✓ recap gained "All time" (v3.44); Wrapped is still season-scoped (a
  Wrapped all-time/annual view remains open if wanted).
- **Per-user profile page** [M] — tap a feed author → their shared sessions (RLS already supports it).
- **Likes / reactions** [M] — small table + RLS; lighter than comments (which are frozen).
- **Collection achievements + milestones** [S/M] — types/regions/cultivars (gated behind the
  existing achievements toggle; NOT XP — that's cut).
- **Accessibility pass** [M] — focus, contrast, haptics, skeletons.
- **Meditative mode: gong-fu cup + stay-in-focus** [M] — extends the basic focus mode (art =
  human-made for public release).
- **Cultivar map** [M/L] — after the passport redesign lands (reuses that rendering).
- **Weight-with-packaging** [S/M] — finish the tare UI (`defaultPackagingTareG` setting exists).

## Tier 4 — later / speculative (heavy infra)
- **Garmin Connect + caffeine/sleep** [L, new infra] — pull sleep & activity (OAuth), don't surface
  actively, correlate with tea (+ coffee as a quick caffeine entry) to hint at sleep effects. Needs a
  slowly-built **caffeine-content database**. **Normal mode only — never Quiet/Calm.** Build incrementally.
- **Orphaned-photo cleanup** [M] — scheduled Edge Function or on-delete hook (pairs with the first
  Edge Function whenever that lands).
- Colour-shifting theme · high-altitude/old-tree achievement · 8-bit gaiwan logo (art-blocked) ·
  southern-hemisphere Wrapped · block/report · water-profile presets · importers.

## Architecture enablers (build these and later features get cheap)
- ~~**Purchase-date + added-vs-bought flag**~~ ✓ v3.26 · ~~**Editable-dashboard persistence**~~ ✓ v3.27
  (the reusable configurable-surface pattern — carries the v3.39 Insights-tab split).
- ~~**Leaf-form curves + knowledge base**~~ ✓ v3.29/v3.38 (`LEAF_PROFILES` + `kbResolve` — the KB now
  feeds inferLeafForm, the tea-form prefill, and the brew-advice-v2 baseline ratio).
- **Per-session `waterMl`** (v3.41, `sql/v3_8-water-ml.sql`) → unlocks ratio advice + absorbs partial fill.
- **Caffeine field on teas** (build incrementally) → foundation for the Garmin/sleep epic.
- **Paused-days concept** → holiday-aware stats now; reused by the sleep epic's exempt days.
- **First Edge Function** (via push OR scanner) → amortizes infra for push + scanner + photo-cleanup.
- **Brew-guide parser** → reused by brew-advice tuning, "apply guide to steeps", and grams+ml capture
  for ratio (extend `bg_extractGrams` to capture instead of strip).

## Bugs / ideas / feedback → GitHub issues
Open issues (`Tosinik/steep-tea-log`, public) are the live queue alongside this roadmap — fetch at
session start (see CLAUDE.md). Labels: `bug` / `idea` / `feedback`. Currently open: **#1** in-session
`d_setBrewMode('off')` gives weird feedback mid-session (fold into a batch deploy).
