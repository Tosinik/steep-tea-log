# SPEC amendment A5 — the `ivory` stop, and the bud-only exception

**Planning lane.** Niklas checked the four `gold-pale` teas from memory and reported:

- **Yunnan Silver Bud Ya Bao is the palest.**
- **Huang Ya Yellow Tips is darker than it.**
- **2021 Fujian White Tea is darker than it.**
- **Ruby Ruanzhi is "way darker"** — handled separately, see A6.

Asked whether Huang Ya and Fujian White differ from each other, he confirmed **they do**. So the
ramp gains **two** stops, not one — `ivory` at the pale end, and `yellow-pale` for the catalog's
single yellow row.

## The new stops

**Twelve stops.** `ivory` is inserted between `straw` and `gold-pale`; `yellow-pale` between
`ivory` and `gold-pale`.

| key | light | dark | what it is |
|---|---|---|---|
| `ivory` | `#F2EBD4` | `#EFE7CE` | bud-only whites — barely-tinted, faint gold |
| `yellow-pale` | `#EDE2B8` | `#EBE0BC` | yellow tea — a clear, light gold |

**Direction set by observation, against the rule.** The `men huang` reasoning predicted yellow would
sit *deeper* than white. Niklas reports the opposite — his Fujian White is darker — so the stop sits
**between `ivory` and `gold-pale`**, and the name changed with it: `yellow-pale`, not `yellow-gold`.

**One open question, deliberately not blocking.** His Fujian White is a **2021**, so five years old,
and white tea darkens with age — the catalog's white rows note ageing in their own signature. His
comparison may therefore be *aged white versus fresh yellow* rather than *white versus yellow*, which
is A6's shape again. If a fresh Fujian white later reads paler than Huang Ya, the fix is a **tier-1
correction on the 2021 jar**, not a ramp change. Recorded so the next person doesn't re-derive it.

`gold-pale` `#E8D9A0` is unchanged and keeps everything else.

The two are close by design: this is a real but small difference, and overstating it would make a
white tea look like an oolong. The gap between them should read as *two shades of pale*, not as two
different teas.

## Rule exception 1: yellow tea gets its own stop

`huang-ya` moves from `gold-pale` to `yellow-pale`. **This cannot be derived either.** `huang-ya`
carries `ox 0-0` and `roast: none` — numerically identical to an unroasted green — because its colour
comes from `men huang`, a process step no field in the catalog records. Same shape as hojicha, where
roast had to override the green-family branch, and as `family: dark`, where oxidation is a null
signal.

`yellow` is the catalog's smallest family: **one row**, so this stop has exactly one occupant and
will until another yellow tea is authored.

## Rule exception 2: bud-only whites

`ya-bao-yunnan` and `bai-hao-yin-zhen` move from `gold-pale` to `ivory`.

**This cannot be derived.** All seven white rows carry `ox 0–15` and the same inherited signature;
`ya-bao-yunnan` differs only in its own text ("winter/early-spring dormant buds, sun-dried"). The
fact that separates them — **the tea is buds only, not buds and leaf** — is not a field in the
catalog. So this is a **per-slug exception**, recorded as such, in the same class as `family: dark`
being per-slug because oxidation is a null signal for post-fermented tea.

`bai-hao-yin-zhen` is included on the same reasoning (Silver Needle is bud-only) even though it is
not on the shelf and therefore not verified by anyone's mouth. **Flag it as inferred, not observed** —
Niklas verified Ya Bao; Silver Needle is reasoning from the same rule.

## Revised assignments

| stop | n | rows |
|---|---|---|
| `ivory` | 2 | ya-bao-yunnan · bai-hao-yin-zhen |
| `gold-pale` | 7 | fujian-white · bai-mu-dan · gong-mei · shou-mei · yue-guang-bai · baozhong · ruan-zhi-oolong |
| `yellow-pale` | 1 | huang-ya |

All other stops unchanged. Total assigned stays 44; deliberate nulls stay 11.

**Niklas's shelf becomes eight distinct swatches across 12 teas:** Ya Bao alone on `ivory`; Fujian
White on `gold-pale`; Huang Ya on `yellow-pale`; the four Japanese greens on `jade-pale`; Ali Shan
`gold`; Gui Fei `amber`; Da Hong Pao `amber-deep`; Oriental Beauty `copper`. Ruby Ruanzhi pending A6.

Eight distinct swatches over twelve teas is a high ratio, and it is the right one — it means the ramp
is resolving teas rather than grouping them. Four of the twelve share a stop, and those four are four
Japanese greens, which genuinely do pour alike.

## A note on how this stop was reached

The yellow stop was proposed on the `men huang` reasoning, then **withdrawn** because the evidence at
that point was only "Huang Ya is darker than silver bud" — a comparison to a third tea, not to Fujian
White. It was reinstated when Niklas confirmed the two differ.

That sequence is the right one and worth keeping visible: the theory was sound both times, and what
changed was the evidence. **A rule that predicts a difference is not the same as an observation that
one exists** — and here the observation came from the only person who has drunk both.

---

# A6 — Ruby Ruanzhi is probably tier 1, not a catalog correction

The catalog has `ruan-zhi-oolong` at **ox 10–25, roast none-light**, "light, floral, creamy, citrus;
Thai high-mountain" — a pale oolong. Niklas reports his pours **way darker**.

Two possibilities, and they have opposite fixes:

1. **His jar is a variant of the style** — more oxidised or roasted than typical, or a red-style
   version, which the name "Ruby" may signal. Then the catalog is right, and **this is exactly what
   tier 1 exists for**: a per-tea correction. Forcing the catalog stop darker would make every pale
   Ruan Zhi wrong in order to fix one tea.
2. **Ruan Zhi as a style generally pours darker than the catalog says.** Then the catalog row is
   wrong and `oxidation` should be corrected at source, with the liquor following from it — not
   patched at the liquor field alone.

**Do not change anything until this is settled**, because the two fixes are incompatible and one of
them corrupts a style. The check is the vendor's own description — MainTee Würzburg — and it costs a
minute.

This is the first case where a per-tea correction and a catalog correction are genuinely confusable,
and it is worth recording as the shape to watch: **a tea that disagrees with its style is tier 1; a
style that disagrees with itself is a catalog defect.**
