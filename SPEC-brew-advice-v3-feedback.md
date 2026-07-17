# Spec — Brew advice v3: per-steep feedback (the A2 capture control)

Status: **DECIDED — ready to build** (planning lane, claude.ai, 2026-07-16). Reviewed
slice-by-slice; this is the committable spec a later Code session implements. Covers
issues **#15 + #9** (the A2 feedback control).

Extends only the **feedback** layer of the tuning stack `base → ratio → feedback →
timeShift`. The ratio axis (`SPEC-brew-advice-v2.md`, shipped v3.85) is untouched.
Source of truth for the rulings: `PHASE2-PRESPEC-NOTES.md` §A + the Tea-First Principle.

## Ruled decisions this spec builds from

- **Decision 1 — signal source:** one-tap axis only (`good` / `strong` / `weak`). No
  free-text mining of steep/session notes. **RULED yes** (calm-first, deterministic).
- **Decision 2 — placement & shape:** the optional middle path. A per-steep strength tap
  (gongfu default) **and** the session-level tap (always-present fallback); method drives
  the default affordance, never a requirement; the engine aggregates whatever exists —
  curve if per-steep, verdict if session-level, **no-op if nothing**. **RULED.**
- **Tea-First Principle:** no tap — per-steep or session — is ever required. A
  zero-feedback session is a normal, complete, un-nagged outcome. Ranks **above** data
  completeness.
- **Fork rulings (this session):** Fork 1 = two separate stores, read-side precedence,
  never silently merged (below). Fork 2 = **reduce-to-verdict now; shape-aware shelved.**
  Fork 3 = a separate quiet tap, not an overload of the ephemeral nudge. Collapsed
  affordance = **A** (faint mark, tap to expand). `sessionHasFeedback` elevated to a
  standalone contract element shipped as a real function.

---

## 1 · Data model

### SQL — `sql/v3_9-steep-feedback.sql`
```sql
-- v3_9 — phase-2 brew advice: per-steep feedback (run once in the Supabase SQL editor)
-- One nullable column on steeps; no RLS/policy changes (the "own steeps" row policy
-- covers every column), no backfill. Safe to run before the app deploy — old code
-- ignores it. Mirrors sessions.feedback exactly: 'good' | 'strong' | 'weak', else null.
alter table steeps add column if not exists feedback text;
```
No DB `CHECK` — `sessions.feedback` has none; the enum stays **app-enforced** so there is
one validation story, not two.

### Mapper pair — `steep-data.js:86–87`
Both writes funnel through `steepToDb` (bulk save, per-session save, duplicate); both
reads through `steepFromDb`. Touching the pair *is* touching every path (CLAUDE.md mapper
rule) — no per-callsite edits.
```js
// BEFORE
const steepFromDb = r => ({ id: r.id, order: r.steep_order, tempC: r.temp_c != null ? Number(r.temp_c) : null, timeSeconds: r.time_seconds, description: r.description || '', tags: r.tags || [] });
const steepToDb = (st, sessionId) => ({ id: st.id, session_id: sessionId, user_id: userId(), steep_order: st.order, temp_c: (st.tempC === '' || st.tempC == null) ? null : st.tempC, time_seconds: st.timeSeconds || 0, description: st.description || null, tags: st.tags || [] });

// AFTER  (+ feedback, nullable, mirrors the description handling)
const steepFromDb = r => ({ id: r.id, order: r.steep_order, tempC: r.temp_c != null ? Number(r.temp_c) : null, timeSeconds: r.time_seconds, description: r.description || '', tags: r.tags || [], feedback: r.feedback || null });
const steepToDb = (st, sessionId) => ({ id: st.id, session_id: sessionId, user_id: userId(), steep_order: st.order, temp_c: (st.tempC === '' || st.tempC == null) ? null : st.tempC, time_seconds: st.timeSeconds || 0, description: st.description || null, tags: st.tags || [], feedback: st.feedback || null });
```
The in-memory steep object gains an optional `feedback` field (default null/absent), set
by the capture control (§3).

### Notes
- **Steepless representability:** `steeps: []` + `sessions.feedback` is already valid today
  (quick-log / cold-brew set `steeps = []`). Grandpa/continuous needs no new shape.
