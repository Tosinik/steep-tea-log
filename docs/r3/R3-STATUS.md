# R3-STATUS — the running state of the R3 round

**Updated: 2026-08-05 (slice F shipped as v4.02; R96–R98 issued at its plan review) · §5 by the Code lane.**
This is the single source of truth for where R3
stands. Any fresh chat, fresh Design session, or Code session reads this FIRST. It is updated at
the end of every working session and committed to the repo (`docs/r3/R3-STATUS.md`) at every
natural milestone via Code. If this document and anyone's memory disagree, this document wins —
and if this document and the live repo/export disagree, the repo/export win and this document
gets corrected.

**Authority order (binding):** live repo → the current export, stamped → rulings ledger →
this status doc → boards (visual reference) → nobody's memory. *(R67 — the tier names no date: one
that does becomes wrong the next time a cup is brewed, and did.)*

---

## 1 · Rulings issued this round (from R32; the ledger holds the current tail)

R32–R41 committed in `9f54672`; **R42–R56 committed in `00009b6`** (banking session, 2026-07-25);
**R57–R62 committed with the hand-off** (2026-07-25 rulings, committed 2026-07-26); **R63–R66 at the
Code lane's plan-mode review** (2026-07-26); **R67–R73 across slice A's build and ship**, **R74
after it** (2026-08-04), and **R75–R98 across slices B–F**, the tail being **R96–R98 at slice F's
plan review** (2026-08-05). All are in the ledger, contiguous — no gaps, no duplicates. A ruling is not
real until it is in the committed ledger; these are. **R67 onward are summarised in the ledger only**
— this section is not a mirror of it, and the ledger is the tier that wins.

**R63–R66 are build rulings, not reopened design questions.** They correct the engine model where
the hand-off's §0 described it more loosely than the code — which is the challenge-don't-absorb
instruction working as intended, not a regression in the round's closure.

- R32 Landing copy all-new, canonical as drawn, minimal.
- R33 Ensō = door + timer, never the app icon.
- R34 Invite line passive ("invitation-only for now"), no redeem mechanism. *Caveat recorded:
  Supabase signups are toggled ON — the line is copy, not enforcement; gating = beta-hardening task.*
- R35 Presence parked post-beta (kept in Social file, marked PARKED).
- R36 Passed-tea destination three-tier: catalog Go-Deeper when covered, else minimal preview.
- R37 Wrapped Share/Save accepted — pull-only, never auto, never names people; Save-image may slip.
- R38 Wrapped period = monthly, explicit; yearly sibling later; v3.64 seasonal scope changes at build.
- R39 Picker swatch long-press colour correction ratified.
- R40 #02b out-links accepted: brew-again (carries vessel+method), copy-to-new-entry, pass-tea.
- R41 Line-art pipeline retired (retroactive record) — photos are vessel identity, kanji fallback.
- R42 Sessions keeps the shipped Brewing-days heatmap (v3.44 ruling reaffirmed), list default.
- R43 Quick log gains an optional vessel field. *Scope note: the draft already carries a
  `vesselId` — `startSessionFor()` (`steep-sessions.js:359`) sets `vesselId: state.vessels[0].id`
  at `:364`; `quickLogSession()` (`:351`) sets nothing itself, it calls `startSessionFor(null)`.
  The quick-log screen has no vessel control at all: `sessionQuickHTML()` runs `:427–473` with
  zero vessel references, and the `vesselOpts` select at `:488` belongs to `sessionSetupHTML()`
  (`:474`). So R43 is **new UI over an existing field**, not already-shipped.*
