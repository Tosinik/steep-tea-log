# SlowCup — codebase & docs audit (v4.36)

> **Read of v4.36 (`72db72b`), read-only.** Fixes ruled by planning: **wave 0** = the docs-only
> commit that filed this report (deploy-gate repoint + command-rebuild banners + misinformer
> reconciles); **wave 1** = sessions list → vendor/keyboard → session-flow re-dress; **hygiene
> riders** thereafter; **security + erasure + legal** remain the pre-widening gate.
>
> **This file is the living seed** — it replaces the never-created `docs/AUDIT-TARGETS.md`. **Append
> future finds here** rather than starting a new doc. The R5-AUDIT (drawn-vs-shipped, v4.20) is the
> prior/design-side reference; this is the code+docs side and the forward one.

**Scope:** cold clone verified `== origin/main == local`, all at `72db72b` (v4.36), clean, nothing
unpushed. 18 JS files, all parse clean (`node --check`). Findings are code-verified, not absorbed from
docs — where a doc and the code disagreed the code was traced.

**Correction to the audit brief:** the seed file it named, `docs/AUDIT-TARGETS.md`, **does not exist**.
The real prior reference is `docs/r5/planning/R5-AUDIT.md` (v4.20-era). This file supersedes both as the
forward seed.

---

## The headline read

The **interaction layer is clean** (no dead handlers, no wired-to-nothing controls, no ordering-bug
siblings, no accidental short-circuits — all refuted with evidence). The real problems are two, and they
don't overlap:

1. **A design rollout that stalled on the two highest-traffic surfaces** — the sessions *list* and the
   whole session *flow* still look like the pre-overhaul app, plus one genuine on-phone bug (the mobile
   keyboard occludes the vendor field).
2. **A cluster of "before-build" planning docs never swept after their features shipped** — and they
   don't just misinform, they *command a rebuild of finished work*, including one that had broken the
   deploy gate.

The code *cruft* is real but low-stakes. Fix the docs and the gate first (cheap, high-leverage), then the
ritual surfaces.

---

## ⚠ Gate-level items (block widening the beta; not the audit's to fix, must be tracked)

| Gate | State | Cost to fix | Verdict |
|---|---|---|---|
| **F1** — `profiles` readable by all authed users, no allowlist (HIGH) | CONFIRMED live 2026-08-26; **deliberately deferred** by Niklas 2026-08-28 (sole user) | Supabase RLS only, no frontend | Open **by decision, not drift.** Re-blocks before the next person logs in. |
| **F2** — `tea-photos` bucket public + unscoped read (HIGH) | CONFIRMED; same deferral | Bucket flag + policy | Same trigger (pre-widening). |
| **F3** — shared sessions/steeps expose full row (`mood`/notes/`feedback`) to followers (MEDIUM) | CONFIRMED | A projecting view/RPC | Scope-creep within an opt-in share. |
| **F4** — auth redirect allowlist (LOW) | Unverifiable via MCP; STATE:42 credibly claims done | 30-sec dashboard read | Confirm and close. |
| Advisor WARN — leaked-password protection off | CONFIRMED | One toggle | Low practical (magic-link/OAuth primary). |
| **GDPR erasure** — **no account/data-delete function exists anywhere** (grepped: zero) | Real gap | New build (edge fn / RPC / data-wipe) | Legally required for a public EU beta. See `docs/r3/planning/TASK-delete-everything.md`. |
| **Datenschutzerklärung + Impressum** — absent from repo | Real gap | Drafting | Legal; F1/F2 must be fixed first so the privacy policy is truthful. Impressum needs a ladungsfähige Anschrift. |

**Challenge on the "privacy copy is untrue" framing:** the ROADMAP said Settings' privacy copy is untrue
until delete ships. It isn't — the shipped copy only says *"export a JSON backup anytime"* (honest). The
false-promise copy was **never wired**. So this is a *missing legally-required feature*, not a live false
promise — real, but not currently exposing anyone. (Export nests steeps inside sessions = complete for
data; photos are URL-only, which the task doc already flags.)

---

## Arm A — code health

### A1 · Stale docs that *command a rebuild* (the dangerous cluster — HIGH)

A fresh session reads these before the code. Each read in present tense as work-to-do, with **no
SHIPPED/CLOSED banner**, for work that shipped v4.27–v4.36. *(Wave 0 bannered/repointed all of these.)*