- **Method:** persisted as `sessions.brew_style` (`SESSION_METHODS` = `[gongfu, western]`
  at `steep-sessions.js:539`). Appending `japanese`/senchadō is **post-gate**, not this
  slice.

---

## 2 · Aggregation contract

### Read-side precedence ladder (Fork 1)
`per-steep curve → session verdict → tag inference → null`. Per-steep wins whenever *any*
steep on the session carries a tap; the session verdict is a strict fallback, **never
merged**.

### New reducer (Fork 2 = A, reduce-to-verdict) — `steep-core.js`
```js
// A session's per-steep taps → one verdict. Net sign only (shape deliberately ignored
// until the shape-aware upgrade earns its data). Untapped steeps contribute nothing.
function reduceSteepFeedback(steeps){
  let strong=0, weak=0, any=false;
  (steeps||[]).forEach(st=>{
    if(st.feedback==='strong'){ strong++; any=true; }
    else if(st.feedback==='weak'){ weak++; any=true; }
    else if(st.feedback==='good'){ any=true; }
  });
  if(!any) return null;                       // no per-steep tap → fall through to session/tags
  const net = weak - strong;
  return net>0 ? 'weak' : (net<0 ? 'strong' : 'good');   // tie → 'good' (counted, net-neutral)
}
```
Reduction rules: **net-sign**, **tie → `'good'`** (a fully-tapped neutral session is the
most engaged logging — returning `null` would make it invisible to the gate; tie→good is
gate-correct), **untapped ignored**, **malformed value ignored** (no DB check, so a
non-enum value counts as no-signal, never throws).

### `feedbackSignalOf` — the only touched function (`steep-core.js:556`)
```js
// AFTER — one new branch at the top; the rest is unchanged.
function feedbackSignalOf(session){
  if(!session) return null;
  const curve = reduceSteepFeedback(session.steeps);   // 1 · per-steep wins
  if(curve) return curve;
  if(session.feedback==='strong'||session.feedback==='weak'||session.feedback==='good')
    return session.feedback;                            // 2 · session verdict (fallback)
  // 3 · tag inference (weakest), unchanged
  const tags = [].concat(session.tags||[], ...((session.steeps||[]).map(st=>st.tags||[])))
    .map(t=>String(t).toLowerCase().trim());
  if(tags.some(t=>BREW_STRONG_TAGS.includes(t))) return 'strong';
  if(tags.some(t=>BREW_WEAK_TAGS.includes(t))) return 'weak';
  return null;
}
```

### `computeBrewAdvice` — UNCHANGED (`steep-core.js:578`)
It consumes only `feedbackSignalOf`'s token, so the curve and session paths converge and
the math is identical: `net = weak − strong`; `tempAdjC = clamp(net·2, ±6)`;
`timeAdjPct = clamp(net·8, ±24%)`; temp clamped 60–100; times ≥ 3s. `base` is the caller's
already-ratio-scaled `baseOverride`, so feedback tunes **on top of** ratio and this layer
never touches ratio math. Per-steep-sourced verdicts fold into the same `strong/weak/good`
tallies, so the memory line works with no change.

### Gate predicate — `sessionHasFeedback` (standalone; ships as a real function)
```js
function sessionHasFeedback(session){
  return !!session.feedback || (session.steeps||[]).some(st => !!st.feedback);
}
```
**Linchpin:** if the gate counted only session taps, A2 — the control built to fill the
gate — would produce data invisible to its own gate. Shipped as a real function (not just
a measurement definition) so the fixture and any gate counter pin the one source of truth.

### The seven read-side invariants (fixture obligations — see §4)
1. **Disagreement** — steeps `[strong,strong,good]` + `session.feedback='good'` → `'strong'`.
2. **Tie wins over session** — steeps `[strong,weak]` + `session.feedback='weak'` → `'good'`.
3. **Partial tap** — 5 steeps, one `'weak'`, rest untapped → `'weak'`.
4. **Absence → no-op** — nothing tapped, no matching tags → `null`; `computeBrewAdvice`
   adds no nudge and never prompts.
