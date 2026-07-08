# Steep — roadmap (single source of truth, post v3.22)

Tiered by value × ease. Effort: S / M / L. "Heavy infra" = an Edge Function,
packaging, or a map/vision library; a plain new Supabase table is NOT heavy.
Anything finished lives under **Shipped** — tiers below hold only open work.

## Shipped
Core: data layer + per-row writes, quick log, modularization, library search/filter/sort,
first-run onboarding + empty states, basic tea passport, basic meditative focus mode,
restock forecast ("runs out in ~N days").
- v3.12 Insights card · v3.13 Offline write queue · v3.14 Insights cadence fix
- v3.15 Steep Wrapped · v3.16 cold-brew skips steeps + heatmap starts at first session
- v3.17 pixel font → Pixelify Sans · v3.18 vendor manager → Teas tab
- v3.19 richer habit-driven persona · v3.20 shopping list (🛒) + restock suggestions
- v3.21 hotfix: followed users' shared sessions no longer counted in personal stats
- v3.22 quick-fix batch: favourite-tea filter, light/dark in Settings, Wrapped ignores
  cold-brew steep time, cost-overview→low-stock link, cost/session on tea detail
- v3.23 theme toggle removed from header (Settings only)
- v3.24 brew-guide → prefilled steep schedule (parse brewGuide → temp/times, autofill each
  steep's timer + temp, per-session opt-out; `parseBrewGuide` in steep-core)
- v3.25 brew advice (optional "how was it?" per session → gentle capped temp/time tuning of a
  tea's guide; Guide/Tuning/Off selector, memory line, save-tuning-to-guide; `feedback` column)
- v3.26 monthly spend overview + purchase-date enabler (tea `purchaseDate` distinct from
  date-added; Spending view with 12-month bars, this-month list, undated summary)
- v3.27 update prompt ("new version — Refresh" banner; SW waits for opt-in) + editable dashboard
  (reorder/hide/restore Home cards, synced `dashLayout`; forward-compatible registry)
- v3.28 inventory-over-time + restock v2 (`teaForecast` prefers a purchase-date ledger — net
  drawdown since you bought it — over the session-span guess; inventory drawdown sparkline on tea
  detail: spine purchase→now + dashed projection to run-out; `inventoryHistory`/`inventorySparkline`)
- v3.29 leaf-form steep curves + seconds-first advice (six-family `LEAF_PROFILES` by leaf morphology
  drive the steep progression; `leafForm` field, name-first inference; leaf-form-generated schedules
  when there's no guide; `parseBrewGuide` handles ranges/ordinals/"add Ns"; advice shows ≈+Ns/steep)

## Brew-guide rework — done ✓
v3.29 leaf-form curves + `leafForm` field + seconds display + parser hardening ·
v3.30 in-session micro-adjust (manual edits carry forward via `timeShift`; "How was that pour?" ±5s).
Later (own items): **learned defaults** (good sessions' real times → family baselines, gated on ratio
normalization); optional per-form default temps; roll a consistent in-session nudge into saved tuning.

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

## Beta feedback backlog (batch)
- Leaf-form inference misses (PARKED, together): Japanese cultivars/regions (saemidori, yutakamidori,
  kabusecha, kagoshima, shincha…) → steamed green; silver-bud whites → `bud`. Infer from the existing
  `cultivar`/`origin` columns, not just `name`.
- In-session "turn off" link gives weird feedback — investigate.
- ~~Wrong first-steep time on ranges~~ ✓ v3.32 (spread across infusion count). ~~Cold-brew/1-session
  teas get no forecast~~ ✓ v3.32 (frequency×dose). ~~Reload drops to Home~~ ✓ v3.32.

## Product backlog (Niklas — prioritise in fresh chat)
- **Settings declutter** — group into sections; toggle to **hide the mood check-in** (one switch,
  later = Garmin on/off); group **brew-guide + advice** under one block (hide/disable each or both).
- **Separate Insights tab** to shorten Home — move Insights card / most-brewed / top-rated off Home;
  keep standard info (cost overview, running-low, brewing-time — confirm). Reuse dashboard registry.
- **All-time option** for the recap/Wrapped.
- **Leaf-ratio adaptation** = the missing 3rd advice axis (leaf:water ratio, temperature, time). Still
  the parked "scale steep times by leaf amount"; central to brew-advice v2 and to learned defaults.
- **Under-used data to build on:** harvest year/season, cultivar, origin, water TDS/type, mood, feedback.

## Up next (map parked — pick the real focus)
Leaf-ratio design pass (longest-parked, highest-leverage) · settings declutter + Insights tab (quick,
low-risk warm-up) · then map redesign (drawn outlines) when there's appetite.

## Tier 1 — cheap, current stack
- **Alternative timer animation** [S/M] — cup filling/emptying as the steep runs.
- **Streak grace day** [S] — one grace/freeze day so a single miss doesn't reset the run.

## Tier 2 — moderate, current stack
- **Scale steep times by leaf amount** [M] — (parked for discussion) adjust v3.25's schedule by
  the leaf-to-water ratio (gramsUsed vs vessel capacityMl) vs the guide's assumed ratio, so a
  heavier or lighter pour shifts the times.
- **Paused days (holiday / sick / no access)** [M] — mark days exempt; heatmap stripes + legend;
  exclude from streak/insights or reflect smartly so a break isn't read as a lapse.
- **Onboarding / feature-discovery pass** [M] — features unlock on thresholds (favourites, low
  stock, insights, Wrapped); a light guided intro so the app is legible from day one.
- **Mood / energy check-in** [M] — optional per-session mood/energy; flag late sessions. (Lightweight
  precursor to the Tier-4 Garmin/sleep epic.)
- **Per-user profile page** [M] — tap a feed author → their shared sessions (RLS already supports it).
- **Likes / reactions** [M] · **Feed pagination** [M] (currently capped at 50).
- **Weight-with-packaging** [S/M] — finish the tare UI (a `defaultPackagingTareG` setting exists).
- **Partial vessel fill** [S/M] · **Collection achievements + milestones** [S/M] · **Accessibility pass** [M].

## Tier 3 — bigger bets (heavy infra)
- **Interactive world-map passport** [M/L] — PARKED after the dot-map attempt (v3.33/34) was rejected as
  unrecognisable ("just dots"). Redo with drawn country outlines + borders (simplified SVG/TopoJSON of tea
  nations only), choropleth by count, keep China/Japan drill-down. Parsing layer is reusable.
- **Meditative mode: gong-fu cup + stay-in-focus** [M] — extends the basic focus mode (art = human-made).
- **Comments + light notifications** [L] · **Push (Web Push / VAPID)** [M/L] — first Edge Function to send.
- **Label scanner** [M/L] — first Edge Function + vision model. **Cultivar map** [M/L].
- **German (i18n)** [L] — full string extraction. **XP / levels** [M] (gated). **Orphaned-photo cleanup** [M].

## Tier 4 — later / speculative
- **Garmin Connect + caffeine/sleep** [L, new infra] — pull sleep & activity (OAuth), don't surface
  actively, correlate with tea (+ coffee as a quick caffeine entry) to hint at sleep effects. Needs a
  slowly-built **caffeine-content database**. **Normal mode only — never Quiet/Calm.** Build incrementally.
- 8-bit tea-corner room + rewards shop · colour-shifting theme · high-altitude/old-tree achievement
  · 8-bit gaiwan logo (art-blocked) · southern-hemisphere Wrapped · block/report · water-profile
  presets · importers.

## Architecture enablers (build these and later features get cheap)
- ~~**Purchase-date + added-vs-bought flag**~~ ✓ shipped v3.26 (`tea.purchaseDate`; blank = already-had).
  Now cheap on top: inventory-over-time, restock timing sharpened by real purchase dates.
- **Caffeine field on teas** (build incrementally now) → the foundation the Garmin/sleep epic sits on.
- **Mood/energy field on sessions** → makes the sleep/mood correlation cheap later.
- **Paused-days concept** → holiday-aware stats now; reused by the sleep epic's exempt days.
- **First Edge Function** (via push OR scanner) → amortizes infra for push + scanner + photo-cleanup + i18n server bits.
- **Brew-guide parser** → reused by brew-advice tuning and "apply guide to steeps".
- ~~**Editable-dashboard layout persistence**~~ ✓ shipped v3.27 (`settings.dashLayout` + `renderDashboard`) — the reusable configurable-surface pattern is now in place for other views.

## Making it a "real app" (APK)
1. Installable PWA — already have it. 2. **TWA via PWABuilder/Bubblewrap → APK/AAB** (low–med, mostly
config; needs assetlinks.json + a signing key) — the sweet spot for "an APK in hand". 3. Capacitor →
native shell (med–high) once scanner/push justify native; also the iOS App Store path.

## De-dupe notes
Predictive stats + nicer empty dashboard = shipped (forecast/insights/onboarding). Favourites low-stock
reminder + wishlist tracking = folded into the shopping list. World-map and meditative ideas each merged
to one Tier-3 item. Basic passport + focus mode exist; their Tier-3 entries are the enhancements.
