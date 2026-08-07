# SPEC — the liquor swatch data model

**Planning lane, R4.** This is one of the two "hand-off pins" R82 found had never been written. The
swatch is **contract #1** of the visual contracts — *identifies a tea, identity only, never
decoration* — and it has shipped unimplemented for the whole of R3. What renders today is a **type
tint**: six colours keyed on `teas.type`, so every green tea is the same colour. That is a
placeholder, not a swatch.

This document is the model. It is not a board — #06 rev 4 draws the picker and #13 draws the shelf.

---

## 1 · The cascade

Three tiers, matching the pattern used everywhere else in the app (§0.5 of the R3 hand-off):

| tier | source | when |
|---|---|---|
| 1 | `teas.liquor` — the user's own correction | set explicitly on this tea |
| 2 | `TEA_TYPES.liquor` — the catalog value for the matched style | `matchTeaType` resolves and the row carries one |
| 3 | the shipped type tint | otherwise |

Tier 3 is **not** a failure state. It is what 8 of 21 shelf teas get today because they match no
catalog row, and it is a correct, honest rendering — the app knows the family and not the style.
**Never guess a liquor.** A tea with no match and no correction shows its type tint, and that is the
answer, not a gap.

**Resolution happens at read time**, never stored. Authoring a catalog liquor value later upgrades
every tea that matches it, including teas already on the shelf — the same reasoning as R97's
decision not to store `catalog_slug`.

## 2 · The palette

**A bounded, ordered ramp.** Not a free colour picker.

The reasons are the ones R39's own wording implies — it ratified a colour **correction**, and
correcting means moving from a wrong default to the right one within a known set:

- **The swatch identifies a tea, not a cup.** A Da Hong Pao is a different colour at steep one and
  steep six. A swatch that tried to be accurate would be wrong most of the time; one that is
  recognisable is right always. Two teas landing on one swatch is honest — they do look alike.
- **A bounded set keeps the shelf coherent.** Twenty-one arbitrary hex values side by side read as
  noise; the same twenty-one drawn from one considered ramp read as a collection. That is the line
  contract #1 draws between identity and decoration.
- **One tap, not a hue wheel.** A grid of swatches is a single press; a colour picker on a phone is
  precision you do not want while holding a gaiwan.

**Size is not fixed at 14.** #06 rev 4 draws fourteen; treat that as the opening proposal, not the
contract. Tea liquor occupies a narrow band — pale straw through gold, amber, orange-brown,
red-brown to near-black, plus a green arm for Japanese greens and a pale-jade one for some Chinese
greens. That is a ribbon, not a gamut, so fourteen stops may well be enough.

**Size it after the catalog values are authored, from evidence:** assign a liquor to all 55 catalog
rows, then measure how many distinct swatches the real 21-tea shelf needs. If they cluster onto six
of fourteen, fourteen is generous. If a dozen collide on two, that region of the ramp needs more
stops. **If fourteen proves coarse, the fix is more swatches on the same ramp — 18, 24 — never a free
picker.** Every property above survives an increase in resolution; none survives an unbounded space.

Catalog distribution for reference: 55 rows across oolong 25 · green 11 · black 8 · white 7 · dark 3
· yellow 1. Oolong is nearly half the catalog and spans the widest colour range, so it is where the
ramp will need its finest stops.

## 3 · Schema

```sql
alter table teas add column if not exists liquor text;
```

Nullable. Holds a **palette key**, not a hex value — so the ramp can be retuned without rewriting
user data, and so an invalid value is detectable rather than merely ugly. A key with no palette entry
falls through to tier 2, then tier 3.

`TEA_TYPES` gains a `liquor` field carrying the same key type. It is **not** in `TT_INHERIT` by
default — a Wuyi member and its parent may legitimately differ — but adding it is a one-line
decision to be made when the values are authored, not now.

## 4 · What the picker writes (R39)

Long-press a swatch → the palette grid → one tap → writes `teas.liquor` for that tea. Confirm-not-
auto-write, consistent with R55's offer path and the Borrow action.

