# R3 — Rulings ledger & round-2 record

> **THIS IS THE PROJECT LEDGER, NOT R3's — numbering is continuous and R4 continues in it.**
> R110–R112 closed R3; **R113 onward are R4**. There is exactly one ledger and there must stay
> exactly one: two would mean two authorities, and a ruling that is not in *this* file is not real.
>
> **Why the name and path still say `r3`, deliberately.** Six committed documents cite
> `docs/r3/planning/R3-RULINGS-LEDGER.md`, and **one of them is `CHANGELOG.md`**, whose entries are
> never rewritten. Renaming would either falsify past `Deploy:` lines or leave them pointing at a
> path that no longer exists — and the CHANGELOG's whole value is that it is not edited after the
> fact. A slightly wrong filename is cheaper than a history that lies. The `r3` records where this
> file was born, not what it governs.

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

> **~~ratified~~ RATIFIED-BUT-UNBUILT, marked 2026-08-07 by the R121b audit (finding A1), struck per
> R71 rather than rewritten.** `wakeLock` has **zero occurrences in any `.js`**. This ruling has read
> as shipped for the whole of R3 and R4, and the cost is visible: the **#07 Settings board draws
> "Keep screen awake while steeping · only while a steep timer runs (R7)" as a live toggle beside
> rows marked `shipped ✓`** — the board was not inventing, it was reading this ledger. GitHub
> **issue #33** is the user asking for the capability the ledger says exists. See **R138**.

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
**SUPERSEDED by R183 (Smart Restock, r5).** A rebuy of the exact same tea (name + vendor + harvest year)
now tops up ONE entry via a Restock button + purchase log, not a new row. The `isRepeat` /
`purchaseType:'repeat'` create path retires; existing R11 rows are left as-is (forward-only) and
soft-linked read-only.

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
changes at the #11 build. **AMENDED by R103 — read them together, never R38 alone.** R38's drawn copy
is "your July **so far**", which was written when the log was a 16-day July and monthly and so-far
meant the same thing. R103 rules the window the **last complete** month: Wrapped is the retrospective,
Insights is the live view. The "so far" copy is superseded, not merely restyled.

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
authorisation to remove it. (b) `setTeaFilter` (`steep-teas.js:606`) and `focusLogSteep`
(`steep-sessions.js:1388`) have zero callers and stay dormant: the regressions are accepted for R3,
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

*R80–R84 were issued 2026-07-26 at the Code lane's slice-B2 plan review, and every load-bearing claim
was re-verified in the planning lane first: `TEA_TYPES`' field set enumerated through the resolver (no
colour, liquor, rinse or script key exists), `sql/schema.sql:8`'s CHECK confirmed at six types,
`inventorySparkline` confirmed shipping at `steep-dashboard.js:427` and called at `steep-teas.js:785`.*

**R80 — `inventorySparkline` stays.** #03 rev 3's caption calls it "v3.28, dropped in R3" and then
describes the curve in full, including its fallback. It ships (`steep-dashboard.js:427`, called at
`steep-teas.js:785`), the board contradicts itself inside one sentence, and **R61 governs**: absence
from a board is not a removal instruction, and this is not even absence. Keep it, and keep
`sparklineHintHTML` as its fallback.

**R81 — Boards may demand data the schema does not have, and that is a finding, not a build
instruction.** #03 rev 3 and #06 rev 4 together require **seven** new data-model items: `opened_date`,
`elevation`, a per-tea liquor colour with a 14-value catalog-derived palette, structured per-step brew
guides, tisane types beyond the six-value CHECK, catalog rinse defaults with a contested flag, and a
`script` field. The hand-off's §2 entry for these boards scopes **none** of them — it covers
`brew_guide` and the cascade only. **The build authority is what is scoped, not what is drawn.** Each
unscoped item is built only after it has a ruling and, where needed, a migration. Recorded so the gap
is visible rather than rediscovered: that §2 entry was written from the boards' *behaviour* without
auditing their *data demands* — a planning-lane omission, not a Design error.

> **ONE OF THE TWO IS NOW WRITTEN (v4.11).** The **swatch** data model is
> `docs/r4/planning/SPEC-liquor-swatch-model.md` (+ its A5 amendment), banked verbatim and amended in
> its own header. **The per-origin SCRIPT model is still owed** — recorded separately in §4 so
> "R82's pins" cannot be ticked off as a pair when only one exists.

**R82 — Two of the three declared "hand-off pins" were never written.** `SPEC-freshness-model.md`'s
header names itself alongside a **swatch data model** and a **per-origin script data model**.
`R3-BUNDLE1-RECONCILIATION.md:106` says all three "are what get pinned at that build hand-off" —
future tense, and only the freshness one was delivered. So #03's declared primary path (the swatch
picker) and its script field both have a **locked visual design and no data model at all**. *A document
referring to a sibling artifact does not establish that the sibling exists.* Both are queued as
tea-reference-lane work, not built in R3. The spec's header is amended to say which siblings exist.

**R83 — The freshness model is its own slice, not a detail-page block.** `opened_date` is not a field:
per its spec it becomes the single writer for freshness on **every** surface, retires
`statusCategory`, retires `FRESH_WINDOW_MONTHS` and `FRESH_NEAR_WEEKS` as global constants, rewrites
`status-line-test.js` §D, and feeds the shelf, the picker and the running-low sort. It carries
`sql/v3_11-opened-date.sql`. The spec's own text warned this would be under-estimated, and it was — in
the build plan, by the planning lane.

**R84 — The freshness model ships INSIDE R3, as slice B3.** Ruled 2026-07-26 by Niklas. Sequenced
**B2 → B3 → C**. Its own spec is the build authority for scope
(`docs/r3/planning/SPEC-freshness-model.md`, rev 2). **§7.1's `isTeaUnopened` collision is resolved
inside the slice, not deferred**: `opened_date` set → opened, measured; absent → stock inference as
today; `isTeaUnopened` becomes the fallback rung rather than the authority. §9's claim that
`inventorySparkline` was dropped in R3 is a **stale description** — R80 governs and the curve ships.
The round now carries **two** migrations, B3's and slice F's pass record.

> *Code-lane note, 2026-07-26 (shipped in v3.97).* R81's fence held in the build with two additions
> worth recording. **(a)** #06 rev 4's "adds the three missing editables — rating · brew guide ·
> favourite" describes a gap that had already closed: all three ship, folded behind Specifics
> (`steep-teas.js:495`/`:522`/`:525`). The work was a *promotion*, on Edit only, and the board's claim
> was stale rather than unscoped — a third failure mode beside R81's. **(b)** The board's Borrow
> action turned out to have a shipped twin, `saveSuggestedGuide`, differing only in source: the KB
> versus the catalog. Reusing that writer rather than building a parallel one is what kept the
> round-trip contract (`fixtures/brew-roundtrip-test.js`) intact for free. **Both were found by
> reading the shipped code against the board, which is the audit R81 says was skipped once already.**

**R85 — Freshness windows key on a three-rung cascade, and this settles §7.2 in one place.**
`TEA_TYPES` slug → `family` → `teas.type`. The spec's §3 rejected `teas.type` on precision grounds
when `matchTeaType` covered **13 of 14** shelf teas; at **21** teas it covers 13, and slug→family
alone would take a working freshness reading away from four — **Fei Bing Beeng Cha, Moonlight White,
Chiran Sencha Okumidori, Spring White Anji** — on the most-seen surface in the app. That is a
**regression**, categorically different from §6's designed quiet: §6's silence is data not yet
entered, this would be existing readings disappearing. Fei Bing is the shelf's only pu-erh and has no
catalog row, so `ageing: on` could never reach the one tea on the shelf that actually ages.

Three reasons beyond "nothing regresses". **It is the app's own pattern** — user value → catalog
default → broader fallback is §0.5's three-tier cascade, and slug→family is that cascade with its last
rung deleted; `teas.type` is not a worse kind of answer, it is a *coarser* one, which is what a final
rung is for. **Losing four working readings to a content gap inverts a refinement** — #37 exists so a
tea can climb tiers as data arrives, and authoring a `covers` entry upgrades a tea from rung 3 to rung
2, a ladder rather than a cliff. **And gating a code slice on content authoring** would have blocked a
migration on eight queued tea-reference entries.

The `puerh ↔ dark` mapping is a **single named constant citing §7.2** — when the two vocabularies are
unified, that constant is the one place to change.

**R86 — `ageing` is catalog data in R3; a per-tea override is not built.** The spec contradicts
itself: **§4** calls it "flippable per tea" while **§5** lists only `opened_date` and catalog data as
the model's inputs. A `teas.ageing` column would be a second migration column for a feature with no
board and no ruling — **R81 is precisely the ruling against it**. The roasted-Wuyi case is genuine but
it is one hypothetical tea against a column added on the strength of a contradiction. Catalog-only
ships; the override is an open product call, and the spec is amended so the contradiction is visible
rather than latent.

> *Code-lane note, 2026-07-26 (shipped in v3.98).* Two consequences worth recording. **(a) Ageing
> needs no clock**, and the first build got it wrong: requiring both keys for "ages well" silently
> dropped the label from every ageing tea with no harvest date — Yunnan Silver Bud on the real shelf.
> A countdown is meaningless without a date; "ages well" is a statement about the *leaf*, knowable
> from the window rung alone. §4 calls this section a copy replacement over shipped behaviour, and a
> replacement that drops the label is a removal. Caught by the suite, not by review. **(b) R85's third
> rung makes the elapsed-only rung unreachable in production** — `teas.type` is CHECK-constrained to
> six values that all carry a window, so a real tea can no longer be window-less. §2 justified
> elapsed-only as the rung "every new tea starts on, by construction", which was true when the window
> keyed on the catalog alone. The rung is now **defensive rather than routine**, which is strictly
> better, and the suite reports its zero live examples rather than requiring one — the R70 shape.

**R87 — The bottom-nav Log button keeps opening setup.** #12 rev 1's flag claims both the nav Log and
the in-setup shortcut reach quick log, marked **"as checked"**; at HEAD the nav calls
`quickLogSession()` → `startSessionFor(null)` → `stage:'setup'`, and `beginQuickLog()` from setup's
shortcut (R5) is the **only** entry to `stage:'quick'`. The claim is false and is recorded as a board
finding, not built to. The nav's destination stays setup: it is the app's most-used control, the
prospective posture is the **recoverable** one — setup reaches quick log in one more tap, quick log
cannot reach the timer at all — and a verified-false premise is not grounds for changing it. A
disambiguation screen in front of the commonest action was rejected as the friction this app is built
against. Revisit only with a ruling that argues the posture on its own merits.

**R88 — Quick log gains a tea picker and a vessel picker, and carries the tea forward.** #12 says
"nothing preselected — quick log starts empty and asks"; at HEAD `startSessionFor(null)` defaults
`teaId` to the first in-stock tea and `sessionQuickHTML` offers **no control at all**. Both pickers are
built — the vessel by **R43**, the tea because "starts empty and asks" is otherwise unbuildable, since
a screen that opens empty with no way to fill it is worse than one opening on a sensible default. The
**empty start is not built**: under R87 quick log is entered from setup, where a tea was chosen one tap
earlier, so starting empty would discard a live user choice. The tea carries forward and the picker
changes it. R43's vessel stays optional and never blocks the log; a **tea** does block it, because a
cup with no tea is not a record. Reuse #04's shipped `<select>` mechanics — one vocabulary across both
screens, not a second control.

**R89 — #14's custom listbox is deferred out of R3.** #04 rev 6 says its picker "closes #14" — a
searchable scoped listbox with swatch-led rows for teas and a photo/kanji twin for vessels. Its
**long-press swatch colour correction (R39) cannot ship regardless**: there is no per-tea colour column
(**R78**) and the palette's data model was never written (**R82**). Building the listbox without it
half-closes #14 while omitting the board's own primary affordance. The `<select>` + `<optgroup>`
controls stay. **#14 reopens when the swatch data model lands.**

> **THE CONDITION IS MET — #14 IS REOPENED (v4.14/v4.15).** Both blockers this ruling names are gone:
> ~~there is no per-tea colour column (R78)~~ — `teas.liquor` exists (`sql/v3_12-liquor.sql`, applied
> 2026-08-07) — and ~~the palette's data model was never written (R82)~~ — it is
> `docs/r4/planning/SPEC-liquor-swatch-model.md`, with a twelve-stop ramp and all 55 rows assigned.
> **R39's long-press correction can now ship**, and it is the remaining third of the swatch work
> (slice 3: the form control first, long-press optional). Struck rather than deleted because the
> *reasoning* stands and is why the listbox waited — but left as written this paragraph is an
> instruction not to build something whose preconditions have since been met, which is R71's trap in
> its commanding form.
>
> **BUILD AUTHORITY for slice 3 (v4.19 per R141) is `docs/r4/planning/SPEC-liquor-swatch-model.md`
> §4.1** — added 2026-08-26 at the session handoff, because the full approved control spec (the COLOUR
> row, F2's name-not-type mechanism, F1's containment guard, R121 geometry, the three accepted
> deviations, and the A2 fence timing) existed only in the planning↔code chat that scoped it and would
> have died with that session. §4.1 supersedes §4's long-press framing.

> *Code-lane note, 2026-07-26 (shipped in v3.99).* Two things worth the record. **(a) #04's half of the
> date inversion needed no work at all** — `sessionDate` has shipped inside *More details* since it
> landed, so "folded away on #04" was already true and the entire inversion is #12's. A board
> describing a shipped state as work is the third distinct shape this round beside R81's unscoped
> demands and #06's closed-gap claim. **(b) The active WHEN chip is derived from the date rather than
> stored beside it**, so a date typed in the picker lights the matching chip — the alternative keeps a
> second source of truth for one field, which is the drift every single-writer ruling this round has
> been about.

**R90 — Record surfaces show stored `brew_style` only; the hero header is a record surface.** R64 was
written about the edit control; #02b's hero line is the same class and the **stricter** case, because
an identity line reads as fact rather than as a reading. The 6 Jul Da Hong Pao hero has `brew_style`
empty and a 110 ml vessel, so a derived lane would print "gongfu" over a null column. Nothing is shown
on a null row — on the hero, in the lane control, and anywhere else rendering a stored session.
`esMethodReadLabel()` remains the one place a derived reading appears, on the edit surface, visibly a
reading.

**R91 — Brew-again carries the vessel always and the method only when stored.** R40 says "carries
vessel + method". Carrying a derived method from a null-`brew_style` session would let the capacity
heuristic become a stored record on the next save — **R64's laundering, one step removed**.
`startSessionFor` gains optional prefill; the method argument is passed only when the source row
actually holds one.

**R92 — The Sessions tab's two date surfaces merge behind one toggle.** `viewSessions` ships a month
calendar (a *filter control*, `selectCalDay`) and `streakCardHTML()`'s Brewing-days heatmap (a
*read-only reading*). R42 names only the heatmap; #02 redraws away from stacked date surfaces. Both go
behind one "Brewing days" toggle with the list as default — the calendar's day-filter stays reachable,
so **R61 is satisfied: the capability survives, its position changes**.

> *Code-lane note, 2026-07-26 (shipped in v4.00).* Three things worth the record. **(a) The guard held
> unedited.** `fixtures/session-edit-test.js` was written against the working modal, run green before
> the move existed, and its diff across the move commit is empty — which is the evidence that it
> measures known-good behaviour rather than what the move produced. **(b) Two negative controls showed
> the guard's two halves catch different failures**: a shallow copy turns section B red while C stays
> green (aliasing shares data rather than losing it, so nothing looks missing — and an aliased draft
> also means a *cancelled* edit silently keeps its changes), while a field-by-field writeback turns C
> and D red while B stays green. Neither section may later be dropped as redundant. **(c) R91's trap
> needed a case that separates the two mechanisms.** "Brew-again from a null session yields gongfu"
> looks like a violation but is the shipped v3.91 vessel-type prefill doing what picking that vessel by
> hand does. **Travel cuppa** separates them — typed `Porcelain teapot` so the prefill map misses it,
> 115 ml so `brewMethodFor` would say gongfu — and brew-again yields **null**. Pinned in
> `quick-log-test.js` §H.

**R93 — R4 is the swatch and Home, and the deferred register gets a schedule.** Ruled by Niklas,
2026-07-26. R3's build finishes as planned (E–H). The round after is scoped **now**, because the two
largest gaps left in the app both drifted out of R3 through individually-correct local decisions
rather than any single ruling — which is exactly how a gap becomes invisible.

**(a) The liquor swatch.** Contract #1 of the visual contracts — *"identifies a tea, identity only,
never decoration"* — and #06's declared primary path, **shipping unimplemented**. What renders today
is a **type tint** (`t-green`, `t-oolong`: six colours keyed on `teas.type`), so every green tea is
the same colour; a liquor swatch is **per tea**. Landing it needs three things and only one is code:
a per-tea colour **column** (migration), a **liquor value on each of the 55 `TEA_TYPES` rows** (the
source #06's "14-colour palette derived from the catalog liquors" was to derive from), and the
**swatch data model R82 found was never written**. It also unblocks **#14**'s custom listbox (R89),
whose primary affordance is the long-press colour correction (R39). Scope it as a slice comparable
to B3.

> **PARTLY DISCHARGED in v4.11.** ~~the swatch data model R82 found was never written~~ — **it is
> written**: `docs/r4/planning/SPEC-liquor-swatch-model.md`, banked verbatim in `94edced` and amended
> at the build (A1–A5 in its header). **Updated 2026-08-07 — this note had itself gone stale within
> four deploys**, which is the trap it exists to guard: it said "ten-stop ramp" (A5 made it twelve)
> and listed the column and cascade as owed after both had shipped.
> **All three things this ruling names have landed:** the **twelve-stop ramp** as tokens in both
> themes (v4.11, A5); a `liquor` on **44 of 55** `TEA_TYPES` rows, eleven deliberately null and
> asserted (v4.11); and the **per-tea column** with the read-time cascade (v4.14,
> `sql/v3_12-liquor.sql`). **Three slots render it** (v4.15).
> **Still owed: the PICKER** (R39) — form control first, long-press optional — which is what actually
> unblocks #14, whose R89 condition is now met.

**(b) Home.** R53 accepted Bundle 1 for Home and the non-Focus steeping states, so Home receives the
§0 primitives and nothing else — no revision board, none scheduled. That was **correct for R3**: Home
carried no new R3 affordances. But it is the **first surface opened on every launch and the last
untouched by the redesign**. R4 commissions a Home revision board.

> **AMENDED 2026-08-07, at R4's opening.** This clause was relayed to Design as *"Home has never had
> a board"*, and **that is false.** **R2 WS2 boarded Home** in three directions (2a greeting-led ·
> 2b today & shelf · 2c bare glance), deep-dived it with morning, dark and evening-rested states, and
> **Niklas locked 2a** — greeting as Shippori hero, the stat grid shed to Insights and Wrapped;
> `DESIGN.md:6` records WS2 shipping in **v3.65**, and Bundle 1 then drew Home as a canonical screen.
> What Home lacked was an **R4 revision** board, which is a smaller and far more answerable claim.
> The correction matters because it changes the board's standing: R4's Home board is a **revision
> against a lock**, so R61 protects 2a and Design's refusal to re-open "is Home a card stack at all"
> is right — re-asking it would reverse a lock on no new evidence.

**§4 is a queue, not a graveyard.** Everything in it is scheduled to one of three places, and §4 now
says which. Nothing in this ruling changes slices E–H; it exists so the next round's scope lives in
the repo rather than in a chat log.

**R94 — Kachi-iro becomes real in slice E, on the Focus ring and nowhere else.** Visual contract 4 has
shipped **unimplemented for the whole round**: the Focus ring is `#E3A15C` amber (`styles.css:612`,
`:616`), no kachi token exists, and the only two mentions in the repo are comments deferring to it as
though it were already there. Land `--kachi`, `--kachi-ink`, `--kachi-soft`, `--kachi-line` in `:root`
and `html[data-theme="dark"]` from #10 rev 2's values (light `#26343F` / `#F1EEE6` / `.08` / `.22`;
dark `#7FA6C4` / `#14130E` / `.12` / `.30`), applied only to `.focus-enso .enso-arc` and
`.focus-halo`. **Never hardcoded at a render site** — the v3.95 currency lesson. The board paints the
steeping screen's Pause button, mode pill and feedback card in kachi; **that surface is round-1 under
R53 and keeps its shipped amber and jade.** "One surface total" is the contract, and *the scarcity is
what makes the accent mean anything.* A guard asserts kachi appears on no other selector.

**R95 — A board's build-first rationale expires when its reason is discharged.** #10 rev 2 leads with
*"today 'Just right' flashes and saves nothing; taste data is lost every session until this lands"*
and is stamped `BUILD · #10 · FIRST`. The write shipped in **v3.92** (`steep-sessions.js:1009`, gated
by `steepFbActive`), and the board half-concedes it in passing while its headline and its hand-off
flag still describe live data loss. Slice E is a **restyle, not a rescue**, and stays where the build
plan puts it. This is the **fourth instance this round** of a board describing already-shipped state
as pending — after #06's already-closed editables, #04's already-folded date, and #02b's
verified-false "as checked" nav claim (R87). Per R74, *a stale backlog item commands*: a session
reading that flag would set out to fix a data-loss bug that does not exist. **Priority stamps on
boards are read as live instructions and expire the same way.**

> *Code-lane note, 2026-07-26 (shipped in v4.01).* Two things worth the record. **(a) Focus is always
> dark independent of page theme**, so the ring pins kachi's dark lift in a scoped re-declaration on
> `.focus-screen` rather than inheriting `:root`'s deep indigo — which would have put a near-black arc
> on a near-black field. Scoping keeps `--kachi` the single definition; a hex at the render site was
> the alternative, and that is the thing R94's own last sentence forbids. Verified `#7FA6C4` in both
> page themes. **(b) The most important assertion in `focus-test.js` is not about Focus.** Focus and
> every non-Focus steeping state are the same function, so section D pins six undrawn states against
> shipped output — R53's guarantee, asserted rather than intended. Section B's confinement check was
> verified to fail by leaking kachi onto `.pour-saved`: nothing breaks when an accent spreads, it just
> stops meaning anything.

**R96 — A pass carries a denormalised tea snapshot, not just `tea_id`.** `teas` is owner-only under
RLS (`sql/schema.sql:88`), so a recipient handed a `tea_id` resolves nothing and the Passed-to-you
shelf renders blank rows. `tea_name` is `not null` and `tea_type` nullable, following the precedent
`sql/v3_0-social.sql` §3 already set for the feed — denormalise so teas and vessels stay private.
R25's shape was a subset, not a contradiction. `session_id` and `tea_id` are the sender's
provenance, `on delete set null`: the sender deleting their own tea must not delete the record of
what someone else was sent. The snapshot is written **as stored** and never re-spelled.

