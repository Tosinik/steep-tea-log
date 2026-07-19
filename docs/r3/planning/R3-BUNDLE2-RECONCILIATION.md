# R3 Bundle 2 — reconciliation notes
2026-07-18 · From Niklas + planning lane, to Design. Reviewed against the live repo (v3.90).

Bundle 2's two risky surfaces landed well in *concept* — Origins got real cartographic
thinking, and Social's "Correspondence, not broadcast" (with its explicit "what it
deliberately is NOT") is exactly the calm-first framing that was asked for. The notes below
are mostly refinement, plus two structural items that need answering before anything locks.

---

## STRUCTURAL — answer these first

### S1. Surface inventory — Sessions was missed, and it isn't alone
**Sessions is one of the five tab-bar slots and neither bundle designed it.** Bundle 1 did
Home · Library · In-session · Focus · Log; Bundle 2 did Insights · Origins · Settings ·
Shopping · Social. Sessions never appeared.

Auditing against the nav model, these are also undesigned:
- **Sessions** (tab-bar slot)
- **Tea detail page** — a core screen: brew guide, cups-detail line, the v3.86
  "≈ 4.6 cups at your usual 5g" line, stock/status, the liquor swatch enlarged
- **Add / edit tea form** — incl. the cultivar field (which now carries the v3.90 hint) and
  the swatch picker's entry point
- **Session detail** — viewing a past session
- **First-run / empty states** — explicitly in the R3 brief's scope from day one
- **App icon · theme-color · splash** (#10) — also in original scope

**Ask: produce a surface inventory** — every screen/surface the app has, marked
`designed` / `undesigned` / `deliberately deferred`, so we stop discovering gaps one at a
time. Then design what's missing (Sessions and tea detail are the two that matter most —
both are daily-use surfaces).

### S2. Edit-layout must survive — possible functional regression
The app has **card rearrangement** ("Edit layout") on Home, and Niklas actively uses it —
he's moved cards, which is why some Insights/Home cards' "home surface" is ambiguous below.
All Bundle 1/2 mocks show **fixed** layouts. If R3 doesn't preserve edit-layout, that's a
removed function — same class as the missing "+" in Rev 3.
**Confirm:** edit-layout is preserved, and the card system is designed to be rearrangeable.
This also means **which surface owns which card** must be explicit (see I3).

---

## INSIGHTS — restore the data, keep the calm

Niklas's read: *"what you can see on the Insights screen I really like — it's not
cluttered, looks nice. Can we find a way for both to be true?"* Yes — and the locked system
already has the mechanism.

### I1. Restore the data that was actually valued
Lost and wanted back:
- **Daily / weekly / monthly overview** (the period views)
- **Cost overview**
- **When you brew** (time-of-day pattern)

