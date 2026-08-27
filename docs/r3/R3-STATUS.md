# R3-STATUS — the running state of the R3 round

> **R3 IS CLOSED (v4.09, 2026-08-06). THIS DOCUMENT IS HISTORICAL — do not read it as current.**
> R4 opened at v4.10 and keeps **no separate status doc**: its state is `STATE.md` plus the ledger,
> which is still `docs/r3/planning/R3-RULINGS-LEDGER.md` and **still the one ledger** — numbering ran
> continuously into R4 at **R113**. §7's close-out list below is the accurate record of what R3 left
> open; everything else here describes a round that has finished.

**Updated: 2026-08-05 (slice F shipped as v4.02; R96–R98 issued at its plan review) · §5 by the Code lane.**
This is the single source of truth for where R3
stands. Any fresh chat, fresh Design session, or Code session reads this FIRST. It is updated at
the end of every working session and committed to the repo (`docs/r3/R3-STATUS.md`) at every
natural milestone via Code. If this document and anyone's memory disagree, this document wins —
and if this document and the live repo/export disagree, the repo/export win and this document
gets corrected.

**Authority order (binding), amended by R131:** live repo → the current export, stamped →
**`CLAUDE.md` standing rules** → rulings ledger → this status doc → boards (visual reference) →
nobody's memory. *(R67 — the tier names no date: one that does becomes wrong the next time a cup is
brewed, and did.)* **R131 — `CLAUDE.md` sits above the ledger because it holds standing rules a
ruling must *satisfy*, not rulings; R125 contradicted `CLAUDE.md:129` ("one coherent change per
version") and no ordering check could fire, because the rule was outside the order. The order settles
which document is AUTHORITATIVE, not which is RIGHT — where the higher tier is silent, the lower tier
is the record, not the error.**

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
| **Origins frame ruling** | **—** | **BANKED LATE 2026-08-06 — arrived after the export; see below** |
| Map 1 — surface matrix | rev2 | held-decisions group added |
| Map 2 — navigation | rev2 | R51/R52 on Teas; Vessels corrected to a segment |
| Bundles 1 & 2 | snapshots | round-1 **behaviour** reference only, never visual authority |

**The frame ruling was banked LATE — 2026-08-06, as `origins-frame-ruling.dc.html`** (sha256
`441fceb3075a837b…`, byte-identical to the delivered file; needs `support.js`, already present). It
is the board that ruled **direction 2** and it arrived *after* the 25-file export was banked, so
nobody queued it and it lived only as a chat attachment. The map was then built to a relayed summary
of it. The cost was visible and specific: a Code session searched the repo for its two cited
strings, found neither, correctly concluded from what it could see that they were phantom citations,
and reasoned instead from `origins-map-v3.html` — **the pre-direction-2 map, superseded by the very
ruling it could not read**. Every other board this round was banked and hash-verified so no lane
would have to reason from a summary; this is what happens the one time that is skipped. Three of its
six numbered rules were unimplemented at v4.07 and are named in the v4.08 entry below.

**One defect in it, recorded rather than fixed:** the board's own badge reads **`R107 · RULED`**, and
the committed ledger's **R107 is the completeness-panel deferral** (issued at slice H1). Self-minted
R-numbers are failure mode 3, and this one collides with a live ruling rather than merely floating
free. **The ruling the board carries is now `R110`**, issued 2026-08-06 to give it the number it
never had — so a board that was relayed, built and shipped from finally has one. **Cite R110, never
the badge.**

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

> **NOT THE LIVE VERSION.** v4.09 was **R3's last deploy**, not the current one — R4 has shipped
> v4.10 through v4.15 since. For what is live, read `STATE.md`'s NOW block; this section is R3's
> closing state and stops here on purpose.

**v4.09 — R3's FINAL DEPLOY: slice H3, #09 the door. THE R3 BUILD IS COMPLETE** (cache **v119**, no SQL).
A · B · B2 · B3 · C · D · E · F · G · H1 · H2 · H3 have all shipped.

**`renderLogin()` stayed in `steep-data.js`.** It runs before boot — no `state`, no `render()`, no
inline-onclick pattern — and its handlers are wired directly because the auth functions are private
to that closure. The reason is now in the code, so the next reader does not "fix" it.

**A layout defect shipped in the first cut and was caught by looking.** The board draws the door in
an 812 px frame and distributes with a single auto top margin — composition at 812, a defect at every
other height, because all extra viewport height lands in the one gap between the pillars and the
sign-in. Niklas saw ~500 px of it. **Third defect this round found by using the app, and still none
found by measuring.** Fixed as a **flagged deviation from a board drawn at one height**: the column
is centred with a clamped gap, so the excess sits above and below the group. Reviewed at 667 / 812 /
932 / 1280 — the board is only valid at one of them.

**Two board instructions were not taken, both deliberately.** The board's **"Continue"** is the label
for a mechanism its own flag delegates to Code ("magic-link or password"); the mechanism is decided,
so the label names it — **Send magic link**. And the shipped **autofocus is removed**: it was a
courtesy on a bare login card, but R29 made this the only thing an invitee sees, and the keyboard
covers the half that says what SlowCup is.

**R33 was satisfied by reuse.** The `#enso` symbol already existed in `index.html`'s sprite and —
checked rather than assumed — sits **outside `#app`**, which matters because `renderLogin` overwrites
`#app`. One definition shared with the timer; the suite asserts the door carries no second copy of
the path.

**The slim addendum was verified present, not written.** R19's zero-tea Origins state shipped in
v4.07's empty branch; the empty shelf and the onboarding hero already read properly, and onboarding
keeps the **app mark, not the ensō**. Three surfaces checked; nothing authored.

Three things the next round inherits. **(a)** **R111** — `landing.html` is a superseded surface on a
live public URL, orphaned by R29, untouched under R61 and flagged to the **beta-hardening bundle**.
**(b)** **R112** — a closure-private function cannot be sandboxed, so `landing-test.js` asserts
source and says so; its §D is the half that genuinely renders. **(c)** **The door has never been
seen.** The Browser pane refused localhost for two deploys running, and a door is a *look* before it
is a function.

**NEXT: nothing in R3.** What remains open at the round's close is listed in §7.

**Previously: v4.08 — the Origins map, rendered to the frame ruling** (cache **v118**, no SQL, three commits).
Niklas opened the map on a phone: two of its seven marks rendered as a single letter each. **The
cause was upstream of the code** — the board that ruled direction 2 had never been banked (§3), so
H2 was built to a relayed summary of it, and a session that searched the repo for the board's two
cited strings found nothing and reasoned from `origins-map-v3.html`, the **superseded**
pre-direction-2 map. The board is banked now.

**One bug, not two.** Every dimension drawn over the outline was written as pixels inside a viewBox
running at 3.727 px/unit — a 29.8 px pin under an 18.6 px label — and `originsMerge` was the **only**
dimension that took the conversion. That is the shape of it: one conversion existed and nothing else
used it. Sizes are now the board's (pin 8, label 13, offset 6), converted once at the draw site.

**Three of the board's six rules were unimplemented, and one of them is what Niklas saw.** Rule 2's
second half expands the frame to the **card's aspect**; v4.07 drew the marks' own bbox, so the card
came out 350×193 instead of 350×258 and ended just past the easternmost pin. **Japan's cut edge was
a deviation from the ruling, not a consequence of it** — the opposite of what this lane recorded at
v4.06. Expanding never crops and leaves the x-scale alone here: 3.727 → **3.743**, nearer Design's
published 3.74 than what shipped. Rule 6 (no map below two pins, 30-unit floor) and rule 4 (a merged
mark wears a ring) landed with it.

**One deliberate deviation, stated because the board is banked:** the side-switch flips when a label
would not **fit**, not when its pin passes the outer 20% of the frame. Same two marks on this shelf;
the proxy under-fires for a long name at 70%. The fit test needs a monospaced face to be answerable
at all, which is why the board — proportional serif labels — used a proxy.

Three things a later slice inherits. **(a)** `origins-test.js` §F asks where a label **ends**; every
other check in the suite passed while two marks were unreadable. **(b)** Its negative controls are
proven, and **F3 forces every label right** so F2 cannot pass by construction. **(c)** **The map is
STILL visually unverified** — the Browser pane refused localhost by policy for this entire session
and `file://` pages would not composite, so the before/after render was handed to Niklas as a file.
**NEXT: H3** — #09 landing, the last slice. Do NOT move `renderLogin()` out of `steep-data.js`.

**Previously: v4.07 — R3 slice H2: #37 Origins + the Passport removal** (cache **v117**, no SQL).
R106 built at direction 2: a 247-ring, 57 KB static outline with no runtime dependency, generated by
`tools/gen-origins-outline.js` (tracked build infrastructure). **The tool refuses to write when a pin
would land in the sea**, which is what sets the tolerance at 1.0 rather than at whatever looked small
enough. **The projection ships inside the asset**, beside the paths it produced — the reason Code
generates the outline rather than receiving a traced SVG. Every ruled figure reproduces (3.73
px/unit, 83% span, 3.3 px before the merge, 22.9 px after, "Kagoshima +1").

**The frame is the ruled SPAN, not a padding number** — a first build with a fixed 26-unit pad gave
2.69 px/unit and a 60% span, and none of Design's figures reproduced. Padding is a consequence; a
fixed one silently changes what the 14 px merge threshold means. **R45/R66 discharged last**: the hub
row and dot-map view are gone, the passport tables stay and are used by Origins (asserted, so "kept"
is not a euphemism for orphaned).

**NEXT: H3** — #09 landing, the last slice of the round. R19's zero-tea Origins empty state can
finally be written. Do NOT move `renderLogin()` out of `steep-data.js`: it runs before boot, has no
state and no `render()`, and extracting it is a refactor larger than the board.

**Previously: v4.06 — R109: a passed tea goes to the wishlist, not the shelf** (cache **v116**, no SQL).
R109 amends R36 and is **the first ruling this round overturned by using the app** rather than by
reading it against the repo — the feature worked and was still wrong. Add-to-shelf claimed ownership
of a tea the recipient had only been told about, and the claim propagates through `stockTier` into
Shopping's running-low list and the tea count. The wishlist needed no schema, and the sender's note
now rides onto the row with its attribution. Add-to-shelf stays as the secondary action.

**The map is HELD, with the frame ruled.** Design chose direction 2: country tier off the map, listed
beside it; the 14 px merge rule; no edge indicator. Independently verified — 3.74 px/unit, marks
spanning 83% of the card. **One correction carried: the tightest remaining gap is 23.0 px
(Hoshino↔Kagoshima), not 24.5** — that figure is Hoshino↔Chiran — and 23 px is what the 14 px
threshold is actually judged against, which is what makes 14 safe rather than tuned. Two owed items
are answered (**ten** country-only under R16's normalisation; the larger tea count leads a merged
mark); **two are still owed by Design** — the tie-break when counts are equal, and whether 14 px
tracks pin width or is a constant. **The map does not resume until those land, and R45/R66's Passport
removal stays behind it.**

**Previously: v4.05 — R108's render smoke harness + R55's origin offer** (cache **v115**, no SQL).
**The map is HELD**: the planning lane measured the outline's frame at drawn size and ruled it a
Design question — three pin collisions (Kagoshima↔Chiran at 1.6 px is two *region* pins, not a label
artefact) and 44% of the frame empty because one tea sits 103 px from everything else. R19's adaptive
bbox weights an outlier equally against eleven clustered marks, and that rule was inherited from
`origins-map-v3.html`'s `fitExtent` rather than introduced. Neither the artifact nor its generator is
committed. **R45/R66's Passport removal stays behind the map**, since Origins cannot replace it yet.

Two findings from the held map to preserve verbatim when it resumes: **tolerance 1.0 is what the
assertion permits**, not the smallest number that looked acceptable (Chiran falls in the sea at 1.5),
and **label points are computed from the shipped geometry**, because Taiwan's inscribed radius is
1.65 units — smaller than the tolerance was — so a source-computed label falling outside the drawn
shape is the expected case for small countries, not an edge one.

Two things a later slice inherits from what did land. **(a)** `render-smoke-test.js` is the only
thing that fires when a shared helper changes shape under a consumer nobody re-read — and its **§D**
is what keeps the rest honest, since every other check in it passes against an empty string. **(b)**
The country-conflict branch of R55's offer is **unreachable on live data** and is isolated
synthetically; the package's own example (Oriental Beauty) is rejected by the single-place rule
first. **NEXT: the map's frame ruling, then #37's remainder and the Passport removal.**

**Previously: v4.04 — R3 slice H1: #08 Shopping + #07's currency row + R104's site scan** (cache **v114**,
no SQL). **H is split three ways at the map**: H1 touches no geography and ships now; **H2** is
Origins + the map + the Passport hub-row removal, **gated on R106's outline artifact** (queued in
ledger §4 as blocking, Code generating and Design reviewing, one projection shared between outline
and pins); **H3** is #09 landing, last, because R19's zero-tea Origins empty state cannot be written
before Origins exists. **R107** defers the completeness panel out of R3 entirely — R22 says it
*moves* to Settings and it exists nowhere, and a progress bar for filling in fields is a calm-first
product question rather than a styling one.