> *Code-lane note, 2026-08-05 (shipped in v4.02).* The rule has a live example and it costs
> something. The 8 Jul shared sitting's snapshot reads **"Yashi Xiang Dancong Guandong"** while the
> tea row and the catalog's `covers` both read **"Guangdong"** — the tea was renamed after that
> sitting was committed, and later sittings carry the corrected spelling. So the row renders
> "Guandong" as stored, correctly, **and gets no script**, because `matchTeaType` is exact-fold and
> the snapshot predates the fix. Not re-spelling history is the ruling; losing the script on that
> one row is its price, and it is the right trade.

**R97 — R36's tier resolves at read time; no `catalog_slug` column.** `matchTeaType` runs
client-side against a catalog that ships in the bundle. Storing the slug would freeze the answer at
send time; resolving on read means authoring a `covers` entry later upgrades passes **already
sent**. With 8 of 21 shelf teas uncovered, that is not hypothetical. One fewer column.

**R98 — The minimal preview has no script, by construction.** R36's tier 2 is the no-catalog-match
branch, and script's only source is a CJK entry in a catalog row's `aka` via `refScript()`. So the
field the board draws for that tier can never render on it. The preview is sender's note + name +
the shipped **type tint** — not a liquor swatch, which R93 puts in R4. This is the third consequence
of R82's never-written script data model, and it is recorded rather than worked around.

> *Code-lane note, 2026-08-05 (shipped in v4.02).* **#08 Social rev 3's own worked example fails its
> own rule.** The board's flag reads *"the Go Deeper reference entry where the catalog covers it (Rou
> Gui is a Wuyi yancha, so it would)"*. `TEA_TYPES` does carry a `rou-gui` row — but `matchTeaType`
> is `covers`-only by design (v3.96), and `rou-gui`'s `covers` is absent, so the board's illustrative
> passed cup takes the **preview** branch, not the reference one. Verified live. The R27 family: an
> affordance claim derived from example data, where the class is right and the instance is not.

**R99 — A specificity tie between a component base rule and a palette class is resolved by source
order, and no "the rule exists" assertion can see it.** Second instance this round, same shape both
times: `.vessel-tile` versus `.t-<teatype>` in slice B, `.social-tile` versus `.t-green` in slice F.
Both are `(0,1,0)`; both blocks are appended below the palette; both silently flattened every type
tint to one flat colour. Neither was caught by checking the rule was present — both were caught by
reading the **computed background in both themes**. Any new component carrying a palette class
either declares no competing property on its base rule, or uses a compound selector, and its guard
reads computed style rather than asserting a rule exists.

**R100 — The "top X" reducers cannot express a tie, and that is a LATENT defect, not a live one.**
Three reducers take the **first** maximum and never revisit it: `peakBucket`
(`steep-dashboard.js:79–80`, `if(v>peakVal)`), and `computeWrapped`'s `topTea` (`steep-insights.js:241`)
and `topType` (`:247`), both `if(c>topTeaN)`. While one value is a strict maximum they are correct.
The moment two are level they silently name one — no tie, no hedge, no signal that a choice was made.
Slice G builds one shared **argmax that reports ties**, and copy generated from it names *both* when a
tie occurs. Which is the interesting fact anyway: two equal peaks is a truer thing to say about a
brewing habit than an arbitrary winner.

> *Correction, recorded rather than smoothed (2026-08-06).* This ruling was first drafted by the Code
> lane asserting the app **is currently printing a false peak** — that `brewingClockHTML` renders
> `peak 8:00–10:00` over a genuine tie. That was **wrong at live data**. It was derived from the
> 2026-07-26 stamped export (40 sessions · 133 steeps · 21 days · 162.5 g), where 08–10 and 12–14 tie
> at 15. Live on 2026-08-06 the log reads **42 sessions · 143 infusions · 23 days · 168.5 g** — two
> more sittings, and the tie has broken. 08–10 genuinely leads, so the shipped label is **accurate**.
>
> The error is **R67's own failure mode, committed inside a ruling about prose going quietly false**:
> a stamped snapshot read as if it were the current state. The stamp was doing its job; it was read
> past. Both lanes reached the same wrong conclusion from the same file, which is what makes it worth
> a paragraph rather than a corrected sentence — the stamp does not protect a reader who has decided
> what the data says.
>
> **Consequence for slice G, binding:** that slice is made *entirely* of snapshots — the clock, the
> method split, the type mix, the cost figures, Wrapped's every card. **Re-derive each of them at
> build from live-shaped data**, never from §1's stamp or from this ledger. The Main Kyusu / Mogake
> tie at 9 may also have moved; so may the ten country-only origins and the shared-by-you fraction.
> A figure this slice renders is a snapshot under R67, and a slice of nothing but snapshots is where
> reading a stamp as a state does the most damage.

> **Provenance flag on R101 and R102 below.** The decisions prompt carrying them did not reach the
> Code lane; both are transcribed from the planning lane's 2026-08-06 relay of their substance, not
> from the original text. The *substance* is the planning lane's and is recorded as ruled. **If the
> original wording differs, overwrite these two entries with it** — a ruling's authority is its
> committed text, and this is the one place in the ledger where the text is a reconstruction rather
> than a transcription. Flagged rather than left silent, because failure mode 3 is self-minted
> R-numbers and this is one step away from it.

**R103 — Wrapped's window is the LAST COMPLETE month, not the current one. This AMENDS R38.**
R38 ruled the period "monthly, explicit" and drew "your July so far". That was ruled when the log was
a 16-day July, where *monthly* and *so far* were the same thing — so nobody had to decide whether
Wrapped was a live view or a retrospective. The log now spans two months (40 sittings in July, 2 in
August) and the two have separated. The answer is **retrospective**: "Wrapped" denotes a closed
period wherever the word is used, and the decisive fact is that **Insights already covers the current
month** through its shipped All-time / Month / Week control. A thin-month Wrapped would duplicate a
surface that already exists and do it worse — the same 2 sittings, dressed as a review.

So on 6 August, Wrapped reads "Your July, wrapped": a real artifact, with **no threshold, no fallback
rule, no thin-month state, no invented behaviour**. Wrapped is the completed retrospective; Insights
is the live view. This removes the overlap rather than managing it.

Rejected explicitly: showing the current month with a thin state (duplicates Insights); and showing
last month while labelled "so far" (the dishonesty R68 exists to prevent — R103 shows July and says
July). **Edge:** if the last complete month has no sittings, fall back to the most recent month that
does, labelled by its own name; if none exists, render nothing, never an empty card. **R38 carries an
amendment note pointing here**, the way R1 points at R50, so no lane reads its drawn "so far" copy as
current.

> *Code-lane note, 2026-08-06 (shipped in v4.03).* Three consequences. **(a)** `seasonInfo()` had
> **zero callers** afterwards and was deleted; R38's future sibling is *yearly*, not seasonal, so
> nothing was waiting on it. The `w.season` key kept its name — it is the shape twenty render sites
> destructure, and renaming it would have touched all of them to say the same thing. **(b)** The
> decorated empty state went with it: "your August is just beginning" was a live-view sentence on a
> surface that is no longer a live view. **(c)** Two copy defects the window exposed, both caught in
> the browser rather than by a suite: the cover read **"JUL — JUL"** once both ends fell in one month,
> and the share button **lowercased a proper noun** ("Share your juli"). Month names render in the
> user's locale, as every other date in this app does, so a German-locale user reads "Juli" inside
> English copy — consistent with `fmtDate`, and flagged rather than quietly changed.

**R101 — The Origins map is one build, in slice H, and the map's dependency is its own question.**
Slice G ships the Origins **card as an entry point** — a generated count line and a tap into Origins
— plus R54's fence, and nothing that draws geography. The map lands once, in H, beside #37.
Reasoning, in order: the dependency deserves its own ruling rather than arriving as a side-effect of
scheduling — `origins-map-v3.html` renders through `d3.geoMercator()` over Natural Earth features,
which would be the **first third-party runtime dependency since Supabase** on a no-bundler app that
precaches every asset it ships. Hand-rolling is not the cheaper option, it is a **re-ruling**: R28
*defines* the country tier as a polygon label, so dropping polygons costs **10 of 21 teas** their
placement rule. And one map in one slice beats a mini-map in G that must agree with a full map in H —
the second-writer problem, which this round has now paid for twice.

**R102 — R54's fence goes in the mover, not the table. A default is not a constraint.**
`DASH_SURFACE` sets only a *default*; `dashMoveToSurface` writes an override for **any** id, so a
registry entry of `insights` leaves a user free to land Origins on Home — precisely what R54 exists
to prevent. The guard asserts `dashSurface('origins')` cannot return `'home'` **after a move
attempt**, which is a different assertion from checking the table's value.

**Tie copy, ruled alongside R100:** name both, cut the flourish. A tie is the more interesting fact
than either bucket, and "peak 08–10 with a midday second pour" asserts a hierarchy that may not
exist. Naming both describes what is true.

**R104 — A guard scoped to a helper is blind to every site that never calls it.** Slice A audited six
money sites and landed `currencyFmt`. **Six more render sites in the spend view** — the 30 px
headline, avg-per-active-month, tracked total, the undated line, the chart bar labels, and the cost
card's "This month" — printed amounts with **no symbol at all**, and shipped that way through four
slices. `vessel-identity-test.js` §E guards that `currencyFmt` *behaves*; it cannot see a render site
that never invokes it.

This is a **distinct failure shape** from the vacuous assertion (E4 against the wrong renderer) and
the tautological one (E6 matching a typo against itself): here the test is correct *and* correctly
scoped, and its reach simply stops short of the defect. **A behavioural guard on a helper must be
paired with a site-level scan** — find the renders that should call it and assert they do. Slice H
closes this one for currency; the same pairing applies to `escapeHtml`, `fmtDate`, and any other
helper whose whole value is that every relevant site uses it.

**R105 — An instrument is not exempt from the failure it instruments.** Three instrument failures in
slice G alone. `figures-report.js` carried a hardcoded `as of 2026-07-26` — a hand-written date
inside the tool built to stop hand-copied figures, wrong for two exports. The **same reporter carried
its own copy of the origin tier rule**, making the tool that reports the 11/10 split a second
definition of it; `originTier` now lives in the app and the reporter calls it in its sandbox. And the
**suite-runner matched stdout strings**, so `wrapped-cards-test.js` printing `1 FAILED  (32 passed)`
— matching neither `^FAILED` nor `FAIL:` — reported two genuinely red suites as green, caught only
because a specific assertion was expected to break and didn't.

Precedent: the **export gate's own floor was the unscoped teas count** in slice B, so scoping the
export would have made the gate reject correct data — F5 inside the tool written to catch F5.

