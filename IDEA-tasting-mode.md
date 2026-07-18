# IDEA — Guided tasting mode

**Status: PARKED.** Not scheduled, not specced, not in R3. Recorded here so it survives the
chat it was born in. Companion to `IDEA-label-scanner.md`.
Raised 2026-07-18 by Niklas.

---

## The idea

The app walks you through a proper tasting of a tea, step by step — the things worth
attending to, in an order that makes sense. Not a checklist to complete; a guide that helps
you notice more than you would alone.

Especially useful for **a new tea or a sample**, where you're trying to form a first honest
impression and don't yet know what to look for.

## Rough step sequence (to be refined)

Order matters — it follows the tea, not the form.

1. **Dry leaf** — appearance (shape, colour, uniformity, breakage) and **dry aroma**
2. **Warmed/rinsed leaf** — the wet-leaf aroma, which is often the biggest surprise
3. **Liquor** — colour and clarity *(see the swatch note below — this is the moment)*
4. **Aroma of the liquor** — before tasting
5. **Taste** — flavour notes
6. **Mouthfeel / texture** — body, astringency, thickness
7. **Where it sits** — front, mid, back of the mouth; where the flavour lands
8. **Finish** — length, aftertaste, huigan
9. **Across steeps** — how it develops (ties to the existing per-steep capture)

## Why it fits — and the tension it must resolve

**The tension:** this runs at the **Tea-First Principle** — *"SlowCup is for drinking tea,
not serving the app."* A guided walkthrough is inherently phone-attentive; you'd be looking
at a screen through the whole tasting.

**The resolution (and the feature's justification):** Tea-First forbids *required* attention
during **ordinary** logging. A tasting is a different activity — you opt into it *because*
the close attention is the point. It's the difference between a quiet morning cup and a
formal cupping.

So the rule is:
- **Ordinary sessions stay minimal-app.** Unchanged. Nothing about tasting mode leaks into
  the normal flow.
- **Tasting mode is deliberately attentive**, entered on purpose, **never the default**, and
  abandonable at any point without penalty or nagging.

Stated this way, the principle is protected rather than eroded — but it must be stated, or
the feature will quietly drift into the default path.

## Why it's valuable beyond the experience

- **Liquor-colour capture at the perfect moment.** Step 3 asks for the liquor colour
  *while you are looking at the liquor*. That is the ideal moment for Tier-1 swatch capture
  (user-set = the truth) — far more accurate than picking a colour later from memory. The
  swatch picker folds into a step you'd be doing anyway.
- **Vocabulary growth.** Structured prompts (dry aroma → wet aroma → taste → mouthfeel →
  finish) would grow `tagLibrary` faster and more precisely than free-typing at session end.
- **Fields nothing else captures** — dry-leaf aroma, wet-leaf aroma, mouthfeel, where the
  taste sits, finish length. None of these exist in the current data model.
- **Feeds the tea database.** Aggregated tasting data is exactly the "kindred notes feed the
  catalog" loop identified in the Social concept — structured impressions across a circle
  are far more useful than scattered free text.

## Likely shape (not decided)

Probably **a session variant** — like cold brew and steepless matcha — rather than a parallel
mode. It produces a normal session record with a richer capture flow, so it stays inside the
existing data model instead of bolting a second one alongside.

## Open questions

- **New fields or existing?** Dry aroma / wet aroma / mouthfeel / position / finish have no
  home in `sessions` or `steeps` today. New columns, a JSON blob, or folded into tags?
- **Does it interleave with the steep timer**, or is it a separate pass before/around normal
  logging?
- **How much guidance?** Prompts only, or explanatory text about *what* to look for (which
  is the actual value for a beginner, and the thing that risks feeling like a lesson).
- **Does it require gongfu**, or work for any method?
- **Interaction with per-steep capture** — step 9 overlaps the existing per-steep taste/tap.
- **Where is it entered from?** Session setup? Tea detail ("taste this properly")?

## Related

- Tea-First Principle — `PHASE2-PRESPEC-NOTES.md`
- Liquor swatch three-tier model — R3 lock (user-set / catalog / none)
- `tagLibrary` growth — the flavour vocabulary that accrues with use
- Social "kindred notes" → tea-database enrichment loop
- `IDEA-label-scanner.md` — the other parked idea
