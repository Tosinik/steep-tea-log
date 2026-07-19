# Pre-spec notes — decisions to resolve BEFORE drafting the phase-2 brew-advice spec

**Status:** planning-lane notes, not a Code task. These are decisions that must be made
*before* `v3_4-brew-advice.sql` / the phase-2 spec is drafted, because they change what
data the gate collects and therefore how the feature is built. Surfaced from real use
(2026-07-15), not theory.

---

## A. Feedback source & placement — the load-bearing decision

**What the engine reads today.** The brew-advice tuning reads **`session.feedback`**, a
**one-tap axis** with exactly three literal values — `good` / `strong` / `weak`
(steep-core.js:556; the control is `feedbackRowHTML` / `setSessionFeedback` in
steep-sessions.js:1187–1202). It does **not** read free text. So:

- Per-steep **`description`** (tasting notes on each infusion) — rich, plentiful, **not
  read** by the engine.
- Session **`description`** (overall notes) — **not read** either.
- Only the good/strong/weak **tap** trains anything: `strong` → next brew weaker,
  `weak` → stronger, layered on top of the ratio correction
  (base → ratio → feedback → timeShift).

**Decision 1 — confirm the signal source.** Keep the training signal as the one-tap
axis; do **not** mine free-text steep/session notes for sentiment. Rationale: calm-first,
deterministic, no fuzzy NLP anywhere else in the app. *Decide explicitly so it's a
choice, not a default — but the strong lean is: one-tap only, text stays out of scope.*

**Decision 2 — placement & shape. RULED (2026-07-15): the optional middle path.** The
control today renders **once, at session commit** (*"How was this cup?" — Just right / A
bit strong / A bit weak*). Two flaws surfaced from real use:

1. **"This cup" is singular; the dominant method (gongfu) is multi-steep.** At the end of
   a 5-steep session, "which cup?" has no clean answer — strength arcs across steeps by
   design. But this is **not universal**: green/Japanese sessions and grandpa style
   often leave only an *overall* impression, and forcing per-steep granularity there
   would ask the user to invent detail they didn't experience.
2. **A single end-of-session verdict is lossy** for multi-steep sessions; a forced
   per-steep verdict is *fabricated* for single-impression sessions. Neither one shape
   fits every method.

**Ruling — offer both, require neither:**
- A **quiet, optional per-steep strength tap** (a touch strong / good / a touch weak),
  offered as each infusion is logged, for sessions where the user *is* attending
  per-steep (gongfu especially). Gives the engine a **strength curve**.
- The **session-level tap stays** as the always-present fallback for overall-impression
  sessions (green/Japanese/western/grandpa) and single-cup brews.
- **Method drives the default affordance, never a requirement:** gongfu → per-steep
  offered prominently; Japanese/western/grandpa → session-level default. The other
  option is always reachable; neither is ever mandatory.
- The engine **aggregates whatever exists**: a curve if per-steep was given, one verdict
  if session-level, **nothing if nothing** — and "nothing" is a first-class, un-nagged
  outcome (see Tea-First Principle below).

- **Data-model implication:** feedback can live on the **steep** row (per-steep) *and/or*
  the **session** row (overall). Resolve the schema in the spec; fixture the aggregation
  (steep curve → next-brew nudge; session verdict → same nudge; absence → no-op, never a
  prompt).
- **Sequencing implication:** fill the gate *under the new control*, not the old one —
  so **build the optional per-steep affordance before pushing the logging that fills the
  gate**.

### Tea-First Principle (NEW named constraint — load-bearing, do not optimise away)

**SlowCup is for drinking tea, not for serving the app.** No feedback tap — per-steep or
session — is ever required. A session logged with zero feedback is a **normal, complete,
un-nagged outcome**, not a gap to prompt about. The engine learns only from what the user
*chose* to give and never asks for more. Any capture UI that makes a session feel like it
must be attended-to in-the-moment to "count" is off-brand, even if it would yield richer
training data. This ranks **above** data completeness: a calmer session with less data
beats a focused-on-the-phone session with more. Sits alongside calm-first and
single-writer as a first-class principle; the phase-2 spec and its capture UI must be
checked against it.

### Method coverage (informs the affordance defaults)

- **Japanese / senchadō** — already the planned phase-2 third method (`SESSION_METHODS`
  is built to append `japanese`; currently `[gongfu, western]` at steep-sessions.js:539).
  It is a *distinct* method, not gongfu-with-different-numbers, and its strength
  perception is typically overall, not per-steep → session-level default affordance.
- **Grandpa style** — future method, flagged now because it **stress-tests the model**:
  leaves loose in the cup, continuous topping-up, **no discrete steeps at all**. There is
  literally no per-steep structure to hang a tap on, so grandpa style is the clearest
  proof the **session-level tap must always exist**. Design the schema so a
  steepless/continuous session is representable (feedback on session only, steeps
  optional/absent) rather than assuming every session decomposes into steeps.

## B. Gate reality — MET, and the metric needs redefining

Measured against the real export (2026-07-19): **31 sessions, 15 with both a computable
ratio and feedback.** The gate target was ~15. It is met.

