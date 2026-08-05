# R3 — Rulings ledger & round-2 record

2026-07-19 · Planning lane. The binding reference for the #09b sweep and the Code hand-off.
Commit to `docs/r3/planning/`. Everything below is verified against the live repo at `77cf800`
and the **2026-07-19 exports** (22 teas · 31 sessions · 103 steeps · 5 vessels · 3 profiles ·
3 follow edges · 1 wishlist row) unless a different date is stated.

**Why this file exists:** corrections and rulings accumulated across one long planning session,
several were never relayed to Design, and Design's own completion summary carries claims that
were true when written and are stale now. Boards get verified against *this*, never against
summaries.

---

## 1 · Binding rulings

Numbered so boards and specs can cite them.

**R1 — Method control is four segments: gongfu · western · senchadō · cold brew.** Cold brew is
mutually exclusive with the others, which is what "method" means; it stays stored as
`is_cold_brew` (no migration) and the fourth segment sets the boolean and switches to the
existing cold-brew flow. Design's own WS1 "Log a cup" already drew this row. **Matcha is not a
method** — it's a property of the tea (#12 steepless whisk variant, tea-driven). This closes the
R3 pin "method 5-shown-vs-3-stored": 4 shown, 3 + boolean stored, matcha inferred.
*Superseded in part by R50 — the control order is `gongfu · senchadō · western · cold brew`,
matching shipped `SESSION_METHODS` (`steep-sessions.js:549`) plus the cold-brew lane that sets
`is_cold_brew`. R1's four-lane design stands; only the order changes.*

**R2 — Senchadō is shipped, not pending.** v3.91: real third `brew_style`, three-valued
`brewMethodFor`, per-steep feedback fires for it, gongfu-side ratio baseline. Any "PHASE 2 /
capture-only" badge or copy is stale. Phase 2 is *learned defaults*, not senchadō.

**R3 — Glossary: guide vs schedule.** *Brew guide* = the tea's saved recipe (`teas.brew_guide`).
*Schedule* = this session's derived plan after ratio scaling and advice
(`effectiveGuideSchedule` → `ratioScaleSchedule`). The code already makes the distinction; the
copy adopts it. One line for DESIGN.md.

**R4 — Mood check-in stays.** "How are you arriving?" is v3.31, gated by the existing
`showMood` toggle, and filled on 12 of 28 sessions — a 43% opt-in on a fully optional control.
Restore on #04; the off-switch already ships.

**R5 — Quick log keeps both entries.** The bottom-nav Log button *is* `quickLogSession`, and the
in-setup shortcut ("Quick log — just infusions & notes") returns. WS1 "Log a cup" is the
retrospective surface; WS2 Home pairs it with Start steeping.

**R6 — Water field semantics: blank = vessel capacity.** v3.57 contract; capacity renders as
placeholder, never written as a value. Every consumer already falls back to capacity.

**R7 — Keep-screen-awake ships, steep-scoped.** Screen Wake Lock API
(`navigator.wakeLock.request('screen')`, PWA-compatible, iOS ≥16.4). Hold the lock **only while
a steep timer runs**; re-acquire on `visibilitychange`; fail silent. Design invention, ratified.

**R8 — "N following" on Settings deep-links to the Friends view** (`friends` is a persisted
view) and renders only when Social exists.

**R9 — Wishlist ↔ library join is normalized name match — already shipped, now ratified.**
`steep-shopping.js` dedupes the needed-list against the wishlist by folded name. Both sides are
user-authored; the catalog is not in this loop. Closes SH6.

**R10 — No auto-add rebuy → wishlist.** Violates never-auto-write and duplicates one intent
into two records. Rebuy is a standing verdict on an owned tea; the wishlist is things to seek;
the overlap row renders the relationship without copying it.

**R11 — Restock action prefills Add tea with `purchase_type='repeat'`** (plus name, vendor,
type). The one place "repeat" is set truthfully inside an explicit action; revives a field that
is 100% `"first"` today and gives cost-over-time first-vs-repeat variance.

**R12 — Vendor link-out ships as a web-search action** (vendor + tea name) on wishlist/restock
rows — pull, user-initiated, no schema. A `url` column and a vendor entity are deferred (§4).

**R13 — Freshness windows key on catalog slug, family fallback** — committed,
`docs/r3/planning/SPEC-freshness-model.md`. Cited here because boards keep regressing to
per-type.

**R14 — Origins labels are Latin-primary**, script secondary/on-tap. Script is identity on Tea
detail; on a map a label is wayfinding.

**R15 — Coordinates: city-level (~10 km, 2 dp); province-level origins anchor at the
provincial capital**, labelled as the province's marker, never the tea-growing area (that would
guess which part was meant). Centroids rejected: computed, hence unverifiable. Table keys on
normalized `teas.origin` strings, **never** the catalog. `DATA-region-coordinates.md`, 5/9
verified.

**R16 — "Ceylon" is a country synonym, not a region.** Normaliser carries a synonym list
(Ceylon → Sri Lanka, Formosa → Taiwan). Split is 11 region / 10 country-only.

