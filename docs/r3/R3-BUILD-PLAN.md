# R3 Build Plan — Code lane

**Written 2026-07-26, after reading `R3-IMPLEMENTATION-HANDOFF.md` end to end and checking its §0
against HEAD.** Plan-mode review held in the planning lane the same day; R63–R66 issued in response
and land alongside this document.

**Authority position.** This is a *plan*, the lowest tier in the round's order: live repo →
the current export, stamped (R67) → `planning/R3-RULINGS-LEDGER.md` → `R3-STATUS.md` → the boards → this. It
sequences work; it rules nothing. Where it disagrees with any of those, they win and this gets
corrected.

**Why it is in the repo.** The hand-off drifted twice as a chat attachment. A plan relayed as a
completion summary would drift the same way — and §1's findings are the reasoning behind the
sequence, not commentary on it. The next session needs both.

---

## 1 · Findings — where the package resisted the engine

Recorded as found. Where a ruling has since settled one, the outcome is marked inline; the finding
itself is left standing, because what was found is worth as much as how it was resolved.

### F1 · §0.3 cited the wrong renderer; the vessel ladder does not exist

`steep-teas.js:87–93` is `shelfPhoto(tea, kind)` — the **tea** tile. Its kanji key on `tea.type`
(白 white, 餅 puerh); its tints are `t-<teatype>`. Adding 蓋碗 there would mean a *tea* of type
gaiwan. The vessel thumb is `steep-sessions.js:111`: `v.image` or a `.is-ph` placeholder —
**two steps, no kanji, no tint.** So "extend the kanji map" was unbuildable as written; the ladder
is a new primitive with per-type tint classes in both theme blocks, materially more than a map
extension.

Second half: **旅 had nothing to key on.** `VESSEL_TYPES` (`steep-core.js:113`) is Gaiwan · Kyusu ·
Shiboridashi · Yixing teapot · Porcelain teapot · Glass teapot · Mug · Cold brew jar · Other.
蓋碗/絞/冷 map cleanly; "Travel cuppa" is a vessel *name*. Identity must not key off free text.

> **RULED — R63.** Build `vesselPhoto(v, kind)` mirroring `shelfPhoto`'s shape, a `VESSEL_KANJI`
> map, `.v-<type>` tints in both theme blocks. Map covers Gaiwan 蓋碗 · Shiboridashi 絞 · Cold brew
> jar 冷 and nothing else; 旅 dropped. Further glyphs are a Design decision. **Scope discipline:**
> every vessel in the export carries a photo, so this rung is invisible on current data — it is the
> graceful-degradation floor for future photo-less vessels. Build small, fixture it, don't
> gold-plate.

### F2 · The four-lane control vs the untagged rows

Storage mutual-exclusion already holds and needs no new logic: `commitSession` writes
`brewStyle: (!d.isColdBrew) ? brewMethodFor(…) : null` (`steep-sessions.js:1285`), so §0.1's
"underlying storage is unchanged" is true and the cold-brew lane needs no clearing code.

But `brewMethodFor` (`steep-core.js:377`) **never returns null**: explicit wins, else capacity ≤
`GONGFU_VESSEL_MAX_ML` (150) → gongfu, else western. So a four-lane control that always lights a
lane presents a capacity guess as a record on every null row — and the guess is not even uniform:
Dragon Gaiwan (110 ml) infers gongfu, Main Kyusu (210 ml) western.

Two consequences, one for the control and one for the figure:

- **The control.** Lighting an inferred lane, then letting a save persist it, would manufacture
  `brew_style` — the exact measurement the phase-2 brew-advice spec depends on — out of a heuristic.
- **The figure.** `13 · 10 · 7 · 0 · 1` is **five slots ordered senchadō-first**, while the control
  is four lanes ordered gongfu-first, and untagged is not a lane at all. Rendered into the lanes it
  puts senchadō's 13 under Gongfu. §1's "never show them in one row" warned only about 7-vs-8; the
  hazard is wider.

