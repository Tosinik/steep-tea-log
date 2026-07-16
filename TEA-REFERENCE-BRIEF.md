# Tea reference data & naming inference — brief

> ## ⚠︎ RECONCILIATION NOTE — read before using this brief (added 2026-07-15)
>
> This brief's **design intent is current and remains the north star.** Its **data model and coverage status
> are superseded** by later fact-check/authoring work now captured in **`TEA-TYPES-SEED.md`** (58 rows, 7
> authoring batches, all six families). Treat the **seed as the source of truth for the data shape and rows**;
> treat this brief as authoritative for *why* and for the UX.
>
> **Still authoritative here:** §1 (why), §2 (names don't compose), §3 (token→confidence mapping), §7 (the
> "tell me about this tea" surface) and §7a (navigation — two doors, labelled return chip, place-not-popover,
> lateral links). The detail/nav design renders whatever the rows contain, so it is unaffected by the model
> changes below.
>
> **Superseded / stale here — defer to the seed:**
> 1. **§5's schema sketch is flat; the real model is two-level.** Add `parent_id uuid null references
>    tea_types(id)` — **parent classes hold the processing facts, member rows inherit them** (e.g. parent
>    "Wuyi Yancha" → members Da Hong Pao, Rou Gui, Shui Xian…). This parent/member split is the seed's central
>    structural finding and is absent from the sketch.
> 2. **"Attributes-not-classes" is missing.** Roast, oxidation, shading, steaming depth, harvest, bug-bitten,
>    smoked, drying, compression, flavoured, terroir, vintage are **cross-cutting attributes**, not fixed
>    columns or separate classes. Prefer an `attributes` (jsonb) field over widening columns.
> 3. **Coverage status is out of date.** §6/§8 say black + pu-erh are still to author and "oolong/green/white/
>    yellow done." **All six families are now authored** — black (hong cha) and pu-erh (hei cha: sheng + shou)
>    included.
> 4. **Scale:** "~15–25 rows" → now **58 rows**. (The "~50–80 rows cover almost everything" target still holds.)
> 5. **Not yet reflected here:** the processing-term **exclusivity audit** (a shared technique-word such as
>    *tan bei* or *zuo qing* in a name is **never** a class fingerprint — it names a technique used across
>    families) and the expanded **naming-trap catalogue** (Anji Bai Cha is *green* not white; English "black" =
>    hong cha vs Chinese "hei cha" = pu-erh; "Rou Gui"/"Shui Xian" each name two different teas; pu-erh numbers
>    are recipe codes; "souchong" = xiao zhong; "milk/ginseng/lychee" = flavoured). These live in
>    `TEA-TYPES-SEED.md` (the audit + batches) and `TEA-HANDBOOK.md` §6.
>
> **Companion docs that post-date this brief:** `TEA-TYPES-SEED.md` (data + source of truth),
> `TEA-HANDBOOK.md` (proofed learner prose = the in-app copy source), `TEA-REFERENCE-HANDOVER.md`
> (implementation plan, R3 sequencing, open decisions, Code kickoff). **Read this brief for intent, then the
> handover for the plan.**

**Status:** draft for review (planning lane). Implementation → Claude Code once shape is agreed.
**Author context:** written in the claude.ai planning lane after a live fact-check session. Everything
marked *(verified this session)* was corroborated across ≥2 independent, non-single-vendor sources.
Everything marked *(unverified)* is from general knowledge and must be checked before it's written into
any shipped reference row.

---

## 1. Why this exists

A tea shop pointed out that our name-based inference (autodetect type/leaf-form/etc. from a tea's name)
will silently mis-fire on compound names like **Dong Ding Gui Fei**. They're right. This brief captures
(a) *why* names don't compose cleanly, (b) a token→field→confidence mapping worked against our real
library, (c) an audit of what our tea data actually contains today, and (d) a proposal for a **reference
("class") layer** so the app can go from a library tea → a browsable, generalized entry for that *kind*
of tea.

## 2. The core finding: names carry class info unevenly

A tea name is usually **place + style + cultivar + poetry**, welded together, and the tokens don't agree
about what they imply. The single most useful distinction to encode:

- **Leaf shape** is *mechanically* inferable and reliable. If the style-token says ball-rolled or
  strip-twisted, that almost always holds.
- **Roast / oxidation** is a *maker's choice* and is **not** reliable from the name. The same named tea
  ships roasted, unroasted, and new-style depending on producer and year.

Worked example — **Dong Ding Gui Fei**:
- *Dong Ding* is a place (a mountain in Lugu, Nantou) that has **also become a style** — it's now made
  outside the namesake mountain using the same processing *(verified this session)*. It implies
  ball-rolled = **reliable**; it implies roasted = **unreliable** (traditional Dong Ding was *unroasted*;
  roast became standard later via merchants and the Lugu competition; "new style" skips most roast).
- *Gui Fei* is a processing style: an **insect-bitten (leafhopper) oolong**, the honeyed cousin of
  Oriental Beauty, usually ball-rolled and lightly-to-medium roasted *(verified this session)*.
- **The trap:** a parser keying on "Dong Ding" infers roasted-ball-oolong and **silently drops the
  bug-bitten quality that is the entire point of a Gui Fei.** Key on "Gui Fei" and you lose the terroir.
  The tokens conflict, and "Gui Fei" is poetic (after Yang Guifei) so it encodes nothing mechanical.

### Epistemic buckets (the method to reuse everywhere)
Sort every claim before trusting it:
1. **Verifiable fact** — botany, chemistry, geography, leaf shape. Check against tea-science / reference
   sources, *not* sellers. (e.g. leafhopper bites trigger the plant to release volatile compounds; that
   defense chemistry — not the bug — is what you taste. Verified this session.)
2. **Vendor / label claim** — this tea's origin, harvest, oxidation, roast. Corroborate across
   independent sellers; accept it may be marketing.
3. **Folklore** — origin legends (e.g. Gui Fei "invented after the 1999 earthquake"; Da Hong Pao's
   red-robe scholar). Note it, never bank on it — at least one source says the Gui Fei idea predated the
   quake.

This maps directly onto the two data layers proposed in §5: the **reference layer holds bucket-1 facts**;
the **library (instance) layer holds bucket-2 vendor claims**.

## 3. Token → {field, confidence} mapping — worked against the real library

Confidence: **H** = write it / auto-suggest; **M** = suggest but flag for confirm; **L** = do not infer,
ask. Never auto-*commit* — prefill + confirm only (consistent with IDEA-label-scanner.md).

| Library tea | Token type(s) | Reliable (H) | Flag/confirm (M) | Do-not-infer (L) |
|---|---|---|---|---|
| **Honey Oolong Gui Fei** | style (Gui Fei) | oolong; bug-bitten; ball-rolled | roast light–med; ~40–50% ox | exact cultivar; origin sub-region |
| **Dong Ding Gui Fei** *(the shop's example)* | place-as-style + style | oolong; ball-rolled | roast (traditional=none / std=med / new=light); ox 15–40% | which token wins for brew guide |
| **Dawang Feng Da Hong Pao** | place (Dawang Peak, Wuyi) + famous-name | oolong; **strip-twisted (NOT ball)**; charcoal-roasted; Wuyi origin *(verified)* | 40–70% ox; **may be a Shui Xian+Rou Gui blend** not single-cultivar | true cultivar lineage |
| **Oriental Beauty** | style (Dong Fang Mei Ren) | oolong; bug-bitten; **strip/twisted**; heavily oxidized (~60–80%); **not roasted** *(verified)* | cultivar (Qing Xin Da Mao "best", but varies) | — · **DATA FLAG: our row says origin "China"; canonically Taiwan/Formosa — confirm label** |
| **Yashi Xiang Dancong Guandong** | region (Guangdong/Phoenix) + aroma-type | oolong; Dan Cong = Phoenix Mtn, Guangdong; strip-twisted; roasted *(region/shape verified)* | "Ya Shi Xiang" = *aroma type* not cultivar *(unverified)* | single-bush claims · (typo: "Guandong"→Guangdong) |
| **Ali Shan Fo Shou Dong Pian** | place (Alishan) + cultivar (Fo Shou) + harvest (Dong Pian) | oolong; Alishan = Taiwan high-mountain; ball-rolled *(unverified — high prior)* | light ox; usually unroasted; "Dong Pian" = winter off-season pick *(unverified)* | Fo Shou cultivar specifics *(unverified)* · (row has junk harvest_year "-") |
| **Ruby Ruanzhi** | marketing token + cultivar | oolong (as typed); Thailand | **"Ruby" evokes Ruby-18/Hong Yu, a *black* tea — conflicts with "Ruan Zhi" (= Qing Xin, oolong)** *(unverified)* | which the tea actually is — confirm label |

**Rule of thumb for the engine:** infer **shape** with confidence; treat **roast/oxidation** as
suggest-and-confirm; when a place-token and a style-token co-occur, **flag the conflict rather than
picking a winner**; never infer brew parameters from a poetic name.

## 4. What the tea database actually contains today

**Schema (`teas`)** captures the *instance*: `name, type (enum: green|black|oolong|puerh|yellow|white),
amount_grams, rating, harvest_year, harvest_season, origin, cultivar, source, cost_*, brew_guide,
description, is_favorite, would_rebuy, purchase_type, image_data, purchase_date, leaf_form`.

**Population audit (13 real teas; 1 "Test" row belongs to a different user_id — the beta/allowlist
account, not the main library):**

- **Well-populated:** `name`, `type`, `amount_grams`, `source` (vendor), `is_favorite`, `would_rebuy`,
  `image_data`, mostly `brew_guide` and `rating`.
- **Sparse:** `harvest_year` (~2/13 meaningful), `harvest_season` (~4/13), `cultivar` (3/13 — often the
  cultivar lives *inside the name* but not in the field, e.g. Fo Shou, Ruan Zhi), `leaf_form` (~6/13),
  `cost_total` (several 0).
- **Coarse:** `origin` — many rows are just "China" / "Taiwan" / "Japan" with no region.
- **Unused:** `description` — **0/13 populated** (empty across the board).
- **Unstructured:** `brew_guide` is free text with no consistent format ("75°C, 1 min --> 30s" /
  multi-line / "3-4g, 90s, 95°C"). Already parsed heuristically by `parseBrewGuide`, but fragile.

**The structural gap:** there is **no class/reference layer**. "This is a Gui Fei" exists only as free
text in `name`. `type` is just the 6-family enum. So every generalization the app wants to make (leaf-form
curves, brew defaults, "more about this kind of tea") has to be *re-derived from a string* every time —
which is exactly what breaks on Dong Ding Gui Fei.

### Data-quality flags to fix regardless of the bigger feature
1. **Oriental Beauty** `origin = "China"` → canonically Taiwan/Formosa. Confirm against the label.
2. **Ali Shan Fo Shou Dong Pian** `harvest_year = "-"` → junk placeholder; should be null.
3. **Ruby Ruanzhi** — resolve the "Ruby" (black? Ruby-18) vs "Ruan Zhi" (oolong cultivar) conflict.
4. **Da Hong Pao** `origin = "China"` → could sharpen to "Wuyi, Fujian".
5. Typo: "Guandong" → "Guangdong".

## 5. Proposal: a reference ("class") layer teas can link to

Add a **shared, read-only** table of canonical tea *types* that library teas optionally point at. This is
the "scroll from my tea to a generalized entry for that kind of tea" feature.

**Why it fits SlowCup's constraints:**
- **Calm-first / opt-in:** reference is a *suggestion* and a place to browse, never an imposed autofill.
- **Single-writer discipline:** class facts (shape, mechanism, typical ranges) live in **one** place —
  the reference row — instead of being re-parsed from names across surfaces. This is the same principle
  that fixed the stock-tier bugs.
- **No heavy infra:** ship it as a **curated seed** (JSON or a plain Supabase table). A new table is not
  heavy. No Edge Function, no per-call cost, works offline — unlike the label scanner.
- **Clean epistemics:** reference = verified bucket-1 facts; library tea = bucket-2 vendor claims. The
  two never contaminate each other.

**Sketch (for discussion, not final):**

```
tea_types (            -- global, read-only to users (RLS: select-all, no user writes)
  id, slug,
  display_name,
  aka          text[],   -- Gui Fei / Concubine / Honey Scent Oolong
  family       text,     -- maps to existing type enum where possible
  region       text,     -- Nantou, Taiwan
  leaf_shape   text,     -- ball-rolled | strip-twisted | needle | bud | ...
  oxidation_low int, oxidation_high int,
  roast        text,     -- none | light | medium | heavy | variable
  signature    text,     -- short: "bug-bitten honey"; "mineral yan yun"
  typical_brew jsonb,    -- structured range → feeds parseBrewGuide / leaf-form curves
  confidence   text,     -- canonical | contested (e.g. Da Hong Pao blends)
  notes        text
)