Every rule this project enforces applies to the thing enforcing it, and the checks that verify
instruments are the ones nobody writes. Standing form: **suite status is read from exit codes, never
stdout** (R73's family — the failure mode is silence). **A tool that reports a figure calls the app's
writer for it** rather than carrying its own. **A tool that stamps data reads the stamp** rather than
embedding it.

**R106 — Origins renders a static simplified world outline with inline coordinate projection. No
runtime map dependency, and R28 is preserved rather than re-ruled.** The atlas is small: eight
verified coordinate rows (three more owed) covering 11 region-tier teas, and a country tier of
exactly **four** countries. Fourteen marks. `origins-map-v3.html` pulls `d3@7.9.0`,
`topojson-client@3.1.0` and `world-atlas@2.0.2` from unpkg and jsdelivr to draw them.

**R28's polygon requirement dissolves on inspection.** Pole-of-inaccessibility is a *static property
of a country's shape* — it does not change between renders. Placing four country labels needs **four
precomputed points stored as data rows**, not runtime geometry. So the country tier keeps its meaning
and R28 is honoured rather than amended. **The projection is arithmetic, not a library:** `fitExtent`
over a MultiPoint is convenience, Mercator forward is a few lines, and the bounding box is knowable
because it is the user's own shelf.

Rejected: **d3 + Natural Earth** (~140 KB precached for fourteen marks, and three CDN fetches would
be the first thing in this app to fail without network, in a PWA whose offline story is
load-bearing); **hand-rolled with no polygons** (costs 10 of 21 teas their placement rule and
re-rules R28); **region pins only** (a partial atlas, and #37's before/after panel would draw
something narrower than it shows). The cost is stated: sourcing the outline is a one-time build-time
artifact rather than a runtime capability. If a zoomable atlas is ever wanted, the dependency option
remains open and nothing here blocks it. **The artifact is queued in §4 and blocks H2.**

**R107 — The completeness panel is deferred out of R3, and needs a product ruling before it is built
at all.** R22 says the panel *moves* from Insights to Settings. It exists **nowhere** in the code —
not on Insights, not anywhere — so "moves" is false and building it inside a restyle is new scope:
R81's shape, and the eighth board claim this round not to survive contact with HEAD.

The deferral is not only scope. **A completeness panel is a progress bar for filling in fields**, and
that meets the app's founding constraint head-on: no gamification, no required taps, zero-feedback
sessions are complete and un-nagged outcomes. *"Your shelf is 68% complete"* is a nag with a number
on it. *"3 teas have no origin recorded"* is a tool you can act on or ignore. Those are **different
products sharing one name**, and which one it is must be ruled deliberately rather than settled by
whoever styles the row. **R22 is amended: the panel does not move, because there is nothing to move.**
It joins §4's deferred register, scheduled post-beta, with the calm-first tension recorded as the
thing to resolve first.

**R108 — A shared helper changing its return contract needs CONSUMER coverage, and some views have
none.** `statusLine` returned a string until B3 made it a structured `{text, tone}` reading. H1's
shopping rows were written against the old shape, so every row rendered `[object Object]` on first
paint — both the running-low lines and the rebuy line. The single-writer instinct was correct; the
contract moved underneath it **three slices earlier**, and no suite renders that view, so only
looking found it.

**This is a third distinct gap shape.** R104 was a guard whose reach stopped short of the defect —
correct test, wrong scope. R105 was instruments exempting themselves from the rules they enforce.
This is a **contract change with no consumer test**: nothing was wrong with the assertions on
`statusLine` itself, and nothing ever would be. More assertions on the helper cannot close it.

The mitigation is a **render smoke test per view** — assert the view renders without throwing and
without emitting `[object Object]`, `undefined`, `NaN` or a bare `[object` in its output. That would
have caught this **at the slice that changed the type**, not three slices later at a human's first
glance.

**The gap, enumerated 2026-08-06 (the ask was its size, not its closure):**

> **14 of 15 top-level views have no suite that calls them.** `viewTeas` is the only exception
> (`reference-test`, `shelf-order-test`). Uncovered: `viewDashboard` · `viewInsights` · `viewFriends`
> · `viewShopping` · `viewSessions` · `viewSessionDetail` · `viewSessionEdit` · `viewSessionFlow` ·
> `viewTeaDetail` · `viewVessels` · `viewWrapped` · `viewSpend` · `viewPassport` ·
> `viewAchievements` (dormant).
>
> **Component coverage is wide and is not the same thing.** The suites exercise the builders *beneath*
> these views — the Insights cards, the Social sections, the Focus states, quick log, the session-edit
> body, the Wrapped cards. A component test cannot see a type change at the seam between a helper and
> a view, which is exactly what this was.
>
> **All three views this round built are uncovered at the top level** — `viewFriends` (F),
> `viewInsights`/`viewWrapped` (G), `viewShopping` (H1). H2 and H3 each add a surface, so adding them
> blind repeats this.
>
> Cost estimate: one shared smoke harness plus ~14 assertions, one focused sitting. The per-view
> state seeding is the real work, and several suites already carry most of it. **Whether that is R3
> work or R4's is not this lane's call to make alone** — recorded so the decision is made rather than
> defaulted.

> *Code-lane note, 2026-08-06 (harness built, v4.05).* `fixtures/render-smoke-test.js`, 15 views ×
> two passes. **Proven against the defect it was written for** — reintroducing H1's `statusLine`
> interpolation reddens two checks on `viewShopping`. Three things worth inheriting. **(a) §D is what
> keeps the rest honest**: every other assertion in the file passes against an **empty string**, so a
> view that silently returned `''` would sail through the whole suite while rendering a blank screen —
> §D requires real markup from the ten substantial surfaces. **(b) §C pins the view list against
> `render()`'s own routing**, so a view added there cannot be silently skipped here. **(c) The empty
> account is the pass that earns its keep**: `undefined` and `NaN` come from the no-rows branches, not
> the populated ones.

**R109 — A passed tea goes to the WISHLIST, not the shelf. Amends R36.** R36 specified Add-to-shelf
as the only action on the minimal preview. Real use — Niklas ran the feature end to end with Ruth's
phone as the recipient — shows that claims ownership of a tea the recipient has only been *told
about*, and **the claim propagates**: the tea enters stock at 0 g, therefore reads `empty` under
`stockTier`, therefore appears in Shopping's running-low list, and takes a slot in "21 teas". None of
that is true of a recommendation.

The wishlist is the surface built for exactly this — a tea you want and do not have — and a pass maps
onto it **with no schema change**: `wishlist` already carries `name`, `tea_type`, `note` and a
nullable `vendor` (`sql/v3_3-wishlist.sql:5–14`). The sender's note becomes the wishlist note rather
than being discarded into a shelf row, **which is a better outcome than the original**. The onward
path needs nothing new either: `teaFromWishItem` moves the row to the shelf when the tea is actually
acquired, R49's normalised-name join matches it, and SH1's overlap handling already draws a wishlist
row naming a tea now on the shelf. Add-to-shelf **stays available as a secondary action** — someone
may be passed a tea they already own, or buy it at once — but it is no longer the only one and no
longer the default. Applies to **both** R36 tiers. Same idempotency guard as `addWishFromTea`: a pass
added twice must not create two rows.

**Recorded as the first ruling this round overturned by USING the app rather than by reading it
against the repo.** Every other correction this round came from checking a claim against code or
export; this one could only come from the thing working and still being wrong.

> *Code-lane note, 2026-08-06 (shipped in v4.06).* The guard is at the **writer**, not the call site —
> `addWishFromTea`'s guard had to be moved there after `rebuyYes` inherited the bug, so this one
> starts there. Both halves are proven by negative control: disabling the guard reddens F15, and
> making the shelf primary again reddens F9/F10. **F16 asserts the propagation rather than describing
> it** — a 0 g shelf row does not read as neutral under `stockTier`, which is the actual argument and
> the part a future "simplify to one action" would not notice.

> *Code-lane note on R106, 2026-08-06 (built and shipped in v4.07).* Four things worth inheriting.
> **(a) The tool refuses to write when a pin would land in the sea**, and that is what sets the
> tolerance — 1.0 is what the assertion permits, not the smallest number that looked acceptable.
> Running at 1.5 exits 1 and leaves the asset untouched, which is the negative control for the tool
> itself. **(b) The projection ships INSIDE the asset**, beside the paths it produced, so a pin
> cannot be projected with a different forward than the coastline was drawn with — the failure that
> would be invisible except as pins landing slightly wrong. **(c) The frame is the ruled SPAN, not a
> padding number.** A first build used a fixed 26-unit pad and produced 2.69 px/unit and a 60% span:
> none of Design's figures reproduced. Padding is a consequence, the span is the decision, and a
> fixed pad silently changes what "14 px" means the moment the shelf's spread changes. Expressed as
> the property, every ruled figure reproduces exactly. **(d) The pole-of-inaccessibility code is
> deliberately ABSENT**, not kept dormant: direction 2 takes the country tier off the map, so there
> are no country marks to place. The finding that produced it survives as the reason the honest
> rendering is a list.
>
> **R45/R66 are discharged in the same slice, last within it**, as required: the hub's Passport row
> and the dot-map view are gone; `PASSPORT_GEO` / `PASSPORT_SUB` / `PASSPORT_LAND` /
> `passportCountryFor` stay and are **used by Origins**, asserted so that "kept" cannot quietly become
> "orphaned". R3's only shipped-control removal, and it landed after its replacement existed.

**R110 — Origins renders at DIRECTION 2, per the banked frame ruling board.** The country tier is
listed rather than pinned; the map draws coordinate-backed region pins only. The frame is the marks'
bbox, padded by 10% of the box's longer side, **then expanded to the card's aspect** — the expansion
never crops, and it is the half missing from v4.07, which is why the eastern edge cut through Japan.
Merged marks wear a ring; no map renders below two pins, with a 30-unit floor. `ORIGINS_MERGE_PX`
is 14. The board is banked at `docs/r3/boards/origins-frame-ruling.dc.html`, sha256
`441fceb3075a837b…`, arriving post-export and **banked late** — recorded in R3-STATUS §3 so the gap
is visible rather than silent. **The board's own `R107` badge is wrong** and cites the
completeness-panel deferral; cite **R110**.

Accepting R28's cost is not a layout argument: **a country mark was never a location, only a
computed pole of inaccessibility**, so listing is the more honest rendering. Ten of twenty-one teas
are listed, which is why the list is a first-class half of the screen rather than a footnote.

**Deviation from the board, deliberate.** The label side-switch flips when the label *wouldn't fit*,
not when the pin passes the outer 20% of the frame. The board's proxy under-fires for a long label at
70%. The fit test is only answerable for a monospaced face — the board's labels are a proportional
serif, which is very likely why it used a position proxy at all. Ours is `--font-mono`, so the test
holds; **if that face ever changes, the flip falls back to the board's rule.** In the comment, and
correctly so.

> *Code-lane note, 2026-08-06 (shipped in v4.08).* This ruling is **retroactive on a shipped
> surface**: H2 was built, verified and released against a board that had never been banked, so the
> number arrives after the code. That order is the finding, not an irregularity to smooth over — see
> the v4.08 block below, and the note above the frame-ruling summary.

## R4 rulings begin here (R113 onward) — same ledger, continuous numbering

**R113 — Clay lives in a surface's SPINE; a card never carries it.** Contract 2 is *one committing
action per screen, never selection*. A movable card cannot satisfy it: a card carrying clay either
brings a second clay onto a surface that already has one, or changes appearance on arrival — and
giving clay to "the surface that owns the card" **demotes a card exactly when the user promotes it**
(drag Wrapped to Home and it renders quieter than it did on Insights). So clay belongs to the fixed,
unmovable frame. Home's is the greeting's suggestion made committing — **Start steeping**, with
"Log a cup →" as its quiet sibling. **At most one per surface, not exactly one:** an evening Home
with nothing to suggest correctly carries none. The raised Log stays **jade** — it is chrome shared
by every tab, a different register from content.

> **AMENDED at the build, 2026-08-07, and the amendment removes a phantom.** This ruling was written
> as a *correction* — "Insights loses its clay, the Wrapped teaser becomes a quiet card" — and
> accepted a cost it named as deliberate. **That cost does not exist.** `.ins-teaser` is `#2A4130`,
> jade-deep, with an amber arrow; `var(--clay)` appears seven times in `styles.css` and **every one is
> decorative or textual** (the brand mark's gradient, the mood sub-line, the door's ensō, a passport
> mark, a chip figure, the Wrapped eyebrow). **No clay action has ever existed in this app.** So
> R113 is not a correction of a misuse — it is **clay's first implementation**, and Insights loses
> nothing. The owed-back question about the teaser going cold dissolves with it. See R116.
>
> **Amended again 2026-08-07, by Niklas: the Wrapped teaser stays exactly as it is.** It was never
> clay (`#2A4130` jade-deep with an amber arrow), so R113 takes nothing from it, and its warmth is
> the point on a surface that has none otherwise. **The "cost, accepted deliberately" in this
> ruling's original text was phantom throughout** — no clay was removed from Insights, because there
> was none to remove. Struck rather than left standing: a cost on the record that was never paid is
> the kind of line a later round budgets against.

**R114 — Content bleeds to the edges, on every tab, with no page-in-a-page.** The stack is already
made of cards, so a card stack inside a card is a page inside a page, and a masthead is the top of a
page rather than an element floating on one. Figure and ground resolve on the existing token pair:
`--porcelain` `#F6F2E9` is ground, `#FFFEFB` cards are figure, the masthead is ink on bare ground.
One rule for every tab, so nobody later "fixes" one surface to match another.

> *Code-lane note, 2026-08-07.* **The app-level half is already true and always was.**
> `html,body{background:var(--porcelain)}` and `#app{max-width:920px;margin:0 auto;padding:0 16px
> 92px}` — no background, no border, no container. The 920 px cap is a desktop reading width with no
> visual boundary; the board's rejected "page on a desk" is not what ships. **The masthead clause is
> the real work**, and it is exactly one rule: `.greeting-card` was `background:var(--jade-pale)`
> with a border and a 20 px radius, so the one place the masthead floated on a card was the masthead.

**R115 — Home's job is the present tense, and that makes the default set testable.** Home answers
**what now** — what is ready, what is running out, what you were mid-way through. Sessions and
Insights are past tense; Teas is object tense. **A card defaults to Home if removing it would leave
you unable to answer "what now" without navigating.** Running low passes; Favourites passes (it is
what you reach for); **Sessions this week fails** — it counts what already happened. **The rule
governs the DEFAULT SET only; a user's move always wins and is never second-guessed.**

The **greeting is not a card**: it is the masthead — fixed, unmovable, unhideable, the app's voice
and the one thing every Home has in common. Everything below it is one configuration of many.
**A card is absent until it has something to say** — day one is the greeting and one door, and cards
arrive as they earn a line. R2's dashed slots belong to edit mode on a *furnished* Home; an invitee
should not be asked to arrange a room before they have furniture. **The washi band is dropped** — its
probation clause was "if it fights the masthead, drop it", and making the greeting the masthead makes
washi a second masthead gesture on the first. R59 deferred this once; it is decided now.

**R116 — THREE OF THE FIVE VISUAL CONTRACTS SHIPPED UNIMPLEMENTED, and two lanes ruled on them
anyway.** Contract 2 (clay = one committing action), contract 4 (kachi-iro = the Focus ring and
nowhere else) and contract 5 (washi = the Home masthead) were locked, cited across boards and
rulings, and **never built**. Kachi was found at slice E and implemented in v4.01 (R94). Clay and
washi are found now: clay has never been an action colour, and `washi` has **zero occurrences**
outside `docs/r3/boards/`.

**The consequences compounded, which is the part worth keeping.** R59 deferred a *probation* on
something that was never built. R113 accepted a *cost* that did not exist. Both were reasoned from
boards describing a state the code never reached — by three lanes in turn, each checking the tier
above it rather than the code. **A locked contract is not implemented until something asserts it.**

> *The audit R116 ordered, run 2026-08-07. All five, stated whether or not they turned out fine.*
> **1 · Liquor swatch — NOT built, and honestly so.** The tile is a type tint keyed on `teas.type`.
> Its absence is **declared in code** (`steep-social.js:174`, `styles.css:1051`) and **asserted in
> two committed suites** (`pass-record-test.js` D6, `quick-log-test.js` C4). Deferred to R4 with the
> data model R82 found was never written. This is the shape the other four should have had: unbuilt
> is fine, unbuilt-and-believed-built is not.
> **2 · Clay — never built.** Seven decorative/textual uses, no action. Built in v4.10, spine-only.
> **3 · Xanthous (state only) — BUILT AND CONFINED.** `--xanthous-wash` is declared in both theme
> blocks and used at exactly two selectors, `.tea-mode.active` and `.tea-seg.active` — both selected
> state, neither identity nor action. The contract holds; it now gets a guard so it keeps holding.
> **4 · Kachi-iro — built v4.01, guarded** (`focus-test.js` §B, proven by leaking it onto `.pour-saved`).
> **5 · Washi — never built.** Probation closed on paper by R115; zero code.

**R122 — The looking is not automatable, and the harnesses that support it are repo files.** Four
defects this round were found by a human looking at a rendered surface and **none by a check**: the
map's labels running off the card, the door's ~500 px of slack, clay reaching one branch of two, and
a preview that showed the content region for an entire slice while looking complete.

**No review subagent.** The verifier works because it is a gate with a fixed checklist and a binary
output. A review agent would have to make design judgements, and the entire value of these harnesses
is that a *person* forms the judgement — automating the looking would rebuild the blind spot it
exists to cover. This is not a resourcing decision to revisit when agents get better; it is what the
four defects have in common.

**The harnesses are therefore tracked** (v4.15, with their `.gitignore` exceptions). Two reasons, and
the second was learned the hard way: they encode rules relearned four times over — *iframes because
`position:fixed`/`sticky` and `100dvh` need a real viewport · drive `render()` rather than
approximate the shell · assert the chrome is present and **throw** rather than write a page · count
the markup, not the file that inlines its own stylesheet · both themes, with per-state numbers the
tool prints itself* — and **a harness that is not in the repo cannot be reviewed**. The planning lane
had to take its output on trust, which is exactly how the narrowed preview survived a full slice.
`git checkout` cannot even restore one: an untracked file has no index entry.

> *Code-lane note, 2026-08-07.* Counted at the moment of tracking rather than from the report: there
> were **three** harnesses in `fixtures/`, not four. The Origins one had never been a repo file — it
> drew the map for the whole H2 slice from a session scratchpad, with an absolute path hardcoded in
> it, one `/clear` from gone. That near-miss is the argument.

**Queued for R4's close, in this order:** reconcile `slowcup-deploy` (step 8 stops at commit, step 9
is the UNPUSHED pause — the rhythm exists because the planning lane cannot review what it cannot
clone; and step 7's "three suites at minimum" becomes all suites from `git ls-files`) · update
`vm-fixture` with the full delta **and fold the review-harness contract into it as a section**, since
both are "sandbox the app, look at what comes out" and two documents would drift · run the audit with
**six** lenses · point `issue-triage` at the queue (**#28** is arguably closed by v4.10 and **#25** by
the masthead) · extract `fixtures/_sandbox.js`, which touches every suite and must not land mid-slice.

> **Added to that queue 2026-08-07 — the stale service worker, and it explains three unlooked-at
> deploys.** v4.09, v4.10 and v4.15 each reported "the Browser pane refused localhost". It did not.
> A service worker registered at **cache v114** was serving **v4.04** — a five-version-old app —
> from disk, so every local check was looking at a build nobody was shipping. **That is failure mode
> 9 in the verification step itself**: green against the wrong representation, and the reason R122's
> four looking-found defects had no fifth. It belongs in `slowcup-deploy`'s verification step as a
> precondition, not a tip: **unregister every service worker and delete every cache before the first
> look, then assert the rendered `APP_VERSION` equals the one just bumped** — an assertion, because
> "the page loaded" is exactly the check that passed for six weeks. The second cause was
> `.claude/launch.json` pointing at a dead session's scratchpad path; the config needs repointing
> per session, or the server needs a home that outlives one.

> **Also added to that queue 2026-08-07 — the RED GATE, and it is the first thing this round that is
> both mechanical and currently unenforced.** R132's amendment splits check failures into three
> families and shows two of them fall to one test: **invert the thing under test, require red.**
> `J3b` stayed green with the code inverted; `J1` stayed green with the branch disabled. Nothing in
> the ritual requires that test today — negative controls have been run by habit, well, and only
> because a build lane chose to. **Whether it becomes a `verifier` check or stays a build-time
> habit is a decision for the reconciliation, and should be made there rather than drifting in.**
> Two things to weigh when it is: the gate is cheap and catches (b) and (c) outright, but it
> **cannot** reach (a) — a proxy passes it convincingly (see R132) — so adopting it must not be
> recorded as closing the class. **Not acted on now.**

**R121b — the sixth lens: "asserted but never built."** Approved 2026-08-07. Lens 4 catches doc claims
that went **stale** — true once, false now. R81, R95 and R116 are claims that were **never true**:
nothing decayed, and three of them lived in **boards**, which lens 4 does not scope. The sixth lens
inverts the method: for each locked contract or ruling, demand the **artifact** that proves it exists
in code — a token, a selector, a function — and treat **absence of a pointer** as the finding.
Counter-rule already earned: **a locked contract is not implemented until something asserts it.**

**R123 — The greeting reads the DAY, not just the current window.** Ruled 2026-08-07 after Niklas
found it in use: on one Home screen *Earlier today* listed two sittings while the masthead told him
to go and have a tea. A new day-level branch — `todaySessions.length && !bucketSessions.length` —
gives a **past-tense acknowledgement plus the existing forward tail**. The shipped registers are not
stretched: the just-now pool ("in the pot already", "a lovely start") is not applied to a six-hour-old
sitting. **The copy carries no count** — `todaySessions.length` counts *sittings* and R119 makes a cup
a *steep*, so a numbered line would ship the COUNTED-UNIT item §4 has already filed. Countless copy
leaves that item intact and filed.

> **AMENDED at the build, 2026-08-07, and the amendment strikes a premise rather than a clause.**
> This ruling was issued with the instruction *"either `bigDay` renders in the new branch or it
> goes — a value that can only display inside the branch that excludes its own condition is dead
> code wearing a feature's name."* **The second half is false, and the "or it goes" it justified
> would have deleted working shipped copy.** The bucket branch does *not* exclude `bigDay`'s
> condition: `bigDay` needs ≥2 sittings today, the bucket branch needs ≥1 in the current window, and
> both hold at once — a two-sitting morning read at 10:00 renders *"Second pour today — a proper tea
> day."* on v4.15 and still does. What `bigDay` could never reach is **precisely the case R123
> creates**, which is also the likelier one to be read: a big day is usually seen *after* the
> brewing, not during it. **It renders in the new branch**, from its own pool's four countless lines;
> the bucket branch's seven are untouched, two of them carrying the ordinal that is R119's filed
> item. Struck rather than left standing, per R71: a false premise on the record is what a later
> round reasons from.

> *Code-lane note, 2026-08-07 (built in v4.16), and it corrects the diagnosis this ruling was issued
> against.* **None of the three proposed causes was the cause.** R117 shipped as code, not as a
> claim: both readers call `sessionsToday()` (`steep-dashboard.js:833`), there is no second `dayKey`
> and no timezone split. **The divergence was one layer up, in the branch predicate** — the v3.67 ack
> gates on `bucketSessions`, today's sittings narrowed to the current hour bucket, so a morning brew
> read at 14:00 skipped every acknowledgement and fell through to rediscovery, which speaks in the
> present tense and carries clay. The greeting already contained **both** readings: the zero-session
> evening branch gates on the day, this one gated on the window, and **that inconsistency inside one
> function is the whole defect** — neither branch was wrong alone.
>
> **`bigDay` is not dead code, and the clause ordering its removal rested on a false premise.** It
> renders today whenever a sitting sits in the current window — a two-sitting morning read at 10:00
> says *"Second pour today — a proper tea day."* What it could never reach is **exactly the case R123
> creates**, which is also the likelier one: a big day is usually read *after* the brewing. So it
> renders in the new branch, from its own pool's four countless lines. The bucket branch's seven are
> untouched — two carry the ordinal and those are R119's filed item.
>
> **Clay is suppressed by construction, not by a fourth rule**: the branch returns
> `card(ack + ' ' + tail)` with no `commitTea`, exactly as the bucket branch does. R120's letter
> reaches it. `home-test.js` **B8 did the job it was written for** — it reddened at "six return paths
> (got 7)" and the seventh is classified rather than defaulted: **7 paths, still exactly 2
> committing.**
>
> **A second, narrower v4.15 defect closed in passing:** a user who had brewed everything on their
> shelf today got `card('')` — a masthead with a greeting and **no line at all**, because
> `d_scorePick` excluded the whole shelf via `brewedToday`. Found while building a negative control.
>
> **`d_rediscoveryPick` now takes the calendar anchor `d_scorePick` already had.** On the wall clock
> the sentence moved under the user inside one day — "4 weeks" at 14:30, "5 weeks" at 19:30, same
> day, same tea, same pick — while the branch's own comment promised the choice was stable across the
> day. The choice was; **the number in the sentence was not**, and the number is part of the
> one-voice-per-day contract. Two consequences named rather than found later: the cutoff is now
> whole-day, and same-day ties resolve through the date-seeded hash already in the sort.

**R119 — A CUP IS A STEEP. Ruled by Niklas.** A steep is poured into a cup and drunk, so five steeps
is five cups. The planning lane argued a cup is a *sitting* and was wrong: that reasons about the
sitting, not the cup.

**The consequence is a unit collision.** 5a shows two sittings totalling eight steeps while the
greeting says *"Second pour today"* — under this ruling that is the **eighth** pour. A pour is one
steep poured, not one time you sat down. So the greeting's counted language is the defect: it means
*sitting* and should say so. **Not changed in this slice** — it is shipped greeting-engine copy under
R61, and it gets its own change with the whole copy set in view. **Filed in §4 as a COUNTED-UNIT
item, not a copy item**, with its five lines and single call site named: the fix is deciding which
count feeds each sentence, since relabelling alone would rename the same wrong number. Design's derived arc (40 → 42 → 42
across Friday, 4d at 2) is **sittings**, correctly labelled, and is untouched by this.

> *Code-lane audit, 2026-08-07, ordered with the ruling — and it corrects two of its premises.*
>
> **(a) "Your 140th cup." does not exist.** Not in any `.js`, not in the boards. The app has exactly
> **one** ordinal call site — `d_ordinal(todaySessions.length)`, `steep-dashboard.js:900` — and
> `d_ordinal` has no other caller anywhere. So the sentence cited as "literally correct" is a phantom,
> the same shape as R113's phantom cost and R116's phantom contracts. **The ruling stands as a
> decision; the line justifying it is not in the product.**
>
> **(b) Grepping "pour" UNDER-COUNTS the defect.** "pour" appears in **four** copy lines across
> **two** branches: the already-brewed ack (`…a lovely, unexpected pour.` · `A good pour already
> behind you.`) and the big-day ack (`${ord} pour today — a proper tea day.` · `A day of many pours…`).
> Only **one of the four attaches a number**. But the *same pool* also contains
> **`${ord} steep in — the leaves are well looked-after today.`**, which attaches the **same sitting
> ordinal to the word "steep"** — under R119 that is the more explicit contradiction, and a "pour"
> audit would have shipped it. **One ordinal, two mislabelled units, one call site to fix.**
>
> **(c) The board makes the same slip.** Rev 2's 5a caption reads *"Mid-afternoon, two cups in."* —
> two **sittings**, eight steeps. Under R119 that is "eight cups in". Recorded, not edited: banked
> boards are archival.

**R120 — Clay is suppressed beside a forward suggestion; the tail wins.** Board 5a draws clay on the
already-brewed-today state. The shipped greeting appends a forward suggestion to the acknowledgement
("…a proper tea day. Maybe the Dawang Feng this afternoon?"), and R113's redirect rule forbids clay
beside a later-window suggestion. **Keep what shipped:** a Start-steeping button under that caption
argues with it — the caption says *later*, the button says *now*. **Dropping the tail to justify a
button would lose information to gain an affordance**: the tail names which tea and when, the button
only says that brewing exists. The board is not wrong — it drew a greeting without a tail, and its
clay is consistent there. The difference is recorded rather than reconciled.

**R121 — Only ONE liquor-swatch geometry is locked.** Bundle 1 defines exactly one: **24×32, radius
`9px 4px 8px 5px`**. The session state's "3 sizes" is not in that file, and the other two were either
never drawn or live somewhere nobody has found. Design's derived **15×20 at `6px 3px 5px 3px`** —
same 3:4 aspect, same asymmetric radius, scaled — is the right derivation and is marked **derived,
not locked**. This is R116's "described but never built" pattern found in the **design record**
rather than the code, and the counter is identical: **a lock is not a lock until something points at
the artifact that holds it.**

**R117 — "Earlier today" is its OWN card, not `recent` rescoped.** Two cards over one table,
justified by different query, different job, different name: `recent` is the last four sittings, any
date, a **log**, on Insights; **Earlier today** is this calendar day, a **diary page**, on Home.
Rescoping one card to mean different things on different surfaces is exactly the fault R113 rejected
when it refused "the surface that owns the card" — a card must render the same everywhere.

**Its day boundary must be the greeting's**, or the masthead says "second pour today" over a card
showing one row. Use the greeting's own boundary; do not re-derive one. **No stars** — R2's Library
rule already moved ratings to detail, and `time · tea · steeps · ★★★★½` is a scorecard where a diary
line was asked for. **It leads the stack, above Running low**: today outranks supply, so the first
card changes through the day. **Absence is correct, not flicker** — a diary page is blank until
written on; the card arrives at the first cup and stays until midnight, the same mechanism as Running
low. **Stated cost: at midnight a full tea day vanishes from Home.** Correct for a present-tense
surface, and Sessions takes over.

> *Code-lane note, 2026-08-07 (built in v4.10).* The boundary is a shared `sessionsToday()` that the
> masthead reads too, so the two cannot disagree by drifting apart — one writer, not two correct
> calls to `dayKey`. **Its guard was vacuous on the first write**: the check tested for
> `sessionsToday(now)`, which is a substring of the function's own declaration
> `function sessionsToday(now){`, so it matched itself and passed while the masthead re-derived its
> boundary. Found by a negative control that refused to bite. **Anchor on the call site, never the
> definition** — the same family as a check reading its own prose, one layer up.

**R118 — a glance row opens session DETAIL, not the edit screen.** `openSessionEdit` assumes you
came to change something; tapping a diary line to look at it and landing in a form is a wrong-verb
error. Since **R58** gave editing its own screen, detail is the container that offers it. **Not
scoped to the new card:** `recent`'s rows carry the same wrong destination on Insights today, so it
is one fix in both places.

**R111 — `landing.html` is a SUPERSEDED SURFACE with a live public URL.** It ships at the repo root:
a self-contained WS4 marketing page with its own tokens, referenced by nothing in `index.html` or
`service-worker.js`, deliberately outside the precache, and reachable at `slowcup.app/landing.html`.
**R29 closed the root split and made the logged-out screen the landing**, which orphaned this file
without removing it. Not a tidiness item: a public URL serving a superseded surface can contradict
the door that replaced it, and nobody would notice, because nothing links to it.

**Not touched in H3, under R61** — a shipped artifact is not removed without a ruling naming it.
It goes to §4's deferred register **flagged for the beta-hardening bundle**, not general deferral: it
needs a decision before anything is public. Three options to rule then — delete it, redirect it to
the door, or keep it deliberately as a marketing page and link it.

**R112 — the door's fixture asserts SOURCE, and says so in its header.** `renderLogin` is
closure-private inside an IIFE requiring the Supabase global, so no sandbox can call it — the door is
the one surface that runs *before* boot, with no `state` and no `render()`.
`fixtures/landing-test.js` therefore proves the door's **source** contains the canonical copy, no
"Apple", no redeem control, no kachi token in its CSS block, and the ensō reached by `href="#enso"`
rather than a second copy of the path. **It cannot prove the door renders.** The three hand-off empty
states are ordinary views, reachable, and are rendered against an empty account — that half is
behavioural, and the suite labels which half is which. Same family as R104's stated limitation and
`origins-test.js` §F's: an instrument that does not name its blind spot is read as covering it.

> *Code-lane note, 2026-08-06 (built in v4.09).* B1 failed on its first run against **this suite's own
> comment** saying "there is no Apple" — a negative check that reads prose is testing the prose. The
> door's source is now comment-stripped before any absence check. Four negative controls bite, each
> on the intended check: re-adding Apple reddens B1 alone, paraphrasing the tagline reddens A1,
> pointing `.door-enso` at `--kachi` reddens B6, and copying the ensō path instead of referencing the
> symbol reddens C1 **and** C3.
>
> *Amended the same day, and the amendment is the lesson.* The fix above was applied to the door's
> **source** and not to its **CSS**, so it happened again one section later: §E's `margin-top:auto`
> check failed against the CSS comment *explaining what an auto top margin does*. **Fifth instance
> this round**, after the typo-against-itself, the fallback-is-a-pass, the no-op negative control and
> B1 — and the first with real cost: the red short-circuited a `&&` chain, the backup step never ran,
> and the restore branch copied a **stale `/tmp` file from an earlier session over `styles.css`**.
> Recovered from `git`, which is the only authoritative copy. Two rules out of it: **strip comments
> before every absence check, in every language a suite reads**, and **run negative controls through
> `git checkout`, never through shell backups** — a scripted restore whose source is a path that
> might already exist is not a restore.

**R124 — Tier 3 is decided by a predicate, not by a site.** `swatchAttr` gains one argument answering
one question: **is a type label rendered in this row?** Where the answer is yes, tier 3 renders the
unfilled plate; where no, it keeps the type tint. This does not break the single writer. `swatchAttr`
already takes a per-site first argument (`base`) and has never been parameterless — "one writer"
means one function owns the write path, not that the function is constant. There is no site
whitelist to maintain and no exemption list, because the rule is evaluated per call from a fact about
the row.

The reasoning is Design's and survives restatement: a tint at tier 3 is honest — it asserts a family,
and the app knows the family. What it cannot be, beside a pill that already reads "Oolong", is
non-redundant. **The objection is redundancy in the identity slot, not dishonesty.**

**R125 — The predicate reaches three of four call sites; only the shelf ships in ~~v4.17~~ ~~v4.18~~ v4.20.** *(shelf renumbered again by R141; the point is unchanged — it is one version, whatever its number)*

> **AMENDED by the planning lane, 2026-08-07, struck per R71 rather than rewritten — and the error is
> a sequencing ruling that broke sequencing.** The original text said the shelf ships in **v4.17**.
> **v4.17 is slice 3, the picker** — the Q5 sequencing this lane itself ruled — so as written this
> ruling put two R4 items in one version, against the rule it has spent the round enforcing.
> **The shelf lands on its own version, ~~v4.18~~ v4.20 (renumbered by R141), after slice 3 and
> after Design's dark redraw.** Ref and social stay filed behind it. **The predicate reaching three
> sites is unaffected — only the version was wrong** (and wrong twice: R141 records the recurrence).

