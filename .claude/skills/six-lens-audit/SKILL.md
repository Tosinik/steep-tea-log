---
name: six-lens-audit
description: Pre-version audit of SlowCup through six lenses — capability regressions, stale copy, seam consistency, doc debt, known-nuance register, and asserted-but-never-built. Read-only; the output is a findings report ONLY, never fixes in the same run. Human-invoked before a version or after a design workstream lands.
disable-model-invocation: true
---

# /six-lens-audit — the pre-version audit, formalized

> **Renamed from `five-lens-audit` on 2026-08-07.** R121b ruled a sixth lens on the same day the
> five-lens file kept saying five, and the R121b audit had to run six by following the ruling instead
> of the instrument. **A stale instrument decides what gets looked at before anything is read** —
> the same fault that had `issue-triage` bucketing a `swatchAttr` change as copy-only.

This is the audit that ran before v3.83 and produced the four audit riders (v3.83), the
capability-regression bundle (issue #23), and the docs reconciliation commit. Run it after
a workstream lands or before a version when drift is suspected. It is **read-only**: no
edits, no commits, no issue writes. Findings ship later in their own reviewed slice —
riders as a vX.YY, capability bundles as a GitHub issue, doc debt as a docs commit.

## The six lenses

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

6. **Asserted but never built** (R121b, added 2026-08-07). Lenses 2 and 4 catch claims that went
   **stale** — true once, false now. This one catches claims that were **never true**: R81, R95 and
   R116 were each believed for months, and three of them lived in **boards**, which lens 4 does not
   scope. **Method: invert the others.** For each locked contract, ruling or spec claim, demand the
   **artifact** that proves it exists in code — a token, a selector, a function, a call site — and
   treat **absence of a pointer as the finding**. Counter-rule earned: **a locked contract is not
   implemented until something asserts it.**

   **Worked example (A1, the 2026-08-07 pass).** R7 — keep-screen-awake — is fully specified and
   ratified in the ledger. `wakeLock` has **zero occurrences in any `.js`**. The #07 Settings board
   then drew it as a live toggle beside rows marked `shipped ✓`: the board was not inventing, it was
   reading the ledger. This is the lens's whole shape — the finding was invisible to every other
   lens, because nothing had decayed and no copy was wrong. **R138** rules the general case: a ruling
   can assert a state the repo does not have, and the repo wins.

   *Queued as a seventh-lens candidate, not part of this skill yet:* sweep every ruling asserting a
   shipped **capability** and demand its artifact — the inverse of lens 6, which starts from
   contracts. R7 is unlikely to be alone.

## Output — findings report, nothing else

Number findings with a prefix that does not collide with an existing series, and say which you chose.
**Do not default to `F1..Fn`:** Design's F-series is live to at least F17 (R128 cites "filed by Design
as F17"), and the 2026-08-07 pass used `A1..An` for exactly that reason. The same rule applies to
citations inside the report — **R3 board numbers and GitHub issue numbers are different namespaces
that collide** (board `#10 Focus` ≠ issue #10 icon), so accept `#NN` as an issue only when the source
writes "Issue #NN" with a matching title, and say so in both directions.

Each finding:
- **Lens** (1–6) and a one-line statement of the defect.
- **Evidence**: `file:line` or the doc quote — concrete, greppable.
- **Severity**: ship-blocker · rider (small, fix-with-next-version) · bundle (needs its own
  issue/slice) · doc-only · register-candidate.
- **Proposed disposition** — but the decision is Niklas's. Anything engine-touching gets a
  plan-review pause flag.

End with a table: finding · lens · severity · disposition. Do not fix anything, do not open
issues, do not edit docs in the same run.
