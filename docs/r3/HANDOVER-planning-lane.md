# HANDOVER — SlowCup planning lane, continuing R3

> **DATED SNAPSHOT — 2026-07-19, not current state.** Preserved as a point-in-time record of
> the planning lane at the R3-preservation commit. Its status / next-action sections (§1–§5, §8)
> go stale fast — e.g. §5 "nothing from R3 is in the repo" was resolved by the very commit that
> added this file, and §4 lists `TASK-delete-everything.md` as uncommitted just as it landed. For
> **current** state read `STATE.md` / `CHANGELOG.md`, not this. The durable part is **§6 (review
> method)** and **§7 (recurring failure modes)** — those two are flagged for promotion into
> `CLAUDE.md` as standing discipline (see the CHANGELOG follow-up note).

2026-07-19 · Written by the outgoing planning chat, for the incoming one. Paste this into a
fresh chat **in the SlowCup project** (so it inherits the committed files + memory), along
with Design's latest three files.

---

## 0 · What this chat is

You are the **planning lane**. Three lanes, and they don't mix:

| lane | does | never does |
|---|---|---|
| **claude.ai (you)** | decisions, review, reconciliation, specs | writes app code |
| **Claude Code** | implementation, deploys, fixtures | makes product decisions |
| **Claude Design** | visual design, boards, bundles | hands directly to Code |

Nothing goes Design → Code without passing through you first. That reconciliation pass is
the whole point of this lane, and it has repeatedly caught things that would have shipped
broken (see §6).

Niklas is the sole developer and only active user. Calm-first is a hard product constraint.

---

## 1 · Current app state

- **Live at v3.90**, HEAD `eb57661`, slowcup.app (GitHub Pages + Supabase).
- Vanilla JS, **no build step**, single `styles.css`, two themes via CSS vars.
- Recent ships: v3.86 stock tiers · v3.87 tea-reference Phase A · v3.88 greeting pass ·
  v3.89 per-steep strength feedback · v3.90 recency tune + soft cultivar check.
- **Phase-2 (brew advice) is gate-blocked** at ~3 of 15 ratio'd+feedback'd sessions. The gate
  fills passively as Niklas logs. Nothing to do but wait.
- `/slowcup-deploy` (dry-run first) is the only deploy path. Verification ritual: fresh clone,
  all fixtures with real CSVs, codepoint sweep, version/cache lockstep.

---

## 2 · Where R3 stands (the active work)

**Direction D · 摺物 Surimono is LOCKED** — "B plus a few contracts": a typeset tea-diary
skeleton with rationed material moments. Chosen over A (traced-teaware pipeline had failed
its quality gate twice), C (loudness discovered late), and B (Niklas found it boring).

### The five pinned contracts (invariants — check every board against these)
1. **liquor swatch = identity only**, never decoration
2. **clay = one committing action per screen**, never selection
3. **xanthous marker = state**
4. **Kachi-iro blue = Focus ring only**, one surface total
5. **washi band = Home masthead only** (on probation)

