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
- Theme toggle gains **System**. `monoFont` (live in schema; one user has `"pixel"`) needs an
  expose-or-kill decision. Build stamp reads `892cb0b`; current `77cf800` — stamp from build,
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
- **Coordinates pass 3** — Kagoshima City, Sri Lanka, Hoshino (gazetteer), Kunming centre.
- **Pillar B (launch)** — decision closed by R29; install guide + beta package gated on R3 implementation, owners assigned.
- **Tea atlas Phase B** — after phase-2, per plan.
- **monoFont** — expose or kill (see Settings).
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
