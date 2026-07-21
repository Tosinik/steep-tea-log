# DATA — Nested flavour tree

2026-07-20 · Planning lane. **Ratified by Niklas 2026-07-20.** Source: *Tea: History, Terroirs,
Varieties* (Third Edition), Kevin Gascoyne, François Marchand, Jasmin Desharnais & Hugo Américi (Camellia
Sinensis) — authors + edition confirmed by Niklas from the physical cover 2026-07-21 (the p.221/223 page
refs are edition-specific). This is the committed dataset behind **R31**; it replaces the `[unclear]`
citation headers here and in both transcription files (the earlier Palais des Thés / Delmas lead was
wrong — struck). Drafted against `DATA-flavour-wheel.md` (source
structure, terms verbatim), the real `tag_library` (15 tags, 2026-07-19 export), and shipped
`KB_FLAVOR_CHIPS` (25 keys). Anchor ruling (Niklas, 2026-07-20): **the tree is wheel-native — twelve
families**; the 25 chips are terms *within* it, not the axes. Seed depth: **curated ~80**, not full
coverage. German: **input-first, not label-first** — see §5.

Storage contract (unchanged from the handover): **the specific word is stored and displayed as
written**; membership resolves **exact key → alias → bare**; roll-up climbs term → sub-family →
family. A genuinely novel word stays bare (honest floor). Axis count is whatever the render layer
chooses to draw — the taste panel is provisional (Design gate), so nothing here prescribes bars.

Provenance tiers: `[wheel]` = verbatim from the transcribed source · `[chip]` = existing
KB_FLAVOR_CHIPS key placed by us · `[user]` = in Niklas's tag_library · `[ours]` = our mapping or
addition, not in the source. Confidence is per-mapping where non-obvious.

---

## 1 · Families (12) — DE labels required (rendered tier)

| # | Family | DE | Sub-families |
|---|--------|----|--------------|
| 1 | Vegetal | Vegetabil | Dry herbs · Fresh herbs · Aromatic herbs · Vegetables |
| 2 | Marine | Marin | — |
| 3 | Floral | Blumig | Fresh flowers · Opulent flowers |
| 4 | Fruity | Fruchtig | Fresh fruits · Berries · Citrus · Dried & candied · Exotic |
| 5 | Woody | Holzig | Woodlands · Undergrowth |
| 6 | Earthy | Erdig | — |
| 7 | Empyreumatic | Röstaromen *(pragmatic DE, not literal)* | — |
| 8 | Animal | Animalisch | — |
| 9 | Mineral | Mineralisch | — |
| 10 | Confectionery | Süßwaren | — |
| 11 | Spiced | Würzig | — |
| 12 | Milky | Milchig | — |

Sub-family DE (13): Trockene Kräuter · Frische Kräuter · Aromatische Kräuter · Gemüse ·
Frische Blüten · Opulente Blüten · Frische Früchte · Beeren · Zitrus · Trocken- & kandierte
Früchte · Exotische Früchte · Waldig · Unterholz.
Family/sub-family asymmetry is the source's — preserved, do not invent sub-families for the eight.

---

## 2 · Curated seed terms (~80) with DE input-aliases

Format: `term [provenance] (DE alias/es)`. DE aliases are for **recognition**, not display —
a German-typed word is stored as written and resolves through the alias to its node.

### Vegetal
- Dry herbs: hay [wheel] (Heu) · straw [wheel] (Stroh)
- Fresh herbs: cut grass [wheel] (frisch geschnittenes Gras, Gras) · **grassy** [chip·user] (grasig) · green wood [wheel] (grünes Holz)
- Aromatic herbs: mint [wheel] (Minze) · basil [wheel] (Basilikum) · thyme [wheel] (Thymian)
- Vegetables: spinach [wheel] (Spinat) · green beans [wheel] (grüne Bohnen) · artichoke [wheel] (Artischocke) · cooked vegetables [wheel] (gekochtes Gemüse) · **vegetal** [chip·user] (vegetabil, gemüsig)
- *(family-level entry: **fresh** [chip·user] (frisch) — mapping [ours], low confidence: the wheel has no "fresh" aroma; placed under Fresh herbs as nearest honest home rather than parked, because it is a live user tag)*