Verified
against `c799aa3`: `refMetaLine` is `[t.family, t.roast, …]` and renders "oolong · medium · 4 entries"
directly under `.ref-swatch`; the social row's meta is `[fmtDate, typeLabel(s.teaType), …]` and
renders "5 Aug · Oolong · gongfu" beside `.social-tile`. Both are adjacent type labels and both are
therefore redundant under R124. `.today-tint`'s row is time · swatch · name · steep count and carries
**no type label** — it keeps the tint permanently, by the rule rather than by exemption.

`.ref-swatch` and `.social-tile` are filed with R124 attached and land on their own version once
someone has looked at them rendered. **A rule discovered mid-slice does not reshape two live surfaces
in the same deploy.** One tension recorded for that work: `.social-tile` already renders script inside
the swatch span, so suppressing its tint turns it into a plate holding a glyph — the shape R129
removes from the shelf. That is a question, not a decision.

**R126 — The tier distinction is carried by border STYLE, not by fill.** Measured swatches take a
**solid** hairline; plates take a **dashed** one. Dashed reads as incomplete without a legend and
survives a fill nobody can see.

Why it is structural rather than a retune: `liquor-test.js` A3b sets `GROUND_MIN` at 18 and `ivory`
sits at **19.2** from `--white` in light, in the suite's own lum units — a margin of **1.2**. A3b's
own comment says it is a collapse detector that "does not prove any pair is comfortable" and that
`ivory` was "flagged rather than certified" because nobody had looked at it rendered. Design looked,
and a filled Ya Bao against an empty plate was one object. **A distinction resting on 1.2 was resting
on nothing.** Border style removes fill from the load path entirely. Watch it hardest in dark, where
fill separation was already tightest.

Correction attached, because the finding arrived with a wrong number: Design measured against
`#F5F0E3`, which is **not** the ground. The card is `.shelf-card{background:var(--white)}` =
`#FFFEFB`. The finding stands; the measurement was replaced from source.

**R127 — Board grounds are repo tokens. `#F5F0E3` is retired.** It appears on **21 of 23** `.dc.html`
boards and **zero** times in `styles.css`, `index.html`, or any `steep-*.js`. It sits roughly **14
units below** `#FFFEFB`, so every by-eye light-mode contrast judgement made on any R3 board was made
against a ground **darker than ships** — systematically flattering the pale end, which is where the
ramp's tightest stops live. Carrying it is a review finding on any board from here. **This is not a
retouch order: superseded boards stay as record.**

**R128 — Look at renders to FIND things; read `styles.css` to MEASURE them.** Design's own
formulation, adopted verbatim. It is the working division under R122: the looking is not automatable
and finds what checks decline to certify, but **a value that enters a ruling comes from the file,
never from a render.**

Its second half, filed by Design as **F17** and binding on every lane: **don't add a value you
haven't read; don't delete one you haven't checked.** Deletion is an assertion about the source in
the opposite direction, and **it wears caution as a disguise**, which is why it survives review where
an addition would not. The instance: 芽苞 and 白茶 were withdrawn as invented and both are in the
catalog's `aka`.

**R129 — No per-tea script on the shelf row.** New this turn; **minted by the planning lane, not by
Code**, and flagged as such. The reference room and the social tile keep theirs. The shelf row drops
it.

`refScript` returns whichever CJK name sits **first in a row's `aka` array**. Gui Fei carries both
蜜香烏龍 and 貴妃烏龍; what renders is array position, not a fact. Across the 13 scripted rows only 6
are character-set-distinguishable and those 6 split **3 traditional** (蜜香烏龍 · 東方美人 · 軟枝) ·
**3 simplified** (大红袍 · 黄芽 · 鸭屎香), with **7 neutral** — so the mixing is not a gap better data
would close. The shelf shows 21 teas being **scanned**; the reference room and the social tile show
one tea being **looked at**, where a name in its own script is the subject. **Reversible on Niklas's
word** — he reads the script and it is his shelf.

> *Code-lane verification note, 2026-08-07. Every checkable claim in R124–R129 was run against
> `c799aa3` before this commit, because a wrong number entering the binding reference is what R126's
> own attached correction is about. All verified; two readings pinned so a later session doesn't
> re-derive them wrongly.*
>
> **R125 — exact.** `refMetaLine` (`steep-reference.js:53`) is
> `[t.family, t.roast, members||leaf_shape]`, rendered at `:123` as `.ref-meta` under `.ref-swatch`.
> The social meta (`steep-social.js:211`) is
> `[fmtDate(s.date), typeLabel(s.teaType), sessionMethodLabel(s), vessel]`. `.today-tint`'s row
> (`steep-dashboard.js:1137`) is `today-time · swatch · today-name · today-steeps` — no type label.
> **R127 — exact.** 23 `.dc.html` boards are tracked and **21** contain `#F5F0E3`; it appears **zero**
> times across `styles.css`, `index.html` and every `steep-*.js`. `.shelf-card` (`styles.css:286`) is
> `background:var(--white)`, and `--white` is `#FFFEFB` (`:19`). In the suite's lum units `#F5F0E3`
> measures **13.9 below** `#FFFEFB` — the ruling's "roughly 14".
> **R126 — exact.** `GROUND_MIN` is 18; `ivory` `#F2EBD4` measures **19.17** from `#FFFEFB`, a margin
> of **1.17**.
> **R128 — exact.** `芽苞` is `ya-bao-yunnan.aka[0]`; `白茶` is `fujian-white.aka[1]`. Both shipped.
> **R129 — exact, on the reading that "13 scripted rows" means the covered SHELF rows.** Pinned
> because the catalog reading gives a different number and someone will grep it: **all 55 catalog
> rows carry a CJK `aka`**, so `refScript` returns a script for every row. Scoped to Niklas's shelf,
> **13 of 21 teas** resolve through `matchTeaType` to a scripted row, and those 13 are exactly the
> ruling's set — the three traditional and three simplified examples are all among them, and the
> remaining **7** rows are neutral (`煎茶` twice, `白茶`, `新茶`, `冠茶`, `阿里山高山茶`, `芽苞`).
> Gui Fei's two candidates confirmed: `refScript` (`steep-reference.js:18`) returns the first `aka`
> entry matching its CJK/kana range, so `蜜香烏龍` wins on position alone.

**R130 — The version sequencing of R4's remaining work is a RULING.** Minted by the planning lane,
not by Code, and said so. **v4.16** the greeting (shipped) · ~~**v4.17** slice 3, the picker (R39) ·
**v4.18** the shelf~~ · **ref and social are filed behind ~~v4.18~~ v4.20, unversioned** until
someone has looked at them rendered. **One coherent change per version, per `CLAUDE.md:129`.**

> **AMENDED by R141, 2026-08-17 — and it is R125's exact shape a SECOND time, not a fresh error.**
> R130 numbered slice 3 as v4.17 and the shelf as v4.18. But R137 then ruled #34/#35 and #30/#33
> *ahead of* slice 3, and neither had a number — so the ladder was again a sequencing ruling
> numbered ahead of its own work, the precise fault R125 already recorded. **The amended ladder:**
> **v4.17** #34/#35 (draft persistence + back-gesture) · **v4.18** #30/#33 (wake-lock bundle) ·
> **v4.19** slice 3, the picker (R39) · **v4.20** the shelf (R124's predicate at the shelf call
> site, R126's hairlines, R129's script removal). `.ref-swatch`/`.social-tile` filed behind v4.20.
> **The recurrence is filed as §8 item 19.**
>
> **The structural fix is named and NOT adopted here, because adopting it is Niklas's call.** Both
> instances share one cause: a version is assigned *when the ruling is written* rather than *when the
> work is built*, so any later reordering strands the numbers. **Version-at-build-time** — assign
> `vX.YY` only at `/slowcup-deploy` step 1, and let rulings reference work by name — would close the
> class. It touches R130's whole method, so it waits for a decision rather than being taken in passing.

Recorded with it, as the Code lane's counter: **a decision that constrains later rulings gets a
ledger number when it is made.** Q5's sequencing went unnumbered for four turns and a later ruling
walked straight through it.

Recorded with it, as the Code lane's counter: **a decision that constrains later rulings gets a
ledger number when it is made.** Q5's sequencing went unnumbered for four turns and a later ruling
walked straight through it.

**R131 — The authority order settles which document is AUTHORITATIVE, not which one is RIGHT.** It is
silent in two cases, and **both produced R125**: when the higher tier never recorded the decision at
all, and when the rule lives outside the order entirely.

**`CLAUDE.md` joins the order, above the ledger.** It holds **standing rules that rulings must
satisfy**, not rulings themselves — which is why a ruling could contradict one and no ordering check
could fire. The amended order:

> live repo → the current export, stamped → **`CLAUDE.md` standing rules** → rulings ledger →
> `R3-STATUS` → boards → nobody's memory

**The limit stated plainly, because it is the part that would have caused damage:** when a lower tier
disagrees with a higher one, **correcting downward is right only if the higher tier's claim was
checked.** Where the higher tier is **silent**, the lower tier is the **record**, not the error.
Applied naively here, mode 8's counter would have rewritten `STATE.md` and the roadmap to match a
wrong ledger line.

> *Code-lane note, 2026-08-07 — the amendment was under-specified in the same shape as the "§8"
> citation, and both were caught the same way.* R131 says "amend `STATE:138`". **The authority order
> is stated in ~~three places~~ FOUR, not one**: `STATE.md:138`, `docs/r3/R3-STATUS.md:18` (marked
> "binding"), `docs/r3/R3-IMPLEMENTATION-HANDOFF.md:36` (also "binding", and the only copy that names
> each document by path), and **`docs/r3/R3-BUILD-PLAN.md:14`**, which heads its paragraph
> "Authority **position**" and ends its chain "→ this" rather than "nobody's memory". Amending one
> would have left three copies of the superseded order, two in documents that call themselves
> binding — mode 2 with a three-day fuse instead of an instant one. **All four are amended
> identically**, and with this ruling's own statement that is **five** occurrences of `live repo →`.
>
> **The counter is amended, and the amendment is the better entry.** It first read *"grep the rule's
> own text across `docs/`"* — which **caught three and lost one**, because the grep went after what
> the rule is *called*. Every label varies: "Authority order (binding)", "Authority order, binding",
> "Authority position". So does the tail: three chains end "nobody's memory", the fourth ends "this",
> and `nobody's memory` was the string actually grepped. **Only `live repo →` is invariant.**
> **Corrected counter: grep the CONTENT, not the label** — the invariant substring of the thing
> itself, never the heading that introduces it or the tail that closes it. **This is mode 9 nested
> inside the fix for mode 5, in the same commit**: a sweep checked against the wrong representation
> of the very rule it was sweeping for. Same family as the `\n`-versus-CRLF hash mismatch and the
> `grep -o` over a page that inlines its own stylesheet.
>
> **The verification instruction broke itself, twice, and that is the finding — not the count.** It
> was issued as "grep `live repo →` and confirm five hits". After this commit that string returns
> **nine**: five statements plus four prose mentions written by the entries recording the rule.
> Re-keyed to the longer `live repo → the current export`, it returned **seven** — because these
> entries then quoted *that*. **Documenting an invariant destroys its uniqueness, and each attempt to
> fix the count by lengthening the string is invalidated by writing the fix down.**
>
> **So the check is not a count.** The property is: **every statement of the authority chain places
> `CLAUDE.md` between the export tier and the ledger tier.** Verified that way — five statements,
> five satisfying it, in `STATE.md`, `R3-STATUS.md`, `R3-IMPLEMENTATION-HANDOFF.md`,
> `R3-BUILD-PLAN.md` and this ledger — and a sixth statement added later either satisfies it or does
> not, with no number to keep current. This is the session's own spine arriving at its documentation:
> **assert the property, not the proxy.** A3 was a proxy for legibility; "resolve from the same
> function" was a proxy for agreement; a hit count is a proxy for consistency, and all three pass
> while the thing they stand for fails.
>
> The three citations this ruling rests on were each verified against `1498829`
> first: `CLAUDE.md:129` is "one coherent change per version" exactly; `CLAUDE.md:127` is where
> "misinforms but a stale backlog item **commands**" falls (the sentence begins on 126);
> `STATE.md:138` is the authority-order line.

**R132 — A check that COUNTS is a proxy. State the property.** Minted by the planning lane. Seven
instances this round: **A3** as a proxy for legibility · **"resolve from the same function"** as a
proxy for agreement · **a hit count** as a proxy for consistency · **J4's "names any tea"** · **J1
green with the branch disabled** · **K3 on the reverted anchor** · **J3b as `|| true`**.

The generative claim, which is the part worth having: **these are not produced by carelessness but by
reaching for rigour.** A proxy is the checkable thing adjacent to the uncheckable one, so it is what
the hand closes on when the hand is trying hardest. That is why every instance was authored by
someone who had just learned the lesson.

> **AMENDED at the build, 2026-08-07 — the split is the Code lane's and belongs IN the ruling, not
> beneath it.** Left as a note, this ruling reads "state the property" as a universal remedy, and the
> third family below proves it is not: **J1 and K3 asserted exactly the right property and were
> repaired by changing the FIXTURE, never the assertion.**
>
> **Three families, and the split does not fall where the repair does.**
>
> | family | diagnostic | repair site |
> |---|---|---|
> | **vacuous** — cannot fail at all | never seen red | the **assertion** |
> | **unexercised** — right property, fixture never reaches the failing condition | never seen red | the **fixture** |
> | **proxy** — measures a correlate | **goes red correctly and is still wrong** | the **assertion** |
>
> **Vacuous and unexercised share one gate: invert the thing under test, require red.** `J3b` stayed
> green with the code inverted; **J1** stayed green with the branch disabled — the same observation
> twice. Only the repair differs afterwards: `J3b` needed deleting (`|| true`), **J1** needed a third
> tea and **K3** a brew instant 49 days back at midday, both fixture work against a correct assertion.
>
> **A proxy survives that gate.** Break what A3 *measures* and A3 reddens obediently; it is still the
> wrong measurement. Disable the shared writer and "resolve from the same function" reddens
> correctly, while a greeting and a card that both call it can still disagree. **The negative control
> is the instrument a proxy defeats, because a proxy is a real check of a real thing.**
>
> *Code lane's addition, and it explains recurrence better than "no gate holds it":* a proxy does not
> merely survive the red gate — **it passes convincingly, so it accumulates confidence rather than
> suspicion.** The gate requires the tester to choose what to invert, and a proxy makes that choice
> look obvious: at v4.12 anyone negative-controlling A3 would have un-lifted a dark stop, the thing
> A3 names, and seen red. The inversion that would have exposed it — moving two stops *together*
> while keeping both lifted — is only visible to someone who already knows the property. **The gate
> certifies the proxy.**
>
> **So R132 lands on the division the round already has.** The red gate is **mechanical** and belongs
> to the verifier; the proxy question is **judgement** and belongs to the looking, per R122. That is
> why (a) recurred seven times while (b) and (c) are closable — **no gate can hold (a)**, which is the
> same reason R122 refused a review subagent.
>
> Both halves of the generative claim stand: **proxy and vacuous come from reaching for rigour;
> unexercised comes from stopping at green — the same reach, one step short.**

**FENCE, and it is why R132 is not itself a check.** The property this ruling arrives at — *every
statement of the authority chain places `CLAUDE.md` between the export tier and the ledger tier* —
**cannot become a suite assertion.** Satisfying it requires separating statements from prose
mentions, and `grep` cannot see that difference; enumerating the set mechanically **reinstates the
count**. It is a **review property under R122**, verified by the looking. Recorded so a future
session reads the prohibition rather than rediscovering it by writing the fixture.

> *Code-lane note, 2026-08-07 — the baseline, confirmed.* At `1498829` the string `live repo →`
> returned **four**, one each in `STATE.md`, `R3-STATUS.md`, `R3-IMPLEMENTATION-HANDOFF.md` and
> `R3-BUILD-PLAN.md`, zero in this ledger, and **no prose mentions anywhere**. "Confirm five hits"
> correctly anticipated R131's own statement as the fifth. **It was true when written and false when
> obeyed** — mode 2 with a one-action fuse. The family membership of the seven instances is in the
> amendment above, where it binds.
>
> Where each of the seven falls, for the record: **proxy** — A3, "resolve from the same function",
> the hit count. **Vacuous** — `J3b` as `|| true`, and v4.10's `sessionsToday(now)` guard matching
> its own declaration. **Unexercised** — `J1` (a morning-only drinker already got no clay, so the
> scenario never reached the branch), `K3` (that brew date did not straddle a week boundary), `J4`
> (both branches satisfied "names any tea", so the probe did not discriminate).

**R133 — The Insights Wrapped teaser is warmth by GROUND, not by SLAB.** Design's ruling 5b,
ratified. The teaser becomes the warmest card on Insights via a **flat honeyed paper with a warm
border**, a **link-arrow rather than a slab button**, and the season mark **夏** for an identity no
stat card carries.