5. **Steepless** — `steeps: []` + `session.feedback='weak'` → `'weak'` (session fallback).
6. **Determinism** — same rows → same token, every run.
7. **`sessionHasFeedback`** — session-only → true; **steep-only → true** (linchpin);
   neither → false; both → true.

---

## 3 · Capture UX

The two same-vocabulary controls stop colliding because they stop sharing a location.

- **Placement.** The persisted per-steep tap lives on the **completed steep cards** (you
  rate a pour after tasting). The **ephemeral nudge** ("How was that pour? Weak → longer",
  `d_nudgeNextSteep` → `timeShift`, `steep-sessions.js:681`) stays under the live timer,
  untouched. Separation is a layout fact, not a hope.
- **Method gate (main quietness mechanism).** The per-steep affordance renders **only**
  when `brewMethodFor(d.brewStyle, cap) === 'gongfu'` (`steep-core.js:365`). Western,
  senchadō (japanese, when appended), grandpa, quick-log, cold-brew → session-level tap
  only, **no per-steep affordance at all**. So it is genuinely absent for everyone not
  attending per-steep.
- **States (gongfu only) — affordance A.** *Collapsed-faint* (a hairline mark, no chips)
  → *expanded* on tap (three chips: a touch weak / good / a touch strong) → *recorded* (a
  quiet marker; re-tap to change, toggle-off to clear, mirroring `setSessionFeedback` at
  `steep-sessions.js:1198`). A fully-tapped 5-steep session reads as five faint markers,
  never five open chip-rows.
- **Prominent vs quiet, reconciled.** *Who sees it* (gongfu only) and *how loud when seen*
  (faint/collapsed) are different axes; both hold. "Prominent" = present-and-discoverable
  for gongfu, versus absent for everyone else — not ten open rows.