### Marine
- algae [wheel] (Algen) · kelp [wheel] (Seetang) · iodine [wheel] (Jod) · **marine** [chip] (marin, meerig)

### Floral
- Fresh flowers: jasmine [wheel] (Jasmin) · osmanthus [wheel] (Osmanthus) · honeysuckle [wheel] (Geißblatt) · orange blossom [wheel] (Orangenblüte)
- Opulent flowers: rose [wheel] (Rose) · orchid [wheel] (Orchidee) · magnolia [wheel] (Magnolie)
- family-level: **floral** [chip·user] (blumig)

### Fruity
- Fresh fruits: **apricot** [wheel·user] (Aprikose) · peach [wheel] (Pfirsich) · **pear** [wheel·user] (Birne) · plum [wheel] (Pflaume) · apple [wheel] (Apfel) · grape [wheel] (Traube) · muscatel [wheel] (Muskateller) · cherry [wheel] (Kirsche) · **stonefruit** [chip] (Steinobst) *(mapping [ours]: sub-family-level synonym spanning apricot/peach/plum/cherry)*
- Berries: red berries [wheel] (rote Beeren) · blackcurrant [wheel] (schwarze Johannisbeere)
- Citrus: bergamot [wheel] (Bergamotte) · lemon [wheel] (Zitrone) · orange [wheel] (Orange) · zest [wheel] (Zeste, Schale) · **citrus** [chip] (Zitrus)
- Dried & candied: raisin [wheel] (Rosine) · **dried fig** [wheel] + **fig** [user] (Feige, getrocknete Feige) · **date** [wheel·user] (Dattel) · **dried fruit** [user·ours] (Trockenfrüchte, Trockenobst) *(sub-family-level synonym)* · chestnut [wheel] (Kastanie) · walnut [wheel] (Walnuss) · hazelnut [wheel] (Haselnuss) · almond [wheel] (Mandel) · **nutty** [chip] (nussig) *(mapping [ours]: the wheel homes nuts here — nutty rolls to Dried & candied)*
- Exotic: lychee [wheel] (Litschi) · coconut [wheel] (Kokos) · mango [wheel] (Mango) · pineapple [wheel] (Ananas)
- family-level: **fruity** [chip] (fruchtig)

### Woody
- Woodlands: oak [wheel] (Eiche) · pine [wheel] (Kiefer) · camphor [wheel] (Kampfer) · bark [wheel] (Rinde) · dry wood [wheel] (trockenes Holz) · **woody** [chip] (holzig)
- Undergrowth: moss [wheel] (Moos) · wet leaves [wheel] (nasses Laub) · mushrooms [wheel] (Pilze) · humus [wheel] (Humus)

### Earthy
- earth [wheel] (Erde) · peat [wheel] (Torf) · wet rock [wheel] (nasser Stein) · cellar [wheel] (Keller) · **earthy** [chip] (erdig)

