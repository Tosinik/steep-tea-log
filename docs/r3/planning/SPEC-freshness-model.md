# SPEC — Freshness model

2026-07-19 · **Planning-lane spec**, pinned at the Bundle 1 + 2 Design → Code hand-off. Joins
the **swatch data-model** and the **per-origin script data-model** as a hand-off pin. Supersedes
the earlier "re-anchor freshness on harvest" instruction — harvest is a *fallback*, not the anchor.

**Rev 2 (2026-07-19)** — reviewed against the live build at `9ce9492`. Rev 1 mis-stated what
ships today in three places and under-specified the blast radius; both are corrected below. See
§ *Corrections to rev 1* for what changed and why, so the errors aren't re-introduced.

---

## 0 · Scope — this slice owns the shelf, not just a detail block

**The new model is the single writer for freshness on every surface.** Two clocks disagreeing
about one tea is the bug class this project guards against by name (#13), and "detail is richer,
the shelf is legacy" is a silent divergence nobody notices until it's wrong.

Concretely, in `steep-teas.js`:

- **`statusLine`'s precedence rule is the invariant and must survive**: quantity outranks
  freshness while remarkable — `empty · untracked · low · few` all short-circuit before any
  freshness branch. The #18 correction stands: an "ages well" or "best within 3 wks" on a
  nearly-empty tin hides the real story.
- **`statusCategory` retires.** It is a pure `type → ages|delicate|neutral` map, consulted only
  after the quantity tiers are exhausted. Both its branches are subsumed — `ages` becomes the
  catalog `ageing` flag, `delicate` becomes per-type windows. Keeping it would reintroduce a
  second type→class writer through the door this ruling closes.
- **`FRESH_WINDOW_MONTHS` (12) and `FRESH_NEAR_WEEKS` (26) retire** as global constants.
- **`fixtures/status-line-test.js` section D (4 checks) is rewritten to the new expectations,
  not patched.** It currently pins the global-12-month behaviour.

⚠ **Blast radius.** The shelf status line is the most-seen surface in the app — it renders on
every card in the Library, in the picker, and feeds the running-low sort. This is a bigger slice
than a detail-page block. Today it is visible on two teas (§6); the radius grows with the data.
Code should see this before estimating.

---

## 1 · The headline: opened-vs-sealed, not age

The variable the app has been missing isn't shelf age — it's **whether the pouch is open.** Once
the seal is broken, oxygen, light and moisture start the real clock, and the difference between a
sealed and an opened bag is roughly a **5–10× swing** in how long the tea holds.

Consequence: a freshness reading is only trustworthy when we know **when the tea was opened.**
Everything else is an estimate, and we say so.

---

## 2 · Two groundings, not one

A countdown needs **two** independent things, and rev 1 conflated them:

| | grounds | source |
|---|---|---|
| **the clock** | *when the tea started ageing* | `opened_date` → `harvest` → nothing |
| **the window** | *how long this kind of tea holds* | catalog slug → family → nothing |

They fail independently, so the reading degrades on two axes:

| clock | window | reading |
|---|---|---|
| measured (`opened_date`) | grounded | **full** — countdown, or history when `ageing` |
| estimated (`harvest`) | grounded | **full, softened** — tagged *assumes sealed until opened* |
| measured or estimated | **none** | **elapsed-only** — "opened 6 weeks ago". No countdown, no window claim. |
| **none** | any | **no reading.** The block is absent — not a guess, not a zero. |

**Elapsed-only is not a guess.** A date the user typed is measured; only the *window* would be
invented, and that is exactly what we withhold. This matters practically: `covers` is
hand-curated in source and Phase C is confirm-not-auto-write, so **every new tea starts
uncovered by construction**. Without this rung, the field we are asking Niklas to start filling
would show nothing until someone hand-edits the catalog — a bad loop for the one input the whole
model depends on.

**Purchase is not on the ladder.** It tempts as a fallback because it's more-filled than harvest
(35% vs 14%, measured), but that is the trap: purchase says when the tea reached *you*, not when
it was made — a 2023 harvest bought in 2026 would read as fresh. Purchase supports only a *floor*
claim ("owned since June 2024"), which is provenance and is already shown
(`steep-teas.js:720`). It keeps **every one of its other jobs**: the stock curve, the ledger
consumption rate, and `monthKey` cost-by-month.

### Shelf vs detail

**The shelf's freshness tone is two-key: it fires only when clock *and* window are both
grounded.** Detail's ladder is graded.

WS5 requires one status line in the same slot and weight on every card, so "the block is absent"
has no shelf equivalent — a card cannot have an empty status line. **Ungrounded on the shelf
falls through to the plain quantity tone** (`23 g · plenty`), never an empty slot. That is a
stock statement, not a freshness claim, so *never guess* survives intact.

So a tea with `opened_date` and no catalog match reads `23 g · plenty` on the shelf and "opened
6 weeks ago" on detail. Those are not two answers to one question — one is a stock fact, the
other a date fact, and neither claims freshness. The shelf answers *what can I brew*; detail
carries the full record.

---

## 3 · Windows — catalog data, keyed on slug

Windows live in the **catalog as sealed/opened pairs**, with the same three-tier provenance as
the swatch (catalog value, user override wins, nothing when ungrounded).

**Key: catalog `slug`, falling back to the matched row's `family`.** Not `teas.type` — the split
that matters most (Japanese vs Chinese green, ~2× apart) and matcha both exist only at slug
level. `matchTeaType` resolves 13 of the 14 real teas; the one miss is the junk "Test" row, which
is the correct outcome.

> ⚠ **SEED VALUES, not settled fact.** Published guidance disagrees by up to ~2×, which is *why*
> these live in editable catalog data rather than hard-coded. Never present a number below as
> authoritative in UI copy — show the reading, keep the precise figure soft ("~5 wks").

| Type | Sealed (seed) | Opened (seed) | Ageing default |
|---|---|---|---|
| Matcha *(slug)* | ~12 mo (cold) | ~3–4 wks | no |
| Japanese green — shincha/sencha/gyokuro *(slug)* | ~6–12 mo | ~1–2 mo | no |
| Chinese/other green | ~12 mo | ~2–3 mo | no |
| Yellow | ~12 mo | ~2 mo | no |
| Oolong | ~1–3 yr | ~4–12 mo | **off** — per-tea flag; widens with roast |
| Black | ~2–3 yr | ~6–12 mo | no |
| White | — | — | **on** |
| Puer / dark | — | — | **on** |

**Herbal / tisane is dropped.** No `teas.type` value, no catalog family, zero instances — it was
speculation.

**Seed oolong conservatively.** It is 6 of 14 teas on the real shelf — the largest group, larger
than green — and it carries both the widest seed range and the most contested guidance. There is
not one black or pu-erh tea in the live library.

One **Oolong** row, not two: a green TGY and a heavily-roasted Wuyi are both oolong and their
windows differ by *roast*, not by family, so the seeds span the range and the specific tea's
behaviour is a per-tea flag.

---

## 4 · Ageing — a per-tea flag

**Ageing is a boolean on the catalog entry, not a property of the family.** A light TGY and a
re-fired Wuyi are both "oolong"; only the second ages. So there is no roasted-vs-unroasted
boundary in the type table — one **Oolong** type, defaulting **off**, flippable per tea. White
and puer/dark default **on**.

When `ageing` is **true** the block shows **elapsed time as history** — "3 yrs rested", "ages
gracefully" — with **no countdown, no warning tone, no urgency colour.** It still reads
`opened_date` when present (an opened cake does change), but the framing is a record, never an
alarm. When **false**, the windows apply as a countdown.

**Ageing is not new capability.** White and pu-erh already ship it — `statusLine` renders "ages
well" / "ages gracefully" on the shelf, and `freshnessCueHTML` renders "this style deepens with
age." on detail. **Only oolong ageing is new.** The rest of this section is a *copy replacement*
over shipped behaviour, which is a different regression profile than net-new — the existing
strings and tones are under test and in muscle memory.

---

## 5 · Schema additions (Code slice)

- **`teas.opened_date`** *(date, nullable)* — the rung-1 anchor. Entry point on the tea form
  beside purchase date (same provenance cluster); show-when-present on Tea detail.
- **Catalog freshness windows** — `{ sealed_days, opened_days }` per catalog row, plus an
  `ageing` boolean defaulting per family and overridable per tea. Editable rows, seeded from §3.

---

## 6 · What this looks like on ship day

**It lights up for one tea.** `opened_date` is 0/14 by construction, and harvest grounds only
two: Fujian White 2021 (`ageing` → history framing, no countdown) and Shincha 2026 (the sole
countdown). Every other tea shows an absent block on detail and a quantity tone on the shelf.

That is correct-by-design and must not be read as a failed build. The payoff is entirely in data
not yet entered — which is the argument for shipping the `opened_date` field early even though
the reading stays quiet for a while.

---

## 7 · Hand-off items — collisions to resolve, not assume

**7.1 · `isTeaUnopened` vs `opened_date`.** `steep-core.js:711` already infers openedness from
stock evidence (`orig<=0 || amountGrams >= orig`) and drives the Home greeting: *"The X is still
unopened — today could be the day."* Its comment names it "One authoritative definition… never a
second inline copy that could drift." `opened_date` **is** that second definition. A tea can have
`opened_date` set and still satisfy `isTeaUnopened()` — seal broken, date logged, grams not yet
drawn down — so Home would say unopened while detail says opened six weeks ago.
**Resolution: same ladder shape.** `opened_date` set → opened, measured, full stop. Absent →
stock inference as today. `isTeaUnopened` becomes the fallback rung, not the authority.

**7.2 · `puerh` vs `dark`.** `teas.type` uses `puerh`; `TEA_TYPES.family` uses `dark`. Two
vocabularies naming one thing. Latent independent of freshness, and it will bite whichever slice
touches it first. Flagged, not assumed.

**7.3 · The catalog join is exact-name and hand-curated.** `matchTeaType` folds and matches a
library tea's **name** against `covers` — no id pinning. So a rename silently breaks the join,
and a new tea has none until someone edits source. Freshness windows would be the fourth system
hung off that join. Worth deciding whether it stays name-matched before more weight lands on it.

**7.4 · Treat every remaining "this is new" claim in the R3 pins as unverified.** Rev 1 claimed
the app lacked three things it has (§8). The pattern is systematic under-inventory of the live
build, not three unlucky typos.

---

## 8 · Corrections to rev 1

Recorded so they aren't re-introduced. All three were verified against `9ce9492`.

| rev 1 claimed | actually |
|---|---|
| "the live engine knows only `freshnessClass` (delicate vs neutral)" | `freshnessClass` returns `young`/`ages`/`null` and is the v3.62 **detail cue only**. Delicate-vs-neutral is `statusCategory`, a *different* function driving the **shelf** — the load-bearing one, which rev 1 never mentions. |
| "no concept of oolong *ageing*" (flagged as new capability) | Ageing ships for white + pu-erh on both surfaces. Only **oolong** ageing is new. |
| "no concept of *opened*" | `isTeaUnopened` (v3.90) exists — inferred from stock, not measured. See §7.1. |

Rev 1 also left the slice scoped as a detail-page block when single-writer discipline requires it
to own the shelf (§0), and conflated clock-grounding with window-grounding (§2).

---

## 9 · What already exists (leave alone)

- **`sincePurchaseDays`** — stays with the **consumption forecast** (`ledgerRate → daysLeft`),
  confident at ≥10 days of ledger (`steep-dashboard.js:403`). Not a freshness input.
- **`inventoryHistory` / `inventorySparkline`** (v3.28) — the stock curve, anchored by
  `purchase_date` + grams bought. R3 had dropped it to a flat bar; restored on Tea detail.
- **`statusLine`'s quantity-first precedence** — see §0. The engine's most important rule.
- **`freshnessClass` / `freshnessCueHTML`** — superseded by §3 + §4, which subsume the
  young/ages split and add the opened/sealed pair. Note this is a *replacement of rendered copy*.

---

## 10 · Rinse — deferred, two constraints already fixed

Rinse research sits with the planning lane and is **not in this spec**. Two decisions already
taken, recorded so the research doesn't reopen them:

1. **Structured supersedes prose.** Four catalog rows already carry rinse guidance inside
   `typical_brew.note` ("rinse then flash steeps", "rinse 1-2x; forgiving"). The note text may
   remain as display prose, but **only the structured value drives behaviour**, and those four
   get migrated as part of seeding. Two sources able to disagree about one tea is the pattern
   that keeps biting.
2. **Do not overload `confidence`.** That field is *taxonomy* confidence — the three contested
   rows are Ruan Zhi (TRES #17 disputed), Da Hong Pao (blend vs single-cultivar) and Jin Xuan
   (the milky claim), all about what the tea **is**, none about how it's brewed. `resolveTeaType`
   deliberately forces it per-row so parent confidence can't leak. Rinse contestedness needs its
   own field, or a canonical-taxonomy tea with contested rinse guidance is unrepresentable.

---

## 11 · Why purchase_date still earns its promotion

The last round promoted `purchase_date` above the fold on Add. That was right — for the right
reasons: it anchors the **inventory sparkline** and the **ledger consumption rate**, and drives
`monthKey` for cost-by-month. It is **not** the freshness anchor. Prominence follows
load-bearing: `purchase_date` is the freshness-*adjacent* cost + inventory join; `opened_date` is
the freshness join proper.