Two things a later slice inherits. **(a)** §F of `vessel-identity-test.js` is R104 made structural —
the behavioural guard and the site scan in one place — and **its stated limitation is part of it**:
it catches a *known* money field rendered bare, never a *new* one nobody registered. A green §F means
"every amount we have named carries a symbol". **(b)** `statusLine` returns `{text, tone}`, not a
string, since B3; the first shopping draft interpolated the object and printed `[object Object]` on
every row, caught in the browser because no suite renders that view.
**NEXT: H2**, once the outline artifact exists for Design to look at.

**Previously: v4.03 — R3 slice G: Insights + the Origins card + #11 Wrapped** (cache **v113**, no SQL).
Built to **R100–R103**, all four issued at its plan review. **R103** rewindows Wrapped onto the last
COMPLETE month (live: July, 40 sittings — not the 2 August ones), which deleted `seasonInfo` and the
decorated "just beginning" empty card with it. **R100**'s `argmaxTies` replaces three reducers that
took the first maximum and never revisited it; **no live tie exists on the 08-05 export**, so the
fixture is the only thing that can see the behaviour. **R102** puts R54's fence in the mover, in
`dashSurface` and in the rendered control — three mechanisms, and the negative control proved they
catch different failures. **R101** keeps the Origins card an entry point with no geography.

