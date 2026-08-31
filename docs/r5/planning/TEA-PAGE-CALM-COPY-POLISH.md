# TEA-PAGE-CALM-COPY-POLISH: wave-1 slice #2.5

> Written by the Code lane against HEAD `3483caa` (v4.37), read-only clone. Docs push on write. This is
> the design authority the build reads from for wave-1 slice #2.5. It was settled with Niklas on device
> after the v4.37 sessions-list ship. No R-numbers here. They mint when the slices build.
>
> This spec is written in the plain house style that D3 introduces. It is the first artifact of that
> style. No em-dashes. Short declarative sentences. No "X, evidence for Y, never Z" shapes. If a later
> reader wonders why this spec reads plainer than its neighbours, that is the point.

## The frame

The tea page got its spine in B1 (v4.34) and its content in B2 (v4.35). It reads correct. It does not yet
read as a journal. There are three problems, and one decision each.

1. The sections blend. The RULE sections run together as one flow, so the page reads as a wall of text.
2. The explainer copy clutters. Always-on "why this is here" captions sit on a surface built for calm.
3. The microcopy has an AI tell. The em-dash and the "X, Y, never Z" construction give it away.

D1 fixes the first on the tea page. D2 and D3 fix the second and third, starting on the tea page and
rolling out from there.

## D1. Tea-page section rhythm (tea-page-scoped)

**The problem.** The tea page has six sections, built by `tdSec(title, body, id)` at `steep-teas.js:1255`:
Character, On hand, Brewing, Freshness, Where this came from, Your diary. Each is a `.td-sec` with a
`.td-sechead.rule-head` header holding a `.eyebrow` title. The rule-head is a quiet 2px ink line, and the
sections sit close together. The eye finds no landmarks, so the page reads as one block.

**Not the fix: re-boxing.** De-boxing was deliberate (R177, B1). Boxes fight the calm. Do not put the
sections back into cards to separate them.

**The fix: strengthen the rhythm.** Two levers, both about presence and space, not containers.

- More weight and air on the section header. Give the `.eyebrow` / `.td-sechead` more presence through
  size, weight, or the space above it, so each header reads as the title of an entry.
- More breathing space between sections. Widen the gap between `.td-sec` blocks so space does the
  separating, and the eye rests between entries.

**The test.** A reader scanning the page sees five or six clear entries. Each is headed. Each has room
around it. The page is a set of journal entries, not a wall under faint lines.

**Scope.** The tea page only. This is D1. Prove it here first. Other surfaces can adopt the rhythm later,
as their own slices, if it reads well.

**Fence note.** This is header weight and inter-section spacing. It is not a container change. `.td-sec`
and `.td-sechead` stay RULE. They carry no fill and no radius. Do not add a fill or a radius to make a
section stand out. That would breach F31 and defeat the calm. If the change touches only the header
typography and the gaps, `frame-test` stays green. Confirm it does.

## D2. App-wide info-popover explainer component (build here, roll out later)

**The problem.** Always-on explainer captions clutter the calm surface. Two live examples on the tea page:

- The photo-provenance line. `steep-teas.js:1045`, class `.tea-label-note`. It reads today: "The photo is
  the label, evidence for where it came from, never the tea's identity."
- The brew-guide note. `steep-teas.js:1304` and `:1311`. It reads today: "The session timer uses this
  schedule," with a lead-in about where the times come from.

Both teach something true. Both sit on screen at all times, on a surface whose whole point is calm.

**The fix.** A small tappable info mark reveals the explainer in a small popover on tap. The default
surface stays calm. The teaching is there for anyone who wants it.

**Build it once, reusable.** This is Niklas's call: popovers are under-used in this app, so lean into them.
One component. One writer. Every surface calls it. Do not scatter per-surface copies.

**The shape** (behaviour, not final markup; the build rules the markup):

- A small info affordance sits where the caption used to. It is quiet by default. Use an SVG icon from the
  sprite (add an "info" glyph if the sprite lacks one), per DESIGN.md's rule that iconography is the SVG
  sprite. Do not ship a literal circled-i character. The only inline glyphs the app allows are the five in
  DESIGN.md.
- Tap reveals a small popover holding the explainer. Tap again, tap elsewhere, or a close control dismisses
  it.