**Clearing is a first-class action.** Removing a correction must return the tea to tier 2, not to
tier 3 and not to a stored copy of tier 2's value — otherwise a catalog improvement can never reach a
tea whose user once looked at it.

This unblocks **#14** (R89), whose listbox was deferred precisely because its primary affordance was
this correction.

## 5 · What is authoring work, not code

- **55 catalog liquor values.** Content, judged per style, sourced the way every other catalog field
  is. This is the long pole.
- The ramp itself: an ordered set of keys with light and dark values, in `styles.css` as tokens.

Both join the tea-reference content batch alongside the 8 uncovered shelf teas, the 3 owed coordinate
rows, and R82's other never-written pin, the per-origin script model.

## 6 · Order of work

1. **Author the ramp** — the ordered key set, light and dark.
2. **Author the 55 catalog liquor values** against it.
3. **Measure the real shelf** and size the ramp from evidence (§2).
4. **Then** the migration, the cascade, the picker.

Steps 1–3 are content and produce the number that step 4 builds against. Building the picker before
the ramp is sized would pin a size that has no evidence behind it — which is how fourteen got drawn
in the first place.

---

## 7 · The ramp

**Ten stops.** Sized from evidence, not from the board's fourteen: the catalog uses **nine**, and
Niklas's 21-tea shelf needs **five**. The tenth (`amber`) sits in the widest gap as headroom.

Ordered pale → dark. Keys are stable; hex values are retunable without touching user data, which is
why `teas.liquor` stores the key.

| key | light | dark | what it is |
|---|---|---|---|
| `jade-pale` | `#A9C46E` | `#B8D07E` | Japanese green — sencha, gyokuro, matcha |
| `straw` | `#D8D48A` | `#DFD996` | Chinese green — unroasted, pale yellow-green |
| `gold-pale` | `#E8D9A0` | `#EADFAF` | white tea, silver needle, light-oxidation oolong |
| `gold` | `#DCB863` | `#E2C275` | light gaoshan oolong |
| `amber` | `#C99447` | `#D2A05A` | *headroom — no catalog row lands here yet* |
| `amber-deep` | `#B87A38` | `#C4884A` | Wuyi yancha, roasted rock oolong |
| `copper` | `#A15E2E` | `#B26F3D` | high-oxidation oolong, roasted green |
| `mahogany` | `#7E3B26` | `#96503A` | hong cha — the whole red-tea family |
| `sepia` | `#5A3122` | `#7A4A36` | hei cha |
| `near-black` | `#2E1C14` | `#4A3125` | shou pu-erh |

**Dark values are lifted, not inverted.** A swatch is the colour of tea in a cup; inverting it would
make a pu-erh render pale, which is the one thing the swatch must never do. The dark column keeps the
same hue and raises lightness enough to stay legible on the dark ground.

**Geometry is Bundle 1's** — 24×32 at radius `9px 4px 8px 5px` for row swatches, and the derived
15×20 at `6px 3px 5px 3px` for small rows. Per R121 the small size is **derived, not locked**: Bundle
1 defines one geometry, and the session state's "3 sizes" is not in that file.

## 8 · The derivation, and the 55 assignments

Every catalog row carries `family`, `oxidation_low/high` and `roast`, and those three determine
liquor. The rule, in order:

1. `family: dark` → per-slug, because oxidation is meaningless for post-fermented tea
   (`shou-puerh` → `near-black`, `hei-cha` → `sepia`, `sheng-puerh` → **none**, age-dependent).
2. `roast: variable` → **none**. The style genuinely varies by maker; *never guess*.
3. `family: green` → roasted goes `copper`; else Japanese → `jade-pale`, other → `straw`.
4. Otherwise oxidation midpoint sets the base stop, and `medium-heavy` roast shifts one darker.

### Assignments

