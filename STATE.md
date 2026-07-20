# SlowCup — STATE (handoff)

> **App renamed Steep → SlowCup (user-facing brand) in v3.59.** Internal names — `steep-*.js`
> files, functions, `tealog_*` keys, the `steep-tea-log` repo name/cache prefix — keep the old name
> (the **domain migration to slowcup.app is DONE, 2026-07-13** — see "Domain & auth origins" below;
> the GitHub repo deliberately keeps its `steep-tea-log` name). "steep/steeps" tea
> terminology stays. Below, "Steep" in historical notes = the old brand; don't rewrite them.


Seed a fresh chat with: this file + ROADMAP-v4.md + CHANGELOG.md + the current
source files. That keeps each session cheap (a long thread re-reads everything every turn).

## Feeding claude.ai (the review/spec side)
The claude.ai project **re-clones the repo live each turn — never mirror source files into
the project base**. The project base holds only: the **4 CSV exports** (teas/sessions/steeps/
vessels — refresh them right before each phase-N spec, not continuously), **design images**
(mock boards, R3 PNGs), and **task/continuity docs**. Everything else it reads from the repo.

## What it is
Personal tea-logging PWA, **calm-first** (ritual over gamification; achievements/XP dormant
app-wide via `ACHIEVEMENTS_ENABLED=false` since v3.72; the Sessions "Brewing days" heatmap is
the one deliberately-kept calendar surface — neutral since v3.83, ungated on purpose).
Private + small beta. **Canonical URL: https://slowcup.app** (GitHub Pages custom domain since
2026-07-13; the old https://tosinik.github.io/steep-tea-log/ 301s there, so old links self-heal).

## Stack
Vanilla JS (no framework) · Supabase (Postgres + RLS + Auth + Storage) · service-worker PWA · GitHub Pages.
Supabase project: https://duuosbgjozjjfyfusjzf.supabase.co (anon key in project knowledge).

## Domain & auth origins (migrated 2026-07-13)
- **https://slowcup.app is canonical.** GitHub committed the `CNAME` file to main itself when the
  custom domain was set (`e744f7b` — expected out-of-band commit, not a deploy; CNAME isn't referenced
  by the SW or precache, so no cache bump). **Zero app-code changes were needed**: manifest
  scope/start_url are relative, the SW registers relatively, auth redirects build from
  `location.origin` — verified pre-migration.
- **DNS at Porkbun:** 4× A records → GitHub Pages IPs · CNAME `www` → `tosinik.github.io` ·
  TXT `_github-pages-challenge-tosinik` (account-level domain verification — **must stay**).
  Domain **auto-renew is ON** at Porkbun.
