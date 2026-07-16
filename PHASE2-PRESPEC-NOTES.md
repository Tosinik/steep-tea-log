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

**Decision 2 — placement & shape (the real problem).** The control renders **once, at
session commit**, labelled *"How was this cup?" — Just right / A bit strong / A bit
weak*. Two flaws surfaced from actual use:

1. **"This cup" is singular; the dominant method (gongfu) is multi-steep.** At the end
   of a 5-steep session, "which cup?" has no clean answer — strength arcs across steeps
   by design. The question mis-maps to what the user actually did.
2. **A single end-of-session verdict is lossy** as engine input: the honest answer is
   usually "early steeps strong, tail weak," which is ratio-and-timing information the
   one tap flattens.

**Observed effect:** the tap gets **skipped because it feels wrong to answer** — which is
the actual reason the gate is under-filled, *not* under-logging. Notes are rich; the
button just doesn't fit the flow.

**Decide:** move (or duplicate) the strength tap to **per-steep** — offered as each
infusion is logged, where "this cup" is literally true and answerable — giving the engine
a **strength curve** instead of one flattened verdict. Keep the session-level tap as the
fallback for single-cup western brews.

- **Data-model implication:** feedback on the **steep** row vs the **session** row (or
  both). Resolve in the spec; fixture the aggregation (curve → next-brew nudge).
- **Sequencing implication:** if per-steep is the answer, **decide it before pushing more
  logging** — otherwise the gate gets filled under the worse control, with data that's
  both harder to give and weaker to train on.

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
complete logging — *and only after Decision A2*, since fixing the control is what makes
the completion rate climb. **Recommendation: don't grind the gate under the current
control; resolve A2 first, then fill.**

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
