# R3 Implementation Hand-off → Code — FINAL

**Planning lane, 2026-07-25.** This supersedes both earlier drafts (v1 omitted Social, Quick log,
the bundles and the visual contracts; v2 wrongly promoted the bundles to visual authority). It is
the complete build package: twenty-one boards, fifty-six rulings, and the verified data every
surface reads from.

**This document lives at `docs/r3/R3-IMPLEMENTATION-HANDOFF.md`.** Earlier drafts existed only as
chat attachments, which is why they could drift. If you are reading a copy that is not in the repo,
stop and get the committed one.

**Amendment log.** Banked verbatim as delivered (sha256 `82c8f55e36333ee3…`, 457 lines) and amended
since — so the file at HEAD no longer matches that hash, by design. This is a living document, not
an archival record like `docs/r3/boards/`.

- *2026-07-26, Code lane's plan-mode review:* **§0.3 replaced in full (R63)** — it had cited
  `shelfPhoto`, the tea tile, as the vessel fallback; the vessel ladder is new code and 旅 is
  dropped. **§1's method-split warning widened (R64)** — the quintuple is not a lane set, and §0.1
  gained the null-row pointer so it cannot be read alone and still light an inferred lane. Rulings in
  `planning/R3-RULINGS-LEDGER.md`; the findings behind them in `R3-BUILD-PLAN.md` §1.

**Authority order, binding:** live repo → 2026-07-19 export → `docs/r3/planning/R3-RULINGS-LEDGER.md`
→ `docs/r3/R3-STATUS.md` → the boards → nobody's memory. Boards are visual authority, the engine is
behavioural authority, the ledger is rulings authority. **A conflict between them is a finding, not
a thing to resolve quietly.**

**Standing instruction: challenge, don't absorb.** Every catch this round has been worth making, on
all three lanes including the planning lane. Judgment-calls section in every ship report. Flag
anything a board asks for that resists the shipped engine rather than adapting the engine to the
board.

---

## 0 · Model-precision corrections — read before building any surface

Four places where a board, or an earlier draft of this document, encoded a model more loosely than
the shipped engine. Build to the engine.

### 0.1 · Method control is FOUR drawn lanes (R50 — this replaces the previous instruction)

**`gongfu · senchadō · western · cold brew`, in that order** (no lane when `brew_style` is null —
R64).

The earlier draft of this section said "three segments plus a toggle" and it was wrong. R1 ruled a
four-lane control; R50 fixed its order and clarified the mechanism. The first three lanes map to
shipped `SESSION_METHODS` (`steep-sessions.js:549`), which holds exactly those three in that order.
The fourth lane is cold brew: selecting it **sets `is_cold_brew` and switches the flow** — it is
mutually exclusive with the other three, and it is drawn as a peer lane rather than a separate
toggle. The underlying storage is unchanged; only the control's presentation is.

Correct every surface that draws the control: #04 setup (`:499`), the #02b edit modal (`:308`), and
any copy that states the order. No grandpa style (ruled out — matcha is a tea, not a method).

R1's ledger text carries the superseded order with an amendment pointing here; don't read R1 alone.
**R3 already settled the shape** — `method 5-shown-vs-3-stored: 4 shown, 3 + boolean stored, matcha
inferred` — so four-shown-three-stored has been the model since early in the round, and R50 fixed
only the order.

### 0.2 · Stock tiers are FIVE: `empty · untracked · low · few · plenty`

Single writer is `stockTier()` (`steep-teas.js:40`). `few` (2–5 cups) sits between low and plenty
and is real even though it doesn't surface on #04's five example teas. Threshold: **cups-based when
brew-guide data exists (low <2 cups, few <5), else grams < `lowStockG()`**. The default is 15;
**Niklas's actual setting is 11** — read the setting, never the default.