- **HTTPS:** cert via GitHub Pages (Let's Encrypt, auto-renews); **Enforce HTTPS on**. `.app` is
  **HSTS-preloaded — there is no HTTP fallback**, so a domain lapse = hard-dead app (hence the
  auto-renew note above). Domain verified at the GitHub account level.
- **Supabase:** Site URL flipped to `https://slowcup.app/`; the redirect **allowlist holds BOTH
  origins during the transition**. **Follow-up task:** remove the `tosinik.github.io/steep-tea-log`
  allowlist entry **once Ruth confirms her reinstall on the new origin** (PWA reinstalls are
  user-side work — a new origin means a fresh SW + storage; the 301 heals plain links, not installs).

## Modules (index.html load order; boot last)
steep-data → steep-knowledge → steep-core → steep-settings → steep-dashboard → steep-insights →
steep-teas → steep-shopping → steep-passport → steep-social → steep-sessions → steep-boot.
- **steep-data**: Supabase client, loadKey/saveKey, mappers, per-row CRUD, offline write queue.
- **steep-knowledge**: curated tea KB; `kbResolve(text)` → {style,type,leafForm,tempC,ratio,first,
  country}. Feeds inferLeafForm + tea-form prefill. Loads before core (no deps of its own).
- **steep-core**: state, render() view-router, header/nav, theme, init/refresh, achievements.
- Feature modules own their view + logic. Plain scripts sharing global scope (functions hoist;
  cross-module calls resolve at runtime, so feature-module order is flexible).

## Data layer
- **Offline write queue (Option B)**: writes are local-first — cache optimistically, and on a
  network failure queue the op (FIFO, localStorage `tealog_writeQueue`) and replay on reconnect/boot.
  Idempotent (upsert/delete by id). Non-network errors still surface. Social + bulk stay online-only.
- **loadKey('sessions'/'steeps') is scoped to `user_id`** (v3.21 hotfix) — a social RLS policy lets
  followers read *shared* sessions, so an unfiltered load leaked others' data into personal stats.
  The feed uses getFeed() separately.
- Public API: `window.SteepDB.{loadKey,saveKey,loadSettings,saveSettings,uploadImage,boot,signIn,
  putTea,removeTea,putVessel,removeVessel,putSession,removeSession,addTag,putWishItem,removeWishItem,
  flushQueue,pendingWrites, ...social}`.

## Models
- **Session**: `{id,teaId,vesselId,date(ISO),isColdBrew,gramsUsed,steeps[],rating,description,tags,
  isShared,photoUrl,feedback,teaName,teaType,...}`. Timed sessions have steeps[]; quick/cold-brew have
  infusionCount + steeps=[]. Cold brew skips the timer (single long steep).
- **Wishlist** (`wishlist` table): `{id,name,vendor,type,note,done,createdAt}`.

## DB migrations run (Supabase SQL editor, in order)
schema.sql · v2_1-migration · v2_2-photos-storage · v3_0-social · v3_1-quick-log ·
v3_2-session-photos · v3_3-wishlist · v3_4-brew-advice · v3_5-purchase-date · v3_6-leaf-form · v3_7-mood.

## Conventions / principles
- Calm-first; achievements/XP dormant app-wide (`ACHIEVEMENTS_ENABLED=false`, v3.72 — the old
  toggles are hidden while it's off). The Sessions heatmap stays as a neutral "Brewing days"
  calendar (streak framing removed v3.83), deliberately ungated.
- **Escape all user text in rendered HTML** (v3.36): use `escapeHtml` (data values, incl. attribute
  values) and `escapeJsArg` (inline `onclick` string args) from steep-core. Never interpolate raw
  tea/vessel/session/profile/tag text into an innerHTML template. Escape the data, never the markup.
- No browser confirm()/prompt()/alert() — inline UI only (`armConfirm` + `showToast`). The
  popup sweep is COMPLETE (v3.50 sessions/teas · v3.58 settings · v3.66 socialErr); don't add new ones.
- Generated art is placeholder; **human art for any public release**.
- Settings are synced; **theme is device-local** (`tealog_theme` in localStorage, not synced).
- Offline: read-only offline, queued writes. Photos on offline sessions are deferred (re-add online).

## Deploy ritual
Produce updated files → push to GitHub Pages → **bump `CACHE_NAME` in service-worker.js** (and add any
NEW module to its `FILES_TO_CACHE` list) → hard reload. Current cache: **v92**. Keep CHANGELOG.md updated.
Since v3.27 the app shows a "new version — Refresh" banner when a new SW installs, so testers no
longer need a manual hard reload (dev still should, to verify). The SW waits for that tap now.

## Continue here
**The work queue (post-R2 issues, decided order):** v3.79 #13 → v3.80 #19/#20 → v3.81 #18 → v3.82 #16 →
v3.83 audit riders → v3.84 interim sort → v3.85 #24+#29 water/word fixes (**all SHIPPED**, below).
**Next up (ruled 2026-07-13): v3.86 stock-tier slice** — #26 options A+B+C (empty in the tallies ·
`restockCandidate` includes finished favs/rebuys · statusLine "quantity not tracked" for active-0g) +
#27 ruled D+F (accepted-nuances register entry + a tea-detail explanation line; shelf lines untouched)
— **B is engine work: draft the plan and pause before implementing**; close #26/#27 with pointer comments
when it ships. Queued after: a timestamp-anchored timer slice for #30 (pause-gated, touches #13 territory;
notification/push is ruled OUT — answer it on the issue); the #25 greeting fix batches the #17 revisit
when it gets a slice. **Open lanes:** (1) **phase-2 (#15 + #9)** — **feedback placement is RESOLVED.** The
two pre-spec decisions are ruled (one-tap axis only; the optional-middle-path per-steep + session control)
and the buildable spec is committed: **`SPEC-brew-advice-v3-feedback.md`**. **A2 capture SHIPPED v3.89**
(per-steep tap); **senchadō as a real 3rd method SHIPPED v3.91** — the `SESSION_METHODS` append that was a
post-gate item is DONE. **GATE NOW MET — 15/15 (2026-07-19): 9 gongfu / 6 senchadō / 0 western** (Niklas
retagged; western is empty and stays empty since he doesn't brew it, so "both methods" must be reworded to
*two methods actually brewed* — ROADMAP Pillar A + `PHASE2-PRESPEC-NOTES.md` §B). **The phase-2 brew-advice
spec can now be drafted**; decisions-to-resolve-first are the agenda in `PHASE2-PRESPEC-NOTES.md` §D (senchadō
baseline conflicts with Pillar A — v3.91 ships `kb.ratioGongfu` 3.0; the 2.8 leaf-seed is currently
unreachable, so the gyokuro revisit needs senchadō ratios IN THE KB), §E (6 retagged sessions carry feedback
recorded under a superseded baseline), §F (bitter/strong = one axis, open question), + move the gate metric to
stored `brew_style`. v3.85's brewStyle un-gate feeds real method data. (2) **Supabase allowlist cleanup**
— drop the github.io origin once Ruth confirms her reinstall (see "Domain & auth origins"). The
**domain is DONE** (registered + migrated 2026-07-13 — https://slowcup.app). **#23**
("R2 capability regressions" — planned as #21, renumbered by GitHub) holds the reinstate-vs-accept
decisions (sorts full treatment, vendor filter, in-stock count, focus-mode log/reset, per-steep tag
library); `setTeaSort`/`setTeaFilter`/`focusLogSteep` stay in the code as its reinstatement hooks. #14
parked → R3; the held #15 vocab expansion stays out until phase-2. New bugs/ideas land as GitHub issues
(the live inbox), not here.

**R3 status (2026-07-19):** the design record lives in `docs/r3/`; the **binding reference** for the #09b
conformance sweep + Code hand-off is **`docs/r3/planning/R3-RULINGS-LEDGER.md`** (31 rulings — R30 shipped
v3.93, R31 deferred — boards verify against it + the code, never completion summaries), with
`DATA-region-coordinates.md` the Origins coordinate
source. R29 closed Pillar B (no root split — app stays at `slowcup.app/`, landing = #09's logged-out screen).
Shipped-but-unboarded: **Focus/steeping** + **Wrapped** (need board numbers before hand-off).

**Pending Code cleanups (were ephemeral task-chips — recorded here so a session-clear doesn't lose them):**
(a) delete dead `ratioSetupHTML` (`steep-sessions.js:562`, never called; also in CLAUDE.md cleanup backlog —
its "remove when touching setup code" trigger has fired-and-missed twice, v3.85 + v3.91; a real deploy, not
docs); (b) promote the R3 handover's §6 (review method) + §7 (recurring failure modes) into CLAUDE.md as
standing discipline — see the banner in `docs/r3/HANDOVER-planning-lane.md`.

**Historical — the Round-2 design pass is COMPLETE** (WS6 → WS2 → WS5 → WS3 → WS1 → WS4, shipped v3.73–v3.78;
bundle at `SlowCup R2 bundle handoff/` in the repo root). WS4 was the only data-model change (semantic, not
schema — rides the existing `steeps.tags`/`sessions.tags` arrays, no SQL). Pause decisions were locked as:
**bare + membership** namespace (vocab = membership in `KB_FLAVOR_CHIPS`, free words stored bare, never
inflate the radar-unlock count), **arrival-only** mood ("Arrived steady."), and the session story **keeps
the finish-screen inputs below it** (photo/rating/share not dropped). The R3 visual level-up (`design-r3/`)
is the next design round, not yet scheduled.

**Design Round 3 material stored:** `design-r3/` (gitignored) holds `DESIGN-R3-INSPIRATION.md` + a copy of
`R2-STATUS.md` + `images/` (with a README). **The 5 R3 board PNGs go to the claude.ai project base, not the
repo `images/` folder** (corrected 2026-07-13 — the project re-clones the repo live; images belong in the
project base, see "Feeding claude.ai" above). R3 is the post-batch visual level-up; two directions captured
(warm atelier vs saturated botanical) + the reserved-colour idea. Not in scope until WS1+WS4 land.

**Parallel / Niklas's:** ~~the domain~~ (**registered + migrated 2026-07-13** ✓); beta-tester
**reinstalls on the new origin** (Ruth first — then the Supabase allowlist cleanup fires); the
**phase-2 gate** (3/15 measured 2026-07-15, ~2–3 weeks out) — **the A2 capture control SHIPPED v3.89**; the
gate now **fills UNDER the shipped per-steep control** (the old end-of-session control is why the rate was
low) → then the phase-2 brew-advice build (learned defaults, post-gate). Unsequenced beta inbox: issues **#7–#12** — triage into a fresh tail when ready.

**NOW (just shipped) — v3.93 R30 flavour vocabulary** (cache **v103**, APP_VERSION v3.93): `DEFAULT_TAGS`
(the `tag_library` seed) and `KB_FLAVOR_CHIPS` (the `isFlavorVocab` membership set) were two vocabularies
for one concept — five words (`roasted · sweet · astringent · buttery · citrus`) were seeded to every user
but failed the membership test, so the app **suggested words it silently dropped** from "What you taste"
(10 of Niklas's 15 real tags invisible). Fix: the five join `KB_FLAVOR_CHIPS` (German labels); `DEFAULT_TAGS`
is now **derived** from its keys, not a hand-kept array — the seed can never again suggest a non-vocabulary
word. **Decisions recorded (R30):** (a) `roasted`/`sweet` coexist with `roast`/`sweetness` in the vocab
(two bars until R31's aliases fold them — accepted pending the nested vocabulary); (b) the WS4 capture
families stay a curated **20-of-25** — the orphans are **seed-only, not capture chips** (a `roast`+`roasted`
grid dupe would be worse), and the flavor-ladder fixture now asserts the curated-subset invariant.
`KB_FLAVOR_AXES` flagged **dead** (CLAUDE.md backlog; may be promoted — the two-layer/§F question, ledger
§4). **Deferred:** R31 alias layer, Design #03 (bare words on Tea detail). **No SQL** — nothing stored
changes; the profile aggregates at read time, so past entries are fixed too. Validated: `node --check` ×2,
all 13 committed suites green (flavor-ladder 96 with the rewritten A-block; `DEFAULT_TAGS`→25, no dupes,
all 5 orphans now `isFlavorVocab`). One real tea moved `none→chips` (a dropped word now counts).

**Also this session — v3.92 Focus feedback write** (cache **v102**, APP_VERSION v3.92): the steeping
nudge's "How was that pour?" tap now **persists** as well as nudging the timer. `d_nudgeNextSteep` writes
`steep.feedback` on the pour just finished (weak→`weak` · ok→`good` · strong→`strong`) with a **visible
saved state** (active chip + a quiet "saved"); the ephemeral `timeShift` is byte-identical (this adds
persistence, it doesn't change the nudge). **Merge decision:** the nudge is now the **sole writer** of
`steep.feedback`; v3.89's per-steep card marker (`steepFeedbackHTML`) is demoted to a **read-only echo** and
its writers (`d_toggleSteepFb`/`setSteepFeedback`) removed — resolving the "two controls, one field"
duplication. Both the write and the echo are §3-gated through the new shared `steepFbActive(d)` (brewAdvice
on · not cold brew · gongfu/senchadō), so western still only nudges the timer and the cards/writer never
disagree. **Gate-metric shift (intended, not a regression):** `sessionHasFeedback` counts session-OR-any-
steep, so nudge-only "Just right" sessions flip **uncounted→counted** going forward (stored data + the
2026-07-19 export's 12 feedback-bearing / `{gongfu:6, western:1, (none):5}` unchanged; `reduceSteepFeedback`/
`feedbackSignalOf`/`computeBrewAdvice` untouched). Validated: `node --check` ×3, all committed suites green
(brew-feedback 59 · flavor-ladder 96 · brew-roundtrip 82), a throwaway vm harness (17 checks: write ·
western/off gates · saved state · read-only echo · gate flip). **No SQL** (`steeps.feedback` since v3.89).
**Niklas's device check:** saved pill + read-only echo in a live steeping session (per v3.89's precedent).

**Earlier — v3.91 senchadō capture + fixture repair** (cache **v101**, APP_VERSION v3.91):
**Part A** — the brew-feedback fixture's R section had gone stale-red against the fresh exports (4 real
sessions now carry per-steep taps, 2 with no session-level feedback) and would have failed the deploy's own
fixture gate; rewritten to three LIVE guards (reducer both directions · steep-only linchpin on real data ·
gate count reported-not-pinned with a stored-`brew_style` method split). Engine untouched; 54→59.
**Part B** — **senchadō is a real third method** (Niklas brews gongfu + Japanese, never western; his
kyusu/shiboridashi sessions were split by capacity). `SESSION_METHODS`+`senchado`, `VESSEL_TYPES`+`Shiboridashi`,
`brewMethodFor` three-valued (senchadō explicit-only), the per-steep gate fires for gongfu OR senchadō, a
vessel-type prefill sets `brewStyle` on new setups (Gaiwan→gongfu, Kyusu/Shiboridashi→senchado; default not
lock), and **(B7) an explicit method control on the edit modal** so old sessions are retaggable in-app.
**Ratio (B5 reversal):** senchadō rides the gongfu side (`kb.ratioGongfu`). **The 2.8 leaf-seed is currently
UNREACHABLE** — all five library Japanese greens resolve in the KB to 3.0, above the leaf table, so senchadō ==
gongfu baseline today; **the gyokuro revisit needs senchadō ratios IN THE KB, not the leaf table.** Regression:
OLD `892cb0b` vs NEW `computeSessionRatio` over all 28 sessions → **0 verdicts changed** (nothing tagged
senchadō yet). All 13 suites green; browser-verified (3-method setup + prefill, senchadō per-steep cards,
edit-modal control). Gate stays on `brewMethodFor` (the Travel cuppa is the one vessel it matters for —
routing keeps its cards; strict-explicit would remove them, failure-mode #4). **6th real `/slowcup-deploy`.**
**After-ship (Niklas):** re-type Mogake Shiboridashi `Other→Shiboridashi`; **retag to Senchadō the 5 method-
less feedback sessions + the kyusu/shiboridashi ones** (gate split `{gongfu:6, western:1, (none):5}` — five
carry no stored method, now fixable in-app via B7); fill `leaf_form` on Sencha Kagoshima Premium for data
completeness + freshness display (NOT for a ratio — it resolves via KB to 3.0 regardless). **Known downstream:**
R3 board #04's 2-button method segment needs a 3-button revision (Design's, routed separately). **Ritual:**
`slowcup-deploy` step 6 now requires current `fixtures/*.csv` exports before the fixture run counts.

**Earlier — v3.90 greeting recency tune + soft cultivar check** (cache **v100**, APP_VERSION
v3.90; one deploy / two commits / one banner): **Part 1 (#25 follow-up)** — DHP kept being re-suggested two
days after a brew; verified a too-gentle dial, not a bug. `RECENCY_DAYS` 2→3 + `RECENCY_PENALTY` 1.25→1.75
(`d_scorePick`). **Tuned against the fresh export, not a guess** — dry-run: widen-only (1.52) or strengthen-
only (1.48) leave DHP winning vs Gui Fei 1.35; only both demote it (1.18). Guardrail intact (a 2-days-ago
penalty overcomes only a bucket-lead of ~1 → strongly-habitual / no-recent teas still surface; morning stayed
Shincha). greeting-v4 H 5→8. **Part 2** — `cultivarNameHint` (steep-tea-types.js): a quiet, dismissable,
blur-triggered heads-up when the Cultivar field holds a tea name/style/place ("Gui Fei", "Da Hong Pao") not a
cultivar. Rides the v3.87 catalog; **high-precision, low-recall** (hints only on a top-level style/place/name
row minus a standalone-cultivar exceptions set {jin-xuan-milky, ruan-zhi-oolong, anxi-tie-guan-yin} plus the
member `dhp`; variant-expands `/`-split+paren+aka since bare names aren't in `covers`). **Value saved
unchanged** (suggest-never-block); mappers/write path untouched. tea-types H=11. First live use of the
reference read path (Phase B still held). All 13 suites green; both live-verified (greeting dry-run + in-app
cultivar hint, console clean). **5th real `/slowcup-deploy`.** **FIXED v3.92 (above):** the ephemeral
steeping nudge ("How was that pour? · Just right", `d_nudgeNextSteep`) used to write only `timeShift` — "Just
right" wrote nothing — so a user could believe they logged taste while nothing reached `steep.feedback`/the
gate (silent gate-data loss). v3.92 makes the same tap write `steep.feedback` (weak/good/strong) with a visible
saved state, and makes the nudge the sole writer (v3.89 card → read-only echo). The R3 Log/Focus restyle still
owns making "adjust the timer" vs "log the taste" visually unconfusable; the **persistence no longer waits on
it** (Design #10: committed three-way write + visible saved state unblocked the logic ahead of the restyle).

**Earlier — v3.89 per-steep strength feedback (gongfu)** (cache **v99**, APP_VERSION v3.89):
the **A2 capture control** (`SPEC-brew-advice-v3-feedback.md`, #15+#9) — the slice that fills the phase-2
gate. Data: one nullable `steeps.feedback` (`sql/v3_9-steep-feedback.sql`, **already run 2026-07-17**; enum
app-enforced, no DB CHECK); the `steepFromDb`/`steepToDb` pair carries it. Engine: `reduceSteepFeedback`
(net-sign, tie→`good`) + one branch atop `feedbackSignalOf` (curve→verdict→tags→null, **per-steep wins,
never merged**); `computeBrewAdvice` **UNCHANGED**; `sessionHasFeedback` a **real function** (steep-only→true
linchpin). UX (steep-sessions): gongfu-gated per-steep tap on completed steep cards
(`steepFeedbackHTML`/`d_toggleSteepFb`/`setSteepFeedback`) — quiet-until-reached-for (faint `strength?` →
chips on tap → faint marker), **observational** copy, writes only `steep.feedback` (the ephemeral nudge /
`timeShift` untouched — strict non-interaction). Also hidden when `brewAdvice` off (approved — one switch
governs the loop). **Collapsed the planned 2 commits into 1** (one banner). Fixtures: new committed
`brew-feedback-test.js` (54, incl. **12/12 no-op regression**); all 13 green; live-smoked (real onclick
paths; western hides the affordance). **SQL already run. 4th real `/slowcup-deploy`.** **Niklas's device
checks:** save→reload mapper round-trip + on-device quiet-until-reached-for. The gate now **fills UNDER this
control** (~3/15 measured 2026-07-15, ~2–3 wks of complete logging). Post-gate (separate specs): learned
defaults · `SESSION_METHODS` append `japanese`/senchadō.

**Earlier — v3.88 greeting: no re-suggesting what you just had, honest "unopened"** (cache
**v98**, APP_VERSION v3.88): a greeting-engine pass (#25 + #17 + ack) + one hygiene rider. **#25:**
`d_scorePick` gains a proximity-scaled **soft recency penalty** (`RECENCY_DAYS`=2 / `RECENCY_PENALTY`=1.25,
tunable) for teas brewed in the last 2 **prior** days — penalty not exclude (tiny shelf never starves;
habitual tea still surfaces, pinned); **today excluded** to keep predicted-vs-actual stable; deterministic
from `todayKey`. **#17:** new **`isTeaUnopened`** (steep-core, beside `isTeaFinished`, same v3.40 evidence
axis) gates the rediscovery copy — opened-but-unbrewed teas get a neglected register, never "unopened".
**Ack rider:** the didn't-take-predicted pool rewritten retrospective (past-tense, not a rec). **Hygiene
rider (item 3):** dead `⚠︎ confirm` branch removed from `typeConfidenceHedge` (only non-ASCII compare key in
shipped code; rides this cache bump). greeting-v4 47→58, tea-types 48→49; all 12 suites green; live-smoked
(console clean). **This deploy carries a WHATS_NEW banner** (user-visible). **No SQL. 3rd real
`/slowcup-deploy`.** **Sibling docs commit `89f035e`** (no version): ROADMAP v3.83/84/85 backfill + verifier
codepoint policy + deleted 2 stale local suites. Next: phase-2 (gate ~3/15 + two pre-spec decisions) before Phase B.

**Earlier — v3.87 tea reference layer: Phase A (data + read path)** (cache **v97**,
APP_VERSION v3.87): the reference feature's **data + queryable read path, no UI yet** (Phase B = the
browsable page, **held until phase-2**; Phase C = R3 styling + library link). New **`steep-tea-types.js`** —
a script-global like `steep-knowledge.js` (`const TEA_TYPES`, 55 rows, precached, no fetch) + `resolveTeaType`
(read-time parent inheritance), `matchTeaType` (name→type by curated `covers`, never token inference),
`browseTeaTypes`, `typeConfidenceHedge`. Data reconciled from TEA-TYPES-SEED.md's 58 rows → 55 (gyokuro
dedup · flat DHP/Dan Cong rows superseded by two-level parents · covers member-only). **Confidence is
per-row, never inherited** — `dhp` is `contested` under a `canonical` Wuyi Yancha, so the §3 hedge fires on
the tea that shouldn't read as settled fact. **WHATS_NEW suppressed (`''`)** — dormant module, nothing
user-facing to announce (WS4 precedent; banner shows headline only). New committed
`fixtures/tea-types-test.js` (48 checks; all 12 suites green). **No SQL. Deployed via `/slowcup-deploy`
(2nd real run).** Next: phase-2 (gate ~3/15, and its two pre-spec decisions) before Phase B unlocks.

**Earlier — v3.86 #26 + #27: empty says so, unknown stays unknown** (cache **v96**,
APP_VERSION v3.86): the stock-tier slice. `stockTier` splits 0g by evidence — **`empty`** (tracked +
drained, `isTeaFinished`) vs **`untracked`** (bare 0g = unknown; v3.40 rule holds, unknown ≠ empty);
`statusLine` is now total (`empty` / `quantity not tracked`, both ink-soft, **no gram prefix** — the old
"0g · fresh, plenty" lie is dead). **#26 A:** count row gains a fourth "· E empty" segment (E>0 only;
untracked counts in no stock segment, so segments don't sum to N — by design). **#26 B (engine):**
`restockCandidate` widens to tier ∈ {low, empty} — `'few'` still excluded (v3.82 stands), `'untracked'`
excluded by construction; the Home card cell reads "empty", grams-asc sort floats empties top. **Q1 ruled:**
cards + rows render finished teas *through* `statusLine` (hardcoded "finished" spans gone) — one writer, one
word; "Finished" section header stays as the grouping title. **Q2 ruled:** Home card keeps "Running low",
judged on phone; pre-batched fallback = retitle "Worth restocking" **this same deploy** if it reads wrong
above "empty" rows. **#27 D+F:** DESIGN.md accepted-nuance entry (tier is cups, not grams) + a tea-detail
ledger line "≈ 4.6 cups at your usual 5g" (Q3 precise form; real dose history only; **shelf lines
untouched**). New `status-line-test.js` section I (12; 75 total); all 11 committed suites green.
Browser-verified at 390px both themes (seeded state, auth-less). **No SQL. Close #26/#27 with pointer
comments.** **Deployed via `/slowcup-deploy` (first real run of the skill).** Next: phase-2 after the
~Jul 20 gate; the Q2 title judgment + post-ship screenshots (unblock Design's R3 base) ride Niklas's
phone check.

**Earlier — v3.84 #23 F1: sort your shelf again** (cache **v94**, APP_VERSION v3.84): the
"ships now" slice of #23 per `TASK-23-interim-sort.md` (repo root; plan-review pause held). **All seven
sorts return** as a compact styled select on the count row — engine keys untouched, handler = the
**reinstated `setTeaSort`** (held from the F11 cleanup as this exact hook), `selected` re-derived per
render, **session-scoped** (persistence = R3). **The reviewed branch:** the WS5 running-low float now
applies **only under the default Type sort** (`teaShelfHTML`: explicit sort ⇒ engine order untouched);
finished teas stay bottom-grouped under all sorts (split is upstream). **F3 rider shipped too**: the
count line reads "N teas · M in stock · K running low" again; the row is flex-wrap so a tight 390px
wraps the select below the count — segments never truncate. Select sits outside `#teaShelf` (search
keystrokes can't touch it). New committed **`fixtures/shelf-order-test.js`** (19 checks, 11th suite:
float-default-only pins per key, finished-bottom, v3.40 lifecycle definitional pins, grid≡rows, real-CSV
with graceful skip). All 11 suites green; browser-verified (sort orders both densities, 390px fit,
selected carry, sort×search/chips compose, both themes). **F1 + F3 ticked on #23** — remaining there:
F2 vendor filter · F7 focus-mode actions · F8 per-steep library chips (reinstate-vs-accept, R3-gated).
**No SQL.** Next: phase-2 after the ~Jul 20 gate.

**Earlier — v3.83 audit riders: never lose a session to the Log button** (cache **v93**,
APP_VERSION v3.83): the four riders from the 2026-07-13 post-R2 audit (findings doc reviewed claude.ai-side;
the capability-regression bundle is **issue #23**). **F4 — the guard:** WS6's raised Log rendered during the
session flow and `quickLogSession` silently overwrote the draft (finish-screen mis-tap ate rating/notes;
mid-steep orphaned the interval). Now `quickLogSession(btn)` arms the inline `armConfirm` two-step
("Discard the session in progress?") whenever the draft has something to lose — always past setup
(steeping/finish/quick), in setup only when dirty vs the fresh-draft fingerprint (`_pristine`, stamped at
creation; reverting an edit reads clean; UI-state toggles never count); a button-less call routes back to
the session instead of discarding; `startSessionFor` clears the old interval unconditionally. **F6:**
viewSpend back → "← Back to Insights" (its cost-card entry moved there in v3.74). **F9:** settings chime
copy stops promising vibration (removed v3.77). **F17:** the Sessions streak card is now a neutral
**"Brewing days"** heatmap — streak line gone, placement kept, deliberately ungated; onboarding's "your
streak" promise re-worded to match. New committed **`fixtures/log-guard-test.js`** (24 checks, 10th suite;
real-CSV section skips with a count when absent). All 10 suites green; verified live in the browser
(guard arm/cancel/yes round-trip, back-route, copy, heatmap — console clean). **No SQL.** A separate
docs-only commit (no cache bump) carried the audit's doc-debt fixes (CLAUDE/STATE/DESIGN/ROADMAP/module
map) — details in the audit findings + CHANGELOG.

**Earlier — v3.82 #16: a window on the numbers** (cache **v92**, APP_VERSION v3.82): the Insights
stat grid gained a quiet **all-time · month · week** lens — a **scoped reinstatement** of what v3.65 retired,
on the RAW grid only (every observation surface stays prose/all-time; `insights-room-test.js` byte-identical
and green). **Calendar windows**: week = **Mon 00:00 local** (the Home week card's anchor — two surfaces can
never disagree under the same word, pinned in the fixture), month = the 1st 00:00 local; boundary sessions are
IN (`date >= start`). All six stats window honestly as pure session aggregates; `computeStats` now delegates
its all-time six to the new **`gridStats(sessions)`** (single writer — grid and achievements can't drift).
An always-present **eyebrow names the window** (screenshot honesty); empty windows render **quiet zeros**;
persisted device-local as `tealog_statPeriod` (the `tealog_teaDensity` precedent, garbage → all-time).
**Rider (#18 correction):** the Home "Running low" card is back to **LOW-only** membership via the named
predicate **`restockCandidate`** (steep-teas.js, beside the tier family) — v3.81's {low, few} put a 4.6-cup
"few" favourite (23g @ 5g dose) under the headline beside a ~6-month forecast; few's home stays the shelf
status line (scope/copy/forecast untouched; noted on #18's closed thread). New committed
`fixtures/stat-period-test.js` (67 checks: pinned calendar boundaries, per-stat windows through the production
card, week-card agreement, gridStats≡computeStats, quiet zeros, persistence whitelist, real-CSV monotonicity
with graceful skip); `status-line-test.js` 56 → 63 (additive H: restockCandidate low-only, the 23g case
verbatim). All 9 committed suites green (greeting untouched). **No SQL.** Next: **phase-2 (#15 + #9)** after
the ~Jul 20 gate.

**Earlier — v3.81 #18: a few cups left** (cache **v91**, APP_VERSION v3.81): the shelf status line's
quantity is now **session-aware** — cups left = on-hand ÷ the tea's average logged dose (`teaAvgDose`/`cupsLeft`/
`stockTier`, top of steep-teas.js). **<2 cups → "running low"** (clay, sorts top, unchanged) · **2–5 → "a few cups
left"** (NEW, ink-soft, deliberately **no sort effect**) · **≥5 → plenty** family, with **exactly 5.0 = plenty**
(defuses the one-big-gongfu-session outlier). **One grams-logged session anchors the average** (`teaForecast`
precedent; the dry-run showed only ONE real tea has ≥2 weighed sessions — a min-2 gate would have excluded the
issue's own Sencha); **no history → the `lowStockG()` floor decides exactly as before**, which is why fixture
sections A–E needed zero edits. Precedence **low → few → (ages | countdown | plenty)** — quantity wins while
remarkable, never composed ("fresh · a few cups left" doesn't exist). **One predicate family** (the #13 guard):
Low chip, header count, Cost-overview "Low stock" (its `goLowStock()` jump must agree with the chip it lands on),
detail red, and shopping suggestions all derive from `isRunningLow` := `stockTier==='low'`; the Home "Running low"
card swapped its 2×-floor band for tier ∈ {low, few} (fav/rebuy scope kept; few rows ink-soft; `teaForecast` ~days
untouched — it answers *when*, tiers answer *how many*; its dose now calls `teaAvgDose` so one definition exists).
`fixtures/status-line-test.js` **39 → 56 checks, purely additive** (F synthetic boundaries/precedence + G real-CSV
pins incl. the issue's 12g Sencha → "a few cups left"; G skips with a reported count when CSVs absent). All 8
committed suites green (greeting untouched). **No SQL.**

**Earlier — v3.80 #19 + #20: find your way** (cache **v90**, APP_VERSION v3.80): the QoL pair off the
post-R2 issue queue. **#19 Library search** — a quiet hairline row **below** the WS5 chips, filtering on
name · origin · cultivar · vendor(source) and composing with the chips as **AND** (one more clause in
`filteredSortedTeas`). German is first-class via **light normalization** (`teaSearchNorm`: lowercase, ß→ss, fold
diacritics — `gruner`≡`Grüner`, `strasse`≡`Straße`; folding only broadens, never hides — the deliberate tradeoff
over strict-umlaut); the query is folded **inside** `teaMatchesSearch` so the invariant is structural. **Focus-safe:**
the shelf body is split into `teaShelfHTML()` and each keystroke swaps **only** `#teaShelf`'s innerHTML
(`onTeaSearchInput`) — a naive `oninput→render()` would drop focus after one char (the standout catch). **Transient,
not sticky:** `goView` clears `state.teaSearch` only when leaving the Teas tab (`v!=='teas'`), so a search → tap a
tea → back round-trip keeps the term. Inline **✕** clears; empty state is a quiet "No teas match your search."
**#20 session → tea** — in `sessionRowHTML` the tea name + thumb are their own tap targets → `openTeaDetail(id,'sessions')`
(with `stopPropagation`, row still opens edit); tea-detail back button honours `'sessions'`; the session-edit modal
gains a quiet **"view tea →"** link (`es_viewTea`, closes the modal **first** so no overlay lingers). **Deleted-tea
edge:** "Unknown tea" gets no tap target and no modal link. New committed **`fixtures/tea-search-test.js`** (16 checks:
case, umlaut/ß fold incl. raw-query-to-predicate, multi-field, negatives, chip+search AND; real-CSV pass skips with a
reported count when the gitignored CSV is absent). `node --check` + all committed fixtures green; verified in-browser
at 390px both themes (filtering, focus retention, session→tea nav, deleted-tea edge). **No SQL.** Next: **#18 tiering**.

**Earlier — v3.78 WS4 Flavour: capture · story · honesty ladder** (cache **v88**, APP_VERSION v3.78):
the LAST R2 workstream and the only new feature. Three connected moments over the existing tags arrays (no SQL).
**Capture** (`flavorCaptureHTML`, steep-sessions.js): a reskin/upgrade of the per-steep tags field into inline
flavour-family chips beneath the WS3 timer — the 20-term `KB_FLAVOR_CHIPS` vocab grouped into **4 families**
(`KB_FLAVOR_FAMILIES`, steep-knowledge.js; umami+grassy in Vegetal & marine), two shown by default + "more" + a
free-text door; each tap toggles a tag on the active steep's `curSteepTags`, saved live. **Namespace = bare +
membership** (`isFlavorVocab`): free words stored bare, shown in "You tasted"/history but never inflate the
radar-unlock count or become a bar/axis; brew-advice matching untouched. **Story** (`sessionFinishHTML`): leads
with "Session complete", tea name, "You tasted" chips, a read-back card (observation + per-steep breakdown), an
**arrival-only** mood line; photo/rating/feedback/notes/share kept below; button → "Save to journal". History
cards show flavour chips + "· no notes" when empty. **Honesty ladder** (`teaFlavorProfile`/`flavorProfileHTML`,
steep-teas.js): the "What you taste" module over the **last 6 sessions with flavour data** — ≤2 → counted chips ·
≥3 → ranked bars (jade, amber for warm notes) · ≥5 & ≥4 distinct terms → radar unlock (6-axis SVG; bars stay
default via **non-persisted** `state.flavorView`). Every line an observation, never a %/score. **Rider:** 🍵/🫖
emoji thumbs → WS5-style tinted/kanji placeholders (`sessThumbHTML`, `.vessel-thumb.is-ph`). New committed
`fixtures/flavor-ladder-test.js` (66; family completeness + rung guard + free-word isolation + observation
honesty guard + graceful real-data pass). `#i-lock-hl` added (caret/plus already existed). `node --check` +
all committed fixtures green; xss-render bundle now includes steep-knowledge.js. **R2 batch complete.**
**Scope edge (deliberate; recorded at the 2026-07-13 audit): quick and cold-brew sessions can NEVER feed
the tea-page flavour profile** — they carry no steeps, and session-level tags don't count either; the
single choke point is `distinctVocab()` (steep-teas.js, reads only `steeps[].tags`). If that ever changes,
change it there, knowingly.

**Earlier — v3.77 WS1 Forms: core trio + one fold** (cache **v87**, APP_VERSION v3.77): fifth of the R2
design pass. Both first-run forms reshaped to **core essentials up front + one boolean fold**. Session setup: a
core-trio card (Tea·Vessel styled selects · Method segment) + brew readout + **amber-pale "How are you arriving?"
mood card** + "More details" fold (leaf/water/type/TDS/when/coldbrew, `d.showMoreDetails` render-on-state).
**Method 3-way-ready** via `SESSION_METHODS` array (phase-2 appends `japanese`); inferred from vessel capacity,
hidden for cold brew. Add/edit tea: photo dropzone·name·type up front + **"Specifics" fold** — a **DOM toggle**
(`toggleSpecifics`, not render) because the tea form reads fields on submit, so folded inputs must stay in the DOM
(caught+fixed a bug where the fold only opened). Mood chips now amber-selected. **Folded-in rider:** removed the
WS3 chime's `navigator.vibrate` (chime-only). Verified both themes (computed styles+DOM: mood `#F1DFC7`/`#3A2C1A`,
fold open/close + value survival). `node --check` + all 6 fixtures green. **NEXT: WS4 Flavour (last).**

**Earlier — v3.76 WS3 Steeping: the ensō is the timer** (cache **v86**, APP_VERSION v3.76): fourth of
the R2 design pass, the ritual hero. Reskins the existing timer engine (start/pause/tick/use-time unchanged). The
**ensō ring is the timer** — two SVG arcs (track + `--enso`), 236px, `sc-breathe`, arc closes via `stroke-dashoffset`
off `focusProgress`; deliberate theme inversion (amber arc on dark-green box light / ink-jade arc on light-green
box dark, `--jade-deep` box + `--porcelain` foreground). **Steeps are the brew-guide pills** (`d_setActiveSteep`
retargets the ring + "of Ns · steep N" label; active pill amber both themes) — `dotsRow` header gone. **Focus mode
rebuilt** as a real breath-led dark state (`#100F0B` glow + mala down the edge + halo/breathe-slow/digit + "breathe
out" cue; tap ring=pause, swipe-up=leave via bindDynamic); **retires the 🧘 emoji**. **Sound OFF by default**
(`soundEnabled` flipped); mute glyph `toggleSound` → one gentle 880Hz chime (was 3-beep+vibrate). New committed
`fixtures/steeping-timer-test.js` (17). Reduced-motion honoured. Verified both themes (computed styles+DOM). Kept
v3.68's reversible "hide" over the mock's lossy "turn off". **NEXT: WS1 Forms.**

**Earlier — v3.75 WS5 Library: photo shelf + one status line** (cache **v85**, APP_VERSION v3.75): third
of the R2 design pass. The tea library is a **photo shelf** with **one type-aware status line per card** (same
slot/weight; only words + tone change). Core logic `statusLine(tea)`→`{text,tone}` (steep-teas.js), tone ∈
low(clay·sorts-top)/freshness(ink-soft)/plenty(jade)/ages(jade): low→"running low"; white/pu'er→"ages
well/gracefully"; delicate green/yellow near harvest window→"best within N wks" else "fresh, plenty";
oolong/black→"plenty". `freshnessWeeksLeft` reuses harvestYear/Season. **grid⇄rows density toggle**
(persisted device-local `tealog_teaDensity`); CSS photo fallbacks (striped stripe / 白·餅 kanji). **Ratings left
the card** (reconciliation #4 — still on detail); **chip filters** (All·types·Low·Favs) replaced the sort/vendor
dropdowns. New committed **`fixtures/status-line-test.js`** (37, over the real teas). **Design-conflict call:**
mock renders oolong "plenty" vs README prose "ages" → resolved to mock + existing freshnessClass (ages = white +
pu'er only). Verified both themes × both densities (computed styles + DOM); console clean; `node --check` + all 5
fixtures green. **NEXT: WS3 Steeping.**

**Earlier — v3.74 WS2 Home: greeting-led, glance-only** (cache **v84**, APP_VERSION v3.74): second of
the R2 design pass. Home is **glanceable ritual state, not a dashboard** — default cards reduced to **greeting ·
running low · favourites · one number**. The greeting is a **reskin, not a rebuild** (reconciliation #2): the
`greetingCardHTML` engine is untouched (buckets/ack/variety/rediscovery + all greeting-v4 coverage stay); only
the `card()` wrapper changed — mono eyebrow (`weekday + bucket`, weekday forced to English e.g. "Friday
evening" — chrome only, user input untouched) over a Shippori 700 32px headline, engine line as body (`.greeting-*` classes + `--greeting-eye`/
`--greeting-body` tokens). **Stat grid gone from Home:** `DASH_SURFACE` relocates `totals`/`clock`/`cost`/`recent`
to **Insights** (moved, not deleted — still editable/hideable, nothing stranded). New `week` card = sessions since
Monday (the one number). Favourites → quiet leaf+name list; running-low amounts → clay (red/amber urgency
dropped). Fixtures needed a 2-line update (the body extractor + well-formed-card assertion re-pointed at the new
markup — copy assertions unchanged). Verified both themes at 390px via computed styles + DOM (tokens exact;
relocation confirmed); console clean; `node --check` + all 4 fixtures green. Screenshots time out on the auth
gate (known) — verified by computed-style/DOM. **NEXT: WS5 Library.**

**Earlier — v3.73 WS6 navigation shell** (cache **v83**, APP_VERSION v3.73): first of the R2 design
pass. Top tab strip + 5 header icons → **bottom tab bar** (Home · Teas · [Log raised] · Sessions · Insights)
+ header shrinks to **wordmark + avatar → hub sheet** (friends/shopping/passport/**achievements-gated**/
settings — same routes, new entry point; Achievements gated on `ACHIEVEMENTS_ENABLED`=false, not reintroduced).
All in `steep-core.js`'s `render()`: new `bottomNavHTML`/`navRecedeHTML`/`hubSheetHTML`/`hubIdentity`/`toggleHub`/
`closeHub`/`hubGo`/`restoreNav`; `state.hubOpen`/`state.navRestored`. Active tab derived from `state.view` (no
parallel nav state). **Steeping recede:** the bar collapses to a "swipe up for navigation" handle while a steep
runs (`navRecessed = view==='session' && draft.stage==='steeping' && !navRestored`); tap/swipe-up (`restoreNav`)
restores it; `navRestored` resets at `beginSteeping`. 5 new bottom-bar icon symbols in index.html's sprite;
`--nav-active`/`--nav-inactive` tokens (both themes). Browser-verified both themes at 390px (active/Log colours,
hub gating, recede+restore), console clean, `node --check` + all 4 committed fixtures green. **NEXT: WS2 Home.**

**Earlier — v3.72 hide achievements app-wide (issue #6)** (cache **v82**, APP_VERSION v3.72): last
item of the cleanup tail — Pillar F is **done**. The scrapped 8-bit achievements/confetti go dormant for
everyone via one switch, `ACHIEVEMENTS_ENABLED = false` (steep-core.js), which gates the header 🏆 button, the
`achievements` route, the whole "Calm & achievements" Settings section (both rows), and the unlock
confetti/toast — **regardless of any stored `showAchievements`/`quietMode`** (default also flipped false).
`quietMode` only ever affected achievements, so nothing else is stranded. Code kept intact (`ACHIEVEMENTS`,
`computeAchievements`, `viewAchievements`, `syncAchievements`); `syncAchievements` still runs its
`seenAchievements` bookkeeping so a future re-enable won't burst old unlocks — flip the constant to revive.
Browser-verified dormant with `showAchievements:true` forced on. **Issue #6 → close with a changelog link.**

**Earlier — v3.71 greeting v4 follow-up** (cache **v81**, APP_VERSION v3.71): copy polish (`"leaves are spoiled
today"` → `"well looked-after today"`) + absorbed the durable pre-v4 greeting invariants (predicted-vs-actual,
variety guard + fallback, window-aware redirect) from the local never-committed `greeting-test.js` into the
**committed** `greeting-v4-test.js` (now 47 checks / 36 bare). Issues #4 + #5 **closed** against v3.70. The
stale local `greeting-test.js` is superseded — safe to delete (left in place; not mine to remove).

**Earlier — v3.70 greeting v4, habit-aware (issues #4 + #5)** (cache **v80**, APP_VERSION v3.70):
the biggest deploy in the tail. Three ingredients in `greetingCardHTML` (steep-dashboard.js): (1) **zero-session
evening** — history exists, nothing today, brewing windows passed unused → a **guilt-free, playful** line
(tea/kettle/shelf as the character, never the user's absence; evening-only, gone by morning, never counts).
Deliberately overrides issue #4's raw "no time for tea today?" — the addendum decided guilt-free. (2)
**more-than-usual day** — `d_typicalPerDay` (today excluded, 5-day signal); today beats it → celebratory
count-aware ack, never nagging. (3) **rediscovery** — deterministic ~1-in-4 days (`d_hash(todayKey+'|shelf')
% REDISCOVERY_ODDS`), the day's pick becomes the most-neglected in-stock tea (never brewed / quiet ≥
`REDISCOVERY_WEEKS`=3) in a "remember this?" register. All normal pools expanded 2–3 lines. New committed
suite `fixtures/greeting-v4-test.js` (35 checks, incl. real-CSV grounding) — must stay green. `node --check`
clean; browser-verified the branches render + console clean. **Copy pools await Niklas's strike.** **Issues
#4 + #5 → close with a CHANGELOG-linking comment (needs auth/`gh`).**

**Earlier — v3.69 what's-new line on the update banner** (cache **v79**, APP_VERSION v3.69):
third of the cleanup tail (ROADMAP-v4 Pillar F), a small rider — and the first *live* `/slowcup-deploy` run
(dry-run first proved the registry loaded, then dropped `dry`). The v3.27 update banner showed only "A new
version of SlowCup is ready." with no hint of the contents; now a `WHATS_NEW` constant beside `APP_VERSION`
(steep-core.js) renders as a second quiet line under the headline in `showUpdateBanner` (steep-boot.js) — one
line, no list, no link-out, `typeof`-guarded for clients on a stale cached core. This deploy's copy is
self-referential: **"Updates now tell you what changed — like this."** Deploy ritual gained **step 2c**
(CLAUDE.md): bump `WHATS_NEW` each deploy alongside `CACHE_NAME` + `APP_VERSION`. `node --check` clean on all
three touched files; committed fixture suites green. **NEXT in the tail:** **v3.70** greeting v4 habit-aware
(issues #4+#5) → **v3.71** achievements hide (issue #6), then the tail is empty.

**Earlier — v3.68 in-session brew guide "hide" (issue #1)** (cache **v78**, APP_VERSION v3.68):
second of the cleanup tail (ROADMAP-v4 Pillar F). Fixes the "in-session turn off link gives weird feedback"
bug. Mid-steeping, the schedule strip's **"turn off"** called `d_setBrewMode('off')` — which reset
`timeShift` to 0 (silently discarding the accumulated "+Xs vs guide" nudge) and set `brewMode='off'`, but
never nulled `d.schedule`, so the card stayed put: you tapped it, nothing turned off, and your nudge
vanished. Now the link is **"hide"** (`d_hideStrip()`, steep-sessions.js) — a reversible visual collapse
that leaves `brewMode`/`d.schedule`/`timeShift` intact and sets `d.scheduleHidden=true`; `scheduleStripHTML`
shows a one-line "Brew guide · hidden · show" ghost (`d_showStrip()` restores it), and the nudge row hides
with it and comes back with the same carry. `scheduleHidden` resets at `beginSteeping`. Setup preview's
**Off** segment (`d_setBrewMode('off')`) unchanged. `node --check` clean; both themes browser-verified.
**Issue #1 → close with a comment (needs auth).** **NEXT in the tail:** **v3.69** what's-new banner
(`WHATS_NEW` const) · **v3.70** greeting v4 habit-aware (issues #4+#5). Also newer inbox: issues #6–#11
(remove achievements/confetti · Gaiwan icon · brew-advice "how was it" richer · settings overhaul ·
map/passport into design · favorite-leaf visibility). Close issue #3 (workflow Q). Launch checklist in
ROADMAP-v3-next.md.

**Earlier — v3.67 greeting v3, session-aware** (cache **v77**, APP_VERSION v3.67): first of the
renumbered cleanup tail (ROADMAP-v4 Pillar F). `greetingCardHTML` (steep-dashboard.js) gains a
**session-aware branch** (fixes issue #2): a session logged in the current time-of-day bucket → the card
**acknowledges** it (predicted-vs-actual — "Good choice — the {name} it is." if the day's deterministic
pick was taken, warm surprise "The {name} instead — didn't see that coming." if not; never scores the
prediction) → then **forward-suggests** for a later active window or **rests**, never a third-cup nudge.
**Same-day type-variety guard** (`VARIETY_GUARD_SAME_DAY`, on) keeps it from suggesting the just-logged
type again today ("not two greens in a row"); falls back to rest if every candidate shares the type.
Shared `d_scorePick(target,todayKey,excludeIds,excludeType)` extracted; `d_copyPick` gained a `salt` so
ack + tail draw independently. No-session branch unchanged. Validated local `fixtures/greeting-test.js`
(now 44; normal-branch sweeps moved to a sessionless mocked day); both themes browser-verified.
**Issue #2 → close with a comment (needs auth).** (v3.68 above superseded this block's "NEXT" tail.)

**Earlier — v3.66 feed pagination + social inline notice** (cache **v76**, APP_VERSION v3.66):
resumes the SlowCup batch tail after the design rework. `getFeed(limit,offset)` (steep-data.js) paginates
via `.range()` + secondary `.order('id')` tiebreak and returns `hasMore`; `loadMoreFeed()` (steep-social.js)
appends the next page de-duped by session id; a quiet "Load more" ghost button (no infinite scroll). The
**last `alert()` in the app is gone** — `socialErr` now sets `state.social.err` → a dismissible sticky
`.social-notice` on the Friends view (same message branches; themes both; cleared on next action or ×;
`dismissSocialErr`). Both themes browser-verified; `node --check` clean. **NEXT:** a **docs commit**
reconciling `ROADMAP-v4.md` + `TASK-issues-triage-addendum.md` (Downloads) into the repo, then the cleanup
tail continues: **v3.67** greeting v3 session-aware (issue #2, EXTENDED — predicted-vs-actual acknowledgment
+ same-day type-variety guard) · **v3.68** in-session turn-off fix (issue #1) · **v3.69** what's-new banner
· **v3.70** greeting v4 habit-aware (issues #4+#5 — out-of-habit lines + rediscovery pick; zero-session
line DECIDED guilt-free/playful). Close issue #3 (workflow question) with the convention comment. The
**slowcup.app launch checklist** lives in ROADMAP (register domain · reshoot 3 screenshots · root/index
split · install guide).

**Earlier — v3.65 WS2 Insights overhaul** (cache **v75**, APP_VERSION v3.65): the LAST of the
4-workstream design rework — **the rework is complete**. `viewInsights()` is now a curated reflective room
built from insights-surface dashLayout cards (Home stays editable): a jade-pale **hero observation**
(window-aware eyebrow "This week, mostly"→"Lately"→"Mostly"; Shippori sentence "Green, and mornings.";
12-bar time-of-day rhythm folding in the brewing clock; one supporting line), then hairline-separated
readings in a shared tiny data-viz family — cadence **sparkline** (8 weeks, jade), **type bar** (fixed
`.dot-*` colors) + mono legend, ascending amber **steep-shape** line + ledger caption, two quiet **notes**
(leaf = most reached-for, hanko = highest note), and a deep-jade **Wrapped teaser** into WS1. **Register:
observations, not KPIs** — the old "vs last ↑" arrow row is gone; no arrows/%/targets anywhere (guarded by
`fixtures/insights-room-test.js`, 33). Retired the recap grid + all-time toggle (`recapHTML`/`computeRecap`/
`insightsHTML`/`wrappedTeaser` removed; Home totals still carry raw numbers). New `.ins-*` classes. Both
themes browser-verified (computed styles + screenshots). **NEXT — v3.66 feed pagination** (+ fold `socialErr`
`alert()` → sticky inline notice), resuming the SlowCup batch tail; then the renumbered cleanup order
(v3.67 greeting-v3/issue #2 · v3.68 in-session turn-off/issue #1 · v3.69 what's-new banner). A **slowcup.app
launch checklist** now lives in ROADMAP (register domain · reshoot the 3 landing screenshots · root/index
split · install guide). Niklas: after v3.65, a slow scroll through the whole app on your phone (both themes)
is worth it — the Insights tab's Wrapped teaser is now one tap from the swipeable season.

**Earlier — WS4 slowcup.app landing page** (NO cache/APP_VERSION bump — was cache **v74**,
APP_VERSION v3.64): third of the 4-workstream design rework. New self-contained **`landing.html`** at repo
root + **`landing-assets/*.png`** — a static marketing page: inline CSS + inline SVG sprite, Google Fonts,
**no JS/cookies/analytics**, theme via `@media (prefers-color-scheme: dark)` over the `:root` token set.
Sections: nav · hero (Shippori "The calm tea log." + faint amber ensō, jade "Request an invite") · 3
dark-bezel device screenshots (middle raised) · 3 philosophy beats (leaf/ensō/share chips) · jade-deep CTA
panel (seigaiha + amber button) · footer. All CTAs `mailto:slowcupapp@gmail.com`. **Deliberately no PWA
cache / APP_VERSION bump / FILES_TO_CACHE change** — it touches zero app files, so invalidating testers'
caches would be wrong (flag this reasoning if a future session expects a bump). **Two TODOs before
slowcup.app goes live** (flagged in an HTML comment + CHANGELOG): (1) reshoot the placeholder screenshots —
the bundle ones predate WS3/WS1 and `app-tea-detail.png` still shows the old **"Steep"** wordmark
(pre-v3.59 rename); (2) decide the root/`index.html` split for the domain (part of the deferred domain
migration — slowcup.app not yet registered). Browser-verified both themes + mobile, no console errors.
**Last workstream (own deploy, pause after):** WS2 Insights overhaul (`viewInsights` in steep-insights.js;
inherits WS3+WS1 — hairline top-borders not boxed cards, one jade-pale hero observation, a tiny reusable
data-viz family, observations-not-KPIs copy, quiet Wrapped teaser). Then back to the SlowCup batch's last
item: feed pagination (+ socialErr inline notice).

**Earlier — v3.64 WS1 SlowCup Wrapped** (cache **v74**, APP_VERSION v3.64): second of the
**4-workstream design rework** (order WS3→WS1→WS4→WS2; **pause after each**). `viewWrapped()`
(steep-insights.js) is now a horizontal scroll-snap sequence of full-width `.wrap-card` story cards
(seasonal jade/amber/porcelain wash via new `--wc-*` tokens in both theme blocks + catalogue
numbering + hanko-sealed standout plate; cover ensō, closing seigaiha; reuses the WS3 sprite). Up to
8 cards — cover · sessions · time-at-the-table · companion · rhythm · new-this-season · standout ·
kept/share — degrading gracefully: `wrappedKinds()` drops any missing-stat card and the numbering
re-flows (time card falls back to cold-brew count; cover/sessions/kept always present). Only JS is
dot-tracking (`bindDynamic` in steep-core, rAF-throttled) + tappable dots (`wrapGo`, respects
reduced-motion) + share (`shareWrapped`, kept; `wrappedShareText` reworded to the agreed format).
Empty state + "SlowCup Wrapped" name kept. Validated `fixtures/wrapped-cards-test.js` (committed,
data-free, 22 — degrade/numbering/footer/cold-fallback/overflow/hanko/share). Browser-verified BOTH
themes via injected `computeWrapped()` sample (screenshots still time out on the auth gate, so DOM/
computed-style eval): fields+fonts+accents resolve per theme, dark active dot stays amber (`--wc-enso`).
**Remaining workstreams (own deploys, pause after each):** WS4 slowcup.app static landing page (new
file) · WS2 Insights overhaul (viewInsights). Then back to the SlowCup batch's last item: feed
pagination (+ socialErr inline notice).

**Earlier — v3.63 WS3 design language** (cache **v73**, APP_VERSION v3.63): first of a
**4-workstream design rework** (`design_handoff/`, order WS3→WS1→WS4→WS2). Display font Fraunces →
**Shippori Mincho** (new `--font-display` token, headings weight 700, all inline refs swept); header
emoji → **hairline stroke icons** (hidden `<svg><defs>` sprite in index.html + `icon()` helper in
steep-core; `.hl` stroke 1.7 light/1.9 dark); favourite ♥/★ → **tea leaf** (`favLeaf()`/`.i-fav`) on
tea cards, running-low, detail pill, filter chip, shopping; **ensō ring** on the steep timer (fills via
stroke-dashoffset each tick; new `--enso` token amber-light/dark-jade); hanko+seigaiha defs added for
WS1/WS2. Verified both themes in-browser. **DESIGN.md updated** to Shippori + accent vocab.
**Remaining workstreams (own deploys, pause after each):** WS1 SlowCup Wrapped swipeable story cards
(viewWrapped/steep-insights) · WS4 slowcup.app static landing page (new file) · WS2 Insights overhaul
(viewInsights). Then back to the SlowCup batch's last item: feed pagination (+ socialErr inline notice).

**Earlier — v3.62 freshness cues + sparkline rider + night-copy patch** (cache **v72**,
APP_VERSION v3.62): tea detail gains one soft italic line under Harvest — fresh greens "at its best
young", whites/pu-erh "deepens with age" — requiring a valid year (season optional), silent on
garbage/neutral styles (`freshnessCueHTML` in steep-teas.js; exactly 2 fire on real data). Rider:
"add a purchase date" link where `inventorySparkline` is absent only for want of a date. Night-copy
patch: active-with-history line 3 now reads "tonight" not "this late-night" (steep-dashboard.js).
Validated `fixtures/freshness-test.js` (local, 11) + `greeting-test.js` (now 32). **[Superseded — these
version numbers were reassigned when the design rework (v3.63 WS3 · v3.64 WS1 · v3.65 WS2) pulled ahead;
see "Continue here" + ROADMAP for the real order: v3.66 feed pagination · v3.67 greeting-v3 · v3.68
in-session turn-off · v3.69 what's-new banner.]**

**Earlier — v3.61 greeting copy variety + APP_VERSION** (cache **v71**): each greeting
branch draws from a small approved pool via `d_copyPick(pool,todayKey)` = `d_hash(todayKey+'|copy')
% len` — one voice per calendar day, seeded apart from the tea pick so it doesn't reshuffle on
re-render (steep-dashboard.js). New `APP_VERSION` const in steep-core.js (='v3.61') feeds the feedback
mailto subject + a quiet Settings-footer version label; **deploy ritual now bumps APP_VERSION too**
(CLAUDE.md step 2b). `fixtures/greeting-test.js` extended to 30 assertions (pool membership + variety
+ one tea-name link/line + same-day determinism). **Note for Niklas:** active-with-history line 3
renders "this late-night" for a night-active user — strike/reword if it grates. **SlowCup batch
continues (pause after each):** v3.62 freshness cues (+ sparkline "add a purchase date" rider) ·
v3.63 feed pagination.

**Earlier — v3.60 error log + data health + feedback** (cache **v70**): Settings → Data
gains three read-only tools. A device-local `tealog_errorLog` ring buffer (last 20) fed by
`window.onerror`/`unhandledrejection` + `saveErr` (`logError`/`readErrorLog`/`clearErrorLog` in
steep-core; hooks installed at load; never surfaces proactively — only viewable/clearable in
Settings). An on-demand `dataHealthReport()` (steep-settings): deleted-tea sessions, deleted-vessel
sessions, negative stock, empty sessions (the client-visible stand-in for DB-orphaned steeps, which
the sessions load drops), duplicate pairs (same tea ≤10 min). A `mailto:slowcupapp@gmail.com` feedback
row (subject "SlowCup v3.60 feedback", hardcoded — no APP_VERSION constant yet). Validated
`fixtures/data-health-test.js` (local): real export clean on all 5, each detector fires on injected
bad rows. **SlowCup batch continues (pause after each):** v3.61 greeting copy variety · v3.62 freshness
cues (+ sparkline rider) · v3.63 feed pagination.

**Earlier — v3.59 rename Steep → SlowCup** (cache **v69**): user-facing brand only,
per `TASK-slowcup-batch.md` §1 (supersedes the forgotten-batch TASK). Renamed title/manifest/topbar/
login/onboarding/Wrapped-labels+eyebrows+share-text/backup-filename+import-toast/update-banner/
migration-screen; internal names + repo/URL + "steep" terminology untouched. **The SlowCup batch
continues (pause after each deploy):** v3.60 error log + data health + `mailto:slowcupapp@gmail.com`
feedback row (Settings → Data) · v3.61 greeting copy variety · v3.62 freshness cues (+ sparkline
"add a purchase date" rider) · v3.63 feed pagination. Feedback mailbox DECIDED: slowcupapp@gmail.com.

**Earlier shipped:** v3.29 leaf-form curves · v3.30 in-session micro-adjust · v3.31 mood check-in ·
v3.32 forecast coverage + brew-guide parse · **v3.33 curated passport sub-regions + China/Japan zoom**
(curated tea-region map, not full geo — later REJECTED, see below) · **v3.34 settings declutter**
(settings grouped into sections; new `showMood` toggle to hide the mood check-in — the future Garmin
on/off; brew-guide + advice grouped under one "Brew guidance" block) **+ change vessel on a saved
session** · **v3.35 fix: double stock decrement** (re-entrant `commitSession`/`saveSessionEdit` double-
fire subtracted `gramsUsed` twice; fixed with a shared `_sessionSaving` guard. Offline queue was NOT the
cause — absolute-value upserts replay idempotently. Deeper fix later: derive stock instead of accumulating
it) · **v3.36 XSS sweep** (shared `escapeHtml`/`escapeJsArg`; escaped every user-text render site, fixing
stored cross-user feed XSS; replaced 4 local escapers) · **v3.37 hygiene** (re-entrancy guards on
`deleteSession` + the 3 form submits; `teaToDb` preserves `created_at` insert-only so import keeps dates;
deduped view allowlist → `PERSISTED_VIEWS` and time-of-day → `timeOfDayBuckets()`; cut unused
`getFollowers`) · **v3.38 tea knowledge base** (new `steep-knowledge.js`; `inferLeafForm` consults
`kbResolve` on name+cultivar+origin — fixes the parked Japanese-cultivar/silver-bud misses; gentle
KB type/origin prefill in the tea form) · **v3.39 tea picker grouped by type** (session picker
`<optgroup>`s + Teas-tab default "By type" sort; `TYPE_ORDER`/`groupTeasByType` in core) · **v3.40
tea lifecycle** (`isTeaFinished`/`isAmountTracked`; finished teas group at bottom of Teas tab, hidden
behind "show finished" in the picker but still loggable, one-time "rebuy?" → shopping list; finished
teas still count in all stats — tracked-and-≤0 is finished, untracked-0 is in-stock) · **v3.41 dancong
brew baseline** (own `KB_STYLES.dancong` @ 90°C; dancong keywords remapped off `strip_oolong`; new
`knowledge/brew-guides.md` reference layer — not app-loaded, consult when tuning brew baselines;
deferred: extend the opening-dip to oolong `LEAF_PROFILES` curves) · **v3.42 brew accuracy** (LEAF_PROFILES
retune — opening dip now on oolong/bud/compressed, moderate bases; matched KB style's `first` is the
generation base; KB ball_oolong 95/3.5/45, longjing 78; validated vs fixtures/steeps — Ali Shan → 45/27/27).
· **v3.43 silver needle glass note** (KB `silver_needle` note adds "also classic in glass: 80°C, ~4 min";
baseline unchanged) · **v3.44 Insights tab + dashboard split** (new `steep-insights.js` owns the analytics
cards; nav gains Insights; `DASH_SURFACE` makes the editable `dashLayout` per-tab with lossless migration;
recap gains "All time"; heatmap/streak stay on Sessions per Niklas). **Next: Brew advice v2** — capacity-
capture precursor (v3.56 ✓) and ratio phase 1 (v3.57 ✓ shipped). **Brew advice v2 phase 1 is DONE** —
phase 2 (learned defaults) WAITS on a monitoring window of ratio'd sessions (separate spec). Now working
the **forgotten batch** (`TASK-forgotten-batch.md` in Downloads): v3.58 popup sweep ✓, then v3.59 error
log + data health, v3.60 freshness cues, v3.61 feed pagination — pause after each. Install guide SKIPPED
(parked-with-reason: slowcup.app domain not decided — installed PWAs bind to origin). Cache **v68**
(v3.58: **finished the popup sweep** — last 8 `alert()`/`confirm()` gone. steep-settings.js clean:
photo-migrate confirm → `armConfirm(this)` (+`doMigratePhotos`), import replace-all → state-driven inline
confirm row `state.pendingImport`/`importConfirmHTML()` keeping both counts + friction (NOT a toast),
notices → toast. steep-core `saveErr` offline-sync alert → long-lived toast (~12s); `showToast(msg,ms)`
gained a duration arg. Only `socialErr` alert remains — out of scope, online-only diagnostics.) Cache **v67**
(v3.57: **leaf-to-water ratio — the 3rd advice axis**. STRICT OPT-IN `ratioAdjust` (default OFF; off =
byte-identical). `actualRatio=gramsUsed/(waterMl/100)` vs a per-method baseline → `timeFactor=
clamp(1/ratioFactor^0.6,0.6,1.4)` scales the whole schedule (temp NOT touched). Ordering base→ratio→
feedback→timeShift (`computeBrewAdvice(tea,baseOverride)`). Engine in steep-core.js: `computeSessionRatio`/
`baselineRatioFor`/`ratioScaleSchedule`/`bg_extractRatio`/`brewMethodFor`/`ratioMemoryText` + tunables next
to LEAF_PROFILES. Baseline order: guide grams+ml → KB method ratio → leaf-form default. **Dual-method KB**:
`ratioGongfu`/`ratioWestern` where methods differ (greens g3.0, whites g4.5, yellow g3.5, puerh g5.0, ball
w0.8, dancong w1.0, strip/dark g4.5); **JP-green westerns raised** sencha/shincha 1.8, kabusecha 2.0,
fukamushi 1.8 (agreed w/ Niklas 2026-07-09). Setup (opt-in on): Gongfu|Western switch (prefill cap≤150→gongfu)
+ optional Water(ml) override; `sessions.water_ml`/`brew_style` (`sql/v3_8-water-ml.sql`, applied) via mapper
pairs + both write paths; method stored for phase-2. Validated `fixtures/ratio-test.js` (local, 47) over all
10 real sessions — floors→gentle trims (Fujian White 0.89, Huang Ya 0.98). v3.56: **capacity-capture
precursor** — groundwork for the ratio axis. All vessel/session views live in steep-sessions.js. Vessel form
Capacity field gains a soft hint + example placeholder (still optional); vessels list shows a quiet "· ml?"
tap-to-edit affordance on capacity-less vessels; session setup shows an inline "set capacity" link under the
Vessel picker when the chosen vessel lacks one (`selVes`/`capLink`, opens the edit overlay, draft persists).
Never a banner, never blocks logging. No SQL. v3.55: **greeting card v2 — window-aware**.
`greetingCardHTML` (steep-dashboard.js) now checks whether NOW is inside the user's real drinking window: a
time-of-day bucket is *active* if it holds ≥2 sessions or ≥15% of total, needs ≥5 sessions of signal (else
v3.54 behaviour). Inactive-bucket → scan `BUCKET_CYCLE` forward to the next active window and suggest FOR it
with forward-looking copy (night → "waiting for the morning"; wrap → "tomorrow {bucket}"; later-today →
"{this afternoon/…}"); greeting h2 still truthful to now. Scoring targets the destination bucket;
`brewedToday` excluded only when target window is still today. Validated `fixtures/greeting-test.js` (now
reads from `fixtures/`) against fresh CSVs — Niklas's data: morning 7 / afternoon 5 active, evening/night
inactive → 22:00 forward-to-morning, 19:00 "tomorrow morning", 09:00 now-copy, <5 = v3.54; 21 assertions.
v3.54: **greeting card** replaces the removed
persona slot — `greetingCardHTML` (steep-dashboard.js), first in `DASH_DEFAULT_ORDER`, a time-of-day
greeting + one deterministic-per-day tea suggestion scored by same-bucket history (date-seeded tie-break);
`isTeaFinished`/brewed-today excluded; calm fallbacks; no seasonal word (hemisphere-ambiguous). Validated
in the vm sandbox against real CSVs (`fixtures/greeting-test.js`, local). v3.53: **Pixelify Sans retired →
IBM Plex Mono** via `--font-mono`; Google-Fonts weight swapped, Pixel/Clean Settings toggle + `monoFont` +
`html[data-mono="clean"]` retired, `applySettings` now a no-op, eyebrow tracking `.1em → .06em` so long
"Suggested brew · …" eyebrows don't wrap on 375px. v3.51: tea detail renders a structured
"Brew guide · saved" card for teas WITH a guide — `savedBrewHTML` in steep-teas.js parses via
`effectiveGuideSchedule`, raw text preserved in the card, temp-only guides show the leaf-form schedule
flagged as generated, plain-text fallback when brewAdvice is off or nothing parses. v3.52: **Tea persona
removed** — `computePersona` + the `persona` card + `.persona` CSS deleted; saved dashLayouts self-heal
via the unknown-id filter. **Next: Brew advice v2** — capacity-capture precursor, then ratio phase 1
(`sql/v3_8-water-ml.sql`; see `SPEC-brew-advice-v2.md`). v3.50: swept `confirm()`/`alert()` out of
steep-sessions/steep-teas — new shared `armConfirm(btn,message,onYes)` in steep-core.js does an inline
two-step "Yes / Cancel" via DOM swap (no re-render, so unsaved fields survive); `alert()`s → `showToast`.
Remaining popups only in steep-settings + steep-core offline error. v3.49: `scheduleToGuideText` emits raw-second times so
a saved guide round-trips through `parseBrewGuide` exactly — the old `fmtSecShort` "1m15s" reparsed as 60s
and truncated the run, corrupting any ≥60s+remainder steep in save-tuning-as-guide; `saveSuggestedGuide` now
reuses that one emitter. Locked in by **`fixtures/brew-roundtrip-test.js`** — the first *committed* fixture
test (rest of `fixtures/` stays gitignored), asserting schedule→text→parse identity for every LEAF_PROFILES
family + KB style. v3.48: tea detail shows a calm "Suggested brew" card for teas with no saved guide —
`suggestedBrewHTML`/`saveSuggestedGuide` in steep-teas.js surface the timer's KB/leaf-form schedule
(temp/ratio/first steeps) with a source label and a save-as-guide button; gated on the `brewAdvice` opt-out.
v3.47: dashboard edit
mode can move a card between Home and Insights — `dashMoveToSurface` writes a per-user `dashLayout.surface`
override that `dashSurface` layers over `DASH_SURFACE`; both tabs build the full card map via shared
`dashCards()`. v3.46 folds
Vessels into the Teas tab behind a Teas|Vessels segmented control; nav = Home·Teas·Sessions·Insights;
`state.teaSeg` tracks the segment, `goVessels()` is the deep-link target. Friends is a 👥 topbar icon).
**v3.33 detail:** `PASSPORT_SUB` in steep-passport.js holds curated sub-regions per country (China,
Japan, Taiwan) placed by lat/lon on the existing grid. `passportSubFor(country,tea)` matches within the
parent country only. Tapping China/Japan zooms the SVG viewBox and shows sub-region pins; other
countries surface sub-regions as panel chips. New state `passportZoom`/`passportSub`.
**NEXT (fresh chat):** decide the real focus. The passport is **PARKED** — the dot-map (v3.33/34) was
rejected: you can't recognise countries or borders, "just dots." Redo later with **drawn country
outlines + borders** (simplified SVG/TopoJSON of tea nations only, not full world geo), choropleth by
count, keep the China/Japan drill-down. The parsing/aggregation layer (`passportCountryFor`,
`passportSubFor`, `PASSPORT_GEO/SUB`) is reusable — only the dot rendering gets replaced.
Recommended focus order (my call, Niklas hasn't picked yet): (1) **settings declutter + Insights tab**
— cheap, low-risk, reuses the editable-dashboard registry; (2) **leaf-to-water ratio** (the longest-
parked, highest-leverage item — the missing 3rd advice axis + unlock for learned defaults) with a design
pass first, incl. a `capacityMl`-capture precursor since it's sparse; (3) map redesign when there's appetite.

**Bugs/ideas/feedback now live in GitHub issues, not here.** Open issues (`Tosinik/steep-tea-log`,
public) are the live queue alongside the ROADMAP — fetch them at session start (see CLAUDE.md
"Open issues are the live inbox"). Triage labels: `bug` / `idea` / `feedback`. This replaces the
old beta-feedback batch list. (Leaf-form inference misses — the one previously-listed bug that got
fixed — shipped v3.38: `inferLeafForm` consults `kbResolve` first, so add coverage to the KB tables,
not `inferLeafForm`. The remaining in-session `d_setBrewMode('off')` bug is now issue #1.)

**Product backlog from Niklas (capture — discuss/prioritise in the fresh chat):**
- **Settings declutter:** group settings into sections (getting long). Add a toggle to **hide the mood
  check-in** (one switch, later doubles as the Garmin on/off). Group **brew-guide + advice** under one
  settings block that can hide/disable them individually or together.
- **Separate Insights tab to declutter Home** (Home scroll is long). Keep on Home: standard info. Move
  to Insights: the Insights card, most-brewed, top-rated (cost overview + running-low + brewing-time
  probably stay — confirm with Niklas). Reuses the editable-dashboard registry pattern.
- **All-time option for the recap/Wrapped** (currently period-limited).
- **Leaf-ratio adaptation (leaf:water) — the missing 3rd advice axis.** Still parked as "scale steep
  times by leaf amount". Niklas sees this as central: brew advice should adapt on all three of
  **leaf-to-water ratio (gramsUsed vs vessel ml), temperature, and time**. Today advice tunes temp+time
  only; adding ratio is the parked item AND the unlock for trustworthy "learned defaults" (normalising
  across sessions). Worth a design pass early in the brew-advice v2.
- **Recurring check-in — data captured but under-used:** `harvest_year`/`harvest_season` (freshness
  cues, Wrapped), `cultivar`/`origin` (world map + a future cultivar map), `waterTDS`/`waterType`
  (water-profile insights, parked), `mood` (Garmin/sleep epic), per-steep `feedback`/notes.

**Open enablers:** caffeine field, paused-days, first Edge Function. **Tunable now:** `LEAF_PROFILES`.
Parked/small: v3.28 sparkline staircase + Home-card sparkline; per-form default temps; roll a consistent
in-session nudge into saved tuning.