Lost and *not* missed — permission to stay selective, don't stuff everything back:
cups week-by-week · most-common tea type · steep durations. ("Nice to look at but didn't
give me much.")

### I2. The mechanism: period selector, same quiet-affordance pattern as Library
Cleanliness is about **what's visible at once, not what exists**. Library already solved
this with a quiet dropdown for filter/sort. Do the same here: a **period selector**
(day / week / month / year) as a dropdown or chip row, plus the card system — so the screen
stays as calm as it looks now while carrying much more. Niklas's own suggestion: *"instead
of scrolling — more insight options as chips or dropdowns, choosing month, year."*

### I3. Card ownership is ambiguous — resolve it
**Seasonal wrapped** and **"This week, mostly"** are gone. But because Niklas moves cards
with edit-layout, it's unclear whether they were Home cards or Insights cards. Design needs
to state **which surface owns each card by default**, with edit-layout able to move them
(see S2). Both cards should return somewhere.

---

## ORIGINS — great surface, two fixes

*"Origins is great, the map looks so much better."* Two real problems, and they share one
fix:

### O1. The liquor-swatch pin breaks down (and stretches a contract)
Niklas: a region can hold **more than one tea** — a green is fine, but an oolong, a puerh
and a white from one region have wildly different liquors. Which colour wins? There's no
honest answer.
This is also the contract question: the locked contract is **liquor = identity only, never
decoration.** A region isn't a tea, so it shouldn't wear a tea's identity colour — as a
regional pin the swatch drifts toward decoration.

**Fix (solves both):** the **pin is neutral** (ink; size can encode how many teas you have
from that region), and the **liquor swatches appear in the region's tea list when you tap
it** — where they're genuinely identifying individual teas. Contract intact, multi-tea
problem gone.

### O2. Map scope and interaction
- **Must survive going global.** Today it's six regions across two countries — but Africa,
  India, Sri Lanka, Nepal etc. will be added. The projection can't be hardcoded to East
  Asia.
- **Initial view: fit/focus where the collection actually is** (weighted to where most teas
  come from), not a fixed world view.
- **Tapping a region moves you there** (pans/zooms to it), then shows its teas.

### O3. Noted as correct, no change
"Sea is aged paper, not blue" — Design caught that a conventional blue ocean would spend the
blue contract on a second surface, and chose parchment. That's the contract working. Keep.

---

## SETTINGS — one serious correction, plus restorations

### S3. The privacy claim is factually FALSE — must be replaced
The screen states: *"No accounts, no tracking, no cookies. Your diary lives on your device."*
**This is not true.** SlowCup runs on **Supabase** — real accounts via Supabase Auth,
server-side Postgres with row-level security, and Storage. The data lives on a server, not
on the device. This isn't a design nit: it's a misleading privacy claim, and it becomes
serious the moment beta users read it.
Replace with something **true** — the honest version is still good, e.g. *"Your diary is
yours: stored in your own account, never sold, never analysed."* Design should propose
accurate copy; the planning lane will check it against what the app actually does.

### S4. Restore the lost settings content
Removed in the restyle, same regression class as Bundle 1's Library filters:
- both **inventory** items
- the three **brew-guidance** items
- **send feedback**, **data health**, **diagnostics**
Calm ≠ absent: these can sit behind quiet grouping/folds, but the capability must exist.

### S5. Icon semantics — what does each settings icon mean?
The red icon on "Default method" appears to reuse a mark that means **favourite / most-
brewed** elsewhere in the app. A mark that carries meaning in one place shouldn't be
repurposed as a decorative row label — that's the same "one thing, one meaning" discipline
as the contracts. Likewise the **bell on "Temperature"** (bells signify alerts, not degrees).
State what each settings icon signifies, or drop icons from settings rows entirely.

### S6. "Steep reminders" toggle — explain it
Notifications/push were **ruled out** (decision on #30). A toggle labelled "Steep reminders"
reads like notifications returning. What does it actually do? If it's in-app only, say so;
if it implies push, it contradicts a settled decision.

---

## SHOPPING LIST — two sections, two different interactions

The core problem, in Niklas's words: *"only one is struck through"* and *"the 'tick when it
arrives → moves to your library' I don't get either."*
**Diagnosis:** running-low teas are **already in your library** — so "moves to your library"
is meaningless for them. That interaction only makes sense for **wishlist** items you don't
own yet. One interaction model was applied to two different things.

### Sh1. The correct model (build to this)
- **Running low** — automatic, derived from your shelf (stock tiers). Not tickable-as-
  acquired. **Should be shown** — it's useful.
- **Promote to wishlist** — from a running-low item, you deliberately move it to the
  wishlist (an intent to buy).
- **Wishlist** — items you don't own. These **can be struck through** when acquired.
- **Clear acquired** — there must be a way to clear struck-through wishlist items once you
  have the tea. This is currently missing entirely.
Strikethrough only ever applies to wishlist, never to running-low.

---

## SOCIAL — the concept is right; three refinements

*"Really like some ideas here."* The principle ("correspondence, not broadcast") and the
explicit exclusions (no feed, no hearts, no follower counts, no streaks, no push) are
correct and on-brand. Refinements:

### So1. Passed cups — wrong destination, and a missing link
- **"Add to Library" → "Add to Wishlist"**. A passed tea is one you *don't own yet* — it's
  an intent to buy, not an inventory addition. This links Social directly into the Shopping
  flow above (passed → wishlist → acquired → library). One coherent path.
- **Add "Read more"** → the tea's entry in the reference database (v3.87 catalog, the "Go
  Deeper" surface).
- **Show where they bought it.** High value and effectively free — vendor is already stored
  on every tea (`source`), and the vendor filter already reads it.

### So2. Kindred notes — exact-tea matching won't fire
With a small circle and thousands of teas, **exact same-tea overlap will almost never
happen**. Match at **tea-type / similar-tea** level instead, or the feature is dead on
arrival.
**Systems note worth designing around:** *passed cups creates the overlap that kindred notes
needs* — when people actually act on recommendations, they end up with shared teas. The two
mechanisms feed each other, and both feed the **tea database** with flavour notes and brew
guidance. Design them as a pair, not as independent features.

### So3. The circle counts are fine
"passed you 3" / "6 shared teas" read as **factual history** (how often someone recommended
something), not vanity metrics. Keep them — they're not follower counts.

### So4. "Tea together" — reconsider; there's a third option
Design rejected it as *"either a notification (breaks calm) or too faint to matter."* But
there's an option not considered: **pull, not push.** You open the app and quietly see that
someone in your circle is also having tea right now. Nothing interrupts you — it's simply
there when you look. That's the same logic that makes the rest of this model work
("presence is pull, not push" is already stated in Design's own principles), and it
dissolves the objection. Niklas: *"love the idea."* Explore it.

---

## Sequencing
S1 (surface inventory + design Sessions/tea detail) and S2 (edit-layout) are the structural
blockers. Then Insights/Origins/Settings/Shopping/Social refinements. Bundle 2 comes back
for reconciliation; **Bundle 1 + Bundle 2 go to the Code hand-off together** as one complete
system once both lock — with the pins: swatch model, per-origin script model, five
contracts, per-steep tempC, ensō animation, and now the Origins map data-path.
