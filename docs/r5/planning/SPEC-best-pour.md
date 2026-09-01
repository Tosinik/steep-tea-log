# SPEC · Your Best Pour

**Status:** planning, decision-complete on shape; gate constants + tie-break tunable (see §6).
**Round:** r5, standalone slice (independent of the session-flow re-dress a/b/c and of brew-advice Stage 2).
**One line:** for a tea you've rated enough times, quietly recall the brew that earned your highest
rating — *"you liked it best this way"* — as an opt-in glance, never a prescription.

---

## 1 · What it is

A **recall**, not a recommendation. Best Pour surfaces the concrete parameters of the user's
**highest-rated session of a given tea** — dose, ratio, water temp, steep time — so a returning brewer
can repeat what worked. It reads a real session back to you; it does **not** synthesise a suggestion.

This is deliberately distinct from brew-advice's *Suggested brew* (vendor schedule → tea-type default →
learned pattern). That answers "where do I start." Best Pour answers "what did I love last time." They can
sit near each other but are different objects, and Best Pour is **standalone** — it does not feed the
suggestion (that coupling, if ever wanted, is brew-advice Stage 2's concern, kept separate and transparent).

## 2 · Source — rating, not sentiment

- The signal is the explicit session **`rating`**. The best pour is the highest-rated session of the tea.
- **Notes are colour, never signal.** A session's flavour words or free note may be shown alongside the
  recall ("you called it *honeyed, full* that time") but must never be parsed to *infer* that a session was
  liked. Inferring "liked it" from note text is fragile and over-reaching — it violates never-guess. Only
  the star does the choosing.
- **Params read back** (all from existing fields — no SQL, no migration): dose `gramsUsed`, ratio via
  `computeSessionRatio` (g/100ml, the app's own unit), water temp and steep time from that session's
  `steeps[]`. Cold-brew and quick sessions carry their own shape; render what's present, omit what isn't
  (the same per-part omission as the D1 facts line).

## 3 · The gate — activates only with enough info

This is the whole discipline. "You liked it *best this way*" is a claim, and a claim needs evidence.

- **Requires ≥ 3 rated sessions of *this* tea** (rating > 0). Below that, Best Pour renders **nothing**.
- **The winner must be genuinely a winner.** The top-rated session's rating must be strictly higher than
  the tea's session average *and* ≥ 4★. If every rated session shares the same star, there is no "best,"
  only "how you always brew it" — no signal, so **absent**.
- **The winner must be distinguishable by params.** If the top session's dose/ratio/temp/time match what
  you already do by default, there's nothing to recall — **absent**. Best Pour only speaks when it can say
  something you might not already be doing.
- **Honest floor, three-tier.** Best Pour is a *user-value* reading — the highest rung. It never falls back
  to a catalog or type default; if your own rated history doesn't earn the claim, **show nothing**. Never a
  guessed or thin "best."
- **Tie-break (tunable):** among equally-top-rated sessions, take the **most recent** — it reflects your
  latest confirmed preference.

## 4 · Placement

Two calm surfaces, both opt-in:

- **Tea page** — a *"Your best pour"* line near the brew guide, as a recall companion to the Suggested brew.
  Absent when the gate isn't met (no empty scaffold).
- **In-session (steeping view)** — findable while you're actually brewing this tea, tucked quietly (e.g.
  behind the ⓘ / a small "your best pour" affordance in the facts area), so you can glance at *"last time you
  loved it: 5 g · 90 ml · 92°C · 45s ★5"* if you want it.

**Tea-First, hard constraint.** In-session, Best Pour is a **reference you can glance at or ignore**. It
must never:
- pre-fill the timer, temp, or dose (no silent hijack of your setup);
- nag, banner, or interrupt;
- read as instruction ("brew it this way") rather than observation ("your highest-rated pour was…");
- add friction to going your own way — the session flows identically whether you look or not.

If you brew it completely differently today, that's a complete, unjudged outcome — and if today's session
out-rates the old one, *it* becomes the best pour. The feature gets quietly better by being used, never by
being obeyed.

## 5 · Copy & calm

Observation, not verdict. "Your highest-rated pour of this tea" / "You rated this best." No score, no
streak, no "you should." The ⓘ explainer (R180 `infoMark`/`toggleInfoPop`) carries the "where this comes
from" line: *your own highest-rated session of this tea*.

## 6 · Implementation notes (no SQL)

- A single read-only helper, e.g. `bestPourFor(teaId)` → `{gramsUsed, ratio, tempC, timeSeconds, rating,
  sessionId, notes?}` **or `null`** when the gate (§3) isn't met. Never guesses; returns `null` rather than
  a thin best.
- Computed at read from `state.sessions` (filter by `teaId`, `rating>0`), reusing `computeSessionRatio` for
  the ratio. No new data field, no migration.
- Renders through the existing calm surfaces (facts-line idiom, `infoMark`). Escaping on any surfaced note.

## 7 · Open / tunable (for the plan-gate ruling when this builds)

- Gate constants: min rated sessions (3?), the "clear winner" test (> average AND ≥4★?).
- The "distinguishable by params" test — how different is different enough to be worth recalling.
- Whether the session's flavour notes are shown as colour, or params only.
- Tie-break among equal top ratings (most-recent proposed).
- Deferred, explicitly out of scope: any coupling into brew-advice Stage 2's learned tier.

---

*Standalone slice. Independent of session-flow a/b/c. Reads only existing rating + brew fields. Mints its
own ledger entry when it ships.*
