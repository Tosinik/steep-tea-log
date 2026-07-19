# R3 Bundle 1 — reconciliation notes
2026-07-17 · From Niklas + planning lane, to Design. Reviewed against the live repo
(v3.89). The bundle is strong and mostly locks clean — the swatch system, the pinned
contracts, the cups-stepper removal, and the ensō exploration all landed as asked. What
follows is a short list of intent-confirmations and small feature decisions, grouped by
how blocking they are. Nothing here is "you broke something."

## What's approved as-is (lock these)

- **The liquor swatch system** — all three tiers exactly per spec (user-set truth →
  catalog default → unfilled placeholder, never guess). Curated 14-colour palette derived
  from the 55 catalog liquors, full range covered (gyokuro pale-yellow → near-black →
  herbal rose). Picker-in-context calm and on-brand. Locked.
- **The five rationing contracts** — pinned as read. These become invariants at build:
  liquor = identity only · clay = one committing action/screen, never selection ·
  xanthous = state · blue = Focus ring only · washi = Home masthead (on probation).
- **Cups-drunk stepper removed** — correct, per the scope fence.
- **Log vs Focus as two screens** — confirmed correct: Log (WS1) is compose/setup, Focus
  (WS3) is the in-session steep. Good.

## MUST-RESOLVE before lock

### 1. Greeting masthead must fit the FULL greeting engine output
The Home masthead correctly renders the greeting engine's dynamic content (the THIS WEEK
stats line, the EARLIER recents with real "yesterday · gongfu · quantity not tracked") —
so the engine was NOT tossed, good. **But the bundle shows only the morning-stats
variant.** The greeting engine has several live states beyond this — notably the
habit-aware suggestion line ("Maybe the Dawang Feng this afternoon?") and the rediscovery
prompt. Confirm the journal masthead has a designed home for those variable lines, not
just the stats variant. The greeting card is engine output with multiple states; the
restyle has to hold all of them, not one. Show the masthead in its suggestion/rediscovery
states, not only the stats state.

### 2. Vendor filter — YES, but as a dropdown, data-driven (not hardcoded chips)
Niklas wants the vendor filter. Two changes from the mock:
- **Dropdown, not a chip row.** "All / Yunomi / Ippodo / Local" as chips adds header noise
  alongside the existing sort ("Recent ▾") and grid/rows toggle — the clutter R3 is
  meant to reduce. Make it a quiet dropdown matching the existing sort control's pattern;
  it expands only on tap.
- **Data-driven, not hardcoded.** The vendor list must derive from the teas' actual
  `source` values in the DB, so it reflects what Niklas owns and grows as vendors are
  added. No fixed "Yunomi/Ippodo/Local" — those are just today's happen-to-exist values.
- Build note (later, not Design): small slice — read distinct `source` values, render as
  dropdown options, filter on select. Real data, no new field.

### 2b. The two feedback controls must be unmistakably distinct
Live-use finding (Niklas, 2026-07-17): the app has TWO near-identical feedback controls
that do opposite things, and they're currently confusable:
- The **ephemeral "How was that pour?" nudge** (weak/just-right/strong) — adjusts the
  *current session's* timer only, persists nothing.
- The **per-steep strength tap** (v3.89, "a touch weak/good/a touch strong") — logs to
  `steep.feedback`, feeds brew advice, counts toward the gate.
Niklas hit this in real use ("just right doesn't feel logged" — correct: that control logs
nothing; the *other* one does). This is the exact "same words, opposite effect" trap the
direction was meant to solve by SEPARATION. **Requirement for the Log/Focus (WS1/WS3)
screens:** the timer-nudge and the persisted strength tap must be spatially and verbally
unmistakable — one clearly "adjust this steep's timer," the other clearly "remember how
this steep tasted." Different zones, different register (imperative vs observational), no
shared vocabulary. If the redesign already separates them (it should, per the direction's
intent), confirm it explicitly on these screens. This is also being diagnosed in the live
app in parallel (Code, Part 3) — the fix should land consistently across both, not diverge.

## CONFIRM-INTENT (not necessarily wrong, but must be deliberate)

### 3. Water-temp slider on the Log SETUP screen — moved, or assumed?
The Log (WS1) setup screen shows the 84°C water-temp slider. Confirm this matches the
live app's flow: is temp currently set at setup, or only in-session? If Design moved it to
setup, that's a UX change that must be intentional and match what Code will build — flag
it explicitly rather than letting it ride as a silent relocation.

### 4. St. Patrick's Blue — keep this hue, or reconsider?
The reserved Focus-ring blue has no tea or SlowCup origin — it's just the colour-name of
the one saturated accent carried from R2/R3. The *concept* (one rationed blue, Focus only)
is locked; the specific hue is open. It's the single most saturated moment in the app, so
it earns the question: why this blue specifically, and is it right? Easy to swap if not.
Niklas is undecided — offer a small alternative or two beside it so the choice is made in
context.

## SMALL FEATURE DECISION (ruled — build to this)

### 5. Tea-index row value — remove temp; make it a small bounded toggle
Temp should NOT be the index row value (it's not actionable at browse-time, and it
competes with the swatch for at-a-glance identity). Replace with a **user toggle, 4
bounded options** (a small setting, not free-form configurability — calm, no sprawl):
- **Stock status** — e.g. "plenty · 5 cups" / "running low" / "empty"
- **Fresh** — freshness indicator
- **Grams** — plain "42 g"
- **Off** — swatch + name only (cleanest)
Default: stock status (most actionable). This reads real engine data (stockTier / cups /
grams) — no new fields; the toggle is a small settings addition.

## YOUR-PICK (Niklas decides, no wrong answer)

### 6. Ensō — geometric (keep) vs hand-weighted brush (warmer, costs animation rethink)
Design gave both honestly: the current geometric two-arc animates for free and reads a
touch clinical against paper; the hand-weighted brush is warmer and material-honest but
needs a stroke-along-path / clip-reveal — a real build cost. Design's own read: the brush
is the one heritage change it'd make, but if the animation cost isn't worth it, the
geometric arc is a perfectly good keep. **Niklas's lean: keep geometric for now, revisit
the brush later if D reads too clinical.** Not final — flagged for Niklas to sit with. If
kept geometric, no action; if brush, it's a scoped animation slice, not a drop-in.

## Next step
Design resolves 1–5 (6 is Niklas's to sit with), returns the updated Bundle 1, and it
comes back to the planning lane for a final reconciliation pass before any of it moves to
Code. The swatch data-model and the five contracts are what get pinned at that build
hand-off. Bundle 2 (the R3-gated issues) can start in parallel once Bundle 1's canonical
screens are settled.
