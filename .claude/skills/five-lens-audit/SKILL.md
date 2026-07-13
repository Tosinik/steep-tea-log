---
name: five-lens-audit
description: Pre-version audit of SlowCup through five lenses — capability regressions, stale copy, seam consistency, doc debt, known-nuance register. Read-only; the output is a findings report ONLY, never fixes in the same run. Human-invoked before a version or after a design workstream lands.
disable-model-invocation: true
---

# /five-lens-audit — the pre-version audit, formalized

This is the audit that ran before v3.83 and produced the four audit riders (v3.83), the
capability-regression bundle (issue #23), and the docs reconciliation commit. Run it after
a workstream lands or before a version when drift is suspected. It is **read-only**: no
edits, no commits, no issue writes. Findings ship later in their own reviewed slice —
riders as a vX.YY, capability bundles as a GitHub issue, doc debt as a docs commit.

## The five lenses

1. **Capability regressions.** Things a user could do before that a redesign or refactor
   silently dropped (the WS5 shelf lost all seven sorts → #23 F1). Method: walk CHANGELOG
   claims of shipped capabilities against the current render paths — for each surface a
   workstream rebuilt, list what the old surface offered and grep for where the new one
   offers it. A capability that moved is fine; one that vanished without a decision is a
   finding.

2. **Stale copy.** User-facing strings promising behavior that no longer exists ("Chime and
   vibration" after `navigator.vibrate` was removed → F9; onboarding's "your streak" after
   the streak line was retired → F17 rider). Method: grep rendered template literals for
   feature nouns (chime, streak, vibration, achievement, …) and check each named behavior
   still ships.

3. **Seam consistency.** Cross-module seams that drifted: back-routes pointing at a view a
   card moved away from (`viewSpend` → Home after the cost card moved to Insights → F6),
   toggles gating surfaces that moved, handlers whose owning view changed. Method: for each
   `goView`/back-route/toggle, confirm the destination still owns what the label claims.

4. **Doc debt.** CLAUDE.md / STATE.md / ROADMAP / DESIGN.md claims vs shipped reality (the
   ROADMAP still prescribing a `flavor:` tag namespace the v3.78 pause decision rejected was
   a live foot-gun). Method: read each doc's factual claims (module ownership, load order,
   toggles, conventions) and diff against the code. Doc findings are their own disposition —
   a docs commit, never bundled into an app version.

5. **Known-nuance register.** Deliberate decisions that look like bugs. Before flagging
   anything, check DESIGN.md's **accepted nuances** register (native selects · UI-chrome
   date locales · oolong roast untracked · low-stock tone split); a finding already
   registered is NOT a finding. Conversely, propose register **candidates** for anything
   discovered that is correct-but-surprising — the register grows by audit, silently
   "fixing" a nuance is the failure mode.

## Output — findings report, nothing else

Number findings F1..Fn (continuing style from the 2026-07-13 audit). Each finding:
- **Lens** (1–5) and a one-line statement of the defect.
- **Evidence**: `file:line` or the doc quote — concrete, greppable.
- **Severity**: ship-blocker · rider (small, fix-with-next-version) · bundle (needs its own
  issue/slice) · doc-only · register-candidate.
- **Proposed disposition** — but the decision is Niklas's. Anything engine-touching gets a
  plan-review pause flag.

End with a table: finding · lens · severity · disposition. Do not fix anything, do not open
issues, do not edit docs in the same run.