The five example teas resolve, all verified against the 2026-07-19 export: Dawang Feng Da Hong Pao
plenty (20 g) · Fei Bing Beeng Cha plenty (96 g) · Shincha Saemidori Kagoshima empty (0 g, tracked)
· Honey Oolong Gui Fei low (7 g) · Sencha Kagoshima Premium low (8 g). Any copy saying "four states"
has dropped `few`.

### 0.3 · Vessel identity is a THREE-step ladder — and it is new code (R63)

An earlier version of this section cited `steep-teas.js:87–93` as the vessel fallback. That is
`shelfPhoto(tea, kind)`, the tea tile: its kanji keys on `tea.type` (白 white, 餅 puerh) and its
tints are `t-<teatype>`. Adding 蓋碗 there would mean a tea of type gaiwan. The vessel thumb is
`steep-sessions.js:111` — `v.image` or a `.is-ph` placeholder. Two steps, no kanji, no tint.

So the ladder is a new primitive, not a map extension: `vesselPhoto(v, kind)` mirroring
`shelfPhoto`'s shape, a `VESSEL_KANJI` map, and `.v-<type>` tints in `:root` and
`html[data-theme="dark"]`. Photo stays first priority; the tinted stripe is the floor.

The kanji map covers Gaiwan 蓋碗 · Shiboridashi 絞 · Cold brew jar 冷 — and nothing else. 旅 is
dropped: `VESSEL_TYPES` (`steep-core.js:113`) has no traveller entry and the "Travel cuppa" is typed
`Porcelain teapot`, so the glyph was keyed off a vessel's name. Identity never keys off free text.
Every other type falls to the tint, by design.

All five vessels in the 2026-07-19 export carry photos, so nothing below the first rung is visible
on current data. This is insurance for future photo-less vessels: build it small, fixture it, and
don't let it become a rabbit hole.

### 0.4 · Absence from a board is not a removal instruction (R61)

**Any shipped control a board does not draw is preserved.** Removal requires a ruling that names it.

This is not hypothetical. #13 draws the Teas shelf with no sort control, while
`steep-teas.js:248` ships a live seven-option sort select on the count row (handler `setTeaSort`,
`:308`, restored in v3.84). Building #13 as literally drawn would delete it. **It stays.**

R3 removes exactly one shipped control: the Passport row from the hub sheet (R45, `hubSheetHTML`).
It does **not** remove monoFont — that was retired in v3.53 (`87591dc`) and R48's instruction to
remove it is void; there is nothing there. And it does **not** rename the Teas tab (R62).

---

## 0.5 · Visual contracts — the law of how it looks

The sections below say *what*. **`docs/r3/boards/` says how it looks** — twenty `*-rev*.dc.html`
files plus `origins-map-v3.html`, banked verbatim from Design's export and hash-verified against it,
commit `98891a6`. Two things in that folder are required dependencies, not clutter: **`support.js`**,
which every `.dc.html` loads by relative path, and **`uploads/`**, referenced by #04 and #05. The
boards render only with both beside them. The thirteen `.png` files are the round-1 and parked
record — **not authority for anything you build.**

Locked contracts, restated so nothing is assumed:

1. **Liquor swatch** identifies a tea — identity only, never decoration. Vessels have no swatch
   (photo/kanji identity instead, §0.3).
2. **Clay** = one committing action per screen, never selection. Lists commit nothing.
3. **Xanthous** marker = selected/active state, state only.
4. **Kachi-iro blue** appears on the Focus ring and nowhere else — one surface total.
5. **Washi** deckle band = Home masthead only. Its probation stands and R3 changes nothing about it
   (R59); Home is round-1 by R53, so leave the masthead exactly as shipped.

Type roles, same-role-same-font everywhere: **Shippori Mincho** display · **IBM Plex Mono**
labels/kickers/meta/EXPORT stamps · **Inter** body · **Noto Serif SC** per-origin CJK,
catalog-sourced. Quiet affordances: dropdowns, icons, folds — never chip rows. Slider thumbs are ink
(C4). Bars are clay, not chart ink. Ensō: door + timer only (R33), never the app icon. EXPORT stamps
identically formatted on every data-bearing surface.