| Doc:line | Said | Reality |
|---|---|---|
| **`.claude/agents/verifier.md:22`** | version lockstep checks `APP_VERSION (steep-core.js)` | **moved to steep-version.js:8 (v4.25).** steep-core.js:1 is only a comment → the gate's version check read nothing. **Verified.** |
| **`.claude/skills/slowcup-deploy/SKILL.md:28-29`** | bump `steep-core.js: APP_VERSION`; WHATS_NEW unnamed | same move; both live in steep-version.js. **Verified.** |
| `docs/r5/planning/INSIGHT-ENGINE-SPEC.md:6,54` | "Not yet built — ships with Home" | `computeLeadInsight` shipped v4.27 (dashboard.js:864) |
| `docs/r5/planning/REFLECTION-SPEC.md:5,13,91` | "Not yet built … This is that slice." | Slices A/B/C shipped v4.30–v4.36 |
| `docs/r5/planning/HOME-VISION.md:126,132` | "Home stays HELD (R159)" | shipped v4.27 |
| `docs/r5/planning/R5-AUDIT.md:101,102,129,180` | Home "HELD", Insights "NEXT draw" | both shipped v4.27/v4.28 |
| `docs/r3/README.md:91-92`, `R3-IMPLEMENTATION-HANDOFF.md:5,§2,392` | R3 build package + currency row "pending" | R3 closed v4.09; currency row shipped v4.04 |
| `docs/r3/design/R3-SURFACE-INVENTORY.md`, `R3-CONNECTION-MAP.md:142` | Sessions/Tea-detail/First-run "UNDESIGNED — build it" | all shipped |

**Lower-severity doc drift (misinforms, not commands)** — reconciled in wave 0 where live: `DESIGN.md:129`
"passport (parked)", `DESIGN.md:11` old github.io URL, `ROADMAP-v3-next.md` passport-parked + unchecked
"register slowcup.app" + issue-#1-open, `SPEC-brew-advice-v4.md` "Stage 1 buildable now" (shipped),
`PHASE2-PRESPEC-NOTES.md` internally inconsistent (3-value tap / `SESSION_METHODS=[gongfu,western]`). Plus a
scatter of line-drift / `freshnessClass`-dead-symbol refs inside banner-covered docs (cosmetic).

**Verified CLEAN (no action):** CLAUDE.md (deploy ritual + passport paragraph both correct), ROADMAP-v4,
STATE body, smoke.md, the vm-fixture/issue-triage/six-lens skills, the banner-carrying R3-STATUS/SPEC docs.

### A2 · Dead / dormant / orphaned code

**Free deletes** (zero call-sites anywhere, app or fixtures — verified): `dotsRow` (core:889, superseded by
the pills refactor), `fmtStars` (core:805), `toggleTheme` (core:12), `flavorFamilyOf` (knowledge:357),
`achievementsHTML`+`toggleAchievementsCollapsed` (dashboard:316/334), and passport dot-map leftovers
`PASSPORT_ZOOMABLE` (:89), `passportGeo` (:157), `passportSubGeo` (:158).

**Guarded orphans** (dead, but a fixture/ledger holds them): `PASSPORT_LAND` (:12), `PASSPORT_SUB` (:64),
`passportSubFor` (:105) — `origins-test.js` E3 asserts they merely *appear* in source (a delete-guard, not
a use-proof).

> **Challenge — verified.** CLAUDE.md:276 lists `passportSubFor` + `PASSPORT_SUB` as part of *"the reusable
> core… the aggregation layer `viewOrigins` builds on."* Grepped: **they have no live consumers** — only
> `passportCountryFor`+`PASSPORT_GEO` are actually used by Origins. The doc over-states which passport tables
> are load-bearing. Fix the CLAUDE.md line when this is resolved (a hygiene rider).

**Dormant subsystem — achievements.** `ACHIEVEMENTS_ENABLED=false` since v3.72, and **R134 ruled it
"DELETED, not dormant" — unexecuted.**

> **Challenge — verified.** `syncAchievements` has **7 live callers** (every boot + every session commit +
> every tea save + settings), and its body computes the full 15-badge table **ungated** — only the
> *celebration* is behind the flag. A disabled feature still recomputes on every write. Compute waste today;
> R134 says remove it.

**Documented-dormant, leave as-is:** `adviceSuggestionText` (core:695, `hasNudge` always false post-R175,
Slice-2 repurpose), `senchado:2.8` seed (core:415, decorative for current data, honestly commented),
`KB_FLAVOR_AXES` (already backlogged), reinstatement hooks `setTeaFilter` (teas.js:606) / `focusLogSteep`
(sessions.js:1388 — R60-held; ledger cited stale `:309`/`:966`, corrected wave 0). **Unused:**
`FLAVOR_FAMILY_DE`/`_SUBFAMILY_DE` (knowledge:192/195 — only a fixture reads them; app never localizes).

**Good news:** no commented-out blocks, no TODO-stub bodies. The codebase actively removes dead branches.
Hygiene is strong.

---

## Arm B — UI/UX completeness

### B1 · Spine + warmth rollout (code-verified matrix)

| Done (spine + warmth) | Still OLD frame (the gaps) |
|---|---|
| Home, Insights (**incl. stat cards** — de-boxed to ledger rows), Library shelf, Tea detail, Session **detail**, Shopping, Ritual/Palate/Timeline, pickers; Vessels & Origins *mostly* | **Sessions LIST**, **session FLOW** (setup/steeping/finish/quick), **Social/friends**, **Settings**, **Spend**, **Session-edit**, add/edit **modals** |

- **Sessions list (`viewSessions`, sessions.js:62) — the starkest inconsistency.** `.sess-row` at radius
  12px ("label-picture" cards) + `.card` calendar, **no spine and no warmth** — while its own **detail**
  page is full spine + a liquor `sd-swatch`. Same data, two eras.
