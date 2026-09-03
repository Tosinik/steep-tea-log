# SPEC · Tea Tasting Mode (guided mode, D4) — FINAL

**Status:** design-complete. All decisions folded in from the R5 planning rounds and the cross-tradition
tasting research. Builds AFTER smart-restock (two big builds don't overlap). Data-model storage is the one
open build question for Code's plan-gate (§10).
**Naming:** the mode is **"Tea tasting"** (entry: "Start a tea tasting" / "Taste a tea properly"). **"Guided"
names only the walkthrough register.** Internal shorthand / filename stays "guided mode."

---

## 1 · What it is
A focused, opt-in mode to attend to a tea properly — new tea, a sample, or an old favourite. Not the
ordinary log with extra fields, and not a clinical evaluation. Attention on every step of the tea's journey,
ending in a personal verdict: what did I like, what didn't land, do I want more. Used on any tea. Opt-in,
abandonable, never leaks into ordinary logging (Tea-First).

**A verdict, not a grade.** No points, no scores, no boiling-water stress test. The "grade" is the personal
take, mapped onto fields the app already has (§8).

## 2 · Entry
- **Primary:** a STABLE Home door, sitting below the greeting — NOT rotating in/out, NOT tied to the
  greeting/insight rotation. (It sits a little oddly against the current app look; that resolves with the
  parked identity/journal pass — acceptable for now.)
- **Secondary:** a quiet link from session setup ("…or start a tea tasting").
- **Tea picker = step zero**, and it includes a tea NOT on the shelf yet (tasting a sample/new tea can
  create the entry — the bridge to the sample flag).

## 3 · Model
- A **session variant**, flagged on the draft alongside `isColdBrew`. Still a session (feeds ratings, the
  tea's history, Best Pour), just a variant flow.
- **Two registers on ONE skeleton**, user's choice per session: **"I know what I'm doing"** (terse capture,
  no hand-holding) and **"Guide me"** (same, plus per-step "what to look for" copy, §6).
- `brewStyle` reshapes ONLY the evolution stage (gongfu/senchadō multi-steep loop; western single-infusion
  "first sip vs. as it cools"; senchadō low-temp arc; **cold brew collapses to one result**, warmed-leaf
  room absent) and an optional aroma-cup sub-step (gongfu only). Everything else is constant.
- **Keep the shipped `FLAVOR_TREE`** (the ratified 12 families) for all aroma capture. Do NOT re-taxonomize.
- **NO rigid progress bar / "step N of 8"** — an adapting sequence of rooms.

## 4 · The seven-stage spine (+ evolution + verdict)
| # | Stage | Captures | Reuse / new |
|---|-------|----------|-------------|
| 1 | Dry leaf | FORM (chips, multi-select) + COLOUR (ramp) + optional free description | form = new observational chip set; colour = expanded ramp |
| 2 | Warmed / wet leaf | "what shifted?" from the dry leaf | lighter delta, not a full re-tag |
| 3 | Liquor colour | the colour seen NOW, once | per-session pick off the expanded liquor ramp (today `liquorFor` is tea-derived) |
| 4 | Liquor aroma | "what shifted?" delta | `FLAVOR_TREE` tagger; + aroma-cup (gongfu) |
| 5 | Taste | sweet · bitter · sour · umami; flavour notes | axes new (extends slice-b strip); notes → `FLAVOR_TREE` |
| 6 | Mouthfeel | body · astringency (level + quality, distinct from bitterness) | new |
| 7 | Finish | length · returning sweetness (huigan) | new |
| 8 | Evolution | per-steep rows + arc; or hot-vs-cool for one infusion | the per-steep path slice-b's D2 reserved (`curSteepTags`, `positions`) |
| — | Verdict close | session rating · offered overall-tea-rating update · would-rebuy · liked/didn't takeaway | §8 |

- **Dry leaf FORM** (chips, multi-select — one leaf can be twisted and wiry): needle · twisted ·
  rolled/balled · curled · flat/open · wiry · broken · downy. A NEW observational set — do NOT reuse the
  stored `leaf_form` (that's a brew-curve classification, wrong layer).
- **Dry leaf COLOUR** = a ramp (silver-down · jade · olive · deep green · golden · amber · chestnut · dark
  brown · near-black · mottled), expanded app-wide like the liquor ramp. **Its hexes validate against REAL
  leaf before locking** (matte leaf is harder than liquor; monitors flatter near-black-on-brown).
- **Aroma ladder:** full `FLAVOR_TREE` tagger at dry leaf; wet-leaf and liquor-aroma are lighter "what
  shifted?" deltas, not fresh full tags.
- **Hybrid axes (steps vs a worded intensity scale, per axis):** named discrete STEPS where levels are
  distinct (body thin/medium/full; astringency QUALITY); a LABELLED intensity scale (a slider with word
  anchors, "faint … pronounced") where it's pure felt-intensity that resists buckets (umami level,
  astringency LEVEL, finish length).
- **Palate position** = ONE field ("where you notice it"), framed loosely (the tongue-map is not literal).
- **Tradition lens, surfaced by tea type, default off:** a RE-READING of captures already made — umami /
  amami / shibumi / nigami are a lens on the taste + mouthfeel axes, NOT new fields. **hou-yun (throat) is
  the ONE genuinely new optional field**, on the finish room. Surfaced by tea type, never by method (a
  sencha brewed western is still a sencha). Black → briskness/body/pungency. **Cha qi is dropped.**

## 5 · Glossary (the ⓘ definitions — research-grounded, SHIP FROM THIS SPEC not the board glosses)
A one-tap ⓘ (reuse R180 `infoMark`/`toggleInfoPop`) on each tradition term, in BOTH registers. The board's
short glosses ("= YOUR SWEET") are the lens shorthand; the definitions below are the ⓘ content — Code pulls
these, not the board text. Plain house voice, no em dashes.

- **Umami.** The savoury, brothy depth that comes from a tea's amino acids, theanine most of all. Strongest
  in shaded Japanese greens like gyokuro. Closer to stock or seaweed than to sweetness.
- **Amami.** Sweetness. In Japanese greens it usually arrives alongside umami and rounds off the edges.
- **Shibumi.** Astringency, but the good kind. A pleasant drying grip that gives a tea its structure. Wanted
  in balance, not a fault.
- **Nigami.** Bitterness, mostly from caffeine. Usually the least welcome of the four, and the first thing to
  spike when the water runs too hot or the steep too long.
- **Astringency vs. bitterness.** Astringency is a feeling: a drying, puckering grip as tannins bind with
  your saliva. Bitterness is a taste. They often show up together, but they are not the same, and astringency
  can be lovely where sharp bitterness rarely is.
- **Huigan.** The returning sweetness. A sweetness that rises in the mouth and throat a moment after you
  swallow, and a prized sign of quality in Chinese teas.
- **Hou yun.** Throat feel. A cooling, opening sensation that carries down the throat and lingers, valued in
  aged and high-grade teas.

## 6 · Walkthrough copy (walkthrough register only; expert sees the field label)
Plain, de-AI'd, no em dashes.
- **Dry leaf:** "Tip the leaves into your hand. Whole or broken? What colour? Now smell. Fresh and sweet, or
  dusty and flat?"
- **Warmed leaf:** "After the first pour, lift the lid and smell the hot leaves. Then again once they've
  cooled a little. The scent shifts."
- **Liquor colour:** "Hold the cup over something white. How deep is the colour, and is it clear and bright
  or cloudy?"
- **Liquor aroma:** "Bring the cup to your nose, a few short sniffs. What does it bring to mind: flowers,
  fruit, fresh grass, toast?"
- **Taste:** "A bold sip with a little air, like soup, so it coats the whole mouth. Sweet, savoury, grassy,
  bitter? And where do you notice each part, front or back?"
- **Mouthfeel:** "Forget flavour for a moment. How does it feel? Light like water or thick like broth? Any
  drying, puckering feeling, and is that pleasant or harsh?"
- **Finish:** "Swallow, then wait a few seconds. Does a sweetness come back? How long does it linger? Is your
  throat smooth and open, or tight?"
- **Evolution (multi-steep):** "Taste each steep and notice how it changes. The early ones bright, the middle
  ones richest, the later ones softer and sweeter." **(single):** "Sip now, then again as it cools. Notice
  how it shifts."
- **Verdict:** "So, is this one to your liking? What did you love, what didn't land? Enough to want more?"

**Tea-aware copy:** adapt ONLY the objective cues by tea type (the colour range, temperature, leaf) — a
sencha's colour line reads "pale gold to jade," a black's "amber to copper." The aroma and taste prompts stay
generic and open. Never tell the user what flavours to expect.

## 7 · Arc across steeps
- The full phased arc ("open → core → fade", "opened up by steep 3") reads in the **record, afterwards** — it
  is a synthesis and needs all the steeps.
- In the room, only one quiet running line survives, an observation not a phase label: "Steep N was the
  fullest so far." **Floored at steep 2** (meaningless at steep 1; a "so far" needs two).

## 8 · The verdict close (existing fields, no new grade)
- **Session rating** (`session.rating`) — recorded automatically.
- **Overall tea rating** (`tea.rating`, "Your rating") — a proper tasting is where you form the considered
  verdict, so the close OFFERS to set/revise it, prefilled from the session rating, editable, declinable.
  Never a silent overwrite. Genuinely useful: Niklas forgets the overall rating, and this is when it's
  earned.
- **would-rebuy** toggle + a short **liked / didn't-like** takeaway.

## 9 · Data tiers
- **Tier 1 (ships), free:** aroma tags feed the tea's flavour profile via `FLAVOR_TREE`; the evolution stage
  produces the real per-steep data slice-b's D2 reserved; the verdict feeds rating + would-rebuy → Best Pour
  and the sample→restock decision.
- **Tier 2 (ships), light surface:** each tasting is a rich, revisitable **tasting record** — the full read +
  takeaway. Mostly rendering what was captured.
- **Tier 3 (banked, later):** the **palate signature** across many tastings, the insight-engine "why"
  reframe's flavour grain. Speculative on thin data; the insight round, not this build.

## 10 · Invariants & build questions
**Invariants:** Tea-First (opt-in, abandonable, KEEP THE PARTIAL on leave — never discard entered data, no
leak into ordinary logging, the overall-rating update is offered not forced); calm-first (no points/scores/
gamification, the walkthrough asks not lectures); single writers untouched (`setSteepTime`,
`freshnessReading`, `stockTier`, `swatchAttr`; `tea.rating` written only via the offered close); shipped
`FLAVOR_TREE` reused not re-taxonomized; escaping on all captured text; **no em dashes** in any shipping copy.

**Build questions (Code proposes at the plan-gate):**
- Storage of the tasting record — a JSON blob on the session (`tastingRecord: {...}`, present only on guided
  sessions) is the lean, vs. sparse columns. SQL-first if a new column.
- The per-session liquor-colour + leaf-colour ramps ship as **their own small token slice** (both ramps
  together, app-wide) — validated against real cup/leaf — separate from this build, consumed by it.
- Leaf FORM observation stays **per-tasting** for now (the tea has no appearance field; a tea-level field is
  a deferred nice-to-have, no SQL for it here).
- How the aroma tagger is scoped per stage without three stores muddying the profile.
- The evolution loop's relationship to `curSteepTags` and the `positions` reads.

## 11 · Slicing (Code refines at the plan-gate)
- **c1** — the spine + entry (both) + the two registers + the reuse-existing stages (aroma tagger, liquor
  colour, taste/mouthfeel) + the JSON tasting-record storage + the verdict close. The walkthrough working
  end-to-end.
- **c2** — the new axes fully fleshed (umami, astringency quality, palate position, finish/huigan) + the
  authored walkthrough content + the glossary ⓘ + the tradition lens.
- **c3** — the evolution-across-steeps per-steep loop (lighting up the D2 reads) + the `brewStyle` reshaping
  + the aroma-cup sub-step.

---

*Completes D4, closes wave-1 #3. Design board: `SlowCup R5 - Guided Tasting Mode.dc.html` rev 3. Builds after
smart-restock. Mints its own ledger ruling(s) on ship. Copy pulls from this spec, not the board glosses.*