**Two board defects, recorded and deliberately not repaired in transit** (repairing them would have
voided the hashes): `02b` and `04` still carry `repo 77cf800` in their prose, and `03` plus both
bundles carry no repo stamp — against the MANIFEST's claim that all boards were restamped to
`9f695e2`. Don't read those stamps as evidence of what a board was verified against.

---

## 1 · The verified data every surface reads from

Re-verified row by row against the 2026-07-19 CSVs on 2026-07-25. Figures on boards that disagree
with these lose.

**Shape:** 21 live teas (22 rows, Test deleted) · 31 sessions · 103 steeps · 5 vessels · 16 distinct
days · dates 3–19 Jul.

**Totals:** `totalGrams` **130.5 g** · **12.51 L** ((water_ml or vessel capacity) × steeps).

**Method split: 13 · 10 · 7 · 0 · 1 = 31**, and the definition matters. `brew_style` holds senchadō
13, gongfu 10, and **8 nulls**; `is_cold_brew` is true on exactly one row, and that row's
`brew_style` is null. So the null count is 8 and the *display* count is 7, because the four-lane
control claims that session for the cold-brew lane. Boards use the display form. Both numbers are
correct; never show them in one row. And the whole quintuple is not a lane set —
`13 · 10 · 7 · 0 · 1` is five slots ordered senchadō-first, while the control is four lanes ordered
gongfu-first, and untagged is not a lane at all. Rendering the split into the control's lanes would
put senchadō's 13 under Gongfu. They are different axes; keep them visually distinct wherever both
appear.

**Type mix BY SESSION:** green 15 · oolong 11 · white 3 · yellow 1 · puerh 1. **Do not reconcile
this to the 21-tea shelf** — the subject is sessions, and that is what makes "green-leaning" true.

**Clock:** peak **08–10**, second **12–14**, nothing after ~14:00 — *in local time*. Raw hours in
the export peak at 07 UTC. Render local; do not "correct" this from the raw column.

**Engagement:** mood **15/31 (48%)** · shared **5/31 (16%)**, dates 4 · 5 · 6 · 8 · 11 Jul.

**Vessels, real usage:** Dragon Gaiwan 16 · Main Kyusu 9 · Mogake Shiboridashi 4 · Travel cuppa 1 ·
Hario Coldbrew 1.

**Running low:** Honey Oolong Gui Fei 7 g · Sencha Kagoshima Premium 8 g.

**Origins:** 11 region-tier · 10 country-only. Nine of the ten are bare country strings (China ×5,
Taiwan ×3, Thailand ×1); the tenth is Moragella Oolong at `Ceylon, Sri Lanka`, which normalises into
the country tier because R16 rules Ceylon a country synonym.

**Vendors** (`teas.source`, 21 live teas): MainTee Würzburg 5 · Tee Kontor Kiel 3 · Si Fang Guan -
Freiburg 3 · Bamboo Tea Room 3 · Bohea Telehandlung Berlin 2 · Diez GmbH 1 · Teerausch 1 · Tea
Addicts 1 · Jesse's Tea Housr 1 · **one tea with no vendor at all**.

**Wishlist: 1 row** — Shincha Saemidori Kagoshima · Bamboo Tea Room · `done=false`, naming a tea
already on the shelf at 0 g. **Confirmed by Niklas, not export-verified** — the wishlist table isn't
in the relayed CSV set. The 0 g is export-verified.

**Longest tea name, the layout stress case:** `Hualien Chike High Mountain Qingxin Premium`, 43
characters. It must survive every picker and list.

**DO NOT USE — Insights' cost medians.** The board shows €0.17/g · €0.86/session and states its
method as `cost_total ÷ grams`. That method on this export gives median **€0.236/g** across the 14
costed teas and **€0.99/session** across 23 sessions; pooled it is €0.234/g. The figure's provenance
is unknown and it does not reproduce. Either recompute at build and use what you get, or render
nothing — do not carry 0.17/0.86 forward.