### Build queue — Design's numbering
- `#01` Settings privacy copy — ✅ (copy corrected; delete-everything committed to build)
- `#02` Sessions + Session detail — ✅ locked
- `#02b` Session detail rev 2 + edit-session — ✅ locked
- `#03` Tea detail — ✅ locked (rev 3)
- `#04` Session setup + tea/vessel pickers (closes #14) — ✅ locked (rev 2)
- `#05` Vessel library + add/edit — ✅ locked (rev 2)
- `#06` Add/edit tea + swatch picker — ✅ locked (rev 3+, freshness rippled in)
- **`#07–08` refinements — NEXT.** Settings restorations + icon semantics · Shopping
  running-low/wishlist split + clear-acquired · Insights period selector + restore
  cost/when-you-brew · Origins neutral pin + global scope + tap-to-navigate · Social screens
  (concept approved, screens unbuilt)
- `#09` First-run · empty states · **login/migration screens** (found missing late)
- `#09b` **Bundle 1 conformance audit** — a bounded sweep before hand-off (see §7)
- `#10` Joint Code hand-off

**App icon (#10 in issue terms) is PARKED** — 12 concepts rejected across 3 rounds; the brief
was over-constrained. Splash parks with it. Two rulings stand for whenever it resumes: the
icon sits outside the interaction contracts but honours Kachi-iro's scarcity; the ensō
belongs to the timer exclusively.

---

## 3 · The hand-off pins (everything goes to Code TOGETHER, once all bundles lock)

Nothing R3 goes to Code piecemeal. At hand-off these become build specs:

| pin | status |
|---|---|
| **Swatch 3-tier data model** (user-set → catalog default → none/script plate) | specced in R3 boards |
| **Per-origin CJK script model** (catalog-sourced, never transliterated) | specced |
| **Freshness model** (`opened_date` → harvest → no reading; per-type catalog windows; ageing flag) | `SPEC-freshness-model.md` — **NOT COMMITTED, see §5** |
| **Five contracts as invariants** | above |
| **Per-steep `tempC`** | from #04 |
| **Ensō brush animation** (stroke-along-path / clip reveal) | own build slice |
| **Origins map data-path** | region → coords, neutral pin |
| **New capabilities to build** | "Brew this again", "Duplicate as new sitting", pass-to-circle, tea-together (pull), erase-everything, "Borrow from Go Deeper" |
| **Schema questions flagged, not assumed** | method 5-shown-vs-3-stored (is_cold_brew boolean vs brew_style text vs matcha nonexistent) · capacity unit · vessel image path · brew_guide free-text-vs-structured · `teas.opened_date` · elevation column |

---

## 4 · Separate committed work, not R3

- **`SPEC-brew-advice-v3-feedback.md`** — phase-2 A2 capture control. Shipped as v3.89.
  Post-gate work (learned defaults, senchadō method append) waits for the gate.
- **`PHASE2-PRESPEC-NOTES.md`** — carries the **Tea-First Principle**: "SlowCup is for
  drinking tea, not serving the app." No feedback tap is ever required; a zero-feedback
  session is a complete, un-nagged outcome. This ranks *above* data completeness. Check
  capture UI against it.
- **`TEA-*.md` (4 docs)** — the reference catalog. Phase A shipped (v3.87, 55 types,
  `steep-tea-types.js`). Phase B (browsable "Go Deeper" page) held until phase-2 ships.
- **`IDEA-tasting-mode.md`** — parked idea, committed.
- **`TASK-delete-everything.md`** — committed to build, **not yet built**. Needed before the
  Settings privacy copy is true (export exists; delete does not). Not committed to repo.

---

## 5 · ⚠ NOTHING FROM R3 IS IN THE REPO — fix this first

**This is the biggest risk in the project right now.** Verified 2026-07-19: the only
R3 artifact committed is `R3-BRIEF.md`. Everything else — six-plus screens across many
revisions, every reconciliation decision, both of Design's structural docs, and one of the
hand-off pins — exists **only in Design's workspace and a chat transcript.**

And `.gitignore` is actively enforcing it:
```
# Design-reference bundles (READMEs + .dc.html + PNGs) live local-only, never shipped.
design-r3/
```
That rule was written in R2, when bundles were *inspiration reference*. R3's bundles are the
**spec Code builds from**. The rule now excludes exactly the thing that must survive.

This contradicts the project's own standing principle — *knowledge lives in committed files;
session memory is disposable*. Months from now, "why does Tea detail look like this?" has no
answer in the repo.

### What must be preserved, by kind

**Text — small, highest value, commit all of it:**
- Design's own: `R3-SURFACE-INVENTORY.md`, `R3-CONNECTION-MAP.md`, and Design's
  `SPEC-freshness-model.md`
- Planning lane's: `SPEC-freshness-model.md` ← **a hand-off pin** ·
  `TASK-delete-everything.md` (decision made, unbuilt) · `R3-DIRECTION-LOCK.md` ·
  `R3-BUNDLE1-RECONCILIATION.md` · `R3-BUNDLE1-REV4.md` ·
  `R3-BUNDLE2-RECONCILIATION.md` · `R3-INVENTORY-RATIFICATION.md` ·
  `R3-SESSIONS-RECONCILIATION.md`

**Boards — the visual spec:**
- **Commit the preview PNGs** (~0.8–1 MB each, ~10 screens). These are what review actually
  used, and they're the visual record Code needs.
- **Skip the `.dc.html` / standalone bundles** — ~10 MB each (inlined runtime), and the PNG
  carries the same reviewable content. If a live artifact is wanted later, Design can
  re-export.

**Amend `.gitignore`** so locked R3 bundles are no longer excluded. Keep ignoring raw
inspiration and working files; stop ignoring the spec.

### Recommended first action for the new chat
One docs-style commit (no version bump): all the text above + the locked-bundle PNGs + the
`.gitignore` amendment. Then re-check that Design's newest three files are included.

---

## 6 · The review method (this is what's been working — keep doing it)

**Verify, don't accept.** Every Design claim gets checked against the live repo or the real
data before approval. This has caught major issues repeatedly.

Principles that have done the work:

- **Never guess.** When data can't ground a reading, show *nothing* — not a default, not a
  zero. (Swatch Tier-3, `freshnessWeeksLeft()` null-when-ungrounded, "not tracked ≠ empty".)
- **Three-tier pattern** for anything catalog-backed: **user value → catalog default → no
  reading**. Applies to swatch colour, per-origin script, freshness windows, and (next) rinse.
- **Prominence follows load-bearing, not fill rate.** Tea `type` is the catalog join;
  `purchase_date` anchors the stock curve + ledger rate + cost-by-month. Both earn placement
  beyond their fill.
- **Use variance, not fill rate.** Booleans are always "filled"; `purchase_type` is 100%
  filled and 100% the same value (`"first"`) — i.e. dead. `water_tds` is 0%.
- **Calm ≠ absent.** Capability must survive behind quiet affordances (dropdowns, overflow
  menus), not be removed for tidiness.
- **Sparse states adapt, never vanish** (Design's TD9 — good rule, apply everywhere).
- **Flag new capability, don't assume it.** Design now keeps a "hand-off flags" box per
  screen — insist on it.
- **Copy register is observational, not prescriptive.** "quantity not tracked" / "a few cups
  left" state facts. Avoid telling the user what matters.

### Useful data you'll need repeatedly
Real fill rates (14 teas / 12–24 sessions / 3 vessels — CSVs in the project base):
- Teas: name·type·stock·rating·cost·is_favorite·would_rebuy·purchase_type **100%** ·
  image_data **92%** · origin·source **92%** · brew_guide **78%** · leaf_form **42%** ·
  purchase_date **35%** · harvest_season **28%** · cultivar **21%** · harvest_year **14%** ·
  description **0%**
- Caveat: `purchase_type` is 100% *"first"* (no variance); `would_rebuy` only 2/14 true;
  `is_favorite` 5/14 true.
- Sessions: `water_tds` **0/12** · `water_type` **2/12** · `photo_url` **5/12** ·
  `mood` **3/12** · grams·rating·is_shared **12/12**
- Real `leaf_form` values: `green_jp · compressed · rolled · open · bud` (8 empty)
- Real vessels: Dragon Gaiwan (gaiwan/clay/110ml) · Main Kyusu (kyusu/clay/210ml) ·
  Hario Coldbrew (cold brew jar/glass/750ml) — all three have photos

---

## 7 · Recurring failure modes (watch for these)

1. **Design invents mock data instead of reading it.** Three instances: `spring · 45ppm` made
   a dead field look populated; "tea images are rare" (they're 92%); a four-vessel roster that
   matched nothing real. Two had design consequences. **Ask "did you check, or estimate?"**
2. **Connective tissue gets under-covered.** Headline screens land well; forms, pickers,
   detail pages, empty states and nav homes get missed. Caught in three separate rounds
   (nav completeness → surface inventory → connection map).
3. **Rejected decisions get quietly revived.** The traced-teaware line-art — which
   disqualified Direction A — reappeared in the vessel picker via an inventory assumption that
   "vessel art already exists."
4. **Features silently removed in the name of clean.** The quick-log "+", Library
   search/filters/favourites, session edit/delete, the inventory sparkline. All restored after
   being caught.
5. **`#09b` conformance audit exists because of all of the above.** Bundle 1 locked before
   these lessons; sweep it before hand-off with four questions per screen: does it carry all
   stored data for its entity? are its connection-map links drawn? does it handle its variants
   (cold brew, steepless/matcha, empty)? are invented features flagged?

---

## 8 · Immediate next actions

1. **Preserve R3 — nothing of it is in the repo (§5).** One docs-style commit: all planning
   + Design text docs, the locked-bundle preview PNGs, and the `.gitignore` amendment so
   `design-r3/` no longer excludes the spec. Do this before anything else; a lost chat
   currently costs the entire design round.
2. **Review Design's latest three files** (Niklas has them) — the closures on the freshness
   ladder, the oolong ageing flag, the copy reword, and the rinse hand-off flag.
3. **Rinse research (planning lane's job, agreed).** Whether a tea benefits from a rinse is
   type-dependent and partly contested — compressed puer and aged/roasted teas usually yes;
   delicate Japanese greens usually no (a rinse throws away the best infusion). Ground it,
   then seed per-type catalog values **using the same three-tier pattern** (catalog default →
   user override → no suggestion), marking contested cases as contested. Becomes an addendum
   to `SPEC-freshness-model.md` or its own short spec. **Niklas will help with research and
   guidance.**
   Also flagged: `brew_guide` is free text parsed by regex into `{tempC, rinseSeconds, times}`
   — since Design made it editable per-step, decide whether editing serialises back to a
   parseable string or the field migrates to structured storage.
4. **Then #07–08 refinements** continue with Design.

### Niklas's own open items
- Phone-check v3.89/v3.90 (per-steep tap quietness; greeting no longer re-suggesting)
- Supabase allowlist cleanup (delete old github.io redirect URL — cleared to do)
- Keep logging to fill the phase-2 gate
- Small library data fixes: Guangdong typo · Alishan `harvest_year = "-"` → null

---

## 9 · Read these first (all committed)

`STATE.md` · `CLAUDE.md` · `R3-BRIEF.md` · `PHASE2-PRESPEC-NOTES.md` ·
`SPEC-brew-advice-v3-feedback.md` · `DESIGN.md` · `ROADMAP-v4.md`

Then the CSVs in the project base for real data, and `steep-tea-types.js` for the catalog.