The reasoning is the shelf's argument reused correctly: **clay is not a hue under quarantine, it is
a treatment** — fill *plus* the pressed-slab inset shadow. So warmth is available to a card that must
not read as committing. **Insights holds no committing action at all**, and reflection is not a thing
one commits to; the teaser must read as **a door, not a button**. 5a (the clay slab, #08 as drawn) is
the alternative that made Ruling 6 necessary. 5c (typographic, one warm rule) was rejected as too
quiet — it reads as another divider, and **Wrapped's whole job is to not**.

> *Recovered, not minted — Code-lane note, 2026-08-07.* This ruling was issued two turns before it
> reached the file; the triage and audit work overtook the prompt carrying it. The Code lane flagged
> the resulting **R132 → R134 gap** because `STATE.md:145` asserts this ledger is "contiguous and
> verified unbroken from a fresh clone", left the number **unclaimed rather than minting it**
> (R129's precedent), and the planning lane then supplied the missing text. **Contiguity restored:
> R132 → R133 → R134.** Worth keeping as the case where a checked property caught a *lost* ruling
> rather than a wrong one — the same check would have read a genuine skip identically, which is why
> the number was not filled in locally.

> **Attached as RECORDED, not as rulings — both verified at HEAD before filing.**
>
> **F23's stated defect is not in shipped code.** The brewing-clock paints
> `isPeak ? 'var(--amber)' : 'var(--jade)'` — **`steep-dashboard.js:221–223`**, not
> `steep-insights.js`, because the shared card registry builds both surfaces from `dashCards()`; grep
> the dashboard file, not the room the card renders in. **Clay never touches an Insights chart and
> there is none to remove.** One `clay` token does live in `steep-insights.js`, at `:441` —
> `.wrap-eyebrow-clay`, a Wrapped eyebrow, which is one of the seven decorative uses R116's audit
> already enumerated, not a chart. **The live question is whether `--amber` as chart ink borrows the
> state colour, and that is Design's.**
>
> **F24 has one writer.** `steep-insights.js:202` renders `Your ${w.season.name}, wrapped`, and
> `w.season.name` is `WRAP_MONTHS_EN[d.getMonth()]` (`:238`, set in `monthOf` at `:240`) — a **month**,
> under R103's last-complete-month window. Both surfaces render the same card. The disagreement is
> **a variable named `season` holding a month**: naming residue, to clear when Wrapped is next
> touched. Same disposition as `streakCardHTML` (audit A6) — renamed when the file is open, never on
> its own.

**R134 — Achievements are DELETED, not dormant.** `ACHIEVEMENTS_ENABLED = false`
(`steep-core.js:120`) has held the scrapped v3.72 system in place while `DEFAULT_SETTINGS` still
carries `showAchievements` and `quietMode` (`:121`) and `syncAchievements` still fires from ~~four
places on every session commit~~ **seven call sites across four modules — only one of which is a
session commit** (corrected 2026-08-07; see the code-lane note below and §8 item 18). **Report the removal cost before doing it** — whether the two settings keys drop
cleanly or whether stored `user_settings` rows make it a migration. **#8 is then: delete the
achievements state · add the Accent row · decide section order. Not an overhaul.**

> *Code-lane note — the figure corrected, and then the correction's own account corrected.*
> **Seven call sites, four modules, one session commit:** `steep-core.js:202` and `:237`
> (boot/refresh), `steep-sessions.js:216`, `:328`, `:1627` (**only `:1627` is `commitSession`**),
> `steep-settings.js:158` (Settings), `steep-teas.js:708` (**the tea form**). Declaration at
> `steep-dashboard.js:310`. **So the dormant system reaches two modules with nothing to do with
> sessions at all**, and the removal cost is ~2× the ruling's estimate — which is why R134 asks for
> the cost before the deletion. The estimate stands corrected; the ruling stands.
>
> **Four was not a miscount — it was a different question.** `syncAchievements(true)` returns exactly
> four (`sessions:216`, `:328`, `:1627`, `teas:708`): the celebratory variant. The wrong pattern did
> not fail, it answered something adjacent and plausibly. **The account of how that happened was
> itself invented afterwards and is filed as §8 item 18** — the register's first entry about
> reasoning turned inward rather than about the world.

**R135 — Matcha is a tea, not a method; it gets a steepless path.** The data already knows
(`steep-tea-types.js:44`; `steep-knowledge.js:32` carries `first: 0` and `note: 'whisked, not
steeped'` — both verified at HEAD); the session flow does not. **Matcha latte is explicitly OUT of
this ruling** and goes back to Niklas as a product question — it is a recipe, not a preparation of
leaf.

**R136 — #32 splits into two.** **Vacation mode** narrows to suppressing "running low" on Home;
**freshness keeps running, because tea ages regardless.** **Guest tea** — logging a cup you don't
own, at a tea house or someone's table — is a schema question on `tea_id` and its own issue. Open
them separately; **the second one is the substantial one.**

**R137 — #34 and #35 are ONE SLICE, and it goes ahead of slice 3.** There is no `pushState`,
`popstate` or `history.` anywhere in the app — verified at HEAD, the only two `history.` matches are
prose comments ending in the word — so the back gesture exits because nothing ever pushed a state.
And `state.sessionDraft` is memory-only. **Together: swipe back mid-session, the app exits, the
sitting is gone.** Neither is gated on v4.17 or v4.18, and **it is the only thing in the queue that
loses work permanently.**

**Sequencing, ruled 2026-08-07: #34/#35 first, then #30/#33, both ahead of slice 3.** The audit's A1
is right that the wake-lock bundle is cleaner and readier; it still goes second, because #34/#35
loses work permanently and R7's absence loses nobody anything — the screen dims. **Cleanliness orders
equals; consequence orders these.**

**R138 — A ruling can assert a state the repo does not have, and the REPO WINS.** Issued from the
R121b audit's finding A1. R7 is fully specified, ratified, and `wakeLock` has zero occurrences in any
`.js`. The #07 Settings board then drew it as a live toggle beside rows marked `shipped ✓` — **the
board was not inventing, it was reading the ledger.**

**A ruling claiming a shipped state is worse than a board drawing one, because boards are checked
against code and rulings are not.** R116 found three visual contracts believed-built; this is the
same failure one tier up, in the document that outranks the boards. R7 is amended in place above.

> **SEVENTH LENS, recorded as a CANDIDATE and deliberately not run yet:** sweep every ruling that
> asserts a shipped capability and demand its artifact — the inverse of R121b's lens 6, which demands
> an artifact for a *contract*. R7 is unlikely to be alone. Not run now; queued so it is scoped
> rather than improvised mid-audit.

> **R139–R142 BACKFILLED 2026-08-27 (Code lane, on the planning lane's dictation), restoring
> R138 → R139 → R140 → R141 → R142 → R143.** They were referenced across `STATE.md`, `CHANGELOG.md` and
> `smoke.md` for three deploys but never transcribed here — the contiguity failure is filed as **§8 item
> 23**. Their provenance is **stronger than R133's**: unlike R133 (minted then left uncommitted,
> describing a plan that never ran), each of these describes a deploy that is **live and on-device-
> confirmed**, so its text is reconstructed from the shipping code and the deploy records, not from an
> unrun plan.

**R139 — The session draft persists locally; the inline photo does not, and the app says so once.**
Applied to `state.sessionDraft`: persisted to `localStorage` on `pagehide`/`visibilitychange:hidden`,
dirty drafts only, restored silently on boot. The `data:` image is stripped before persist — CLAUDE.md
already rules inline `data:` images never reach storage (quota: a multi-MB URL beside the offline queue
risks `QuotaExceededError`, breaking the queue — a worse failure than the one fixed). Not a new product
call; the offline-queue decision applied to a second queue. The restore line states the fact and asks
nothing, attached to the restored sitting, once — dropped to the empty slot if it reads as an
instruction. `timer.intervalId` is dropped on save and re-derived from elapsed + running. **Verified
shipped: v4.17, on device.**

**R140 — Restore is silent.** A recovered draft reappears without a prompt. A launch-time question would
be a nudge, and it would fire on the launch after a lost sitting — when the app should be least demanding.
This is the only option consistent with zero-feedback sessions being complete outcomes: an unfinished
sitting is not an error state the user owes an answer to. The existing `sessionDraftDirty` guard governs
abandonment unchanged. **Verified shipped: v4.17.**

**R141 — R130's version assignments shift up by the two slices sequenced ahead of the picker.** v4.17
#34/#35 · v4.18 #30/#33 · v4.19 slice 3 picker · v4.20 shelf. `.ref-swatch`/`.social-tile` filed behind
v4.20. This is R125's shape a second time — a sequencing ruling numbered before its work was done, stale
by the time the work arrived — and is filed as such in §8, with the structural note (version-at-build-
time, not version-at-ruling-time) recorded but not adopted. The ladder was amended in all four places it
was stated (R130, R125's heading and amendment, STATE, ROADMAP) per the authority-order lesson.
**Verified shipped: the ladder held clean through v4.17, v4.18, v4.19.**

**R142 — Timer lifecycle resolves as pause-on-hide (B), not wall-clock catch-up (A).** On
`visibilitychange:hidden` while running, the existing pause path fires (`clearInterval`, `running=false`);
the timer freezes at its last observed value and the user resumes with a tap. Two reasons: it matches
R139's restore-paused so draft and timer behave identically, and — the load-bearing one — A shows a
measured number for something it never measured. "Catch up to real elapsed" asserts the steep progressed
while backgrounded, but the steep is leaf in water and the app can't see the pot; a resumed-accurate clock
claims progress it didn't observe. B freezes at the honest value. Named condition, built as its own guard
(`steep-sessions.js`, `timerRunning()`): the wake lock re-acquires on return only when the timer is
running — a paused timer re-acquires on resume, never holds the screen awake over a frozen clock.
**Verified shipped: v4.18, on device.**

**R143 — the COLOUR row above the fold is confirmed by eye; the WS1 tension is CLOSED.** The picker's
COLOUR row sits above the Specifics fold on **both Add and Edit** (SPEC §4.1, deviation 1). §4.1 could
only approve that placement *conditionally* — the open question was whether an optional colour affordance
above the fold crowds WS1's *"name and type are all you need"* on a blank Add form. **Niklas looked at
the rendered Add form and ruled it reads calm:** the row is optional and quiet, so the minimal-form
principle holds. **No Add/Edit split; the fallback path is closed, and v4.20+ do not reopen it.** No code
change — the build already ships it above the fold.

This is **R122's look-to-find settling what a spec could only approve conditionally**, and the *positive*
counterpart to the four defects the same looking caught this round (the empty greeting v4.15, the
oversized map marks v4.08, the door's slack margin v4.09, the layout stretch). Here the looking
**confirmed** rather than caught — both directions are the same instrument, and a record that only books
what looking *catches* would miss that it also *ratifies*. §8 items 20/21 book the process-side of the
same point.

> **R144–R145 BACKFILLED 2026-08-27 (Code lane, on the planning lane's dictation) — same shape as
> R139–R142: ruled in the retiring planning chat, referenced, never committed (§8 item 23's
> neighbourhood).** Design's board is banked with them at **`docs/r4/boards/shelf-swatch-ruling.dc.html`**
> (turn 5/6, the visual authority for R144/R145 and findings F20/F21/F29/F30), so these rulings do not
> rest on a chat attachment. Both are **v4.20 build notes** — the shelf is where they take effect.

**R144 — In dark, R126's tier distinction is carried by dash WEIGHT, not ink.** At `--line #332F24`'s
real weight (1.303:1 against `--white #1C1A14`, verified), a plate edge cannot separate from a filled
swatch on ink — both sit inside noise of the ground at the near-black end. The separator is
block-vs-outline: ~768px² continuous fill against ~95px interrupted stroke, at equal contrast. Plate =
dashed, 1.5px, `--line`, dasharray 13 6, five dashes. 1px reads as faint scratches; 2px out-weighs the
solid measured edge and breaks R126 from the far side. Measured swatch keeps its solid hairline unchanged.
The third lever (a plate-ground tint) is dead on the tokens — `--porcelain #15140F` is 1.06:1 against
ground, below the hairline — and was drawn dead in 5c so nobody reaches for it. **Verified: Design turn
5/6, tokens read this session.** *(The board rounds these to 1.31:1 and 1.07:1 — the same measurements,
not a discrepancy.)*

**R145 — The plate branch of `swatchAttr` emits an SVG path, not a CSS border.** R144's dash length
isn't settable in a CSS border, so at both tiers the swatch is an SVG path. R124's per-site argument
still selects the branch; the branch output changes from a border style to a path. `liquor-test.js` §D's
shelf fences assert against a path now, not a border style — **this is a v4.20 build note, and D3/D6 need
updating when the shelf is built.**

## R5 rulings begin here (R146 onward) — same ledger, continuous numbering

> R5 lands the design overhaul the R2/R3 boards drew (founding reference: `docs/r5/planning/R5-AUDIT.md`).
> R146–R152 are the **v4.21 session-picker reconciliations**, deferred to "as R5 slices deploy" by
> R5-AUDIT §3 and minted here as the spine rollout opens — each traced to shipped code in `71ad774`, not
> to chat. F31's fill-law fence **minted R153** when slice 1 shipped (v4.22) — see below.

**R146 — The picker's context is a serializable `kind` tag dispatched through the existing setters, not a
stored closure.** `state.pickerCtx = {kind, returnView, currentId}` is a plain object (it survives a draft
persist); `pickChoose` switches on `kind` to the shipped setter — `d_setTea` / `d_setVessel` / `es_set` —
so every side effect the setter owns still runs. Crucially `d_setVessel`'s `methodPrefillFor` is **NOT
bypassed** (a Kyusu still prefills `senchado`); a raw `vesselId` write would have dropped it. The
idempotent double-render (`d_set*` renders, then `pickChoose`'s own) is accepted over threading a closure
through the draft. *(steep-teas.js `openPicker`/`pickChoose`.)*

**R147 — The picker screens are absent from `HISTORY_VIEWS`; back is in-screen, the gesture exits
draft-safe.** `pick-tea`/`pick-vessel` are not surfaces Back should *land on* — Back should leave the
session flow, not step between its sub-screens. So they push nothing (the v4.17 pattern for the live
session flow): the in-screen "← Back" returns to `returnView`, and a browser back-gesture exits the flow
with the draft intact. `saveView` stays the single history writer; the picker rides it by omission, not a
second code path. *(steep-core.js `HISTORY_VIEWS`.)*

**R148 — Flat list + one quiet type filter, finished-teas behaviour preserved exactly; the "No vessel" row
is new.** No optgroups (the OS pop-out this replaces is the gap #14 names). The tea picker keeps the
shelf's finished-tea rule verbatim — hidden by default, "show finished (n)" reveals them dimmed, and the
current selection shows even when finished regardless of the toggle. The vessel is OPTIONAL under **R43**,
and v4.21 makes that a real selectable *row* — "No vessel" at the top when not searching, `pickChoose('')
→ d_setVessel('')` (a `methodPrefillFor('')` no-op). **R43 ruled the option; the row that surfaces it is
new to v4.21.** *(steep-teas.js `pickTeaListHTML`/`pickVesselListHTML`.)*

**R149 — Vessel kanji reused as-is; the photo-less tinted stripe is deferred to the spine's fill-law.** The
vessel picker's identity is `vesselPhoto` unchanged (photo → kanji → stripe). The stripe fallback is a
colour-fill on a non-rationed element — exactly what the spine's fill-law (F31) exists to catch — so it is
a rollout item, not a picker-slice change. Recorded here so it is not "tidied" into the picker and lost to
the fence. *(R5-AUDIT §6; steep-teas.js `vesselPhoto`.)*

**R150 — Long-press colour-correction is dropped from the picker; it is its own gesture+commit build.**
R89's *data* blockers (no per-tea liquor to correct) are resolved by the v4.11–v4.20 swatch model, but two
live blockers remain: there is no long-press gesture primitive in the app (only the six touch handlers),
and the v4.19 liquor picker is a form control with no standalone in-place commit path (F6). Correction
stays in the tea form. If wanted on the picker it is a separate build with its own on-device smoke — not
smuggled into a screen-swap. *(R5-AUDIT §5.)*

**R151 — No per-tea script on the picker; R129 extends from the shelf to every scanning surface.** R129
dropped the per-row script from the shelf row because a scanning list reads by composition, not per-row
ornament. The picker is the same kind of surface, so the same rule holds — the rows carry `teaRowIdentity`
(swatch + name + type + status) and nothing per-tea beyond it. *(R129; steep-teas.js `teaRowIdentity`.)*

**R152 — The picker's tick and manage controls take `--jade-deep`, not `--clay`, holding the clay cap.**
`.pick-tick` (the selected ✓) and `.pick-manage` ("manage vessels ›") are chrome, not the surface's one
committing action, so they must not spend clay — `--clay` is rationed to a single committing action per
surface (R113). Both render `--jade-deep`. The catch is recorded as **evidence that the rationing fence is
load-bearing**: a mechanical "make the affordance warm" would have reached for clay and quietly broken the
cap. The fence-load-bearing observation is filed in **R3-STATUS §8 (item 24)**, where "a check saw red and
it mattered" lives. *(styles.css `.pick-tick`/`.pick-manage`.)*

**R153 — The frame law (F31) becomes a fence, and the shelf is where it first bites.** R5 slice 1 (v4.22,
`e8c18fa`) builds the surface-language spine the R2/R3 overhaul drew but never shipped. **The law: the
frame never carries a fill** — every frame-layer background is `--porcelain`, `--band` or `--white`; any
other fill names a rationed mark (liquor, clay, xanthous, blue). Four containers replace the one `.card`:
RULE (`.rule`/`.rule-head`), BAND (`.band`), BOX (`.box`), and the SLAB — which is the **existing
`.btn-clay`**, no second clay container. `--band` is an **alias** of `--porcelain-dim` (the board's
`#EDE7D6` is a 2/255 near-duplicate of the shipped `#EDE7D8`; aliasing adds zero hex — R128 — and inherits
the dark value). **Radius law:** frame radii are 0 or 2px; a torn radius is rationed to the liquor swatch
(an SVG path, R145) and the clay slab alone — "one slab per screen, one swatch per tea, zero asymmetric
radii anywhere else" (board §1d), measured **from source**, never the board's drawn numbers (R127/R128:
liquor `8/4/7/4` CSS + the `9/4/8/5` SVG-path shelf swatch; slab `.btn-clay 15/5/13/5` — the board draws
`9/4/8/5`/`14/5/12/6`, its drawing, not the record). The fence is `fixtures/frame-test.js` (16 checks, six
negative controls bite) — **this is what stops the next 119 boxes.** Rolled out **per-surface, never
globally (F33):** slice 1 re-dresses only the **shelf** pilot (BAND masthead, BOX grid cards 16→2px, RULE
rows unchanged, photo thumb 5→2px per board §1d, Add → clay slab); filter chips / type-tints are
board-13-rev2, untouched. *(styles.css, steep-teas.js, fixtures/frame-test.js.)*

**R154 — The Shopping list is the spine's second surface; the rollout spreads by BOX-test, not find-and-replace.**
R5 slice 2 (v4.23) re-dresses `viewShopping` — containers only (F33). Shopping was chosen over Home/Insights
as the low-entanglement proof: a self-contained list screen absent from the R5 punch-list **and** the issue
inbox, so a containers-only pass cannot read half-done (Home carries an element-mix + greeting-bug thread,
Settings carries #8 — both would). The mapping, each container BOX-tested: masthead → **BAND** (`.shop-band`
composes `.band`, layout mirrors the shelf's `.lib-band`); the add-to-list form → **BOX** (`.shop-add` — an
inline form, the board's canonical box; it carries the box values itself, radius 14→2px, mirroring
`.shelf-card` so the fence asserts them); the two lists → **RULE** sections (`.shop-sec` wrappers opened by
an `.eyebrow.rule-head`, rows already hairline-ruled); the one committing action → the **SLAB**, `＋ Add`
swapped from jade `.btn-primary` to the existing `.btn-clay`. **The clay cap held** — the per-row
`.lib-chip`/`.icon-btn` controls stayed quiet, exactly the catch R152 named. Two guards on the mapping: the
two lists keep **separate `.shop-sec` wrappers** (F33 — stripping card chrome must not merge "Running low"
and "Your list" into one list), and the **global `.section-title` (24 sites) / `.btn-primary` (20 sites) are
untouched** — shared classes swap on Shopping's markup only. Placing the slab inside the `.shop-add` box does
**not** breach "no clay on a card" (styles.css `.btn-clay`): that rule targets *portable* cards that move
between surfaces; a fixed form box is a `.box`, not a `.card`, and `home-test.js` §D (a `var(--clay)`
CSS-selector scan) is unaffected. *(steep-shopping.js, styles.css.)*

**R155 — The fill-law fence generalises to a per-surface registry, and a surface is fenced in name only
until a control bites on its own selectors.** `fixtures/frame-test.js` (R153) held a flat `FRAME` list; slice
2 refactors it to `SURFACES = {shelf:[…], shopping:[…]}` with `FRAME = [...flatten(SURFACES), '.band']`, so
the checkers (`chkFrameFill`/`chkFrameRadius`/`chkRationing`, renamed from `chkShelf*` now that they span
surfaces) cover every registered surface at once. The catch this ruling pins: the checkers **null-skip** a
selector that carries no fill/radius, so merely *listing* a surface proves nothing — absence of red is not a
pass. Each surface therefore ships ≥1 negative control that bites on **its own** selectors: Shopping adds
three (rogue `--jade` on `.shop-row` reddens fill-law; a torn radius on `.shop-add` reddens radius-law and
rationing). `.shop-add` also makes a **positive** shopping assertion (`--white` + radius 2px), mirroring
`.shelf-card`. 16 → **19 checks**, all six+three controls bite. *(fixtures/frame-test.js.)*

**R156 — session-detail is the spine's third surface, and the first that has no BOX; a detail page is not a
discrete object, so it is de-carded, not re-boxed.** R5 slice 3 (v4.24) re-dresses `viewSessionDetail`
(containers only, F33). Chosen over the other two self-contained candidates for a reason worth recording:
**tea-detail is not a containers-only surface** — `savedBrewHTML`/`suggestedBrewHTML` are nested `.card`s
carrying `var(--jade-pale)`, and two more sites inject jade-pale by **inline style**, which the
selector-based fence structurally cannot see; it needs mark-remediation and a markup-level guard, deferred
to R5-AUDIT. **vessels** is a Teas-tab segment whose frame (masthead + clay Add) already shipped in slice 1
— a one-card rounding error. session-detail verified clean: one wrapper `.card`, no nested cards, no
jade-pale, `.sd-steep` already `border-bottom`-ruled, zero existing clay. The mapping: the wrapper `.card`
is **deleted** — boxing the whole page is the uniform-`.card` frame R5 kills, and the board's "one session =
a BOX" is a session as a *list item among peers*, not the session *as the page*. Identity → **BAND**
(`.sd-band` composes `.band`, full-bleed like the two shipped mastheads); the rest → **RULE** sections, each
in its own `.sd-sec` wrapper (grouping survives de-carding, per R154); `.sd-photo` 14→2px (unrationed →
0/2px, the board §1d shelf-thumb rule). **SLAB = "Brew this again"** — the one action that puts tea in a cup
(the Tea-First reading, same family as the shelf's Add and tea-detail's Start session), swapped jade
`.btn-primary` → the existing `.btn-clay`; Edit is a correction (`.btn`), Delete is destructive (`⋯` sheet,
`--red`), names are `.sd-link`. **The clay cap holds by construction — the surface carried zero clay, so
exactly one is introduced.** **No BOX is recorded deliberately**, so a later pass does not add one back.
*(steep-sessions.js, styles.css.)*

**R157 — a box-less surface still gets a positive fence assertion; a non-box frame element carries it.**
`fixtures/frame-test.js` gains `sessionDetail` in `SURFACES`. session-detail is the first surface with **no
box**, so there is no `.shelf-card`/`.shop-add`-style container to carry the positive assertion. The masthead
`.sd-band` **composes** `.band` (its fill is asserted centrally in §B — re-declaring it on `.sd-band` would
buy a redundant assertion at the price of breaking the band's primitive-reuse, the one thing both shipped
bands do), so the positive subject is **`.sd-photo` at 2px** — the `.shelf-thumb` precedent, a non-box frame
selector carrying a positive radius. Three controls bite (rogue `--jade` on `.sd-sec` reddens fill-law; a
torn radius on `.sd-photo` reddens radius-law and rationing). 19 → **22 checks**. The ruling this pins: a
surface in the registry with no positive subject and no biting control is fenced in name only — a box-less
surface must still name a real positive subject, and a frame element (`.sd-photo`) is the right one, not a
workaround. *(fixtures/frame-test.js.)*

**R158 — the update banner's note comes from the INCOMING version; the new service worker owns the single
source and messages it, the running page's constant is fallback only.** #36: `showUpdateBanner` read
`WHATS_NEW` from the **running (old) page**, so the banner's sub-line always described the version being
*left*. The only thing that IS the incoming version at banner-time is the **waiting service worker**, so
the note has to travel with it. The fix (v4.25): a new `steep-version.js` holds `APP_VERSION` + `WHATS_NEW`
as `self.` globals; the page reads them as before and `service-worker.js` **`importScripts`** the same file
— it *references* the note, it does not duplicate it. The SW answers **`GET_WHATS_NEW`** (over the same
client→worker channel `SKIP_WAITING` uses) with its OWN `{note, version}`; `showUpdateBanner` asks the
waiting worker and swaps the reply into the sub-line, keeping the page-local constant as the fallback
(shown instantly, kept if no reply lands within the timeout). **Single-writer is the hard requirement and
is fixture-guarded:** `fixtures/update-banner-test.js` (a static source-scan — the vm cannot reach the SW
lifecycle) asserts the note lives only in `steep-version.js`, that `service-worker.js` holds no note literal
and no `WHATS_NEW =` assignment, that the SW replies with `self.WHATS_NEW`+`self.APP_VERSION`, that the
banner asks+falls-back, and that the register block tracks `reg.installing` (the secondary no-banner gap: a
worker still installing at load, whose `updatefound` already fired, was caught by neither `reg.waiting` nor
the `updatefound` listener). **Verification is two-deploy:** the pre-push gate is the source-scan + suites;
the behaviour is the on-device smoke (`smoke.md`), confirmed on the deploy AFTER the one that ships the fix
— v4.25's own note still displays via the old v4.24 boot, so the first correctly-displayed note is the next
deploy's. The deploy ritual's version/note bump (CLAUDE.md 2b/2c) moves from steep-core.js to
`steep-version.js`. *(steep-version.js, service-worker.js, steep-boot.js, steep-core.js, index.html,
fixtures/update-banner-test.js.)*

**R159 — Home is not a containers-only restyle; it is HELD and ships combined with its own content.** Home
is the identity/landing surface, not a utility list. Redressed in isolation, its spare spine default
(masthead + three RULE sections) reads as **empty, not calm** — frame-alone under-delivers on the identity
surface specifically. So Home's spine redress is **held** and ships as one effort with its own present-tense
content (the Home-distinct-data feature track, see `docs/r5/planning/HOME-VISION.md`). R3's don't-smuggle
rule (new features never ride the visual restyle) stands everywhere else; **Home is the named exception**,
for that reason alone. The FRAME layer is drawn and planning-reconciled, and is **banked in THIS commit** at
`docs/r5/boards/home-element-mix.dc.html` (it references the already-tracked shared `support.js`; not
discarded, not authored here — copied verbatim, no edit). *(Provenance note: the docs prompt first described
it as "banked as-is"; it was not in the repo at that point — only `surface-language-spine.dc.html` was — so
it is banked here now, and this ruling records that, not a pre-existing bank. The R81/F2 stale-board check
fired and was corrected before it entered the ledger.)* Its sub-rulings — masthead BAND updates R114;
Favourites keep / last / inline, with the stacked-rows fallback as a prop; today-tint liquor rationed, the
type-tint fallback bound to the §6 vessel-stripe deferral at 2px — are drawn and reconciled but **mint only
when Home ships as the combined effort**, not now. *(docs/r5/boards/home-element-mix.dc.html; R5-AUDIT §3/§4/§6.)*

**R160 — calm-first is not spare-first.** The calm-first constraint forbids gamification, streaks, nagging,
and metric-worship. It **permits** warmth, imagery, liquor colour, and character. Austerity is a property of
the **utility** surfaces' spine (paper / hairline / one clay) — correct *there*, not a mandate everywhere.
Home, alone among the surfaces, earns visual warmth beyond the utility spine. This guards against
re-flattening Home into a utility list when its combined redress (R159) is designed. *(Companion to R159;
recorded in HOME-VISION.md and R5-AUDIT §6.)*

**R161 — Insights re-dressed to the spine, and the surface enforces its own register by culling the card
that broke it.** R5 slice 4 (v4.26) redresses `viewInsights` — containers only + a scoped copy pass. The
worst fill-law breach (`.ins-hero`: `--jade-pale` on a frame at 15px) becomes the **BAND** (`.ins-band`
composes `.band`); the six `.stat` KPI tiles (the priority miss — a boxed number is a scoreboard) de-box
into hairline **ledger rows** (`.ins-row`) under an `.ins-sechead` (2px ink rule-head) — same for the cost
card's five tiles; `week` becomes one ledger row; the two doors (**Wrapped**, **Origins**) are the surface's
two **BOX**es (`.ins-door`, `--white`/2px — `.ins-teaser`'s baked `#2A4130` and `.org-entry`'s 14px retire),
Wrapped taking the prominent `.ins-door-lead` because it read hidden. **`.stat` is retired** (Insights-only,
12 uses, all here; `viewSpend`/`viewAchievements` never used it — the "keep it for Spend" flag was a
mis-read, corrected). **Three culls, each a duplication or a register breach traced in source:** `cadence`
(`insReadingHTML`) — the ONE card whose observation was a vs-last-month *comparative*, which the surface's
own register forbids (steep-insights.js:76-82, "observations AS SENTENCES, no vs-last-week %"); `steepshape`
— an unlabelled curve, one of two sentences off no-scale axes, absent for most loggers; `recent` — four
rows of the Sessions tab (R118 same detail view). Culls are self-migrating: `dashLayout()` filters saved
order/hidden against `DASH_DEFAULT_ORDER`, and a stale surface-override never renders. **Copy pass (scoped
by correction):** only the hero eyebrow's window labels ("This week, mostly"→"This week"; "Lately,
mostly"→"Last four weeks", the honesty fix — it never said 28 days; "Mostly"→"All time"). The type-mix
"leads the cup" observation is kept as-is (approved); Origins content is parked (frame only). The hero's
unlabelled `ins-bars` is dropped (it duplicated the labelled, named-peak brewing clock, which is kept — the
board's "clock duplicates hero" was backwards) and its `hours` array with it. **calm ≠ spare (R160)** — the
warmth that survives is information, not decoration. *(steep-insights.js, steep-dashboard.js, styles.css;
board docs/r5/boards/insights-redress.dc.html, banked in this commit byte-verbatim.)*

**R162 — the fill-law fence gains its 4th surface and a ZERO-CLAY assertion only a slab-less surface can
make.** `fixtures/frame-test.js`: `SURFACES.insights = ['.ins-band','.ins-sec','.ins-sechead','.ins-door']`;
the positive subject is `.ins-door` (`--white`/2px, a real BOX). Three controls bite on Insights' own
selectors (jade-pale on `.ins-sec`; 15px on `.ins-band`; torn on `.ins-door`). The new capability: Insights
carries **0 SLAB** (a retrospective commits to nothing — the board's own count), so a new `chkNoClay(css,
selectors)` asserts no `var(--clay)` on ANY Insights frame selector — an assertion no committing surface
could make — with a control (clay injected on `.ins-sec`) proving it bites. 22 → **28 checks**. *(fixtures/
frame-test.js.)*

**R163 — Home's masthead is a BAND (the R114 update lands).** R5 combined slice (v4.27, R159). Home's
greeting masthead becomes a full-bleed `.band` stripe (`--band` paper, radius 0, `margin:0 -16px` like
`.lib-band`) — the band-masthead pattern now ships on all four other tabs, so bare ground is the exception
R114 named. Figure/ground is `--band` vs paper, **not** colour; the greeting **words are unchanged** (the
existing greeting engine); the deleted `--greeting-*` tokens stay deleted. *(styles.css `.home-masthead`;
steep-dashboard.js `greetingMastheadHTML`.)*

**R164 — warmth is the app's own colour, at size (R160 realized).** The warm pass adds **no tone, no radius,
no new hex** — it grows what the app owns: the liquor ramp at **30px** (Earlier today) / **14px** (Running
low) instead of a 13px fleck, real figure/ground, and the Wrapped field brought by Wrapped. **Colour arrives
as data** (a tea's liquor), never decoration: an element naming no tea stays plain. Home is the proving
ground; the four utility surfaces get the same contrast pass next. *(steep-dashboard.js; styles.css
`.today-tint`/`.rank-swatch`.)*

**R165 — a register reads as a door without an edge.** The lead insight is a **band register** (0 BOX
survives — a tappable line is not a discrete object, and Home's rows are already doors), made the *loudest*
door by a jade chevron + the destination in words ("why, on Insights") + a full-bleed press-wash (an `--ink`
opacity overlay via `color-mix`, not a rationed fill — fence-legal, no raw hex). The named tea's liquor
swatch rides only when the insight names a tea; the chevron holds when it doesn't. It opens **Insights** — a
graceful destination now; the deep "why" pages are a later Insights slice, so the door is never dead.
*(steep-dashboard.js `leadDoorHTML`; styles.css `.lead-door`.)*

**R166 — the ground goes whiter, app-wide.** `--porcelain #F6F2E9 → #FAF8F3` (dark block untouched). The
ruling to record is its **reach**: `--porcelain` is the global paper token, so the shelf, Shopping,
session-detail and Insights all land on the new ground at once — there is **no Home-only version** of this
change. Hairline, band, ink and the twelve liquor stops are unchanged; the pale end of the ramp gains the
separation it lacked. Fence-safe: `FILL_OK` matches the `var(--porcelain)` reference, not the resolved hex,
so the value change is transparent to every check (verified). *(styles.css `:root`.)*

**R167 — the insight-engine baseline principle (the governing ruling the spec deferred).** Home's lead
insight — and every future reflection — reads **behaviour × the tea's character, never noisy free-text**; no
single vendor is authoritative. `computeLeadInsight` ships the seven-type pool on the `computeInsights`/
`computeStats` machinery, each type **self-gating** ("can I say this truly today?"), the pick the
**most-specifically-true not shown recently**, the floor **nothing** (never a fabricated stat), phrasing
**plain templated data** (no machine prose; a later copy pass), values **computed live** (the exports are
stale). The swatch is data (the named tea's `liquorFor`), absent when no tea is named. Guarded by
`fixtures/insight-engine-test.js` (logic, never live values) — this is INSIGHT-ENGINE-SPEC's governing rule,
minted as the engine ships. *(steep-dashboard.js; docs/r5/planning/INSIGHT-ENGINE-SPEC.md.)*

**R168 — the lead-insight cooldown is device-local, not synced.** `tealog_insightlog` = a bounded
`{type→dayKey}` map (one entry per type), matching the `tealog_theme`/`tealog_view` device-local convention.
The pick is **sticky per day** (stamped on show, returned unchanged on re-render) and skipped for ~7 days
after — so the lead doesn't churn within a day and rotates across days. Ephemeral UI state, **not** a synced
preference: no DB write per Home render, and cross-device repetition is an accepted minor cost.
*(steep-dashboard.js `insightLog`/`markInsightFired`.)*

**R169 — Home is the moment, Insights is the record (Wrapped as a rhythm).** The Wrapped **moment** is the
only element permitted to raise Home's band count, and only for a month's first days: it arrives under the
greeting, then leaves **completely** — no shrunken remnant, no permanent row. `--wc-jade` is the shipped
Wrapped field (a rationed mark, excluded from the frame fence), not a new fill. The archive stays on
Insights (R103, R161). This is the model for any time-bound Home element: it earns the lead by being
**timely**, never by being **permanent**. *(steep-dashboard.js `wrappedMomentHTML`; styles.css
`.wrapped-moment`.)*

**R170 — the warmth pass reaches the utility surfaces (Insights first), and the colour clock makes the
distribution and the tea one fact.** R5 (v4.28). Home was the proving ground (R164); the app's own colour
now lands on the utility surfaces, closing the seam between one warmed identity floor and four austere
utility floors. **A dressing pass, not a re-frame:** no container's class or count moves, and **F31 is
untouched because every mark here is a mark, not a frame** — the colour-clock bars, the "Teas brewed"
strip, the note swatches and the type bar are liquor/type data riding on paper, excluded from `SURFACES`
exactly like the shelf swatch (the fence stays 32 checks; an "excluded marks" note records it). **The
colour clock** (`brewingClockHTML`) is the one new mechanic: `clockDominant` gives each 2-hour slot the
liquor of its most-brewed tea; a dominant-less slot (empty · a tie · a tea with no liquor) takes
**`--heat-empty`** — never-guess governs a bar's colour as it governs a number. The **peak leaves the amber
fill** (fill is data now) for a **2px ink rule** under the column (reads in greyscale; R100 ties all lit).
Colour is **data** throughout: the hero, whose subject is a top TYPE not a tea, stays plain (R161 — the
cleanest element gets nothing); "Teas brewed" gains its collection's palette while grams/litres stay ink;
the doors keep `--white`/2px (the retired `#2A4130` does not return); **zero clay holds**. Insights is
first because it read most as a spreadsheet and is the reflection-pages foundation. *(steep-dashboard.js
`clockDominant`/`teasBrewedStrip`/`brewingClockHTML`; steep-insights.js `insNotesHTML`; styles.css
`.clock-*`/`.ins-strip`/`.ins-note-swatch`/`.ins-typebar`; fixtures/insight-warmth-test.js. The v4.29
follow-on — shelf 30×40, shopping 14px, session-detail 44×58 — mints R171.)*

**R171 — the swatch follow-on: the warmth pass reaches the last three utility surfaces (marks only).** R5
(v4.29). The follow-on R170 named, now shipped: the tea's own colour lands on the shelf, Shopping, and
session-detail — the surfaces v4.28 left. **Marks only, not a re-frame:** every change is a `liquorFor`
swatch or a size; no container's class, count, fill, or radius moves, so F31 is untouched and Insights' own
fence is unaffected. **Shelf** — `.shelf-swatch` 24×32 → **30×40** (SVG path/viewBox unchanged, the identity
plate just reads larger). **Shopping** — a 14px `.rank-swatch` (Home's own Running-low mark, R159) leads
every running-low row and each rebuy row **only when the want is on the shelf** (`shelfTeaForWish`); a plain
want stays swatch-less — **colour is data, never-guess**. **Session-detail** — `.sd-band` becomes a row: a
**44×58** identity swatch (`swatchAttr` plate, the session's tea) leads, date/name/ident stack in
`.sd-band-main`; unknown-tea → no swatch. The fence holds: all three are **marks**, excluded from the
fill-law like the shelf swatch / the R170 clock bars (`.sd-swatch` is a new selector but a mark, not a
frame; frame-test 32 unmoved). `liquor-test` F2 now counts **10** swatchAttr liquor sites (7 → +3), and
**steep-shopping.js joins the site scan** so the surface that just gained swatches is guarded (it adds 0
type-tint writes; F1 stays 11). *(styles.css `.shelf-swatch`/`.sd-band`/`.sd-band-main`/`.sd-swatch`;
steep-sessions.js sd-band; steep-shopping.js the two rows. On-device: smoke.md §v4.29 — the visual half a
`vm` can't render.)*

**R172 — the reflection deep pages, and the deep-link contract: land on the section, never open-and-hunt.**
R5 (v4.30, reflection Slice A; `docs/r5/planning/REFLECTION-SPEC.md`). The lead-insight door (R165) opened
Insights as a graceful destination but the *specific* "why" page it promised did not exist; this is that
slice. Three things ship together. **(1) The deep-link mechanism** — `openReflection(view, focus, teaId?)`
sets the view + `state.reflectFocus` (+ `activeTeaId` for the per-tea case, Slice B) and `saveView`s it;
`render()`'s tail scrolls `#reflect-<focus>` into view **once** (a one-shot: `reflectFocus` is nulled before
the frame, so a later re-render never re-scrolls), and `goView` nulls it so a plain tab tap never carries a
stale focus. `palate`/`ritual` join `HISTORY_VIEWS` (Back returns to the opening tab) but not
`PERSISTED_VIEWS` (they are sub-views, not tabs). **The contract:** the tap that named a pattern lands on the
page that explains *that* pattern, scrolled to it — never a surface opened to hunt from. **(2)
Whole-Insights-explorable** — the shallow Insights sections **are** the doors into their deep views (type mix
→ Your palate, the colour clock → Your ritual): an `onclick` + a jade chevron on the **existing** `.ins-sec`
(the R165 register-is-a-door grammar), a behaviour class only (`.ins-sec-door`) — no parallel navigation, no
container change, so the Insights fence is untouched. `REFLECT_ROUTE` maps each lead-insight type to its
landing; unmapped types (the tea-page/terroir destinations of Slices B/C) fall back to Insights — a door is
never broken, only not-yet-deep. **(3) Two views on existing fields** — **Your ritual** (the colour clock
expanded to when × what · vessels · temperatures-by-type · rhythm) and **Your palate** (families × ratings ·
rated highest). They wear the Insights spine (a `.band`/`.reflect-band` masthead + `.ins-sec` RULE sections):
they are the Insights record deepened, not a new surface language. **Never-guess holds** — a section with no
data is absent, and the palate's flavour-level grain is a documented note that deepens as the tasting-input
work lands, never a guessed fingerprint. Fence: the reflection surface adds one fenced selector
(`.reflect-band`, positive + 3 controls; RULE sections reuse the fenced `.ins-sec`); doors + palate bars are
marks/behaviour, excluded (R170 pattern) — frame-test 32 → 36, Insights' own checks unchanged. *(steep-core.js
`openReflection`/render-tail scroll/`goView`/`HISTORY_VIEWS`; steep-dashboard.js `REFLECT_ROUTE`/
`reflectRouteForInsight`/`leadDoorHTML`/`brewingClockHTML(asDoor)`; steep-insights.js `insTypeMixHTML` door +
`viewRitual`/`viewPalate` + builders; styles.css `.reflect-band`/`.reflect-anchor`/`.ins-sec-door`/`.palate-*`;
fixtures/reflection-test.js. On-device: smoke.md §v4.30 — the scroll + real taps a `vm` can't reach. Slices
B/C reserve **R173** (per-tea + the earned brew guide) / **R174** (terroir + teas-over-time).)*

**R175 — brew-advice v4 Stage 1: the character-based, context-gated diagnosis replaces the net-sign verdict
(engine dormant).** Brew round (v4.31; `SPEC-brew-advice-v4.md`, grounded in
`docs/research/brew-extraction-science.md`). v4 replaces v3's **feedback model** and reuses its
**engineering** (v3 §8). Slice 1 of 2 ships the engine **dormant + fixture-proven** — the capture still
writes the old 3-tap, so nothing writes the new enum yet (the house dormant-engine-first pattern, cf.
tea-types v3.87 / lead-insight v4.27); Slice 2 (R176) wires the 5-tap capture + surfacing. **The diagnosis**
(`diagnoseFeedback(tap, ctx)`) maps one character tap (`good/strong/flat/astringent/bitter`) to **one lever +
a one-line mechanism**, framed as an experiment, **context-gated** on tea type (`KB_TYPE_SHAPE` — temp window
+ failure mode), brew style + infusion role (`KB_STYLE_SHAPE`), the steep's temperature, and a
**water/freshness pre-check** (§6). **The shape gate is the point R172-family shape-awareness demanded here:**
`flat` on a by-design-light **gongfu/senchadō opening** steep says *"extend the next / poured off too fast,"*
never "add leaf" — a light opening steep is intended, not under-extraction. **`astringent` ≠ `bitter`** by
design (mouthfeel vs taste, different levers). **Senchadō's shape moves into the KB** (`KB_STYLE_SHAPE`:
sencha ~70–80, gyokuro ~50–60) — **diagnosis shape only**; the v2 ratio axis is untouched and the decorative
`senchado:2.8` ratio-seed reachability (`LEAF_RATIO_DEFAULT`) stays a **separate v2-ratio task** (STATE
backlog). **`weak ≡ flat` read-side alias** (`FB_ALIAS`) is non-destructive — the 23 legacy `weak` values (17
per-steep + 6 session) read as `flat`, nothing rewritten (enum app-only, no DB CHECK, no SQL). **The net-sign
auto-delta is RETIRED** (`computeBrewAdvice`'s `tempAdjC`/`timeAdjPct`): it conflated intensity with
over-extraction and was shape-blind; `tuned = base`, `hasNudge` always false, counts survive for the memory,
consumers degrade gracefully (no "Your tuning" segment until Slice 2). Learned per-tea tuning returns in Stage
2. *(steep-knowledge.js `KB_TYPE_SHAPE`/`KB_STYLE_SHAPE`; steep-core.js `diagnoseFeedback`/`FB_ALIAS`/
`typeMinTemp` + the `computeBrewAdvice` retire; steep-sessions.js the memory line; fixtures/brew-advice-v4-test.js
(30) + brew-feedback-test §G rewritten. On-device: smoke.md §v4.31. Slice 2 mints **R176**.)*

**R176 — brew-advice v4 Stage 1, Slice 2: the five-tap capture + the diagnosis surfacing (the app tells you
which knob, and why).** Brew round (v4.32; `SPEC-brew-advice-v4.md` §1/§2/§5, reusing v3's §3 quietness).
Wires the dormant Slice-1 engine (R175) to the UI. **Capture:** the per-steep tap and the session-level row
widen to the five-tap character set `{good, strong, flat, astringent, bitter}` (astringent ≠ bitter, separate
by design) and now write the new enum. Per-steep quietness is **collapsed-faint → expand-on-tap →
recorded-marker** ("five faint markers, never five open chip-rows"), method-gated to gongfu/senchadō
(`steepFbActive`, unchanged), Tea-First. **Surfacing:** the tap → `diagnoseFeedback` → **one lever + a
one-line mechanism, framed as an experiment, never a verdict** ("Next time, try cooler first, then shorter —
hot water pulls the drying tannins…"); a quiet reason on the tap, the fuller **"Your last cup"** on the tea
page (`teaBrewAdviceHTML`). It is **spine-content** — a plain teaching line, no new BOX, no verdict card; the
capture reuses `.lib-chip` and the advice classes carry no fill/border/radius, so **the fence is untouched
(frame-test 36, green)**. **Role-aware `timeShift`:** over-extraction (astringent/bitter) shortens the next
pour; a by-design-light opening steep tapped flat extends it; strong / flat-elsewhere advise only. **Water
pre-check** (§6): flat routes through water/stale-leaf before temp/time. **Consequence — the reducer moves to
the v4 character model:** `reduceSteepFeedback` / `feedbackSignalOf` return the dominant character (was
net-sign; most-frequent, tie→most-actionable, `weak`→`flat` alias), feeding the count-memory tally + the
tea-page line; the per-tap advice reads the raw tap. *(steep-sessions.js `d_nudgeNextSteep`/`brewNudgeRowHTML`/
`feedbackRowHTML`/`pourAdviceCtx`/`pourAdviceHTML`/`d_openPourFb`/`STEEP_FB_LABELS`; steep-core.js the
character reducer + `computeBrewAdvice` tally + `adviceMemoryText`; steep-teas.js `teaBrewAdviceHTML`;
styles.css `.pour-*`. Fixtures: brew-advice-v4-test §I (render wiring + timeShift, 30→41), brew-feedback-test
§A–F character model, focus-test §C. On-device: smoke.md §v4.32 — the real gate. **Stage 1 complete; Stage 2
(learned time adaptation + preference) is post-gate.**)*

> **R176 addendum (v4.33, fix-forward — no new ruling).** Two surfacing bugs corrected. (1) The "change"
> button was dead: `brewNudgeRowHTML`'s recorded-marker branch ran before the open-state check, so
> `d_openPourFb` (`pourFbOpenIdx = idx`) couldn't surface the chips — reordered so the actively-editing state
> is checked first and renders the five chips even when a verdict is recorded, current pick highlighted. (2)
> The water pre-check dead-ended `flat`: it replaced the extraction advice with a water-only line — now water
> is a **caveat alongside the lever** (`diagnoseFeedback` flat → lever + `waterCaveat`; the shape gate runs
> first, so an opening-light flat still extends without a water caveat), so the flow always ends actionable
> (§6 realized correctly). Content/render only — fence unaffected. Fixtures: brew-advice-v4-test §D (caveat
> contract) + §I7/§I8. smoke.md §v4.33.

**R177 — tea-detail joins the spine: the last major surface re-dressed (BAND masthead + RULE sections + one
clay SLAB + colour-as-data).** R5 (v4.34; reflection Slice B1). Flag #1 of Slice B ruled A — the full spine +
warm re-dress of `viewTeaDetail`, on the session-detail precedent (R156/R157). **Containers only — same
content, re-framed** (no content logic; the why + freshness content is B2/R173). **Masthead → `.td-band`**
(composes `.band`, full-bleed, `--band` fill, radius 0): the tea's `liquorFor` swatch (identity mark,
colour-as-data) + a 56×58 photo thumb (the 140×140 hero shrinks; a mark, not frame) + name / type pill /
favourite-rebuy pills / stars — identity only, stock lifted out. **Five RULE sections** (`.td-sec` +
`.td-sechead.rule-head`), reflection-first (Character above On hand): **Character** (leaf facts + flavour +
description merged — grouping earns its keep, three blocks → one) → **On hand** → **Brewing** (guide +
"Your last cup" merged; the nested `.jade-pale` brew card **de-carded** to plain rows — no card-in-a-section)
→ **Where this came from** (provenance wrapper stripped so the section headers it) → **Your diary**. Each
renders only WITH content (no empty headers). **One clay SLAB** — Start session (was `btn-primary`); Edit
ghost; the rationing lock holds (one torn radius on the page). **Warmth = marks only** (masthead swatch +
flavour marks carry colour; the rest ink; the thumb is content, not a mark). The section structure is left
ready for B2 to insert `#reflect-why` (in Character) + a Freshness section (`#reflect-freshness`, after
Brewing). Fence: `SURFACES.teaDetail = ['.td-band','.td-sec','.td-sechead']` + a `.td-band` radius-0 positive
+ 3 biting controls; `.td-swatch`/`.td-thumb`/flavour excluded as marks — **frame-test 36 → 40, green.**
`liquor-test` F2 10 → 11 (the masthead swatch). *(steep-teas.js `viewTeaDetail` + `savedBrewHTML`/
`suggestedBrewHTML` de-card + `teaProvenanceHTML` strip; styles.css `.td-*`. On-device: smoke.md §v4.34 — the
read + the photo thumb-vs-hero call. **B2 (R173) — why + freshness — rides this frame.**)*

**R173 — the tea's page: why-this-tea (palate-connected) + type-aware freshness + the two deep-link landings.**
R5 (v4.35, reflection Slice B2; `docs/r5/planning/REFLECTION-SPEC.md` "each tea's page"). The content on B1's
re-dressed frame (R177) — Slice B complete. *(R173 first reserved per-tea + the earned brew guide; the brew
guide moved to brew-advice v4 (R175/R176), so R173 shrank to why + freshness — as ruled.)* **Why this tea**
(`teaWhyHTML`, `#reflect-why` in Character): the palate connection — the tea's traits (type, roast) crossed
with your favourites + highly-rated teas ("You keep reaching for oolong — this is one of them"). Baseline:
behaviour × character, **type/rating reliable now**, flavour-grain later — never a claim it can't support;
graceful (too little signal → the curated character alone). **Type-aware freshness** (`teaFreshnessHTML`,
`#reflect-freshness` after Brewing): the reading's framing FITS the type — fade-fast (greens) → peak/urgency;
age-friendly (white, pu-erh, roasted oolong) → holding/stable, never drink-fresh urgency. **The `ttFreshness`
oolong-by-roast fix** realizes the model's design ("widens with roast, per tea", steep-teas.js:10): a
medium/heavy-roast oolong (Wuyi yancha + inheriting members, roasted Dong Ding — read from the catalog `roast`
field) is age-friendly; light/floral stays fresh-window — **correcting the reading + the Home freshness
insight + statusLine at once** (all consult `ttFreshness`); the fix for "a roasted oolong told it's at its
freshest." (Reaches catalog-matched teas; an unmatched sticky-rice oolong needs a catalog row — STATE
backlog.) **Deep-link landings:** `REFLECT_ROUTE` freshness → {tea-detail, freshness}, haven-t →
{tea-detail, why}; `leadDoorHTML` passes `li.teaId` for tea-detail routes; `openReflection` sets
`teaDetailFrom='insights'` (Back → Insights); the render-tail one-shot scroll hits the anchors — **the last
two unmapped lead types now land** on the tea's page, scrolled. Fence: why/freshness are spine-content
(`.td-why`/`.td-fresh`, ink, no fill) — frame-test 40, unchanged. *(steep-teas.js `teaWhyHTML`/
`teaFreshnessHTML` + viewTeaDetail wiring; steep-tea-types.js `ttFreshness` roast branch; steep-dashboard.js
`REFLECT_ROUTE` + `leadDoorHTML` teaId; steep-core.js `openReflection` teaDetailFrom; fixtures/reflection-test.js
§B + §J. On-device: smoke.md §v4.35. **Reflection Slice B complete; Slice C (R174) is next.**)*

**R174 — reflection Slice C: terroir + teas-over-time — the last two reflection views (the reflection is
COMPLETE).** Shipped v4.36 (cache v146, no SQL, no new module). REFLECTION-SPEC views 3 + 5, both on shipped
fields. **Your terroir** re-dresses `viewOrigins` **in place** to the reflection spine (`.reflect-band` masthead
+ `.ins-sec` sections) over the kept atlas, keeping `state.view='origins'` / `goOrigins()` and every existing
return target: `terroirCensus` (shelf-weighted — the countries you span, the lead count) + `terroirGravitate`
(brew-weighted — sessions per origin, "what you reach for"). The country-tier list (`originsCountryRows`) is
preserved under the span count; region-tier teas stay the map's pins and are **not duplicated** in the list — a
full-census list would show the pinned teas twice, so the census supplies only the count. **No `REFLECT_ROUTE`
entry** — the lead engine (`computeLeadInsight`) has no origins type, by REFLECTION-SPEC's design (the table's
"(the origins section)" is parenthesised — a section door, not an engine lead); terroir is reached only via the
Insights Origins door (renamed "terroir"). **No hardcoded back** — origins is hub+Insights reachable
(`hubGo('origins')`), so a "Back to Insights" would misroute a hub entry; it rides the generic `HISTORY_VIEWS`
Back (timeline, Insights-only, keeps its `← Back to Insights`). **Teas over time** is a NEW `viewTimeline`
(`state.view='timeline'`, a reflection sibling of ritual/palate): `overtimeSeries` (month density — cups +
acquisitions on one axis), `overtimeArrivals` (first-cup chronology, newest first), `overtimeThenVsNow` (gated
≥3 distinct months → absent on a short log, never-guess). Reached via a **new Insights BOX door** (`overtime`
dashCard, gated ≥2 months) → `openReflection('timeline')`. In the router + `HISTORY_VIEWS` + render-smoke's view
list. **Fence:** both ride the already-fenced `.reflect-band` + `.ins-sec` — **no new frame container, so no
`SURFACES` entry and no new control** (a class invented only to feed the fence is fenced in name only, per the
fence's own doctrine); a ⚡ note records the family join, and the atlas pins (`.org-*`) + timeline marks
(`.tot-*`) are excluded data marks. frame-test 40 unchanged. **Suites moved to the new model** (expected, not
regressions): liquor-test F2 swatch count 11→12 (`.tot-arr-swatch`), landing-test D1 "atlas"→"terroir",
origins-test C2/C3 ("Known by country"→"Where you span") + F13 (the span count now speaks where the old
blank-screen fallback did); reflection-test §K +12. Also swept: CLAUDE.md's stale passport-"PARKED" paragraph
corrected — Origins is the shipped drawn-outline atlas, now extended into terroir, not parked. On-device:
smoke.md §v4.36. **The reflection is complete (Slices A/B/C).**

**R178 — wave-1 #1: the Sessions list re-dressed to the spine (the last list joins), with the ruled
image treatment.** Shipped v4.37 (cache v147, no SQL, no new module). The v4.36 audit
(`AUDIT-REPORT-v4.36.md`) ranked the Sessions list wave-1 #1 — the starkest inconsistency: old
label-picture `.card` rows + a `.card` calendar, no spine/warmth, while its own detail page is full
spine + a liquor swatch. **Rows → RULE** (`.sess-row` de-carded to the `.shelf-row` hairline pattern —
content unchanged, on paper). **The lead mark is the SESSION'S own, not the tea's:** new single writer
`sessLeadHTML(s, tea)` (replaces `sessThumbHTML`) — the session `photoUrl` → its own photo (the moment,
content, 44×58 cohering with `.sd-swatch`); else the tea's liquor swatch via
`swatchAttr('sess-swatch', liquorFor(tea), …, true)` (the single swatch writer — no raw `--liquor-*` in
sessions.js); deleted-tea + no-photo → the dashed tier-3 plate. **Never `tea.image` again** — that was
Library identity leaking onto Sessions; the ruled treatment differentiates Sessions (your *moments*)
from Library (tea *identity*) and finishes colour-as-data on the one list that missed it. The lead
rides the row's `openSessionDetail` tap; the tea NAME keeps its `openTeaDetail` link. **Header →
`.lib-band` BAND** (reuse, not invent); **calendar → `.sess-cal` BOX** (`--white`/2px; cell-state fills
untouched); the two empty states + the Brewing-days heatmap card de-carded → a fully-spine tab.
**Zero SLAB** (a log commits to nothing on-surface; the Log FAB is global — the Insights posture),
fenced by `chkNoClay(SURFACES.sessions)`. **Fence (F33):** new
`SURFACES.sessions = ['.sess-row','.sess-cal','.sess-main','.sess-chev']` (so `chkFrameRadius` bites the
old 12px), a `.sess-cal` BOX positive (the masthead rides the shared `.band`/`.lib-band`), and three
biting controls (jade fill on `.sess-row`; torn radius on `.sess-cal` → radius+rationing; `--clay` on
`.sess-row` → zero-clay). The `.sess-lead` photo + `.sess-swatch` liquor are MARKS, excluded from the
frame (guarded in liquor-test). frame-test 40→46; liquor-test 78→82 (`sessLeadHTML`'s four branches +
site scan F1 12→10 / F2 12→13). All 44 committed suites exit 0. On-device: smoke.md §v4.37 (locally
drivable). *(A later calendar/heatmap-box split, if ever wanted, is **unnumbered** — both ride `.sess-cal`
/ de-carded; **R179 was assigned to wave-1 #2, vendor + keyboard, below** (v4.38), not to that split.)*
**NEXT: wave-1 #2 (vendor + keyboard), then #3 (session-flow re-dress, `SESSION-FLOW-REDESIGN.md`).**

**R179 — wave-1 #2: vendor field + keyboard occlusion, fixed as a class not a field.** Shipped v4.38
(cache v148, no SQL, no new module). The v4.36 audit (§B2, "Class 5") ranked this wave-1 #2 — the one
genuine on-phone bug, and systemic: the app had **zero** `visualViewport`/focus-scroll handling, so every
low field in the three fixed `.overlay` modals (tea/vessel/settings) sat behind the soft keyboard, and the
native `<datalist>`'s OS popup fought the keyboard for the same bottom strip. **Two problems, split two
ways.** (1) **Occlusion → one systemic writer.** `installKeyboardReveal` (steep-core.js, installed once from
`init`, mirroring `installResumeSync`): a delegated `visualViewport` resize listener + a `focusin` handler
scrolls the active field above the keyboard using the visual viewport's real height — **only when it
is actually occluded** (no jank on already-visible fields), instant under `prefers-reduced-motion`,
`if(window.visualViewport)` feature-detected + try/catch. Covers all three overlays **and** the inline-page
fields (`#tagInputField` during steeping, `#wishName`/`#userSearch`/`#timerTargetEdit`) by delegation — the
whole Class-5 finding closes at once, not one field at a time. (2) **The datalist → an in-form inline
suggester.** Both native `<datalist>`s (tea-form `#source`, wishlist `#wishVendor`) become a `.tag-suggest`
popover that rides the layout instead of an OS popup; `distinctVendors()` substring-filtered; a tap writes
`input.value` (a plain DOM write — the uncontrolled tea form is untouched, `submitTeaForm` still reads
`name="source"`); a brand-new typed vendor still saves. **The ratified fix-split: vendor is NOT a
full-screen picker.** The code-verified blocker — the tea form is *uncontrolled* (typed values live in the
DOM, read on submit), so a router picker's full `render()` would wipe every in-progress field; the picker
pattern (`openPicker`) presupposes state-backed data (the session draft), which the tea form is not. Making
vendor a picker would force the form into state-backing (biggest change, real regression surface on
fold/draft-image/tare/stars) or fork the picker into a sub-overlay — both rejected. **Single writer:**
`renderTagSuggest` (steep-sessions) and the vendor suggester both call a shared `renderFieldSuggest`
(steep-core), extracted from the tag renderer with its #29 mousedown+preventDefault preserved exactly
(flavor-ladder H9 green across the extraction — chosen over a parallel renderer *because* H9 pins the
markup and stayed green). **Fence verdict: no new surface.** The reveal is behaviour (no CSS frame); the
suggester reuses the already-un-fenced `.tag-suggest`/`.tag-input-wrap` transient popover on the tea-form
modal (itself not-yet-spined, audit #7); no styles.css change (the vendor input takes full width via inline
`width:100%` under the global `box-sizing:border-box`). Inventing a `SURFACES` entry to feed the fence is
exactly what this declines — **frame-test stays 46.** Fixtures: new `vendor-keyboard-test.js` (24 — Arm A
the suggester value round-trip in the vm, Arm B the wiring source-scan a vm cannot drive: both datalists
gone, `name="source"` intact, the reveal present + feature-detected + installed-once + reduced-motion-gated,
the shared renderer); 45th suite, all green, export-gate first. On-device: smoke.md §v4.38 (post-push — a vm
has no keyboard). **NEXT: wave-1 #2.5 (tea-page + calm-copy polish, `TEA-PAGE-CALM-COPY-POLISH.md`), then #3
(session-flow, `SESSION-FLOW-REDESIGN.md`).**

**R180 — wave-1 #2.5: tea-page polish, the info-popover component, copy de-AI-ification, and the material
suggester.** Shipped v4.39 (cache v149, no SQL, no new module). One slice off `TEA-PAGE-CALM-COPY-POLISH.md`
(D1–D4), all three build-gate calls ruled: one slice not two; the suggested-brew note joins the two named
notes behind the info mark (a consistent Brewing section); the house-style rule lands in CLAUDE.md now.
**D1 section rhythm** — three scoped CSS rules (`.td-sec` inter-section gap 18→30px; a scoped
`.td-sechead .eyebrow` at 12.5px/ink — the header eyebrow only, NOT the global class and NOT the in-section
sub-labels; a little more `.td-sechead` air). Typography and space, no re-boxing, no fill/radius →
**frame-test 46**. **D2 the info-popover** — `infoMark(text,label)` + `toggleInfoPop`/`closeInfoPop` in
steep-core.js beside `armConfirm`, plus a new `i-info-hl` line-glyph in the index.html sprite (no literal
circled-i; DESIGN.md's SVG-iconography rule). A surface drops `infoMark(text,label)` where a caption sat; a
tap reveals the explainer in a `.info-pop`; dismiss four ways (re-tap, outside pointerdown, Escape, any
render()). Viewport-safe: measured against `visualViewport`, flips `.info-pop-above` / `.info-pop-right` so
it never runs off-screen or under the keyboard (the #2 lesson). `textContent` boundary (no re-injection),
reduced-motion via a `no-preference` gate, a real button with aria-label + aria-expanded. It is the contract
**track #3 inherits**, and is intended for insight-reveals too (INSIGHT-ENGINE-SPEC refinement, pushed
`1edadef`); the text-string API suffices now and richer content is left open. **Fence verdict: no new
surface** — `.info-wrap` / `.info-mark` / `.info-pop` are a transient popover (the `.tag-suggest` /
`.confirm-inline` family), outside the fill-law fence; no `SURFACES` entry, frame-test unmoved. Proven on the
tea page: the always-on photo note and both brew notes (saved-guide + suggested) move behind marks, the
caption divs deleted not hidden. **D3 copy** — the named tea-page strings rewritten plain (em-dashes gone, no
"X, Y, never Z"): photo note, both brew notes, suggested-brew note, and the three tea-form hints
(purchase / opened / leaf-form — em-dash lead-ins become the middot separator plus short sentences). The rule
is added to **CLAUDE.md "Copy voice"**: it binds app strings, specs, and prompts. The full app-wide em-dash
purge across existing strings and the DESIGN.md voice fold-in are a later pass — the spec scopes the
existing-doc purge there, which is why the CHANGELOG / STATE / this ledger keep their established provenance
voice for now. **D4 material suggester** — the vessel Material field gets the vendor treatment
(`autocomplete="off"` + the shared `.tag-suggest` popover fed by a new `distinctMaterials()` through
`renderFieldSuggest`); one more caller, no new component or CSS. `pickVendorSuggest` → `pickFieldSuggest`
(generic once material is the second caller; the two vendor `onPickExpr` sites + `vendor-keyboard-test.js`
follow). `installKeyboardReveal` (R179) already covers the field by delegation, confirmed by design and
verified on device. Fixtures: new `tea-polish-test.js` (27, committed via the `.gitignore` exception) + the
`vendor-keyboard-test.js` rename update; all committed suites green, export-gate first, frame-test 46.
On-device: smoke.md §v4.39. **NEXT: wave-1 #3 (session-flow re-dress, `SESSION-FLOW-REDESIGN.md`), which
picks up the info-popover.**

**R181 — wave-1 #3 slice a: session-flow IA + timer + focus cue.** Shipped v4.40 (cache v150, no SQL, no
new module). The first, contained slice of `SESSION-FLOW-REDESIGN.md` (D1 + D5 + Bug A); slices b (the
`FLAVOR_TREE` tagger + session-level D2 reads) and c (guided mode) follow, D2 isolated as its own step per
the plan-gate. **D1 facts-before-feelings (issue #22, twice-slipped):** the objective facts (temp · time ·
ratio) promoted directly under the timer, above tasting; the tasting capture (`flavorCaptureHTML`) demoted
into a named `.fold-row` collapse, closed by default, with "· N noted" + the tapped chips shown while
collapsed so no entered data is stranded. Ratio READS `computeSessionRatio` (shown when it computes, omitted
otherwise — null for `ratioAdjust`-off users, most of the beta; absence is not a bug). Notes (`#steepDesc`)
stays a live input WITH the facts, forced by `saveSteepAndContinue`'s bare `.value` reads of
`#steepTemp`/`#steepTime`/`#steepDesc` (no null guard) — a build constraint the design doc missed, caught
against live code. **D5 time-on-ring:** the countdown target is tap-to-edit running AND stopped
(`d_beginTimeEdit` un-gated), plus a `±10/±5` nudge row (`d_bumpTime`), every write through the single writer
`setSteepTime` (#13, never a second writer; floors at 5s). **Bug A focus cue:** was pinned to "breathe out"
in the render and a per-tick override; now four CSS states off `#focusRing.is-paused` (running → "breathe in"
⇄ "breathe out" cross-faded on the ring's own `sc-breathe-slow` 6s clock so they cannot drift;
paused/complete → "paused"; reduced-motion+running → a neutral static "breathe"). The override BECAME a class
toggle rather than a deletion — the interval-completion path sets `running=false` with NO `render()`, so the
toggle is the only cue updater there (a self-completing steep must land on "paused", not a stranded
cross-fade). Ring breathe gated to `:not(.is-paused)` so ring and cue stop together; the reduced-motion block
re-asserts `animation:none` at matching specificity. The `.is-paused` class sits on the shared ancestor
`#focusRing`, not `.focus-cue` — a sibling cannot gate the ring in CSS (flagged and confirmed at plan-gate).
Fixtures: steeping-timer §G, focus §H (source-asserted, the cue is CSS). All committed suites green.
On-device: `smoke.md §v4.40` (post-deploy). **NEXT: slice b — the tagger writes session-level `sessionTags`
(Q1 ruled: kills the "led early" artifact at the root), D2 repoints the reads and subsumes the two
overall-tags UIs; R182.**

**R182 — wave-1 #3 slice b: the flavour tagger + session-level tasting (D2/D3/Bug B).** Shipped v4.41
(cache v151, no SQL, no new module). The data-touching slice of `SESSION-FLOW-REDESIGN.md`; slice c (guided
mode, D4) remains. **D3 tagger:** `flavorCaptureHTML` rewritten on `FLAVOR_TREE` (12 families → sub-families
→ notes). A `sweet · umami · crisp` taste-&-structure strip (vocab but non-resolving, Design's proposal)
above the twelve; tap a family (`d_flavFam`) to expand its notes in place, two shortcut rows first
("You've noted in this tea" = `teaFlavorProfile ∩ family`; "Words you've used" = `tagLibrary ∩ family` =
**Bug B**), then sub-family rows (4 families) or notes straight up (8). Free-word door with a live
resolution echo, stored as written. New `toggleSessionFlavor`/`d_flavFam`/`flavFamilyPanelHTML`/
`flavorFamilies`/`FLAV_STRIP`. **Q1 ruled session-level (NOT keep-per-steep-and-suppress):** the tagger
writes `sessionTags`, killing the "led early" artifact at the root; it is the SOLE session-tasting UI,
having subsumed both "Overall tags" chip UIs (`sessionQuickHTML` + `sessionFinishHTML`) and the slice-a
collapse. `curSteepTags`/`toggleFlavor` kept for guided mode. **D2 read-repointing (the reviewable heart,
its own scrutiny before push):** `distinctVocab` = `session.tags` ∪ `steeps[].tags` (quick/cold-brew now
feed the profile); `flavorObservation` dropped "peaks at steep 1, softens after" and gates "runs steady" on
a real spread of steep indices; `sessionFlavorStory` dropped "X led early"; finish "You tasted" + readback
repointed. The tea-page chips/bars/radar rendering is unchanged (only which sessions count + the prose).
**Design calls (confirmed, not rebuilt):** lowercase free-word storage kept (exact-case a logged shared-code
follow, `addTagFromInput`); one merged "chosen" row (not a separate "your words" bucket); finish keeps the
recap above the tagger (phone-look drop-if-double). `KB_FLAVOR_FAMILIES`/`flavorFamilyOf`/`d_flavorMore` now
dead, left for `flavor-ladder §A` (cleanup follow, CLAUDE.md backlog). Fixtures: new `flavor-tagger-test.js`
(27), `flavor-ladder §E` revised, all 40 green, export-gate first. On-device: `smoke.md §v4.41` (post-deploy).
**NEXT: slice c — guided tasting as its own path (D4), the per-steep evolution layer + Tier-1 liquor
capture; then SECURITY re-blocks before the beta widens.**

**R183 — Smart Restock: one entry + a purchase log RETIRES R11 (rebuy = new row).** Ruled by Niklas, r5
stock-management (`docs/r5/planning/SPEC-restock-model.md`). **R11 is superseded** (annotated at its entry,
not deleted). Rebuying the *exact same tea* — **name + vendor (`source`) + harvest year all matching** — no
longer creates a second tea row; it **tops up one entry** via a **Restock button** (grams · date · cost)
that: `amountGrams += grams` (`stockTier` reads the new total — the single stock writer, untouched);
`openedDate ← restock date` (freshness refreshes through `freshnessReading`, the single freshness writer,
untouched — restock only sets the date); appends a `{grams,date,cost}` event to a per-entry **purchase
log**; sets `wouldRebuy = true`. The log is the engine: purchase history, per-batch lifespan
(`openedDate`→next restock), total spend + a true weighted cost/gram across all buys, and a calm "teas you
return to" reflection insight. **Any of name/vendor/harvest differing = a separate entry** (new character,
new freshness clock, last year's notes stay last year's); cross-harvest entries are **soft-linked read-only**
by name+vendor, never merged. **Migration is forward-only:** R11's existing duplicate rows are NOT
auto-merged (guessing which rows are the same tea is the guess to avoid); the soft-link groups them
read-only. The R11 create path (`isRepeat`/`purchaseType:'repeat'` → new row) retires. Storage (JSONB
`purchase_log` on `teas` is Code's lean), the cost math, and the R11-path retirement are Code's plan-gate
proposal; **SQL-first** per the deploy ritual (the migration file ships and applies alone, before the code
commit exists). Mints its own build ruling on ship. The **sample flag** pairs with this round; sample→
full-buy conversion is deferred to that slice.

**R184 — Smart Restock BUILT: one entry + a purchase log, R11 retired.** Shipped v4.42 (cache v152; SQL
`sql/v4_42-purchase-log.sql` — one nullable JSONB `purchase_log` column, pushed + applied FIRST; no new
module). The build of R183 (`docs/r5/planning/SPEC-restock-model.md`). **Data model:** JSONB `purchase_log`
on `teas` (Code's lean over a `purchases` table — the app is flat-row, the log is small and always read with
its tea, aggregates are client-side); each event `{grams, date, cost, opened}`. **Restock:** a button on the
tea's "On hand" opens an in-app **modal** (grams · date · cost; the new-harvest cue; the "Opening this bag
now?" toggle default ON). `commitRestock` is single-writer-clean — SETS `amountGrams` (stockTier reads it)
and, when opening, `openedDate` (freshnessReading reads it); appends the event; `wouldRebuy=true`. **Buy
decoupled from open (mini-gate ruling):** ON → `opened=date` + `openedDate=date`; OFF (stockpile) →
`opened=null`, `openedDate` untouched (amountGrams still grows — sealed leaf is stock); a sealed bag opens
later via the explicit one-tap `d_openBatch` (the app can't detect it); lifespan reads the `opened` dates.
**Cost:** weighted Σcost/Σgrams from the log; `cost_total`/`cost_original_grams` kept as the legacy fallback,
a legacy tea's first restock seeds buy #1 from them. **Soft-link** `teaSoftLinks` groups same name+vendor
across harvests, read-only. **R11 retired forward-only:** `isRepeat` removed (new adds always `'first'`,
column kept for legacy display), `restockTea` reroutes to the modal, existing dup rows left as-is. **Design
calls confirmed:** modal not inline; wouldRebuy flips true (its rethink is a separate backlog item); no
sample handling. **Deferred:** the cross-tea "teas you return to" Insights list (the per-tea soft-link ships;
the list is a fast-follow); sample→full-buy conversion (the sample-flag slice). Fixtures: new
`restock-test.js` (20), `liquor-test §G1` field-drop guard kept green (`purchaseLog` a `data`-literal key,
the mapper value reworded to dodge the ternary-colon parse). All 41 suites green. On-device: `smoke.md
§v4.42` (post-deploy). **NEXT: guided mode (D4, wave-1 #3 slice c) + the "teas you return to" fast-follow;
then SECURITY re-blocks before the beta widens.**

**R185 — camera alongside gallery + bigger session-rating stars.** Shipped v4.43 (cache v153, no SQL, no
new module). A small UX-polish slice, direct-built (no plan-gate). **Camera:** all five `.js-img-input`
photo-add spots (three session inputs, the social avatar, the tea photo) swap their single tap-anywhere
input for two labelled buttons from a shared `photoInputs()` (steep-core.js) — "Take photo"
(`capture="environment"`, camera on mobile / picker fallback on desktop) + "Choose" (the kept gallery input,
no capture); both `js-img-input`, so the unchanged `bindDynamic` handler wires both. Gallery never removed,
handler never changed; `.btn-photo` on `--line`/`--ink`, not the controlled `--clay`. **Stars — judgment
call:** every `renderStarsInteractive` call ALREADY passed `big=true` (`.starL` 22px), so "point the session
rating at the big variant" was a no-op against live code (flagged, challenge-don't-absorb). The intent
(bigger tap targets) shipped instead as a 32px tier scoped to `#sessRatingWrap` + `#editRatingWrap`;
half-stars untouched (the 50%-width hit-zones scale). Display size only, no model change. Fixtures can't
reach either surface → on-device `smoke.md §v4.43`. All 41 suites green. **NEXT: guided mode (D4, slice c) +
the "teas you return to" fast-follow; then SECURITY re-blocks before the beta widens.**

**R186 — photo field opens a source sheet (fixes the v4.43 photo control).** Shipped v4.44 (cache v154, no
SQL, no new module). R185's camera slice left the big "Add a photo" drop-zone inert and stranded the two
working buttons in a row beneath it, so the obvious target did nothing. Found on Niklas's phone-look, so
R185's `smoke.md §v4.43` never certified LIVE. v4.44 restores the field as the single tap target: tapping it
opens an in-app sheet (`photoSheet()`, the shared `.overlay`/`.modal`) with **Take photo** + **Choose from
library**. `photoInputs()` now renders only the two hidden inputs (one `capture="environment"` marked
`data-cam`, one gallery); `d_pickPhoto('cam'|'lib')` closes the sheet with a direct DOM remove — NO re-render,
so the field's hidden input stays the same wired element — then `.click()`s the matching one. New
`openPhotoSheet`/`closePhotoSheet`/`d_pickPhoto`/`photoSheet` + `state.photoSheetOpen` (in the back-guard).
**The one deviation from "fix once in `photoInputs()`":** the helper renders as a sibling after the field, so
it can't attach the tap handler itself. Each of the 5 `.img-upload` fields carries a one-line
`onclick="openPhotoSheet()"` pointing at the shared `openPhotoSheet`. Routing shared once; the fields just
point at it, so all 5 behave identically; the 90px avatar is a normal tap target. `.btn-photo` stays on
`--line`/`--ink` (no `--clay`); dead `.img-controls` removed; no browser prompt; no em dashes in the copy.
Interaction is device-only → `smoke.md §v4.44`; markup/routing/copy vm-checked, export-gate + 47 suites
green. **NEXT: unchanged — guided mode (D4, slice c) + the "teas you return to" fast-follow; then SECURITY
re-blocks before the beta widens.**

**R187 — colour system: the liquor ramp grows to 25 stops in six families + a net-new leaf ramp (the
guided-mode colour PRE-SLICE).** Shipped v4.45 (cache v155, no SQL, no new module). Step 1 of guided
tasting mode (D4), shipped ALONE and FIRST per the packaging ruling (Q6). Authority is
`docs/r5/planning/SPEC-colour-system.md`, reconciled from the R5 "Colour System" board and pushed
docs-only (`3930afc`). **Liquor:** 12 → 25 stops. The 12 originals are FROZEN (keys AND hexes byte-exact,
asserted in `liquor-test.js` A2b); 13 new landed where the ramp was thinnest (four greens, three reds),
both themes. `LIQUOR_FAMILIES` is the six-family picker grouping and `LIQUOR_KEYS` derives from it as the
one flat ramp order (membership + the clock sort); `liquorFamilyOf` maps key→family (Q5: the family label
is DERIVED, never stored). **Q2 (ruled): the type cascade stays COARSE** — the new stops are tier-1-only,
the catalog is NOT re-authored, so `liquorFor` and its 44 assignments are unchanged (C3 was split to assert
exactly that: the 12 catalog-occupied, the 13 tier-1-only). **Leaf:** a net-new `--leaf-*` set, nine colours
both themes, never merged with `--liquor-*` even where a key string collides (leaf `deep-green` is not liquor
`deep-green`); `mottled` is a tokenless split-swatch MODIFIER. `LEAF_KEYS`/`isLeafKey`/`leafGridCells` ship
ready, consumed by c1. **Picker:** the flat 13-cell grid becomes a two-step drill-down (`liquorGridCells`) —
a default/clear shade then six family rows, one open at a time (`liquorOpenFamily`, DOM-only), 44px shades,
the rest shown as their mini strip. 44px is the accessibility floor the spec mandates, SUPERSEDING R121's
22×22 for this control (25 stops in one row are ~14px, unhittable); the write-path mechanics (button/aria,
hidden input + dispatched input event, `isLiquorKey` gate, F1 containment) are unchanged, and G10 was
updated to assert the new geometry. **Test (Q3 ruled):** A3 is now a GLOBAL minimum-distance check in ΔE
(Lab, hue-aware) across every pair in both themes (min 4.91 light / 5.98 dark), which CLOSES the
swatch-model §9 two-arm open question — the luminance-only adjacency check was blind across arms, and ΔE
shows `straw`↔`gold-pale` reads comfortably clear. The luminance-monotonic A4 is retired (six families
break monotonicity: garnet is darker than mahogany); A3b is endpoint-aware (a ramp spanning near-white to
near-black has endpoints that sit near their grounds by design, carried by the swatch outline). **Q1
(validation is LIVE, not pre-lock):** the 13 new hexes ship provisional and are validated by Niklas against
a real cup and real leaf on the shipped ramp (`smoke.md §v4.45`); the 12 originals are frozen; keys-not-hexes
means any retune or drop is a token edit with no data migration. Closes the audit's "liquor ramp too thin"
backlog. Browser-verified in both themes (all 34 tokens resolve; the picker renders with real 44px targets
and DOM-only family drill). **NEXT: guided mode c1** — the `tasting_record` jsonb migration (alone and
first), then the c1 spine (both entry doors, the two registers, the reuse-existing stages, the verdict close).

### Also recorded (not rulings) — the frame ruling (map still held)

> **The board itself is BANKED, late — 2026-08-06, `docs/r3/boards/origins-frame-ruling.dc.html`.**
> Until then it existed only as a chat attachment, so this block was the whole of it that any lane
> could read, and the map was built to this summary rather than to the board. **This block is no
> longer the authority: the banked file is.** Two things it holds that no summary carried — the
> label side-switch (`const inner = f.x0 + 0.8 * f.w`) and the pin size (`pinPx` = 8, so r = 4 px at
> every render size) — were each reported as absent from the repo by a session that searched
> honestly and found nothing, because there was nothing to find. **Its badge says `R107`, which is
> already taken** (the completeness-panel deferral). **The ruling it carries is R110**, issued
> 2026-08-06 to give it the number it never had — cite that, never the badge.

- **Design chose direction 2**: country tier off the map, listed beside it; direction 3's 14 px merge
  rule attached; no edge indicator. Verified independently against their own frame function — scale
  **3.74 px/unit**, marks spanning **83%** of the card. Both exact.
- **One correction carried:** the tightest remaining gap is **23.0 px (Hoshino↔Kagoshima)**, not 24.5
  — that figure is Hoshino↔Chiran. It matters because 23 px is what the 14 px threshold is actually
  judged against, and the jump from Kagoshima↔Chiran at 3.3 px to 23 px is what makes 14 a **safe**
  threshold rather than a tuned one.
- **Two of the three owed items are answered.** The country-only count is **ten**: nine bare country
  strings (China ×5, Taiwan ×3, Thailand ×1) plus Moragella Oolong at `Ceylon, Sri Lanka`,
  normalising in under R16 — nine is the literal-string count, ten is post-normalisation, and R16
  governs. Which name leads a merged mark: per-region tea counts exist (Kagoshima 3, Chiran 1), so
  the larger count leads. **Still owed by Design:** the tie-break rule when counts are equal, and
  whether 14 px tracks pin width or is a constant.
- **The map does not resume until those land**, and **R45/R66's Passport removal stays behind it**.

### Also recorded (not rulings) — from the map fix (v4.08)

- **An unbanked authority is the round's most expensive failure so far, and it is a NEW shape.** The
  frame ruling board was never banked (see the note above the frame-ruling block), so H2 was built to
  a summary of it. The summary was accurate about what it carried; it simply could not carry a
  `const`. Three of the board's six numbered rules went unimplemented, and a later session searching
  for its two cited strings **correctly** reported them absent and reasoned from the superseded
  pre-direction-2 map instead. Failure modes 3 and 9 both describe *checking the wrong
  representation*; this is checking the right representation of a **document that was never
  admitted**. Counter: a board is not an authority until `git ls-files` says so.
- **The map's marks were drawn 3.7× oversized, and the cause is one line's worth of thinking.** Every
  dimension drawn over the outline was written as pixels inside a viewBox that runs at 3.727
  px/unit: a 29.8 px pin under an 18.6 px label, 24.2 px from its mark. **`originsMerge` was the only
  dimension that took the conversion** — one conversion existed and nothing else used it. Nothing
  numeric could see it, because every check asked where marks *are* and none asked where a label
  *ends*. Niklas found it by opening the map on a phone; R109 was the first of these, this is the
  second.
- **Japan's cut edge was a deviation, not a consequence — this lane recorded the opposite at v4.06.**
  The board's rule 2 expands the frame to the card's aspect; v4.07 drew the marks' own bbox and got
  350×193 instead of 350×258. The correction moves the scale to **3.743 px/unit**, nearer Design's
  published 3.74 than the 3.727 that shipped, and the 83% span is unchanged. The v4.06 entry above
  says the frame "follows from R19's bbox rule as ruled"; **it did not**, and that sentence should be
  read with this one.
- **Rule 6 has a hole, recorded rather than papered over.** "Fewer than two region pins: no map, list
  only" assumes the list exists. A shelf of one pinned tea and no country-tier ones has neither, so
  the screen would render a heading over nothing. Built with the empty state as the fallback; if
  Design wants something else there, it is one branch.
- **Deliberate deviation from rule 5, flagged because the board is now readable.** The side-switch
  flips when a label would not **fit**, not when its pin passes the outer 20% of the frame. Both
  rules flip the same two marks on this shelf. The fit test is only answerable for a monospaced face
  — which is presumably why a board with proportional serif labels used a position proxy.

### Also recorded (not rulings) — from the H2 non-map build (v4.05)

- **R55's offer is live and does exactly three things**: Gui Fei → `Lugu, Nantou, Taiwan`, Dawang Feng
  Da Hong Pao → `Wuyi Mountains, Fujian, China` (region inherited through `TT_INHERIT`), Ali Shan Fo
  Shou Dong Pian → `Chiayi County, Taiwan` with `(~1000-1500m)` stripped. R56 holds — no suggestion
  list, the field stays free text.
- **The package's country-conflict example is not the country-conflict case.** Oriental Beauty is
  described as the conflict (catalog Taiwan, shelf China); on this data it is rejected by the
  **single-place rule first**, because `Hsinchu / Miaoli, Taiwan` is a slash-pair. **The conflict rule
  is unreachable on live data.** Found by negative control — softening the conflict rule left the
  assertion green, meaning it passed for a reason it did not state. It is now isolated with a
  synthetic pair, and the control reddens. Same family as E6's typo-against-itself, caught before it
  was committed as evidence rather than after.
- **The three owed coordinate rows are still absent** (Wuyi Mountains · Lugu · Chiayi), so all three
  offerable teas stay in the country tier after an accepted offer. `tea-types-test.js` §I reports it
  from the file itself rather than leaving it to memory.
- **The map artifact is NOT committed.** Tolerance 1.0 and labels-from-shipped-geometry are the two
  findings to preserve verbatim when it resumes (see the frame ruling). The generator's home is
  proposed as `tools/`, tracked — it produces a shipped asset, so it is build infrastructure rather
  than a fixture, and `fixtures/` is ignored-by-default (R79).

### Also recorded (not rulings) — from the slice H1 build

- **Three #07 board claims, checked and NOT changed.** **SET2** needs no work: the false privacy line
  ("your tea stays on this device") is **not in shipped code**, and the three "on this device"
  phrases that do ship — the magic-link instruction, the diagnostics log, the theme row — are all
  true. The correction was to the board and it landed there. **SET3 — °F stays**, per the ledger's
  explicit confirmation, which outranks the board's "Niklas's decision to make"; `tempUnit` ships and
  is preserved under R61. **SET5 is void** per amended R48 — there is nothing to remove.
- **`statusLine` returns a structured reading, not a string.** Since B3 it is `{text, tone}`, and the
  first draft of the shopping rows interpolated the object — `[object Object]` on every row and on
  the rebuy line. Caught in the browser, not by a suite, because no suite renders that view. The
  single-writer instinct was right; the return shape had moved under it.

### Also recorded (not rulings) — from the slice G build

- **Two more expired board claims.** #08 rev 3 lists `totalGrams` + litres as a "rev 3 restoration"
  when both already ship in the totals card, and **R22's completeness panel exists nowhere** — on
  Insights or any other surface. Sixth and seventh this round, after #06's editables, #04's date,
  #02b's nav claim, #10's BUILD-FIRST stamp and #08 Social's Rou Gui example.
- **R100's tie behaviour has no live example** and that is the B3 0/21 shape, not a gap: on the
  08-05 export 08–10 leads at 16, Chiran at ×5, green at 20. The fixture can see it; the export
  cannot. Read the quiet as untested only where no fixture reaches it.
- **R102's pin holds against real user data.** Niklas's saved `dashLayout` carries genuine surface
  overrides (`hero` and `wrapped` moved to Home). `dashSurface('origins')` still returns `insights`
  under that override set, and the Origins card renders on Insights and not on Home — the pin
  verified against a real layout rather than a synthetic one.

### Also recorded (not rulings) — from the slice F build

- **The SHARED badge does not upgrade when `to_profile` ships.** "Until `to_profile` ships the badge
  says only 'shared'" reads like this slice changes it. It does not: those five rows are
  `sessions.is_shared`, a different object with no recipient. Only a *passed* row can name a person,
  and the surface says so in one line beneath the list.
- **The KINDRED line is the note riding with the pass, not a reply.** The board quotes *Ruth* — the
  sender — on the card of the cup she sent. A reply-back would be a second pass in the reverse
  direction and needs a screen nobody has designed. Build the note, not the thread.
- **`fixtures/teas_rows.csv` is a newer vintage than the rest of the set and lacks `opened_date`**,
  so B3's rung 1 is **structurally** invisible to fixtures rather than merely empty (the column the
  v3.11 migration added is not in the file at all). Every figure still reproduces and the gate is
  green. Full-set re-export at the next gate; not blocking.

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

> **Scheduled, 2026-07-26 (R93) — this is a queue, not a graveyard.** Every item below belongs to one
> of three destinations, and saying *when* is what stops "deferred" from meaning "dropped quietly".
>
> **→ R4** — the **liquor swatch** (with **#14**'s listbox and **R39**'s long-press correction, both
> blocked on it) and **Home**'s revision board. Both drifted out of R3 through individually-correct
> local decisions rather than any ruling.
>
> **→ The tea-reference content batch** — the **8 uncovered shelf teas**, the **3 owed coordinate
> rows** (Wuyi Mountains · Lugu · Chiayi), ~~and the **55 catalog liquor values** the swatch palette
> must derive from~~ — **the liquor values LANDED in v4.11**, all 55 rows assigned from
> `docs/r4/planning/SPEC-liquor-swatch-model.md` §8, eleven of them deliberately null. The first two
> also upgrade freshness precision from R85's **rung 3 to rung 2**, so that batch still pays twice —
> and the 8 uncovered teas now cost a **third** thing, the swatch, since a tea with no catalog match
> resolves at tier 3 and shows its type tint.
>
> **→ R82's OTHER never-written pin is still owed: the per-origin SCRIPT data model.** The swatch
> model is written; this one is not. Recorded separately so "R82's pins" cannot be ticked off as a
> pair when only one of them exists.
>
> **→ The Origins map artifact (R106) — OWED, BLOCKS H2.** Two pieces, in the same data file and
> under the same verification discipline as the eight coordinate rows:
> **(a) a simplified world outline as a static SVG path set**, derived once from Natural Earth
> (public domain) at 110m, **projected with the same Mercator forward the pins use**. The outline and
> the pins must share one projection or every pin lands wrong — silently, and worst at the latitudes
> this shelf actually uses — which is why **Code generates it and Design reviews the rendered result**.
> That is a correctness split, not a workload one. Build-time artifact, precached, no runtime
> dependency: R106's whole point.
> **(b) four country label points** — China · Taiwan · Thailand · Sri Lanka — precomputed
> pole-of-inaccessibility, stored as data rows with an anchor and a checkable source. R28's country
> tier is a mark placed inside the country's shape, and that placement is a *static* property, so it
> needs four stored points rather than runtime geometry.
> Recorded here because it existed only in a chat log, which is R74's shape: a task nobody inherits.
>
> **→ Post-beta or later** — presence (R35), the app icon, per-tea `ageing` (R86), structured
> brew-guide pills (R65), the origin suggestion list (R56), the vendor entity and URL (R52/R12),
> per-tea elevation, the sample flag, #22's taste-note placement (R57), and the phase-2 brewing agenda.
>
> **→ The beta-hardening bundle also inherits `landing.html` (R111).** A superseded surface on a live
> public URL, linked from nothing, contradicting the door that replaced it — and invisible precisely
> because nothing links to it. Delete, redirect to the door, or keep it deliberately and link it.
> It gates the public launch the same way the two items below do.
>
> **One item here is a correctness matter, not a feature: `delete-everything`.** Settings' privacy copy
> is **untrue until it ships**, and the beta welcome note must not promise deletion before then. It
> belongs with the **beta-hardening bundle** — it gates the public launch the way F1 and F2 do.

- **The greeting's COUNTED UNIT (R119) — a counted-unit item, not a copy item.** Recorded 2026-08-07;
  deliberately left out of v4.10 under R61, to be done once with the whole pool in view.
  **The defect is not word choice.** `steep-dashboard.js:900` — `const ord = d_cap(d_ordinal(todaySessions.length))`
  — is the app's **only** ordinal call site, and it counts **sittings**. Both labels attached to it
  name something else: under R119 a pour is one steep poured, and a steep is a steep. **Relabelling
  without fixing what is counted would just rename the same wrong number.** So the follow-up decides,
  per line, *which unit the sentence means* and *which count feeds it* — and the answers may differ:
  "a proper tea day" is plausibly about sittings, "steep in" is plainly about steeps.
  **The five lines, one call site:**
  | line | text | counted by :900? |
  |---|---|---|
  | `:902` | `${ord} pour today — a proper tea day.` | **yes** |
  | `:905` | `${ord} steep in — the leaves are well looked-after today.` | **yes** |
  | `:889` | `The <tea> instead — a lovely, unexpected pour.` | no — descriptive |
  | `:895` | `A good pour already behind you.` | no — descriptive |
  | `:908` | `A day of many pours; the kettle's glad of it.` | no — plural, uncounted |
  The two counted lines are the decision; the three uncounted ones are word choice and may well be
  fine as they stand. **A "pour" grep finds four of the five and misses `:905`**, which is the sharper
  contradiction — that is why this is filed by the number, not by the word.
- **Resuming an in-progress sitting cannot be a Home card** — **recorded 2026-08-07, answering the
  item the Home board left unproposed.** `state.sessionDraft` is **in-memory only**: nothing persists
  it, and `steep-core.js`'s `refreshData()` bails out early *because* it is volatile ("never refetch
  over unsaved work"). So the card has no state to read — if a draft exists you are already on that
  screen, and if you left the app it no longer exists. **Persisting a draft is a schema question, not
  a card**, and it would need its own ruling about what a half-finished sitting means when it comes
  back on another device. Filed here so it is a decision rather than a standing board note.
- **Country marks are not tappable and do not zoom** — **R4 candidate, recorded 2026-08-06.**
  Direction 2 made the country tier a list and specified no interaction beyond that, so this is not
  an omission. But it was never ruled *out* either, and the frame ruling board explicitly keeps the
  `? N` tap target's meaning ("those N teas, never all teas from the country") while moving it off
  the map — so the behaviour has a spec and no surface. Written down so it is a deferred decision
  rather than an unstated gap. Note the shipped list already opens each tea by name, which may be
  all the affordance the tier needs.
- **The merge rule's two open items stay open** — the tie-break when counts are equal (implemented
  as northernmost and asserted synthetically at `origins-test.js` B6, since no live tie exists), and
  whether `ORIGINS_MERGE_PX` should track pin width. The frame ruling board answers the second in
  prose — "it is one pin-width, not a constant" — but 14 px is not one width of an 8 px pin, so the
  sentence and the number disagree and the number is what shipped. Non-blocking.
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