teas.tea_type_id  uuid null references tea_types(id)   -- opt-in link; blank = unclassified
```

**How it connects to existing roadmap items:**
- **Leaf-form inference (shipped v3.29 + parked beta item):** a linked `tea_type` gives leaf-form for
  free instead of parsing the name — retires the "infer from cultivar/origin not just name" beta backlog
  item by making it a lookup.
- **Label scanner (Tier 3, IDEA-label-scanner.md):** the scanner's structured JSON output can *match to a
  `tea_type`* as the final step, turning a raw label read into a classified tea.
- **Cultivar map / passport (Tier 3):** reference `region` feeds the map without re-deriving geography per
  tea.
- **Brew advice / learned defaults:** `typical_brew` gives a principled starting baseline per class before
  the user has enough sessions to learn their own.

**Build order (cheap → richer):**
1. Seed ~15–25 reference rows covering *what's actually in the library today* (oolong-heavy). Hand-authored,
   fact-checked, small.
2. Add the nullable `teas.tea_type_id` + a manual "what kind of tea is this?" picker on the tea form
   (opt-in, confirm-only).
3. Add the browse surface: from a tea detail → "About [Gui Fei] oolong" reference card → siblings in the
   library of the same class.
4. *Later, only if wanted:* soft name-matching to auto-suggest a `tea_type` (using §3's confidence rules),
   still confirm-only.

**What to explicitly NOT do:** don't auto-write roast/oxidation from names; don't generate reference rows
via LLM at runtime (that's the scanner's job and it's online-only/costly); don't let reference override a
user's own logged brew guide — reference is the *fallback/for-reference*, the user's data wins.

## 6. Update strategy — how the library stays current without becoming a chore

The instinct is a false binary: *hand-maintain forever* (painful) vs *auto-build from user data* (doesn't
really work). Two reframes dissolve it.

**(a) The class set is convergent, not a firehose.** This is a *taxonomy of tea types*, not a SKU catalogue.
~50–80 rows cover almost everything a specialty drinker buys. Once the six families are seeded, new teas
overwhelmingly map to rows that already exist. Manual authoring is a bounded up-front hump, not a treadmill.

**(b) Split "detecting a gap" from "authoring a row."** Only one of these must be manual. **Detection is
automatic; authoring stays gated.** That is the real answer to "do I have to flag it myself?" — *no, the app
flags it for you.* The gap detector is literally the name-matcher returning "no confident match": you
already need that matcher to link teas → classes, so when it comes back empty, the tea drops into a small
**unclassified queue**. You never hunt for holes; you fill them when you feel like it.

**Why building the class layer from user data is the weakest source (now):** you have ~one user, so there's
no crowd signal to aggregate; and user data is *vendor claims + free text*, not verified facts. Aggregating
vendor copy gives you aggregated marketing — collapsing the fact-vs-claim separation that made the reference
layer worth building. User frequency is a fine signal for **prioritising which class to author next**, never
a source of class *truth*.

**The ladder (build order):**
1. **Now** — hand-authored seed (oolong/green/white/yellow done; see TEA-TYPES-SEED.md). Add black + pu-erh
   when a matching tea arrives. Bounded.
2. **Cheap next** — the **gap detector**: auto-flag unmatched teas into a queue. Automatic detection, manual
   authoring. This is the piece that makes it *feel* self-updating.
3. **Later** — when the label-scanner Edge Function exists anyway, have the LLM **draft** a new row for you
   to confirm. Authoring becomes *reviewing*, not *writing*. Gated, fact-checked, never auto-committed —
   Dong Ding Gui Fei is exactly why a confident draft can be confidently wrong.
4. **Far future (many users)** — frequency ranks gaps; maybe community proposals, but that flirts with
   gamification, so watch the brand.

**Also part of "continuously update":** rows must be **editable, not just addable** — facts refine (we
hedged Dong Ding's roast and confirmed Ruan Zhi as oolong this session). Cheap on a small table; version or
timestamp edits so corrections are traceable.

**Net:** automate *detection*, keep *authoring* human (optionally LLM-drafted), let user frequency
*prioritise*.

## 7. Detail entry point — the "tell me about this tea" surface (new + experienced users)

**The goal:** a newcomer who just added a tea can tap *"Curious about this tea?"* and be walked into the
story — how it's made, where it's from, why it's famous, what's special (the leafhoppers behind Oriental
Beauty, the rock-rhyme of yancha). An experienced drinker gets terroir/cultivar/processing depth they can
even contest. **Possible? Yes — and the reference layer already is its engine.** The "more details" view is
just the browse surface (§5 step 3) rendered richly.

**How it works:** the tea's library entry links to a `tea_type` row → that row *is* the content. The seed
rows already carry the raw material: `signature`, `region`, processing (`leaf_shape`/`oxidation`/`roast`),
`typical_brew`, `notes`. To make it read like a *story* rather than a spec sheet, extend the reference
schema with a few short **narrative fields**, authored the same fact-checked way:

```
processing_note  text   -- "Steamed, not pan-fired — that's what keeps it green and grassy."
origin_note      text   -- terroir / place, why it grows there
why_famous       text   -- the hook: bug-bitten honey, imperial tribute, rock rhyme, 700-yr-old bushes
special          text   -- the one surprising thing (leafhoppers; men huang; never-bitter Ya Bao)
```

**The card, structured for progressive disclosure (calm-first):**
- Sits behind one unobtrusive affordance on the tea detail page — invisible to anyone who doesn't tap it.
- Sections: **What kind of tea** (processing) · **Where it's from** (place/terroir) · **Why it's notable**
  (the story) · **How it's usually brewed** (typical_brew as a *reference*, never overriding the user's guide).
- **Two tiers in one card:** the structured facts serve newcomers; a "go deeper" reveal (cultivar debates,
  oxidation ranges, contested points) serves the experienced. Same data, layered.

**Why this differentiates the app:** it's the on-ramp for beginners ("why is this special?") *and* the depth
hook for enthusiasts — from a single reference row. It's also where the LLM-draft-then-confirm pipeline earns
its keep: drafting a two-sentence `why_famous` is exactly the kind of prose worth generating and approving,
never auto-publishing (a confident-but-wrong origin legend is the risk — mark folklore as folklore).

**Constraints to hold:** opt-in and quiet (no pushed "did you know!"); facts hedged where the seed says
`contested`/`⚠︎`; reference is *for-reference* — it never edits the user's own logged data (single-writer).

### 7a. Navigation — one surface, two doors, a labelled way home
The reference database is **one browsable surface reachable from two entry points**, and the *type page* is
the same screen either way (build it once):
- **Contextual door:** a tea's **Go Deeper** → lands on that tea's *type page* (e.g. "Gui Fei oolong"), pre-focused.
- **Direct door:** a top-level entry into the database → lands on the *index* (browse all types).

From a type page, **two explicit exits**:
- **← back to your tea** — returns to the exact library entry you came from.
- **Browse all types** — detaches from that tea and drops into the free-browse index.

**The key mechanic — a labelled return anchor.** The moment you enter via Go Deeper, pin a labelled chip
("← Sencha Megumi No.1") that persists through the whole browse session, however far you roam
(type → sibling → another type). It keeps you one tap from the origin tea and only clears when you leave the
database. This beats relying on the OS back-stack, which gets tedious once browsing goes lateral. A
breadcrumb ("Sencha Megumi › Sencha › All types") is an acceptable alternative but the pinned chip is calmer.

**Treat the database as a place, not a popover.** The ask is "open the general database to browse" — that's
a destination you *navigate into*, not a modal peek. (Modal = right for a quick glance; but the requirement
is a glance that can *become* a wander, which needs a real section.)

**Lateral links make it alive.** Each type page should offer sideways moves, not just drill-down:
"other [Sencha] in your library" and "related types" (shade ladder sencha → kabusecha → gyokuro; Gui Fei ↔
Oriental Beauty as bug-bitten cousins). This is the payoff of the general database — exploration, not a
dead-end fact card. Calm-first holds: opt-in entry, quiet lateral movement, always a labelled way home.

## 8. Open decisions for Niklas
- Curated seed vs. (later) generated — recommend **curated seed** for MVP.
- Global table vs. bundled JSON file — table is queryable and updatable without a deploy; JSON is simpler
  and fully offline. (Leaning table, read-only RLS.)
- Does the reference browse surface belong under the library, the passport, or its own Encyclopedia/Types
  section? (§7a treats it as a *place* navigated into — so it wants a real home, most naturally a sibling to
  the Library or a tab of its own; the Passport is place/geography, a different axis.)
- Scope: start oolong-first (the library's centre of gravity) or cover all six families thinly?
  *(Update: seed now covers oolong/green/white/yellow — the library is fully covered, so "all families
  thinly" is effectively already done for what you own.)*
- Narrative layer: author `why_famous`/`special` by hand now, or wait for the LLM-draft pipeline?

## 9. Lane
This brief = planning lane (here). Seed authoring can happen here too (it's fact-check work). Schema +
UI + inference wiring = Claude Code. Any reference-card visual = Claude Design. No decision is made in
Code's lane — Code gets the agreed shape, not the choices.
