# Handover — Tea Reference Layer → in-app learning

**For:** a claude.ai review/planning chat, to vet and resolve the open decisions below, then turn into a Claude
Code kickoff. **Not** a direct Code task yet — decisions still need making (§6).

**Goal:** let Niklas *learn tea inside SlowCup* — browse a reference of tea types, and open a "tell me about
this tea" surface from any library tea. The content is done and verified; this is an implementation plan.

---

## 1. What already exists (read these first)

Three committed docs are the inputs. Nothing here needs re-researching.

- **`TEA-REFERENCE-BRIEF.md`** — the original design/spec for this feature: the shared read-only `tea_types`
  table, library teas optionally linking via nullable `teas.tea_type_id`, the "tell me about this tea"
  surface, and the navigation model (contextual "Go Deeper" + direct browse; one-screen type page; a persistent
  labelled return chip; treat the DB as a *place navigated into*, not a modal). **This is the north star — the
  reviewing chat should re-read it before anything else.**
- **`TEA-TYPES-SEED.md`** — the fact-checked dataset: **58 rows**, spec-shaped, across 7 authoring batches, all
  JSON validated. Two-level taxonomy (parent class → member), six families, and the "attributes-not-classes"
  model. Includes a processing-term exclusivity **audit** and a **family scorecard**. This is the data to load.
- **`TEA-HANDBOOK.md`** — the human-readable learner's guide (same content, proofed prose). **This is the copy
  source for the in-app surface** — the type-page text should be adapted from here, not written fresh or dumped
  from the JSON.

## 2. The model in one paragraph

A tea belongs to one of **six families** (green, white, yellow, oolong, black/hong cha, dark/hei cha). Within a
family, **parent classes** hold the processing facts and lightweight **member** rows inherit them (e.g. parent
"Wuyi Yancha" → members Da Hong Pao, Rou Gui, Shui Xian…). Cross-cutting things — roast, oxidation, shading,
steaming depth, harvest, bug-bitten, smoked, drying, compression, flavoured, terroir, vintage — are **attributes
on a tea, not classes**. The seed encodes this with a nullable self-reference (`parent`) and a `family` field.

## 3. Hard constraints (non-negotiable, from project discipline)

- **No build step.** Vanilla JS, single `styles.css`, GitHub Pages. The reference data ships as **either
  Supabase rows or a static committed `.json`/`.js` fetched at runtime** — never a compiled/generated artifact.
  The reading surface is hand-written DOM + CSS in the existing stylesheet, **no framework**.
- **Single-writer.** The reference layer is *read-only fallback knowledge*. It is **presented as suggestions,
  never silently written over a user's own logged data.** A library tea links to a type only when the user
  confirms; auto-inference is a confidence-rated suggestion, never an authoritative write.
- **Calm-first / opt-in.** No gamification, no badges, no "you've learned 12 teas!" No push. "Go Deeper" is a
  quiet, optional affordance. This is a place to read, not a course to complete.
- **Hedge survives to the UI (content contract).** The seed marks every row `canonical` / `contested` /
  `⚠︎ confirm`. Contested and confirm rows must render *with* their hedge visible — never flattened to
  confident fact. This is the integrity of a learning feature, not a nicety; it is a hard constraint, not a
  §8 "nice to avoid." Folklore stays marked as folklore (the seed already separates verified / vendor /
  folklore).