---

## 2 · Boards ready to build

### #02 Sessions (rev 3) + #02b Session detail & edit (rev 2)

- List is a diary grouped by day, chronological, **list is the default view**. The shipped
  Brewing-days heatmap (v3.44, `steep-dashboard.js:355`) **stays** as a secondary view behind a
  toggle (R42) — it is not replaced by the list.
- Real rows verified: Spring White Anji ★2½ · Fei Bing ★3 · Yashi ★3½ · SKP ★3½ · 6 Jul DHP ★4½;
  Spring White Anji is Dragon Gaiwan · gongfu. "unrated" ≠ "no note".
- Detail hero renders the TRUE 6 Jul Da Hong Pao: **6 steeps, no rinse, 100 °C flat,
  45/30/45/55/65/90 s (total 5:30), water blank → 110 ml capacity, no TDS/type, not shared, no mood,
  steep-1 tagged floral·spices**, session note "Infusion progression with added time worked really
  well." Per-steep temp is a pill; no standalone steep page.
- **Edit moves from modal to its own screen (R58).** Shipped it is an overlay modal
  (`steep-sessions.js:292–293`, entered via `openSessionEdit()`); #02b rev 2 draws a dedicated
  screen. That move closes issue #28. Contents: tea/vessel/method, leaf·water·when, mood·rating·note,
  per-steep fields via `es_setSteep`, session-level taste words, photo. Method order per §0.1. The
  edit screen's date must match its own detail view. Delete is an inline hold-to-confirm, never a
  native alert.
- **Known issue, carried forward deliberately (R57):** per-steep taste words are not editable.
  Shipped, each steep offers Temp → Time → Notes (`:286–288`) and no tags field; `es_setSteep` is
  generic enough to write any key but nothing calls it with `tags`. **#02b rev 2 reproduces this
  gap** — its `TASTE WORDS` block is session-level (`sessions.tags`), not per-steep. Issue #22 asked
  for taste notes collapsible and beneath water temp; "beneath" is already true, "collapsible" is
  drawn nowhere, and R57 defers the whole item post-R3. **Build the gap as drawn; do not invent the
  missing control.**
- **New capabilities (R40) — Code slices, not assumptions:** "Brew this again" carries tea + vessel
  + method forward (`startSessionFor` is tea-only today); "Copy to a new entry" (no dup feature
  exists); "Pass this tea to the circle" (rides the R25 pass record).
