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

## B. Gate reality — the ~Jul 20 estimate is stale

Measured against the real export (`sessions_rows.csv`, 2026-07-15):

- 24 sessions total.
- **10** have `water_ml` + `grams_used` (ratio-able).
- **8** have any `feedback` tap.
- **3** have **both** — and that (ratio'd + feedback'd, across both methods) is the gate
  metric, target **~15**.
- Method split within the 3: 2 gongfu / 1 western.

So the true position is **~3 of 15**, needing **~12 more *complete* rows** (water_ml +
strength tap, spread across gongfu and western) — not 12 more sessions of any kind. The
back-catalog mostly predates v3.85's water_ml/brewStyle capture, which is why the count
is low.

**~Jul 20 is no longer real.** At a realistic pace it's ~2–3 weeks of consistent
complete logging — *and only after the A2 control is built*, since fixing the control is
what makes the completion rate climb. **A2 is now RULED (the optional middle path
above), so the sequence is: build the optional per-steep + session affordance first,
then fill the gate under it.** Do not grind the gate under the current end-of-session
control.

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
