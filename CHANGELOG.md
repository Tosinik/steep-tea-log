# SlowCup — changelog

(Formerly "Steep" — user-facing brand renamed in v3.59; internal file/function names, the
`steep-tea-log` repo/cache prefix, and historical entries below keep the old name.)

Newest first. "Deploy" = files to push to GitHub Pages. SQL = run once in the Supabase SQL editor.

## Module map (current — refreshed at the v3.83 docs pass)
Plain scripts sharing one global scope (not ES modules), loaded in this order by
`index.html` (the `<script>` list there is authoritative). The v3 split was originally a
mechanical cut of `app.js`; it has drifted far since — the old "concatenating reproduces
`app.js` byte-for-byte" note is historical only.

1. `supabase-config.js` — Supabase keys.
2. `steep-data.js` — Supabase client, `loadKey`/`saveKey`, mappers, per-row CRUD, offline
   write queue (`window.SteepDB`).
3. `steep-knowledge.js` — curated tea KB (`kbResolve`, `KB_STYLES`, flavour vocab/families).
4. `steep-core.js` — constants, `state`, settings/persist helpers, small utils, image
   upload, the pixel logo, `render()`, WS6 shell (bottom bar + avatar hub), `goView`,
   `bindDynamic`, brew-guide parser + leaf-form logic, achievements engine (dormant).
5. `steep-settings.js` — backup/export/import, settings modal, `setSetting`, diagnostics.
6. `steep-dashboard.js` — `computeStats`/`gridStats`, greeting engine, Home cards +
   shared editable-card registry (`DASH_*`), heatmap ("Brewing days" card), forecasts,
   onboarding, spend view, `viewDashboard`.
7. `steep-insights.js` — the Insights reflective room (hero/readings) + Wrapped.
8. `steep-teas.js` — WS5 photo shelf (statusLine/stockTier engine, chips, search,
   density), vendor manager, tea form, tea detail, WS4 honesty ladder.
9. `steep-shopping.js` — shopping list + suggestions.
10. `steep-passport.js` — origin→country matching + passport view (rendering PARKED).
11. `steep-social.js` — friends/feed/profile/follow.
12. `steep-sessions.js` — sessions calendar, vessels, session-edit modal, session flow
    (setup/steeping/finish/quick), timer + WS4 capture, tags, `commitSession`.
13. `steep-boot.js` — `SteepDB.boot(init)` + service-worker registration (loads last).

---
## docs — Origins coordinate table + ledger R28/R29

`docs/r3/planning/DATA-region-coordinates.md` — the Origins map's coordinate source (8 region rows, city/province-capital level, verified against independent sources; keyed on normalized `teas.origin`, never the catalog). Two rulings appended to `R3-RULINGS-LEDGER.md` §1: **R28** (country-tier `?N` pins are polygon labels, not point coordinates) and **R29** (no root split — the app stays at `slowcup.app/`, the landing is #09's logged-out screen; closes Pillar B's open decision, whose §4 note is updated accordingly). No app change.

---
## docs — R3 rulings ledger lands in the repo

`docs/r3/planning/R3-RULINGS-LEDGER.md` — the planning lane's **binding reference** for the #09b conformance sweep and the Code hand-off: 27 numbered rulings, corrections-owed per board, and a shipped-truth section, verified against the repo at `77cf800` and the 2026-07-19 exports. Boards get verified against this ledger and the code, never against completion summaries. (README `planning/` index updated to point at it.) No app change.