- **Variants (D6):** cold brew — Sencha Megumi No. 1 Hoshino · Hario Coldbrew · 8 g · 8:00 h ·
  **750 ml** (the vessel's capacity, not 700). Steepless matcha — the STEEPS block becomes a whisk
  block; illustrative until a matcha is on the shelf, but the shape builds now. Empty Sessions tab —
  "No sittings yet. Your first cup will open the diary." with ＋.

### #04 Session setup + pickers (rev 6) · #05 Vessels (rev 1)

- #04: four-part setup (tea · vessel · method · leaf/water), mood card, in-setup quick-log entry
  (R5), water-as-capacity placeholder (R6), schedule strip naming its derivation (guide → ratio →
  feedback-learned — an unnumbered correction in the ledger's #04 packet, not a ruling; post-gate
  it is where learned defaults surface, so its anatomy is load-bearing). Method control per §0.1 —
  **four lanes**. Mood pill reads
  48% (15/31). Long-press swatch → colour correction (R39). Stock tiers per §0.2.
- #05: the real five vessels with the usage counts in §1. Add/edit mirrors add-tea. Image fallback
  per §0.3. The white-porcelain houhin and red-clay kyūsu photos are unadded future teaware — they
  are referenced board dependencies but stay **unplaced** as vessel identity.

### #13 Teas revision (rev 1) — the surface carrying the most new work

R53 accepted round-1 for Home and the non-Focus steeping states and commissioned this one board,
because four things land here at once:

- **R51 — Go Deeper as the tab's second mode.** Shelf ↔ reference, two modes of one tab. Also
  reachable contextually from Tea detail, from the brew-guide "Borrow from Go Deeper" action, and via
  R36's passed-tea path. **Not** reached through the profile hub.
- **R52 — the vendor manager in the shelf's overflow, as "Edit vendors".** Restyle only:
  `vendorManagerHTML()` and `distinctVendors()` already ship. String-based for R3 — a list of names
  with counts, rename rewrites the string on every tea carrying it. No vendor entity, no URL, no
  logo (deferred with R12). Shipped Settings copy already reads "Manage vendors from the Teas tab",
  so this is continuity. **Two real rename cases exist** — `Jesse's Tea Housr` and the stray hyphen
  in `Si Fang Guan - Freiburg` — and **one tea has no vendor at all**, which must not surface as a
  row with an empty name.
- **The header rework**, open since round 1.
- **Vessels as the tab's second segment** — `goVessels()` sets `state.teaSeg='vessels';
  state.view='teas'` (v3.46). It is a segment, not an overlay. #05 is the content behind it.

The tab is **Teas** (R62 — no rename). The board draws it as Teas with the rename flagged; the flag
is now closed, not pending. **The shipped sort select stays** (§0.4); `setTeaFilter` (`:309`) and
`focusLogSteep` (`steep-sessions.js:966`) stay dormant with zero callers — regressions accepted for
R3 per R60, functions left in place, no controls drawn.

### #37 Origins refinement (rev 2) + Origins map v3

- Editing `teas.origin` re-derives the tier — nothing is stored, nothing migrates, no code change to
  the tier logic. A string with no coordinate row falls back to its country pin.
- **R55 — the catalog may only offer a region that names ONE place, sits INSIDE the country already
  stored, and has parentheticals stripped.** A catalog region naming a different country is a
  **conflict, not an offer**: no default, no one-tap accept. Read the region from
  `resolveTeaType(slug).region` — never from a board literal — because `region` inherits from the
  parent row (`TT_INHERIT`, `steep-tea-types.js:74`).

  Of the ten country-only teas, six are catalog-covered and **three offer**: Dawang Feng Da Hong Pao
  ("Wuyi Mountains, Fujian, China"), Honey Oolong Gui Fei ("Lugu, Nantou, Taiwan"), Ali Shan Fo Shou
  Dong Pian ("Chiayi County, Taiwan", after stripping "(~1000-1500m)"). Three are suppressed:
  Oriental Beauty (catalog says Taiwan, the shelf says China — a country conflict), Huang Ya Yellow
  Tips ("China (Sichuan / Anhui / Hunan)" is a list), Ruby Ruanzhi (two countries). Recompute the
  denominator with the shipped matcher at build; don't assert it from here.
- **R56 — the Origin field gains no suggestion list.** #37's OR4 describes "the existing origin
  autofill" as shipped; there is none. The field is `<input type="text" name="origin">` with a
  placeholder and no `list=` (`steep-teas.js:431`); the only datalists are `vendorList` and
  `wishVendorList`, both fed by `distinctVendors()`. `KB_REGIONS` is a recognition table for
  `kbResolve()` whose keys are bare lowercase tokens (`wuyi`, `alishan`) — wrong shape for a field
  keyed on normalised full strings. The board's illustrative suggestion array still contains
  "Wuyi Shan, Fujian, China", a string that appears nowhere in shipped code. **Build no suggestions.**
- **Three coordinate rows are owed by the data lane** — Wuyi Mountains, Lugu, Chiayi.
  `DATA-region-coordinates.md` has eight rows and is marked complete; none of the three offerable
  regions is among them. Until those rows land, every accepted offer correctly leaves the tea in its
  country tier, and #37's before/after panel draws that honest outcome.

### Insights (rev 3) + Origins card

- Three-window control (week/month/all), restored. Figures per §1 — **including the cost-median
  exclusion.**
- **R54 — the Origins card is pinned to Insights.** R46 nests it in Insights' MORE stack and makes it
  card-manager moveable, but `dashSurface()` (v3.47) lets a user move any card between Home and
  Insights, which would land a map card on a surface with no revision board. Register it with a
  `DASH_SURFACE` entry of `insights` and do **not** make it Home-moveable in R3.
- Taste-vocabulary panel is **GATED** — the flavour recognition layer changes what it draws from.
  Concept kept, render deferred.

### #07 Settings (rev 2)

- Currency preference is the one genuinely new capability: the app hard-codes `'$'` at
  `steep-teas.js:722–723`. Every cost surface reads the pref.
- **°F stays** (explicit confirmation). Low-stock threshold reads the user's setting (11), not the
  default (15).
- **No monoFont work.** The board correctly has no monoFont row; its SET5 note telling you to remove
  the shipped control is void per amended R48. There is nothing to remove.

### #08 Shopping (rev 4)

- Two sources: **running low** derives from the shelf (`stockTier`); **wishlist** is a separate
  table. The wishlist has **one row**, and it names a tea already on the shelf at 0 g — the overlap
  is the design, not a duplicate. It reads as a **rebuy**.
- R49: wishlist→library join is a normalised-name match; misses are flagged; revisit after R26's
  slug work.
- R11 restock → repeat purchase; R12 vendor web-search. No price field exists on wishlist rows, so
  none is shown.

### #08 Social (rev 3)

- **Schema first — the R25 pass record is a Supabase migration:** `(session_id or tea_id, to_profile
  nullable = circle, note, created_at)`. One record yields per-recipient sharing (which `is_shared`
  can't express), the Passed-to-you shelf, and the kindred reply. Not a reactions system.
- Until `to_profile` ships, **the badge says only "shared"** — never a recipient name.
- Circle: 3 profiles, 3 edges — Ruth mutual (⇄), pebbi → you one-way. Shared-by-you: the real five,
  5 of 31 · 16%. Session snapshots render `tea_name` **as stored** — old sittings keep "Guandong";
  never re-spell history.
- Passed-tea destination is **R36, three-tier**: Go Deeper reference when the catalog covers it, else
  minimal preview (sender's note · swatch · script) with **Add to shelf** the only action.
- "+ Find someone by handle" ships. Presence strip: **PARKED (R35)** — build nothing.

### #09 First run / landing (rev 1)

- Doubles as landing (R29). Ensō in clay, Kachi-iro unspent, real Supabase auth.
- **R47 — the door draws only configured providers.** "Continue with Apple" is removed.
- **R32:** landing copy is canonical as drawn — tagline "a slower cup, better kept," the
  what-it-is line, three pillar words. Keep minimal. **R33:** ensō on door + timer, never the icon.
  **R34:** invite line is passive, "invitation-only for now" — no redeem mechanism exists.
  - *Beta-milestone caveat, not this build:* Supabase signup is toggled ON, so R34's line is copy,
    not an enforced gate. Closing it is a beta-hardening task. Don't mistake the copy for enforcement.
- Empty states (empty shelf, R19 zero-tea Origins) need a slim #09 addendum; migration is covered by
  Settings' Import-backup. State that mapping explicitly rather than leaving it implicit.

### #10 Focus (rev 2)

- Timer is **two modes + one action**: Countdown/Stopwatch are modes; "Use time" renders only in
  stopwatch mode (`steep-sessions.js:860–901`). Any board showing three peers is wrong.
- Write path already shipped (v3.92) — the pour nudge persists to `steep.feedback`; the visual lands
  with R3.
- **R44 — no avatar here.** The profile avatar appears on tab-level screens only, never on immersive
  surfaces.
- **Scope warning:** Focus and the non-Focus steeping states are **the same shipped function**.
  `sessionSteepingHTML()` renders the whole steeping stage — steep list, timer, per-steep feedback,
  cold-brew handling — and `sessionFinishHTML()` is end/save. R53 accepts round-1 for the states this
  board doesn't draw, but the Focus rebuild necessarily touches them. **Hold every undrawn state to
  shipped behaviour and flag it; do not invent one.**

### #11 Wrapped (rev 1)

- A reframing of Insights' figures as a swipe carousel, not a second engine — same `totalGrams`,
  `hourBuckets`/`peakBucket`, method split, type mix.
- **R38: period is monthly** ("your July so far"), explicit; a yearly sibling comes later.
- Verified: 16 days · 130.5 g · peak 08–10 with a midday second pour (**not** "after dark") · type
  mix by session per §1 · "green-leaning month" · brewed most in Dragon Gaiwan.
- **R37: Share card / Save image accepted** — pull-only, never auto-posted, never names people. Code
  sizes the export; Save-image may slip if heavy. Kachi-iro stays holstered.

### #12 Quick log (rev 1)

- The retrospective twin of #04: same session record, opposite posture — no tea preselected, no
  timer, for a cup already had. `quickLogSession()` (`:351`) is the shipped entry point; this is its
  first drawn screen.
- **The date field inverts.** `sessionDate` is folded away on #04 (live = now) and **promoted here**
  (retrospective = needs saying). One field, two placements, driven by posture. Relative chips: Just
  now / This morning / Yesterday / Pick a date; selected chip uses jade, not Focus indigo.
- **R43 — the vessel field.** This is **new UI over an existing field**, not a new field and not
  already-shipped: `startSessionFor()` (`:359`) already sets `vesselId: state.vessels[0].id` at
  `:364`, and `quickLogSession()` reaches it by calling `startSessionFor(null)`. The quick-log screen
  has **zero** vessel references today (`sessionQuickHTML()`, `:427–473`); the `vesselOpts` select at
  `:488` belongs to `sessionSetupHTML()` (`:474`), a different screen. Surface the existing value as
  an optional control.
- Picker opens on the real shelf. Note survives; per-steep flavour chips do **not** (flavour lives in
  the steep). Infusions stepper, rating, note, one clay commit: "Save cup".
- Two entry points, one surface: bottom-nav Log and the in-setup Quick-log shortcut (R5).

### #06 Add / edit tea (rev 4) · #03 Tea detail (rev 3)

- Both verified against the real record. #03 draws honest empties rather than invented values, with
  labels unified and the brew guide tagged as free text.
- `brew_guide` **is free text today.** Structured pills are a NEW schema — if they build, they build
  as schema work, not as a re-render of the existing string.
- The three-tier cascade holds everywhere: **user value → catalog default → show nothing.** Never
  guess a reading. Prominence follows load-bearing, not fill rate.

### Bundles 1 & 2 — the base build (never previously handed to Code)

Bundle 1 rev 4 (Home · Teas · in-session steeping · Focus · Log) and Bundle 2's Settings and
Shopping restyles were "handback, not handoff" — locked designs that have never reached a Code
session. They are **round-1 behavioural reference**, and they are **not visual authority**: where a
rev board covers the same surface, the rev board wins. Two standing caveats: their stamps say
`SNAPSHOT · locked 2026-07-18 · example data illustrative`, so every figure re-derives from live data
at build; and anything in them contradicted by §0, §1 or any ruling follows this document.

Settings carries R22 (completeness/data-health lives there, not Insights) and the restored Import
backup (confirm-replace — Ruth's migration path). In-session steeping carries C4 (ink slider thumbs),
the CALIBRATE/TASTE split, and brew-guide pills with the bar timer as Focus's immersive twin.

**Home and the non-Focus steeping states build from Bundle 1 (R53)** with only the §0 primitives and
the visual contracts applied. Home is four glance cards — greeting · running low · favourites ·
sessions this week (v3.74). Three things still touch it, none needing a board: the hub sheet loses
its Passport row (R45), the Origins card is registered `insights` and not Home-moveable (R54), and
the washi masthead stays exactly as shipped (R59).

### Per-method feedback rule (cross-cutting)

Gongfu logs the v3.89 strength tap **per steep**; western, cold brew and senchadō carry **one
session-level verdict** (`sessions.feedback`). CALIBRATE (prospective, tunes the next pour, writes
forward per v3.92) stays distinct from TASTE (retrospective record) on every surface. The boards draw
them as separate blocks deliberately — don't blur them.

---

## 3 · Ledger note (no action)

The ledger is contiguous **R1–R56**, verified unbroken from a fresh clone — no gaps, no duplicates.
Boards happen not to cite many of them; those are real rulings, not gaps, and none should be
"reconciled" away. R57–R62 were issued 2026-07-25 and land with this document's commit.

**R43's ledger entry carries its original text verbatim plus a blockquoted Code-lane citation note
beneath it.** The note is correct; the ruling text's `quickLogSession()`-as-setter phrasing is the
superseded one. Don't "fix" the ruling to match the note.

---

## 4 · Formerly open, now ruled — nothing in R3 is unresolved

Every item the previous draft listed as status-unknown has a ruling. None is licence to invent.

- **#7 passport** — closed by R45. Origins absorbs it; the hub row is removed; `steep-passport.js`'s
  fate is your call to make and report.
- **#10 app icon** — deferred, parked. R33 constrains it (no ensō) if it ever returns.
- **#22** ("placement of taste notes collapsible and beneath water temp") — **deferred post-R3
  (R57)**. See #02b above: the "beneath" half already ships, "collapsible" is undrawn, and the
  per-steep taste-words gap stands as a documented non-destructive known issue.
- **#23** ("R2 capability regressions") — **split (R60)**. The sort control is preserved exactly as
  shipped; `setTeaFilter` and `focusLogSteep` stay dormant with the regressions accepted for R3;
  sort persistence stays session-scoped, with durability a later `user_settings` question.
- **#28** ("move the edit layout somewhere less intrusive") — **closed (R58)** by #02b rev 2's
  dedicated edit screen replacing the shipped modal overlay.
- **Teas header rework** — in scope, drawn on #13.
- **Teas→Library rename** — **ruled out (R62)**. The tab stays Teas.
- **Washi probation** — **unchanged for R3 (R59)**.

Still genuinely outstanding, and none of it blocks this build: the three owed coordinate rows; the
Insights cost-median provenance; the `oriental-beauty` catalog row's Taiwan-only region (a
tea-reference lane item); Google OAuth consent-screen status; relaying `wishlist` and `user_settings`
in the next CSV gate; and the beta-hardening bundle. All are recorded in `R3-STATUS.md` §7.

---

## 5 · Sequencing

The §0 corrections are cross-cutting — **apply them once as shared primitives, then build the boards
on top.** Building a surface first and retrofitting the method control or the stock tiers is how the
four-lane order went wrong the first time.

House discipline per surface: one deploy per commit, version and cache lockstep, CHANGELOG naming
exact files, fixtures against real CSVs before anything ships, verifier dry-run, judgment-calls
section in every ship report. Plan-mode review in the planning lane before code is written; pause
after the plan, pause again before commit.

Two repo rules established by the banking commit — **do not tidy either away.** `.gitignore` carries
`!docs/r3/boards/*.dc.html`; the bare `*.dc.html` above it would otherwise silently drop all twenty
boards. `.gitattributes` pins `docs/r3/boards/** -text`; without it Git-for-Windows `autocrlf`
smudges LF→CRLF on checkout, so a Linux clone hashes green while a Windows clone shows twenty-three
failures — and the hazard is someone "repairing" that by committing CRLF blobs. Both files carry
comments explaining why.

**Two documentation edits owed at this document's commit**, both trivial and both in
`docs/r3/R3-STATUS.md`: §3's "20 boards actually tracked" should read "20 `.dc.html` boards" (there
are 21 board files; `origins-map-v3.html` is plain `.html` and was never at risk), and §5's item 3
naming `59715fd` as holding "this document" is one commit stale — the post-banking text lives in
`ded1717`. Neither earned a commit of its own.
