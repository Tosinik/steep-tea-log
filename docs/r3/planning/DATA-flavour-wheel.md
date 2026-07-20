# DATA — Flavour wheel (aroma taxonomy)

Transcribed 2026-07-20 for the planning lane's nested flavour vocabulary (R30/R31, ledger §1 + §4).
This is the **aroma** layer: what a tea smells/tastes *of*. The structure/texture layer is a separate
file — `DATA-tasting-lexicon.md`.

**Source.** Photographed pages of an English-language tea-tasting reference: p.221 ("Families of
aromas", titled **"Flavor wheel"**) and p.223 ("A Brief Lexicon of Tasting"). The book's title page was
not among the photographs, so the exact citation is **[unclear — confirm from the physical book]**. The
wheel (twelve families incl. *Empyreumatic · Confectionery · Milky*, and the companion lexicon) strongly
resembles the **Palais des Thés** aroma wheel (F.-X. Delmas / M. Minet et al.); treat that as an
unconfirmed lead until Niklas verifies against the book.

**Local-only images.** The source photographs live in `book_reference_material/`, which is **gitignored**
— the repo is public and the pages are copyrighted. Only this factual term taxonomy (structure preserved,
terms verbatim, the author's prose and definitions omitted) is committed. A vocabulary list is data, not
the author's expression.

**Verification.** Every family and term below was read at high magnification from the p.221 photo (each
of the twelve sectors zoomed individually). No term is marked `[unclear]` — all were legible. If a
future reader finds a discrepancy, the photo is authoritative over this transcription.

**Structure.** The wheel has three rings: **family → sub-family → terms**. Only four families (Vegetal,
Floral, Fruity, Woody) carry named sub-families; the other eight go family → terms directly. That
asymmetry is the source's, preserved here — do not invent sub-families for the eight.

---

## 1 · Vegetal
- **Dry herbs** — cut hay, straw, wicker
- **Fresh herbs** — cut grass, green wood, stem, fern and watercress
- **Aromatic herbs** — mint, coriander, dill, basil, rosemary, chervil, tarragon, thyme, marjoram
- **Vegetables** — artichoke, celery, zucchini, cucumber, spinach, fennel, green beans, raw vegetables, cooked vegetables, vegetable cooking water

## 2 · Marine
*(no named sub-families)*
- algae, kelp, fish, fish meat, oysters, crustaceans, scallops, seafood, iodine

## 3 · Floral
- **Fresh flowers** — jasmine, hyacinth, osmanthus, chrysanthemum, honeysuckle, lily, lilac, geranium, orange blossom, wildflowers, lily of the valley
- **Opulent flowers** — rose, orchid, magnolia, peony, violet

## 4 · Fruity
- **Fresh fruits** — apricot, cherry, peach, apple, pear, plum, muscatel, grape, fresh fig
- **Berries** — wild berries, red berries, strawberry, raspberry, black fruits, blackberries, blackcurrant
- **Citrus** — bergamot, lemon, orange, tangerine, grapefruit, zest
- **Dried and candied fruits** — walnut, hazelnut, fresh almond, chestnut, raisin, dried fig, date, jam, preserves, tomato confit, cherry kernel
- **Exotic fruits** — pineapple, lychee, coconut, mango, papaya, dragon fruit

## 5 · Woody
- **Woodlands** — dry wood, exotic wood, dead leaves, bark, wood chips, oak, pine, fir, eucalyptus, camphor, maple water
- **Undergrowth** — moss, wet earth, wet leaves, mushrooms, humus, truffles

## 6 · Earthy
*(no named sub-families)*
- earth, mildew, peat, moisture, cellar, potatoes, beet, dust, wet rock

## 7 · Empyreumatic
*(no named sub-families)*
- smoked, toasted, burnt, toast, toasted almond, ash, firewood, tobacco, roasting, bacon, tar

## 8 · Animal
*(no named sub-families)*
- leather, tanned leather, fur, wet wool, horses, stables, manure, sweat, musk

## 9 · Mineral
*(no named sub-families)*
- metal, stone, chalk, powder, sulfur, flint, rocky

## 10 · Confectionery
*(no named sub-families)*
- cocoa, chocolate, cocoa butter, sweet bread, honey, marzipan, vanilla, brioche, caramelized sugar, sweet eggs

## 11 · Spiced
*(no named sub-families)*
- cinnamon, cardamom, nutmeg, ginger, anise, clove, licorice, garam masala

## 12 · Milky
*(no named sub-families)*
- fresh butter, melted butter, cream, milk, almond milk

---

## Notes for the planning lane (not from the source)
- This is the twelve-family tree R30's ledger note anticipates ("expect the assertion to change again
  when the nested tree lands — twelve families, not four"). It is the candidate structure for R31's
  alias/normalisation layer and any future nested `KB_FLAVOR_CHIPS`.
- Reconciliation with today's flat vocabulary is **not** done here — that is R31's job, drafted against
  the real `tag_library`. Niklas's eight still-invisible tags (toasty · date · apricot · pear · cocoa ·
  spices · dried fruit · fig) map into this tree (e.g. cocoa → Confectionery, apricot/pear → Fruity·Fresh
  fruits, date → Fruity·Dried and candied fruits), which is the point of building it.