> **RULED — R64.** The control shows the stored value and **shows nothing when there is none**. The
> derived reading stays where it already lives, in the read-only `esMethodReadLabel()`
> (`steep-sessions.js:207`). JC1 survives verbatim: `es_setBrewStyle` remains the only writer and
> `saveSessionEdit` passes `brewStyle` through untouched (`:203–205`), so opening a null session and
> saving writes nothing. **Hand-off §1 amended** to carry the wider warning.

### F3 · `fixtures/*.csv` is behind the authority export

`fixtures/sessions_rows.csv` holds **28** sessions — `brew_style` gongfu 13 / western 3 / null 12,
**zero senchadō** — and `fixtures/vessels_rows.csv` holds **3** vessels. The package is verified
against 31 sessions (senchadō 13 / gongfu 10 / null 8) and 5 vessels. The local set predates the
v3.91 senchadō work and Niklas's retagging.

The deploy ritual validates fixtures against real CSVs; on this set it would validate R3 surfaces
against a superseded dataset and call it green. **A fresh relay blocks the first R3 ship** — not the
docs commits.

*Status: Niklas is pulling a fresh export including `wishlist` and `user_settings`.*

Related, and in the round's favour: `fixtures/user_settings_rows.csv` **does** exist (6 rows) and
one carries `lowStockThreshold: 11`, so §0.2's "Niklas's actual setting is 11" is export-verified
after all — and the same file shows the stale `monoFont:"pixel"` key R48 describes. Only `wishlist`
was genuinely unrelayed; `R3-STATUS.md` §7 over-stated what was missing.

### F4 · `brew_guide` structured pills are new schema no ruling requires

#03 and #06 both state free text as today's model and the three-tier cascade already covers
presentation.

> **RULED — R65.** Out of R3. Not worth opening a migration for a presentation change.

### F5 · The export is not user-scoped

`teas_rows.csv` carries a row belonging to **another account** (a "Test" green tea, 0 g, no vendor);
`user_settings_rows.csv` carries every beta user. Sessions, steeps, vessels and wishlist are
single-owner.

The failure mode is silent and it already fired: the foreign row is vendorless, so an unscoped read
reports **two** teas with no vendor where §1 correctly says one. The app scopes by `user_id` on
purpose — the v3.21 hotfix, because a social RLS policy lets followers read others' shared sessions
and an unfiltered load leaks them into personal stats. Anything reading `fixtures/` inherits that
requirement. `figures-report.js` derives the owner from whoever owns the sessions rather than
hardcoding a UUID, and `export-gate-test.js` now asserts sessions are single-owner.

### F6 · §1's "22 rows, Test deleted" is wrong in both halves

It asserts a soft-delete state the schema does not have, *and* misattributes a foreign row. The count
(21 for this user) is right; both stated reasons are wrong — in the document that says what to build.
Restamps as **21 rows for this user, with the unscoped-export warning attached**.

The row is literally named `Test`, which is why the invented mechanism went unchallenged: the name
reads like a scratch row, so "deleted" was self-confirming. `tea-types-test.js` encodes the same
magic string (below).