---
## v3.91 — senchadō capture + fixture repair
Deploy: `steep-core.js` (VESSEL_TYPES + brewMethodFor + LEAF_RATIO_DEFAULT + baselineRatioFor + APP_VERSION + WHATS_NEW), `steep-sessions.js` (SESSION_METHODS + per-steep gate + vessel-type prefill + edit-modal method control), `fixtures/brew-feedback-test.js` (R section), new `docs/tasks/TASK-senchado-capture.md`, `.claude/skills/slowcup-deploy/SKILL.md` (step-6 line), `service-worker.js` (**v101**), `CHANGELOG.md`, `STATE.md`, `ROADMAP-v4.md`. **No SQL.**
- **Part A — the brew-feedback R section was stale-red and would have failed the deploy's own fixture gate.** Four real sessions now carry per-steep taps (two with no session-level feedback), expiring the old "every real session → reduce null" + `has===!!feedback` identity. Rewritten to three LIVE guards: the reducer in both directions (null untapped / non-null tapped), the steep-only linchpin on real data, and the gate count REPORTED not pinned with a method split on stored `brew_style`. Engine (`reduceSteepFeedback`/`sessionHasFeedback`/`computeBrewAdvice`) untouched. brew-feedback 54→59.
- **Part B — senchadō is a real third brewing method** (the app knew only gongfu|western; Niklas brews gongfu + Japanese, never western, so his kyusu/shiboridashi sessions were split across both by capacity). `SESSION_METHODS` gains `senchado`; `VESSEL_TYPES` gains `Shiboridashi`; `brewMethodFor` is three-valued (senchadō explicit-only — capacity never infers it, since a kyusu reads western and a shiboridashi gongfu by size); the per-steep feedback gate now fires for gongfu OR senchadō so Japanese sessions finally reach the per-steep cards; a **vessel-type prefill** sets `brewStyle` explicitly on new-session setup (Gaiwan→gongfu, Kyusu/Shiboridashi→senchado), a default-not-a-lock (explicit tap wins); and **(B7) an explicit method control on the edit-session modal** so an old session's method is one-tap correctable in-app (a method-less session shows the observational "no method recorded — currently read as X from the vessel").
- **Ratio baseline (B5 reversal, recorded).** An earlier draft was capture-only; the numbers killed it — a kyusu sencha scored against western 1.8 reads "strong" while brewing correctly. So senchadō rides the **gongfu** side (`kb.ratioGongfu`, then `LEAF_RATIO_DEFAULT.green_jp.senchado`=2.8, then `kb.ratio`), never western. **Stated plainly: the 2.8 leaf-seed is currently UNREACHABLE — all five of the library's Japanese greens resolve in the KB (ratioGongfu 3.0), which sits above the leaf table, so senchadō and gongfu produce an identical baseline for every current tea.** Still the right direction (1.8→3.0 vs a real ~2.8 ≈ 7% over, not 36% under). 2.8 stays as a KB-miss fallback; **the gyokuro revisit needs senchadō ratios in the KB, not the leaf table, or the seed stays decorative.**
- **Regression proof:** OLD (`892cb0b`) vs NEW `computeSessionRatio` across all 28 real sessions → **0 verdicts changed** (nothing carries `brew_style=senchado` yet). senchadō only re-baselines once Niklas retags; the intended future shift is 1.8→3.0 for his kyusu greens.
- **Judgment calls:** (1) the **vessel prefill** is new-drafts-only — it never fires on edit, so editing can't silently retag history; the edit-modal control (B7) is the *explicit* correction path that safely does the retag, selected from the stored value only, never prefilled. (2) `WHATS_NEW` warranted — senchadō now drives a baseline and unlocks Japanese per-steep capture (not the cosmetic button the capture-only draft implied).
- **Gate routing (B3 vs B5).** B3's "gate on explicit `brew_style`, not `brewMethodFor` — B5 keeps it two-valued" contradicted B5's three-valued change. Kept the gate routed through `brewMethodFor` (`['gongfu','senchado'].includes(...)`): consistent with the method segment (same resolver), and it preserves existing behaviour on the one vessel where the options differ — the **Travel cuppa** (Porcelain teapot, unmapped → capacity 115 ml → gongfu → cards show today); strict-explicit would silently remove those working cards (failure-mode #4).
- **Task committed as the record** — `docs/tasks/TASK-senchado-capture.md` (new `docs/tasks/`), verbatim body + a banner reconciling the above.
- **Known downstream (Design's, routed separately):** R3 board #04's two-button method segment now needs a three-button revision.
- **Ritual amendment:** `slowcup-deploy` step 6 now requires the gitignored `fixtures/*.csv` exports to be current before the fixture run counts (else real-data guards graceful-skip on a fresh clone).

---
## docs — freshness spec rev 2

Reviewed the freshness hand-off pin (`docs/r3/planning/SPEC-freshness-model.md`) against the live
build. Rev 1 mis-stated what ships today in three places: `freshnessClass` is the v3.62 detail cue,
not the engine (that's `statusCategory` + `freshnessWeeksLeft`, driving the shelf); ageing already
ships for white and pu-erh, so only oolong ageing is new; and `isTeaUnopened` (v3.88) already infers
openedness from stock.

Rulings folded in: the new model is single writer across shelf and detail, so `statusCategory` and
the global `FRESH_WINDOW_MONTHS`/`FRESH_NEAR_WEEKS` retire and status-line-test section D is
rewritten, while `statusLine`'s quantity-first precedence stays; clock-grounding and
window-grounding are separated, adding an elapsed-only rung so a tea with `opened_date` but no
catalog match still reads; windows key on catalog slug with family fallback, and the Herbal row is
dropped; ungrounded on the shelf falls through to the quantity tone, never an empty slot.

Three collisions flagged as hand-off items rather than assumed: `isTeaUnopened` vs `opened_date`,
`teas.type = puerh` vs `TEA_TYPES.family = dark`, and the catalog's exact-name hand-curated join.
README corrected: the two spec copies differ in substance, not framing, and the shared
`Design → Code hand-off` header describes purpose, not authorship.

Docs only — no app change.

---
## docs — the R3 design record lands in the repo

`docs/r3/` — the design round's durable record: the planning lane's reconciliation notes and
specs, Design's surface inventory + connection map, and the locked board PNGs. Previously
this existed only in chat transcripts and Design's workspace; `R3-BRIEF.md` was the sole
committed artifact.

- **`.gitignore` corrected.** The "design bundles are local-only, never shipped" rule dated
  from R2, when bundles were inspiration reference. R3's boards are the spec Code builds
  from, so the locked record is now tracked; only working files and the ~10MB `.dc.html`
  standalone exports stay ignored.
- **Includes a hand-off pin** — `SPEC-freshness-model.md` (opened-date clock, per-type
  catalog windows, ageing-as-history) had no home in the repo and joins the swatch and
  per-origin script models at the joint Code hand-off.
- **Boards: latest locked revision only.** The reconciliation notes carry the reasoning for
  each change, so revision history isn't duplicated as pixels. `.dc.html` standalone exports
  excluded — no extra reviewable content over the PNGs. (Two boards renamed to kebab-case —
  `03-tea-detail.png`, `06-add-edit-tea.png` — to match the README and the other eleven.)
- **Planning-lane handover kept as a dated snapshot** — `docs/r3/HANDOVER-planning-lane.md`,
  banner-marked 2026-07-19 / not-current (its status sections go stale by design; current state
  is `STATE.md`/`CHANGELOG.md`). **Known follow-up:** its §6 (review method) + §7 (recurring
  failure modes) are durable discipline recorded nowhere else and should be promoted into
  `CLAUDE.md` as standing review discipline.
- No app change. Docs-only.

---
## v3.90 — greeting recency tune + soft cultivar check
Deploy: `steep-dashboard.js` (RECENCY_DAYS/RECENCY_PENALTY), `fixtures/greeting-v4-test.js` (H section), `steep-tea-types.js` (cultivarNameHint), `steep-teas.js` (cultivar-field hint), `fixtures/tea-types-test.js` (H section), `steep-core.js` (APP_VERSION + WHATS_NEW), `service-worker.js` (**v100**), `CHANGELOG.md`, `STATE.md`, `ROADMAP-v4.md`. **No SQL.**
- **Part 1 — recency tune (#25 follow-up).** DHP kept being re-suggested two days after a brew: verified not a bug but too-gentle dials — a two-days-ago brew sat at the old 2-day window's edge (half penalty), which a habitual favourite's bucket lead swamped. **`RECENCY_DAYS` 2→3, `RECENCY_PENALTY` 1.25→1.75** (`d_scorePick`, steep-dashboard.js). Tuned against the *current* export, not a guess: the dry-run showed widening OR strengthening **alone** left DHP winning (1.52 / 1.48 vs Gui Fei 1.35); only both together demote it (1.18). Guardrail intact — a two-days-ago penalty only overcomes a bucket lead of ~1, so a strongly-habitual tea (bigger lead) or one with no recent brew still surfaces (the morning pick stayed the habitual Shincha in the dry-run). No scoring-structure change; both consts stay tunable (taste dial). greeting-v4 H 5→8 (the DHP-mirror demote + its guardrail; the widened-window boundary).
- **Part 2 — soft cultivar check (suggest-never-block).** A quiet, dismissable heads-up when the Cultivar field holds a tea *name/style/place* (e.g. "Gui Fei", "Da Hong Pao") rather than a cultivar. `cultivarNameHint` (steep-tea-types.js) rides the v3.87 reference catalog. **High-precision, low-recall by design:** it hints only when the folded value exactly matches a name we can confidently call a non-cultivar — a top-level style/place/name row, MINUS an explicit exceptions set of standalone rows that are / double as a cultivar (`jin-xuan-milky`, `ruan-zhi-oolong`, `anxi-tie-guan-yin`) — PLUS the one member that is a tea name (`dhp`). Cultivar members (Rou Gui, the Dan Cong aromas) and uncatalogued strings stay silent, so a real-but-obscure cultivar is never nagged. Matching expands name variants (`/`-split + parenthetical-strip + aka) because bare "Gui Fei"/"Da Hong Pao" aren't in the catalog's `covers`. Blur-triggered, dismissable, reuses the existing kb-suggest visual idiom; **the typed value is always saved unchanged** (`submitTeaForm` reads `f.cultivar.value` as-is — write path/mappers untouched). tea-types H = 11. First small live use of the reference read path (the Phase-B browsable page is still held).
- **Diagnostic (confirmed, parked for R3).** The ephemeral steeping nudge (`d_nudgeNextSteep`, "How was that pour? · Just right") writes only `timeShift` — `'ok'` writes nothing — so a user can believe they logged how it tasted while nothing reaches `steep.feedback` or the phase-2 gate. Confirmed this session, deliberately NOT fixed: the fix waits for the R3 Log/Focus-screen resolution (which must make "adjust the timer" and "log the taste" unconfusable) so it lands consistently. Recorded in STATE.
- **Judgment calls (render tokens, phone-checkable):** the `WHATS_NEW` banner wording, and the hint copy ("…looks like a tea name or style rather than a cultivar — kept as you typed it."). Deploy shape ruled one deploy / two logical commits / one banner.

---
## v3.89 — per-steep strength feedback (gongfu)
Deploy: `steep-data.js` (steep mapper +`feedback`), `steep-core.js` (`reduceSteepFeedback` + `feedbackSignalOf` branch + `sessionHasFeedback` + APP_VERSION + WHATS_NEW), `steep-sessions.js` (per-steep capture UX), `.gitignore` (fixture exception), new `fixtures/brew-feedback-test.js`, new `sql/v3_9-steep-feedback.sql`, `service-worker.js` (**v99**), `CHANGELOG.md`, `STATE.md`, `ROADMAP-v4.md`. **SQL: `sql/v3_9-steep-feedback.sql` — already run 2026-07-17 (one nullable `steeps.feedback`; the file is the repo record).**
- **The A2 capture control** (spec `SPEC-brew-advice-v3-feedback.md`, issues #15 + #9) — the slice that fills the phase-2 gate. Data: one nullable `steeps.feedback` (`'good'|'strong'|'weak'`, enum **app-enforced**, no DB CHECK — mirrors `sessions.feedback`); the `steepFromDb`/`steepToDb` pair carries it, so every write path (bulk / per-session / duplicate) inherits it with no per-callsite edits.
- **Aggregation — read-side precedence ladder** `per-steep curve → session verdict → tag inference → null`. New `reduceSteepFeedback` (net-sign only, tie→`'good'`, untapped & malformed ignored); `feedbackSignalOf` gains one branch at the top — per-steep **wins**, never merged with the session verdict. `computeBrewAdvice` is **UNCHANGED** (both sources converge on the same token, so ratio math and the memory line are untouched). `sessionHasFeedback` ships as a **real function** — the linchpin is steep-only→true, else A2's own data would be invisible to its own gate.
- **Capture UX** (`steep-sessions.js`): gongfu-gated per-steep tap on the completed steep cards (`steepFeedbackHTML` / `d_toggleSteepFb` / `setSteepFeedback`). Quiet-until-reached-for — faint `strength?` when unrated, a faint `· a touch weak/good/a touch strong` marker once set, `.lib-chip` chips only while expanded (one steep open at a time). Copy is **observational**; the ephemeral nudge (`d_nudgeNextSteep` → `timeShift`, "Weak → longer") stays **imperative and untouched**. Strict non-interaction: a steep tap writes only `steep.feedback`. Tea-First: never required, finish never flags an un-rated steep, `feedbackRowHTML` session verdict stays as the all-methods fallback.
- **Judgment call (approved 2026-07-17):** the per-steep affordance also hides when `brewAdvice` is off, mirroring `feedbackRowHTML` — one switch governs the whole feedback→advice loop, and it's one more condition under which the affordance is simply absent. Beyond the spec's explicit method-gate.
- **Judgment call:** render tokens are a first-ship default in **existing** tokens (no new CSS, `styles.css` untouched — `.lib-chip` for chips, inline `--ink-soft`/11px/opacity .6 for the faint mark). Glyph/colour/weight go to Design only if the resting state reads too loud on device (Niklas's on-device quiet-until-reached-for pass).
- **Collapsed** the planned two commits (inert plumbing + UX) into one on Niklas's call — one deploy, one honest banner.
- **Fixtures:** new committed `fixtures/brew-feedback-test.js` (54 checks — §A–I: the seven read-side invariants incl. steep-only→true, tie-wins-over-session, partial tap, malformed-ignored, `computeBrewAdvice` composition + source-convergence, determinism; plus the real-data **no-op regression**: all 12 legacy sessions → `reduceSteepFeedback` null, so advice stays byte-identical for existing teas). All 13 committed suites green. Live-smoked in preview via real inline `onclick` paths (expand/pick/collapse/toggle-clear, `timeShift` untouched, western hides the affordance). The mapper round-trip is a flat field map, not branching logic → Niklas's save→reload phone-check, not the vm suite.

---
## v3.88 — greeting: no re-suggesting what you just had, honest "unopened"
Deploy: `steep-dashboard.js` (d_scorePick recency + #17 copy gate + ack rewrite), `steep-core.js` (`isTeaUnopened` + APP_VERSION + WHATS_NEW), `steep-tea-types.js` (dead `⚠︎ confirm` branch removed — rides this cache bump), `fixtures/greeting-v4-test.js` (H+I), `fixtures/tea-types-test.js` (A6), `service-worker.js` (**v98**), `CHANGELOG.md`, `STATE.md`, `ROADMAP-v4.md`. **No SQL.**
- **#25 — the greeting stops re-suggesting a tea you just had.** `d_scorePick` gains a proximity-scaled SOFT penalty (`RECENCY_DAYS`=2, `RECENCY_PENALTY`=1.25, both tunable) for teas brewed within the last 2 *prior* days — a penalty, not an exclude, so a tiny shelf never runs out of picks and a strongly-habitual tea can still surface (fixture-pinned). Today is deliberately EXCLUDED so logging a tea can't retroactively change the day's predicted pick (the predicted-vs-actual stability the session-aware branch relies on). Deterministic — measured from `todayKey`, never `Date.now()`.
- **#17 — a tea you've opened is never called "unopened".** New `isTeaUnopened` (steep-core, beside `isTeaFinished` — the opposite end of the same v3.40 evidence axis): genuinely unopened only with no purchase data on record, or stock still at/above what was bought. One authoritative predicate (not inlined into the copy where it'd drift). The rediscovery copy gate splits on it — opened-but-unbrewed teas get a neglected register ("waited patiently on the shelf"), never "unopened".
- **Ack rider** — the didn't-take-predicted acknowledgment pool rewritten to be unambiguously retrospective (past-tense / in-the-pot), so it reads as looking back at the cup brewed, not recommending one to brew next.
- **Rider (hygiene item 3): tea-types confidence robustness.** Removed the dead `c==='⚠︎ confirm'` branch in `typeConfidenceHedge` — no committed row carries verify/confirm (27 canonical / 3 contested), and it held the only non-ASCII compare key in shipped code (brittle to variation-selector/encoding drift). Routed to this versioned commit — not the no-bump docs commit — because it changes a precached module and needs the cache bump to reach users. A comment marks where an ASCII `verify`/`confirm` branch would return if a future seed row needs it.
- **Fixtures:** greeting-v4 47→58 (H recency: demotion, habitual-still-surfaces, out-of-window, today-excluded, determinism; I the unopened gate both ways over a firing rediscovery day); tea-types 48→49 (A6: confidence values are the ASCII set `{canonical,contested}`). All 12 committed suites green.
- **Sibling docs commit (no version):** ROADMAP backfill (v3.83/84/85 ticks), the verifier's explicit codepoint policy, and the deletion of the two stale local suites shipped separately as `docs — hygiene: …` (developer-facing, no cache impact).

---
## v3.87 — tea reference layer: Phase A (data + read path)
Deploy: new `steep-tea-types.js` (55-row TEA_TYPES global + read path), new `fixtures/tea-types-test.js` (+ `.gitignore` exception), `index.html` (script tag), `service-worker.js` (**v97** + FILES_TO_CACHE), `steep-core.js` (APP_VERSION + WHATS_NEW suppressed), `CHANGELOG.md`, `STATE.md`, `ROADMAP-v4.md`. **No SQL.**
- **Phase A of the tea reference layer** — the data + queryable read path, no UI yet (Phase B = the browsable page, held until phase-2; Phase C = R3 styling + the confirm-not-auto-write library link). `steep-tea-types.js` is a plain script-global like `steep-knowledge.js`: `const TEA_TYPES` inline (precached, no fetch) + `resolveTeaType` (read-time parent inheritance), `matchTeaType` (name→type by curated `covers`, never token inference), `browseTeaTypes`, `typeConfidenceHedge`.
- **Two-level taxonomy + reconciliation rulings (2026-07-15).** 58 seed rows → 55 committed: gyokuro deduped (Batch-1 row, "(shaded green)" display; Batch-3 stub dropped); the flat `da-hong-pao-yancha` / `phoenix-dancong-yashixiang` rows superseded by two-level parents (`wuyi-yancha`+`dhp`, `phoenix-dancong`+`ya-shi-xiang`); `covers` moved member-only, so a library tea resolves to its most specific type while the parent stays browse-reachable.
- **Confidence is per-row, never inherited (the load-bearing catch).** A member can be more contested than its parent: `dhp` carries `confidence:"contested"` under a `canonical` Wuyi Yancha, so the §3 hedge-visible contract fires on exactly the tea that shouldn't read as settled fact (commodity Da Hong Pao is usually a Shui Xian + Rou Gui blend, not mother-bush leaf). `resolveTeaType` forces each row's own confidence; `typeConfidenceHedge` renders it (copy is a Phase-B placeholder).
- **No user-facing change → WHATS_NEW suppressed** (`''`): the module is real and precached but dormant, so the update banner (`showUpdateBanner`, steep-boot.js — its `&& WHATS_NEW` guard omits the second line when empty) announces no feature users can't reach. WS4-landing precedent; the CHANGELOG carries the full developer-facing truth.
- **Fixtures:** new committed `fixtures/tea-types-test.js` (48 checks — data integrity, member inheritance, confidence-per-row, the DHP hedge end-to-end, covers resolution both ways [member is the matcher target, parent stays browse-reachable], disambiguation traps [bai≠white, EN black ≠ ZH hei cha, one name = two teas], and the real `teas_rows.csv` mapping all 13 library teas). All 12 committed suites green. The reconciliation generator stayed a local throwaway; the seed `.md` remains the human source.

---
## docs — tea reference layer inputs + phase-2 pre-spec land in the repo
Deploy: new `TEA-REFERENCE-HANDOVER.md`, `TEA-TYPES-SEED.md`, `TEA-HANDBOOK.md`,
`TEA-REFERENCE-BRIEF.md`, `PHASE2-PRESPEC-NOTES.md`; updated `STATE.md`, `CHANGELOG.md`. No app
change, no SQL, no cache/APP_VERSION bump.
- **Tea reference layer — the finished, fact-checked inputs** for a future "tell me about this tea"
  surface + browsable encyclopedia. `TEA-TYPES-SEED.md` is the source of truth for data shape: 58
  rows, 7 authoring batches, all six families, a two-level parent→member taxonomy with
  attributes-not-classes, a processing-term exclusivity audit + family scorecard.
  `TEA-REFERENCE-HANDOVER.md` = the implementation plan (decisions ruled §6, R3 sequencing §4);
  `TEA-REFERENCE-BRIEF.md` = design/UX intent (carries a reconciliation banner: seed wins on data,
  brief wins on why/UX); `TEA-HANDBOOK.md` = the proofed prose that is the in-app copy source.
  Committed so Code can open them; **implementation is Phase A/B, gated after phase-2** — nothing
  built here.
- **`PHASE2-PRESPEC-NOTES.md`** (planning-lane, nothing to build): two decisions that must land
  before the phase-2 brew-advice spec — confirm the training signal stays the one-tap
  good/strong/weak axis (not free-text notes), and whether the strength tap moves **per-steep**
  (the end-of-session single tap mis-maps to multi-steep gongfu and is being skipped, the real
  reason the gate is under-filled). Plus the diagnosed greeting-pass slice (#25 recency window +
  #17 stock-evidence, batched).
- **`STATE.md` refreshed:** the phase-2 gate lines now reflect reality — **~3 of 15** complete
  (ratio'd + feedback'd) rows measured 2026-07-15, so the **~Jul 20 estimate is stale** (~2–3 weeks
  out), and the gate is held behind the two pre-spec decisions above.
- The `TEA-HANDOVER-PACKET.md` "start here" reader stays out of the repo (a paste-time index, not
  something Code builds from).

---
## v3.86 — #26 + #27: empty says so, unknown stays unknown
Deploy: `steep-teas.js` (`stockTier` 0g split · `statusLine` empty/untracked branches · count-row empty segment · tea-detail cups line · cards/rows unify through statusLine), `steep-dashboard.js` (restock card renders `empty` cell), `steep-core.js` (APP_VERSION + WHATS_NEW), `service-worker.js` (**v96**), `DESIGN.md` (accepted-nuance entry), `fixtures/status-line-test.js` (section I + H relabel), `STATE.md`, `ROADMAP-v4.md`. **No SQL.**
- **#26 — empty is now a first-class state.** `stockTier` split the old catch-all `'out'` (any ≤0g) into
  **`'empty'`** (tracked and drained — `isTeaFinished`) vs **`'untracked'`** (bare 0g, the DB default, where
  quantity was simply never entered). The v3.40 rule stands: unknown ≠ empty. Nothing else referenced `'out'`
  (`isRunningLow`/`shelfSort`/Low chip/shopping untouched), so the split is contained.
- **#26 C — `statusLine` stops lying.** It never handled ≤0g, so an active untracked tea fell through to
  "0g · fresh, plenty". Two new branches, both **without a gram prefix** (a "0g ·" would restate the number
  that's in doubt): `empty` → "empty", `untracked` → "quantity not tracked". Both ink-soft — information, not
  urgency; clay stays low's alone. The function is now total.
- **#26 A — empty joins the tally.** The Library count row gains a fourth segment
  ("N teas · M in stock · K running low · E empty", rendered only when E>0). Untracked teas count in none of
  the stock segments — so segments deliberately don't sum to N; unknown isn't tallied as anything.
- **#26 B — restock card widens to low-or-empty.** `restockCandidate` = (favourite ‖ would-rebuy) ∧
  (tier ∈ {low, empty}). A drained favourite is exactly what a restock surface is for. The v3.82 correction
  **stands** — `'few'` still never earns the card — and `'untracked'` can never reach it by construction. On the
  Home card an empty tea's cell reads "empty" (not "0.0g"); the existing grams-ascending sort floats empties top.
  **Judgment call (Q1, ruled):** cards and rows now render finished teas *through* `statusLine` — the hardcoded
  "finished" spans are gone. One writer, one word ("empty") across shelf, tally, and Home card; the "Finished"
  section header stays as the grouping title (it names the section, not the stock state).
  **Judgment call (Q2, ruled):** the Home card keeps its "Running low" title, judged on-device per the v3.81
  precedent; if it reads wrong above rows that say "empty", the pre-batched fallback is to retitle
  "Worth restocking" in this same deploy — no extra round-trip.
- **#27 D + F — the cups-not-grams nuance, explained where curiosity goes.** The tier is session-aware
  (cups = on-hand ÷ this tea's own average logged dose), so 19g at a ~3g dose honestly reads "plenty" (6.3 cups)
  while 23g at a 5g dose reads "a few cups left" (4.6) — the reporter's exact pair. Recorded in DESIGN.md's
  accepted-nuances register. A single quiet line now sits under tea-detail "On hand" — **"≈ 4.6 cups at your
  usual 5g"** (precise, ledger register, Q3 ruling) — rendering only with real dose history. **No shelf change:
  shelf lines stay dose-free.**
- **Fixtures:** `status-line-test.js` section I (12 checks — the 0g split by evidence, exact strings with no
  gram prefix, the "0g · fresh, plenty" bug pinned dead, card membership both directions, unknown-≠-empty by
  construction, both new tones ink-soft). H relabelled: its bare-0g favourite (H7) was always *untracked*, so
  the LOW-only pin survives B unchanged — the comment now says low-or-empty. 75 checks total; all 11 committed
  suites green.

---
## v3.85 — #24 + #29: the water counts, the word keeps
Deploy: `steep-sessions.js` (commitSession un-gates + edit-modal Water(ml) + tag-commit path + `enterkeyhint`), `steep-dashboard.js` (`gridStats` liters), `steep-core.js` (bindDynamic onblur, APP_VERSION + WHATS_NEW), `service-worker.js` (**v95**), `fixtures/stat-period-test.js` (new G section), `fixtures/flavor-ladder-test.js` (new H section + steep-sessions.js joins its sandbox), `STATE.md`. **No SQL.**
- **#24, two stacked bugs.** (a) The always-visible Water(ml) field (WS1 moved it out of the ratio-gated
  `ratioSetupHTML` into the More-details fold) was still commit-gated on `ratioAdjust` — default OFF —
  so the entered value was silently discarded (0 of 12 real sessions carried `water_ml`; a
  "never strand user data" violation). `commitSession` now persists `waterMl` whenever entered.
  (b) `gridStats` computed liters purely from vessel capacity; the per-session override now wins:
  `(waterMl > 0 ? waterMl : capacity) × steeps`. The v3.82 single-writer delegation is untouched, so the
  grid and achievements inputs still can't drift (pinned, G7).
- **Ruled rider (its own decision, not a drive-by): `brewStyle` un-gated too.** With `ratioAdjust` off
  it was null across the entire history, so phase-2's learned defaults (~Jul 20 gate) would have started
  cold. It now snapshots the method actually used (explicit pick or vessel inference); **cold brew keeps
  `brewStyle` null** — no gongfu/western semantics (branch verified unchanged in the live flow).
- **Edit-modal rider:** the session editor gains a Water(ml) field (placeholder = vessel capacity), so a
  past session's water is visible and backfillable — the reporter's "not visible in session data either."
  Mappers have round-tripped `water_ml` since v3.57; no SQL.
- **#29 — a typed flavour word is never lost.** On Android IMEs the keyboard's Enter arrives as a bare
  "next" action the keydown handler never sees, and there was no blur commit at all. Now: tapping/focusing
  away **commits** the word (no refocus on that path — the keyboard stays dismissed), `enterkeyhint="done"`
  on all three tag inputs, and suggestion picks bind `mousedown`+preventDefault so a tap can't blur-commit
  the half-typed prefix first (the "cara"+"caramel" double-add). Desktop Enter unchanged.
- **Fixtures:** `stat-period-test.js` G (8 checks — override wins/fallback/string-coercion/vessel-less/
  zero-override/composition/single-writer/**cold-brew row counted from its waterMl**; synthetic by
  necessity — the real export predates the fix) and
  `flavor-ladder-test.js` H (9 checks — routing, dedupe, trim+lowercase, clear, refocus discipline, the
  mousedown markup pin). **All 11 committed suites green** (75 + 75). Browser-verified through the real
  flow auth-lessly (seeded state): Enter and blur commits, empty-blur no-op, saved `waterMl`/`brewStyle`
  with `ratioAdjust` off, cold-brew null, liters 0.09-not-0.21, edit round-trip, Insights tile. Real
  Gboard key-event delivery can't be emulated in the pane — the blur path is the rescue either way.

## tooling — the audit and the inbox get names
Deploy: `.gitignore`, `.claude/agents/verifier.md`, `.claude/agents/issue-triage.md`,
`.claude/skills/five-lens-audit/SKILL.md`, `steep-core.js` (one comment reworded), `CHANGELOG.md`.
No behavior change, no SQL, no cache/APP_VERSION bump.
- **`.claude/agents/` ships with the repo** (new `!.claude/agents/` gitignore exception) — the
  `verifier` deploy-gate subagent existed only on this machine; sessions are disposable, knowledge
  lives in files, same rule the skills already follow.
- **New skill `/five-lens-audit`** — formalizes the 2026-07-13 pre-v3.83 audit (capability
  regressions · stale copy · seam consistency · doc debt · known-nuance register). Human-invoked
  (`disable-model-invocation: true`), read-only, findings report only — fixes always ship in their
  own reviewed slice.
- **New subagent `issue-triage`** (Sonnet, read-only) — pulls the open GitHub inbox incl. comments
  and screenshot attachments, buckets each issue (engine-touching / copy-or-UI-only /
  R3-design-gated / question-for-Niklas), and flags plan-review-pause + fixture implications.
  Report only — labels, comments, and closes stay human.
- **`steep-core.js` WS3 comment de-glyphed** — the favourite-mark comment (line 802) spelled the
  literal heart/star glyphs it replaced; now says it in words, so the codepoint sweep stays strict
  with no allowlist growth. Comment-only: behavior identical, cached copies stay valid.

## v3.84 — #23 F1: sort your shelf again
Deploy: `steep-teas.js` (count row + `SORT_OPTS` select + the float branch in `teaShelfHTML` + reinstated `setTeaSort` caller), `styles.css` (`.lib-countrow`/`.lib-sort`/`.lib-sort-caret`), `steep-core.js` (APP_VERSION + WHATS_NEW), `service-worker.js` (**v94**), `.gitignore` (+`shelf-order-test.js`), `fixtures/shelf-order-test.js` (new committed guard), `STATE.md`. **No SQL.**
The "ships now" slice of issue #23 (spec: `TASK-23-interim-sort.md`, repo root; plan-review pause held 2026-07-13). Interim = function now, R3 restyles.
- **All seven sorts return** — Type (default) · Recently added · Oldest first · Name A–Z · Most stock · Least stock · Highest rated — as one compact styled `appearance:none` select on the count row, mapping 1:1 onto the untouched engine keys in `filteredSortedTeas`. The handler is the **reinstated `setTeaSort`** (held from the F11 cleanup exactly for this); no parallel writer. `selected` re-derives from `state.teaSort` every render, so a mid-session `render()` can't snap the visible label back to "Type" while the order stays sorted. **Session-scoped** (resets on reload) — persistence is an R3 question.
- **The float branch (the reviewed behavior change):** the WS5 running-low float now decorates **only the default Type sort** — under an explicit sort it would silently reorder the user's chosen order, so `teaShelfHTML` applies `shelfSort` only when `teaSort==='type'`. Finished teas group at the bottom under **all** sorts (the split is upstream of the branch). The select lives outside `#teaShelf`, so #19's keystroke-only search re-render never touches it.
- **F3 rider (named, not drive-by):** the count line's **"M in stock" segment is restored** — "N teas · M in stock · K running low" — closing audit F3 alongside F1. The row is flex with `flex-wrap`: if 390px gets tight the select **wraps below the count text**; the count segments never truncate.
- New committed **`fixtures/shelf-order-test.js`** (19 checks, 11th suite): the default-sort float + its stability over type-then-name, the no-float pin under every explicit key (incl. the low-3★-below-plenty-5★ case verbatim), finished-bottom under default AND explicit sorts, the v3.40 lifecycle pins stated definitionally (bare 0 g = unknown ≠ empty → active; purchase-evidence + 0 g → finished; untracked → 0 → stock-low head), grid≡rows order agreement, and a real-CSV section (every key over the real shelf, stock-sort monotonicity, low-set float) that skips with a reported count when the CSVs are absent. `node --check` clean; **all 11 committed suites green**.

## docs — slowcup.app is the canonical URL
Deploy: `STATE.md`, `CLAUDE.md`, `ROADMAP-v4.md`, `CHANGELOG.md`. No app change, no SQL, no
cache/APP_VERSION bump.
- **Domain migration done 2026-07-13:** https://slowcup.app is canonical (GitHub Pages custom
  domain; the old tosinik.github.io/steep-tea-log URL 301s there, so old links self-heal). **Zero
  code changes were needed or made** — manifest scope/start_url are relative, the SW registers
  relatively, auth redirects build from `location.origin` (verified pre-migration). PWA reinstalls
  (new origin = new SW + storage) are user-side work, not repo work.
- Setup facts recorded in STATE.md "Domain & auth origins": Porkbun DNS (4× A → Pages IPs, CNAME
  www, the **must-stay** TXT verification record, auto-renew ON), Let's Encrypt via Pages +
  Enforce HTTPS, `.app` HSTS-preload = no HTTP fallback (domain lapse = hard-dead app), Supabase
  Site URL flipped + dual-origin redirect allowlist with the **Ruth-gated cleanup follow-up**.
- **Out-of-band commit acknowledged:** `e744f7b` ("Create CNAME") was committed to main by GitHub
  itself when the custom domain was set — expected, not a deploy. `CNAME` isn't referenced by the
  SW or precache, so no cache bump; recorded here so the one-commit-per-deploy ledger stays honest.

## docs — post-R2 audit reconciliation
Deploy: `CLAUDE.md`, `STATE.md`, `ROADMAP-v4.md`, `DESIGN.md`, `CHANGELOG.md` (this module map).
No app change, no SQL, no cache/APP_VERSION bump. The doc-debt half of the 2026-07-13 audit (the code
half shipped as v3.83; the capability-regression bundle is issue #23).
- **ROADMAP-v4 Pillar D** (the live foot-gun, fixed first): the flavor-experience spec still prescribed a
  `flavor:` tag namespace — corrected to the **shipped bare + membership** convention (v3.78 pause
  decision) with an explicit do-not-reintroduce note, and marked SHIPPED.
- **Module map above** rewritten to current reality (adds steep-data/knowledge/insights/shopping; the
  "concatenates back to `app.js` byte-for-byte" claim retired as historical).
- **CLAUDE.md:** intro now states the SlowCup brand + the real achievements posture (dormant app-wide
  v3.72; the "Brewing days" heatmap deliberately neutral + ungated, v3.83); dashboard/insights card
  ownership updated to post-WS2 reality; the popup-sweep note corrected (sweep COMPLETE — zero
  `alert()`/`confirm()` remain); the fixed in-session "turn off" bug struck through (v3.68, issue #1).
- **STATE.md:** seed line points at ROADMAP-v4; new **"Feeding claude.ai"** section (repo re-cloned live
  each turn — never mirror source; project base = 4 CSVs refreshed before each phase-N spec + design
  images + task/continuity docs); the 5 R3 board PNGs corrected to go to the claude.ai project base, not
  repo `images/`; load order gains steep-insights; calm-first + popup claims aligned with CLAUDE.md; the
  WS4 block records the **quick/cold-brew-never-feed-the-flavour-profile** scope edge with its single
  choke point (`distinctVocab()`, steep-teas.js); Continue-here updated (v3.83 shipped · interim-sort
  lane awaits its brief · #23 holds the reinstate-vs-accept decisions).
- **DESIGN.md:** emoji-sweep note updated (complete — the 🧘 "known leftover" was retired v3.76); layout
  paragraph now describes the WS6 shell (bottom bar + hub), not the old sticky header; new **low-stock
  tone rule** (clay on ritual surfaces / red on analytics surfaces — deliberate); new **accepted
  nuances** register (native select pickers · UI-chrome dates EN-greeting/locale-Spending · oolong roast
  untracked).

## v3.83 — audit riders: never lose a session to the Log button
Deploy: `steep-sessions.js` (`draftFingerprint`/`sessionDraftDirty` + guarded `quickLogSession(btn)` + `clearTimerInterval()` in `startSessionFor`), `steep-core.js` (bn-log passes `this`, APP_VERSION + WHATS_NEW), `steep-dashboard.js` (viewSpend back → Insights + neutral heatmap card + onboarding copy), `steep-settings.js` (chime copy), `service-worker.js` (**v93**), `.gitignore` (+`log-guard-test.js`), `fixtures/log-guard-test.js` (new committed guard). **No SQL.**
The four riders from the 2026-07-13 post-R2 audit (the capability-regression bundle is issue #23 — planned as "#21" in the review, renumbered by GitHub).
- **The Log button asks before discarding (audit F4).** WS6 put the raised Log in the bottom bar on every content screen — including the session flow, where `quickLogSession` silently overwrote the draft (a finish-screen mis-tap ate rating/notes; mid-steep it orphaned the running interval). Now: past setup there is **always** something to lose → `armConfirm` two-step ("Discard the session in progress? · Yes / Cancel", inline, no popup); in setup only a **dirty** form arms — dirty = the draft's fields differ from their fresh-draft fingerprint (`_pristine`, stamped at creation), so reverting an edit reads clean again and UI-state toggles (fold, flavour reveal) never count. A programmatic call with no button **never silently discards** — it routes back to the session view. `startSessionFor` now calls `clearTimerInterval()` unconditionally before replacing the draft, so no orphaned tick survives a replacement from any path.
- **Spending finds its way home (audit F6).** `viewSpend`'s back button read "← Back to dashboard" and landed on Home — but its only entry (the cost card) moved to Insights in v3.74. Now "← Back to Insights" → `goView('insights')`.
- **Settings stops promising a haptic (audit F9).** "Chime and vibration when a countdown finishes" → "Chime when a countdown finishes" (`navigator.vibrate` was removed in v3.77).
- **The streak framing goes; the calendar stays (audit F17).** `streakCardHTML` on the Sessions tab was the last ungated streak surface after v3.72 hid achievements. The "Drinking streak · N days current" line is gone; the heatmap stays under a neutral **"Brewing days"** header (deliberately kept on Sessions, not gated — Niklas's v3.44 placement stands). Rider-of-the-rider: the onboarding lede's "your streak" promise → "your brewing days", so no copy points at a removed surface. `s.streak` is still computed (achievements metric, dormant).
- New committed **`fixtures/log-guard-test.js`** (24 checks, 10th suite): the dirty predicate at every stage boundary (steeping/finish/quick always dirty; fresh setup clean; edit → dirty → revert → clean; UI-state toggles never dirty), guard routing through the production `quickLogSession` (clean replaces silently · dirty+button arms with the exact message and the draft survives until Yes · dirty without a button routes to the session instead of discarding · no-teas early path), interval hygiene (old handle cleared AND nulled), and a real-CSV section (defaults to an in-stock tea; the finish-screen mis-tap pin) that **skips with a reported count** when the private CSVs are absent. `node --check` clean on all touched files; **all 10 committed suites green**.

## v3.82 — #16: a window on the numbers
Deploy: `steep-dashboard.js` (`gridStats`/`gridWindowStart`/`gridPeriod`/`setGridPeriod` + windowed totals card + restock filter → `restockCandidate`), `steep-teas.js` (`restockCandidate`), `steep-core.js` (APP_VERSION + WHATS_NEW), `service-worker.js` (**v92**), `.gitignore` (+`stat-period-test.js`), `fixtures/stat-period-test.js` (new committed guard), `fixtures/status-line-test.js` (H section), `STATE.md`, `ROADMAP-v4.md`. **No SQL.**
Issue #16: the Insights stat grid (sessions · infusions · days logged · grams · liters · teas brewed) was all-time with no period control.
- **A scoped reinstatement, not a reversal.** v3.65 deliberately retired the old week/month/all-time recap toggle ("observations, not KPIs"). This brings a period lens back **on the raw stat grid only** — the hard line stands everywhere else: the hero, "This week, mostly", the cadence reading, type mix, steep shape, and Wrapped stay prose/all-time, untouched (`insights-room-test.js` byte-identical and green). The toggle is a lens on numbers the grid already showed, not a scoreboard.
- **Calendar windows, not rolling.** Week = **Monday 00:00 local** (the Home week card's anchor since v3.74), month = **the 1st 00:00 local** — chosen so two labeled numbers under the same word can never disagree: the grid's week "Sessions" equals the Home week card by construction (pinned in the fixture). A session **at** the boundary is IN (`date >= start`); the fixture pins Monday 00:00.000 in / one ms earlier out, same for the 1st. (The hero's rolling 7/28d windows are its observation-picking heuristic, not labeled stats — left alone.)
- **All six stats window honestly** — each is a pure aggregate over the filtered sessions array: sessions in window · Σ steeps · distinct local days · Σ grams · Σ vessel-capacity×steeps · **distinct teas brewed in the window**. No stat needed an all-time fallback. `computeStats` now **delegates its six all-time fields to the new `gridStats(sessions)`** — single writer, so the grid's all-time numbers and the achievements inputs can never drift (equivalence pinned).
- **Label honesty + calm defaults.** An always-present eyebrow names the active window ("All-time" / "This month" / "This week") so a cropped screenshot can't pass a week off as all-time. Default is **all-time** — nothing changes unless you reach for it. The control reuses the WS5 `.density-toggle` segmented pattern; persisted **device-local** as `tealog_statPeriod` (the `tealog_teaDensity` precedent — a lens, not a setting worth syncing; garbage values fall back to all-time). An **empty window renders quiet zeros** (0 / 0.0) — no apology, no prompt to brew.
- **Rider — the Home "Running low" card is back to LOW-only** (#18 correction, one deploy later). v3.81 widened membership to tier ∈ {low, few}; the real screen showed why that's wrong: a favourite at 23g with a 5g dose (4.6 cups = "few") sat under the "Running low" headline **next to a ~6-month forecast** — the cups clock and the days clock disagreeing under one title. Membership is now the named predicate **`restockCandidate`** (steep-teas.js, beside the tier family): favourite-or-rebuy AND tier === 'low'. The few tier keeps its home on the shelf status line — scope, copy, `teaForecast` ~days, and "a few cups left" all unchanged. Noted on #18's closed thread so the tracker stays honest.
- New committed **`fixtures/stat-period-test.js`** (67 checks): pinned-date calendar boundaries (incl. a week that starts in the previous month), per-stat spot checks **through the production card** for all three windows, the week-card agreement pin, the `gridStats`≡`computeStats` equivalence, quiet-zero empty windows with a no-extra-copy sweep, persistence whitelist, and a real-CSV section (week ≤ month ≤ all-time monotonicity per stat, no NaN; **skips with a reported count** when the gitignored CSVs are absent). `fixtures/status-line-test.js` 56 → 63, purely additive **section H**: `restockCandidate` pinned low-only — the 23g/4.6-cup case verbatim (card: out; shelf: still "few"), rebuy-low in, unscoped-low out, plenty/out-tier out. `node --check` clean; **all 9 committed suites green** (greeting untouched, 47 passed).

## v3.81 — #18: a few cups left
Deploy: `steep-teas.js` (`teaAvgDose`/`cupsLeft`/`stockTier` + tier-keyed `statusLine` + `few` tone + `isRunningLow` := tier + Low chip/detail-red on the shared predicate), `steep-dashboard.js` (`s.lowStock` + restock-card membership on tiers + `teaForecast` dose via `teaAvgDose`), `steep-shopping.js` (suggestions = out OR `isRunningLow`), `steep-core.js` (APP_VERSION + WHATS_NEW), `service-worker.js` (**v91**), `fixtures/status-line-test.js` (F/G tier sections), `CLAUDE.md` (stale gh note), `STATE.md`, `ROADMAP-v4.md`. **No SQL.**
Issue #18: the status line was binary — under the gram floor "running low", everything else "plenty" — so a 12g green read "fresh, plenty" at ~2 sittings. Quantity is now **session-aware**: cups left = on-hand ÷ this tea's average logged dose.
- **The tiers** (`stockTier`, steep-teas.js): **<2 cups → "running low"** (clay, sorts top — unchanged) · **2–5 → "a few cups left"** (NEW, ink-soft, **no sort effect** — information, not urgency) · **≥5 → "plenty"** family. **Exactly 5.0 reads plenty** (deliberate: it defuses the one-big-gongfu-session outlier — one 8g session on a 56g tin = 7 cups = plenty — and five cups on the shelf *is* plenty in a calm app). Boundaries pinned in the fixture at 1.99/2.0/4.99/5.0.
- **Denominator:** mean `gramsUsed` over the tea's grams-logged sessions, **one session anchors it** (the `teaForecast` precedent — the real-data dry-run showed only ONE tea owns ≥2 weighed sessions, so a min-2 gate would have excluded the issue's own Sencha). All styles count (cold brew consumes leaf too). **No history → the `lowStockG()` floor keeps deciding exactly as before** — which is also why fixture sections A–E needed zero edits.
- **Precedence: low → few → (ages | countdown | plenty).** Quantity wins while remarkable: a 3-cup white reads "a few cups left", not "ages well" (an "ages well" on a nearly-empty tin hides the same lie #18 complains about); a near-window green with 3 cups drops the countdown (you'll finish it inside the window anyway). **Never composed** — no "fresh · a few cups left". Delicate greens with unremarkable quantity keep the `FRESH_NEAR_WEEKS` countdown; oolong "plenty" default and white/pu'er-only "ages" stand (WS5 semantics preserved).
- **One predicate family (the #13 guard):** every "low" surface now derives from `isRunningLow` := `stockTier==='low'` — the shelf **Low chip** (consequence, on purpose: finished/untracked teas no longer match it; they keep the Finished group + shopping suggestion), the header count, the Cost-overview **"Low stock"** count/rows (its `goLowStock()` jump lands on that chip — sets must agree), tea-detail's red "On hand", and shopping's suggestions (still "low OR out"). The Home **"Running low" card** replaces its ad-hoc 2×-floor band with tier ∈ {low, few} (same favourites-&-rebuys scope; few rows render ink-soft, low stays clay; the `teaForecast` ~days line is untouched — it answers *when*, the tier answers *how many*). `teaForecast`'s dose now calls `teaAvgDose` so ONE dose definition exists.
- **`fixtures/status-line-test.js` 39 → 56 checks, purely additive:** section **F** (15, synthetic + injected sessions) pins the four boundaries, the exact `"12g · a few cups left"` string + ink-soft tone, n=1 anchoring, cups overruling the floor in **both** directions, few-beats-ages, few-beats-countdown, no composition, no sort effect, and the no-history floor fallback; section **G** (4, real CSVs, skips with a reported count when absent) pins the low set still exactly {Shincha, Honey Oolong} with real sessions seeded, Sencha Kagoshima Premium → few, **the issue pin** (that tea at 12g → "a few cups left"), and Megumi 56g → plenty. `node --check` clean; all 8 committed suites green (greeting untouched, 47 passed).

## v3.80 — #19 + #20: find your way
Deploy: `steep-teas.js` (`teaSearchNorm`/`teaMatchesSearch` predicate + search in `filteredSortedTeas` + `teaShelfHTML`/`onTeaSearchInput`/`clearTeaSearch` + the hairline search row + tea-detail back button honours `'sessions'`), `steep-sessions.js` (tappable tea in `sessionRowHTML`/`sessThumbHTML` + `es_viewTea` + modal "view tea →" link), `steep-core.js` (`state.teaSearch` + `goView` clear + APP_VERSION + WHATS_NEW), `styles.css` (`.lib-search`/`.lib-search-x`/`.sess-tealink`/`.sess-viewtea`), `service-worker.js` (v90), `.gitignore` (+`tea-search-test.js`), `fixtures/tea-search-test.js` (new committed guard), `STATE.md`. **No SQL.**
Two small quality-of-life gaps from the issue queue: searching the Library, and getting from a session to the tea it was about.
- **#19 — Library search.** A quiet hairline search row sits **below** the WS5 chips (chips stay the primary control; R3 restyles the header later). It filters on **name · origin · cultivar · vendor(source)** and **composes with the chips as AND** — the search predicate is just another clause in `filteredSortedTeas`. **German is first-class via light normalization** (`teaSearchNorm`: lowercase, ß→ss, fold combining diacritics): `gruner` matches `Grüner`, `strasse` matches `Straße`. Folding only ever *broadens* a match, so no tea can be hidden by it — recorded here as the deliberate tradeoff over strict-umlaut matching. The query is folded **inside** `teaMatchesSearch` so the invariant is structural (callers pass raw text).
- **Focus-safe live filtering.** The render model is a full `#app` `innerHTML` rebuild, so a naive `oninput→render()` drops focus after one keystroke. Instead the shelf body is split into `teaShelfHTML()` and each keystroke swaps **only** `#teaShelf`'s innerHTML (`onTeaSearchInput`) — the input keeps focus and caret (verified in-browser). A chip/density click still full-renders; the input re-mounts with its value from `state.teaSearch`, so the two compose. The count line stays **outside** `#teaShelf` as a deliberate library-total (consistent with chips, which already don't move it).
- **Transient, not sticky.** `state.teaSearch` is cleared by `goView` **only when leaving the Teas tab** (`v!=='teas'`), so a search → tap a tea → back round-trip keeps the term, while navigating away resets it — avoiding the calm-first trap of a hidden filter that silently empties the shelf. Empty result: a quiet "No teas match your search." (no apology, no illustration). An inline **✕** clears it. Both grid + row density respected.
- **#20 — session → tea.** In `sessionRowHTML` the tea **name and thumb** are now their own tap targets → `openTeaDetail(teaId,'sessions')` with `stopPropagation`, so the rest of the row still opens the session-edit modal. The tea-detail **back button** now honours `'sessions'` ("← Back to sessions") alongside the existing passport case. The session-edit modal header gains a quiet **"view tea →"** link (`es_viewTea`) that closes the modal **first** — it's appended in `render()` regardless of view, so leaving it open would linger over tea-detail — then opens the tea. **Deleted-tea edge:** a session whose tea is gone shows "Unknown tea" with **no** tap target and **no** modal link — no dead affordance.
- New committed **`fixtures/tea-search-test.js`** (16 checks): case, umlaut/ß fold (incl. a raw-`GRÜNER` query hitting the predicate directly), multi-field match, negative + empty-query controls, and **chip+search AND composition** through the real `filteredSortedTeas`. A real-data no-crash pass runs over `fixtures/teas_rows.csv` and **skips with a reported count** when the (gitignored) CSV is absent, so fresh clones stay green. `node --check` clean; all committed fixtures green. Verified in-browser at 390px, both themes (search filtering, focus retention, session→tea nav, deleted-tea edge).

## v3.79 — #13: change the steep time with the new timer
Deploy: `steep-sessions.js` (single-writer `setSteepTime` + inline tap-to-edit countdown + `d_beginTimeEdit`/`d_endTimeEdit`; "Use time" now stopwatch-only), `styles.css` (`.timer-target-tap`/`.timer-target-inline`), `steep-core.js` (APP_VERSION + WHATS_NEW), `service-worker.js` (v89), `fixtures/steeping-timer-test.js` (F-section, committed), `STATE.md`. **No SQL.**
Fixes the reported bug: with a brew guide active the countdown read "of 117s" with no way to edit it, while the "Steep time (seconds)" field below held a different value (what actually logs) — two numbers visibly disagreeing, and the only manual input rendered exclusively when `!d.schedule`, so it vanished the moment a guide was active.
- **One value, one writer.** The countdown length (`timer.target`) and the logged steep time (`curTime`) are now written **only** through `setSteepTime(secs)`, so they can never drift. Every prefill/edit path routes through it — `applyScheduleToCurrentSteep`, `d_setActiveSteep`, the "Steep time (seconds)" field, and the new inline editor. `focusProgress(tm)` still reads `tm.target`, so focus mode and the existing timer fixture (sections A–E) carry over unchanged.
- **Inline tap-to-edit (never a popup).** The countdown's "of Ns" sub-label is a quiet dashed-underline tap target; tapping (only while the timer is **stopped**) swaps in a small inline number field bound to `setSteepTime`. Works identically with or without a guide — the root cause was the old input's `!d.schedule` gate, now gone. A blank/zero commit is treated as a **cancelled edit** and reverts to the prior target, so Start never faces an instant-complete 0-second countdown.
- **"Use time" reconciled.** In countdown mode it was a redundant bridge (the ring's target *is* the logged value) → removed. It survives **only in stopwatch mode**, where the counted-up elapsed is a genuinely separate measurement worth capturing.
- `fixtures/steeping-timer-test.js` extended with **section F** (12 checks, now 30 total): guide default seeds both equal, edit-while-stopped moves both, the F3 no-drift assertion (the bug expressed as a contract), rounding/floor setter semantics, the pinned zero-edit revert, and an invariant sweep. `node --check` clean; `steeping-timer-test` + `brew-roundtrip` green. Verified in-browser at 390px, both themes.

## v3.78 — WS4 Flavour: capture · story · honesty ladder
Deploy: `steep-knowledge.js` (`KB_FLAVOR_FAMILIES` + `flavorFamilyOf`/`flavorLabel`/`isFlavorVocab`/`capWord`), `steep-sessions.js` (inline capture under the timer + session story + history flavour chips + WS5-style thumb fallbacks), `steep-teas.js` (`teaFlavorProfile` + the "What you taste" honesty-ladder module + `flavorObservation`), `styles.css` (`.flav-*`/`.readback-*`/`.hist-chip`/`.flavp-*` classes + `--flav-onfg`/`--flav-radar-fill` tokens in both blocks + `.sess-thumb`/`.vessel-thumb` placeholders), `index.html` (`i-lock-hl` symbol), `steep-core.js` (APP_VERSION + WHATS_NEW + dead theme-button no-ops removed), `steep-settings.js` + `steep-dashboard.js` (emoji sweep), `service-worker.js` (v88), `.gitignore` (+`flavor-ladder-test.js`), `fixtures/flavor-ladder-test.js` (new committed guard). **No SQL** — rides the existing `steeps.tags`/`sessions.tags` arrays (semantic data-model change, not schema; the mappers already round-trip tags).
The last R2 workstream and the only new feature: capturing what you taste and reflecting it back honestly, in three connected moments. Decisions locked at the pause: **bare + membership** namespace, **arrival-only** mood, **story keeps the finish-screen inputs below it**.
- **Capture (steeping screen).** A reskin/upgrade of the existing per-steep tags field into inline flavour-family chips beneath the WS3 timer (`flavorCaptureHTML`). The 20-term `KB_FLAVOR_CHIPS` vocabulary groups into **four families** (Vegetal & marine · Sweet & floral · Roast & nut · Spice, earth & texture — umami + grassy homed in Vegetal & marine); two show by default, a "more" caret reveals the other two in place, a quiet door opens a free-text word. Each tap toggles a tag on the active steep's `curSteepTags` (committed into `steeps[].tags` on save) — **saved as you tap, nothing to submit**; skipping leaves no gap.
- **Namespace: bare + membership.** Vocabulary and free words are both stored bare in the tags array; "vocabulary" = membership in `KB_FLAVOR_CHIPS` (`isFlavorVocab`). Free words show in "You tasted" / on history cards but never inflate the radar-unlock count or become a bar/axis. Zero migration, and brew-advice tag matching (`feedbackSignalOf`) is untouched.
- **The session's story (`sessionFinishHTML`).** The wrap-up screen leads with the story — "Session complete · HH:MM", tea name, meta, a **"You tasted"** chip row (union of steep tags), a **read-back card** (an observation line — "Umami led early; sweetness opened up by steep 3." — plus a per-steep breakdown), and an **arrival-only** mood line ("Arrived **steady**.", omitted when no mood). Photo · rating · feedback · notes · overall tags · share stay below; the primary button reads **"Save to journal"**. History cards (`sessionRowHTML`) show the session's flavour chips (+N overflow); a session logged without notes reads "… · no notes" — no apology, no empty state.
- **The tea-page profile — the honesty ladder (`flavorProfileHTML`/`teaFlavorProfile`).** One "What you taste" module that only ever draws the shape the data has earned, over the **last 6 sessions that carry flavour data** (captured data, not brewing volume): **≤2 sessions → counted chips** ("still early") · **≥3 → ranked bars** (the everyday default; fill jade, amber for warm notes — sweetness/honey/malty) · **≥5 AND ≥4 distinct terms → radar unlocks** (bespoke 6-axis SVG; bars stay the default, radar/cloud are alt views via a **non-persisted** `state.flavorView` so bars lead on every visit). Every generated line is an observation, never a %/score/grade of the palate. Omitted entirely when a tea has no captured flavour.
- **Design reconciliations:** the WS3 timer serves as the mock's capture "recap strip" (no separate compact strip); the tea-page module renders as a **hairline-separated section** inside the detail card rather than a boxed card, per DESIGN's hairline-over-box language. `#i-caret-hl`/`#i-plus-hl` already existed in the sprite — only `#i-lock-hl` is new.
- **Rider — the full emoji sweep (7 sites, so the sweep comes back clean):** the 🍵/🫖 thumb fallbacks (session rows, vessels list) → WS5-style tinted/kanji placeholders (`sessThumbHTML`, reuses `.shelf-ph`/`.shelf-kanji`; `.vessel-thumb.is-ph`); the dead ☀️/🌙 `#themeToggleBtn` no-ops in `steep-core.js` (toggleTheme/setTheme/render tail — the button was removed in WS6, the assignments were unreachable) deleted; the Theme settings sub-copy that still referenced that header button re-worded ("Light or dark — saved on this device"); the 🏆 in the (achievements-gated) "Show achievements" settings copy and the 🎉 in the achievement-unlock toast (`celebrateAchievements`) dropped to plain text. Only the app's existing glyph vocabulary (`✕` close, `✓`, `★`, `—`) remains — no pictographic emoji left in `steep-*.js`.
- New committed **`fixtures/flavor-ladder-test.js`** (66 checks): family completeness (all 20 keys mapped once), the rung guard at every boundary, captured-data semantics + last-6 cap, free words excluded from the unlock count, the observation honesty guard (no %/score/grade), the renderers per rung, and a graceful real-data smoke pass. `node --check` clean on all touched files; all committed fixtures green.

## v3.77 — WS1 Forms: core trio + one fold
Deploy: `steep-sessions.js` (session-setup rebuild + `SESSION_METHODS` + `d_toggleMoreDetails` + mood-chip reskin + **the WS3 chime's `navigator.vibrate` removed**), `steep-teas.js` (add/edit-tea rebuild + `toggleSpecifics` + dirty-form close guard), `styles.css` (WS1 trio/mood/fold/dropzone classes), `index.html` (`i-caret-up-hl` symbol), `steep-core.js` (APP_VERSION + WHATS_NEW), `service-worker.js` (v87), `CLAUDE.md` (cleanup-backlog note). No SQL.
Fifth of the R2 design pass — the two first-run forms into one calm pattern (**core trio + one fold**).
- **Session setup:** the ten-field scroll becomes a short surface. A **core-trio card** — Tea · Vessel (styled `appearance:none` selects, tea in Shippori 20px) · **Method** — owns the top; the brew-guide readout, the **amber-pale "How are you arriving?" mood moment**, and a single **"More details"** fold (leaf · water · water type · TDS · when · cold brew) follow. The fold is one boolean (`d.showMoreDetails`, render-on-state). "Begin steeping" still validates only that a tea is chosen.
- **Method is 3-way-ready (reconciliation #3).** The segment renders from a `SESSION_METHODS` array (`gongfu`/`western`) with the active one inferred from vessel capacity (`brewMethodFor`); phase-2 appends `{k:'japanese'}` — a data change, no layout rebuild. Shown for non-cold-brew sessions; hidden (with the brew readout) when cold brew is on.
- **Add / edit tea reuses the shape:** photo dropzone · name · type up front (the minimum to save), everything else behind a **"Specifics"** fold. **Correctness:** the tea form reads its fields on *submit* (named inputs), so this fold is a **DOM toggle** (`toggleSpecifics`, `display:none`/`''`), NOT a re-render — folded inputs stay in the DOM and keep their unsaved values. "Save tea" validates only name + type, with a "name and type are all you need" helper.
- **Mood chips** go amber-when-chosen (was jade), single-select, always optional — shared with the edit-session mood row.
- **Dirty-form guard (calm-first):** dropping the tea-form Cancel button made tap-outside more load-bearing, so a stray backdrop tap no longer discards a half-filled form — `_teaFormTouched` (form-level `oninput`, also catches the photo input) makes the backdrop **inert while dirty** and routes the **×** through an inline "Discard changes?" confirm; a clean form still closes freely either way.
- **Rider (folded in, no separate bump):** removed `navigator.vibrate(60)` from the WS3 chime — opt-in sound is chime-only now, no haptic.
- Verified both themes via computed styles + DOM: trio/method/mood/fold render, amber-pale `#F1DFC7`/`#3A2C1A` mood card, cold-brew hides method + swaps the button, the Specifics fold **opens and closes** (caught + fixed a toggle bug where it only opened) and preserves a typed-but-unsaved value across a collapse. `node --check` + all 6 committed fixtures green.

## v3.76 — WS3 Steeping: the ensō is the timer
Deploy: `steep-sessions.js` (title bar + interactive steep pills + reskinned timer box + breath-led focus mode + opt-in single chime + `d_setActiveSteep`/`toggleSound`), `styles.css` (WS3 timer/pill/focus classes + `sc-breathe`/`sc-breathe-slow`/`sc-halo`/`sc-digit` keyframes + `--enso-track`/`--timer-sub`/`--timer-soft` tokens), `index.html` (i-chevron/i-focus/i-sound/i-mute symbols), `steep-core.js` (sound default OFF + focus swipe-up gesture in bindDynamic, APP_VERSION + WHATS_NEW), `service-worker.js` (v86), `fixtures/steeping-timer-test.js` (**new committed suite**), `.gitignore` (track it + ignore `design-r3/`). No SQL.
Fourth of the R2 design pass — the ritual hero. Reskins the existing timer engine (start/pause/tick/use-time all unchanged); the ensō ring the app already grew (v3.63) becomes the timer's centre of gravity.
- **The ensō is the timer.** Two stacked SVG arcs (faint track + `--enso` arc), 236px, breathing via `sc-breathe` (5.5s); the arc closes as the steep runs (`stroke-dashoffset` off `focusProgress`). Amber on the dark-green box in light theme, ink-jade on the light-green box in dark — the one deliberate inversion so the ring always keeps contrast (`--jade-deep` box, `--porcelain` as the on-box foreground).
- **Steeps live in the brew-guide pills — no separate dot row.** `scheduleStripHTML` now renders the schedule as tappable pills (`steep N / Ns`); tapping one (`d_setActiveSteep`) sets the ring's target + the "of Ns · steep N" sub-label + the active pill (amber, both themes). The old `dotsRow` header is gone.
- **Focus mode is a real place.** `sessionFocusHTML` is rebuilt into a breath-led full-screen state (always dark `#100F0B`): a radial amber glow, the steeps as a **mala** down the right edge (active dot tracks the steep), a breathing ring (`sc-halo` pulse + `sc-breathe-slow` + dimmed `sc-digit`) with a Shippori "breathe out" cue, footer "tap to pause · swipe up to leave" (tap the ring = pause; swipe up = leave, wired in bindDynamic). **Retires the last emoji** — the 🧘 button becomes the `#i-focus-hl` glyph + "Enter focus mode".
- **Sound is opt-in.** `soundEnabled` default flipped **OFF**; the corner mute glyph (`toggleSound`) turns on a **single gentle chime** at 0:00 (the old 3-beep + heavy vibrate softened to one soft 880Hz sine + a 60ms tick).
- New committed **`fixtures/steeping-timer-test.js`** (17): `focusProgress` bounds/monotonicity (countdown + stopwatch), the dashoffset 100→0 sweep, `scheduleTimeForIndex` extrapolation, the 3s target floor. All CSS animations honour `prefers-reduced-motion`. Verified both themes via computed styles + DOM (box inversion, amber pill both themes, focus mala/halo/arc, pill-tap retargets the ring, sound glyph flips); `node --check` + all 6 committed fixtures green. Screenshots time out on the auth gate (known) — verified by computed-style/DOM. *(Kept v3.68's reversible "hide" on the guide, not the mock's lossy "turn off".)*

## v3.75 — WS5 Library: photo shelf + one status line
Deploy: `steep-teas.js` (statusLine engine + grid/row builders + viewTeas rebuild + density persistence), `styles.css` (WS5 shelf/density/chip/placeholder classes), `index.html` (i-grid-hl/i-rows-hl/i-caret-hl symbols), `steep-core.js` (APP_VERSION + WHATS_NEW), `service-worker.js` (v85), `fixtures/status-line-test.js` (**new committed suite**), `.gitignore` (track it). No SQL.
Third of the R2 design pass. The tea library becomes a **photo shelf** answering one question — *what do I have, and what needs me* — with **one status line, same slot + weight on every card; only the words + tone change by type**.
- **`statusLine(tea)` → `{text, tone}`** (steep-teas.js) — the core branching logic, `tone ∈ {low·freshness·plenty·ages}`: genuinely low (in stock, under `lowStockG`) → clay + leaf "running low" and **sorts to the top** (`shelfSort`); white/pu'er → jade "ages well/gracefully" (age is a feature, no clock); delicate green/yellow with a near harvest window → ink-soft "best within N wks", else jade "fresh, plenty"; oolong/black/other → jade "plenty". Grounded in `freshnessWeeksLeft` (reuses `harvestYear`/`harvestSeason`); never free text. New committed **`fixtures/status-line-test.js`** (37 checks over the real 14 teas + synthetic window controls) — asserts each tone fires for the right type/amount, real data yields exactly 2 running low, low sorts first.
- **grid ⇄ rows density toggle** — a segmented control (persisted device-local like theme, `tealog_teaDensity`); grid = 2-col photo cards, rows = compact list with 50px thumbnails + a trailing caret.
- **Photo fallbacks** are CSS, not images: a type-tinted `repeating-linear-gradient` stripe for green/oolong/black/yellow, a Shippori kanji plate — 白 (white) / 餅 (pu'er) — for those two. Real teas show the user's own photo.
- **Ratings leave the card (reconciliation #4)** — the shelf no longer renders stars; they stay on tea detail (removal, not new work). **Filter chips** (All · types-you-own · Low · Favs) replace the old sort/vendor **dropdowns** on the shelf (vendor rename stays under "Edit vendors"). Count line reads "N teas · M running low".
- **Design-conflict call (flagged):** the WS5 mock renders oolong as "plenty" while the README prose grouped oolong under "ages" — resolved toward the mock + the app's existing `freshnessClass` (which never calls oolong 'ages'), so the ages bucket is white + pu'er only. Favourites still get a quiet leaf on the card (keeps issue #11 met, a small addition beyond the mock). Verified both themes × both densities via computed styles + DOM (tones exact, running-low-first, kanji/stripe fallbacks, no card stars); console clean; `node --check` + all 5 committed fixtures green. Screenshots time out on the auth gate (known) — verified by computed-style/DOM.

## v3.74 — WS2 Home: greeting-led, glance-only
Deploy: `steep-dashboard.js` (card registry surfaces/order + greeting reskin + favourites/running-low reskin + new `week` card), `styles.css` (`--greeting-eye`/`--greeting-body` tokens both themes + `.greeting-*`/`.fav-row`/`.week-*` classes), `steep-core.js` (APP_VERSION + WHATS_NEW), `service-worker.js` (v84), `fixtures/greeting-v4-test.js` (extractor + well-formed-card assertion re-pointed at the reskinned markup). No SQL.
Second of the R2 design pass. Home becomes **glanceable ritual state, not a dashboard** — the greeting leads, and reflection moves to Insights. Drops into the WS6 shell (no header/log-button rebuild — WS6 owns those).
- **Greeting is the hero (reconciliation #2 — reskin, not rebuild).** The existing `greetingCardHTML` engine is untouched — buckets, predicted-vs-actual ack, variety guard, habit/rediscovery lines, all committed greeting-v4 coverage stay. Only the `card()` wrapper was reskinned: a mono eyebrow (`weekday + time-of-day`, e.g. "Friday evening" — weekday forced to English so this UI chrome never renders a locale-mixed "Freitag evening"; user input stays as typed) over a full-voice Shippori 700 32px headline, then the engine's line as the body. New `.greeting-card`/`.greeting-eyebrow`/`.greeting-head`/`.greeting-body` classes + `--greeting-eye`/`--greeting-body` tokens.
- **The six-tile stat grid is gone from Home.** `DASH_SURFACE` moves `totals` (all-time grid), `clock` (the "when you brew" chart), `cost`, and `recent` to **Insights** — relocated, not deleted, so they stay editable/hideable and no data or view is stranded. Home's default cards are now **greeting · running low · favourites · one number**.
- **One number that earns Home:** a new `week` card — sessions since the start of this week (Monday-anchored) — in Shippori jade, the sole figure Home carries.
- **Reskins:** favourites drops from photo tea-cards to a quiet leaf + name list under a mono "Favourites" eyebrow; running-low rows show the leaf on every row with the amount + honest `~` estimate in **clay** (the old red/amber urgency colour goes — calmer, per the mock).
- The "Edit layout" affordance already lived in `renderDashboard` (the mock's full-width "+ Log session" button is superseded by WS6's bottom-bar Log — not re-added). Verified in both themes at 390px via computed styles + DOM (greeting/week/favourites tokens exact; totals/clock/cost/recent confirmed on Insights, absent from Home); console clean; `node --check` + all 4 committed fixtures green. *(Screenshots time out on this auth-gated build, as noted in prior deploys — verification is computed-style + DOM, the reliable path here.)*

## v3.73 — WS6 navigation shell: bottom tab bar + avatar hub
Deploy: `index.html` (5 new bottom-bar icon symbols in the `<defs>` sprite), `styles.css` (`--nav-active`/`--nav-inactive` tokens both themes + nav/hub/recede CSS; `#app` bottom pad 80→92px), `steep-core.js` (header rewrite in `render()`, new `bottomNavHTML`/`navRecedeHTML`/`hubSheetHTML`/`hubIdentity`/`toggleHub`/`closeHub`/`hubGo`/`restoreNav`; `hubOpen`/`navRestored` state; APP_VERSION + WHATS_NEW), `steep-sessions.js` (reset `navRestored` at `beginSteeping`), `service-worker.js` (v83). No SQL.
First of the **Round-2 design pass** (six locked workstreams; build order WS6→WS2→WS5→WS3→WS1→WS4). WS6 is the shell the rest live in, so it lands first — it supersedes the top tab strip + header icons still drawn in the WS2/WS5 mocks, avoiding building header nav twice.
- **Header shrinks to wordmark + avatar.** The five header icons (friends/shopping/passport/achievements/settings) and the top tab strip and the wide "Log session" button all leave the header. The avatar (jade-pale circle, initial from the social profile or the auth email's local part via `hubIdentity`) opens the hub.
- **Bottom tab bar (`bottomNavHTML`), identical on every content screen:** Home · Teas · **[Log raised]** · Sessions · Insights. Active tab is derived from `state.view` (no parallel nav state); Log is the raised centre action (`quickLogSession`), not a persistent tab. Colours: active `--nav-active` (`#3F5E42`/`#8FBE83`), inactive `--nav-inactive`, Log circle `--jade` with a `--porcelain` glyph — verified in both themes.
- **Hub bottom sheet (`hubSheetHTML`):** identity row + Friends · Shopping list · Passport · **Achievements (gated)** · Settings — same routes as the old header icons, new entry point. The Achievements row is gated on `ACHIEVEMENTS_ENABLED` (false since v3.72), so this does **not** reintroduce the entry point the app just removed. Scrim/tap-outside dismisses.
- **Steeping recede (`navRecedeHTML` + `navRestored`):** while a steep is running, the bar collapses to a "swipe up for navigation" handle so the ritual owns the screen; a tap or swipe-up (`restoreNav`) brings the full bar back. `navRestored` resets at each `beginSteeping`, so every fresh steep recedes again. Nav is *there, not gone*.
- New tokens reuse the palette where a pair already existed (Log circle = `--jade`, glyph = `--porcelain`); only the active-tab/avatar and inactive-tab pairs are new. Verified in the browser (both themes, 390px): shell renders, old top-nav gone, hub gated correctly, recede+restore works, console clean; `node --check` clean on all touched JS.

## v3.72 — hide achievements app-wide (issue #6)
Deploy: `steep-core.js` (constant + default + header/route gates, APP_VERSION, WHATS_NEW), `steep-settings.js` (Settings section gate), `steep-dashboard.js` (confetti gate), `service-worker.js` (v82). No SQL.
Last item of the cleanup tail (ROADMAP-v4 Pillar F). Closes issue #6. The 8-bit achievement system was scrapped and a redesign is TBD, so the surfaces go dormant for everyone rather than lingering half-used.
- **One switch:** `ACHIEVEMENTS_ENABLED = false` (steep-core.js) gates every surface **regardless of any stored `showAchievements`/`quietMode`** — so it's off for everyone, including users who'd toggled it on. `showAchievements` default also flipped to `false` for new installs.
- **Gated surfaces:** the header 🏆 button (`ACHIEVEMENTS_ENABLED && showAchievements`), the `achievements` route (`viewAchievements` unreachable), the whole "Calm & achievements" Settings section (both rows — Quiet mode + Show achievements — vanish; `quietMode` only ever affected achievements/confetti, so nothing else is stranded), and the unlock **confetti/toast** (`celebrateAchievements` no longer fires).
- **Code kept intact** for the future redesign: `ACHIEVEMENTS`, `computeAchievements`, `viewAchievements`, `syncAchievements`. `syncAchievements` still runs its `seenAchievements` bookkeeping (only the celebration is gated), so a future re-enable won't dump a burst of old unlocks. Flip the one constant to `true` to revive.
- No user data stranded (achievements are derived, not entered). Verified in the browser with `showAchievements:true` forced on: no header button, no Settings section, no confetti. `node --check` clean; all committed fixtures green.

## v3.71 — greeting v4 follow-up: copy polish + committed v3.67 coverage
Deploy: `steep-dashboard.js` (one greeting line reworded), `steep-core.js` (APP_VERSION), `service-worker.js` (v81), `fixtures/greeting-v4-test.js` (absorbed the durable v3.67 cases). No SQL. `WHATS_NEW` unchanged — the greeting feature is still the freshest user-facing line; this polish is invisible.
- **Copy:** the more-than-usual pool's `"…the leaves are spoiled today."` → `"…well looked-after today."` — "spoiled" reads as *gone off* in a tea context even though *pampered* was intended (flagged at the v3.70 pause).
- **Test coverage:** the pre-v4 greeting invariants lived only in a **local, never-committed** `greeting-test.js`, which v3.70 correctly turned stale (expanded pools + the rediscovery branch break its exact-pool "every line" sweeps — those are intended changes, not regressions). Absorbed the still-valid v3.67/v3.55 cases into the committed suite: **predicted-vs-actual ack** (took-predicted vs warm-surprise register), **same-day variety guard** (+ all-same-type rest fallback), and **window-aware redirect** (tomorrow-morning + determinism + the <5-session signal gate). `greeting-v4-test.js` now 47 checks with the real-CSV export present, 36 on a bare checkout (the grounding block skips without the private CSVs).
- Issues #4 + #5 closed against v3.70 with changelog-linking comments.

## v3.70 — greeting v4, habit-aware (issues #4 + #5)
Deploy: `steep-dashboard.js` (greeting engine), `steep-core.js` (APP_VERSION + WHATS_NEW), `service-worker.js` (v80), `fixtures/greeting-v4-test.js` (**new committed suite**), `.gitignore` (track it). No SQL.
Fourth of the cleanup tail (ROADMAP-v4 Pillar F). Closes issues #4 + #5. Copy pools are Niklas-strikable at the pause.
- **Zero-session evening (issue #4).** When history exists, nothing's logged today, and the user's brewing windows have passed unused (evening/night aren't windows they brew in), the card shows a **guilt-free, playful** line — the tea/kettle/shelf is the character, never the user's absence ("The gaiwan enjoyed the day off."). HARD RULES enforced: evening-only, self-limiting (a new day resets `todayKey`, so it's gone by morning), **never references counts or consecutive days**, no sad-emoji register. An evening *drinker* still gets a normal suggestion (evening is active for them). Deliberately overrides issue #4's raw "no time for tea today?" wording — the triage addendum (2026-07-10) decided guilt-free.
- **More-than-usual day (issue #4).** `d_typicalPerDay(todayKey)` computes the user's typical sessions/day from history **excluding today** (needs a 5-distinct-day signal); when today beats it (and ≥2), the session-aware ack becomes a celebratory, count-aware line ("Third pour today — a proper tea day.") — never nagging for more.
- **Rediscovery (issue #5).** On a deterministic ~1-in-4 days (`d_hash(todayKey+'|shelf') % REDISCOVERY_ODDS === 0`), the day's pick becomes the most-neglected in-stock tea — never brewed, or quiet ≥ `REDISCOVERY_WEEKS` (ship 3) — in its own "remember this?" register (weeks-aware). `d_rediscoveryPick` honours the brewed-today + variety-guard exclusions; the seed is date-only so the choice is stable across the day.
- Expanded every normal greeting pool by 2–3 lines (Niklas: "would love lots of instances… so it's not boring").
- **New tunables** (all in steep-dashboard.js): `REDISCOVERY_WEEKS`, `REDISCOVERY_ODDS`. Verified in the Node vm sandbox — `fixtures/greeting-v4-test.js` (35 checks) covers evening-fires-once/evening-only/no-counts, threshold math + signal gate, rediscovery determinism + ≥N-weeks predicate, tap-targets intact, and renders over the real CSV export at every bucket.

## v3.69 — the update banner now says what changed
Deploy: `steep-core.js` (APP_VERSION + new `WHATS_NEW` const), `steep-boot.js` (banner render), `service-worker.js` (v79). No SQL.
Third of the cleanup tail (ROADMAP-v4 Pillar F) — a small rider.
- The v3.27 "new version" banner showed only "A new version of SlowCup is ready." — no hint of what the update contained.
- Adds a `WHATS_NEW` constant beside `APP_VERSION` (one human sentence), rendered as a second quiet line under the headline in `showUpdateBanner` (steep-boot.js). One line — no changelog list, no link-out. A `typeof` guard keeps the banner valid if a client is still on a stale cached `steep-core.js` without the const.
- This deploy's copy is self-referential: "Updates now tell you what changed — like this." — it demonstrates the feature it announces.
- Deploy ritual: `WHATS_NEW` now joins the version bumps (new step 2c in CLAUDE.md) — bump it each deploy alongside `CACHE_NAME` and `APP_VERSION`.

## v3.68 — in-session brew guide: reversible "hide", not a lossy "turn off" (issue #1)
Deploy: `steep-sessions.js`, `steep-core.js` (APP_VERSION), `service-worker.js` (v78). No SQL.
Second of the cleanup tail (ROADMAP-v4 Pillar F). Fixes the reported "in-session turn off link gives
weird feedback."
- **The bug:** mid-steeping, the schedule strip's "turn off" link called `d_setBrewMode('off')`, which
  reset `timeShift` to 0 (silently discarding the user's accumulated "+Xs vs guide" nudge) and set
  `brewMode='off'` — but `d.schedule` was never nulled, so the card stayed on screen. You tapped
  "turn off," nothing turned off, and your nudge quietly vanished.
- **The fix:** the link is now **"hide"** (`d_hideStrip()`), a purely visual, reversible collapse.
  It leaves `brewMode`, `d.schedule`, and `timeShift` untouched and sets `d.scheduleHidden=true`;
  `scheduleStripHTML` renders a one-line "Brew guide · hidden · show" ghost row (`d_showStrip()`
  restores it). The "How was that pour?" nudge row hides with it and returns intact — the carried
  `timeShift` survives the round-trip. `scheduleHidden` resets to false at `beginSteeping`.
- The setup preview's **Off** segment (`d_setBrewMode('off')`) is unchanged — that's a legitimate
  pre-steeping choice; only the in-session link changed.
- `node --check` clean; browser-verified both themes (hide → ghost row → show restores strip + nudge
  with the same `+Xs` carry).
- **Issue #1 is fixed** — close it with a comment linking this entry (needs auth; Niklas via web UI).

## v3.67 — greeting v3, session-aware (issue #2)
Deploy: `steep-dashboard.js`, `steep-core.js` (APP_VERSION), `service-worker.js` (v77). No SQL.
First of the renumbered cleanup tail (ROADMAP-v4 Pillar F).
- **The card now reacts to a session logged in the current bucket** instead of nudging another
  same-bucket brew (the reported bug: "I logged the predicted tea and it suggested another green").
  `greetingCardHTML` gains a session-aware branch (steep-dashboard.js): if there's a session in the
  current time-of-day bucket today, it **acknowledges** the ritual, then either **suggests forward**
  for a later active window or lets the card **rest** — never a third-cup nudge.
- **Predicted-vs-actual acknowledgment** — the day's pick is recomputable (same seed), so the card
  knows what it suggested. Took the predicted tea → "Good choice — the {name} it is." register; took
  something else → warm surprise, never correction: "The {name} instead — didn't see that coming."
  Small pools each via `d_copyPick` (now takes a `salt` so the ack + tail draw independently yet stay
  one-voice-per-day). It never scores the prediction ("I was right/wrong" is out).
- **Same-day type-variety guard** (`VARIETY_GUARD_SAME_DAY`, on) — a forward suggestion for later
  *today* won't repeat the just-logged type ("not two greens in a row in the morning"). Implemented as
  a scoring exclusion in the new shared `d_scorePick(target, todayKey, excludeIds, excludeType)`; if
  every candidate shares the type, the card **rests** rather than break the rule loudly.
- The no-session branch (v3.55 window-aware redirect + v3.61 copy pools) is unchanged; the greeting h2
  stays truthful to now; brewed-today is still excluded in other buckets (normal branch).
- Validated `fixtures/greeting-test.js` (local, now 44): predicted-taken vs surprise copy, forward
  vs rest, the variety guard + all-same-type fallback, cross-bucket brewed-today exclusion, and
  determinism; normal/redirect sweeps moved to a sessionless mocked day so they exercise the intended
  branch. Browser-verified both themes (jade-pale card, jade links, warm copy; no console errors).
- **Issue #2 is fixed** — close it with a comment linking this entry (needs auth; Niklas via web UI).

## docs — reconcile v4 roadmap into the repo
Deploy: **new** `ROADMAP-v4.md`, `ROADMAP-v3-next.md` (superseded banner), `CLAUDE.md` (doc pointers).
No app change, no SQL, no cache/APP_VERSION bump.
- **`ROADMAP-v4.md`** is now the active forward roadmap ("ready for strangers", signed off 2026-07-10) —
  reconciled from the claude.ai strawman + `TASK-issues-triage-addendum.md`. Pillars A–F: brew-advice
  phase 2 (+ the new `japanese`/senchadō method), launch infra, first-run experience, design round 2 (+
  flavor experience), the smarter-over-time backlog, and the **cleanup tail with all 5 issues triaged**.
  Pillar F carries the sequenced tail: v3.66 ✓ · **v3.67** greeting v3 session-aware (issue #2, extended:
  predicted-vs-actual + same-day type-variety guard) · **v3.68** in-session turn-off (issue #1) · **v3.69**
  what's-new banner · **v3.70** greeting v4 habit-aware (issues #4+#5; zero-session line decided guilt-free/
  playful). Issue #3 = workflow question, close-now-no-build (needs auth — Niklas via web UI or a token).
- `ROADMAP-v3-next.md` keeps the Shipped log, frozen/parked specs, and the launch checklist; CLAUDE.md's
  doc list now points at v4 first.

## v3.66 — feed pagination + social error becomes an inline notice
Deploy: `steep-data.js`, `steep-social.js`, `steep-core.js` (socialErr + APP_VERSION + state), `styles.css`,
`service-worker.js` (v76). No SQL. Resumes the SlowCup batch tail after the design rework.
- **Feed pagination** (`getFeed(limit=50, offset=0)`, steep-data.js) — switched `.limit()` → `.range(offset,
  offset+limit-1)` with a secondary `.order('id')` so a `session_date` tie can't reshuffle rows across a page
  boundary. Returns `hasMore` (page came back full). `loadMoreFeed()` (steep-social.js) fetches the next page
  and **appends**, de-duping by session id so a row that shifted across the boundary (a session inserted up
  top between fetches) can't render twice. Manual, quiet **"Load more"** ghost button under the feed — no
  infinite scroll; hidden when `hasMore` is false. Page size stays the old cap (50). Personal-stats scoping
  (`loadKey` `user_id` filter) is untouched — the feed still uses `getFeed()` separately.
- **`socialErr` → sticky inline notice** (steep-core.js) — the last `alert()` in the app is gone. The same
  message branches (missing tables / RLS policy / offline / generic) now set `state.social.err` and render a
  dismissible `.social-notice` at the top of the Friends view (red hairline border, porcelain-dim, themes in
  both). These are multi-sentence setup diagnostics, so a toast would be wrong. Cleared on the next
  follow/unfollow attempt or via the × (`dismissSocialErr`). Falls back to a long toast if `state` isn't ready.
- Browser-verified (both themes): the notice renders + themes + dismisses, RLS/missing-table branches pick
  the right copy, "Load more" shows only when `hasMore` and wires `loadMoreFeed`, de-dupe append holds. No
  console errors (the `[Steep] follow failed` lines were the test harness exercising `socialErr`). `node
  --check` clean on all touched files.

## docs — DESIGN.md refreshed to post-round-1 reality
Deploy: `DESIGN.md` only. No app change, no SQL, no cache/APP_VERSION bump. Prep for design round 2.
- Version stamp → v3.65; noted design round 1 complete (WS3 language · WS1 Wrapped · WS4 landing · WS2 Insights).
- Retired the last **Fraunces** reference (the loaded-weights line → Shippori Mincho 500/600/700/800).
- **Emoji-ban** made explicit, with the one known leftover recorded: the 🧘 on the steeping Focus-mode
  button (`steep-sessions.js`) — slated for a hairline replacement, not yet swept.
- **Accent placement rules as shipped** — leaf (favourite + "most reached-for" note), hanko (Wrapped "to
  keep" + Insights "highest note"), ensō (timer/focus ring + faint hero backdrop on Wrapped cover & landing
  hero), seigaiha (reserved: empty states, Wrapped closing card, landing CTA wash).
- **Current surfaces** updated: Insights is the reflective room (observation register, guarded by the
  fixture); Wrapped is the swipeable seasonal sequence; added `landing.html` as an off-app surface.

## v3.65 — WS2 Insights overhaul (the reflective room)
Deploy: `styles.css`, `steep-insights.js`, `steep-dashboard.js`, `steep-core.js` (APP_VERSION),
`service-worker.js` (v75). No SQL. Last of four design workstreams (WS3 → WS1 → WS4 → **WS2**) — the
design rework is complete.
- **Insights is now a curated reflective room**, not a flat stack of same-weight cards. `viewInsights()`
  leads with the hero and drops its old page title. The five old insights cards (recap, insights, types,
  most-brewed/top-rated) are replaced by six ordered sections built in `dashCardsInsights` and rendered
  through the existing dashLayout registry (so Home stays editable and cross-tab moves still work). Since
  `renderDashboard` concatenates each card's own HTML, the run composes into one room:
  - **Hero observation** (jade-pale card, the ONE thing) — mono eyebrow that widens honestly by window
    ("This week, mostly" → "Lately, mostly" → "Mostly" as data thins), a Shippori observation
    ("Green, and mornings."), a 12-bar time-of-day rhythm (the brewing clock, folded in), and one
    supporting line ("9 of your 9 steeps came in the morning.").
  - **Cadence reading** — a Shippori sentence over an 8-week sessions sparkline (jade, no axes).
  - **Type mix** — one slim stacked bar in the fixed `.dot-*` type colors + a mono legend.
  - **Steep shape** — an ascending amber polyline of average steep duration by index + a ledger caption
    ("35s · 45s · 58s").
  - **Two quiet notes** (not a leaderboard) — leaf = most reached-for, hanko = highest note.
  - **Wrapped teaser** — a quiet deep-jade strip into the WS1 season sequence.
  Sections are separated by **hairline top-borders**, not boxed cards. New `.ins-*` classes in styles.css.
- **Register: observations, not KPIs** — every headline is a sentence; the old "This month vs last ↑ 14
  vs 12" arrow row is gone. No up/down arrows, no vs-last-week %, no targets anywhere in the room.
- **Retired:** the recap stats grid + week/month/all-time toggle (superseded by the hero + reading; the
  Home totals card still carries the raw all-time numbers). `recapHTML`/`computeRecap`/`periodRange`/
  `setRecapPeriod`/`insightsHTML`/`wrappedTeaser` removed. Saved dashLayouts self-heal — old insights
  card ids drop out via the existing unknown-id filter, new ids append.
- Validated `fixtures/insights-room-test.js` (committed, data-free, 33): the brand guardrail (no arrow/%/
  vs in the hero + four viz observations), graceful degradation (each section drops to '' when its data
  is missing), and structure (hero top-type + time-of-day, type widths sum ~100%, ascending steep caption,
  leaf+hanko notes). Browser-verified BOTH themes (computed styles + screenshots): hero jade-pale/ink,
  jade bars, hairline borders, fixed type colors, amber steep line, deep-jade teaser with light text in
  dark; no console errors; no horizontal scroll.

## WS4 — slowcup.app landing page (static; NOT part of the PWA)
Deploy: **new** `landing.html` + `landing-assets/{app-home,app-tea-detail,app-sessions}.png`. No SQL.
**No `CACHE_NAME` / `APP_VERSION` bump and no `FILES_TO_CACHE` change on purpose** — this touches zero
PWA files, so invalidating every tester's app cache for a page the app never loads would be wrong. Third
of four design workstreams (WS3 → WS1 → **WS4** → WS2).
- **New standalone marketing page** (`landing.html`) — a single self-contained static file: inline
  `<style>` + inline `<svg><defs>` sprite (logo · fav-leaf · ensō · i-share-hl · seigaiha), Google Fonts
  link (Shippori Mincho / Inter / IBM Plex Mono), **no JS, no cookies, no analytics**. Theme follows the OS
  via `@media (prefers-color-scheme: dark)` overriding the `:root` token set (the prototype's JS light/dark
  toggle was dropped per the handoff). All CTAs are `mailto:slowcupapp@gmail.com?subject=SlowCup%20invite%20request`.
- **Sections** (single column, centered, text capped ~720px): nav (pixel logo + "request an invite") ·
  hero ("A TEA LOG FOR THE RITUAL" eyebrow → Shippori "The calm tea log." at `clamp(44px,11vw,64px)` with
  a ~10% amber ensō behind → promise subline → jade **Request an invite** → "private beta" micro) · three
  dark-bezel device screenshots (middle raised 24px, zeroed when they stack) · three philosophy beats
  (leaf/ensō/share-icon chips) · jade-deep CTA panel with faint seigaiha + amber button + mono email ·
  footer ("a static page · no cookies, no tracking, nothing to accept").
- **Screenshots are placeholders from the handoff bundle** (`landing-assets/`, flagged in an HTML comment):
  they predate WS3/WS1 and `app-tea-detail.png` still shows the old **"Steep"** wordmark (pre-v3.59). They
  MUST be reshot on the current build before slowcup.app points here.
- **Staging note:** placed as `landing.html` at the repo root (reachable at
  `tosinik.github.io/steep-tea-log/landing.html`) — not linked from the app. The root/`index.html` split for
  the actual slowcup.app domain is part of the deferred domain migration.
- Browser-verified both themes (light via CSSOM tokens, dark visually), desktop + mobile 375px (single
  column, devices wrap, h1 clamps to 44px, **no horizontal scroll**), all three screenshots load, no console
  errors.

## v3.64 — WS1 SlowCup Wrapped (swipeable story cards)
Deploy: `styles.css`, `steep-insights.js`, `steep-core.js` (APP_VERSION + carousel wiring),
`service-worker.js` (v74). No SQL. Second of four design workstreams (WS3 → **WS1** → WS4 → WS2).
- **Wrapped is now a horizontal scroll-snap sequence of full-width story cards** (was a single static
  card). `viewWrapped()` (steep-insights.js) builds up to 8 cards — cover · sessions · time at the
  table · companion · rhythm · new this season · standout · kept/share — as `.wrap-card` panels in a
  `.wrap-track` (`overflow-x:auto; scroll-snap-type:x mandatory`; each card `flex:0 0 100%;
  scroll-snap-align:center`). **Seasonal wash**: cards alternate jade-deep / amber fields with
  porcelain breathers, driven by dedicated `--wc-*` tokens in both theme blocks (dark fields never go
  full-bright). **Catalogue numbering** (№ 00…) + a **hanko-sealed** standout plate; the cover carries
  a faint ensō, the closing card a seigaiha wash. Reuses the WS3 sprite (`#fav-leaf`, `#enso`,
  `#hanko`, `#seigaiha`).
- **Graceful degradation** — `wrappedKinds()` drops any card whose stat is missing (no timing → the
  time card falls back to cold-brew count, then drops if neither; no top type / no discoveries / no
  rating each drop their card) and the numbering **re-flows** so a one-tea, few-session season still
  reads as a contiguous run. Cover · sessions · kept are always present.
- **Only JS besides share**: dot indicators track the scroll position (`bindDynamic()` in steep-core:
  `Math.round(scrollLeft/clientWidth)` → active dot, rAF-throttled) and are tappable (`wrapGo(i)`,
  respects `prefers-reduced-motion`). Kept the **share-as-text** action (`shareWrapped` unchanged path)
  — `wrappedShareText` reworded to the agreed format (`SlowCup Wrapped · Summer 2026 / 14 sessions ·
  43 infusions · 12 teas (5 new) / Companion: … ×6 / Standout: … ★4.5 / Quietly, that's a season.`).
  Kept the **empty state** ("Your {season} is just beginning") and the **"SlowCup Wrapped"** name.
- No inline styles added beyond the one data-driven bar height (matches the existing `.typebar-fill`
  pattern); everything else is `.wrap-*` classes in `styles.css`.
- Validated `fixtures/wrapped-cards-test.js` (committed, data-free, 22 assertions): degrade drops the
  right cards, catalogue numbering re-flows with no gaps, footer denominator = surviving count,
  cold-brew fallback fires, discoveries overflow (+N), standout escapes + seals with the hanko, share
  text format. Browser-verified both themes via injected `computeWrapped()` sample (screenshots
  time out on the auth gate): 8 cards / 8 dots, fields + fonts + accents resolve per theme, active dot
  stays amber (`--wc-enso`) in dark, dot-tracking math 0→0/3→3/7→7, degraded season → 4 contiguous
  cards, no console errors.

## v3.63 — WS3 design language (Shippori Mincho · hairline icons · accent vocabulary)
Deploy: `index.html`, `styles.css`, `steep-core.js`, `steep-dashboard.js`, `steep-insights.js`,
`steep-passport.js`, `steep-sessions.js`, `steep-shopping.js`, `steep-social.js`, `steep-teas.js`,
`steep-data.js`, `service-worker.js` (v73). No SQL. First of four design workstreams (WS3 → WS1 → WS4 → WS2).
- **Display font → Shippori Mincho** (replaces Fraunces). New `--font-display` token in both theme
  blocks; `h1,h2,h3,.display` render at weight 700; the wordmark bumped to 700. All inline
  `'Fraunces',serif` across the JS views swept to `var(--font-display)` (zero Fraunces refs remain).
  Google-Fonts `<link>` swapped (`Shippori+Mincho:wght@500;600;700;800`). Inter/IBM Plex Mono unchanged.
- **Header emoji → hairline stroke icons.** A hidden `<svg><defs>` sprite in `index.html` (sibling of
  `#app`, survives re-renders) holds `i-{friends,shopping,world,achievements,settings,share,edit,camera}-hl`
  + accent marks. New `icon(id,px,cls)` helper (steep-core) emits `<use>`d SVGs; topbar 👥🛒🌍🏆⚙ and the
  "Edit layout" pencil now use it. Header-icon symbols omit `stroke-width` so `.hl` sets it via inherited
  CSS — **1.7 light / 1.9 dark** so thin strokes don't go faint; `.icon-btn.active svg` goes `--white`.
- **Favourite mark → tea leaf** (`favLeaf()`, `.i-fav` jade). Replaces ♥/★ on tea cards, running-low
  rows, the tea-detail pill (now jade-family), the favourites filter chip, and shopping-list rows.
- **Ensō ring on the steep timer.** `.timer-display` is now wrapped in a `.timer-ring` with an inline
  ensō `<path id="ensoArc">`; the arc fills via `stroke-dashoffset` (`pathLength=100`, offset
  `100*(1-focusProgress)`) updated each tick in `updateTimerDisplayOnly`, smooth `.9s` transition
  (respects `prefers-reduced-motion`). New `--enso` token: amber-bright `#E3A15C` on the light-theme
  dark box, dark-jade `#2A4130` on the dark-theme light-green box.
- **Hanko + seigaiha** defs added to the sprite (used by WS1/WS2); hanko fill is `var(--red)` so it
  themes (fixed-red in the prototype). Pixel-teapot logo (`steepLogoSVG`) unchanged — it stays the brand.
- Verified in-browser (both themes): Shippori loads + applies at weight 700; all sprite symbols resolve
  and `<use>` icons paint; ensō dashoffset = 50 at 50% progress; `--enso` resolves per theme; no console
  errors. `node --check` clean on all touched files.

## v3.62 — freshness cues + sparkline rider + night-copy patch
Deploy: `steep-teas.js`, `steep-dashboard.js`, `steep-core.js` (APP_VERSION), `service-worker.js` (v72). No SQL.
- **Freshness cues** (steep-teas.js) — one soft, italic, observational line under the Harvest field on
  tea detail. **Not on Home, not in the picker, no badge/alarm.** Requires a VALID year (1980..now+1;
  rejects "-", blank, out-of-range) to reason about age — season is optional decoration. Direction by
  style: fresh greens (+ shincha/sencha/gyokuro/first-flush/longjing keywords) → "…is at its best
  young"; whites & pu-erh (+ sheng/aged keywords) → "this style deepens with age"; every other style
  stays silent. On the real export exactly two fire — "Spring 2026 harvest — shincha is at its best
  young." and "2021 harvest — this style deepens with age." No raw user text is rendered (numeric
  year, whitelisted season + style word).
- **Sparkline rider** (steep-teas.js) — where `inventorySparkline` draws nothing *only* because a tea
  has no `purchaseDate` (but has a bought amount), a quiet "Add a purchase date to see the stock
  curve" link to Edit. Silent when a date exists or there's no bought amount.
- **Night-copy patch** (steep-dashboard.js) — the active-with-history line "How do you feel about the
  {name} this {bucket}?" now uses the BUCKET_WHEN form, so a night-active user reads "…tonight?"
  instead of the clunky "…this late-night?" (Niklas-approved to ride here).
- Validated: `fixtures/freshness-test.js` (local, 11) — exactly the two live cues with exact wording,
  garbage/neutral/season-only all silent; `fixtures/greeting-test.js` (local, now 32) gains a
  night-active sweep asserting "this late-night" never renders and "tonight?" does. Browser-verified
  the full tea-detail render (cue + hint present, no console errors).

## v3.61 — greeting copy variety + APP_VERSION constant
Deploy: `steep-dashboard.js`, `steep-core.js`, `steep-settings.js`, `service-worker.js` (v71). No SQL.
- **Greeting copy variety** (steep-dashboard.js) — each greeting branch now draws from a small pool
  instead of one fixed line. `d_copyPick(pool, todayKey)` picks via `d_hash(todayKey+'|copy') %
  pool.length` — **one voice per calendar day**, seeded independently of the tea pick so it never
  reshuffles on re-render. Pools (Niklas-approved 2026-07-09): active-with-history (4), active-no-
  history (3), redirected-later-today (3), redirected-tomorrow (3), night (3), empty-state (2).
  Voice rules unchanged (warm, no exclamation/imperatives/guilt); the tea name stays the tap-target.
  Note: the active-with-history line "…this {bucket}?" renders "this late-night" for a night-active
  user (BUCKET_NOUN is 'late-night') — flagged for Niklas at the pause.
- **`APP_VERSION` constant** (steep-core.js, = 'v3.61') — the single source of truth for the user-
  visible version. Wired into the feedback mailto subject (was hardcoded 'v3.60') and a quiet
  "SlowCup v3.61" label in the Settings footer. **Added to the deploy ritual** (CLAUDE.md step 2b):
  bump it every deploy alongside CACHE_NAME.
- Extended `fixtures/greeting-test.js` (local) — now 30 assertions: per-branch pool membership across
  a 20-day sweep, ≥2 distinct lines per branch (variety), exactly one tea-name link per line, and
  same-day determinism of both the pick and the copy line. All green.

## v3.60 — error log + data health + feedback (Settings → Data)
Deploy: `steep-core.js`, `steep-settings.js`, `service-worker.js` (v70). No SQL.
- **Diagnostics log** (steep-core.js) — a device-local `tealog_errorLog` ring buffer (last 20,
  `{ts,message,source}`). `window.onerror` + `unhandledrejection` global hooks feed it, and `saveErr`
  now logs too — giving the v3.58 offline sync-failure the durable home its code comment promised.
  A logging path must never throw, so every access is wrapped. **Never surfaces proactively** — only
  viewable under Settings → Data (`errorLogHTML`, View/Clear; clear via `armConfirm`).
- **Data health** (steep-settings.js `dataHealthReport`) — on-demand, read-only, no auto-repair.
  Scans `state` for: sessions with a deleted tea, sessions with a deleted vessel, teas with negative
  stock, sessions with no steeps recorded, and possible duplicate pairs (same tea within 10 min —
  the v3.35 signature). Counts + first-8 details per finding; "everything checks out" when clean.
  **Note:** DB-orphaned steeps aren't observable client-side (the sessions load drops steeps whose
  parent session is gone), so the steep check surfaces the client-visible analog (empty sessions).
- **Send feedback** row — `mailto:slowcupapp@gmail.com`, subject "SlowCup v3.60 feedback"
  (hardcoded — no app-wide version constant exists yet; a future `APP_VERSION` could centralize it).
  No error-log auto-attach; the copy hints the log above can be copied in.
- Validated `fixtures/data-health-test.js` (local, reads the gitignored CSVs) over the real 2026-07-09
  export: **clean on all five detectors** (ZERO dup pairs, per the task ground truth); each detector fires on an injected bad
  row; negative controls hold (cold brew ≠ empty; 11 min apart ≠ dupe). Browser-verified the hooks +
  builders (ring cap 20, both global hooks capture, escaped output, no console errors).

## v3.59 — rename the app: Steep → SlowCup (user-facing brand only)
Deploy: `index.html`, `manifest.json`, `steep-core.js`, `steep-data.js`, `steep-settings.js`,
`steep-dashboard.js`, `steep-insights.js`, `steep-boot.js`, `service-worker.js` (v69). No SQL.
- **Visible product name only** — nothing structural. Repo name, GitHub Pages URL, `steep-*.js`
  file names, CSS classes, function names (`steepLogoSVG`), `tealog_*` localStorage keys, the
  `steep-tea-log-vNN` cache prefix, and Supabase are all untouched. The "steep / steeps" tea
  *terminology* (steep timer, "Steep 1", steep_order) stays — that's the verb, not the brand.
- Renamed: `index.html` `<title>` + `apple-mobile-web-app-title`; `manifest.json` `name`/`short_name`
  (fresh installs only); topbar `<h1>` + logo `aria-label` (steep-core); login screen `<h1>`
  (steep-data); backup filename `steep-tea-log-backup-…` → `slowcup-backup-…` + import toast
  (steep-settings — import still reads by *shape*, so old backups keep importing); `DASH_LABELS`
  "Steep Wrapped" → "SlowCup Wrapped" (steep-dashboard).
- **Beyond the task's audited list** (surfaced by a word-boundary grep, all user-facing brand):
  onboarding hero "Welcome to Steep" (steep-dashboard); the two Wrapped eyebrows + the Wrapped
  **share text** "· Steep" (steep-insights); the update banner "A new version of Steep is ready."
  (steep-boot); the local-data migration screen "This device has a local Steep log" (steep-data).
- Internal code comments/`[Steep]` console prefixes left as-is (not user-facing). Docs headings
  (CHANGELOG/STATE/ROADMAP) adopt the new name going forward; historical entries unchanged.

## v3.58 — finish the popup sweep (completes v3.50)
Deploy: `steep-settings.js`, `steep-core.js`, `steep-dashboard.js` (`showToast` gains a duration),
`service-worker.js` (v68). No SQL.
- **The last 8 browser popups are gone** — same conversions as v3.50 (`armConfirm` for destructive
  confirms, `showToast` for notices). No `alert()`/`confirm()`/`prompt()` remain in steep-settings.js.
- **Photo-migration** (steep-settings.js): the "no photos" and "moved N" alerts → toasts; the
  "Move N photos?" confirm → inline `armConfirm` on the button (`migratePhotosToStorage(this)` splits
  into an arm step + `doMigratePhotos()`).
- **Import** (steep-settings.js): the most destructive action (replaces ALL data) keeps its friction —
  the blocking `confirm()` becomes a **state-driven inline confirm row** in Settings → Data
  (`state.pendingImport` + `importConfirmHTML()`), still showing both counts ("Replace X teas /
  Y sessions with A / B?"), with a red "Replace all data" / "Cancel". Fires from a file-picker
  callback, so it can't use `armConfirm`'s button-in-place pattern — the row is durable in `state`.
  The invalid-file, read-error, and "Import complete" alerts → toasts.
- **Offline sync-failure** (steep-core.js `saveErr`): blocking `alert()` → a **long-lived toast**
  (~12s; it carries data-loss info). `showToast(msg, ms)` now takes an optional duration (default
  4.2s). v3.59's error log will give this failure a durable home via the global error hooks — noted
  in the code comment as the hand-off.
- Out of scope (unchanged): `socialErr` in steep-core.js keeps its `alert()` — social actions are
  online-only and it surfaces specific setup/permission diagnostics, not a calm notice.

---
## v3.57 — leaf-to-water ratio, the 3rd advice axis (brew advice v2, phase 1)
Deploy: `sql/v3_8-water-ml.sql` (**run once, first — already applied**), `steep-knowledge.js`,
`steep-core.js`, `steep-data.js`, `steep-sessions.js`, `steep-settings.js`, `service-worker.js` (v67).
SQL: `sessions.water_ml integer`, `sessions.brew_style text` (both nullable; old code ignores them).
- **The prefilled schedule now scales to how much leaf you used for the water volume** —
  `actualRatio = gramsUsed/(waterMl/100)` vs a per-method baseline; `timeFactor =
  clamp(1/ratioFactor^0.6, 0.6, 1.4)` applied to the whole schedule (curve shape preserved). A
  heavier pour shortens the times, a lighter one lengthens them. **Temp is NOT ratio-adjusted.**
- **Strict opt-in, default OFF** — Settings → Brew guidance → "Ratio adjustment" (`ratioAdjust`,
  in `DEFAULT_SETTINGS`). When off, none of the ratio path is reached and schedules are byte-identical
  to v3.56 (locked by `fixtures/ratio-test.js`).
- **Ordering:** base (guide or leaf-form) → **ratio** → feedback tuning (v3.25) → in-session timeShift
  (v3.30). `computeBrewAdvice(tea, baseOverride)` gained an optional pre-scaled base so feedback tunes
  the ratio-scaled schedule. Engine in steep-core.js: `computeSessionRatio`, `baselineRatioFor`,
  `ratioScaleSchedule`, `ratioMemoryText`, `brewMethodFor`, `bg_extractRatio`; tunables (`RATIO_K`,
  caps, `GONGFU_VESSEL_MAX_ML`, `METHOD_MISMATCH_MAX`, `LEAF_RATIO_DEFAULT`) sit next to LEAF_PROFILES.
- **Baseline order:** (a) grams+ml stated in the guide (`bg_extractRatio`, method-agnostic — "5g auf
  200ml" → 2.5) → (b) KB ratio *for the session's method* → (c) per-leaf-form default for the method.
- **Dual-method KB (steep-knowledge.js):** styles carry both methods where they differ —
  `ratioGongfu` on western-primary styles (greens 3.0, whites 4.5, yellow 3.5, puerh 5.0), `ratioWestern`
  on gongfu-primary (ball 0.8, dancong 1.0); strip/dark oolong anomaly fixed (western 1.5 + gongfu 4.5).
  **Japanese-green western values raised** to match Niklas's kyusu practice: sencha/shincha 1.8,
  kabusecha 2.0, fukamushi 1.8. Numbers agreed with Niklas 2026-07-09; documented in `knowledge/brew-guides.md`.
- **Session setup (opt-in on):** a quiet **Gongfu | Western** switch (prefilled from vessel capacity,
  `capacityMl ≤ 150 → gongfu`; flip per session) + an optional **Water (ml)** override (defaults to
  vessel capacity — absorbs the parked "partial fill" item). A ratio memory line in the guide preview:
  "Heavier pour than the baseline (4.5 vs 3.5 g/100ml) — times shortened ≈15%." The **method used is
  stored** (`brew_style`) for phase-2 learned defaults; cold brew + missing grams/water are silently
  excluded; a `METHOD_MISMATCH_MAX` (2.5) safety net holds off (and says so) rather than scale confidently-wrong.
- Mappers (`sessionFromDb`/`sessionToDb`) + both write paths carry `waterMl`/`brewStyle`.
- Validated in the Node vm sandbox over all 10 real timed sessions (`fixtures/ratio-test.js`, local, 47
  assertions): every actual→baseline→timeFactor matches the agreed dry-run; the two former −40% floors
  (Fujian White, Huang Ya) now land as gentle trims (0.89 / 0.98); opt-in-off byte-identical; ordering;
  cold-brew + missing-input exclusion; mismatch net. Roundtrip/accuracy/kb/greeting fixtures still green.

---
## v3.56 — capacity-capture precursor (brew advice v2, step 1)
Deploy: `service-worker.js` (v66), `steep-sessions.js`. No SQL.
- **Groundwork for the leaf-to-water ratio axis (v3.57):** ratio needs each vessel's `capacityMl`,
  which is nullable and sparse. This makes capacity visible and gently encouraged — never required,
  never a banner, never blocks logging (calm-first). All three vessel/session views live in
  steep-sessions.js (steep-teas.js only hosts the Teas|Vessels segment that calls `viewVessels`), so
  this is a one-file behaviour change.
- **Vessel form:** the Capacity field gains a soft hint ("— helps tune brew advice by leaf-to-water
  ratio") and an example placeholder ("e.g. 110 for a gaiwan, 200 for a kyusu"). Still optional.
- **Vessels list:** a capacity-less vessel now shows a quiet "· ml?" affordance in the value slot
  (instead of blank) that taps straight to its edit form.
- **Session setup:** when the chosen vessel has no capacity, a quiet inline "set capacity — sharpens
  brew advice" link appears under the Vessel picker (`selVes`/`capLink`). It opens that vessel's edit
  form as an overlay; the session draft persists behind it (fields write to `state.sessionDraft`
  on input) and setup reappears on save/close. Never a modal that demands capacity, never blocks the
  log — matches the `showFinLink` pattern.

---
## v3.55 — greeting card v2: respect the user's real drinking window
Deploy: `service-worker.js` (v65), `steep-dashboard.js`. No SQL.
- **The greeting no longer nudges a brew at a time the user never brews.** New active-window
  detection in `greetingCardHTML` (steep-dashboard.js): from all sessions, a time-of-day bucket
  (same 5–12 / 12–17 / 17–22 / else cutoffs as `timeOfDayBuckets`) is *active* if it holds ≥2
  sessions **or** ≥15% of the total. Requires ≥5 sessions of signal; below that, unchanged v3.54
  behaviour (too little to claim "you never brew now").
- **In an active bucket** → exactly the v3.54 behaviour (suggest for now, "your {bucket} pick").
- **In an inactive bucket** → scan the daily cycle forward (`BUCKET_CYCLE`) to the next active
  bucket and suggest FOR that window with forward-looking copy; the greeting line (h2) still tells
  the truth about now. Night (spans midnight) → "The {name} will be waiting for the morning." (no
  "tomorrow" claim); a wrap past night into next morning → "Maybe save the {name} for tomorrow
  {bucket}."; a later-today active window → "Maybe save the {name} for {this afternoon/…}."
- **Scoring targets the destination bucket** (bucketCount vs the target, not now); `brewedToday`
  exclusion applies only when the target window is still today (tomorrow's suggestion may repeat
  today's tea). Date-seeded deterministic pick unchanged.
- Copy rules unchanged: no imperative, no "!", never "you haven't logged"; tea name → `openTeaDetail`.
- Validated in the Node vm sandbox against the fresh CSVs (`fixtures/greeting-test.js`, local, now
  reading from `fixtures/`): with Niklas's real data (morning 7 / afternoon 5 active; evening 0 /
  night 0 inactive) 22:00 → forward-looking morning copy, 19:00 → "tomorrow morning", 09:00 →
  unchanged now-copy, <5 sessions → v3.54 behaviour; redirect pick deterministic; brewed-today
  excluded only in an active (today) window. 21 assertions green.

---
## v3.54 — greeting card in the old persona slot
Deploy: `service-worker.js` (v64), `steep-dashboard.js`. No SQL.
- **A calm, ritual-first greeting replaces the removed persona banner.** New `greeting` card
  (`greetingCardHTML` in steep-dashboard.js), first in `DASH_DEFAULT_ORDER`, `DASH_LABELS.greeting`,
  `DASH_SURFACE.greeting='home'` — hideable/movable like any card; old saved `dashLayout`s pick it up
  via the unknown-id append.
- **Greeting line:** four local-hour buckets matching `timeOfDayBuckets` (5–12 / 12–17 / 17–22 / else)
  → "Good morning / afternoon / evening" / "A quiet night", Fraunces, h2-sized, on a plain `var(--jade-pale)`
  card (no gradient — quieter than persona).
- **Suggestion:** one tea, **deterministic per calendar day** (date-seeded FNV-1a tie-break, no `Math.random`
  so it doesn't reshuffle on re-render). Candidates = not finished (`isTeaFinished` false) and not brewed
  today; score = sessions in the CURRENT time-of-day bucket + small rating/favorite nudges. Copy: "Maybe the
  {name}? It's been your {bucket} pick." (name → `openTeaDetail`), or a neutral "Maybe the {name} this
  {when}?" when the pick has no bucket history — never a false claim, no button, no imperative, no "!".
- **Fallbacks:** no sessions → "The kettle's patient whenever you are."; no candidate teas → greeting alone.
  Never mentions streaks, gaps, or "you haven't logged" — calm-first, zero guilt.
- The task's optional seasonal word ("a warm July evening") is deliberately omitted — warm/cold is
  hemisphere-dependent and we don't know the user's, so a plain time-of-day line stays safe.
- Validated in the Node vm sandbox against the real teas/sessions CSVs (`fixtures/greeting-test.js`, local):
  correct bucket at mocked hours, stable same-day pick, finished/zero-stock never suggested, brewed-today
  excluded, both empty-state fallbacks. Card styling checked in the preview (Fraunces 22px, jade-pale bg,
  jade-deep underlined link) in light + dark.

---
## v3.53 — retire Pixelify Sans → IBM Plex Mono
Deploy: `service-worker.js` (v63), `index.html`, `styles.css`, `steep-settings.js`, `steep-core.js`. No SQL.
- **The pixel font is gone.** `--font-mono` is now `'IBM Plex Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace`;
  the Google Fonts `<link>` loads `IBM+Plex+Mono:wght@400;500;600;700` (weights used by `.pill`, `.badge-title`,
  `.stat .num`, `.timer-display`). Every `.mono`/`.eyebrow`/`.stat .num`/`.timer-display` etc. inherits it.
- **The Pixel/Clean "Display font" toggle is retired** — it only existed to escape the pixel look. Removed the
  Settings `set-row`, `monoFont` from `DEFAULT_SETTINGS`, the `html[data-mono="clean"]` CSS block, and the
  `data-mono` `setAttribute` in the theme applier (`applySettings` is now a no-op kept for its call sites). A
  leftover `monoFont` key in already-synced settings is harmless — no migration.
- **Eyebrow tracking `.1em → .06em`.** IBM Plex Mono runs wider than Pixelify; at `.1em` the long
  "Suggested brew · <leaf-form> family · auto" eyebrows wrapped to two lines on 375px. Tightening to `.06em`
  (still clearly letter-spaced) reclaims the borderline ones without shrinking any font-size. Verified in the
  preview at 375px: eyebrow computes to IBM Plex Mono, `letter-spacing:0.66px`, and the woff2 loads over the wire.

---
## v3.52 — remove the Tea persona card
Deploy: `service-worker.js` (v62, shared with v3.51), `steep-dashboard.js`, `styles.css`. No SQL.
- **The "Your tea persona" Home banner is gone** — `computePersona`, the `persona` dashboard card
  (removed from `DASH_DEFAULT_ORDER`/`DASH_LABELS`/`DASH_SURFACE` and `dashCardsHome`), and the
  `.persona` CSS block. Saved `dashLayout`s self-heal: `dashLayout()` filters unknown ids, so a
  persisted `persona` entry in order/hidden/surface is silently dropped on next render.
- Alternatives to fill that slot (a calmer identity surface) are under discussion — see ROADMAP note.

## v3.51 — tea detail: structured card for saved brew guides
Deploy: `service-worker.js` (v62), `steep-teas.js`. No SQL.
- **Teas WITH a saved guide now get the same structured brew card** (temp / rinse / first steeps)
  the suggested-brew card introduced in v3.48 — new `savedBrewHTML(tea)` parses the guide via
  `effectiveGuideSchedule(tea, true)`, labeled "Brew guide · saved". The raw guide text stays
  visible inside the card, so nothing the user wrote disappears.
- **Temp-only guides** (e.g. Ruby Ruanzhi's "80-90°C") show the leaf-form schedule the timer would
  actually run, with a footnote saying the times come from the leaf type — generated times are never
  passed off as the user's own.
- Gated like the suggested card: `brewAdvice` off, or a guide that parses to nothing, falls back to
  the old plain "How to brew" text block.
- Validated in the Node vm sandbox against all 14 real tea rows: 11/11 guides render the card
  (Shincha's "60-75°C / 15-30s / 3 infusions" → 68°C · 15/23/30s; range-midpoints and the single-range
  spread behave), temp-only generates with `generated:true`, `brewAdvice=false` falls back to plain.

## v3.50 — sweep confirm()/alert() → inline UI (sessions + teas)
Deploy: `service-worker.js` (v61), `steep-core.js`, `steep-sessions.js`, `steep-teas.js`. No SQL.
- **No more browser popups in steep-sessions/steep-teas.** New shared **`armConfirm(btn, message, onYes)`**
  (steep-core.js): a destructive button hides itself in place and shows "message · Yes / Cancel" right
  after it via DOM — non-blocking, and **no re-render**, so unsaved form fields nearby survive (verified:
  typing an edit in the tea form then arming Delete keeps the text). Any later `render()` just redraws the
  plain button. The 5 `confirm()`s converted: remove vessel, remove steep, delete session, discard session
  log, delete tea.
- **The 5 `alert()`s → `showToast`** (existing non-blocking notice): min-steep guard, "add a tea/vessel
  first", "enter a steep time", "log at least one steep".
- **Guards verified per site** (v3.37 re-entrancy): only `deleteSession` has one (`_sessionSaving`), and
  since the action now fires directly on Yes it still protects the stock-readd on a double-click — no flow
  depended on `confirm()` blocking. Verified the stock readd (20→26g) still runs exactly once.
- Remaining popups (out of scope): steep-settings bulk import / photo-migrate, and steep-core's
  offline-sync error `alert()`.

## v3.49 — brew-guide emitter round-trips exactly (+ permanent test)
Deploy: `service-worker.js` (v60), `steep-core.js`, `steep-teas.js`. No SQL.
- **`scheduleToGuideText` now emits times in raw seconds** (`75s`, not `fmtSecShort`'s `1m15s`). The
  compound `1m15s` token was unparseable by `parseBrewGuide`/`bg_extractTimes`: it read back as `60s`
  *and* truncated the run after it, so any schedule with a steep ≥60s + remainder silently corrupted
  on the schedule → text → parse round-trip. This bit **`saveTuningToGuide`** (save-tuning-as-guide),
  not just v3.48's suggestion save. Raw seconds round-trip exactly for every value.
- **`saveSuggestedGuide` now reuses `scheduleToGuideText`** (was a near-duplicate emitter) so there's a
  single, tested formatter; the KB ratio is still appended after.
- **New permanent test `fixtures/brew-roundtrip-test.js`** (82 checks): for every LEAF_PROFILES family
  (× steep counts) and every KB style, `schedule → scheduleToGuideText → parseBrewGuide` must reproduce
  the identical times, plus adversarial ≥60s-remainder cases and a guard that the emitter never emits a
  compound minute token. This is committed (unlike the CSV-driven fixtures) via a `.gitignore` exception,
  since it generates from committed source and needs no private data — so it catches this bug class for
  good, including future emitter changes. Negative-control-verified (buggy emitter fails it).

## v3.48 — Suggested brew on tea detail (for teas without a guide)
Deploy: `service-worker.js` (v59), `steep-teas.js`. No SQL.
- **Tea detail now shows a "Suggested brew" card when a tea has no saved brew guide** — the same
  schedule the session timer would generate (`effectiveGuideSchedule`'s KB/leaf-form path): temp,
  leaf ratio, and the first steeps. Clearly marked as a suggestion (calm jade-pale card, "not a saved
  guide" note), never shown when a real guide exists (that path still renders "How to brew").
- **One-line source label:** a matched KB style names itself (`Suggested brew · dancong style`);
  otherwise the inferred leaf-form family with the `· auto` marker (`Strip / open leaf family · auto`).
  Temp + ratio come from the KB when a style matched; a leaf-form-only fallback shows just the steeps.
- **Save-as-guide button** writes the suggestion into `brewGuide` (`saveSuggestedGuide`), after which
  the tea reads as a normal guided tea. Times are written in **raw seconds** (`75s`, not `fmtSecShort`'s
  `1m15s`, which `parseBrewGuide` reads back as 60s) so the saved guide round-trips to exactly the
  schedule shown; the KB ratio is appended (`4g/100ml`) and harmlessly stripped on re-parse.
- Gated on the same `brewAdvice` opt-out as the in-session generated schedule (calm-first: no generated
  guidance when the toggle is off). Verified in the browser sandbox across KB-match / leaf-form-only /
  already-guided teas + save round-trip; `node --check` green.

## v3.47 — move dashboard cards between Home and Insights
Deploy: `service-worker.js` (v58), `steep-dashboard.js`, `steep-insights.js`. No SQL.
- **Edit mode can now move a card to the other tab.** Each card's edit chrome gains a `→ Insights`
  (on Home) / `→ Home` (on Insights) chip next to ↑ ↓ Hide. `dashMoveToSurface` records a per-user
  override in `settings.dashLayout.surface` (id→'home'|'insights') that `dashSurface` layers over the
  built-in `DASH_SURFACE`; moving a card back to its built-in surface clears the override (no-op
  overrides don't accumulate). The card lands at the bottom of the destination tab; within-tab ↑ ↓
  reorder then works as before.
- **Both tabs now build the full card map** via a shared `dashCards()` (= `dashCardsHome(s)` in
  steep-dashboard + `dashCardsInsights(s)` in steep-insights, one shared `computeStats`). A moved card
  must have its HTML available on whichever tab it lands on; the old split (each view built only its
  own cards) couldn't render a card on the other surface. `viewDashboard`/`viewInsights` are now thin
  wrappers over `renderDashboard(dashCards(), surface)`.
- **Migration-safe:** old saved `dashLayout` (no `surface` key) falls through to `DASH_SURFACE`
  unchanged; `saveDashLayout` preserves the override across hide/reorder; `dashResetLayout` clears it.
- Verified in the Node/browser sandbox: cross-tab move + land-at-bottom, within-tab reorder, move-back
  clears override, reset, and surface persistence across hide ops. `node --check` green.

## v3.46 — Vessels folded into the Teas tab
Deploy: `service-worker.js` (v57), `steep-core.js`, `steep-teas.js`, `steep-sessions.js`. No SQL.
- **Nav is now Home · Teas · Sessions · Insights** — the Vessels tab is gone. Vessels live under Teas
  behind a segmented control (Teas | Vessels), following the v3.18 vendor-manager precedent of folding a
  surface into Teas. `state.teaSeg` ('teas'|'vessels') tracks the active segment; `viewTeas` renders the
  vessels segment via the existing `viewVessels()` (in `steep-sessions.js`), so vessel add/edit/delete are
  unchanged.
- **Deep-links preserved.** `goView('vessels')` and any stray `state.view='vessels'` route to
  `goVessels()` → Teas tab, Vessels segment. The onboarding "Add vessel" button and the "add a vessel
  first" guard on session start both land there. Pre-v3.46 persisted `tealog_view='vessels'` is remapped
  at init (dropped from `PERSISTED_VIEWS`). `render()` keeps a defensive `view==='vessels'` guard.
- `node --check` green on all three touched files.

## v3.45 — nav tidy: Insights last, Friends to the icon row
Deploy: `service-worker.js` (v56), `steep-core.js`. No SQL.
- **Tabs now read Home · Teas · Sessions · Vessels · Insights** — the main tab row concentrates on
  "all things tea", with Insights moved to the end (no longer the second tab).
- **Friends moved to a 👥 icon in the top action row** (next to shopping / passport / settings), via
  `goFriends()`. Frees a tab slot and keeps the primary nav tea-focused. Friends stays fully functional.
- Migration re-validated against Niklas's real saved `dashLayout` (v3.44): his reorder (wrapped before
  recap) and hidden `recent` are preserved with no cross-tab leakage. `node --check` + render suites green.

## v3.44 — Insights tab + dashboard split
Deploy: `index.html`, `service-worker.js` (v55), **new** `steep-insights.js`, `steep-dashboard.js`,
`steep-core.js`. No SQL.
- **Nav gains an Insights tab.** Home now leads with the calm, at-a-glance cards; the analytics move
  to Insights. **Home:** persona, cost overview, running-low, brewing clock, recent sessions, totals,
  favorites. **Insights:** Recap, Steep Wrapped, the Insights reading, "What you brewed" (type
  breakdown), Most-brewed / Top-rated. (Heatmap + streak stay on the Sessions tab, per Niklas — they
  were never on Home.)
- **New module `steep-insights.js`** owns the analytics cards + `viewInsights()` — the tab is the seam
  that splits `steep-dashboard.js` (~1040 → ~740 lines), addressing review finding #10. Added to
  `index.html` load order + `FILES_TO_CACHE`; module map in CLAUDE.md.
- **Surface-aware editable layout.** The `dashLayout` registry gains `DASH_SURFACE` (each card's home
  surface); `renderDashboard(cards, surface)` filters per tab, and reorder/hide work per-tab. Migration
  is automatic and lossless: existing saved `{order,hidden}` keep their visibility and gain surfaces
  from the constant — **nothing a user hid can reappear** (validated).
- **Recap gains an "All time" option** (alongside This week / This month).
- Validated in a vm sandbox against real fixtures: a representative pre-split `dashLayout` migrates with
  hidden cards preserved and no cross-tab leakage; `viewDashboard()`/`viewInsights()` render only their
  own cards — 16 checks green; all prior suites (XSS/KB/lifecycle/tea-order/brew-accuracy) still green;
  `node --check` clean.

## v3.43 — silver needle glass note
Deploy: `service-worker.js` (v54), `steep-knowledge.js`. Reference: `knowledge/brew-guides.md`
(Fujian Silver Needle entry added; removed from pending stubs). No SQL.
- `KB_STYLES.silver_needle` keeps its gongfu baseline (80°C / 1.5 / 90 s) but the note now records the
  classic **glass** method too: "also classic in glass: 80°C, ~4 min" (Teasenz / Fuding). Values
  unchanged; note only. `node --check` + KB suite green.

## v3.42 — brew accuracy: leaf-form retune + KB-first generation
Deploy: `service-worker.js` (v53), `steep-core.js`, `steep-knowledge.js`. Reference: batch-2 entries
merged into `knowledge/brew-guides.md`. No SQL.
- **`LEAF_PROFILES` retune** (from `knowledge/brew-guides.md` batch 2). The oolong/bud/compressed
  families now encode the **opening dip** (2nd steep shorter than 1st) that vendors + Niklas's logs
  confirm, and bases move to the moderate/gaiwan school: `rolled` base 45 mult [1,0.6,0.6,0.75,0.95,1.2]
  growth 1.12; `open` base 40 mult [1,0.7,0.9,1.15,1.45,1.9]; `bud` base 55 mult [1,0.8,1.0,1.25,1.6];
  `compressed` base 22 mult [1,0.9,1.0,1.2,1.5,1.9]. **Greens unchanged.**
- **KB `first` as generation base.** When `kbResolve` matches a style, its canonical first-steep length
  is used as the `generateFormTimes` base over the family base (via a new `baseOverride`), so dancong
  opens at 25s, Tie Guan Yin at 45s, etc. while sharing the family's dip/growth shape.
- **KB updates:** `ball_oolong` tempC 95 / ratio 3.5 / first 45; `longjing` tempC 78.
- Validated against real `fixtures/steeps`: generated oolong schedules land in the logged corridor —
  **Ali Shan generates 45/27/27**, matching TKK's printed 45→25→25 and inside the 60→35→60 shape; every
  oolong shows the dip. 18 brew-accuracy checks green; KB/lifecycle/tea-order/XSS suites still green;
  `node --check` clean.

## v3.41 — dancong brew baseline (knowledge layer)
Deploy: `service-worker.js` (v52), `steep-knowledge.js`. New reference file `knowledge/brew-guides.md`
(not app-loaded/cached — a growing vendor-sourced knowledge layer). No SQL.
- **Phoenix/Feng Huang dancong split into its own KB style.** New `KB_STYLES.dancong`
  (`oolong`/`strip`, **90°C**, ratio 4.0, first 25s) distilled from three vendor sources — cooler =
  sweeter, hotter = stronger; unforgiving; second steep shorter than first. Source table + rationale in
  `knowledge/brew-guides.md`.
- **Remapped the dancong-family keywords** (`dan cong`, `dancong`, `ya shi xiang`, `yashi xiang`,
  `mi lan xiang`, `phoenix`, `feng huang`, `huang zhi xiang`) from `strip_oolong` → `dancong`. Wuyi
  yancha (`da hong pao`, `rou gui`, `shui xian`, `wuyi`, `yancha`, baozhong/pouchong) stays
  `strip_oolong`. Leaf form is unchanged (both map to the `open` curve family), so `inferLeafForm`
  output for existing teas is identical.
- **`knowledge/` folder** = growing reference layer feeding KB baselines; not loaded by the app.
  Consult it when tuning brew defaults (noted in CLAUDE.md).
- Curve-retune note (deferred, in ROADMAP): all three sources — even the flash-steep gongfu school —
  show the **second steep shorter than the first**, so the opening-dip multipliers should extend to the
  oolong `LEAF_PROFILES` curves (`rolled`/`open`), not just greens.
- Validated: `kbResolve("Yashi Xiang Dancong Guandong")` → `dancong` at 90°C; aliases resolve; Wuyi
  stays strip; 32 KB checks green; `node --check` clean.

## v3.40 — tea lifecycle (finished teas)
Deploy: `service-worker.js` (v51), `steep-core.js`, `steep-teas.js`, `steep-sessions.js`. No SQL.
- **Finished vs unknown boundary.** A tea is *finished* only when its grams are **tracked** and ≤0;
  an untracked amount of 0 is treated as in-stock (unknown ≠ empty — the DB defaults `amount_grams`
  to 0, so 0 alone is ambiguous). "Tracked" = current amount >0, OR a recorded purchase quantity
  (`costOriginalGrams`), OR a session that drew it down (`gramsUsed`). New `isAmountTracked` /
  `isTeaFinished` in steep-core.
- **Teas tab** — finished teas group at the bottom under a muted "Finished" divider (count shown);
  their card shows "finished" instead of "0.0g left".
- **Session tea picker** — finished teas hidden by default behind a quiet "show finished (N)" link;
  revealed as a trailing "Finished" `<optgroup>`. They stay fully loggable (re-weighed tins, a true
  last session), and are always shown if the current selection is itself finished. A new session now
  defaults to an in-stock tea.
- **One-time "rebuy?" affordance** on a finished tea's card — Yes → shopping list (via
  `addWishFromTea`) + sets `would_rebuy`; No → dismiss. Device-local memory (`tealog_rebuyAsked`),
  no banners/modals.
- **Stats integrity:** finished teas still count everywhere (Wrapped, passport, insights, totals) —
  only the pickers and the Teas-tab default view treat them apart. No explicit archive state yet.
- Validated against real `fixtures/` (the untracked "Test" tea stays in-stock, not finished) plus
  synthetic boundary cases — 9 checks green; XSS/KB/tea-order tests still green; `node --check` clean.

## v3.39 — tea picker grouped by type
Deploy: `service-worker.js` (v50), `steep-core.js`, `steep-teas.js`, `steep-sessions.js`. No SQL.
- **Session tea picker groups teas by type** — green · white · yellow · oolong · black · puerh · herbal
  (that order), alphabetical within each group, each group a `<optgroup>` header. New shared helpers
  `TYPE_ORDER` / `groupTeasByType` / `sortTeasByTypeThenName` in steep-core.
- **Teas tab default sort is now the same "By type" ordering** (new first option in the sort dropdown;
  `state.teaSort` defaults to `'type'`). Picking any other sort still overrides it — grouping is only
  the default, not forced. (Note: this took the v3.39 slot; the planned Insights tab shifts to v3.40.)
- Validated against real `fixtures/teas_rows.csv`: group order = TYPE_ORDER, alpha within, flat sort =
  grouped concat — 9 checks green; XSS + KB tests still green; `node --check` clean.

## v3.38 — tea knowledge base (fixes leaf-form inference misses)
Deploy: `index.html`, `service-worker.js` (v49), **new** `steep-knowledge.js`, `steep-core.js`,
`steep-teas.js`. No SQL.
- **New module `steep-knowledge.js`** — a curated tea knowledge base (`kbResolve(text)` →
  `{style,type,leafForm,tempC,ratio,first,country}` by longest-alias match over style keywords +
  cultivars + regions, EN/DE terms). Loads before `steep-core` (added to `index.html` and
  `FILES_TO_CACHE`).
- **`inferLeafForm` consults the KB first** (name + cultivar + origin), then maps the KB's finer
  leafForm vocabulary onto our six `LEAF_PROFILES` families via `KB_LEAFFORM_TO_PROFILE`. This fixes
  the long-parked misses: Japanese cultivars/regions (Saemidori, Yutakamidori, Kabusecha, Kagoshima,
  Shincha…) now infer **steamed green** (`green_jp`), and silver-bud whites (Yunnan Silver Bud, Ya Bao)
  infer **bud** — previously they fell through to pan-fired/wrong families. Falls back to the existing
  name/type heuristics when the KB doesn't match; guarded so a missing KB never throws.
- **Gentle KB prefill in the tea form** — as you type a name on a *new* tea, if the KB recognises it and
  type/origin aren't already set, a dismissible "Looks like {type} from {country}" line offers **Use
  this** (calm-first: suggested, never auto-applied). leafForm is left to `inferLeafForm`. Non-`TYPES`
  KB types (e.g. herbal) are never suggested.
- Validated against real `fixtures/teas_rows.csv`: every tea infers a valid `LEAF_PROFILES` family
  (no `leafFormLabel` crash) and the parked cases resolve correctly — 25 checks green; XSS render test
  still green. `node --check` clean on all four JS files.

## v3.37 — hygiene: re-entrancy guards, date preservation, dedupes
Deploy: `service-worker.js` (v48), `steep-sessions.js`, `steep-teas.js`, `steep-social.js`,
`steep-data.js`, `steep-core.js`, `steep-dashboard.js`. No SQL.
- **Re-entrancy guards** on `deleteSession` (shared `_sessionSaving`) and the three async form
  submits — `submitTeaForm`, `submitVesselForm`, `submitProfile` (per-form `_*Saving` flags, set on
  entry, cleared in `finally`). Each does an `await` before mutating `state`, so a double-tapped
  Save/Delete could otherwise double-apply (a duplicate tea/vessel, or a double stock add-back on
  delete — the same class as the v3.35 commitSession fix, which now guards delete too, forward-safe
  for when the legacy `confirm()` is replaced with inline UI).
- **Preserve original creation date across import/restore.** `teaToDb` now sends `created_at` when
  `t.dateAdded` is present (a no-op on update since dateAdded mirrors the DB value; an insert-time
  preserve for imported teas) and omits it when absent so new rows still get the default `now()`.
  Fixes restored teas all looking brand-new — wrong "newest" sort and Wrapped "teas you met".
- **Dedupe:** the persisted-view allowlist is now one `PERSISTED_VIEWS` const (was duplicated in init
  restore + `saveView`); the time-of-day bucketing is one `timeOfDayBuckets()` helper (was inlined
  verbatim in Insights + Wrapped). Cut the unused exported `getFollowers`.
- Validated: `node --check` on all six files; a guard/mapper logic test (guarded double-fire pushes
  once vs twice; created_at sent/omitted correctly) and the v3.36 XSS render test both green.

## v3.36 — security: escape all user text in rendered HTML (XSS fix)
Deploy: `service-worker.js` (v47), `steep-core.js`, `steep-social.js`, `steep-teas.js`,
`steep-sessions.js`, `steep-dashboard.js`, `steep-shopping.js`, `steep-passport.js`,
`steep-settings.js`. No SQL.
- **One shared `escapeHtml` (+ `escapeJsArg`) in `steep-core.js`**, and every render site that
  interpolates user-entered text now escapes the data value (never the surrounding markup). Replaces
  the four inconsistent per-module `esc()` copies (teas ×2, shopping, dashboard, passport).
- **Fixes stored cross-user XSS in the social feed** (the #1 finding): another user's `displayName`,
  `bio`, `username`, session `description`, `teaName`, `tags`, `vesselName`, and `photoUrl` were
  rendered raw into `innerHTML`, so a crafted profile/shared session ran arbitrary JS in every viewer's
  session. Now escaped. Also swept all own-content surfaces (tea/vessel/session/steep names, notes,
  origin/cultivar/source, brew guide, tags, wishlist, spend/recap/Wrapped/rankings, form value attrs).
- **`escapeJsArg` for inline `onclick` string arguments** — JS-string-escape then HTML-escape, so a
  value dropped into `onclick="fn('…')"` can't break out of the JS string or the attribute.
- Validated with a fixture-driven render test (`fixtures/xss-render-test.js`, gitignored): a tea named
  `<img src=x onerror=alert(1)>` plus a quotes/umlauts description renders **inert** (escaped, no live
  `<img>`/`<script>`) through the real render functions, while umlauts and quotes still display
  correctly — 24 checks green. `node --check` clean on all nine changed files.

## v3.35 — fix: double stock decrement on save (re-entrancy guard)
Deploy: `service-worker.js` (v46), `steep-sessions.js`. No SQL.
- **Logging a session no longer subtracts `gramsUsed` from tea stock twice.** Root cause was a
  re-entrant double-fire of `commitSession` (async, with an `await resolveDraftImage()` gap before the
  decrement and `state.sessionDraft` cleared only at the end, and the Save button never disabled): a
  second tap read the same draft and applied the read-modify-write stock decrement to the same in-memory
  tea again — subtracting twice and pushing a duplicate session. Fixed with a shared `_sessionSaving`
  re-entrancy guard (set on entry, cleared in `finally`) on both `commitSession` and `saveSessionEdit`.
  The offline write-queue was ruled out — it replays absolute-value `putTea` upserts, which are
  idempotent. Verified against real exported rows (`fixtures/`) with a Node repro: the two-overlapping-
  saves case went 32g→20g (two sessions) before, 32g→26g (one session) after; the queue-replay case was
  correct both ways. (`fixtures/` is gitignored — repro not committed.)

## v3.34 — settings declutter + vessel edit (map parked)
Deploy: `service-worker.js` (v45), `steep-core.js`, `steep-settings.js`, `steep-sessions.js`. No SQL.
- **Settings grouped into sections.** The flat list was getting long; now organised under labelled
  headings (`.eyebrow`): Brewing · Brew guidance · Session check-in · Inventory · Appearance ·
  Calm & achievements · Data. No behaviour change, just scannability.
- **Hide the mood check-in.** New `showMood` setting (default on) under "Session check-in". Off hides the
  "how are you feeling?" step in session setup and in the edit modal — but the edit modal still shows it
  for any session that already has a mood recorded, so nothing gets trapped. (This one switch is the
  intended future Garmin on/off for the correlation epic.)
- **Brew-guide + advice grouped.** Both toggles now live under one "Brew guidance" block, each still
  independently switchable (or both off). Same `brewGuideAutofill` / `brewAdvice` settings, reorganised.
- **Change the vessel on a saved session** (ships in this batch). Edit-session modal gains a Vessel
  selector (shows capacity where set); Save recomputes `vesselName`; a since-deleted vessel keeps its
  old name as the current option so nothing silently changes.
- **Map: parked, not shipped.** The v3.33 dot-map (and a legibility pass built on it) was rejected —
  you can't recognise countries/borders, "just dots." Held pending a redesign with drawn country
  outlines. The parsing layer is reusable; only the dot rendering gets replaced. See ROADMAP/STATE.

---
## v3.33 — curated passport: sub-regions + China/Japan zoom
Deploy: `service-worker.js` (v44), `steep-passport.js`, `steep-core.js`. No SQL.
- **Sub-region layer on the tea passport.** Beyond the country pins, teas now resolve to a
  curated sub-region (`PASSPORT_SUB`) placed by real lat/lon on the same grid — Kagoshima, Fukuoka,
  Uji, Shizuoka (Japan); Yunnan, Guangdong, Fujian, Zhejiang, Anhui, Guangxi (China); Alishan, Nantou,
  Lishan (Taiwan). `passportSubFor(country,tea)` matches within the parent country only (origin first,
  then name — so "Ali Shan…" places even when origin is just "Taiwan"), longest-alias-wins.
- **Tap China or Japan → zoom into sub-regions.** Selecting a zoomable country retargets the SVG
  viewBox to a window around it (reuses the existing `PASSPORT_LAND` dots — no new geometry) and draws
  sub-region pins sized by tea count, plus a faint marker for region-unspecified teas. "← Zoom out"
  returns to the overview; zoomable countries carry a dashed amber ring + `⊕` on their chip.
- Detail panel gains sub-region chips (incl. "Region unspecified"); tapping one filters the tea list.
- Verified with the real library in a Node sandbox: Japan→Kagoshima ×3 / Fukuoka ×1; China→Guangdong,
  Yunnan, Anhui (Huoshan Huangya) + 2 unspecified; Taiwan→Alishan (from name); all render paths clean.
- New `state`: `passportZoom`, `passportSub` (reset on view change). No schema change.

---
## v3.32 — forecast coverage + brew-guide parse + reload fixes
Deploy: `service-worker.js` (v43), `steep-dashboard.js`, `steep-core.js`, `steep-teas.js`. No SQL.
- **Stock forecast now covers any brewed tea.** Old rule needed 2+ grams-logged sessions, so a tea
  with one weighed session (or sessions where grams weren't typed) showed nothing — while purchase-date
  teas predicted from the ledger. New model = **frequency × dose**: sessions/day (across *all* the tea's
  sessions, incl. cold brew and grams-less ones) × average logged dose, needing just one grams entry to
  anchor. Ledger still preferred when present. (Kabusecha/Ruby/Sencha/Huang Ya now predict.) `teaForecast`.
- **Brew-guide parser — range spreading.** A lone time-range now spreads start→end across the infusion
  count: `60-75°C, 15-30s, 3 infusions` → 68°C, steeps [15, 23, 30] (was one 23s steep). Temperature
  ranges read as midpoint (`60-75°C` → 68°C). German "Aufguss/Aufgüsse" counts recognised. Multi-range
  guides (DHP `10-15s / 15-20s`) still read as one steep each. `parseBrewGuide`.
- **Reload stays on the tea.** Viewing a tea and refreshing now restores that tea's page instead of
  bouncing to Home (tea-detail route persisted alongside the tab route). `openTeaDetail`/boot restore.

## v3.31 — mood/energy check-in (enabler)
Deploy: `service-worker.js` (v42), `steep-sessions.js`, `steep-data.js`, `steep-teas.js`.
SQL: `v3_7-mood.sql` (adds nullable `sessions.mood`).
- **Optional pre-brew mood/energy** at session setup (Drained · Low · Steady · Lively · Wired),
  one tap, skippable, applies to cold brew too. Captured *before* you start so it's tied to the
  session and time of day — the reading the later Garmin/caffeine-sleep correlation (Tier 4) leans on.
  Editable afterwards on the session-edit form. Stored in `sessions.mood`; `MOODS`/`moodChipsHTML`/
  `d_setMood`/`setEditSessionMood` in steep-sessions.
- **Fix:** removed the leaf-form line from the tea detail page (looked cluttered) — the field still
  lives in the tea edit form, it's just no longer auto-listed on the detail grid.

## v3.30 — in-session micro-adjust
Deploy: `service-worker.js` (v41), `steep-sessions.js`. No SQL.
- **Adjustments now stick.** Previously each steep re-prefilled from the fixed schedule, so lowering
  a steep's time did nothing — the next steep snapped back to the guide's upward march. A session-local
  `timeShift` now carries the gap between what you actually brewed and what the schedule predicted, so
  the next steep continues from where you landed (the curve still rises, but from your level). Clamped
  ±45s, reset on brew-mode change and each new session. Ephemeral — the tea's saved guide is untouched.
- **"How was that pour?"** After the first steep, a small Weak → longer / Just right / Strong → shorter
  row nudges the next steep ±5s without retyping, showing the live offset ("next steep −6s vs guide").
  Same weak/ok/strong vocabulary as the between-session advice, at per-steep granularity.
  (`d_nudgeNextSteep`, `brewNudgeRowHTML`, carry logic in `saveSteepAndContinue`/`applyScheduleToCurrentSteep`.)

## v3.29 — leaf-form steep curves + seconds-first advice
Deploy: `service-worker.js` (v40), `steep-core.js`, `steep-sessions.js`, `steep-teas.js`, `steep-data.js`.
SQL: `v3_6-leaf-form.sql` (adds nullable `teas.leaf_form`).
- **Leaf form drives the steep progression.** Steep times now follow *leaf morphology*, not a single
  ramp. Six families, each with its own curve: rolled/balled (opens slowly → small early increments),
  strip/open leaf (strong early → ramps from the start), bud/needle (slow, steady, long), green
  pan-fired (Chinese — S2 flash-dip then climb), green steamed (Japanese — deeper dip, lower base),
  compressed/cake (breaks & opens like rolled). `LEAF_PROFILES` + `scheduleTimeForIndex` (now
  form-aware) in steep-core.
- **New `leafForm` field on teas** (Auto by default). Auto **infers from the name first**
  (cultivar/region/leaf: Da Hong Pao/Wuyi/yancha→open, gyokuro/sencha→steamed, silver needle/
  yinzhen→bud, cake/bing/tuo→compressed) then the type default — because vendor type labels are
  unreliable. Overridable per tea; shown on tea detail. Nullable column, no backfill.
- **Suggested schedules with no guide.** A tea with no brew guide now gets a leaf-form-generated
  schedule in setup (labelled "Suggested · <form>"), so the timer prefills sensibly from day one.
  Explicit guide times always win; the curve only fills gaps and **extrapolates past the last listed
  steep** (validated against a real Da Hong Pao card: 10-15s/15-20s + "add 5-10s each" → 13, 18, 24,
  30, 38, 47, 57s).
- **Parser hardening.** `parseBrewGuide` now understands ranges ("10-15s" → midpoint), ordinals
  ("1st/2nd"), and "add 5-10s (each/thereafter)" ramp instructions (dropped, not read as a steep) —
  so real-world guide text stops producing junk steeps. Slash/comma/clock notations unchanged.
- **Advice in seconds, not percent.** The tuning suggestion reads "≈+5s/steep" off a representative
  steep instead of "+8%", since a percentage is hard to act on mid-brew. (`adviceSuggestionText`.)

## v3.28 — inventory-over-time + restock v2
Deploy: `service-worker.js` (v39), `steep-dashboard.js`, `steep-teas.js`. No SQL.
- **Sharper run-out estimate.** `teaForecast` now prefers a *purchase-date ledger* — real net
  drawdown `(grams bought − on hand) ÷ days since purchase` — over the old session-span guess.
  It's anchored to a real buy date and captures untracked use too, so "how long will this last"
  is meaningfully sharper on any tea logged with a price/pack size + purchase date. Falls back to
  the session estimate when there's no usable anchor; guarded against bad data (on-hand > bought,
  <3 days elapsed). Return shape is unchanged, so the Home "Running low" card and the tea-detail
  forecast line both sharpen with no other edits. The line adds a quiet "· from your purchase date"
  when the ledger is used (vs "· rough estimate…" while a session estimate is still settling).
- **Inventory drawdown sparkline** on tea detail. A calm SVG: a jade spine from the purchase
  anchor (full pack) down to today's on-hand amount, a soft area fill, and a dashed amber
  projection to the estimated run-out date, with buy-date/amount and "runs out ~date" captions.
  Only renders when a real buy anchor exists (teas you already had have no chart). Info, not
  gamification — no toggle, shows in Quiet/Calm mode too. `inventoryHistory` + `inventorySparkline`
  live in steep-dashboard. First payoff of the v3.26 purchase-date enabler.
- Parked (noted in ROADMAP): a per-session drawdown *staircase* overlaid on the spine, and the
  same sparkline on the Home restock card — deferred to keep this a small deploy.

## v3.27 — update prompt + editable dashboard
Deploy: `service-worker.js` (v38), `steep-boot.js`, `steep-dashboard.js`, `steep-core.js`.
- **"New version available" prompt.** The service worker no longer auto-`skipWaiting()`s; on an
  update it waits, and `steep-boot.js` shows a small bottom banner ("A new version of Steep is
  ready — Refresh"). Tapping it messages the waiting worker to activate, then reloads once on
  `controllerchange`. Also an hourly `reg.update()` so long-lived installed PWAs notice.
  This ends the "deployed but still on the old UI / hard-reload dance" problem — no session is
  interrupted mid-brew, and the user opts in to refresh.
- **Editable dashboard.** Home cards are now a named registry rendered from a saved order + a
  hidden set (`settings.dashLayout`, synced — no migration). An "✎ Edit layout" chip enters edit
  mode: each card gets ↑ / ↓ / Hide, plus a "Hidden cards" panel to restore, and "Reset to
  default order". Cards: persona, recap, Wrapped, running-low, recent, totals, brewing clock,
  insights, what-you-brewed, most-brewed/top-rated, favorites, cost. Unknown/new cards fall back
  to the default order (forward-compatible), so future cards appear automatically. `renderDashboard`
  + the layout helpers live in steep-dashboard; edit mode clears on navigation.

## v3.26 — monthly spend overview (+ purchase-date enabler)
DB: run `v3_5-purchase-date.sql` (adds a nullable `purchase_date` to `teas`).
Deploy: `service-worker.js` (v37), `steep-data.js`, `steep-teas.js`, `steep-shopping.js`,
        `steep-core.js`, `steep-dashboard.js`.
- **Purchase date** on teas, distinct from date-added (created_at). The tea form gains a
  "Purchase date" field with a "Today" quick-set; leaving it blank means "stock I already had"
  so an initial backlog isn't counted as this month's spend. Teas added from the shopping list
  default to today. Shown on the tea detail. (Architecture enabler — also unblocks
  inventory-over-time and sharper restock timing.)
- **Spending view** (tap "Total spent" on the Home cost overview): current-month total, a
  12-month bar series (this month highlighted), avg per active month, tracked total, and the
  list of teas bought this month (tap through to the tea). Priced teas without a purchase date
  are excluded from the monthly view and summarised separately. Home cost overview also shows a
  quiet "This month: N across M teas" teaser. No new module; `computeMonthlySpend()` +
  `viewSpend()` live in steep-dashboard, `monthKey`/`monthLabel` in steep-core.

## v3.25 — brew advice
DB: run `v3_4-brew-advice.sql` (adds a nullable `feedback` column to `sessions`).
Deploy: `service-worker.js` (v36), `steep-core.js`, `steep-sessions.js`, `steep-settings.js`,
        `steep-data.js`.
- Optional one-tap **"How was this cup?"** (Just right / A bit strong / A bit weak) on the
  wrap-up and quick-log screens. Stored per session; tap again to clear. Sessions stay loose —
  it's never required.
- `computeBrewAdvice()` (steep-core) turns a tea's recent sessions into a gentle tuning of its
  brew guide: each session's signal is the explicit pick, else inferred from tasting tags
  (bitter/astringent → strong, watery/thin → weak). Net signal → a small, capped temp/time
  nudge (±6° / ±24%) off the parsed baseline.
- Session setup now shows a **Guide / Your tuning / Off** selector (replaces the v3.24 on/off
  toggle) plus a memory line ("Logged 5× · 3 just right · 2 a bit strong — suggests cooler…").
  Picking "Your tuning" prefills the adjusted schedule; the steeping strip labels it. A
  **Save this tuning as the tea's brew guide** action writes it back to the brewGuide text and
  marks a "tuned as of now" timestamp (in synced settings) so saved tunings don't re-nudge.
- Skipped for cold brew. New synced setting **Brew advice** (default on). Only one small SQL
  migration; no new tea column, no new module.

## v3.24 — brew-guide → prefilled steep schedule
Deploy: `service-worker.js` (v35), `steep-core.js`, `steep-sessions.js`, `steep-settings.js`,
        `steep-dashboard.js`.
- Parses each tea's free-text "How to brew" note into a light schedule
  (`{tempC, rinseSeconds, times[]}`) via `parseBrewGuide()` in steep-core. Rule-based and
  forgiving: gongfu slash-runs (`15s / 20s / 30s`), comma lists, `m:ss` clocks, Western
  minute steeps, °F→°C, "boiling"/"degrees"; strips grams/ml/years/infusion-counts so they
  aren't read as times; returns null when nothing usable is found (calm-first — no schedule,
  no fuss).
- Session setup shows a "From your brew guide" preview (temp · rinse · times) with a
  per-session toggle. During steeping, each infusion's timer target + temperature are
  prefilled; a quiet strip shows the plan with the current step marked and extrapolated
  steeps flagged `~` (extends past the listed steeps by repeating the last gap). Everything
  stays editable; "turn off" disables it mid-session.
- Skipped for cold brew (which already has its own single-long-steep path). New synced
  setting **Brew-guide autofill** (default on). No SQL, no CSS, no new module.
- Also in this batch: moved the **Data & account** section (export/import/move-photos/sign-out)
  off Home into the bottom of the Settings modal (reachable via ⚙, styled as a settings row).

## v3.23 — theme toggle in Settings only
Deploy: `service-worker.js` (v34), `steep-core.js`.
- Removed the header ☀️/🌙 button; appearance lives in Settings.

## v3.22 — quick-fix batch
Deploy: `service-worker.js` (v33), `steep-teas.js`, `steep-dashboard.js`,
        `steep-core.js`, `steep-settings.js`.
- Favourite-tea filter (★) in the Teas library.
- Light/Dark control in Settings (mirrors the header toggle).
- Steep Wrapped no longer counts cold-brew steep time toward "steeping time".
- Cost overview: tapping "Low stock" opens the Teas list filtered to low stock.
- Cost/session on a tea's detail (cost/gram × avg leaf per session).

## v3.21 — hotfix: shared sessions leaking into personal stats
Deploy: `service-worker.js` (v32), `steep-data.js`.
- loadKey('sessions') / steeps now filter by user_id. A social RLS policy lets
  followers read shared sessions; the unfiltered personal query was pulling those
  into your own stats, streak, insights, persona, and Wrapped. Feed unaffected.

## v3.20 — shopping list
DB: run v3_3-wishlist.sql (new `wishlist` table + RLS).
Deploy: `service-worker.js` (v31), `steep-shopping.js` (new), `steep-data.js`,
        `steep-core.js`, `steep-teas.js`, `index.html`.
- Shopping list behind a 🛒 header icon: manual entries + auto-suggested restocks
  from the forecast (low/out teas, favourites first), check-off, and "add as tea"
  (pre-fills the tea form). Wishlist writes flow through the offline queue.

## v3.19 — richer tea persona
Deploy: `service-worker.js` (v30), `steep-dashboard.js`.
- Persona blends habit signals: a title modifier (Cold-Brew / Gongfu / Nocturnal
  / Morning) on the type core, plus up to two combined subtitle traits (cadence,
  time of day, infusion depth, leaf strength, loyalty vs variety, perfect cups).

## v3.18 — vendor manager → Teas tab
Deploy: `service-worker.js` (v29), `steep-teas.js`, `steep-settings.js`.
- Moved vendor rename/merge out of Settings into an "Edit vendors" toggle beside
  "＋ Add tea" in the Teas tab, as an inline panel. Removed from Settings (pointer
  left behind). Same rename/merge logic; scales better as vendors grow.

## v3.17 — pixel font swap
Deploy: `service-worker.js` (v28), `styles.css`, `index.html`.
- Replaced Silkscreen with Pixelify Sans for the pixel display font, so 4 and 9
  are clearly distinct. "Clean" font toggle unchanged.

## v3.16 — cleanup pass
Deploy: `service-worker.js` (v27), `steep-sessions.js`, `steep-dashboard.js`.
- Cold-brew sessions skip the timed-steep flow — logged as a single long steep
  (no per-steep timer / infusion stepper).
- Streak heatmap starts at your first logged week (clamped 4–13 weeks) instead of
  a fixed 13, so a fresh log no longer shows a long empty run.

## v3.15 — Steep Wrapped
Deploy: `service-worker.js` (v26), `steep-dashboard.js`, `steep-core.js`.
- Steep Wrapped: a seasonal recap view (Northern-hemisphere meteorological
  seasons) built from existing session data — sessions, infusions, grams,
  steeping time, top tea/type, favourite time, new teas, standout cup. Dashboard
  teaser card opens it; share via Web Share API with clipboard fallback (text).
- No new infra. (Bundles the v3.14 insights cadence fix in the same dashboard file.)

## v3.14 — insights cadence fix
Deploy: `service-worker.js` (v25), `steep-dashboard.js`.
- Insights cadence now measures over the span you've actually been logging (not a
  flat 4 weeks), and phrases per-day once you're brewing daily+ ("about 2× a day
  lately"). A steady month-long 2×/week user still reads "2× a week."

## v3.13 — offline write queue
Deploy: `service-worker.js` (v24), `steep-data.js`, `steep-sessions.js`.

- **Offline write queue (Option B).** Personal-data writes (teas, vessels,
  sessions, tags, settings) are now local-first: cached immediately and queued
  on network failure, replayed FIFO on reconnect / next write / launch.
  Idempotent (upsert/delete by id); FIFO keeps foreign refs valid. "N waiting
  to sync" pill + "Synced N" toast. Non-network errors still surface.
- Offline session photos are deferred — session saves now, photo re-added when
  online. Data: URLs are never persisted to Postgres.
- Social actions and bulk import remain online-only by design.
  
## v3.12 — insights
Deploy: `service-worker.js` (v23), `steep-dashboard.js`.

- **Insights card** on Home (under the brewing clock). Reads session timestamps +
  grams for gentle, calm-first patterns: weekly cadence with a trend vs the prior
  28 days, weekend-vs-weekday lean, dominant time of day, steepiest weekday, and
  this-month-vs-last (sessions + grams). Signal-gated so rows only appear with
  enough data; the whole card hides below 5 sessions. No CSS/SQL — reuses the
  recap row + stat styles.

## v3.11 — vendor manager
Deploy: `service-worker.js` (v22), `steep-teas.js`, `steep-settings.js`, `styles.css`.

- **Vendor manager** in Settings — lists every shop you've used with its tea count; rename
  to fix typos, or type an existing name to merge duplicates. Updates the `source` on every
  affected tea (per-row writes). No popups.

## v3.10 — consumption forecast, map matching fixes
Deploy: `service-worker.js` (v21), `steep-passport.js`, `steep-dashboard.js`,
`steep-teas.js`, `styles.css`.

- **"Runs out in ~N days" forecast.** From each tea's grams-tracked sessions we estimate a
  weekly consumption rate and project when it'll run out. Shown on the tea detail ("~5g/week,
  about 2 weeks left") and appended to the Running-low card. Needs ≥2 grams-tracked sessions;
  flagged "rough estimate" until ≥4 — it genuinely sharpens as more sessions are logged.
- **Map matching fixes.** (1) Ordering bug: a Taiwan tea ("Ali Shan Fo Shou Dong Pian")
  matched China via "fo shou". Matching now trusts the origin field first, then picks the
  LONGEST/most-specific keyword, so "ali shan"/"dong pian" win. (2) Big keyword expansion for
  China (yunnan, huoshan/huang ya, wuyi, dancong, many regions), Japan and Taiwan.

## v3.9 — meditative focus mode
Deploy: `service-worker.js` (v20), `steep-core.js`, `steep-sessions.js`, `styles.css`.

- **Focus mode** during a steeping session: a "🧘 Focus mode" button opens a calm,
  distraction-free screen (no topbar/tabs) with the tea name, a teacup that fills with amber
  as the steep progresses, a large countdown, and gentle steam. Minimal controls: Start/Pause,
  Reset, "Log this infusion →" (records the time and resets for the next), and exit. The
  character-in-a-tea-garden animation is deferred until there's human-made art; this is the
  mechanic + cup-fill timer.

## v3.8 — streak regression fix, map cleanup, gaiwan app icon
Deploy: `service-worker.js` (v19), `steep-dashboard.js`, `steep-passport.js`,
`steep-teas.js`, and the new `icon-192.png` / `icon-512.png`.

- **Streak fix (regression).** The Monday-alignment shifted the grid start back without
  extending the end, so the last column ended a few days BEFORE today and recent squares
  (incl. today) fell off the grid — no green. Now the last column is anchored to the current
  week, so today is always shown.
- **World map cleanup.** Cropped to the tea hemisphere (Europe/Africa/Asia/Oceania) — the
  Americas are dropped, which zooms everything up so it's readable on mobile. Tapping a tea
  from the map now returns to the passport (back button says "Back to passport").
- **App icon.** New pixel-gaiwan `icon-192.png` / `icon-512.png` (jade bg). Replaces the old
  home-screen icon. On iOS/Android you may need to remove and re-add to the home screen to
  see it, since the OS caches the old icon.

## v3.7 — passport polish, running-low reminder, weigh-with-packaging
Deploy: `service-worker.js` (v18), `steep-passport.js`, `steep-core.js`,
`steep-settings.js`, `steep-teas.js`, `steep-dashboard.js`.

- **Passport cleanup.** Pins now render clay (were black — a CSS class wasn't applying),
  chips/teachips have proper spacing (styling inlined so it no longer depends on fresh CSS),
  map cropped of the empty far-south band. Matching now reads the tea NAME too (not just the
  origin field), so "Yunnan Silver Bud", "... Dancong", "Sencha Kagoshima" auto-place. Added
  aliases: dancong, guandong, ya bao, yashi xiang.
- **Running low** section on Home — favourited/would-rebuy teas under 2× the low-stock
  threshold, flagged "low" (red) / "getting low" (amber), tap to open.
- **Weigh with packaging** — tea form has a "weighed with packaging" checkbox + tare field
  (default from a new Settings value, 10g); net weight is stored so you needn't decant.

## v3.6 — streak date fix, world-map Tea Passport
Deploy: `index.html`, `service-worker.js` (v17), `styles.css`, `steep-core.js`,
`steep-dashboard.js`, and new `steep-passport.js`.

- **Streak fix.** All day-bucketing now uses local calendar dates instead of UTC, so
  late-evening sessions no longer land on the wrong day. Streak also no longer resets to
  0 just because today isn't logged yet (counts from yesterday). Heatmap is Monday-aligned
  with weekday labels + a caption.
- **Tea Passport** (`steep-passport.js`) — world dot-map reached from the 🌍 header button.
  Dots sized by teas owned per country; country-level matching from the `origin` field
  (country names + common regions/cultivars as keywords). Tap a pin/region → teas → tap a
  tea to open it. Unmapped-origin teas listed underneath. Sub-regions/cultivars later.

## v3.5 — modularization, header, logo, critical cache fix
Deploy: `index.html`, `service-worker.js` (v16), `styles.css`, and all `steep-*.js`
modules. **Delete `app.js` from the repo** — it's replaced by the modules.

- **Critical: service worker no longer caches Supabase data.** It was cache-first for
  everything, so added teas/photos only appeared after a hard reload. Now it caches
  only the app shell; all Supabase calls go straight to the network. Fixes the
  disappearing-data and stale-sync problems. (One hard reload after deploying v16.)
- Split `app.js` into 7 modules (above). Byte-identical behavior.
- Header redesigned: brand row (logo + 🏆 ⚙ 🌙) / tab row / full-width Log session.
- New 8-bit gaiwan logo (`steepLogoSVG()` in steep-core) — swap that one function to
  change the logo everywhere. Placeholder until human-made art.
- Dashboard → "Home". Adjustable low-stock threshold (default 15g, Settings).
  Teas tab shows owned / in-stock / low counts.

## v3.4 — streak → Sessions, weekly/monthly recap
Deploy: `app.js`, `styles.css`, `service-worker.js` (v14).
- Drinking-streak heatmap moved from dashboard to the Sessions tab (under the calendar).
- Recap card on Home with This week / This month toggle.

## v3.3 — heatmap polish
Deploy: `app.js`, `styles.css`, `service-worker.js` (v13).
- Compact heatmap; today's cell ringed; legend added.

## v3.2 — session photos
Deploy: `app.js`, `steep-data.js`, `styles.css`, `service-worker.js`. SQL: `v3_2-session-photos.sql`.
- Optional photo per session (wrap-up + quick log), shown in feed and tea detail.

## v3.1 — quick/gongfu log
Deploy: `app.js`, `steep-data.js`, `styles.css`, `service-worker.js`. SQL: `v3_1-quick-log.sql`.
- Quick log (infusion count instead of timed steeps). Quiet mode, achievements page.

## v3.0 — per-row data layer
Deploy: `app.js`, `steep-data.js`.
- Replaced whole-array blob writes with per-row insert/update/delete. Profile/follow
  reliability fixes.

---

## Known / next
- Streak counter vs heatmap likely has a UTC-vs-local date mismatch (fix + weekday labels).
- World-map Tea Passport (own page, globe icon in header) — accurate geography, dots by
  teas owned per region, tea-name click-through.
- Header cleanup follow-ups, favourites low-stock reminder, weight-with-packaging entry,
  vendor manager, predictive "runs out in ~N days".
- Backlog lives in ROADMAP-v3-next.md.