- **One deploy per commit**, pause-before-commit, fixtures-before-shipping (Node vm sandbox against real CSV
  where there's branching logic), verification via fresh clone. Standard SlowCup rhythm.

## 3a. Architecture rationale — why "no build" is deliberate (do NOT "fix" it)

This note exists so a future reviewer or Code session doesn't "helpfully" add a bundler/framework/transpiler
and quietly break what makes the project durable. **The no-build approach is a considered architectural
choice, not unpaid technical debt.** Its payoffs are ongoing and real:

- **No toolchain rot.** The #1 killer of side projects is returning after months to a wall of `npm install`
  errors and dependency churn. A no-build app has nothing to rot — the files that run are the files in the repo.
- **Instant debuggability.** The code executing in the browser *is* the code you wrote — no source maps, no
  compile step between you and the bug.
- **Trivial deploys & longevity.** Deploy is a commit to GitHub Pages. Browser-native JS/CSS written today will
  still run in a decade; a 2026 build pipeline will not.

"Future-proofing" by *adding* a build step is usually the opposite of future-proofing. The right rule is:
**add tooling only to kill a specific, recurring, named pain — never preemptively.** Against that test:

- **Worth doing (all no-build-preserving):** the existing **Node vm fixture** tests and the
  **`/slowcup-deploy` dry-run** drift check — real needs, zero architectural cost.
- **Native ES modules — worth doing, but as its own scoped slice, not a free rider.** `<script type="module">`
  + `import`/`export` is genuinely build-free and would let the module system *enforce* the single-writer
  discipline currently held by convention. But migrating the existing multi-script app (`steep-core.js`,
  `steep-teas.js`, the whole shared-scope family) to real module boundaries is a genuine refactor with its own
  bug surface (deferred execution, strict mode, one-time evaluation). **Ruling: do not fold it into the
  reference-layer feature.** If pursued, it gets its own task file, its own fixtures, and its own
  pause-before-commit — never smuggled in under "costs nothing." It is not a prerequisite for this feature.
- **Resist unless a concrete pain forces it:** a bundler/framework (React/Vue/Vite) — it imports the entire
  maintenance surface the project deliberately avoids, and SlowCup's UI is well within vanilla-DOM reach. If
  type-safety is ever wanted, use **JSDoc annotations + `tsc --checkJs` as an editor/dev-time check**, never a
  compile-to-ship step — types stay a convenience, not a build dependency.
- **Name the predictable pains early.** The rule "add tooling only for a named, recurring pain" is right, but
  R3 + this reference layer bring two *foreseeable* volume pressures: **SVG asset management** (traced teaware,
  objects-as-shapes, per-family marks) and **reference-data loading** (58+ rows, growing). The no-build answer
  to both already exists — a committed SVG sprite sheet is just a file; a committed `.json` is just a fetch —
  but decide the sprite + data-loading *convention* before the volume lands, so the pain never arrives first
  and pushes a build step reactively. Pre-empting a *predictable* pain with a no-build pattern is different
  from pre-emptively adding tooling; do the former, still resist the latter.

**Relevance to this feature:** the reference layer is a mild stress-test of the discipline (58 rows need a
home), but that's a *data-shape* decision — static committed JSON vs a Supabase table, both fetched at runtime
(§6.1) — **not** a "do we need a build step" decision. It's fully answerable inside the current architecture,
which is a good sign the architecture isn't constraining the app yet. Keep the discipline; let each future
tooling choice be *pulled* by a real pain, not *pushed* by a general worry.

## 4. R3 design-rework context (why sequencing matters)

`R3-BRIEF.md` (in repo) is the live design round and it **directly shapes this feature** — read it, but the
load-bearing points for the reference surface are:

- **The R2 diagnosis is structural monotony** — "the same rounded card everywhere." The reference/type page is
  a chance to introduce a *distinct* surface, not to reuse the standard tea card again. Treat it as a design
  opportunity aligned with R3's intent, not a card clone.
- **Heritage elements** (the ensō ring, Shippori Mincho display type) are protected-by-default but contestable;
  the type page should feel of-a-piece with them.
- **Saturated botanical colour is an accent only** (rationed) — relevant if type pages get any per-family
  colour coding; keep it restrained.
- R3 spans **four canonical screens** (Home, Library, Steeping/Focus, Log form) across **three named
  directions**, plus a batch of gated issues (#7 boards/passport, #8 settings, #10 app icon *from Niklas's
  gaiwan*, #12 matcha/matcha-latte session mode, #14 **session-setup tea picker**, #22 WS4 capture placement,
  #23 F2/F7/F8 Library sort/filter cleanup, #28 edit-layout placement) and two new surfaces with no current
  design (**app icon / theme-color / splash**, and **first-run / empty states**). *(§4 reconciled against the
  live R3-BRIEF.md, 2026-07-15 — earlier drafts mis-stated #14 as "custom selects" and referenced a "Library
  header rework" that is not in the live brief.)* The type page is **not** one of the four canonical screens —
  ruled in §6.4: it ships plain in Phase B and is designed in the chosen direction's language at Phase C,
  rather than explored three ways.

**Sequencing recommendation:** build the **data + a plain, unstyled browsable version now** (real value,
readable immediately, zero design risk), and defer the **fully-styled experience** (R3 card language, return
chip polish, related-types links) to **after R3** so it inherits the visual system instead of being built
twice. Don't block learning on R3; don't build the pretty version before R3 lands.

## 5. Proposed phasing

**Phase A — Data (prerequisite, ~half a day Code).**
Decide data location (§6.1), then: create the schema (if Supabase) or the static file (if committed JSON),
load the 58 rows from `TEA-TYPES-SEED.md`, and expose a read path the app can query. If Supabase: nullable
self-ref `parent_id`, a `family` value, attribute columns/JSON, and **RLS making it world-readable but not
user-writable**. Run Supabase advisors after the DDL to catch missing-RLS/security issues.

**Phase B — Plain browsable surface (now, a couple of sessions).**
A minimal type page (one screen: what it is, how it's made, key members, how to brew — copy adapted from
`TEA-HANDBOOK.md`), reachable two ways: a direct "Browse tea types" entry, and a quiet "Go Deeper" link from a
library tea. Plain markup, functional navigation, the persistent labelled return chip from the brief. No R3
styling yet. **This is the "learn in the app" milestone.**

**Phase C — Styled experience (post-R3).**
Reskin the type page in R3's language (progressive-disclosure card, return chip, lateral "related types"
links), and wire the optional `teas.tea_type_id` link + the confirm-not-auto-write inference flow.

## 6. Decisions — RULED (2026-07-15, planning lane)

All six resolved so this can become a Code kickoff. Rationale kept short; overrule any before kickoff if you
disagree.

1. **Data location: static committed JSON now.** You're a beta of one; static JSON needs no migration, no RLS,
   is the most no-build-native option, and the seed *already ships machine-readable JSON per batch* — the data
   is already in the target format. Migrate to a Supabase `tea_types` table only if/when the beta widens and a
   shared, deploy-free-updatable table earns its keep. (Supabase's own advisors + RLS work is deferred with it.)
2. **Attributes: a single `attributes` JSON field, not discrete columns.** Attributes are sparse and
   open-ended (roast, oxidation, shading, bug-bitten, smoked, drying, compression, flavoured, terroir,
   vintage…); widening columns for each fights the "attributes-not-classes" model. One JSON field per row.
3. **Inheritance: resolve parent fields at read time in JS.** Keeps the data DRY and matches single-writer —
   processing facts authored once on the parent, members borrow at render unless they override. No
   denormalise-on-load duplication to drift.
4. **Type page does NOT join R3's four canonical screens.** The four exist so three directions compare on
   identical surfaces; adding a fifth screen only this feature needs would bloat every direction's exploration
   for something that doesn't exist yet. Ships plain in Phase B; designed in the *chosen* direction's language
   at Phase C (a Phase-C bundle, not an R3 exploration screen).
5. **Library-link + inference UX: deferred to Phase C, noted now.** Suggest → confirm → link; never
   auto-write (single-writer). The matcher's confidence rating drives whether a link is offered at all, and the
   confirm step must show the hedge (see §3 content contract). Noted here so Phase A/B don't design it into a
   corner; not built until C.
6. **Fixtures: the name→type matcher and member inheritance both get Node vm fixtures against the real CSV
   exports before any deploy.** The matcher especially — it must encode the seed's disambiguation traps
   (EN "black"/hong cha vs ZH "hei cha"/pu-erh; "Rou Gui"/"Shui Xian" each naming two teas; Anji Bai Cha is
   green not white; the *tan bei*/*zuo qing* shared-technique-word rule). These traps are the whole reason the
   matcher can't key on tokens alone, so they're the fixture's core cases.

## 7. Kickoff prompt for Code (decisions ruled in §6 — ready to paste)

**Prerequisite (do first): commit the four reference docs.** `TEA-REFERENCE-HANDOVER.md`,
`TEA-TYPES-SEED.md`, `TEA-HANDBOOK.md`, `TEA-REFERENCE-BRIEF.md` currently exist only as session outputs and
are **not in the repo** (verified 2026-07-15). Commit them docs-style (no version bump) before or as the first
step of Phase A, or Code will be reasoning about files it can't open.

> Implement Phase A + B of the tea reference layer for SlowCup, per `TEA-REFERENCE-HANDOVER.md` (decisions
> ruled in §6) and `TEA-REFERENCE-BRIEF.md` §7/§7a (UX + navigation; note the brief's reconciliation banner —
> the **seed** is source of truth for data shape). **Data location: static committed JSON** (§6.1). Load the
> 58 rows from `TEA-TYPES-SEED.md`'s machine-readable blocks into that file; **attributes as one JSON field**
> per row (§6.2); **parent fields resolved at read time in JS**, members inherit (§6.3). Build a plain
> (un-styled — R3 comes later, §4/§6.4) one-screen tea-type page with the persistent labelled return chip,
> reachable via a "Browse tea types" entry (index) and a quiet "Go Deeper" link from a library tea. Copy
> adapted from `TEA-HANDBOOK.md`, not dumped from JSON. **Contested/⚠︎ rows must render with their hedge
> visible** (§3 content contract). Respect no-build / single-writer / calm-first / one-deploy-per-commit. Add
> Node vm fixtures for the **name→type matcher** (encoding the seed's disambiguation traps) and **member
> inheritance**, against the real CSV exports (§6.6). Give me options, not choices, where anything is
> ambiguous, and pause before commit.

**Sequencing note for the kickoff:** this feature must not jump ahead of the gated **phase-2 brew-advice**
work (~Jul 20) already closer in the queue. Phase A (data load, ~half a day, zero UI risk) can slot in as
low-risk filler anytime; **Phase B waits until phase-2 has shipped**; Phase C falls out of R3 bundle time.

## 8. What NOT to do

- Don't auto-write reference data onto a user's logged tea. Suggest, confirm, then link.
- Don't add build tooling, a framework, or an npm data-generation step. (See §3a for *why* — this is a
  deliberate architectural choice, not debt to pay down.)
- Don't gamify or notify. No progress bars, streaks, or badges.
- Don't build the R3-styled version before R3 lands — it'll be redone.
- Don't treat vendor claims as fact in the copy; the seed already separates verified / vendor / folklore and
  marks confidence (`canonical` / `contested` / `verify`). Preserve that honesty in what the app shows.