- **The session flow — the core daily ritual — is entirely unspined**, with the original inline
  `var(--jade-pale)` markers still in the brew-guide card (sessions.js:994) and hidden-schedule ghost
  (:1173). Most-used surface in the app.
- **Origins residual:** the atlas is still `<div class="card org-card">` inside an otherwise-spine surface
  (the frame fence doesn't catch it — not a registered selector).
- **Refuted:** the "Insights stat cards still look old" worry — they're fully spine now (culled + de-boxed
  at R161).

> **Challenge:** `frame-test.js` green ≠ rollout complete. Its `SURFACES` registry only fences the 8
> re-dressed surfaces by design; the gaps above are simply *outside* it. And the sheet is **growing**: **140
> border-radius declarations** now vs the 119 R5-AUDIT cited at v4.20 — the spine adds component radii faster
> than it retires the uniform `.card{border-radius:14px}`, which is **still defined (styles.css:412) and in
> use**.

### B2 · Bug shapes

- **Classes 1–4 (dead affordances / short-circuits / wired-to-nothing / ordering) — CLEAN.** All 292 inline
  handlers resolve; the v4.33 `brewNudgeRowHTML` ordering fix has **no unfixed siblings** (timer + profile
  check their edit-state in the right order); `return ''` guards are intentional calm-first "absent when no
  data." A genuine clean bill on the interaction layer.
- **Class 5 (keyboard/viewport) — the one real bug, and it's systemic.** The app has **zero**
  `visualViewport`/`resize`/focus-scroll handling anywhere.
  - **Vendor picker (steep-teas.js:751)** — the flagged target, confirmed: a native `<input list=vendorList>`
    in the Specifics fold near the *bottom* of a `position:fixed` tea-form overlay; iOS won't reliably scroll
    it above the keyboard, and the datalist popup fights the keyboard for the same strip. Effectively dead on
    a phone.
  - **Siblings:** every field below vendor in that form (price/grams/description); the vessel-form and
    settings modals (same fixed-overlay pattern); autofocus-without-scroll on `#tagInputField` during
    **steeping** (worst-placed — below the timer + chips), plus `#wishName`/`#userSearch`/`#timerTargetEdit`.
  - **The fix pattern already exists in-app:** the tea/vessel *pickers* are full-screen, search-at-top,
    not-autofocused, partial-DOM-update — no occlusion. Move vendor entry to that pattern, or add a
    focus→`scrollIntoView` for modal fields.

---

## Ranked backlog — priority read (impact × effort)

**Do first — cheap, high-leverage, protects every future deploy/session (all quick wins):** *(= wave 0, done)*
1. **Repoint the deploy gate.** `verifier.md:22` + `slowcup-deploy/SKILL.md:28-29` → `steep-version.js`.
   *~10 min.* The version-lockstep guard couldn't do its job. Highest leverage in the whole audit.
2. **Banner the "COMMANDS-rebuild" docs** (A1 table). *~30 min.* Stops a fresh session rebuilding shipped work.
3. **F4 dashboard confirm** (30 sec) + reconcile `DESIGN.md:129/:11` passport/URL. *~15 min.*

**Do as the next real UX wave — this is what "looks like the old app" means to a user:** *(= wave 1)*
4. **Sessions list → spine + warmth.** *Medium.* Precedent is its own detail page + the shelf rows; highest
   visible inconsistency.
5. **Vendor field + keyboard handling.** *Medium.* Real on-phone breakage; fix pattern already exists (vendor
   via the picker pattern; add a general modal focus-scroll for the siblings).
6. **Session flow → spine + warmth.** *Deep (4 stages, bespoke timer).* Highest-traffic surface; the ritual
   should feel designed. Likely its own multi-slice track, not a one-shot.

**Do when convenient — lower-traffic surfaces:**
7. Social/friends, Settings, Spend, Session-edit, add/edit modals → spine. Origins atlas `.card org-card`
   residual. *Small-medium each.*

**Code hygiene — low risk, do when touching the area:** *(= hygiene riders)*
8. Delete the 8 free-delete orphans (A2). *Trivial.*
9. Resolve achievements per **R134** (delete vs keep) — if kept, gate `syncAchievements` so a disabled
   feature stops recomputing on every write. Fix CLAUDE.md:276's passport over-claim + the guarded passport
   orphans (need `origins-test.js` E3 + R66 reconciliation). *Small, needs a ruling.*
10. `FLAVOR_FAMILY_DE/_SUBFAMILY_DE`; remaining low doc-drift. *Trivial.*

**How this informs the feature order:** the *design* debt (sessions list + flow) outweighs the *code* debt —
the cruft is minor and the interaction layer is sound, but the most-used surfaces still wear the old frame.
So before net-new features (Go Deeper redesign, tasting mode, matcha), slot the sessions-list + session-flow
re-dress and the keyboard fix — they're what makes it read as "one app." The doc/gate fixes are near-free
and precede everything. Security F1/F2 + erasure/legal remain the separate hard gate before the beta widens.

---

## Appendix — future finds (append below)

*(Nothing yet. New audit findings land here with a date, so this stays the single forward seed.)*