> **Audit (R69), all 15 committed suites run unscoped vs scoped and diffed.** **None scopes by
> `user_id`.** 13 report identically — but by luck: the foreign row is inert (0 g, no vendor, no
> origin, rating 0, no sessions) and several assertions are relative rather than absolute. Clean but
> latently exposed: `greeting-v4`, `log-guard`, `shelf-order` (relative `list.length===real.length`),
> `stat-period` (session-driven sums), `tea-search`. **Structurally fragile:**
> `status-line-test.js` E1 (`low.length===2` absolute — a foreign row at 5 g breaks it) and
> `tea-types-test.js` G (excludes by `t.name!=='Test'` and asserts `match('Test')===null`, so it pins
> a property of another account's data). Both ride the stale-expectation repair.
> The gate itself had the bug: it floored teas at the **unscoped** 22, so scoping would have failed
> it on correct data. Fixed to floor owned rows at 21; re-audited, all 16 now scope-invariant.

### Also settled at review

> **R66 — `steep-passport.js` is kept, stripped, and mined.** Keep the file; drop the hub row and the
> passport view; retain `passportCountryFor()` (`:100`), `PASSPORT_GEO` (`:40`), `PASSPORT_LAND`
> (`:12`) and `PASSPORT_SUB` (`:64`) for Origins to reuse. Verified: **zero cross-module consumers**
> today, so stripping the surface leaves the tables genuinely dormant-but-available.

---

## 2 · Slice A — the §0 primitives, before any surface — **SHIPPED v3.95**

> **Shipped 2026-07-26** (`d34af32`, cache v105; entry-path pins `e29cc17`). All six items landed as
> planned, with two scope corrections found during the build: **currency was six sites, not two**
> (three wrong symbols including `big_spender`'s dormant `unit:'$'`, three printing none at all), and
> **R64 needed scoping to record surfaces** — R72, encoded as `methodLanesHTML`'s `resolve` flag.
> Rulings R72 (draft-vs-record contracts) and R73 (`/\r?\n/` source scanning) came out of it. See
> `R3-STATUS.md` §5 for the live state and CHANGELOG v3.95 for the file list. **Next: slice B.**

One deploy, no surface rebuilt. Building a surface first and retrofitting the method control is how
the four-lane order went wrong the first time; this slice exists so that cannot recur.

1. **Currency.** A `currency` key in `DEFAULT_SETTINGS` (`steep-core.js:121` — synced, not
   device-local) plus one `currencyFmt()` helper, replacing the two hardcoded `'$'` at
   `steep-teas.js:722–723`. The Settings *row* rides #07 later; the key lands now because every cost
   surface downstream reads it. This also makes the DO-NOT-USE median recomputation renderable —
   **#07's currency is a dependency of #03 / #13 / Insights, not an independent slice.**
2. **Method lanes.** One shared `methodLanesHTML()` rendering three `SESSION_METHODS` + cold brew,
   consumed by setup (`steep-sessions.js:499`) and edit (`:308`), replacing the segment-plus-checkbox
   pair in both. Delegates to the existing `d_setColdBrew` / `es_set` / `es_setBrewStyle` setters —
   **no new writers.** Per R64: no lane lit when `brewStyle` is null.
   **`ratioSetupHTML` (`:562`) dies in this slice** — its hard-coded two-button segment would light
   neither lane for senchadō, it has been in the CLAUDE.md backlog since v3.77, and the trigger has
   fired and been missed twice (v3.85, v3.91). Third time is enough.
3. **Stock tiers — a guard, not code.** `stockTier()` (`steep-teas.js:40`) already returns all five
   and `statusLine()` is already the single label writer. The deliverable is a **committed test that
   a second writer cannot appear**, which is also the right shape for R61's preservation rule.
4. **Vessel identity.** Per R63: `vesselPhoto(v, kind)`, `VESSEL_KANJI` (three entries), `.v-<type>`
   tints in `:root` **and** `html[data-theme="dark"]`, replacing `steep-sessions.js:111`'s two-step
   thumb. Fixtured, small.
5. **R61 as a test.** Extend `fixtures/shelf-order-test.js` to assert the seven `SORT_OPTS` keys
   still render and `setTeaSort` still has a caller. A preservation rule that lives only in prose is
   what this round just got caught by; one that fails a suite cannot be built past.

**No SQL in slice A.**

---

## 3 · Slice order, with schema called out

| Slice | Contents | Schema |
|---|---|---|
| ~~**A**~~ | ~~the primitives above~~ — **SHIPPED v3.95** | none |
| ~~**B**~~ | ~~**#13 Teas revision** + **#05 Vessels**~~ — **SHIPPED v3.96** (R75–R78 came out of its plan review) | none |
| ~~**B2**~~ | ~~**#06 Add / edit tea** + **#03 Tea detail**~~ — **SHIPPED v3.97** (R80–R84 came out of its plan review) | none — but see R81 |
| ~~**B3**~~ | ~~**The freshness model**~~ — **SHIPPED v3.98** (R85–R86 came out of its plan review) | **`sql/v3_11-opened-date.sql`** — applied by hand, before the push |
| ~~**C**~~ | ~~**#04 setup + pickers** and **#12 Quick log**~~ — **SHIPPED v3.99** (R87–R89 came out of its plan review) | none |
| ~~**D**~~ | ~~**#02 Sessions** + **#02b detail**, then the **edit-screen move (R58)**~~ — **SHIPPED v4.00**, two commits as planned (R90–R92) | none |
| ~~**E**~~ | ~~**#10 Focus** — alone~~ — **SHIPPED v4.01** (R94–R95) | none |
| ~~**F**~~ | ~~**Social + the R25 pass record**~~ — **SHIPPED v4.02** (R96–R98) | **`sql/v3_10-pass-record.sql`** — applied by hand, before the push; ~~the round's only required migration~~ one of **two**, since R84 gave B3 its own |
| ~~**G**~~ | ~~**Insights** + Origins card (R54) + **#11 Wrapped**~~ — **SHIPPED v4.03** (built to R100–R103) | none |
| **H** | **SPLIT THREE WAYS at the map.** ~~H1: **#08 Shopping** + **#07 Settings row** + R104's scan~~ — **SHIPPED v4.04**. ~~**H2: #37 Origins + the map + the Passport hub-row removal**~~ — **SHIPPED v4.07** at direction 2 (R106 built; R45/R66 discharged). ~~**H3: #09 landing**~~ — **SHIPPED v4.09**, and with it **R3's build is complete**. R19's zero-tea Origins state was found already written (v4.07's empty branch), so the addendum was *verified present*, not authored. `renderLogin()` stayed in `steep-data.js` (R112) | none — `user_settings.settings` is a JSON blob |

Notes that shape the order:

- ~~**B** carries the most new work of any single board (#13).~~ **SHIPPED v3.96.** Its vendor manager was
  restyle-only as planned — `vendorManagerHTML()` and `distinctVendors()` already shipped, and the
  vendorless tea is correctly excluded by `distinctVendors()` rather than surfacing as an empty-name row
  (verified in the browser: nine names, one tea absent). Three things the build found that the plan did
  not: the shipped **sort control had to move** rather than stack (R60a preserves the capability, so
  slice A's E4 was amended one deploy after landing); **`TT_INHERIT` made member rows repeat their
  parent's facts** verbatim, eight lines nine times, so members now render only what they add; and a
  **CSS cascade bug invisible to any "the rule exists" assertion** — `.vessel-tile` declared below
  `.vessel-kanji` silently overrode the plate tint, caught by reading computed background in both themes.
- ~~**B2** was a genuine gap in this table~~ — **SHIPPED v3.97**, and its "schema: none" was **wrong
  when written**. #03 rev 3 and #06 rev 4 together demand **seven** data-model items and the hand-off
  scopes none of them (**R81**); B2 built the schema-none half only. Two further corrections the build
  found: #06's "three missing editables" already shipped, folded, so that work was a *promotion*; and
  Borrow had a shipped twin in `saveSuggestedGuide`, differing only in source, so reusing that writer
  kept the round-trip contract intact for free.
- ~~**B3 is the freshness model and it is bigger than a detail block**~~ — **SHIPPED v3.98.** The
  estimate was right about the size and wrong about one premise: the spec's window key rested on
  `matchTeaType` covering 13 of 14 shelf teas, and at 21 teas it covers 13, so slug→family alone would
  have removed a working reading from four teas. **R85** added `teas.type` as the third rung and
  settled §7.2's `puerh`/`dark` split in one named constant on the way. Original note follows.
- **B3 was bigger than a detail block** — its own spec said so in its own text, and this table
  under-estimated it. It is the single writer for freshness on **every** surface:
  the shelf status line, the picker and the running-low sort, not just #03. **`status-line-test.js` §D
  gets rewritten, not patched** — one slice after B2 repaired that same suite, which is expected, not
  a conflict. Two items from spec §7 are findings for its plan rather than build instructions:
  **7.2**, `teas.type` says `puerh` while `TEA_TYPES.family` says `dark` — two vocabularies for one
  thing, which bites whichever slice touches it first; and **7.3**, `matchTeaType` is exact-name and
  hand-curated, so a rename silently breaks the join, and freshness windows would be the **fourth**
  system hung off it.
- ~~**C**: R43 is new UI over the existing `vesselId`.~~ **SHIPPED v3.99.** That much was right, and
  three of #12's other premises were **false at HEAD**, which is why the slice is built to R87–R89
  rather than to the board: the nav Log opens **setup**, not quick log (the board says "as checked");
  `startSessionFor(null)` **defaults** the tea rather than leaving it empty; and quick log had no tea
  control either, so R43's vessel was one of *two* missing pickers. A fourth finding was a saving —
  **#04's half of the date inversion was already shipped**, `sessionDate` having lived inside *More
  details* since it landed, so the whole inversion was #12's work.
- ~~**D** holds the riskiest single item in the package.~~ **SHIPPED v4.00, and the split paid.** The
  guard (`fixtures/session-edit-test.js`) was written against the working modal, run green *before* the
  move existed, and its diff across the move commit is **empty** — so it measured known-good behaviour
  rather than what the move produced. Two negative controls showed its halves catch different failures:
  a shallow copy reddens the identity checks while the round trip stays green (aliasing shares data
  rather than losing it), and a field-by-field writeback reddens the round trip while the identity
  checks stay green. Original note follows.
- **D held the riskiest single item in the package.** The shipped modal's deep copy
  (`state.editingSession = JSON.parse(JSON.stringify(s))`, `:189`) plus whole-object writeback
  (`state.sessions[idx] = e`, `:262`) is *precisely* what keeps the un-surfaced per-steep taste and
  feedback non-destructive today. R57 says build the gap as drawn — **so that copy semantics must
  survive the modal→screen move verbatim, or a documented non-destructive gap becomes silent data
  loss.** R40's brew-again and copy-to-new land here; **pass-tea waits for F.**
- ~~**E** is alone by its own scope warning~~ — **SHIPPED v4.01**, and the warning was the load-bearing
  part: `fixtures/focus-test.js` §D pins six undrawn steeping states against shipped output, which is
  R53 asserted rather than intended. Two findings: **kachi-iro had never been implemented** (the ring was amber, no token existed, two comments deferred to it as real — R94), and **#10's BUILD-FIRST stamp was expired**, its live-bug headline describing a fix that shipped in v3.92 (R95). Original note follows.
- **E was alone by its own scope warning:** `sessionSteepingHTML()` (`:844`), the timer block
  (`:925–1155`) and `sessionFinishHTML()` (`:1188`) are one surface, and Focus shares it with every
  non-Focus steeping state R53 accepted as round-1. Hold each undrawn state to shipped behaviour and
  flag it. The timer is genuinely two modes + one action (`setTimerMode` `:975`, `useTimerValue`
  `:1067`); a board showing three peers is wrong.
- ~~**F** is the only hand-applied migration in the round~~ — **SHIPPED v4.02**, and the shape grew by
  two columns in review: `teas` is owner-only under RLS, so a recipient handed `tea_id` resolves
  nothing (**R96**), and the row needs a denormalised `tea_name`/`tea_type` snapshot exactly as
  `v3_0-social.sql` gave the feed one. **R97** kept `catalog_slug` out — R36's tier resolves at read
  time, so a later `covers` entry upgrades passes already sent. Two further findings: the board's own
  worked example (Rou Gui → Wuyi yancha) takes the *preview* branch, because `matchTeaType` is
  `covers`-only and `rou-gui` has none (**R98** note); and the **feed had no home on the board**, so
  it became a section rather than being dropped (R61). Original note follows.
- **F was the only hand-applied migration in the round** — **one of two since R84**; B3 carries
  `sql/v3_11-opened-date.sql`. F's own is: `(id, from_profile, to_profile nullable,
  session_id nullable, tea_id nullable, note, created_at)` + RLS, filed after `sql/v3_9-steep-feedback.sql`.
  It gates the Passed-to-you shelf, the per-recipient badge, the kindred reply, R36's three-tier
  destination and #02b's pass-tea link. **Until `to_profile` ships the badge says only "shared"**
  — which, as built, stays true of the *shared-sessions* badge even after the migration: a shared
  sitting and a passed cup are different objects.
- **G**: R54 is a one-line `DASH_SURFACE` entry of `insights` (`steep-dashboard.js:538`) plus a guard
  that the card is not Home-moveable via `dashSurface()`. Cost medians recomputed at build (needs A's
  currency) or rendered as nothing — never 0.17/0.86. Taste-vocabulary panel is GATED: build nothing.
  **Three additions from the slice-G plan review (2026-08-06).** (i) **R100** — `peakBucket`, `topTea`
  and `topType` cannot express a tie; build the shared tie-reporting argmax and let copy name both.
  The defect is **latent**, not live: it was first drafted as live from the stamped export and that
  was wrong, which is the correction R100 carries. (ii) **Re-derive every figure at build from
  live-shaped data** — this slice is made entirely of snapshots, and R67 binds hardest here. (iii)
  The **Origins card's map dependency is unruled**: `origins-map-v3.html` renders through `d3.geoMercator`
  over Natural Earth features, and R28 *defines* the country tier as a polygon label, so there is no
  country tier without polygons. The app has one external runtime dependency (Supabase) and precaches
  everything. Needs a ruling before the card is built; the Code lane's recommendation is that G ships
  the card as an entry point and the map lands once, in H, beside #37.
- **H**: R55 reads the region from `resolveTeaType(slug).region`, never a board literal; R56 builds
  no suggestion list; the three owed coordinate rows mean an accepted offer honestly leaves the tea
  in its country tier, which is what #37's before/after panel draws.

---

## 4 · Session seams

**Not one session — one per slice, and more deploys than slices.** A is one sitting. B is its own (#13
alone justifies it). **B2 is one** — the two tea-form surfaces together. C is one. **D splits in two**
— list-and-detail, then the edit-screen move —
because a regression there is silent. E alone. F alone: the only migration, and hand-applied SQL
wants undivided attention. G and H each one sitting, splittable by appetite.

**The hard constraints are now three:** A lands before B–H; F lands before #02b's pass-tea link; and
**B3 follows B2** (R84) — its migration and its retirement of `statusCategory` reach the shelf, so it
wants a settled Teas surface under it. Everything else is order-flexible.

Per-surface discipline, unchanged: one deploy per commit, `CACHE_NAME` / `APP_VERSION` / `WHATS_NEW`
in lockstep, CHANGELOG naming exact files, fixtures against real CSVs, verifier dry-run,
judgment-calls section in every ship report.

---

## 5 · Verification record

Checked against HEAD while reviewing, so the next session need not redo it:

- `es_setSteep` (`steep-sessions.js:208`) has exactly three callers (`:286–288`), none passing
  `tags` — R57's gap is real and non-destructive.
- `openSessionEdit()` `:186`; overlay/modal at `:292–293` — R58's premise holds.
- `SORT_OPTS` has seven entries (`steep-teas.js:248`), handler `setTeaSort` `:308`; `setTeaFilter`
  `:309` and `focusLogSteep` (`steep-sessions.js:966`) have **zero callers** — R60 holds.
- `monoFont`: **zero occurrences in any `.js`** — R48/R61 hold; the only trace is the stale synced
  key visible in `fixtures/user_settings_rows.csv`.
- Bottom nav `steep-core.js:894–903`, label "Teas" at `:899` — R62 holds.
- Passport: `PASSPORT_LAND:12` · `PASSPORT_GEO:40` · `PASSPORT_SUB:64` · `passportCountryFor:100` ·
  `passportSubFor:105`, and **zero cross-module consumers** — R66 holds.
- Ledger R1–R66 contiguous, no duplicates.

**Not verifiable from the repo at HEAD** — the local export is short of the authority one (F3):
the "Travel cuppa" vessel's stored `type`, and photo coverage across all five vessels (the three
present all carry photos). Both are R63 scope notes rather than load-bearing premises — R63's
decision rests on `VESSEL_TYPES` having no traveller entry, which **is** verified — but confirm both
when the fresh export lands.
