# R3 Bundle 1 — Rev 4 reconciliation (new findings)
2026-07-17 · From Niklas + planning lane, to Design. Reviewed Rev 3 ("all six locked").

## Rev 3's six are confirmed closed — thank you
Kachi-iro 勝色 locked (with provenance) · temp per-steep with slider, out of Log · the
"don't harmonize time/grams into sliders" note landed · ensō brush locked as its own
animation slice · row-value toggle · vendor dropdown · and you self-flagged the
slider-thumb-reuses-clay double-clay on Focus for contract review (good catch, see C4
below). Those are settled.

**But a NEW review pass surfaced items Rev 3 couldn't have addressed** (they postdate it).
This is that pass. Grouped by severity. Bundle 2 should NOT start until A-group + the
in-session screen (D) are resolved — one of them (Insights nav) changes Bundle 2's scope.

---

## A · REGRESSIONS — functions removed, must be restored (not restyled away)

### A1. The "+" quick-log / quick-start button is gone
The current app has the "+" for quickly starting a session; no bundle screen has it. That's
a removed function, not a restyle. It needs a home. Restore a quick-start affordance.

### A2. Library lost search, type-filter, and favourites
The Library dropped: **search**, **tea-type filter** (green/oolong/etc.), and the
**favourites mark** (the leaf). Niklas's framing is the rule to follow: calm ≠ absent, it
means *not shouting by default*. The vendor dropdown is the model — one quiet control until
tapped. So:
- **Search: must return.** 23 teas and growing; search is necessity, not clutter. Behind a
  quiet icon, not an always-open field.
- **Favourites mark: must return.** It's identity, not clutter — a small leaf on favourite
  rows.
- **Type filter: return as capability**, behind a quiet dropdown like the vendor one (or
  fold vendor+type+stock into one filter control). Not four visible chips.
The capability must exist; the calm comes from the entry point being quiet, not from
removing the feature.

### A3. Insights displaced — where did it go?
The tab bar is now Home/Library/Steep/Passport — Passport took a tab and **Insights
vanished from the bar**. Nothing that exists today should silently lose its entry point.
Confirm where Insights lives now. If it's buried, that's a nav regression. **This also
gates Bundle 2** — its scope assumed Insights is a screen; confirm its home before Bundle 2
designs it.

---

## B · METAPHOR / SEQUENCING DRIFT — defensible turns that went the wrong way

### B1. "Journal" was rendered as "newspaper" — pull it back to diary
"No. 214 · MORNING EDITION · EARLIER IN THIS ISSUE" is a *newspaper* metaphor. But a tea
journal is a **personal diary/logbook** — intimate, quiet, yours — not a *published*
newspaper (editorial, public). The newspaper conceit is cleverer but colder, and it fits a
calm personal ritual less well. **Keep the typeset elegance; lose the newspaper framing:**
"Earlier today" not "Earlier in this issue"; drop or rethink the edition number / "MORNING
EDITION" masthead. Diary, not broadsheet.

### B2. "Sencha · 2nd steep" on Home reads ambiguously
On the Home masthead (outside the live steeping flow) "2nd steep" reads as a live state on
a screen where nothing's live — 2nd steep of what, when? Make the recent-activity line a
*summary* ("this morning · 2 steeps · 42g left"), not a live-state fragment.

### B3. Flavour notes are in Log SETUP — but flavour is retrospective
Same logic error temp had: flavour ("how did it taste") is a *retrospective*, so it can't
live in *pre-brew* setup — you haven't tasted it yet. Move flavour out of Log setup into
the steeping/finish flow (with the tasting notes). This is exactly parallel to the temp fix
you just made — apply the same reasoning.
(Note: the "how are you arriving" mood card being folded under "More" is good — keep it
folded. Separate future question, not R3: does that mood feature earn its keep at all.)

### B4. Script should match each tea's ORIGIN language — catalog-sourced, never guessed
The big display characters (玉露 etc.) are *Japanese* — but the library is Chinese, Taiwanese,
Japanese, and more, so foregrounding Japanese script as the app's identity is a mismatch
(a Chinese Da Hong Pao rendered in Japanese-styled kanji is subtly wrong).