| stop | n | rows |
|---|---|---|
| `jade-pale` | 9 | sencha · shincha · kabusecha · gyokuro · matcha · genmaicha · bancha · kukicha · kamairicha |
| `straw` | 1 | anji-bai-cha |
| `gold-pale` | 10 | ruan-zhi-oolong · fujian-white · bai-hao-yin-zhen · bai-mu-dan · gong-mei · shou-mei · ya-bao-yunnan · huang-ya · yue-guang-bai · baozhong |
| `gold` | 2 | alishan-gaoshan · jin-xuan-milky |
| `amber` | 0 | — headroom |
| `amber-deep` | 9 | wuyi-yancha · dhp · rou-gui · shui-xian-wuyi · tie-luo-han · shui-jin-gui · bei-dou · qi-lan · huang-mei-gui |
| `copper` | 2 | oriental-beauty · hojicha |
| `mahogany` | 8 | hong-cha · dian-hong · keemun · lapsang-souchong · jin-jun-mei · ying-hong · lichuan-hong · jin-mu-dan-black |
| `sepia` | 1 | hei-cha |
| `near-black` | 1 | shou-puerh |
| **none** | 11 | dong-ding · phoenix-dancong · mi-lan-xiang · ya-shi-xiang · huang-zhi-xiang · zhi-lan-xiang · xing-ren-xiang · phoenix-shui-xian · anxi-tie-guan-yin · huang-jin-gui · sheng-puerh |

**Eleven rows carry no liquor and that is the correct answer**, not a gap: ten are `roast: variable`
(all seven Dancong, both Anxi TGY, dong ding) and sheng pu-erh varies by age more than any of them.
They fall to tier 3, the type tint. Under R55's precedent — suppress rather than assert a value that
varies — this is the same judgement.

**Three exceptions were found by checking the output, not by writing the rule:**

- `hojicha` first landed `jade` because the green-family override fired before roast could correct
  it. A roasted green pours reddish-brown.
- `sheng-puerh` and `shou-puerh` both landed `near-black` from `family: dark`, and they are the most
  visually different pair in the catalog. Both carry `oxidation 0-100`, which is a null signal for
  post-fermented tea, so the family branch must be per-slug.
- `lapsang-souchong` was flagged as needing a smoke exception and **does not** — the catalog's note
  says "traditionally pine-smoked", and modern Zheng Shan Xiao Zhong is often unsmoked. `mahogany`
  with keemun is right. Flagged from the Western "lapsang = smoky" association, which this catalog
  explicitly distinguishes.

## 9 · What this does not yet do — write it where a builder reads it

Per R116 and R121, the pattern to copy is contract 1's: **its absence caused no damage because it was
written down in two files and asserted in two suites.** So:

- **No per-tea value exists yet.** `teas.liquor` is unmigrated; every tea resolves at tier 2 or 3.
- **`amber` has no catalog row.** It is deliberate headroom, not an oversight — assert that it is
  reachable only by a user correction.
- **Eleven catalog rows are deliberately null.** A suite must assert they stay null, or a later pass
  will "complete" the table and assert a colour for a style that varies.
- **The small geometry is derived, not locked** (R121).
- **These hex values are a first pass by a lane that has not drunk these teas.** Two groupings in
  particular are plausible-on-paper and want a human check: `gold-pale` holds a Fujian white, a Thai
  Ruby Ruanzhi, a yellow tea and a Yunnan silver bud; and `copper` puts Oriental Beauty beside
  hojicha, arriving from opposite directions.

## 10 · Order of work, revised

Steps 1 and 2 of §6 are now done — the ramp exists and all 55 rows are assigned. What remains:

1. **Land the ramp as tokens** in `styles.css`, both themes.
2. **Land `liquor` on the 55 catalog rows** from §8's table.
3. **The migration** — `alter table teas add column if not exists liquor text;`
4. **The cascade** at read time, then the picker (R39), which unblocks #14 (R89).

Niklas's shelf will then show five distinct swatches across 12 teas; nine teas stay on the type tint
— one indeterminate (Yashi Xiang) and eight with no catalog match at all, which is the same content
gap that costs them Go Deeper and freshness rung 2.