- R44 Profile avatar on tab-level screens only; never immersive surfaces (Focus etc.).
- R45 Hub = social · shopping · settings. Passport absorbed by Origins (#7 closed); achievements
  dropped. `steep-passport.js` fate → Code decision item. *The Passport hub row is genuinely
  shipped (`hubSheetHTML`), so this is a real shipped-control removal.*
- R46 Origins nests in Insights, default bottom card (= bottom of the MORE stack), card-manager
  moveable — **as narrowed by R54**.
- R47 The door draws only configured providers — "Continue with Apple" removed.
- R48 monoFont row stays off the Settings board. **Amended 2026-07-25:** the clause instructing
  Code to remove the shipped control is **void**. `monoFont` was retired in **v3.53** (`87591dc`) —
  Settings row, `DEFAULT_SETTINGS` key, `html[data-mono="clean"]` CSS and the `data-mono` setter all
  went then, and the CHANGELOG records the leftover synced key as harmless with no migration. Zero
  occurrences in any `.js` at HEAD. The ledger's Settings note ("live in schema; one user has
  `pixel`") describes **stale synced data**, not a live control. No code work.
- R49 Wishlist→library join = normalized-name match; misses flagged; revisit post-R26 slug.
- R50 Method control = FOUR drawn lanes — **gongfu · senchadō · western · cold brew** (ruled
  2026-07-21). Clarifies R1 (four-lane design stands; the cold-brew lane sets `is_cold_brew`);
  order matches shipped `SESSION_METHODS` (`steep-sessions.js:549`, three entries + the boolean).
  Supersedes the hand-off's §0.1 three-plus-toggle instruction.
- R51 Go Deeper is **both**: a browsable reference surface living as the **Teas tab's second mode**
  (your shelf ↔ the reference), plus contextual entries from Tea detail, the brew-guide
  "Borrow from Go Deeper" action, and R36's passed-tea path. Explicitly **not** reached through
  the profile hub.
- R52 Vendor manager's home is the **Teas shelf's overflow** (vendors are `teas.source`-derived;
  Teas is where tea data is managed). Restyle only — `vendorManagerHTML()` and `distinctVendors()`
  already ship; string-based for R3, vendor entity + url deferred with R12.
- R53 **Bundle-1 acceptance is split** (ruled 2026-07-25). Home and the non-Focus steeping states
  are accepted as round-1: Bundle 1 is behavioural reference only, and just the visual contracts
  and §0 primitives apply. **Teas gets one revision board** (#13), because it alone carries new R3
  work — R51's second mode, R52's vendor overflow, the header rework, the open rename. Closes the
  round's last open design question. *Engine note: Focus and the non-Focus steeping states are the
  same shipped function — `sessionSteepingHTML()`, plus `sessionFinishHTML()` for end/save — so the
  Focus rebuild necessarily touches them. Hold every state the Focus board doesn't draw to shipped
  behaviour and flag it; do not invent one.*
- R54 **The Origins card is pinned to Insights for R3** (ruled 2026-07-25). R46 makes it
  card-manager moveable, but `dashSurface()` lets a user move any card between Home and Insights
  (v3.47), which would let a map card land on a surface with no revision board. Register it with a
  `DASH_SURFACE` entry of `insights`; revisit when Home gets a board.
- R55 **Catalog origin offers must name one place** (ruled 2026-07-25). R26's offer path may only
  propose a catalog region that (a) names a single place — no slash-pairs, no parenthetical lists,
  (b) sits **inside the country already stored** on the tea, (c) has parentheticals stripped. A
  catalog region naming a different country than the stored origin is a **conflict, not an offer**:
  no default, no one-tap accept. Read the region from `resolveTeaType(slug).region`, never from a
  board literal — `region` inherits from the parent row (`TT_INHERIT`, `steep-tea-types.js:74`).
- R56 **The Origin field gains no suggestion list in R3** (ruled 2026-07-25). #37's OR4 describes
  "the existing origin autofill" as shipped; there is none. The field is
  `<input type="text" name="origin">` with a placeholder and no `list=` (`steep-teas.js:431`); the
  only datalists are `vendorList` and `wishVendorList`, both fed by `distinctVendors()`.
  `KB_REGIONS` is a recognition table for `kbResolve()` — bare lowercase tokens (`wuyi`, `alishan`,
  `nantou`) that a coordinate table keyed on normalised full strings could never resolve, so it is
  the wrong source on shape, not just on scope. The field stays free text; R55's offer card is the
  only new affordance on that screen. A `distinctOrigins()` list mirroring `distinctVendors()` is
  the natural R4 follow-up.
- R57 **#22 deferred post-R3** — "beneath water temp" already ships (`steep-sessions.js:286–288`),
  "collapsible" is drawn nowhere, and the per-steep taste-words gap stays a documented
  non-destructive known issue that #02b rev 2 reproduces. Build the gap as drawn.
- R58 **#28 closed** — shipped edit is a modal overlay (`steep-sessions.js:292–293` via
  `openSessionEdit()`); #02b rev 2's dedicated edit screen satisfies "somewhere less intrusive".
- R59 **Washi unchanged for R3** — probation stands (Home masthead only, held to its contract). Home
  is round-1 by R53, so nothing this round touches it. Revisit when Home gets a board.
- R60 **#23 splits three ways** — (a) the shipped seven-option sort select is **preserved exactly**
  (`steep-teas.js:248`, handler `:308`, restored v3.84); #13 not drawing it is not authorisation to
  remove it. (b) `setTeaFilter` (`:309`) and `focusLogSteep` (`steep-sessions.js:966`) stay dormant
  with zero callers — regressions accepted for R3, functions left in place, no controls drawn.
  (c) Sort persistence stays session-scoped; durability is a later `user_settings` question.
- R61 **Absence from a board is not a removal instruction** — any shipped control a board doesn't
  draw is preserved unless a ruling names it. R3's only removal is the Passport hub row (R45); **not**
  monoFont (retired v3.53, R48's instruction void). The general form of the trap the sort control
  exposed, and the counter to failure mode 6.
- R62 **No Teas→Library rename** — the shipped tab is Teas (`steep-core.js:894–903`) and stays Teas.
  Cheap to do later on its own; not worth moving nav + #13's header + Map 2 + the hand-off's prose
  together in a closing round. The boards' rename flag is **closed, not pending**.
- R63 **The vessel identity ladder is new code, not a map extension** — §0.3 cited `shelfPhoto`
  (the *tea* tile, kanji on `tea.type`); the vessel thumb is `steep-sessions.js:111`, two steps, no
  kanji. Build `vesselPhoto(v,kind)` + `VESSEL_KANJI` + `.v-<type>` tints in both themes. Map covers
  **Gaiwan 蓋碗 · Shiboridashi 絞 · Cold brew jar 冷 only**; **旅 dropped** (no traveller type). Every
  export vessel has a photo, so the rung is invisible today — graceful degradation, built small.
- R64 **The method control draws no lane when `brew_style` is null** — `brewMethodFor()` never
  returns null (capacity ≤150 ml → gongfu, else western), so a lit lane on a null row would present
  a capacity guess as a record. Stored value only; the derived reading stays in read-only
  `esMethodReadLabel()`. JC1 verbatim: `es_setBrewStyle` the only writer, `saveSessionEdit` passes
  `brewStyle` through untouched — **opening a null session and saving writes nothing.**
- R65 **`brew_guide` structured pills are out of R3** — no ruling requires them; #03/#06 state free
  text; not worth a migration for a presentation change.
- R66 **`steep-passport.js` kept, stripped, mined** — drop the hub row and the passport view; retain
  `passportCountryFor()` (`:100`), `PASSPORT_GEO` (`:40`), `PASSPORT_LAND` / `PASSPORT_SUB` for
  Origins. Verified zero cross-module consumers today.

**Ledger reconciliation — DONE in `00009b6`.** R1 now carries "superseded in part by R50 —
control order is gongfu · senchadō · western · cold brew", so no lane reads stale R1. (Caught by
Design — correct challenge behaviour.)

Confirmations recorded (not rulings): **°F stays** (explicit); **low-stock threshold 11 g is
Niklas's real setting** (default is 15); **grandpa style ruled out** (three methods only).

## 2 · Canonical numbers — re-verified against the 2026-07-19 CSVs on 2026-07-25

The five relayed CSVs (teas · sessions · steeps · vessels · tag_library) were recomputed row by
row this session. **Verified:** 22 tea rows (21 live, Test deleted) · 31 sessions · 103 steeps ·
5 vessels · dates 3–19 Jul, **16 distinct days** · totalGrams **130.5 g** · **12.51 L**
((water_ml or vessel capacity) × steeps) · type mix BY SESSION **green 15 · oolong 11 · white 3 ·
yellow 1 · puerh 1** · mood **15/31 (48%)** · shared **5/31 (16%)**, dates 4 · 5 · 6 · 8 · 11 Jul ·
running low **Honey Oolong Gui Fei 7 g · Sencha Kagoshima Premium 8 g** · vessel usage **Dragon
Gaiwan 16 · Main Kyusu 9 · Mogake Shiboridashi 4 · Travel cuppa 1 · Hario Coldbrew 1** ·
tag_library **15** (spinach and milky arrived 07-20 and are correctly absent from an 07-19 export).

**Method split, with its definition.** `brew_style` is senchado 13 · gongfu 10 · **blank 8**, and
`is_cold_brew` is true on exactly one row **whose `brew_style` is blank**. So 8 is the null count
and 7 is the display count once the cold-brew lane claims its session: `13 + 10 + 7 + 0 + 1 = 31`.
Boards use the display form. Both numbers are correct; they are not a contradiction, and the
ledger's "untagged 8" should carry this note rather than be changed.

**Clock peak is local, not stored.** Raw hours peak at 07 UTC; rendered in local time (CEST) that
is 09. The **08–10 peak, 12–14 second, nothing after ~14:00** claim is correct as displayed. Do
not "correct" it from the raw column.

**Origin split.** Country-only strings: China ×5, Taiwan ×3, Thailand ×1 = nine. The tenth is
Moragella Oolong at `Ceylon, Sri Lanka`, which normalises into the country tier because R16 rules
Ceylon a country synonym. **Ten country-only · eleven region-tier · 21 live teas.** R16 verified.

**Catalog coverage of the country-only ten** (`covers` match, region resolved through
`TT_INHERIT`): six covered, three offerable under R55 — Dawang Feng Da Hong Pao
("Wuyi Mountains, Fujian, China"), Honey Oolong Gui Fei ("Lugu, Nantou, Taiwan"), Ali Shan Fo Shou
Dong Pian ("Chiayi County, Taiwan" after stripping "(~1000-1500m)"). Three suppressed — Oriental
Beauty (catalog says Taiwan, stored says China: a country conflict), Huang Ya Yellow Tips
("China (Sichuan / Anhui / Hunan)" is a list), Ruby Ruanzhi ("N. Thailand (Santikhiri) & Taiwan"
spans two countries). **None of the three offerable regions has a coordinate row**, so today every
accepted offer honestly leaves the tea in its country tier.

**Vendors — new, from `teas.source` across the 21 live teas.** MainTee Würzburg 5 · Tee Kontor
Kiel 3 · Si Fang Guan - Freiburg 3 · Bamboo Tea Room 3 · Bohea Telehandlung Berlin 2 · Diez GmbH 1
· Teerausch 1 · Tea Addicts 1 · Jesse's Tea Housr 1 · **one tea with no vendor**. Nine names, not
five. Two are live rename cases for R52 — the typo "Jesse's Tea Housr" and the stray hyphen in
"Si Fang Guan - Freiburg" — and the blank source is an edge no board draws: a tea with no vendor
must not surface under an empty-name row.

**Not export-verified, held as Niklas-confirmed:** the wishlist row (Shincha Saemidori Kagoshima ·
Bamboo Tea Room · `done=false`, naming a tea on the shelf at **0 g** — the 0 g is export-verified).
The `wishlist` and `user_settings` tables are not in the relayed CSV set.

**NOT REPRODUCED — do not draw as fact.** Insights rev 3 shows **€0.17/g · €0.86/session** and
states its method as `cost_total ÷ grams`. That method on this export gives median **€0.236/g**
across the 14 costed teas and **€0.99/session** across 23 sessions; pooled cost ÷ pooled grams
gives €0.234/g. The 07-08 export gives 0.22 / 1.70, so this is not simple staleness. The figure's
provenance is unknown. Either its method is stated and it reproduces, or the board takes the
recomputed pair.

**Engine models** *(restamped v3.96 — three of these described work that has since shipped, which is
exactly R74's case)*. Method control = **four drawn lanes** over three stored values plus the boolean,
`methodLanesHTML()` the single writer since **v3.95**; ~~three segments + an `is_cold_brew` toggle~~ — cold
brew is a peer lane and both checkboxes are gone. Stock
tiers = FIVE (`empty · untracked · low · few · plenty`), cups-based when guide data exists, else
grams < threshold (Niklas: 11). Vessel image = **photo → kanji plate → type-tinted stripe** —
~~photo → tinted stripe → kanji, map "being extended"~~: the order was stated backwards and the map is
**built**, `VESSEL_KANJI` + `vesselPhoto(v,kind)` since **v3.95**, with `kind:'tile'` added in **v3.96**.
`brew_guide` is free text today; structured pills = NEW schema (out of R3 per R65).
Bottom nav ships **Home · Teas · Log · Sessions · Insights** (`steep-core.js:894–903`) — the tab is
**Teas**, not Library (R62). Vessels is a **segment of the Teas tab** (`goVessels()` sets
`state.teaSeg='vessels'; state.view='teas'`, v3.46), not an overlay — and since **v3.96** `teaSeg` is
three-valued (`teas · vessels · deeper`), Go Deeper being the tab's second mode.

## 3 · Board inventory — final, as exported 2026-07-25

25 files + MANIFEST, stamped repo ref `9f695e2`, superseded revs removed. **Banked in `98891a6`
and verified from a fresh clone of the remote: 26/26 sha256 byte-identical to Design's zip,
MANIFEST exact 25/25 in both directions, 20 `.dc.html` boards actually tracked, 13 round-1 PNGs
preserved.** (There are 21 board files: the 20 `.dc.html` plus `origins-map-v3.html`, which is plain
`.html` and was never in reach of the `*.dc.html` rule.)

| Board | Rev | Verified against |
|---|---|---|
| #02 Sessions (list + Brewing-days toggle) | rev3 | R42; heatmap real (`steep-dashboard.js:355`) |
| #02b Session detail + edit | rev2 | R50 order ✓ |
| #03 Tea detail | rev3 | export ✓ |
| #04 Session setup + pickers | rev6 | R50 in control, 3 annotations **and** header prose ✓ |
| #05 Vessels | rev1 | real five ✓ |
| #06 Add / edit tea | rev4 | export ✓ |
| #07 Settings | rev2 | SET5's monoFont code instruction void per amended R48 |
| #08 Insights (incl. Origins card) | rev3 | figures ✓ **except the cost medians (§2)** |
| #08 Shopping | rev4 | wishlist restored to the one-row state; SH1 CHECKED |
| #08 Social | rev3 | presence PARKED |
| #09 First run / landing | rev1 | R32–34, R47 |
| #10 Focus (steeping) | rev2 | R44 scope note ✓ |
| #11 Wrapped | rev1 | 16 d · 130.5 g · 08–10 ✓ |
| #12 Quick log | rev1 | R43 (exposes an existing field) |
| **#13 Teas revision** | **rev1** | **R53 · R51 · R52 · header rework · Vessels segment; #23 shown HELD** |
| #37 Origins refinement | rev2 | R55 drawn in full; ten-not-nine; catalog string verbatim |
| Origins map | v3 | 8/8 coordinate rows verified |
| Map 1 — surface matrix | rev2 | held-decisions group added |
| Map 2 — navigation | rev2 | R51/R52 on Teas; Vessels corrected to a segment |
| Bundles 1 & 2 | snapshots | round-1 **behaviour** reference only, never visual authority |

**Two defects recorded, banked verbatim rather than fixed in transit.** (a) The MANIFEST claims
"ALL BOARDS 77cf800 → 9f695e2"; `02b` and `04` still read `repo 77cf800`, and `03` plus both
bundles carry no stamp. Do not later read those stamps as evidence of what the boards were checked
against. (b) #37 rev 2's illustrative suggestion array still contains "Wuyi Shan, Fujian, China", a
string that appears nowhere in shipped code — the invention its own OR2 warns against, now moot
under R56.

## 4 · Design queue — CLOSED

The final pass delivered all six commissioned items: Shopping restored to the verified one-row
state (rev 4, withdrawal noted), the new #13 Teas revision board, #37 rev 2 carrying R55 in full,
Map 2 rev 2 placing R51/R52 on Teas and correcting Vessels, Map 1 rev 2 with the held-decisions
group, and #04's header prose corrected. Each was verified individually against the boards' own
content, not against the completion summary.

The MANIFEST's open-items list accurately states what Design did **not** decide: the tab name,
#23 gating sort/filter, #22 · #28 · washi, the three owed coordinate rows, and the R1↔R50 ledger
reconciliation. No further Design work is queued for R3.

## 5 · Code state

**v4.02 LIVE — R3 slice F: Social + the R25 pass record** (cache **v112**, **`sql/v3_10-pass-record.sql`
applied before the push** — the round's second and last migration, and the one where filename order
genuinely differs from version order). The migration grew by two columns at review: **R96** —
`teas` is owner-only under RLS, so a recipient handed a `tea_id` resolves nothing, and the row needs
the same denormalised snapshot `v3_0-social.sql` §3 gave the feed. **R97** kept `catalog_slug` out,
so R36's destination resolves at read time and a later `covers` entry upgrades passes already sent.
The RLS was read against the shipped gate rather than approved from a plan: circle reads use the same
direction as "followers read shared sessions", and both `follows` subqueries name the current user on
one side of the edge — a policy subquery does not bypass RLS, so a lookup naming them on neither side
would have made every pass vanish with no error.

Social is now **one screen**. The board absorbed two of three shipped tabs and orphaned the feed, so
the feed is a section below Passed-to-you (R61 protects the capability, not the chrome), and the
circle draws **both directions** of the follow graph — `getFollowers()` is new, and a follower you
don't follow back was invisible to every read the app had.

Three things a later slice inherits. **(a) The Passed-to-you shelf is empty by construction** and a
*failed* read renders differently from an empty one — "nothing passed yet" over a 404 is a lie shaped
exactly like the truth. **(b) `.social-tile` carries no `background` on its base rule**: it and
`.t-green` are both (0,1,0) and this CSS block sits below the palette, so a base background flattens
every type tint — slice B's `.vessel-tile` bug, reproduced and caught the same way, now guarded.
**(c) §E of `pass-record-test.js` is the app's first guard on text another user authored** — note,
tea name and sender name all reach an innerHTML template, and the assertion counts handlers in
*attribute position*, because escaping neutralises rather than strips. **23 committed suites, all green.**
**NEXT: slice G** — Insights + the Origins card (R54) + #11 Wrapped. R68 governs its prose and the
cost medians must be recomputed or rendered as nothing.

**Previously: v4.01 — R3 slice E: #10 Focus** (cache **v111**, no SQL). A **restyle, not a rescue**: #10's
live-bug headline describes a fix that shipped in v3.92 (**R95**), and its `BUILD · FIRST` stamp
expired with it. **R94** makes visual contract 4 real for the first time — kachi-iro had shipped
unimplemented for the whole round, with the ring on `#E3A15C` amber and two repo comments deferring to
a token nobody had created. Four tokens now land in both theme blocks and the ring reads them; the
non-Focus steeping chrome keeps its shipped amber and jade, because that surface is round-1 under R53
and "one surface total" is the contract. Focus is always dark regardless of page theme, so it pins
kachi's dark lift in a scoped re-declaration rather than a hex at the render site. The `✓ saved` state
is a **read** of the v3.92 write, drawn because that write had been silent for weeks.

Three things a later slice inherits. **(a)** Kachi is confined by a guard, and confinement is the
assertion that decays silently — nothing breaks when an accent spreads. **(b)** `focus-test.js` §D is
R53's guarantee made executable: six undrawn steeping states pinned against shipped output, because
Focus and every non-Focus state are the same function. **(c)** The timer's two-modes-plus-one-action
shape, R44's no-avatar and Focus's dark field were **verified and left alone** — stated so they are
not "corrected" later.

**Previously: v4.00 — R3 slice D: #02 Sessions + #02b detail + the edit-screen move** (cache **v110**, no
SQL). Two commits by design. **The guard came first and held**: `fixtures/session-edit-test.js` was
written against the working modal, run green before the move existed, and is byte-unchanged across it
— 67 field-values ride on the deep copy + whole-object writeback and nothing in the UI would show
their loss. Editing is a screen (R58); only the shell changed. Rows open **detail**, not the edit form.
**R90** shows no method on a null row including the hero; **R91** carries the vessel always and the
method only when stored; **R92** merges the calendar and the heatmap behind one toggle with the list
as default. Pass-tea is **omitted** until slice F's migration — **it landed in v4.02**.

Three things a later slice inherits. **(a)** The two copy mechanisms are load-bearing and now guarded —
do not "simplify" either. **(b)** `esMethodReadLabel()` is the *only* place a derived method may
appear, on the edit surface. **(c)** Closing the Brewing-days toggle clears `calSelDay`, so no
off-screen control can leave the list narrowed.

**Previously: v3.99 — R3 slice C: #04 Session setup + #12 Quick log** (cache **v109**, no SQL). Built to
**R87–R89** rather than to #12 rev 1, because three of its premises were false at HEAD: the nav Log
opens **setup** (the board says "as checked" that it opens quick log), `startSessionFor(null)`
**defaults** the tea rather than clearing it, and quick log had **no tea or vessel control at all**.
So: the nav keeps its destination, both pickers are built on setup's own `<select>` mechanics, and the
tea **carries forward** instead of starting empty — clearing it would discard a choice made one tap
earlier. The date inverts with relative chips on #12; **#04's half was already shipped**, folded inside
*More details*. The schedule strip names its derivation, generated; the mood pill is computed from the
user's own sessions rather than transcribing the board's stamped `48% (15/31)`. **#14's listbox is
deferred (R89)** — its long-press colour correction cannot ship while R78 and R82 stand.

Two things a later slice inherits. **(a)** The active WHEN chip is **derived from `sessionDate`**, not
stored beside it — one field, one source. **(b)** R72 is untouched: setup is still `resolve:true`, the
edit surface still `resolve:false`, and `draftFingerprint` still guards `sessionDate`, now user-visible.

**Previously: v3.98 — R3 slice B3: the freshness model** (cache **v108**, **`sql/v3_11-opened-date.sql`
applied before the push** — the round's first migration). Freshness counts from `teas.opened_date`,
not harvest; harvest is a fallback that says it assumes the pouch stayed sealed; purchase is
deliberately off the ladder. Two groundings failing independently — clock × window — with **no clock →
no block at all**. **R85** made the window key a three-rung cascade (slug → family → `teas.type`)
because the spec's catalog-only key was decided at 13-of-14 coverage and the shelf is now 21 teas at
13; slug→family alone would have removed a working reading from four teas, including the only pu-erh,
which has no catalog row. `statusCategory`, `freshnessClass`, `freshnessStyleWord`,
`freshnessWeeksLeft` and both global window constants are **deleted**. **R86** keeps `ageing` as
catalog data; the per-tea override is an open product call.

Two things a later slice inherits. **(a)** `TT_TYPE_TO_FAMILY` is the single place the `puerh`/`dark`
vocabularies meet (§7.2) — a guard asserts it is not inlined twice. **(b)** The elapsed-only rung now
has zero live examples and that is not a defect: rung 3 means a real tea is never window-less, so the
rung is defensive rather than routine (the R70 shape).

**Previously: v3.97 — R3 slice B2: #06 Add / edit tea + #03 Tea detail** (cache **v107**). R51's other half:
slice B built the browsable mode, B2 builds the **contextual entries** — Go Deeper reached from Tea
detail, and **Borrow from Go Deeper**, which is the shipped `saveSuggestedGuide` gesture against the
catalog instead of the KB. The catalog has no per-step times, so a borrow is temp + ratio over a
`generateFormTimes` schedule, written through `scheduleToGuideText` so it round-trips. **The no-guide
guard is kept, not widened**; the source line names which rung answered; and where the catalog doesn't
cover a tea, every control is **absent, not disabled**. #03 splits into character and provenance
clusters with empty fields **omitted rather than dashed**; the ⋯ menu carries only what exists (pass-tea
rides F). #06 makes Add and Edit distinct states — rating, brew guide and favourite promoted **on Edit
only**, and nothing else. **R80–R84** came out of the plan review. **No SQL.**

Three things a later slice inherits. **(a) R81's fence**: these two boards demand seven data-model
items and the hand-off scopes none — B2 built the schema-none half, and the rest needs rulings and
migrations first. **(b) The freshness block is untouched, position included** — B3 replaces the
reading per the spec's §3/§4, not the slot. **(c) The read-only guard caught its own slice**:
`borrowGuideFrom` was drafted into `steep-reference.js` and section A failed immediately, so it and
`goDeeperFor` live in `steep-teas.js` beside their twin.

**Previously: v3.96 — R3 slice B: #13 Teas revision + #05 Vessels** (cache **v106**). The Teas tab gains **Go
Deeper** as its second mode (R51) — new `steep-reference.js` over `browseTeaTypes()`, **read-only by
contract** and guarded structurally by `fixtures/reference-test.js` — plus the header rework (title ·
generated count line · ⋯ sheet), the mode pair over a shelf-mode-only segment row (one three-valued
`state.teaSeg`), R52's vendor manager reached from the ⋯, and #05's vessel list on slice A's
`vesselPhoto(v,'tile')`. **R75–R78** came out of the plan review. **No SQL.**

Three things a later slice inherits. **(a) Coverage is drawn honestly** — `matchTeaType` is exact-fold
`covers`-only, so 12 of 21 teas match and **16 of 27 categories render dimmed**; that is the catalog's real
reach, and the same gap `tea-types-test.js` G reports. **(b) R60a means relocation, not pinning** — sort
moved into the ⋯ sheet and slice A's E4 was amended one deploy after landing, to a strictly stronger pair.
**(c) `TT_INHERIT` makes member rows near-empty by design** — they render only what they add, with
confidence exempt so a contested member keeps its hedge.

**Previously: v3.95 — R3's first code deploy** (`d34af32`, cache **v105**, pushed 2026-07-26; entry-path pins
in `e29cc17`). **Slice A: the shared primitives, before any surface.** Currency is a preference
(`DEFAULT_SETTINGS.currency='€'` + `currencyFmt()`, six sites, one writer — three had the wrong symbol
including a dormant one, three had none) · `methodLanesHTML()` is the single writer for the four drawn
lanes, with cold brew a **peer lane** replacing both checkboxes (tapping a lane still exits cold-brew
mode, which is what makes R61's "replacement not removal" true) · dead `ratioSetupHTML` **deleted** ·
`vesselPhoto(v,kind)` + `VESSEL_KANJI` (蓋碗 · 絞 · 冷; **旅 dropped**) + `.v-<type>` tints in both theme
blocks · two guards that *are* the deliverable (`shelf-order` +E R61 sort preservation, +F tier
single-writer) · new `fixtures/vessel-identity-test.js` (62 checks, 17th suite). **No SQL.**

Two behavioural contracts a later slice must not break: **R72's `resolve` flag** (a draft lights what
`commitSession` will store; a record shows only stored `brew_style` and lights nothing when null — JC1
verbatim, opening a null session and saving writes nothing) and **cold-brew entry** (`isColdBrew` is
read *before* `resolve`, so the cold lane always wins alone; `brewStyleLocked` deliberately survives
the tap because it is inert — the only exit is an explicit lane tap that overrides any prefill). Both
pinned in that suite, §C and §G.

**Previously: v3.94** at HEAD `9f695e2` (with `e21ee72` · `9f54672` · `ac49794`): flavour tree dataset
+ R31 recognition layer, citations complete (Gascoyne · Marchand · Desharnais · Américi, Third
Edition), ledger R32–R41, allowlist tick, session-edit known-issue.

**Banking session — PUSHED AND VERIFIED 2026-07-25** (docs-only: zero app files in the range,
`CACHE_NAME` / `APP_VERSION` / `WHATS_NEW` / CHANGELOG all zero diffs, so nothing surfaced a
Refresh banner).

1. `98891a6` — the 25-file board export + MANIFEST into `docs/r3/boards/`, banked verbatim,
   existing PNGs kept as round-1/parked record.
2. `00009b6` — ledger addendum R42–R56 · the R1↔R50 amendment · the R48 amendment · §4's
   coordinates item CLOSED (`DATA-region-coordinates.md` reads 8/8, table complete) · the untagged
   7/8 definitional note · `milky` reconciled into `DATA-flavour-tree.md` §2, with the
   code-ahead-of-doc asymmetry recorded rather than quietly patched.
3. `59715fd` — `docs/r3/R3-STATUS.md` created. That is the commit the file *first appeared* in, not
   the commit holding the text you are reading: this document is amended in place at every
   milestone (`ded1717` refreshed it post-banking, and the hand-off session amended it again). For
   the current text, read it at HEAD.
4. `26bdb05` — `STATE.md` catches up: it now names this document as first read and outranked only
   by repo and export.

**Two repo rules the banking established — do not tidy either away.** `.gitignore` carries
`!docs/r3/boards/*.dc.html`; the bare `*.dc.html` above it would otherwise silently drop all 20
boards while committing the other six files, and the count check is what catches it.
`.gitattributes` pins `docs/r3/boards/** -text`; without it Git-for-Windows `autocrlf` smudges
LF→CRLF on checkout, so a Linux clone hashes 26/26 green while a Windows clone shows 23 text files
failing — and the hazard is someone "repairing" that by committing CRLF blobs, which would destroy
the verbatim record while looking like housekeeping. Both files carry comments saying so.

**Hand-off session — committed 2026-07-26, docs-only, two commits.** The implementation hand-off entered the
repo, and the ledger closed out with R57–R62. Again zero app files, so again no Refresh banner. See
§6.

## 6 · The hand-off — WRITTEN, COMMITTED, IN CODE'S HANDS

`docs/r3/R3-IMPLEMENTATION-HANDOFF.md` is committed. It was banked verbatim as delivered — 457
lines, sha256 `82c8f55e36333ee3…`, verified on both the working file and the staged blob — and has
been **amended since**, so the file at HEAD deliberately no longer matches that hash. It is a living
document, not an archival record like `docs/r3/boards/`; the amendments are logged in its own header.
**Amended 2026-07-26 at the Code lane's plan-mode review:** §0.3 replaced in full (R63) and §1's
method-split warning widened (R64). It supersedes two drafts that existed **only as chat attachments** — which is precisely how they drifted twice (v1 missed Social, Quick log, the bundles
and the visual contracts; v2 wrongly promoted the bundles to visual authority — they are round-1
base *behaviour* reference only). **If you are reading a copy that is not in the repo, stop and get
the committed one.**

The rewrite delivered what §6 previously owed: R50 replaces the three-segments-plus-toggle
instruction in §0.1, §0.5 points at the committed board paths and names `support.js` and `uploads/`
as required build dependencies, the phantom "§6 open items" citation is gone, R42–R56 are folded in,
vendors are carried as the fifth entity with the real distribution from §2, and the
shipped-control-removal list is explicit (Passport hub row = the round's only removal; **not**
monoFont, retired v3.53; **not** a Teas→Library rename, ruled out by R62).

**With R57–R62, R3 has no open design questions.** The four items Map 1 rev 2 carried as held —
#22 · #23 · #28 · washi — are ruled (R57 · R60 · R58 · R59), and so is the tab name (R62). What
remains open is execution plus the §7 items that were never design questions.

The next R3 artefact is Code's implementation plan, which gets a plan-mode review in the planning
lane before any app code is written. Code holds the hand-off with the challenge-don't-absorb standing
instruction: a board or hand-off line that resists the shipped engine is a finding to flag, not a
licence to adapt the engine.

## 7 · Open items and unknowns

- ~~**Four held rulings** (#22 · #23 · #28 · washi probation)~~ — **all ruled 2026-07-25**: R57
  defers #22 post-R3, R60 splits #23 (sort preserved as shipped, `setTeaFilter`/`focusLogSteep`
  dormant, persistence session-scoped), R58 closes #28, R59 leaves washi unchanged for R3.
- ~~**Tab name**~~ — **ruled out (R62).** The tab stays Teas.
- **Three coordinate rows owed by the data lane:** Wuyi Mountains · Lugu · Chiayi. Without them
  R55's three offerable regions all land back in the country tier.
- **Insights cost medians** — §2, not reproduced.
- **Catalog accuracy item** (tea-reference lane, not R3-blocking): `oriental-beauty` is
  `confidence: canonical` with region "Hsinchu / Miaoli, Taiwan" and no acknowledgement of mainland
  production, which is why it collides with a real Chinese-sourced tea on the shelf.
- Niklas, when convenient: Google OAuth consent-screen publishing status (Testing vs Published) —
  completes the signup-gate picture from the toggled-ON finding.
- Next CSV gate: relay `wishlist` + `user_settings` alongside the five, not just export them.
- Beta-hardening bundle (later, one milestone): signup gating (hook/allowlist, NOT the blunt
  toggle) · R34 copy honesty · beta package · domain-stability confirmation.

## 8 · Failure modes this round produced (watch list for every lane)

1. **Confident invention** — invented rows/vendors/claims tagged "checked" (Gyokuro set, "after
   dark", 247 g, tagline provenance). Counter: claims/counts/affordances verified against export
   and code before any board is called done; R27 tags visible ON the board.
2. **Honest-and-stale** — summaries true when written, wrong by send time (log 03–18, 43%, 12/28).
   Counter: figures carry their export stamp; refresh-at-build is explicit, never implied.
3. **Phantom references** — self-minted R-numbers; citations to code lines that aren't the thing;
   the hand-off's own citation to a "§6" that does not exist. Counter: only ledger numbers cite;
   line-cites spot-checked.
4. **Session-memory decisions** — line-art retirement, allowlist "done", inventory staleness.
   Counter: THIS DOCUMENT; rulings numbered the moment they're made; committed within a day.
5. **Completeness blindness** — verifying what's in front of us, not the set (hand-off v1; the
   missing vendors entity; the final MANIFEST's "ALL BOARDS restamped" when five weren't).
   Counter: checks run against the set, never against recall; an "all" claim is checked per item.
6. **Model shrinkage** — "four states", "photo or kanji", dropped R43; describing an origin
   autofill that was never shipped (R56). Counter: engine predicates quoted from code with the
   function named, never paraphrased from a board.
7. **Planning-lane invention by misreading** — an ambiguous one-line answer ("is empty, havent
   rebought it") was resolved as "the wishlist is empty", relayed to Design as verified fact, and a
   correct board was redrawn to a false empty state; a real vendor was called invented. Counter:
   when a user answer is ambiguous, quote it back before relaying; never relay a user answer as
   "verified" — verified means checked against repo or export.
8. **Authority inversion** — the same episode, one layer down: the ledger header recorded 1
   wishlist row and this lane discounted it on the strength of an ambiguous line in a *lower*
   authority document. Counter: when two tiers disagree, the higher tier wins and the lower one
   gets corrected, in that order, out loud.
9. **Verifying a different representation than the one that ships** — three instances, one shape.
   This lane twice described its own output as produced when no such file or edit existed, then a
   third time edited a working copy and delivered a stale export, having verified the source rather
   than the artifact. The `.gitattributes` bug was the same shape from the repo side: blob correct,
   working copy smudged, check green against the wrong representation. Counter: **run the check on
   the thing that travels** — hash the delivered file, not the one you edited; hash the checkout,
   not the blob. (Generalisation owed to the Code lane.)