Split by stored `brew_style`: **6 senchadō · 6 gongfu · 3 untagged.** Resolved through
`brewMethodFor`: **9 gongfu · 6 senchadō · 0 western.**

The A2 ruling worked exactly as predicted — v3.89's per-steep control is what made the
completion rate climb, and v3.91's senchadō capture is what made the split honest. The
back-catalog problem resolved itself once capture was fixed.

**But "both methods" as written (gongfu + western) can no longer be satisfied.** Niklas
does not brew western; every session previously counted as western was a Kagoshima green
in the kyusu, and all of those are now correctly tagged senchadō. Western is zero and
will stay zero until he buys a big pot.

**Decision needed before the spec is drafted:** the gate condition means *two methods the
user actually brews*, not gongfu-and-western specifically. Rewrite it that way in
ROADMAP-v4 Pillar A. As it stands the gate is met at 9 gongfu / 6 senchadō.

## C. Related (not phase-2, but same engine neighbourhood) — greeting pass

Two greeting-card bugs are diagnosed and ready to slice whenever the greeting engine is
opened. Independent of design; can run in the same quiet-engine window as phase-2 (not
ahead of it).

- **#25 — no recency window in `d_scorePick`.** A tea logged yesterday afternoon is fully
  eligible again this afternoon (real example: Dawang Feng recommended the day after it
  was drunk). Fix: add a "don't re-suggest what was just had" exclusion window.
- **#17 — "still unopened" reads only session absence.** `d_rediscoveryPick` calls a tea
  unopened purely because no session is logged, never checking shelf evidence
  (`amountGrams < costOriginalGrams` proves it's been opened — real example: a tea at
  ~18g of its original amount called "still unopened"). Fix: gate the "unopened" copy on
  stock evidence, not just session count.
- **Ack-copy rider:** the acknowledgment line reads as a suggestion rather than a
  retrospective — copy clarity, rides along whenever this slice ships.

**Ruling (standing):** batch #25 + #17 + the ack rider into **one plan-review pass** over
the greeting engine — different functions, but one cheap moment to touch the engine.
Slots after phase-2, in the same pre-R3 quiet-engine window.

## D. Senchadō baselines — v3.91 contradicts Pillar A, and Pillar A is probably right

**This is the first decision of the brewing session.** Two committed documents disagree
about the same number, which is exactly the two-sources-that-can-disagree pattern.

**ROADMAP-v4 Pillar A (Niklas, 2026-07-10)** says: the KB's "raised JP-green westerns"
(sencha 1.8 / kabusecha 2.0) are *senchadō values wearing the wrong name*. So `ratioJapanese`
should take those values, and `ratioWestern` should re-lower to true big-pot numbers
(~0.6–0.8 g/100ml — cf. the MainTee label's 3–4 tsp/litre).

**v3.91 as shipped** routes senchadō to `kb.ratioGongfu` (3.0) and leaves `ratioWestern`
at 1.8/2.0. The planning lane specced this without reading the Pillar A entry; Code
implemented it faithfully. Neither checked.

Both numbers are defensible in isolation — published sencha guidance spans roughly
1.8–3.3 g/100 ml, and the v3.91 change was still a large improvement over scoring a kyusu
sencha against western 1.8. **But Pillar A is better reasoned, because it fixes the other
half:** `ratioWestern` currently carries Japanese-green values, so anyone brewing an
actual big pot gets a baseline roughly 2–3× too high. v3.91 left that untouched.

Resolve by ruling on both numbers together:
- what `ratioJapanese` / senchadō should be (1.8–2.0 per Pillar A, ~2.8 per the leaf seed,
  or 3.0 as shipped);
- what `ratioWestern` re-lowers to;
- whether the `LEAF_RATIO_DEFAULT.green_jp.senchado` seed survives at all.

Related and already recorded: that seed (2.8) is **currently unreachable** — all of the
library's Japanese greens resolve in the KB, which sits above the leaf table, so senchadō
and gongfu produce an identical baseline for every current tea. See
`docs/tasks/TASK-senchado-capture.md`.

## E. The retagged sessions carry feedback recorded under a superseded baseline

Six sessions are now tagged `senchado` that were previously read as western. Their
baseline moved from 1.8 to 3.0, which flips a ~2.8 g/100 ml pour from "heavier than
baseline, shorten the times" to "about right".

This matters because feedback is **not** an absolute verdict. `steep-core.js:606`: the
feedback nudge "tunes ON TOP of the ratio correction" (ordering: base → ratio → feedback →
timeShift). So a "good" or "strong" recorded against the old scaling refers to a
suggestion that no longer exists.

`ratioAdjust` has been **ON** throughout (confirmed in `user_settings`, 2026-07-16), so
this is real rather than theoretical — the ratio layer was live for every one of those
sessions.

Retagging was still correct: the record has to be true, and the alternative was a gate
built entirely on mislabelled rows. But the spec must decide how learned defaults treat
these six — excluded, marked lower-confidence, or accepted with the caveat recorded. They
are 6 of the 15 gate rows, so this is not a rounding question.

**Also decide the general rule**, since this will recur: when a baseline changes, what
happens to feedback recorded against the old one?