- Calm-first. No browser alert or confirm. Inline UI only. The popover is DOM, it is dismissable, and any
  re-render clears it. This is the `armConfirm` and `showToast` precedent, so the component belongs beside
  them in `steep-core.js`, not in a feature module.
- Escape the text at the boundary with `escapeHtml`. The strings are house copy, but the component takes
  text, so escape where text enters it.
- Accessibility. The mark is a real button with an `aria-label`. The popover is reachable and dismissable
  by keyboard.
- Position. The popover must stay on screen. It must not sit under the mobile keyboard or run off the edge.
  This is the same viewport care wave-1 #2 is adding. Scroll it into view, or anchor it so it stays
  visible. Do not repeat the keyboard-occlusion bug that #2 exists to fix.

**Why it is built here.** The tea page is the proving surface. Prove the component here, then it becomes the
app-wide pattern. Every explainer caption in the app can move behind it over time. The session-flow track
(#3) uses it for its own explainers, so building it in #2.5 feeds #3. That is why #2.5 sits before #3.

## D3. Copy de-AI-ification (house-style change, starts here)

**The problem.** The app's microcopy leans on the em-dash and on the flowing "X, Y, never Z" construction.
This is a genuine AI writing tell. Live examples on the tea page:

- The photo note (`:1045`): "The photo is the label, evidence for where it came from, never the tea's
  identity." This is the tell in its purest form.
- The freshness and spend field captions (`:754`, `:763`, `:769`): fragments that open with an em-dash and
  run on.
- The suggested-brew note (`:1349`): "A starting point from the leaf type, not a saved guide. The session
  timer uses these times until you save your own."

**The fix.** Rewrite the strings plain and human. Short declarative lines. Em-dashes gone. No "the label,
for X, never Y" shapes.

**Before and after.** The strings that move behind the info mark in D2 get rewritten as they move.

- Photo note. Before: "The photo is the label, evidence for where it came from, never the tea's identity."
  After: "This photo is the tea's label, not the tea itself. It shows where the tea came from."
- Brew-guide note. Before: "Steep times come from the leaf type, your guide sets the rest. The session
  timer uses this schedule." After: "These steep times come from the leaf type. The session timer uses
  them."

**What de-AI'd means, as a rule:**

- One idea per sentence. Short and declarative.
- No em-dash as a connector. Use a period, a colon, or a comma with a conjunction.
- No "X, evidence for Y, never Z" or "the label, for X, not Y" triple shapes.
- Plain words. Say the thing.

**Scope.** It starts on the tea page. The explainer strings moving behind the info mark get rewritten human
as they move. It rolls app-wide as a later pass. This is a house-style rule going forward. It binds app
strings. It binds specs and prompts too. New docs are written plain, with em-dashes out. This spec is the
first example, and DESIGN.md's voice section should fold in the rule on the app-wide pass.

**Not in scope.** Purging every em-dash from every doc and string in one pass. That is the app-wide
rollout, ruled at build. This slice rewrites the tea-page strings and sets the rule.

## Scope, in one place

- D1 is tea-page only.
- D2 and D3 are app-wide passes. They start on the tea page as the proving surface.

## Slicing (indicative, ruled at build)

- Slice one is the tea page. The section rhythm (D1). The info-popover component, built and proven (D2).
  The tea-page copy, rewritten (D3).
- Slice two is the app-wide rollout. The info-popover pattern and the plain-copy pass reach the other
  surfaces. The session-flow track (#3) picks up the component.

## Invariants this slice must not break

- Calm-first. No alert or confirm. The info mark teaches on demand. It is not a nag.
- The tea-page fence. D1 changes header weight and spacing only. No fills and no radii on `.td-sec` or
  `.td-sechead`. `frame-test` stays green.
- Escaping. All text passes through `escapeHtml` at the component boundary.
- Tea-First. The explainers stay available, never required. Hiding them behind a tap adds calm, not
  friction.
- No keyboard occlusion. The popover positions on screen. This is the #2 lesson, applied here.

## Related

- `SESSION-FLOW-REDESIGN.md`. The session-flow track (#3) uses the info-popover for its own explainers.
- `AUDIT-REPORT-v4.36.md`. The wave-1 backlog this #2.5 inserts into, between #2 and #3.
- `DESIGN.md`. The house voice. D3 changes it. Fold the rule in on the app-wide pass.
