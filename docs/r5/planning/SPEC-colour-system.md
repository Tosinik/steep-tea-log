# SPEC · Colour System (grouped liquor palette + flat leaf ramp) — for the ramp pre-slice

Authoritative palette for the app-wide colour ramps, extracted from the Design board
"SlowCup R5 - Colour System" (dc rev 1) and reconciled by the planning lane. Supersedes the
earlier "add six liquor stops to eighteen" plan. Code builds the ramp slice from THIS file;
commit it docs-only first, then build.

## What this is

The liquor ramp grows from 12 flat stops (built to identify a tea, not describe a cup) into
one ramp of 25 stops in six families you choose by eye. All 12 existing keys and hexes are
preserved in place. 13 are new, landing where the ramp was thinnest: four greens, three reds.
The leaf ramp is net-new and stays a flat 10 (nine colours plus a mottled modifier). One
extension, never a fork: same keys, one ordered ramp, same storage. Families are only a picker
grouping.

## Liquor ramp — 6 families, 25 stops

Each stop: `key` — light hex / dark hex. (●) existing, preserved; (○) new, provisional.

**Barely there** (4, a first rinse / bud-only white / a green brewed light)
- (○) `clear` — #F7F4EA / #F6F2E6
- (●) `ivory` — #F2EBD4 / #EFE7CE
- (○) `oat` — #E9DEC4 / #E2D6BC
- (○) `pale-grey` — #E5E2D6 / #DCD9CB

**Green** (6, where the old ramp had two stops for every green tea)
- (●) `straw` — #D8D48A / #DFD996
- (○) `pale-green` — #C6D68F / #CFDD9C
- (●) `jade-pale` — #A9C46E / #B8D07E
- (○) `grey-green` — #9DAE7B / #A9B98A
- (○) `leaf-green` — #85A548 / #93B159
- (○) `deep-green` — #6B8A3A / #7B9A4A

**Yellow and gold** (4, already well served; one greenish gold added)
- (●) `yellow-pale` — #EDE2B8 / #E8DDB6
- (●) `gold-pale` — #E8D9A0 / #DED2A0
- (○) `green-gold` — #DCCB72 / #D3C069
- (●) `gold` — #DCB863 / #E2C275

**Amber and orange** (4, roasted oolong and strong black land here together)
- (○) `apricot` — #E0A45F / #E4AE70
- (●) `amber` — #C99447 / #D2A05A
- (●) `amber-deep` — #B87A38 / #C4884A
- (●) `copper` — #A15E2E / #B26F3D

**Red and brown** (4, one stop used to carry the whole red-tea family)
- (○) `rust` — #C0632F / #CB7442
- (○) `brick` — #A94A2B / #B85C3D
- (○) `garnet` — #85302A / #8E3A34
- (●) `mahogany` — #7E3B26 / #96503A

**Dark** (3, past three a dark cup is just dark)
- (●) `sepia` — #5A3122 / #7A4A36
- (○) `coffee` — #40241A / #5F3A2A
- (●) `near-black` — #2E1C14 / #4A3125

Preserved existing (12): ivory, straw, jade-pale, yellow-pale, gold-pale, gold, amber,
amber-deep, copper, mahogany, sepia, near-black. New (13): clear, oat, pale-grey, pale-green,
grey-green, leaf-green, deep-green, green-gold, apricot, rust, brick, garnet, coffee.

## Leaf ramp — flat 10 (nine colours + one modifier)

Leaf hexes are matte and run darker than liquor at the same name (e.g. leaf `amber` #8F5C2A
vs liquor `amber` #C99447). This is intentional; the two ramps are separate token sets.

- `silver-down` — #D8D6C4 / #CFCDBB
- `jade` — #7E9A55 / #8CA863
- `olive` — #6B7340 / #79814E
- `deep-green` — #3F4B2A / #4D5938
- `golden` — #B98A3C / #C5964A
- `amber` — #8F5C2A / #9D6A38
- `chestnut` — #6B3B22 / #7A4A30
- `dark-brown` — #43291B / #523829
- `near-black` — #241812 / #33251E
- `mottled` — MODIFIER, not a hue. Renders as a split swatch over the dominant stop; describes
  variegation, not colour. The tenth slot.

## Namespacing (Code must hold this)

Leaf and liquor keys collide by string (`jade`/`jade-pale`, `deep-green`, `amber`,
`near-black`) but are different tokens on different ramps: leaf keys map to `--leaf-*`, liquor
keys to `--liquor-*`. In the tasting record, `dryLeaf.colour` stores a LEAF key and
`liquor.colour` stores a LIQUOR key, so the fields never collide. Leaf `deep-green` (#3F4B2A)
is not liquor `deep-green` (#6B8A3A).

## The picker (both ramps use the same control)

Two-step drill-down: choose a family by eye, then a shade within it. One family opens at a
time, the others stay visible as their own strips so you can confirm the neighbourhood before
committing. Targets are 44px+ (the whole reason for two steps; 25 stops in one row are ~14px
and unhittable). The leaf ramp, being nine well-separated colours, stays a flat strip with NO
family step.

Same control, two contexts:
- **In the tasting** (per-cup): a reading of one cup. The tea's own swatch is shown as an
  unmoving reference.
- **On the tea identity** (per-tea): the catalog default is named as a default; your own
  tasting becomes a declinable offer. Nothing writes across on its own (the rating prompt's
  pattern reused).

## Storage & rulings

- **Keys, not hexes.** A stop stores its key. A later hex re-tune never rewrites a stored
  tasting or tea. (Same reasoning as the existing liquor swatch model.)
- **Type cascade stays coarse (Q2, ruled).** `liquorFor` tier 1 is the user's own pick, tier
  2 the coarse catalog default. New stops are tier-1-only by design; the catalog is NOT
  re-authored. Verified distribution: 9 teas on amber-deep, 9 on jade-pale, 8 on mahogany.
  The precision belongs to where someone actually looked at the cup.
- **A3 test → global minimum distance (Q3, ruled).** The ramp validation checks a global
  minimum-distance across all 25 stops, not just adjacent pairs (closes the straw vs gold-pale
  question too).
- **Validation policy (Q1, ruled).** Every hex is provisional and validated against a REAL
  cup (and real leaf) on the shipped ramp. The 12 existing hexes are FROZEN (set by taste,
  shipped). The 13 new stops may be re-tuned or dropped; a new stop that fails the global
  minimum against a real cup collapses into its neighbour and is removed. Deleting a new stop
  is free; do not retune an existing one.
- **Mottled is leaf-only (Q4, ruled).** Cup turbidity is already captured in the tasting as
  clarity (bright / a bit hazy / cloudy); mottled on liquor would record the same thing twice.
- **Family name is derived, not stored (Q5, ruled).** The record stores the key only (single
  source of truth); the family label is rendered from the key, so the record can show "gold ·
  yellow and gold" without a second stored field that could disagree.
- **Packaging (Q6, ruled).** Both ramps ship as one token slice FIRST, ahead of the tasting
  build, with their own phone-look. The tasting rooms consume locked keys. An extension is
  retune-safe either way, but the rooms cannot ship before the stops they pick from exist.

## Never-guess holds

No stop is auto-filled. No averaged colour is written for a mixed session. A cup nobody looked
at records nothing. Nothing here is a rating and no shade is better than another.