Four things a later slice inherits. **(a)** `originTier` is the single writer for the region/country
split — `figures-report.js` had been carrying a private copy of that rule, so the tool reporting the
number was a second definition of it. **(b)** The cost medians are **new computation**, not a
recompute: `avgCostPerGram` is a pooled ratio. They render with generated denominators and render
*nothing* below two data points. **(c)** Slice A's currency audit never reached the **spend view** —
six money sites printed no symbol at all, because §E guards the writer and cannot see an uncovered
site. **(d)** Two board claims had already expired (totalGrams + litres already shipped in the totals
card; R22's completeness panel exists nowhere), making six and seven this round.
**NEXT: slice H** — #37 Origins (carrying R101's map decision) · #08 Shopping · #07 Settings row ·
#09 landing. The Passport hub row (R45/R66) comes out there, with Origins to replace it.

**Previously: v4.02 — R3 slice F: Social + the R25 pass record** (cache **v112**, **`sql/v3_10-pass-record.sql`
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

> **AT THE ROUND'S CLOSE (2026-08-06, after v4.09) — everything R3 leaves open, in one list.**
> Nothing below blocked the build; each is a decision or a data gap with a named home.
> 1. **Three coordinate rows** — Wuyi Mountains · Lugu · Chiayi. Until they land, R55's three
>    offerable teas stay in the country tier even after an accepted offer. Also upgrades freshness
>    from R85's rung 3 to rung 2, so the batch pays twice.
> 2. **Two merge-rule questions** — the tie-break when counts are equal (implemented as
>    northernmost, asserted synthetically at `origins-test.js` B6 because no live tie exists), and
>    whether `ORIGINS_MERGE_PX` should track pin width. The board's prose and its number disagree;
>    the number is what shipped and what every figure was verified against.
> 3. **R111 — `landing.html`**, a superseded surface on a live public URL. Beta-hardening bundle.
> 4. **The tea-reference content batch** — 8 uncovered shelf teas, ~~the swatch and script data
>    models (R82), the 55 catalog liquor values~~. **The SWATCH model is WRITTEN (v4.11):**
>    `docs/r4/planning/SPEC-liquor-swatch-model.md`, with the ramp and all 55 catalog values landed.
>    **Still owed: the per-origin SCRIPT model** — R82's other never-written pin — plus the 8
>    uncovered shelf teas.
> 5. **R93 scopes R4** — the liquor swatch (with #14 and R39, both blocked on it) and a **Home
>    revision board**: Home is the last surface the redesign never gave one.
> 6. **The map and the door have never been looked at by this lane.** Both shipped numerically
>    verified and visually unseen, across three deploys of a browser pane that refused localhost.
>    Two of this round's defects were found by *using* the app and none by measuring it.



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
10. **A proposed CHECK can be written against the wrong representation, and it passes on the broken
    build.** Mode 9 is about verifying the wrong *artifact*; this is asserting the wrong
    *proposition*, one layer further out — the thing being mis-represented is no longer a file but
    the claim itself. The planning lane specified R123's guard as *"pin that the greeting and the
    card resolve from the same function and cannot disagree."* They already did resolve from the
    same function (`sessionsToday`, R117) and disagreed anyway, because the divergence lived in the
    branch predicate that consumed the answer — so **that check is green on v4.15**, the build it
    was commissioned to catch. Code caught it before it was written and asserted the property
    instead: *on a day with sittings the masthead makes no present-tense offer to brew*. Siblings on
    the record: A3-was-a-proxy (v4.13) and the `sessionsToday(now)` guard that matched its own
    declaration (v4.10). Counter: **state a check as the property a user would notice, never as the
    mechanism you believe implements it** — then prove it by *running* the negative control. Three
    of v4.16's own new checks passed on the broken build until the control was actually run, and one
    shipped for a while reading `|| true`.

    > **This entry was first filed in the wrong document, and the mistake is worth more than the
    > entry.** The Code lane searched `R3-RULINGS-LEDGER.md` for the "§8" it had been given, found
    > the ledger stops at §6, and **took absence from one file as proof the register did not exist**
    > — then filed the note into `HANDOVER-planning-lane.md` §7, a different lane's earlier list of
    > five. That is **mode 9 committed while filing an instance of mode 9**, and **mode 5**
    > (completeness blindness — checking what was in front of it, not the set: one grep of one file,
    > no sweep for the register). It is also the **second** occurrence of mode 3's exact shape, which
    > already records *"the hand-off's own citation to a '§6' that does not exist."* Counter, and it
    > is cheap: **before concluding a cited section is missing, grep the section title across
    > `docs/`, not the section number inside one file.**
11. **A section number with no document is not a citation** — and in blame order this comes before
    10. Recorded by the planning lane about itself: it wrote "§8" six times across two hand-offs and
    never once named the file, so the Code lane went looking in the document it *was* holding. The
    looking was correct; the pointer was under-specified. This is mode 3 (phantom references) turned
    around — not a citation to something that does not exist, but a citation too thin to resolve to
    the thing that does. Counter: **every cross-reference names its file**, and a reference to
    another lane's document says which lane owns it.
12. **A count written into the same edit that changes it** — mode 2 (honest-and-stale) at its
    shortest possible range, and it happened *on a line about failure modes*. Filing items 10 and 11
    above, the Code lane wrote a pointer in `HANDOVER-planning-lane.md` saying the register "holds
    ten" while the edit adding **two** items was still in flight. Stale on save, not by send time —
    mode 2 normally needs days and a re-send; this needed neither. Same edit as item 10's mis-filing,
    a second and different mode from one action, which is the part worth keeping: **one careless step
    does not produce one failure.** Counter, and it is why the pointer now states no count at all:
    **a document that is not the register does not restate the register's size** — cross-references
    carry a name and a path, never a tally. Where a count must be printed, derive it (`greeting-v4`'s
    section labels now compute from `passed` for exactly this reason, after the same trap caught
    `liquor-review.js` and this suite's own hand-typed totals).
13. **A ruling contradicted a standing rule in a document the authority order does not rank** —
    planning lane, about itself. R125 as delivered shipped the shelf swatch in **v4.17**, which is
    slice 3, the picker: two R4 items in one version, against **`CLAUDE.md:129`** — *"one coherent
    change per version"* — the rule this lane had spent the round enforcing. Amended to **v4.18**,
    struck per R71; the sequencing is now **R130** and the order itself **R131**.

    **Not inattention.** Nothing at the ledger's own tier existed to check the ruling against — the
    version assignment lived at `STATE.md:222` and `ROADMAP-v4.md:88`, two tiers *below* the ledger
    — and **the rule it actually broke sat outside the ordering altogether**, since `CLAUDE.md` was
    in no tier of the authority order despite being the first thing a fresh session reads. A rule
    with no tier cannot be checked by an ordering rule. R131 puts `CLAUDE.md` above the ledger for
    exactly this, and `CLAUDE.md:127` — *a stale figure misinforms, a stale backlog item commands* —
    is the second reason it belongs there.

    **Filed with the phantom citation this lane then used to explain it.** The instruction to write
    this entry cited *"the sequencing ruling three numbers earlier in the same file"*. It does not
    resolve: R122 is the review-harness ruling, and `v4.17` occurred exactly once in the ledger —
    inside R125 itself. **Mode 3 inside an entry about mode 5**, caught by the Code lane pre-commit.
    The error and the explanation of the error failed the same way, one turn apart, which is the
    part worth keeping.

    Counter, from the Code lane and adopted: **a decision that constrains later rulings gets a ledger
    number when it is made.** Q5's sequencing went unnumbered for four turns and a later ruling
    walked straight through it. Second counter, from R131's limit: **where the higher tier is silent,
    the lower tier is the record, not the error** — mode 8's "correct downward" would here have
    rewritten STATE and the roadmap to match a wrong ledger line.
14. **A pointer given from a subset, twice — and the sweep that fixed it swept for the wrong
    string.** Two lanes, one shape, and the planning lane's share comes first because it originates
    each instance.

    **Planning lane.** R131 was issued as "amend `STATE:138`" after grepping three files rather than
    the set, so the pointer named a line number drawn from a subset. That is the **same
    under-specification as "§8"** two turns earlier — a section number with no document, then a line
    number with no set. **Three instances now**, the third being R132's own: **a COUNT specified as
    the verification of a fix for under-specification** — "grep `live repo →` and confirm five hits",
    issued in the instruction correcting an under-specified pointer, and falsified by the act of
    writing the correction down. Confirmed from `1498829`: the string returned **four** at that
    commit, all statements, no prose mentions, so the instruction was true when written and false
    when obeyed. **All three caught by the Code lane, and the pattern is the finding, not any
    instance:** this lane states a location at the precision it happened to look at, and precision is
    read as completeness. Counter: **a pointer to a rule states how the set was determined, or it
    states nothing** — "amend `STATE:138`" and "amend every statement of the authority order" are
    different instructions, and only the second is checkable.

    **Code lane.** The counter written to catch it — *"grep the rule's own text across `docs/`"* —
    **caught three of four**. It missed `R3-BUILD-PLAN.md:14`, whose paragraph is headed "Authority
    **position**" and whose chain closes "→ this" instead of "nobody's memory", which was the string
    actually grepped. Every label varies and so does every tail; **only `live repo →` is invariant**.
    **Mode 9 nested inside the fix for mode 5, in the same commit** — a sweep run against the wrong
    representation of the rule it was sweeping for. Same family as the `\n`-versus-CRLF hash
    mismatch and the `grep -o` over a page that inlines its own stylesheet. Corrected counter:
    **grep the CONTENT, not the label** — the invariant substring of the thing itself, never the
    heading that introduces it nor the tail that closes it.

    **Third layer, and it is the one to keep: the verification instruction broke itself, twice.** It
    was issued as "grep `live repo →` and confirm five hits". After this commit that string returns
    **nine** — five statements plus four prose mentions written by these very entries. Re-keyed to
    the longer `live repo → the current export`, it returned **seven**, because the entries then
    quoted that. **Documenting an invariant destroys its uniqueness, and every attempt to repair the
    count by lengthening the string is invalidated by writing the repair down.**

    **So the check is not a count.** The property is: **every statement of the authority chain places
    `CLAUDE.md` between the export tier and the ledger tier.** Five statements, five satisfying it;
    a sixth added later either satisfies it or does not, with no number to keep current. This is the
    round's own spine reaching its documentation — **assert the property, not the proxy.** A3 was a
    proxy for legibility, "resolve from the same function" was a proxy for agreement, and a hit count
    is a proxy for consistency; all three pass while the thing they stand for fails. Ruled as
    **R132**, with the fence that the property itself **cannot become a suite assertion** — telling a
    statement from a prose mention is not something `grep` can do, and enumerating the set
    mechanically reinstates the count. It is a review property under R122.

    **The prose mentions were deliberately left unreworded**, and that belongs here rather than in a
    report: rewording them to make the grep return five would **fit the artifact to the instrument**
    — the same error one layer down, and the one that would have looked most like diligence.
15. **A deploy entry documents its FIRST commit, and the house pattern is one deploy / TWO.** v4.10
    shipped as two commits — `751fabd` (masthead, clay, the present tense) and `430083b` (R117/R118:
    Earlier today as its own card, glance rows opening detail, **and the Edit-layout bar moving below
    the stack**). Both carry `CACHE_NAME steep-tea-log-v120`, so both are v4.10. **v4.10's CHANGELOG
    entry never mentions the edit-bar move** — which is the fix closing GitHub issue #28, pinned by
    `home-test.js` E11, a check written for exactly that complaint.

    **The cost was paid this turn.** Triaging #28, an agent reading commit *position* rather than
    `CACHE_NAME` concluded the fix "shipped inside v4.11's cache bump" as a separate
    "CHANGELOG-underdocumented commit", and reported #28 as **not** closed by v4.10 — contradicting a
    correct planning-lane hypothesis. The version was recoverable in one command
    (`git show 430083b:service-worker.js` → v120); the reason it was reachable *only* by that command
    is the entry under-documenting its own deploy. Counter: **the write-up covers the whole deploy,
    not the commit being written up.** CLAUDE.md step 2 already says this for the `Deploy:` file list
    (build it from `git diff --name-only <remote>..HEAD`); the bullets need the same rule, because a
    second commit is where the second half of a version's behaviour lives.
16. **A conclusion drawn from a truncated view.** The audit brief named "#07's Account / Appearance / Theme
    / Accent block" as a silently-unbuilt candidate. Verified in `steep-settings.js`: **Theme
    (`:235`), Currency (`:223–229`), Sign out (`:12`), Export backup (`:9`), Import (`:10`) and
    Diagnostics (`:44`) all ship.** Wrong on four of five — **only the Accent row is absent.** The
    claim was built from Niklas's screenshot, which was cut off mid-screen, and the GitHub issue's
    screenshot shows the same screen scrolled further. Same shape as the subset grep (item 14) and
    the retired function names: **a view that ends is read as a set that ends.**

    > **The Code lane reproduced it one turn later, verifying it, with a different instrument.** The
    > first check for those rows was `grep … steep-settings.js | head -12` — which returned twelve
    > lines and stopped at `:136`, so `:223` and `:235` never appeared and the correction briefly
    > looked wrong. **A truncated screenshot and a truncated pipe are the same failure.**

    **The counter is not "don't truncate"** — truncation is how anything readable gets read. It is:
    **a count or an absence is never taken from a truncated view. Presence survives truncation;
    absence and totals do not.** Seeing a row proves it exists; not seeing one proves nothing until
    the view is known to be whole.

    > *Third instance moved out, and the mechanism is why.* This entry was to gain R134's wrong
    > "four call sites" as a third instrument (`head -10` on a seven-site grep). **It does not
    > reproduce:** `grep -rn "syncAchievements(" steep-*.js` yields **8** lines (7 calls + the
    > declaration), and no `head` limit of 10 truncates 8. What yields **exactly four** is the
    > narrower pattern **`syncAchievements(true)`** — `steep-sessions.js:216`, `:328`, `:1627`,
    > `steep-teas.js:708`. That is a *label* variant, not a truncation, so it belongs to item 17 and
    > **is permanently filed there** — confirmed 2026-08-07 by the planning lane: *"head -10 on eight
    > lines truncates nothing; `syncAchievements(true)` returns exactly four, and that is what my
    > sentence counted."* Filing it here would have taught the wrong counter — "don't take a count
    > from a truncated view" would not have prevented it, and "grep the content, not the label"
    > would. **This entry has two instruments, not three.** How the third came to be attributed here
    > at all is its own entry, item 18.
17. **Grepping the LABEL, case-sensitively — and nearly filing "the register does not exist."** Code
    lane. Lens 5 requires checking DESIGN.md's accepted-nuances register; the sweep grepped
    `accepted nuance`, matched nothing, and came within one keystroke of reporting a phantom finding
    **inside the lens that exists to catch phantoms**. The register is at `DESIGN.md:86`, headed
    *"Accepted nuances"* — capital A.

    **This is R128's counter one step further down, and it is the third instance of one lesson.**
    R128 says grep the content, not the label; case is itself a label variant. Named alongside its
    siblings, because the pattern is worth more than any instance: the planning lane's **subset
    grep** (item 14), its **retired function names**, and the **"Authority position"** heading that
    hid the fourth copy of the authority order. Four instruments — a subset, a name, a heading, a
    letter case — and one failure: **matching how a thing is written rather than what it says.**

18. **A correction accepted without rechecking, then a cause invented to explain an error that had
    not occurred.** Planning lane, about itself, and **the first entry in this register pointing
    inward.** Sequence: R134 was issued saying `syncAchievements` fires from "four call sites on
    every session commit". The Code lane reported **seven**. The correction was accepted — correctly
    — but **the original was never re-run**, and a plausible mechanism was then invented for the
    error: *"`head -10` on a seven-site grep."* That mechanism is impossible; `head -10` truncates
    neither seven lines nor eight. **No truncation had occurred.** The real cause was a narrower
    pattern, `syncAchievements(true)`, which returns exactly four — the celebratory variant, and
    exactly what the sentence had counted. **Four was right for what was grepped; seven is the
    removal cost.**

    The invented cause was then **filed as a lesson** (as item 16's third instrument) and
    **propagated into a ruling's supporting text**, where it would have taught a counter that could
    not have prevented anything. Caught by the Code lane on the re-file, not by the lane that wrote
    it.

    **This is mode 1 — confident invention — turned inward**: invention about one's own reasoning
    rather than about the world, which is the harder direction to catch because the subject cannot
    be re-read, only re-run. **The mechanism worth recording is why the correction went in
    unchecked: it was offered confidently by a lane with a good record.** A correct correction is not
    evidence that the account of the original error is also correct — they are two claims, and only
    one of them was verified. Counter: **when accepting a correction, re-run the original.** The
    corrected value and the story of how it went wrong are separate findings; accepting the first
    does not license the second.

    **Fifth instrument, added 2026-08-07 and the most instructive: an argument value.** R134 was
    issued saying `syncAchievements` "fires from four call sites". It fires from **seven**.
    `syncAchievements(` returns 8 lines (7 calls + the declaration); **`syncAchievements(true)`
    returns exactly four** — `steep-sessions.js:216`, `:328`, `:1627`, `steep-teas.js:708`. The
    narrower pattern matched the *animate-true* variant, and the four it found were a **coherent,
    plausible set** — three session paths and the tea form — which is why the count read as
    complete rather than partial. **That is R132's proxy shape inside a grep**: the wrong pattern
    did not fail, it succeeded on something adjacent and returned a believable answer. It landed
    **inside the ruling batch that also commissioned item 16**, one turn after item 14. Counter,
    unchanged and now five times earned: **match what the thing says, not how it is written** — and
    when a count is load-bearing, run the widest pattern that can be wrong.

    **Sixth instrument, and the best in the set: a LINE BREAK.** Verifying that this register's own
    skill-header note existed, the Code lane grepped `restart, don't re-create` and got **zero** —
    then nearly reported the note missing. It is there; `don't` ends one line and `re-create` begins
    the next, so no single-line pattern can match it. `re-create` alone returns 1. **A formatting
    variant**, after a subset, a name, a heading, a letter case and an argument value — and it
    arrived **inside the verification of the entry cataloguing exactly that**. It is the best
    instance because nothing about the target changed: same file, same words, same session, same
    lane, and the pattern still failed on how the text happened to wrap. Counter, sharpened by it:
    **a multi-word pattern assumes a line break that may not be there** — grep the shortest
    distinctive token, or read the region.
19. **A sequencing ruling numbered ahead of its work — the SECOND time, R125's exact shape.**
    Planning lane, about itself. R130 assigned slice 3 to v4.17 and the shelf to v4.18. R137 then
    ruled #34/#35 and #30/#33 *ahead of* slice 3 and gave neither a number, so the ladder once again
    numbered later work below earlier work — the identical fault §8 item 13 records for R125.
    Amended by **R141** to v4.17 #34/#35 · v4.18 #30/#33 · v4.19 picker · v4.20 shelf. **This is not
    a new lesson; it is the same lesson recurring, which is itself the finding** — one instance is an
    error, two is a method fault. The method fault: **a version is assigned when a ruling is written,
    not when its work is built**, so any reorder strands the numbers. The structural counter —
    **version-at-build-time**, assign `vX.YY` only at `/slowcup-deploy` step 1 — is recorded in R141
    and deliberately **not adopted**, because it rewrites R130's whole method and that is Niklas's
    call, not a thing to take in passing. Filed so that if it recurs a third time, the record already
    says the fix was known and deferred, not undiscovered.
20. **The dry run paid for itself on its first real use, and that is worth recording as a
    positive.** `/slowcup-deploy dry` was queued for the reconciliation and had never been run in
    anger. Its first invocation (2026-08-17, before v4.17) caught **two** blockers, neither visible
    from the diff: the version conflict of item 19 (R130 vs R137), surfaced at step 1's version bump;
    and a **twelve-day-stale fixture export** (42 sessions on disk vs 48 in the app's own
    screenshots), surfaced at step 7's currency precondition. **Both are exactly what running step
    0/1 first exists to surface** — a version with no agreed number and a green suite testing against
    dead data. A clean instrument finding real faults on first use is the evidence that the
    reconciliation's instinct to run it early was right; recorded because §8 otherwise reads as a
    catalogue of only what went wrong, and a register that never books a win loses calibration (the
    A5-clean-result argument from the audit, applied to process).
21. **The non-automatable gate certified a slice the suites could not — as designed, on first use.**
    Second positive instance. v4.17 (#34 back gesture) shipped a DOM History-API surface no `vm` suite
    can reach: `session-draft-test.js` pins the source facts (session flow absent from `HISTORY_VIEWS`,
    `popstate` never calls `goView`, one writer) and **names its own blind spot** — the swipe itself.
    The slice held for an **on-device check by Niklas** before push; he confirmed close-and-reopen
    survives and swipe-back steps back instead of exiting. **The person did the certifying the check
    declined to do, and the deploy did not push until they had** — which is R122's look-to-find/
    read-to-measure division applied to runtime, and the thing `smoke.md` + the CLAUDE.md rule now make
    standing rather than ad-hoc. Booked as a win for the same reason as item 20: a register that only
    catalogues faults forgets that the gates also work.
22. **A pushed task read as undone from a clone taken before the push propagated.** Planning lane,
    about itself. Task 0 (`SECURITY.md` + the `ROADMAP-v4.md` hardening line) was committed and pushed
    this session as `c5347f5` (`b25eb67..c5347f5`), **first in order**, exactly as the prompt directed.
    The lane re-clones the repo each turn and treats the result as current; this turn's clone was taken
    at or before `b25eb67`, **before the push propagated**, so it saw no `SECURITY.md`, no roadmap line,
    no advisor output — and the lane built a narrative on the absence: *the session did the export
    refresh and the picker plan and silently reordered Task 0 behind the more engaging work.* It then
    directed a **redo** plus a **§8 skip entry** on that basis. The narrative was wrong end to end — the
    file was on `origin` the whole time, and Task 0 had landed first.

    **Caught by the Code lane, which verified against the live remote instead of absorbing the claim.**
    `git fetch origin` → `origin/main` at `c5347f5`, `SECURITY.md` in the tree (13,123 bytes), the
    roadmap line at `ROADMAP-v4.md:95`, and the four findings + `get_advisors` re-checked against live
    Supabase that same turn. It then **declined to file the skip**: writing "a task was silently
    reordered" into this binding register when the commit proves it landed first would be **mode 1
    (confident invention) aimed UP the gradient** — a fabrication entered to preserve a higher lane's
    claim, the exact inverse of what the register exists for. The refusal was the more important act
    than the catch.

    **This is mode 8 (authority inversion) recurring, with one new wrinkle:** the lower-tier source that
    disagreed with the top tier (the live repo) was the lane's **own clone**, not a lower *document*.
    The root is exact and **shared with security's own non-shipping**, this register's reason to exist:
    *acting on a lower-tier source when the top tier is one `fetch` away.* **A stale clone and a
    session's memory are the same failure wearing different clothes** — item 2 (honest-and-stale) and
    item 4 (session-memory decisions) are this same fault told about a summary and a decision; here it
    is told about a checkout. Counter, the picker-inputs counter one tier up: **before acting on a claim
    that something is undone — from any source, including a higher lane or one's own memory — verify
    against the live remote, not a clone that may predate the work.**

    **Standing behaviour corrected, recorded so the next turn inherits it:** the per-turn `--depth 1`
    re-clone is authoritative only if it **post-dates** the thing it checks. When a report says
    "pushed," the verification is **`git fetch` then check `origin`** — not a fresh clone that may race
    propagation. The habit assumed a freshness the clone did not have.

    > *Second mode from the one action, kept per items 12 and 18.* The instruction to file this was
    > itself given as "**ledger** §8" with no file named — **mode 11's under-specified pointer again**,
    > since the register is not in `R3-RULINGS-LEDGER.md` (its headings stop at §6) but here, in
    > `R3-STATUS.md` §8. Resolved by the **item-10 counter**: grep the section title across `docs/`, not
    > the section number inside one file — which is the same counter that kept item 10 itself from being
    > mis-filed into `HANDOVER-planning-lane.md` §7.