**R17 — Clustering rule (Design's, ratified):** same tier within ~14 px merges to one mark
(parent name + ×N; zoom splits — Chiran stays a distinct *data* row); different tiers never
merge; nudge with a leader instead.

**R18 — Multi-tea regions carry a neutral swatch with a count** (Kagoshima ×4, Yunnan ×2); only
single-tea regions keep liquor colour. Same logic as the neutral `?N` pin: one tea's identity
can't stand for several.

**R19 — Projection is computed from the user's origins**: bounding box of all pinned points plus
padding. One rule resolves single-country (box collapses to that country — still an atlas) and
global shelves (box widens to world scale — accepted). Zero teas = the #09 Origins empty state.
No hardcoded frame, East-Asia or five-country.

**R20 — Origins is exempt from the Insights period selector.** An atlas is inventory, not
sessions.

**R21 — Insights restores the shipped three-window control** (This week / This month /
All-time — `gridPeriod`, live code). The one-month pill replaced shipped capability with less.

**R22 — The completeness panel moves to Settings, beside the shipped data-health checks.**
Honest fractions, wrong surface: it's data hygiene, not a brewing insight.

**R23 — Wrapped stays and gets a board.** Shipped v3.64: full carousel view + teaser card inside
Insights. It is the annual/ritual sibling of Insights, not an unbuilt idea.

**R24 — Card hide/reorder is ratified shipped behaviour** (`dashLayout` order/hidden/reset,
persisted). Boards carry the affordance; the manager surfaces quietly per card.

**R25 — Social gets one pass-record schema, not reactions.** Something like
`(session_id or tea_id, to_profile nullable = circle, note, created_at)`. One table yields:
per-recipient sharing (the "to Ruth" badge, which `is_shared` alone cannot express), the
Passed-to-you shelf that "Pass this tea to the circle" requires, and the
correspondence-compatible reply (a note on a passed cup). Closes SC5 without hollow affordances.

**R26 — Catalog join becomes a stored confirm-link** (nullable `teas.catalog_slug`;
`matchTeaType` proposes, the user confirms, everything reads the stored slug). Renames stop
breaking; new teas prompt instead of silently missing; coverage stops sliding (13/14 → 12/22 in
ten days). This is Phase C's "confirm-not-auto-write library link" — schema + affordance ride
R3. Planning-lane ruling, standing unless Niklas objects.

**R27 — Board example data is non-normative.** Illustrative rows may be invented; the export
and the specs are normative; **claims, counts and affordances derived from example data must be
real** (the "6 SITTINGS · See all" lesson; the "SHARED to Ruth" schema lesson).

**R28 — Country-tier pins carry no coordinates.** The `? N` pins are polygon labels, not
point data: they claim "this country," and the Natural Earth country shape is that datum —
the renderer places the label inside the polygon (pole-of-inaccessibility / polylabel), as
cartographers place country names. No invented coordinate, no capital-vs-centroid dilemma (a
China pin at Beijing would be verifiable but absurd on a tea atlas). Two tiers, two data
kinds: region = verified point (`DATA-region-coordinates.md`) · country = labelled polygon.

**R29 — No root split. The app stays at `slowcup.app/`; the landing page is #09's
logged-out screen.** Moving the app off root breaks every installed PWA (service-worker
scope, manifest `start_url` — Niklas's and Ruth's home-screen installs). For an
invitation-only beta, the login/first-run screen is the landing and is already scheduled
work. A standalone marketing page is deferred until there's a public audience, and would
live at a path or subdomain, never displacing the app. This closes Pillar B's open
decision; the pillar reduces to the install guide (drafting after R3 screenshots exist) and
the beta-package checklist (§4 gains: "beta welcome note must not promise deletion while
delete-everything is unbuilt").

**R30 — One flavour vocabulary, one writer. SHIPPED v3.93.** `DEFAULT_TAGS` (the `tag_library` seed,
steep-core.js) and `KB_FLAVOR_CHIPS` (the `isFlavorVocab` membership set, steep-knowledge.js) were two
vocabularies for one concept, disagreeing on five words: `roasted · sweet · astringent · buttery ·
citrus` were seeded to every user but failed the membership test, so the app *suggested words it silently
dropped* from "What you taste" (10 of Niklas's 15 real tags invisible). Fix: the five join
`KB_FLAVOR_CHIPS` (German labels `Geröstet · Süß · Adstringierend · Butterig · Zitrus`); `DEFAULT_TAGS`
is now **derived** from its keys, never a second array. Two sub-decisions, recorded: **(a)**
`roasted`/`sweet` coexist with `roast`/`sweetness` in the vocabulary (a tea tasted both ways draws two
bars until R31's aliases fold them) — accepted pending the nested vocabulary; **(b)** the WS4 capture
families stay a curated **20-of-25** — the orphans are **seed-only, not capture chips**, because
`roast`+`roasted` adjacent in the grid reads as a confusing dupe (worse than the vocabulary
coexistence). The flavor-ladder fixture's family block now asserts the curated-subset invariant (families
⊂ vocabulary; the 5 orphans are vocabulary but not family terms), replacing the old "every chip key has a
family". Nothing stored changes — the profile aggregates at read time, so past entries are fixed too.

**R31 — Normalise before the membership test. DEFERRED (Code; needs the alias map from this lane first).**
Add an alias layer so word *form* stops deciding whether a note counts — the three-tier shape used
everywhere else: **exact key → alias → bare word**. Seed from the near-miss table (`spices→spice ·
roasted→roast · sweet→sweetness · toasty→roast · apricot→stonefruit · dried fruit→fruity`) plus obvious
plurals/participles. Recovers most free-typed notes without opening the radar to arbitrary strings, and
keeps the honest floor (a genuinely novel word stays bare). Draft it against the real `tag_library`
values, not invented aliases. This is what collapses R30's accepted coexistence (`roast`/`roasted`,
`sweet`/`sweetness`) back to one bar.

**R32 — Landing copy is all-new, canonical as drawn.** The "shipped about line" provenance claim was
false — there is no prior about-line to inherit; #09's logged-out landing copy stands as authored. Keep
minimal.

**R33 — Ensō: door + timer, never the icon.** Amends the app-icon note (§4): the logged-out door may
carry the ensō alongside the timer; the app icon still may not.

**R34 — No invite-code redemption.** The invite-code line is cut — no redemption mechanism exists or
will; a passive "invitation-only" line is permitted (states the fact, collects nothing).

**R35 — Presence parked post-beta, not rejected.** Online/presence indicators wait until after beta;
not a no.

**R36 — Passed-tea destination is three-tier.** Catalog "Go deeper" when the tea is covered; otherwise a
minimal preview card with Add-to-shelf.

**R37 — Wrapped Share-card / Save-image accepted, pull-only.** Never auto-posted, never names people;
Code owns the card sizes; Save-image may slip a build.

**R38 — Wrapped's period is monthly, explicitly.** A yearly sibling comes later; v3.64's seasonal scope
changes at the #11 build.

**R39 — Picker swatch long-press colour correction ratified.**

**R40 — #02b out-links accepted.** Brew-this-again (carries vessel + method), Copy-to-a-new-entry, and
Pass-this-tea (rides R25).

**R41 — Teaware line-art pipeline retired (retroactive record of an earlier chat decision).** Real
photos are vessel identity; type-kanji is the fallback.

**R42** Sessions keeps the shipped Brewing-days heatmap (v3.44 ruling reaffirmed), list default.

**R43** Quick log gains an optional vessel field. *Scope note: `quickLogSession()` already sets
`vesselId: state.vessels[0].id` silently — R43 exposes an existing draft field, it does not add one.*

> *Code-lane citation note, 2026-07-25 (does not alter the ruling).* The setter is
> `startSessionFor()` (`steep-sessions.js:359`, assignment at `:364`); `quickLogSession()`
> (`:351`) reaches it by calling `startSessionFor(null)` and sets nothing itself. No vessel
> control exists on the quick-log screen — `sessionQuickHTML()` runs `:427–473` with zero
> vessel references, and the `vesselOpts` select at `:488` belongs to `sessionSetupHTML()`
> (`:474`), a different screen. So R43 is **new UI over an existing field**, not already-shipped;
> recorded so the citation is never later read as "done".

**R44** Profile avatar on tab-level screens only; never immersive surfaces (Focus etc.).

**R45** Hub = social · shopping · settings. Passport absorbed by Origins (#7 closed); achievements
dropped. `steep-passport.js` fate → Code decision item. *The Passport hub row is genuinely
shipped (`hubSheetHTML`), so this is a real shipped-control removal.*

**R46** Origins nests in Insights, default bottom card (= bottom of the MORE stack), card-manager
moveable — **as narrowed by R54**.

**R47** The door draws only configured providers — "Continue with Apple" removed.

**R48** monoFont row stays off the Settings board. **Amended 2026-07-25:** the clause instructing
Code to remove the shipped control is **void**. `monoFont` was retired in **v3.53** (`87591dc`) —
Settings row, `DEFAULT_SETTINGS` key, `html[data-mono="clean"]` CSS and the `data-mono` setter all
went then, and the CHANGELOG records the leftover synced key as harmless with no migration. Zero
occurrences in any `.js` at HEAD. The ledger's Settings note ("live in schema; one user has
`pixel`") describes **stale synced data**, not a live control. No code work.

**R49** Wishlist→library join = normalized-name match; misses flagged; revisit post-R26 slug.

**R50** Method control = FOUR drawn lanes — **gongfu · senchadō · western · cold brew** (ruled
2026-07-21). Clarifies R1 (four-lane design stands; the cold-brew lane sets `is_cold_brew`);
order matches shipped `SESSION_METHODS` (`steep-sessions.js:549`, three entries + the boolean).
Supersedes the hand-off's §0.1 three-plus-toggle instruction.

**R51** Go Deeper is **both**: a browsable reference surface living as the **Teas tab's second mode**
(your shelf ↔ the reference), plus contextual entries from Tea detail, the brew-guide
"Borrow from Go Deeper" action, and R36's passed-tea path. Explicitly **not** reached through
the profile hub.

**R52** Vendor manager's home is the **Teas shelf's overflow** (vendors are `teas.source`-derived;
Teas is where tea data is managed). Restyle only — `vendorManagerHTML()` and `distinctVendors()`
already ship; string-based for R3, vendor entity + url deferred with R12.

**R53 — Bundle-1 acceptance is split.** Home and the non-Focus steeping states are accepted as
round-1: Bundle 1 is behavioural reference only, and just the visual contracts and the §0
primitives apply. Teas gets one revision board, because it alone carries new R3 work — R51's
second mode, R52's vendor manager, the header rework, and the open rename question. Closes the
round's last open design question. Note that Focus and the non-Focus steeping states are the
same shipped function (`sessionSteepingHTML`, plus `sessionFinishHTML` for end/save), so the
Focus rebuild necessarily touches them: hold every state the Focus board doesn't draw to
shipped behaviour and flag it rather than inventing one.

**R54 — The Origins card is pinned to Insights for R3.** R46 makes it card-manager moveable,
but `dashSurface()` lets a user move any card between Home and Insights (v3.47), which would
let a map card land on a surface with no revision board. Pinned for R3; revisit when Home gets
one. Register it with a `DASH_SURFACE` entry of `insights`.

**R55 — Catalog origin offers must name one place.** R26's offer path may only propose a
catalog region that (a) names a single place — no slash-pairs, no parenthetical lists, (b) sits
inside the country already stored on the tea, and (c) has parentheticals stripped. A catalog
region naming a different country than the stored origin is a **conflict, not an offer**: no
default, no one-tap accept. Read the region from `resolveTeaType(slug).region`, never from a
board literal — `region` inherits from the parent row (`TT_INHERIT`, `steep-tea-types.js:74`).
Verified against the 2026-07-19 export: of the six catalog-covered country-only teas, three are
offerable (Ali Shan only after stripping `(~1000-1500m)`) and three suppressed — Oriental
Beauty as a country conflict, Huang Ya and Ruby Ruanzhi as disjunctions. The free-text path is
unaffected.

**R56 — the Origin field gains no suggestion list in R3.** #37's OR4 and its caption describe
"the existing origin autofill" as shipped. There is none: the field is
`<input type="text" name="origin">` with a placeholder and no `list=` attribute
(`steep-teas.js:431`); the only datalists in the app are `vendorList` and `wishVendorList`, both
fed by `distinctVendors()`. `KB_REGIONS` is a recognition table for `kbResolve()`, not a display
vocabulary — its keys are bare lowercase tokens (`wuyi`, `alishan`, `nantou`) that the
coordinate table, keyed on normalised full strings, could never resolve. So the field stays
free text with its placeholder, and R55's offer card is the only new affordance on that screen.
A suggestion list is deferred, and if it returns it needs its own source, not KB_REGIONS.
Board note: #37 rev 2's illustrative suggestion array still contains "Wuyi Shan, Fujian, China",
a string that appears nowhere in the shipped code — the same invention its own OR2 warns against.

*R57–R62 were issued 2026-07-25 and land with the implementation hand-off's commit. Their code
citations were re-checked line by line against HEAD when appended (`ded1717` lineage), not against
the `77cf800` in this file's header.*

**R57 — Issue #22 (taste-note placement: collapsible, beneath water temp) is deferred post-R3.**
The "beneath water temp" half already ships — each steep in the edit surface renders Temp → Time →
Notes (`steep-sessions.js:286–288`). "Collapsible" is drawn on no board. The related gap — per-steep
taste words not editable, `es_setSteep` being generic enough to write `tags` but nothing calling it
that way — stands as a documented, non-destructive known issue. #02b rev 2 reproduces the gap: its
`TASTE WORDS` block is session-level (`sessions.tags`), not per-steep. Build as drawn; do not invent
the missing control.

**R58 — Issue #28 (move the edit layout somewhere less intrusive) is closed.** Shipped,
session-edit is a modal overlay (`steep-sessions.js:292–293` via `openSessionEdit()`); #02b rev 2
draws a dedicated edit screen instead. The move satisfies the ask.

**R59 — Washi is unchanged for R3.** Its probation stands as ruled in the direction lock: Home
masthead only, kept for now, held to its contract, dropped without ceremony if it ever fights the
masthead. Home is round-1 by R53, so nothing in this round touches it. Revisit when Home gets a
revision board.

**R60 — Issue #23 ("R2 capability regressions") splits three ways.** (a) The shelf sort control is
preserved exactly as shipped — `steep-teas.js:248` renders a live seven-option select on the count
row, handler `setTeaSort` at `:308`, restored in v3.84. #13 does not draw it; that is not
authorisation to remove it. (b) `setTeaFilter` (`steep-teas.js:309`) and `focusLogSteep`
(`steep-sessions.js:966`) have zero callers and stay dormant: the regressions are accepted for R3,
the functions stay in place, and no controls are drawn — reinstating would mean drawing them on #13
and reopening a closed Design queue. (c) Sort persistence stays session-scoped; making it durable is
a `user_settings` question for later.

**R61 — Absence from a board is not a removal instruction.** Any shipped control a board does not
draw is preserved unless a ruling names it for removal. R3 removes exactly one shipped control: the
Passport row from the hub sheet (R45). It does not remove monoFont — retired v3.53, R48's instruction
void, nothing there to remove. This is the general form of the trap the sort control exposed, and the
counter to failure mode 6.

**R62 — No Teas→Library rename.** The shipped tab is Teas (`steep-core.js:894–903`) and stays Teas.
Renaming would move the nav label, #13's header, Map 2's nodes and the hand-off's prose together for
cosmetic gain in a closing round; it is cheap to do later on its own. The boards draw Teas with the
rename flagged — the flag is now closed, not pending.

**With R57–R62, R3 has no open design questions.** The four items Map 1 rev 2 carried as held —
#22 · #23 · #28 · washi probation — are ruled (R57 · R60 · R58 · R59), and the tab name is ruled
(R62). Nothing in the round is awaiting a Design or planning decision; what remains open is
execution plus the items in `R3-STATUS.md` §7 that were never design questions (the three owed
coordinate rows, the Insights cost-median provenance, the catalog accuracy item, the beta-hardening
bundle). **An open question is not the same as a decision to make at build time** — if the build
finds one, it is a finding to raise, not a gap to fill. R63–R66 below are that mechanism working:
Code-lane build rulings correcting the engine model, not reopened design questions.

*R63–R66 were issued 2026-07-26 at the Code lane's plan-mode review, in response to the build plan's
findings (`docs/r3/R3-BUILD-PLAN.md` §1). Citations re-checked against HEAD when appended.*

**R63 — The vessel identity ladder is new code, not a map extension.** The hand-off's §0.3 cited
`steep-teas.js:87–93`, which is `shelfPhoto(tea, kind)` — the tea tile, keyed on `tea.type`
(白 white, 餅 puerh) with `t-<teatype>` tints. The vessel thumb is `steep-sessions.js:111`:
`v.image` or `.is-ph`, two steps, no kanji, no tint. Build `vesselPhoto(v, kind)` mirroring
`shelfPhoto`'s shape, a `VESSEL_KANJI` map, and `.v-<type>` tints in both theme blocks. The map
covers only types present in `VESSEL_TYPES` that the boards drew: Gaiwan 蓋碗 · Shiboridashi 絞 ·
Cold brew jar 冷. 旅 is dropped — there is no traveller type (`VESSEL_TYPES`, `steep-core.js:113`)
and the "Travel cuppa" is typed `Porcelain teapot`; the glyph was drawn for a vessel's free-text
name. Adding further glyphs is a Design decision, not a build one. Scope note: all five vessels in
the 2026-07-19 export carry photos, so this rung is invisible on current data — it is the
graceful-degradation floor for future photo-less vessels. Build it small, fixture it, don't
gold-plate it.

> *Code-lane citation note, 2026-07-26 (does not alter the ruling).* Two of the scope note's facts
> could not be checked at HEAD: `fixtures/vessels_rows.csv` holds **three** vessels, not five —
> Mogake Shiboridashi and Travel cuppa are absent from the local set (the F3 staleness). The three
> present (Dragon Gaiwan · Main Kyusu · Hario Coldbrew) all carry photos, and `PASSPORT`-style geo
> aside, nothing else was checkable. So **"Travel cuppa is typed `Porcelain teapot`" and "all five
> carry photos" rest on the 2026-07-19 export, not on a repo check.** The ruling does not depend on
> either: dropping 旅 rests on `VESSEL_TYPES` having no traveller entry, which **is** verified
> (`steep-core.js:113`). Confirm both when the fresh export lands.

**R64 — The method control draws no lane when `brew_style` is null.** `brewMethodFor()`
(`steep-core.js:377`) never returns null: explicit wins, else capacity ≤ `GONGFU_VESSEL_MAX_ML`
(150) → gongfu, else western. So a lit lane on a null row would be a capacity guess presented as a
record — and it isn't even uniform: Dragon Gaiwan (110 ml) infers gongfu, Main Kyusu (210 ml)
western. The control shows the stored value and shows nothing when there is none. The derived
reading stays where it already lives, in the separate read-only `esMethodReadLabel()`
(`steep-sessions.js:207`). JC1 survives verbatim: `es_setBrewStyle` remains the only writer and
`saveSessionEdit` passes `brewStyle` through untouched (`:203–205`), so opening a null session and
saving writes nothing. Manufacturing the phase-2 gate metric out of a heuristic would corrupt the
one measurement the next round depends on. Storage mutual-exclusion already holds and needs no new
logic: `commitSession` writes `brewStyle: (!d.isColdBrew) ? brewMethodFor(…) : null`
(`steep-sessions.js:1285`).

**R65 — `brew_guide` structured pills are out of R3.** No ruling requires them, #03 and #06 both
state free text as today's model, and the three-tier cascade already covers presentation. Not worth
opening a migration for a presentation change.

**R66 — `steep-passport.js` is kept, stripped, and mined.** R45 handed its fate to the Code lane and
the call is: keep the file, drop the hub row and the passport view, retain `passportCountryFor()`
(`:100`), `PASSPORT_GEO` (`:40`) and the `PASSPORT_LAND` / `PASSPORT_SUB` tables for Origins to
reuse. Deleting real geo data to satisfy a tidiness instinct would cost Origins work later.

*R67–R68 were issued 2026-07-26 after the fresh export landed and `fixtures/export-gate-test.js`
caught a three-table mixed vintage. They govern how figures and figure-bearing prose are handled,
not what any surface does.*

**R67 — §1 separates invariants from snapshots, and the authority tier stops naming a date.** The
hand-off's §1 currently files two different kinds of figure under one heading that says "figures on
boards that disagree with these lose" — which now points at numbers that themselves lose to the
export.

Invariants are authoritative and do not carry a stamp: five stock tiers; the three-step vessel
ladder; four drawn lanes over three stored values plus a boolean; untagged is not a lane; the
null-`brew_style` count, stable at 8 across both exports, which keeps R64's premise sound; the
three-tier cascade; type mix counts sessions, not the shelf.

Snapshots move every time a cup is brewed — session and steep counts, distinct days, grams, litres,
percentages, method-split magnitudes, vendor and origin distributions. They carry an explicit export
stamp, they are generated by `fixtures/figures-report.js`, never hand-copied, and the instruction
attached to them is to re-derive at build rather than to trust.

The authority order reads "the current export, stamped" — not a date. A tier that names a specific
export becomes wrong the next time the user brews, and did.

**R68 — Prose that asserts a data shape is generated or removed.** Computed figures re-derive;
sentences do not, so a string that encodes a claim about the data goes quietly false while every
number around it stays correct. "Nothing after ~14:00" is already marginally false — 08–10 and 12–14
are tied and one session runs past two. The same shape appears in "green-leaning month", #11's
"brewed most in Dragon Gaiwan", #04's mood pill "48% (15/31)", #02b's "no TDS/type, not shared, no
mood", and §1's own copy of the 14:00 claim.

Each is either generated from the data that makes it true, or it comes out. A generated string needs
a fallback for when the data stops supporting it — "brewed most in —" is worse than no line. Where no
honest fallback exists, the line is cut rather than emptied. A calm app that quietly tells someone
something false about their own year is worse than one that says less.

> *Code-lane note, 2026-07-26 (does not alter either ruling).* `figures-report.js` reports the tie
> and the latest non-empty bucket explicitly, so R68's two live cases are visible on every run rather
> than rediscovered. Two further findings came out of building it, both recorded in `R3-BUILD-PLAN.md`
> §1 as F5 and F6: the export is **not user-scoped** (one tea row belongs to another account, which
> silently doubles "teas with no vendor" for any consumer that doesn't scope — the app scopes by
> `user_id` deliberately, v3.21), and §1's "22 rows, Test deleted" therefore mis-describes that row —
> it is not a deleted tea, it is another user's. The gate now asserts single-owner sessions.

**R69 — Fixture data is user-scoped before it is read.** The export is not user-scoped:
`teas_rows.csv` carries another account's row and `user_settings_rows.csv` carries every beta user.
Anything reading `fixtures/` scopes by `user_id` first, with the **owner derived from session
ownership** — never a hardcoded UUID, which would rot the moment the fixture set is regenerated for
anyone else. The gate **prints** the foreign count rather than asserting it away, because a foreign
row is legitimate in an unscoped export; what must not happen is a consumer reading it silently.

The failure mode is quiet and had already fired twice. `figures-report.js`'s first run reported *two*
teas with no vendor where §1 correctly says one, because the foreign row is vendorless. And
`export-gate-test.js`'s first version floored teas at **22** — the *unscoped* count — so scoping the
export would have failed the gate on correct data: F5 inside the tool written to catch F5, found by
running the audit rather than reasoning about it. Floors are on owned rows.

> *Code-lane audit, 2026-07-26.* All 15 committed suites were run against unscoped and scoped
> `teas_rows.csv` and diffed. **No committed suite scopes by `user_id`**; 13 report identically
> anyway, and the reason is luck, not design — the foreign row is inert (0 g, no vendor, no origin,
> rating 0, no sessions), and several assertions are relative (`list.length === real.length`) rather
> than absolute. Two are structurally fragile: `status-line-test.js` E1 asserts an absolute
> `low.length === 2`, which survives only because the foreign row is 0 g and therefore `untracked`
> (a foreign row at 5 g would break it); and `tea-types-test.js` G excludes the row **by name** —
> `t.name !== 'Test'` plus `ok(match('Test')===null)` — so it asserts a property of another user's
> data and a rename would break it. That name is also the likely origin of the "Test deleted" story:
> the string reads like a scratch row, so the invented mechanism was self-confirming. Both ride the
> stale-expectation repair already queued.

**R70 — `untracked` having no live example is not a defect.** The five stock tiers are an invariant
under R67 and carry no stamp; tier *coverage* on any given shelf is a snapshot. The foreign row was
the only `untracked` tea, so scoping leaves Niklas's shelf showing four of five — plenty 12 · few 5 ·
low 2 · empty 2. §0.2's aside needs inverting: it notes `few` as the tier with no example on #04's
five sample teas, and `few` now has **five** live examples while `untracked` has **none**. Neither
fact bears on whether the tier exists.

**R71 — A document's description of itself is the one uninstrumented surface.** Three mechanical
guards now cover this round's figures: `export-gate-test.js` asserts invariants, `figures-report.js`
generates snapshots, `.gitattributes` pins archival bytes. None of them can check whether a document's
account of itself still matches — "twenty-one boards, fifty-six rulings", "contiguous R1–R56", "issued
2026-07-25 and land with this commit". Every other stale figure this round had a guard available;
these have only the habit of looking. When a document states its own counts, ranges or pending state,
that claim is re-read whenever the document is touched. Prefer phrasing that cannot go stale — "the
ledger is contiguous, verified from a fresh clone" needs no number.

> *Code-lane note, 2026-07-26 (does not alter the ruling).* Applied as instructed, and the tension is
> recorded rather than resolved: the two repairs this ruling prompted **both insert a number** —
> "seventy rulings" at the hand-off's `:5` and "contiguous R1–R70" at its §3 — so each will go stale
> the next time a ruling is written, which is what R71 says to prefer against. The stale-proof
> phrasings exist ("the full rulings ledger"; "contiguous, verified from a fresh clone"). Kept as
> instructed because the planning lane owns the document's self-description; flagged so the next
> restamp can take the phrasing instead of the count.
>
> R67's framing is also narrowed by its own first counter-example: it split invariants from snapshots
> as if that were a property of *sections*, and §0.2 disproved that — a snapshot (five example teas
> with their tiers, one already moved) sitting inside the model-precision section, which reads as
> timeless. **The split is a property of figures.** §0.2 now says so explicitly.

**R72 — R64 is scoped to record surfaces.** The control shows only stored `brew_style` where it
renders a record (#02b). Where it renders a **draft** (#04), it shows the resolved lane, because that
resolution is what `commitSession` will write (`steep-sessions.js:1285`, the deliberate v3.85 decision
that `brewStyle` snapshots the method actually used — explicit pick or vessel inference).
`esMethodReadLabel()` (`:207`) stays the separate read-only derived label on the record side.

The distinction that makes it coherent: on #02b you are looking at what **was recorded**, and a lit
lane over a null column would be the app claiming to know something it doesn't. On #04 you are looking
at what is **about to happen**, and the resolved lane is a prediction the app then honours by writing
exactly that. Show and store agree because the show *is* the store, one moment early. Suppressing it
there would leave setup silent about a value it is about to commit — worse than what R64 protects
against. R64 was written while looking at the record side and the phase-2 gate; every citation in it is
an edit-surface one.

The coherent alternative — setup shows nothing **and** `commitSession` stores null — is a storage
change that would increase untagged rows and move the phase-2 gate metric. Not slice A; **recorded as
an open product call.** A "will be recorded as Gongfu" hint was declined separately: #04 draws no such
control, and R57 forbids exactly that move in the analogous case.

> *Code-lane note, 2026-07-26 (shipped in v3.95).* Encoded as the `resolve` flag on
> `methodLanesHTML()` so the divergence is legible rather than implicit — a reader can see the two
> contracts are intentional. Concretely it differs for exactly one vessel: Travel cuppa, typed
> `Porcelain teapot`, which `VESSEL_METHOD_PREFILL` doesn't cover, so its draft resolves to gongfu at
> 115 ml — which is what gets stored. Gaiwan/Kyusu/Shiboridashi all prefill explicitly and were never
> ambiguous. Both contracts are pinned in `fixtures/vessel-identity-test.js` §C.

**R73 — Line-based source scanning must split on `/\r?\n/`.** With `core.autocrlf` the working copy
carries `\r`, and JS `.` does not cross a line terminator — so a regex-based comment-stripper or
similar scan matches nothing and the check silently degrades. Found in slice A when E5 flagged its own
explanatory comment: the scan failed **green-adjacent**, reporting a problem that wasn't there. The
same mechanism could as easily hide a real one. Any suite that reads source line-by-line splits on
`/\r?\n/` first. Note `.gitattributes` does **not** help here — it pins `docs/r3/boards/**` only,
deliberately, so app source still smudges on Windows checkout.

> *Companion finding — a guard citing the wrong renderer passes vacuously forever.* Three
> misattributed-assertion findings now share one shape: slice A's E4 checked `teaShelfHTML()` when the
> sort control lives in `viewTeas()` (`steep-teas.js:266`); the build plan's F1 caught §0.3 citing
> `shelfPhoto` as the vessel fallback; and R63 recorded the same error in the hand-off. **All three
> were found by running, never by re-reading** — which is the point: the failure mode of a test is
> silence, not noise. A wrong citation produces no output to notice, so an assertion is only worth
> what its target reference is worth. Verify the symbol a guard names, not just the behaviour it
> describes.

> *Second companion, same shape — recorded 2026-08-04 from slice A's own turn.* A suite-status loop
> reported `exit=0` for two suites already known to be red. The line was of the form
> `node "$f"; echo "$(basename "$f") exit=$?"` — the command substitution runs **during argument
> expansion**, so `$?` is read after `basename` has already overwritten it, and every suite reports
> the status of `basename`. Third instance in one turn of a check whose failure mode is **silence**:
> the line-ending scan that matched nothing, the guard citing the wrong renderer, and a status loop
> that could only ever print zero. R73's case is one instance; **the pattern is the general one** — a
> check that cannot fail loudly is not a check, and the three found this round were all caught by
> running something else, never by re-reading the check.

**R74 — A document's description of the code is uninstrumented, and it fails dangerously.** R71 named
a document's account of *itself* as the one surface no guard reaches. Slice A found the larger case:
**six claims across five documents** described shipped work as pending, and because a fresh session
reads those before it reads the code, each was a live instruction to redo finished work. The
`CLAUDE.md` pair was the sharp one — a session told "currency is hard-coded to `$`, the fix belongs
in #07" would have rebuilt a primitive that already exists, and might well have added the second
writer the guard exists to prevent. **A stale figure misinforms; a stale backlog item commands.**

So: **every deploy sweeps the documents that instruct future sessions** — `CLAUDE.md`'s cleanup
backlog and known-bugs list, `STATE.md`, the roadmaps, the build plan, and any hand-off section
describing engine state. A shipped item is **struck with its version noted, never deleted**; the
record of what was planned is worth as much as the correction. Historical provenance and CHANGELOG
entries are never rewritten.

The family is now four: `export-gate-test.js` guards figures, `figures-report.js` generates
snapshots, `.gitattributes` pins bytes — and prose about code has no guard but the sweep.

> *Code-lane note, 2026-08-04 (does not alter the ruling).* Two corrections to the ruling as dictated,
> both of the shape it describes. **(a)** It read "six documents"; `e6ac37a` touched **five** files
> carrying **six** claims — `CLAUDE.md` holds two of them, the cleanup backlog and the known-bugs
> entry. Written above as found. **(b)** That commit is itself a further instance, in miniature: its
> message opens "Slice A shipped code that four documents still described as pending" above a list of
> six bullets, because the opening was written before the sweep turned up the last two and was never
> restamped — as its own later line concedes ("the four found by hand"). The record of the sweep went
> stale inside the message announcing it, which is the strongest available argument for the ruling.
>
> **Where this ruling has to live to fire.** The ledger is a *reference* — read when verifying a
> claim. The sweep is a *step* — it happens at deploy or not at all. `.claude/skills/slowcup-deploy`
> steps 3–4 cover `STATE.md` and `ROADMAP-v4.md` and nothing else; `CLAUDE.md`'s own deploy ritual
> stops at the CHANGELOG. So R74 as filed instructs no one at the moment they act. Flagged, not
> unilaterally fixed: extending the deploy checklist is a change to how every future deploy runs.

*R75–R78 were issued 2026-07-26 at the Code lane's slice-B plan review. Each load-bearing finding was
re-verified in the planning lane before ruling — `browseTeaTypes()` in a sandbox (27 categories over
55 rows, all with `aka`, exactly three `contested`: `ruan-zhi-oolong` · `dhp` · `jin-xuan-milky`) and
the shelf through `matchTeaType` (12 matched, 9 unmatched). The Code lane's list of nine is the
correct one; this lane's first pass produced two phantom rows from a naive CSV split on embedded
commas — the same shape as R69's unscoped read, and the reason a figure gets re-derived by the tool
rather than by hand.*

**R75 — A board-versus-board conflict resolves to the newer board when it was commissioned by a
later ruling and matches shipped code.** #05 rev 1's note V1 puts vessel management behind the profile
⊙ and explicitly rejects a Library segment ("not a tab, not a Library segment (both rejected)"); #13's
T2 puts Vessels in the Teas tab as its second segment. **#13 wins.** It is newer, commissioned by R53,
matches shipped `goVessels()` (`teaSeg='vessels'`, v3.46), and matches the hub sheet having no Vessels
row (`steep-core.js:940`) — so the ⊙ home #05 describes was never built either. #05 rev 1 predates R53
and its V1 note is superseded **on this point only**; the rest of that board stands.

**R76 — Vessel type stays a `VESSEL_TYPES` select; only material is free text.** #05 draws "type &
material: free text saved to `tagLibrary`". Material free text is correct and already ships
(`<input name="material">`, `steep-sessions.js:146`). Type is the nine-value select R63's kanji and
tint keying reads, so free-text type would break identity keying on precisely the principle R63
states — **identity never keys off free text**. The board's example chips `houhin` and `yunomi` are
not in `VESSEL_TYPES`. Do not build the free-text type. **Adding values to `VESSEL_TYPES` is a Design
decision, not a build one.**

**R77 — #05's two undrawn-detail flags are already decided in the repo, and a board must not reopen
settled storage.** Capacity is `capacity_ml`, integer, number only, **no unit stored**. Vessel images
are Supabase Storage public URLs in the **`tea-photos`** bucket at `<user_id>/<uuid>.jpg` — the same
bucket as tea photos; sessions use their own `photo_url` column. `sql/schema.sql`'s comment describing
`image_data` as a "base64 data URL (v2.1: move to Supabase Storage bucket)" is **stale** — the move
shipped, and the comment is an R74 case inside a SQL file. Corrected on both the `teas` and `vessels`
columns; the applied SQL is untouched.

**R78 — The shelf liquor swatch renders as the shipped type tint in R3.** #13 draws a per-tea liquor
swatch. `teas` has no colour column in `sql/schema.sql` or any later migration, and slice B is
schema-none, so the swatch is the existing `t-<type>` tint. Recorded beside it: **R39's long-press
colour correction implies a stored per-tea colour, which is new schema** — it is not in slice C's
"none" and no ruling authorises a migration for it. **Open product call, flagged not built.**

> *Recorded beside R75–R78, not as rulings.* (a) #13's overflow item **"Import backup" is dropped** —
> it ships in Settings (`triggerImport()`, `steep-settings.js:10`) and is the most destructive action
> in the app, so a second entry point is new work no ruling requires. (b) #05's **湯呑 for a "Frog
> Yunomi" is failure mode 1 on a board**: no such vessel is on the shelf (the five are Dragon Gaiwan ·
> Main Kyusu · Mogake Shiboridashi · Travel cuppa · Hario Coldbrew), and it would be a fourth kanji
> besides. Don't build it, and don't build 旅 — R63 dropped it. (c) **#13's overflow item "Sort ·
> filter" is un-greyed, not dropped:** it was drawn `#23 HELD` while #23 was open, and R60 closed #23
> in the direction of *keeping* the control. The board's greying encodes a decision that has since
> been made, in the direction of building it live.

**R79 — `fixtures/*` blanket-ignore has now silently dropped three intended commits.** The pattern is a
blanket ignore plus a per-file exception list, so **`git add -A` skips a new fixture silently** — no
warning, no error, exit 0. Three instances this round: the boards' `*.dc.html` (caught by a count check),
`figures-report.js` (caught when the planning lane couldn't read it from a clone), and
`reference-test.js` (caught by the verifier, after its own header claimed "committed; every deploy" while
it existed on one machine only). **Each was caught downstream, never at `git add`.** So: any new file
under `fixtures/` carries its exception line **in the same change**, and **`git ls-files` — never the
working tree — is what counts committed suites.** Slice B's first draft said "18 committed suites" from a
directory listing; it is **17**.

Companion to R73's family — *a check whose failure mode is silence*. Here the **tool** fails silently,
which is the same hazard one layer down.

> *Recorded beside it — a test can be self-consistent and still assert nothing.* `tea-types-test.js` E6
> matched `ya-shi-xiang`'s `covers` string against a literal copy of that same string, both carrying the
> typo `Guandong` where the shelf tea reads `Guangdong`. The assertion was **true and meaningless**: an
> exact-fold match could never fire against real data, and the suite reported green for as long as the
> typo survived. This is worse than a missing test, because it occupies the slot a real check would take.
> The general rule: **when a fixture's expected value is derived from the same source as the actual, the
> test proves only that the source equals itself.** Ground the expectation in the *other* representation —
> here, the export — which is what section G now does and what surfaced the typo.

### Finding (not a ruling) — the final export's MANIFEST stamps

The final export's MANIFEST claims all boards were restamped `77cf800 -> 9f695e2`. Two were not
(`02b-session-detail-edit-rev2`, `04-session-setup-pickers-rev6`, both still reading
`repo 77cf800`) and three carry no stamp at all (`03-tea-detail-rev3`, both bundle snapshots).
The boards are banked verbatim regardless — editing them in transit would void the hashes and
blur the lane. Noted here so those stamps are not later read as evidence of what those boards
were verified against.

---

## 2 · Corrections owed, per board

None of these were relayed to Design before its completion summary — the summary is honest and
stale. This section is the packet.

### Settings
- **Restore four shipped sections**: Brew guidance (autofill · Brew advice · **Ratio
  adjustment** — the master switch for the entire ratio layer), Session check-in (mood),
  Inventory (low-stock threshold — Niklas's is 11 — and packaging tare), and from Data &
  privacy: **Import backup** (ships with confirm-replace; Ruth's migration depends on it),
  the data-health checks, and the diagnostics log. Dropping Calm & achievements was right
  (dormant since v3.72).
- **"Your tea stays on this device" is false.** Supabase-backed: Postgres, Auth, RLS, seven
  `user_settings` rows server-side. Worst possible place for an untrue sentence.
- **SET3 is tagged CHECKED and is wrong**: `tempUnit` ships (°C/°F toggle, live screenshot
  evidence). Niklas accepts dropping °F *as a decision* — but it must be recorded as removing a
  shipped control, not as "no unit field exists."
- Theme toggle gains **System**. ~~`monoFont` (live in schema; one user has `"pixel"`) needs an
  expose-or-kill decision.~~ **Re-scoped 2026-07-25 (amended R48): there is no live control to
  expose or kill.** `monoFont` was retired in v3.53 (`87591dc`) — Settings row, `DEFAULT_SETTINGS`
  key, `html[data-mono="clean"]` CSS and the `data-mono` setter all went then; zero occurrences in
  any `.js` at HEAD. What remains is a **stale synced value** in `user_settings`, which the
  CHANGELOG already records as harmless with no migration needed. No decision owed, no code work.
  Build stamp reads `892cb0b`; current `77cf800` — stamp from build,
  not by hand. Accent row correct as display-only (contracts 3/4).
- Currency preference stays (SET2 correct); completeness panel arrives here per R22.

### #04 Session setup
- Senchadō badge/footnote stale (R2). Segment becomes four (R1). Mood card returns (R4).
  In-setup quick log returns (R5). Water placeholder per R6. The schedule strip should name its
  derivation (guide → ratio → feedback) — post-gate it's where learned defaults surface, so its
  anatomy is load-bearing.

### Shopping
- Swap the invented row: running low is **Honey Oolong Gui Fei (7 g)** and **Sencha Kagoshima
  Premium (8 g)** — no Tie Guan Yin exists. Everything else stands (overlap-as-spine, `done` =
  clear-acquired, no invented price). Add R11's restock-prefill and R12's search action.

### Social
- Restore Design's own two forgotten mechanisms: **Passed cups** (the receiving shelf for the
  Tea-detail "Pass this tea to the circle · NEW" action — currently a send with no receive) and
  **Kindred notes**. Both hang off R25's pass record.
- "SHARED to Ruth" overclaims schema — `is_shared` has no recipient. R25 resolves it; until the
  pass record exists, the badge can only say "shared."
- Both example cards are wrong: the real shared five are **Huang Ya Yellow Tips (4 Jul) · Ruby
  Ruanzhi (5 Jul) · Kabusecha Kagoshima (6 Jul) · Yashi Xiang Dancong (8 Jul) · Sencha Kagoshima
  Premium (11 Jul)** — two of them senchadō kyusu sittings, a better story than the invented
  pair. "Gyokuro Okabe" doesn't exist; it wears the real 15 Jul shiboridashi sitting's stats.
- Third edge resolves: **pebbi → tosinik**. Niklas follows only Ruth; both follow him; the
  mutual pair as drawn is correct. Count is **5 of 31 (16%)**.
- Session snapshots keep their committed `tea_name` — old sittings still read "Guandong"; do
  not "fix" history when rendering.

### Insights
- IN3 stale twice (R2 + post-retag): real split **senchadō 13 · gongfu 10 · untagged 8 ·
  western 0 · cold brew 1**. Western isn't near-empty, it's empty; senchadō is the largest
  method in the diary. Method row is four lanes (R1) and is phase-2's landing zone.
  - **Definitional note (2026-07-25) — untagged is 8 *or* 7, and both are right.** The
    difference is one session, not a discrepancy. **8** = rows with a null `brew_style`, which
    includes the single `is_cold_brew` sitting (that row's `brew_style` is blank). **7** = the
    same set minus that sitting, because a four-lane display counts it in the cold-brew lane.
    Boards use the display form: `13 + 10 + 7 + 0 + 1 = 31`. Recorded so the two numbers stop
    reading as a contradiction; neither should be "corrected" into the other.
- Restore against shipped code: three-window control (R21), cost overview with per-gram and
  per-session medians (reuse `costPerSession` from tea detail — single writer; same hardcoded-$
  bug), **brewing clock** (= the missing "when you brew"), one-line shelf status linking to
  Shopping, Wrapped teaser (R23), quiet notes / cadence / type mix / steep shape reviewed
  rather than silently dropped, card manager affordance (R24). Completeness leaves (R22).
- Plant mood × rating for when n justifies it (12/28 and climbing).

### Origins
- Complete pending Niklas's items: 4 coordinates (pass 3), and the projection rule (R19) closes
  the adaptive-frame question. The join answer is R26.

---

## 3 · Shipped-truth reference (for the sweep — verify against code, not memory)

- v3.91 (`7723123`): senchadō real; Shiboridashi vessel type; edit-modal method control (B7);
  vessel-type → method prefill (new drafts only); fixture R section rewritten.
- Post-retag reality: split above; **western 0**; gate **met 15/15** (9 gongfu / 6 senchadō
  resolved); `ratioAdjust` is **ON** for Niklas (do not trust the first `user_settings` row —
  there are seven).
- Shipped-but-unboarded views: **Focus/steeping** (ensō, Kachi-iro, per-steep temp + feedback,
  the "Just right" gate bug's home) and **Wrapped** (v3.64). Both need board numbers before
  hand-off.
- Shipped-and-partially-boarded systems: `dashLayout` card manager; `gridPeriod` windows;
  Settings' six sections + import + data health + diagnostics; quick log's two entries.
- Known open bugs (CLAUDE.md): hardcoded `$`; `ratioSetupHTML` deletion overdue (background
  task, trigger missed twice).

## 4 · Deferred / parked (nothing here is forgotten)

- **App icon + splash** — parked after 3 rounds/12 concepts; two rulings stand (icon outside the
  contracts but honours Kachi-iro scarcity; ensō belongs to the timer exclusively).
- **Per-tea elevation** — R3 pin, drawn on Add/Edit (`610 m · NEW`), schema question flagged.
  Terrain rendering separate and heavier; data first.
- **Vendor entity / spend-by-vendor** — after currency pref lands (MainTee ×5 says vendors are
  already a real dimension). Interim is R12.
- **Sample flag** — committed in `IDEA-tasting-mode.md`; touches `stockTier` (single-writer),
  not a checkbox.
- **Delete-everything** — `TASK-delete-everything.md`, unbuilt; Settings privacy copy is untrue
  until it ships; board correctly draws it disabled, and the beta welcome note must not promise
  deletion until it does.
- **Brewing session** — agenda ready: `PHASE2-PRESPEC-NOTES.md` §D (baseline conflict with
  Pillar A), §E (retagged feedback under superseded baseline), §F (bitter/strong axis), plus
  gate-metric move to stored `brew_style` and senchadō KB ratios (gyokuro).
- **Rinse research** — two constraints pre-fixed (structured supersedes prose; own contested
  field, not `confidence`).
- ~~**Coordinates pass 3** — Kagoshima City, Sri Lanka, Hoshino (gazetteer), Kunming centre.~~
  **CLOSED 2026-07-25.** `DATA-region-coordinates.md` at HEAD reads *"All eight rows verified
  against independent sources. The table is complete"* — 8/8, and the pending Sri Lanka anchor
  dissolves into the country tier under R28 (country pins are labelled polygons, not point data,
  so there is nothing to look up). That file is the citation.
- **Pillar B (launch)** — decision closed by R29; install guide + beta package gated on R3 implementation, owners assigned.
- **Tea atlas Phase B** — after phase-2, per plan.
- ~~**monoFont** — expose or kill (see Settings).~~ **CLOSED 2026-07-25 (amended R48):** nothing
  to expose or kill. The control was retired in v3.53; only a stale synced value survives, and it
  is harmless. See §2 Settings.
- **R30 fixed 2 of Niklas's 10 invisible tags, not the issue.** v3.93 recovered `roasted` and `sweet`
  (they became vocabulary). The other **eight** — `toasty · date · apricot · pear · cocoa · spices ·
  dried fruit · fig` — are near-misses or nesting cases that still need R31's alias layer / the nested
  tree; do **not** read R30 as closing the flavour-vocabulary issue. The nested tree's source now exists,
  transcribed: `DATA-flavour-wheel.md` (twelve-family aroma taxonomy) + `DATA-tasting-lexicon.md` (the
  separate structure/texture layer). All eight map into the wheel (cocoa → Confectionery; apricot/pear →
  Fruity·Fresh fruits; date/dried fruit/fig → Fruity·Dried and candied; toasty → Empyreumatic;
  spices → Spiced), which is what makes R31 draftable.
- **Flavour vocabulary — the two-layer question (R30/R31 fallout).** There is no flavour-based
  *recommender* to rethink — the only `suggest*` paths (`teaFormNameSuggest`, `suggestedBrewHTML`) are
  brewing suggestions; nothing profiles a palate. The open question is whether to *build* one, and it must
  wait until R30/R31 land (a recommender trained on today's vocabulary reasons from a third of the data).
  The interesting salvage is `KB_FLAVOR_AXES` (dead, kept — CLAUDE.md backlog): its last four items
  (`tannin · bitterness · oxidation · complexity`) are **structural dimensions**, not taste notes —
  someone once intended two layers, *what a tea tastes of* vs *how it's built*. That ties directly to
  `PHASE2-PRESPEC-NOTES.md` §F: `bitterness` is a dead axis, while `bitter` lives in `BREW_STRONG_TAGS`
  (→ "strong" → cooler + shorter). **Same problem from two sides** — bitterness is a brewing signal with
  no flavour representation; the flavour system has no notion of intensity/structure. A structural layer
  (astringency / body / bitterness captured *as sensation*) feeds §F's cause-aware correction directly:
  bitter-without-strength → temperature, strong-without-bitterness → ratio. So the flavour rethink belongs
  **on the brewing-session agenda, alongside §F**, not as separate work — both need the same decision:
  does the model get a second dimension, and is it *cause* (§F) or *structure* (axes), likely the same
  axis viewed from either end. Also Code-adjacent but not this ship: **Design #03** — bare
  (non-vocabulary) free words must surface on **Tea detail** as a quiet "also noted: fig, cocoa, date"
  line; they vanish there today though the code comment claims they "still show".

## 5 · Data appendix — rows, not counts

The recurring failure is counts without rows; these are the rows boards keep needing.
Region → teas: Kagoshima ×3 + Chiran (distinct row, clusters at low zoom) · Hoshino (sencha —
data misspells "Fukoaka") · Fujian · Yunnan ×2 · Guangdong · Zhejiang · Nantou · [Ceylon →
country tier]. Country-only: China ×5 (Pipachá, Fei Bing Beeng Cha, Dawang Feng Da Hong Pao,
Oriental Beauty, Huang Ya Yellow Tips) · Taiwan ×3 (Hualien Chike, Honey Oolong Gui Fei, Ali
Shan Fo Shou Dong Pian) · Thailand (Ruby Ruanzhi) · Sri Lanka (Moragella Oolong, oolong).
Shared five and follow edges: §2 Social. Running low: §2 Shopping. Coordinates:
`DATA-region-coordinates.md`.

## 6 · Rules for the #09b sweep (now all-boards, not Bundle 1)

1. Every board carries its **export date stamp**; staleness becomes visible, not discovered.
2. **Example data is non-normative (R27)** — stated once in the hand-off README.
3. **Claims/affordances derived from example data must be real** — check the class, not the
   instance.
4. Verify against **this ledger and the code**, never against completion summaries (Design's
   final round-summary already contained two stale claims through no fault of its own).
5. Two queue additions before the sweep: a board number for **Focus** and one for **Wrapped**.
6. Standing question per board: *did you check the export, or estimate?* — and treat "Confident"
   as a claim to verify, not a verdict (the Origins v2 inversion: the three confident pins were
   the invented ones).
