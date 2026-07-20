# DATA — region → coordinates (pass 3 — COMPLETE)

2026-07-19 · Planning lane. Seeds the Origins map's missing coordinate source.

**Why this exists:** the R3 Origins board places pins from "catalog lon/lat." No such data exists
— `steep-tea-types.js` carries `region` as a *string*, never coordinates. The only spatial data
in the app is `steep-passport.js`'s 60×24 equirectangular grid (`col=(lon+180)/6,
row=(78−lat)/6`), hand-placed at 6° ≈ 660 km per cell — coarse enough that Wuyi and Fuding are
the same cell, and so are Kagoshima and Yame. A real map needs a real table.

---

## Keying decision — origin string, not catalog

**The lookup key is the normalised `teas.origin` string**, not a catalog slug.

This follows the user-origin-first ruling and matters more than it looks. `teas.origin` is filled
by the user (21/22) and `matchTeaType` is an exact-name hand-curated join covering 12/22 and
falling. Hanging coordinates off the catalog would make the map inherit the fragility Origins was
deliberately routed around — Yashi Xiang Dancong would lose its pin the same way it already lost
its swatch, because a typo fix broke its `covers` entry.

Normalisation follows the passport's existing alias approach: fold case, trim, tolerate the known
misspellings already in the data (`Fukoaka` → Fukuoka; `Guandong` → Guangdong).

---

## Precision decision — needed from Design, proposed here

Proposed: **city / district level, ~2 decimal places (≈ 1 km).** At a five-country projection
that is far finer than any pixel can show, and it removes the need for a second pass if the map
ever zooms. Chasing estate-level precision costs real research for detail nobody sees.

**Second decision, harder:** for a *province-level* origin like "Yunnan, China," where does the
pin sit? Pass 1 proposed the administrative centroid. **Pass 2 reverses that.**

A centroid is a *computed* value — there's no authoritative source to check it against, so
adopting it would mean recalling numbers and calling them data, which is the exact failure this
table exists to avoid. A **provincial capital is a real place with a verifiable coordinate.**

| option | verifiable? | honest? |
|---|---|---|
| administrative centroid | **no** — computed, no source to check | yes, but unverifiable |
| **provincial capital** | **yes** | yes, if labelled as the province marker |
| the tea-growing area | yes | **no** — Yunnan tea is southern; picking it guesses which part was meant |

**Ruling: provincial capital, labelled as the province's anchor, not as where the tea grew.**
Niklas's instruction was "take your pick for now; if we have more data, go there" — so when an
origin string narrows (a tea recorded as "Wuyi, Fujian"), that row gets its own entry and the
province row stays as the fallback.

At five-country scale the difference is invisible anyway: Fuzhou to Wuyi is ~300 km, a few pixels.

## The table — 9 distinct origin strings, 12 teas

| origin string (as recorded) | teas | lat | lon | confidence | anchor |
|---|---|---|---|---|---|
| `Kagoshima, Japan` | 3 | **31.60** | **130.56** | **verified** ×3 | Kagoshima City (Wikipedia 31.59694/130.55722) |
| `Chiran, Kagoshima, Japan` | 1 | **31.38** | **130.44** | **verified** ×2 | Chiran-chō (Minamikyūshū city hall sits in it) |
| `Hoshino, Fukoaka, Japan` | 1 | **33.25** | **130.77** | **verified** ×2 | Hoshino-mura (Wikidata 33°15′N 130°46′E; merged into Yame 2010). Oku-Yame — tea-grown since the Muromachi period. |
| `Fujian, China` | 1 | **26.07** | **119.31** | **verified** ×4 | Fuzhou (provincial capital, R15) |
| `Yunnan, China` | 2 | **25.04** | **102.72** | **verified** | Kunming (provincial capital, R15) |
| `Guangdong, China` | 1 | **23.12** | **113.25** | **verified** | Guangzhou (provincial capital, R15) |
| `Zhejiang, China` | 1 | **30.29** | **120.16** | **verified** | Hangzhou (provincial capital, R15) |
| `Nantou, Taiwan` | 1 | **23.92** | **120.68** | **verified** | Nantou City (county seat) |

**All eight rows verified against independent sources. The table is complete.** Two pass-1
values were corrected by verification: Hoshino moved ~5 km east of the interpolation
(33.25/130.77, not ~33.22/130.72), and Kunming's longitude was 0.01° off. The Ceylon row is
gone — see below.

---

## Finding — "Ceylon, Sri Lanka" is a country-only origin wearing a comma

The comma makes it look region-level, so the board renders it as a region pin. But **"Ceylon" *is*
Sri Lanka** — the island's former name, and as a tea term it means "Sri Lankan tea," not a
sub-region. There's no more locational information in it than "China" carries.

So it belongs in the `? N` country tier, not the region tier. That makes the real split
**11 region-level teas and 10 country-only**, not 12 and 9 — and Sri Lanka gets a `?1` pin
alongside Thailand's.

Worth handing to Design directly: the normaliser can't just split on commas. It needs a small
list of country synonyms (`Ceylon → Sri Lanka`, `Formosa → Taiwan`) that demote to the country
tier. The passport's alias table already carries `'ceylon'` under Sri Lanka, so the precedent
exists.

---

## Elevation — a column to reserve, not fill

Reserve `elevation_m` but leave it null for now. Two reasons.

A region's elevation is a **range**, not a point — Hoshino spans 200–1,000 m, Yabe sits at 330 m.
Storing one number per region invents precision. And the per-tea `elevation` field is already a
flagged R3 schema question (the add/edit board shows `610 m · NEW`), which is the *right* home:
elevation is a property of where a specific tea was grown, not of a whole province.

So: per-tea elevation answers "is this high-grown," which is the interesting question. Region
elevation would only ever serve terrain rendering, which is a separate and much larger job.

---

## Country-tier pins carry NO coordinates — new ruling (R28)

The `? N` country pins (China ?5 · Taiwan ?3 · Thailand ?1 · Sri Lanka ?1) are **polygon
labels, not point data.** They claim "this country," and the Natural Earth country shape *is*
that datum — the renderer places the label inside the polygon (pole-of-inaccessibility /
polylabel), exactly as cartographers place country names. No invented coordinate, no
capital-vs-centroid dilemma (a China pin at Beijing would be verifiable but absurd on a tea
atlas), and the pending "Sri Lanka anchor" dissolves: there is nothing to look up.

Two tiers, two data kinds: **region = verified point (this table) · country = labelled
polygon (renderer).** Same honesty ladder, different geometry.

## Status

**Complete.** 8 region rows verified · country tier needs no rows (R28) · keyed on normalized
`teas.origin` with the country-synonym list (R16). Grows one row per new origin string; an
unmatched string degrades to its country tier, which is the correct `? N` behaviour.

To commit: `docs/r3/planning/` beside the ledger. R28 (and R29, Pillar B) belong in the
ledger's next docs batch.