**Niklas's decision (this is what he wants, not a fallback): show each tea's name in its OWN
language's correct script** — Chinese teas in Chinese characters (Traditional vs Simplified
per origin), Japanese in kanji/kana, etc. This *solves* the cultural-mismatch problem rather
than muting it: the script becomes "each tea as its own culture writes it," not
"Japanese-app decoration." Keep the display treatment; fix which characters appear.

**Hard correctness rule (this is the whole feature — wrong script is worse than none):**
script must be **sourced from data, never inferred/transliterated by guess.** Use the same
three-tier pattern as the liquor swatch, off the v3.87 reference catalog (its entries
already carry verified CJK `display_name`/`aka` and distinguish origin):
1. **Catalog-verified script = the truth** — a tea matching a catalog type shows that type's
   verified characters in the correct language/variant (e.g. Da Hong Pao → 大紅袍 traditional).
2. **User override** — user can set/correct a tea's script (single-writer, user wins).
3. **No verified script → romanized name only, NO characters.** Never generate CJK from a
   romanized name — that ships wrong characters. Same "never guess" rule as the swatch's
   Tier 3 (a Western blend, a self-named tea, an uncatalogued tea → no script, just the name).

**Design's lane:** the script's display treatment (size, placement, how it sits with the
romanized name). **Code's lane (later, its own small spec):** the catalog script data +
the match→script read path + the override. Design *as if* verified per-origin script
exists, because the catalog already holds most of it. This is the one item here with a real
(small) data dependency, like the swatch — flag it for the Code hand-off, don't treat it as
pure presentation.

---

## C · SMALLER MISMATCHES

- **C1.** Mock greeting still suggests "Dawang Feng this afternoon" — we shipped v3.90
  specifically to stop that. Use realistic current-state mock data so it doesn't model
  behaviour we just fixed.
- **C2.** Flavour chips (umami/marine/grassy/sweet) look sencha-specific — confirm they're
  dynamic per tea, or a roasted Da Hong Pao would wrongly offer "marine."
- **C3.** Confirm "Steep" tab label matches the app's current term.
- **C4.** Your own FLAG: the per-steep slider thumb reuses the clay tone → Focus shows clay
  twice (thumb + commit slab), against the "one clay per screen" contract. Resolve: the
  slider thumb should NOT be clay — use ink or the swatch tone, so clay stays the lone
  commit. Good that you surfaced it; ruling is "thumb ≠ clay."

---

## D · SCOPE GAP — the standard in-session screen is missing (biggest item)

Bundle 1 shows **Focus** (the immersive timer) but NOT the **regular in-session steeping
screen** — the normal countdown/stopwatch, tasting notes *in* the flow, per-steep temp, and
brew-guide display. That's where daily logging actually happens, and it's where the
outstanding seams all live:
- **tasting-notes placement** (the notes-vs-water-temp swapping issue is still open)
- **collapsible tasting-notes field** with better visualisation + more options on demand
- **the two-feedback-controls distinction** — the diagnostic we confirmed in v3.90: the
  ephemeral "How was that pour? · Just right" nudge writes nothing, so it's silent
  gate-data loss. The redesign of THIS screen is where "adjust the timer" and "log the
  taste" must become unconfusable — that fix was explicitly parked for here.
- **brew-guide representation**
Design the standard in-session screen, and resolve all four of the above *together* on it,
since they share the surface. This is the screen half the open issues need — it can't be
deferred to a later bundle.

---

## Sequencing
Rev 4 resolves A + B + C + D. **Hold Bundle 2** until A3 (Insights nav) is answered — it
changes Bundle 2's scope — and until D (in-session screen) is in, since it carries the
parked feedback-control fix. Then Bundle 1 (now including the in-session screen) comes back
for the final reconciliation, and swatch data-model + contracts + per-steep temp + the
per-origin script data-model get pinned at the Code hand-off.
