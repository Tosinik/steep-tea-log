# Steep — roadmap (single source of truth)

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

2. **Next — Brew advice v2** (per `SPEC-brew-advice-v2.md`, DECIDED). The missing 3rd advice
   axis: leaf-to-water ratio. Sequenced (D5):
   - **Capacity-capture precursor** (tiny deploy, ships first). Make vessel `capacityMl`
     a visible, encouraged (not required) field; quiet "· ml?" affordance on capacity-less
     vessels; an inline "set capacity" link in the (hidden) ratio line at session setup. No
     banners, never blocks logging. Ratio fails silently without capacity, so this comes first.
   - **Ratio phase 1.** `actualRatio = gramsUsed / (waterMl/100)` vs a baseline
     (guide-parsed grams+ml → `kbResolve().ratio` → per-`LEAF_PROFILES` default); scale the
     prefilled schedule by `clamp(1/ratioFactor^k, 0.6, 1.4)`, k=0.6 (tunable constants next to
     LEAF_PROFILES). **Default OFF, strict opt-in** (Settings → Brew guidance → "Ratio
     adjustment") (D2). Optional per-session `waterMl` override (D3) — migration
     `sql/v3_8-water-ml.sql` (`sessions.water_ml`), mapper pairs + both write paths per the
     CLAUDE.md rule; this absorbs the old "partial vessel fill" item. Temp is NOT ratio-adjusted.
   - *Learned defaults* = phase 2, gated on phase 1 shipping and gathering data (separate spec).
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

3. **Then — the rest of the "forgotten" batch** (small independent deploys, order flexible):
   - ~~**Tea lifecycle / at-0g**~~ ✓ **shipped v3.40** (finished-teas grouping + hidden-in-picker +
     one-time rebuy? → shopping list). A full **archive/restore workflow** (hide from library entirely,
     restore later) is deferred — the finished view + rebuy nudge cover the need for now.
   - **Error log + data health** (Settings → Data) — keep the **last N client errors** in
     localStorage, viewable under Settings; plus a read-only **data-integrity report**: orphaned
     steeps, sessions pointing at deleted teas, negative stock, duplicate-session pairs (the v3.35
     double-fire signature). Diagnostic surface, no auto-repair.
   - **Freshness cues** — surface `harvest_year`/`harvest_season` **quietly**: shincha/first-flush
     past peak, young sheng puerh improving with age. Observational, calm, opt-in feel — no alarms.
   - **Feed pagination** — future-proof social (feed is currently capped at 50).

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