- **Copy register (closes the same-words trap on the second axis).** Persisted taps are
  **observational** ("a touch weak"); the ephemeral nudge stays **imperative** ("Weak →
  longer"). Observation reads as "remembers"; imperative reads as "acts now."
- **Strict non-interaction.** The persisted tap writes only `steep.feedback`, never
  `timeShift`. The ephemeral nudge writes only `timeShift`, never `steep.feedback`. No
  cross-wiring.
- **Tea-First.** Nothing blocks on it — advancing a steep, finishing, saving all ignore
  it. The finish screen never flags an un-rated steep; absence is silent.
- **Session verdict stays.** `feedbackRowHTML` at finish (`steep-sessions.js:1188`) remains
  present for **all** methods as the fallback. On a gongfu session with per-steep taps the
  ladder makes it engine-inert (per-steep wins) but still available.
- **Write path.** The tap mutates `sessionDraft.steeps[i].feedback` in-draft and persists
  at session commit via `steepToDb`. No incremental steep writes.

### Named constraint (elevated, load-bearing): "quiet-until-reached-for"
Two taps × five steeps = ten optional decisions a gongfu session could invite. Optional is
not sufficient — visual presence alone can make a calm session feel like a form. The
persisted per-steep tap must read as **absent when just drinking**, surface **only for
gongfu**, and **never sit as always-visible controls**. The capture UX must *demonstrate*
this (method-gate + collapsed states + separation + observational copy), not assert it.
Ranks with Tea-First.

### Deferred / rejected
- **Point 8 — finish copy "per-steep is driving this one":** optional, **deferred to
  Design, lean OMIT** (telling the user the precedence ladder fired adds calm-cost for a
  case already handled correctly).
- **Rejected:** a finish-only per-steep roll-up (batch all taps at close) — violates the
  *ruled* Decision 2 ("offered as each infusion is logged"). Out.
- **Tokens** (glyph, colour mapping, hairline weight) are **Claude Design's lane**, not
  this spec — states and behaviour only here.

---

## 4 · Fixtures — `fixtures/brew-feedback-test.js`

Matches the `flavor-ladder-test.js` harness: load `steep-knowledge.js` + `steep-core.js`
into a `vm` sandbox, **assert the real functions** (never reimplement), synthetic controls
carry the boundary cases and run everywhere, real-data section **degrades gracefully when
the CSVs are absent** (gitignored). Exit non-zero on any failure. `computeBrewAdvice`
assertions pass an explicit **ratio-scaled `baseOverride`** to isolate the feedback layer.

**Synthetic sections (deterministic):**
- **A · reduceSteepFeedback unit** — `[strong,strong,good]`→`strong` · `[weak]`→`weak` ·
  `[strong,weak]`→`good` (tie) · `[good,good]`→`good` · `[]`→`null` · all-untapped→`null`.
- **B · Precedence + disagreement** — session `{feedback:'good', steeps:[strong,strong,good]}`
  → `'strong'`; session-fallback and tag-inference rungs each fire when higher rungs are
  empty; nothing → `null`.
- **C · Tie wins over session** — `{feedback:'weak', steeps:[strong,weak]}` → `'good'`.
- **D · Partial tap** — 5 steeps, one `'weak'`, rest untapped → `'weak'`.
- **E · Steepless + absence** — `steeps:[]` + `feedback:'weak'` → `'weak'`; `steeps:[]` +
  `feedback:null` + no tags → `null`.
- **F · Malformed ignored** — `steeps:[{feedback:'garbage'}]` → `null` (no throw).
- **G · computeBrewAdvice composition** — `baseOverride = {tempC:90, rinseSeconds:null,
  times:[15,20,30], form:'open', generated:false}`; two sessions (one steep-sourced
  `[strong,strong]`, one session-level `'strong'`) → `net=-2`, `tempAdjC=-4`,
  `timeAdjPct=-16` → **`tuned.tempC=86`, `tuned.times=[13,17,25]`, `hasNudge:true`**.
  Convergence: swapping a signal's *source* (steep-reduced vs session-tap) for the same
  verdict yields identical `tuned`. Absence → `hasNudge:false`, `tuned===base`, no prompt.
- **H · sessionHasFeedback** — session-only→true; **steep-only→true** (linchpin);
  neither→false; both→true.
- **I · Determinism** — each of the above called twice → identical.

**Real-data section (graceful-skip, `fixtures/{sessions,steeps}_rows.csv` when present):**
- **No-op regression** — every real session (all predate the column) →
  `reduceSteepFeedback(session.steeps) === null`, so `computeBrewAdvice` is byte-identical
  for every existing tea. Forward regression guard once steeps carry feedback.
- **Gate-count reproduction** — `sessions.filter(sessionHasFeedback).length` reproduces the
  measured feedback count; the ratio∩feedback intersection reproduces **3** (2 gongfu / 1
  western).

**Not in the vm suite:** the mapper round-trip (`steepToDb → steepFromDb` preserves
`feedback`) is a flat field map, not branching logic — covered by a live **save→reload**
check (phone-check lane), per the project's "fixtures are for branching logic" line.

---

## 5 · Sequencing (intact)

1. **Commit this spec doc.**
2. **Build the A2 capture control** — the first buildable slice; it is what fills the gate.
3. **Fill the gate** — ~15 ratio'd + feedback'd sessions across both methods, **currently
   ~3/15**, ~2–3 weeks of consistent complete logging *under the new control* (NOT the old
   ~Jul 20 estimate — the old end-of-session control is the reason the rate was low).
4. **Post-gate (separate specs):** learned defaults; `SESSION_METHODS` append
   `japanese`/senchadō.

**Three build-time obligations deferred to the build/deploy pass:** (a) the CSV anchors run
against a **fresh** export dropped into `fixtures/` (measured target: 8 any-feedback / 3
both / 2 gongfu · 1 western); (b) the mapper round-trip save→reload check; (c)
`sessionHasFeedback` lands as a real function.

**Shape-aware aggregation (Fork 2 = B) shelved:** a localized future change to
`reduceSteepFeedback` only, gated on the curve data this gate will collect — "capture rich,
act simple, upgrade when the data pays for it."

**Discipline:** `/slowcup-deploy` dry-run first · one-deploy-per-commit · pause-before-commit
· fixtures green before deploy. Nothing R3-gated; the tea-reference Phase B stays held.

## Non-goals
- No change to the ratio math (`SPEC-brew-advice-v2.md`).
- No matcha (#12 — R3-gated design).
- No learned defaults here (post-gate).
- No `SESSION_METHODS` append here (post-gate).
- No mood/Garmin axis. No new module.
