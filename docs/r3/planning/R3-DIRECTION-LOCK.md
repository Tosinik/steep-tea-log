# R3 — Direction locked: D · 摺物 Surimono, + the liquor swatch
2026-07-17 · From Niklas + planning lane, to Design. This locks the direction and sets
the conditions for moving to per-workstream bundles. Reconciliation against the live
repo happens before any of it becomes a Code build (R2-style).

## Decision: Direction D (Surimono — B×C hybrid)

Locked, and for the reasons in your own handover: A's trace-from-photos pipeline has
failed its quality gate twice and would make every future feature hostage to
illustration; C's loudness is the kind you discover late, in bad light, on a real phone;
B is correct but already called "boring" by the only user who matters. D fixes B's actual
defect with the two material moments that carry *information* (liquor swatch, clay
action), on a near-B pipeline.

**Framing we're adopting from you:** D is "B plus a few contracts," not a fourth style.
And per your §3: the **liquor swatch is the strong, portable idea** — D's job is to be the
quietest frame that makes it read loudest. Build D around that.

## Conditions of the lock

1. **Ration by contract, not by discipline.** Your §2/§5 fragility — D's rationing is a
   policy nothing structural enforces, so it decays into C by accretion. Fix as you
   proposed: the rationing is written as hard contracts, and the planning lane will pin
   them as invariants at reconciliation:
   - liquor = identity only
   - clay = one committing action per screen, never selection
   - xanthous marker = state
   - blue = Focus ring only
   - washi band = Home masthead only — **on probation** (see 2)
2. **Washi band on probation.** You flagged it as the one material moment carrying no
   information the "THIS WEEK" text doesn't. Keep it for now; hold it to its contract; if
   it ever fights the masthead, drop it without ceremony — D loses nothing structural.
3. **Rougher ensō — approved to explore, show both.** The one heritage change you'd
   actually make: same mark, same two arcs, a hand-weighted imperfect path instead of the
   geometrically perfect `a45 45`. Coherent with a material philosophy and keeps D from
   reading as sterile-B. Explore it and show it beside the current ensō; not a mandate.
   Shippori Mincho stays untouched (it's the through-line; no contest).

## R3 restyles what exists — it does not smuggle in new features

Important scope fence. Some boards show elements that are **not current app features**.
R3 is a visual level-up of the app as it is (plus its already-speced near future); it is
not the place to introduce new capabilities. Specifically:

- **"Cups drunk −/+" stepper (Log a cup): NOT a current feature.** Design the Log screen
  without assuming a cups-drunk counter. If you think it's worth having, propose it
  *separately* as its own idea — do not bake it into the locked layout.
- Legitimately-planned surfaces that MAY appear (these are in scope, already speced/gated):
  the Passport tab (#7), senchadō as a live method (phase-2 append), Insights/settings.
- **The one deliberate exception: the liquor swatch** (see mini-spec below). Niklas wants
  it; it's small and rides mostly existing infrastructure. It gets its own tiny spec, so
  it's a real planned element, not a smuggled one.
- Everything else invented as *presentation* (kanji fallback plate styling, folio/index
  numbering, clay-slab button treatment) is fine as visual language, and gets audited at
  reconciliation against what the app can actually do — but adds no new engine capability.

## Mini-spec: the liquor swatch

**The idea (locked):** each tea is identified by the colour it actually brews — a small
swatch, not a generic type icon. It shows on the tea itself and in the browsable
type database.

**Data source — three tiers, the app's standard precedence (specific beats general beats
nothing):**
1. **User-set colour = the truth.** A nullable colour on the tea, set once by the user
   (they're looking at the cup). Single-writer: the user's pick overrides everything,
   nothing auto-writes over it.
2. **Reference-catalog default = the fallback.** Each of the 55 `steep-tea-types.js`
   entries carries a representative liquor colour, so a tea whose colour the user hasn't
   set shows a sensible default *from its specific type* (not "oolong = one colour" — the
   taxonomy is two-level, so Lu An Gua Pian defaults to pale yellow-green, a roasted Da
   Hong Pao to deep copper). Suggestion only, overridable — the reference layer's
   existing contract.
3. **Nothing set, no type match → no swatch** (an unfilled/dashed placeholder, matching
   the "empty" treatment). Never guess.

**Picker = a curated palette of realistic tea-liquor colours, NOT a raw colour wheel.**
Decided. ~12–16 swatches spanning the real tea-liquor gamut: pale chartreuse → light
gold → amber → deep copper → reddish-brown → near-black, plus the greener/yellower
Japanese-green range and the pinker herbal edge. Calmer and more considered than a colour
wheel, and it prevents unrealistic picks. The palette is **derived from the reference
catalog's 55 characteristic liquors** — so it's generated from real data, and "nearest
realistic swatch" is fine when a tea sits between two (identity-at-a-glance, not a
spectrophotometer).

**Design's lane here:** the swatch's visual treatment (shape, size, how it sits on a tea
row / vessel / index entry / the type page), and the curated palette's exact colours and
picker layout. **Not** Design's lane: the data model (that's the mini-spec above, built by
Code later) — but Design should design *as if* all three tiers exist, because they will.

**Build note (for later, not Design):** this is the one R3 element with a real engine
dependency — a nullable `teas.liquor_color` field + a `liquor` value on the 55 catalog
rows + the palette picker. Small, in the exact mould of the v3.89 `steeps.feedback`
slice. It gets its own spec/pause/fixture pass before build; it does not ride the R3
visual lock blindly.

## Next step

Move D to per-workstream **locked bundles** (the four canonical screens first, then the
R3-gated issues), R2-style. When a bundle is ready, it comes to the planning lane for
reconciliation against the live repo *before* Code implements — the rationing contracts
and the swatch data-model are the two things that get pinned there. Nothing goes board →
build without that pass.