### Empyreumatic
- smoked [wheel] (geräuchert, rauchig) · **smoky** [chip] (rauchig) · toasted [wheel] (getoastet) · **toasty** [user·ours] (röstig-warm) *(alias→family; near-miss recovered)* · toast [wheel] (Toast) · **roasting** [wheel] / **roast** [chip] / **roasted** [chip·user] (Röstung, röstig, geröstet) *(three word-forms, one node — this collapses R30's accepted roast/roasted coexistence to one bar)* · tobacco [wheel] (Tabak) · burnt [wheel] (verbrannt) · ash [wheel] (Asche)
- **malty** [chip] (malzig) *(mapping [ours], low confidence: malt is not in the wheel; homed here as kilned-grain kinship — flag for review)*

### Animal
- leather [wheel] (Leder) · musk [wheel] (Moschus)

### Mineral
- flint [wheel] (Feuerstein) · stone [wheel] (Stein) · chalk [wheel] (Kreide) · metal [wheel] (Metall) · **mineral** [chip] (mineralisch)

### Confectionery
- **cocoa** [wheel·user] (Kakao) · chocolate [wheel] (Schokolade) · **honey** [wheel·chip·user] (Honig) · vanilla [wheel] (Vanille) · caramelized sugar [wheel] (Karamell, karamellisiert) · marzipan [wheel] (Marzipan) · brioche [wheel] (Brioche) · sweet bread [wheel] (süßes Gebäck)

### Spiced
- cinnamon [wheel] (Zimt) · cardamom [wheel] (Kardamom) · ginger [wheel] (Ingwer) · clove [wheel] (Nelke) · anise [wheel] (Anis) · nutmeg [wheel] (Muskat) · licorice [wheel] (Lakritz) · **spice** [chip] / **spices** [user] (Gewürze, würzig) *(two word-forms, one family-level node)*

### Milky
- fresh butter [wheel] (frische Butter) · melted butter [wheel] (zerlassene Butter) · cream [wheel] (Sahne) · milk [wheel] (Milch) · **creamy** [chip] (cremig) · **buttery** [chip] (butterig) *(mapping [ours], high confidence — butter terms are the family's core)*

---

## 3 · Parked: non-aroma resident keys (do NOT force into the tree)

`umami` · `sweetness` · `sweet` · `astringent` · `crisp` — these are **taste/structure**, not aroma;
forcing them into an aroma taxonomy repeats the two-concepts-one-vocabulary mistake R30 fixed. They
remain flat vocabulary (membership unchanged, bars unchanged) pending the **two-layer decision on the
brewing-session agenda** (ledger §4, PHASE2 §F; the 43-headword lexicon is that layer's source).
`sweet`/`sweetness` remain two bars until that decision — accepted, recorded.

## 4 · Resolution map — Niklas's 15 tags after this tree

Visible today (7): honey · fresh · roasted · grassy · vegetal · sweet · floral.
Recovered by this tree (8): toasty → Empyreumatic · apricot, pear → Fruity/Fresh fruits ·
date, dried fruit, fig → Fruity/Dried & candied · cocoa → Confectionery · spices → Spiced.
**Result: 15/15 count**, each stored word displayed as written.

## 5 · German policy (ruled 2026-07-20)

Niklas writes English; Ruth and first users will write German. Therefore German is handled at the
**recognition layer**: every seeded term carries DE aliases (above), resolution is
exact → alias (EN and DE) → bare, and the stored word displays as the writer typed it — a German
user's "Aprikose" is first-class, counts to Fruity/Fresh fruits, and never gets rewritten to
"apricot". Rendered tiers (families, sub-families) carry DE labels (§1). Alias matching is
case-insensitive and diacritic-tolerant (ä/ae etc.); umlauts must round-trip in storage untouched.

## 6 · Open items for Code hand-off (after review)

1. R31 alias layer implements §2's aliases + obvious plurals/participles; drafted against real
   `tag_library` values ✓ (all 15 present above).
2. Fixture: families ⊂ vocabulary invariant extends to tree nodes; add a 15/15 resolution fixture
   from the real tag_library; umlaut round-trip check.
3. The WS4 capture families (20 curated chips) are **unchanged by this dataset** — presentation is
   Design-gated (provisional taste panel). This file changes *recognition and roll-up* only.
4. The three [ours] mappings — fresh · malty · nutty — **ratified by Niklas 2026-07-20**; provenance
   tags stay as the honest record of what isn't the source's.
5. Citation header — **DONE.** *Tea: History, Terroirs, Varieties* (Third Edition), Kevin Gascoyne,
   François Marchand, Jasmin Desharnais & Hugo Américi (Camellia Sinensis); confirmed from the physical
   cover 2026-07-21 and applied to all three files (p.221/223 refs are edition-specific). Palais des
   Thés / Delmas lead struck (it was wrong).
