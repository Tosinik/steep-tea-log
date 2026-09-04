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
- **Supabase:** Site URL is `https://slowcup.app/`. The redirect allowlist **cleanup is DONE** —
  Niklas removed the `tosinik.github.io/steep-tea-log` entry **2026-07-20** (Ruth reinstalled on the new
  origin), so the allowlist now holds only slowcup.app. The 301 still heals plain links.

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

## DB migrations run (Supabase SQL editor, in **version** order — NOT filename order)
schema.sql · v2_1-migration · v2_2-photos-storage · v3_0-social · v3_1-quick-log ·
v3_2-session-photos · v3_3-wishlist · v3_4-brew-advice · v3_5-purchase-date · v3_6-leaf-form ·
v3_7-mood · v3_8-water-ml · v3_9-steep-feedback · **v3_10-pass-record (v4.02)** ·
**v3_11-opened-date (v3.98)** · **v3_12-liquor (v4.14)**.
**Read the version, not the sort.** `v3_10` sorts between `v3_1` and `v3_2` as a string, and it was
applied *after* `v3_11`. Both happen to be order-independent; the list above is by version.
**The `v3_` prefix is a SERIES number, not the app version** — `v3_10-pass-record` was applied at app
**v4.02**, which already disproves any correspondence. R4's first migration continues the series as
`v3_12`; starting a `v4_` prefix would imply a rule that file breaks.

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
NEW module to its `FILES_TO_CACHE` list) → hard reload. Keep CHANGELOG.md updated.
**Read the current cache number from `service-worker.js`, never from here.** This line said
`v92` until 2026-08-07, thirty-three deploys after it was true — a stated number in a document
nobody bumps is a number that decays silently (R71). The ritual and the deploy skill both read
`CACHE_NAME` at the source.
Since v3.27 the app shows a "new version — Refresh" banner when a new SW installs, so testers no
longer need a manual hard reload (dev still should, to verify). The SW waits for that tap now.

## Continue here

**ROADMAP — the current ordered forward plan (reordered 2026-08-30, v4.36 — post-audit).** The R5 spine +
warmth pass is landed; **reflection Slices A + B + C are all done (v4.36).** **The codebase/docs audit is
DONE** (`docs/r5/planning/AUDIT-REPORT-v4.36.md`); planning ruled its fixes into waves — **wave 1 is the next
build.** What's next, in order:

1. **Reflection Slice B — DONE.** B1 (R177, v4.34: the full tea-detail spine + warm re-dress) + B2 (R173,
   v4.35: why-this-tea palate-connected + type-aware freshness incl. the oolong-by-roast fix + the
   freshness/haven-t deep-link landings). *(The earned brew guide R173 first reserved moved to brew-advice v4,
   R175/R176.)*
2. ~~**Reflection Slice C (R174):** terroir + teas-over-time — the last reflection views.~~ **DONE (v4.36)** —
   terroir extends `viewOrigins` in place; teas-over-time is a new `viewTimeline` behind an Insights door.
   **The reflection is complete (A/B/C all shipped).**
3. ~~**The full codebase/docs audit**~~ **DONE — read of v4.36 (`72db72b`); report at
   `docs/r5/planning/AUDIT-REPORT-v4.36.md`** (gate table + both arms + ranked backlog; the **living seed** —
   append future finds there, it replaces the never-created `AUDIT-TARGETS`). Ruled into waves:
   - **Wave 0 — docs-only (SHIPPED, this commit):** deploy-gate repoint (`verifier.md` + `slowcup-deploy`
     → `steep-version.js`), "do-not-build" banners on the command-rebuild docs, misinformer reconciles.
     No app files, no version/cache bump.
   - **Wave 1 — the design gap: ~~sessions list~~ (#1 DONE v4.37/R178) → ~~vendor/keyboard~~ (#2 DONE
     v4.38/R179) → tea-page + calm-copy polish (#2.5, NEXT) → session-flow re-dress (#3).** #1 shipped: the
     sessions LIST joined the spine (rows → RULE, the photo→liquor-swatch lead — Sessions distinct from
     Library). #2 shipped: the mobile keyboard occlusion closed app-wide by one systemic `visualViewport`
     focus-scroll (`installKeyboardReveal`) + both native `<datalist>`s → an in-form inline suggester; vendor
     stayed in-form (NOT a router picker — the uncontrolled tea form would lose typed fields). **#2.5 (NEXT)
     tea-page + calm-copy polish**
     (`docs/r5/planning/TEA-PAGE-CALM-COPY-POLISH.md`, from the on-device review of v4.37). Three parts.
     Tea-page section rhythm so each section reads as a distinct journal entry, with no re-boxing. A reusable
     ⓘ-popover explainer component, an app-wide pattern proven on the tea page. Copy de-AI-ification, an
     em-dash purge that becomes a house-style rule going forward and binds specs and prompts too. It feeds
     #3: the session-flow track uses the ⓘ-popover for its own explainers. #3 the session FLOW
     (setup/steeping/finish/quick — the core ritual) is **designed in
     `docs/r5/planning/SESSION-FLOW-REDESIGN.md`** (the build authority; Q1/Q2 resolved 2026-08-30).
   - **Hygiene riders (thereafter):** free-delete orphans (`dotsRow`/`fmtStars`/`toggleTheme`/
     `flavorFamilyOf`/`achievementsHTML` + the unguarded passport dot-map leftovers); achievements R134
     delete-vs-keep (bookkeeping still recomputes on every write); fix CLAUDE.md's passport dead-table
     over-claim (`passportSubFor`/`PASSPORT_SUB` are not live).
4. **Features, prioritised by the audit:** Go Deeper / tea-reference redesign · tasting input (the
   "What are you tasting?" tags — partly live — + the guided tasting mode, `IDEA-tasting-mode.md`) · matcha
   mode (contained). **Backlog the audit ranks into this:** ~~freshness-framing fix~~ **DONE in B2**; the
   **sticky-rice catalog row** (an unmatched roasted oolong still defaults to the oolong family — B2's roast
   fix reaches catalog-matched teas only); a **vendor picker**; masthead session-start; stale-override reset;
   Favourites default order; ~~liquor-ramp-too-thin~~ (**DONE v4.45/R187** — ramp 12→25 in six families); the **senchadō ratio-seed reachability** (a v2-ratio task —
   `senchado:2.8` in `LEAF_RATIO_DEFAULT` is unreachable; the gyokuro revisit needs `ratioSenchado` in the KB).
   Label scanner — deferred.
5. **Brew-advice Stage 2** — learned per-tea time adaptation + science-prior→preference (+ the earned brew
   guide, guided-discovery framing). **Data-gated — floats to whenever the feedback gate fills** (the
   ~15-session gate; the v4 five-tap capture now feeds it with the richer vocabulary).

**SECURITY + LEGAL — the HARD pre-widening GATE, not a backlog item.** These MUST land before anyone but
Niklas logs in (the trigger is *pre-widening*, not a date; deferred by decision 2026-08-28 while he is the
sole user — see `SECURITY.md`): **F1** (`profiles` readable by all authed users, no allowlist — HIGH) ·
**F2** (`tea-photos` bucket public + unscoped read — HIGH) · **F3** (shared sessions/steeps expose the full
row — `mood`/free-text notes/`feedback` — to followers — MEDIUM) · **GDPR erasure** (no account/data-delete
function exists anywhere in the codebase — legally required for a public EU beta) · **Datenschutzerklärung +
Impressum** (neither is in the repo; F1/F2 must be fixed before the privacy policy can be truthful, and the
Impressum needs a ladungsfähige Anschrift). F4 (auth redirect allowlist) is a 30-second dashboard confirm.
It blocks widening regardless of where the feature roadmap stands.

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
stored `brew_style`. v3.85's brewStyle un-gate feeds real method data. (2) ~~**Supabase allowlist cleanup**~~
**DONE 2026-07-20** — github.io origin removed after Ruth's reinstall (see "Domain & auth origins"). The
**domain is DONE** (registered + migrated 2026-07-13 — https://slowcup.app). **#23**
("R2 capability regressions" — planned as #21, renumbered by GitHub) holds the reinstate-vs-accept
decisions (sorts full treatment, vendor filter, in-stock count, focus-mode log/reset, per-steep tag
library); `setTeaSort`/`setTeaFilter`/`focusLogSteep` stay in the code as its reinstatement hooks. #14
parked → R3; the held #15 vocab expansion stays out until phase-2. New bugs/ideas land as GitHub issues
(the live inbox), not here.

**R3 status (building — slice B shipped v3.96):** **read `docs/r3/R3-STATUS.md` FIRST.** It is the round's
durable state document and outranks this paragraph on
every R3 detail (authority order, **amended by R131**: live repo → the current export, stamped →
**`CLAUDE.md` standing rules** → rulings ledger → R3-STATUS → boards → nobody's memory). `CLAUDE.md`
joins above the ledger because it holds standing rules a ruling must *satisfy*, not rulings — R125
contradicted `CLAUDE.md:129` and no ordering check could fire, because the rule sat outside the
order. **The order settles which document is authoritative, not which is right:** where the higher
tier is *silent*, the lower tier is the record, not the error. It records the commit hashes itself.
The **binding reference** for the #09b sweep + Code hand-off is
**`docs/r3/planning/R3-RULINGS-LEDGER.md`**, **contiguous and verified unbroken from a fresh clone**,
with `DATA-region-coordinates.md` the Origins coordinate source (8/8, CLOSED). The build order is
`docs/r3/R3-BUILD-PLAN.md` — slices A and B are struck as SHIPPED there; **B2 (#06 + #03) is next**.
Design's **final board export is in-repo and is the visual authority**: `docs/r3/boards/*-rev*.dc.html`
plus `origins-map-v3.html`, banked verbatim and hash-verified, with `support.js` + `uploads/` as required
build dependencies (every board loads them by relative path). The `.png` files in that folder are
round-1/parked record only — **not** authority. R29 closed Pillar B (no root split — app stays at
`slowcup.app/`, landing = #09's logged-out screen). Focus and Wrapped are **no longer unboarded**: #10
Focus rev2 and #11 Wrapped rev1 shipped in that export.
~~**Next, and the last R3 task: the implementation hand-off.** Four rulings stay held (#22 · #23 · #28 ·
washi probation) and the Teas→Library rename is unruled.~~ **All discharged.** The hand-off is committed
(`docs/r3/R3-IMPLEMENTATION-HANDOFF.md`), the four held rulings landed as R57–R60 (2026-07-25), and **R62
ruled out the rename — the tab stays Teas.** R3 has no open design questions; what remains is execution.
Two repo rules exist *because of* the banking and must not be "tidied away": `.gitignore`'s scoped
`!docs/r3/boards/*.dc.html` negation (the bare `*.dc.html` above it silently drops all 20 boards), and
`.gitattributes` pinning `docs/r3/boards/** -text` — without it Git-for-Windows `autocrlf` makes a Windows
clone's hashes disagree with a Linux one on an archive whose whole point is hash-verifiability.

**Pending Code cleanups (were ephemeral task-chips — recorded here so a session-clear doesn't lose them):**
~~(a) delete dead `ratioSetupHTML`~~ **DONE in v3.95** (slice A), after its trigger fired and was missed
twice at v3.85 and v3.91; (b) promote the R3 handover's §6 (review method) + §7 (recurring failure modes)
into CLAUDE.md as standing discipline — see the banner in `docs/r3/HANDOVER-planning-lane.md`. **Partly
discharged in v3.96:** R74 put the *doc sweep* into CLAUDE.md's deploy ritual and `slowcup-deploy` step 5;
§6/§7's review method and failure-mode list are still owed.
~~(c) **Four stale fixture suites**, on one chip~~ — **ALL FOUR DONE**: `status-line` + `tea-types`
repaired in v3.96b, `freshness` + `lifecycle` repaired **and newly tracked** in v3.97. **19 committed
suites, all green.** Note B3 rewrites `status-line-test.js` §D and both freshness suites to the new
model (spec §0) — expected, not a regression.

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

**Parallel / Niklas's:** ~~the domain~~ (**registered + migrated 2026-07-13** ✓); ~~beta-tester
reinstalls on the new origin~~ (**Ruth reinstalled; Supabase allowlist cleanup DONE 2026-07-20** ✓); the
**phase-2 gate** (3/15 measured 2026-07-15, ~2–3 weeks out) — **the A2 capture control SHIPPED v3.89**; the
gate now **fills UNDER the shipped per-steep control** (the old end-of-session control is why the rate was
low) → then the phase-2 brew-advice build (learned defaults, post-gate). Unsequenced beta inbox: issues **#7–#12** — triage into a fresh tail when ready.

**NOW — v4.45 STAGED `dd236ab` — colour system: 25-stop liquor ramp + net-new leaf ramp (R187)**
(cache **v155**, APP_VERSION v4.45, **no SQL**, **no new module**). Step 1 of guided tasting mode (D4):
the colour-ramp **pre-slice**, shipped ALONE and FIRST. Authority `docs/r5/planning/SPEC-colour-system.md`
(pushed docs-only, `3930afc`).
- **Liquor ramp 12 → 25 stops in six families.** The 12 keys+hexes preserved exactly; 13 new (four
  greens, three reds), both themes. `LIQUOR_FAMILIES` is the picker grouping; `LIQUOR_KEYS` derives from
  it (flat ramp order + the clock sort); `liquorFamilyOf` maps key→family. Type cascade stays coarse (Q2):
  new stops tier-1-only, the catalog is NOT re-authored, `liquorFor` unchanged. **Closes the audit's
  "liquor ramp too thin" backlog.**
- **Net-new leaf ramp** (`--leaf-*`, 9 colours both themes) + `mottled` tokenless split-swatch modifier;
  a SEPARATE set from `--liquor-*`. `LEAF_KEYS`/`isLeafKey`/`leafGridCells` ship ready for c1.
- **Two-step drill-down picker** (44px shades, one family open, others as strips; `liquorOpenFamily`
  DOM-only) wired to the per-tea identity pick. Leaf flat picker built for c1. Write-path unchanged.
- **Tests:** liquor-test §A rewritten — 25 stops, A3 GLOBAL ΔE (Lab) min-distance both themes (min 4.91
  light / 5.98 dark), A4 retired (families break monotonicity), A3b endpoint-aware, leaf asserted; C3 split
  for Q2; G10 → 44px. 89 checks; 41 suites green; frame-test 46 unchanged.
- **ON DEVICE (`smoke.md §v4.45`, POST-PUSH — this IS the hex validation, Q1):** the 25 liquor swatches
  read as a coherent ramp on a real cup; the two-step picker taps (families open one at a time, 44px);
  **does `clear` read distinct from the tier-3 dashed plate, or collapse it into `ivory`?**; leaf ramp
  against real leaf when c1 lands. The 12 originals are FROZEN; the 13 new may retune/drop (keys-not-hexes
  = no data migration).
- **STAGED:** code `dd236ab` + docs committed, UNPUSHED. Awaiting Niklas's push, then the phone-look +
  Planning's clone-verify, then the STAGED→LIVE flip.
- **NEXT — guided mode c1:** the `tasting_record` jsonb migration (alone and FIRST), then the c1 spine
  (both entry doors, the two registers, the reuse-existing stages, JSON storage, the verdict close).

**Previously — v4.44 LIVE `a390f06` — photo field opens a source sheet (R186)**
(cache **v154**, APP_VERSION v4.44, **no SQL**, **no new module**). Fixes the v4.43 photo control.
- **The bug (v4.43):** `photoInputs()` stranded the working buttons in a row under the preview and left the
  big "Add a photo" drop-zone inert. The obvious target did nothing.
- **The fix:** the field is the single tap target again. Tapping it opens an in-app sheet (`photoSheet()`)
  with **Take photo** + **Choose from library**. `photoInputs()` now renders just the two hidden inputs (one
  `capture="environment"`, marked `data-cam`; one gallery), both `js-img-input` so the unchanged `bindDynamic`
  wires them. `d_pickPhoto` closes the sheet with a direct DOM remove (no re-render, input stays wired) then
  `.click()`s the matching one.
- **Shared once:** `openPhotoSheet`/`closePhotoSheet`/`d_pickPhoto`/`photoSheet` + `state.photoSheetOpen` (in
  the back-guard). The 5 `.img-upload` fields each carry a one-line `onclick="openPhotoSheet()"` pointing at
  it, so all 5 spots behave identically; the 90px avatar is a normal tap target. `.btn-photo` stays on
  `--line`/`--ink`, no `--clay`. Dead `.img-controls` removed.
- **Fixtures:** none new (interaction is device-only); export-gate + 47 suites green, node --check clean,
  markup/routing/copy vm-checked.
- **ON DEVICE (`smoke.md §v4.44`, POST-DEPLOY):** tap the "Add a photo" field → the sheet appears → Take
  photo opens the camera, Choose from library opens the gallery, both save + preview, no leftover buttons
  under the field. Check tea-add + one session spot + the social avatar (the 90px circle).
- **LIVE:** pushed (`a390f06`); Niklas's phone-look (`smoke.md §v4.44`) + Planning's clone-verify passed,
  flipped STAGED→LIVE.
- **NEXT — Tea Tasting mode** (guided mode, D4, wave-1 #3 slice c): **authority spec
  `docs/r5/planning/SPEC-guided-mode-FINAL.md`** (added c92275a; §10 = the plan-gate build questions, storage
  is the open one), design ruling `SESSION-FLOW-REDESIGN.md` §D4. Big, multi-slice (c1/c2/c3 in §11), builds
  after smart-restock (done v4.42) — PLAN-GATE it. Then the "teas you return to" fast-follow. Then SECURITY
  re-blocks before the beta widens.

**Previously — v4.43 STAGED `0b34649` — camera alongside gallery + bigger session-rating stars (R185)**
(cache **v153**, no SQL). Pushed; its phone-look found the inert drop-zone above, fixed forward in v4.44, so
this block never flipped LIVE. Camera-alongside-gallery via `photoInputs()` at all 5 photo spots; a 32px
session-rating star tier scoped to `#sessRatingWrap`/`#editRatingWrap` (half-stars kept).

**Previously — v4.42 LIVE `9c25e52` — Smart Restock: one entry + a purchase log (retires R11) (R184)**
(cache **v152**, APP_VERSION v4.42, **SQL: apply `sql/v4_42-purchase-log.sql` FIRST**, **no new module**).
Standalone stock-management slice (`docs/r5/planning/SPEC-restock-model.md`); retires R11 (rebuy = new row).
- **Restock button + modal** on the tea's "On hand" (grams · date · cost; the new-harvest cue; "Opening
  this bag now?" toggle default ON). `commitRestock` single-writer-clean: SETS `amountGrams` (stockTier
  reads it) + `openedDate` when opening (freshnessReading reads it); appends the log event; `wouldRebuy=true`.
- **Buy decoupled from open:** ON → opened=date + openedDate=date; OFF stockpiles (opened=null, openedDate
  untouched, grams still grow); a sealed bag opens via the one-tap `d_openBatch`. Lifespan reads `opened`.
- **Purchase log** JSONB `purchase_log` = `[{grams,date,cost,opened}]` — history, weighted cost/gram
  (`purchaseTotals`), soft-link (`teaSoftLinks`, name+vendor, read-only). Legacy cost fields = fallback; a
  legacy tea's first restock seeds buy #1.
- **R11 retired forward-only:** `isRepeat` removed, `restockTea` → modal, existing dup rows left as-is.
- **Fixtures:** new `restock-test.js` (20), `liquor §G1` field-drop guard kept green. All 41 suites green.
- **Deferred:** cross-tea "teas you return to" Insights list (per-tea soft-link ships now); sample→full-buy.
- **ON DEVICE (`smoke.md §v4.42`, POST-DEPLOY, needs the SQL applied):** restock in place; stockpile + the
  one-tap open; the log reads (history, weighted cost, soft-link); no "Repeat buy" checkbox; edit keeps the log.
- **SHIPPED:** SQL `sql/v4_42-purchase-log.sql` (`205df70`) applied; code `9c25e52` + docs `169c172` pushed;
  Planning's clone-verify (commitRestock / opened-field / toggle / single-writer / R11-retire) + Niklas's
  UI eyeball passed → LIVE.
- **NEXT:** guided mode (D4, wave-1 #3 slice c) + the "teas you return to" fast-follow. Then SECURITY
  re-blocks before the beta widens. Also parked on origin: `SPEC-best-pour.md`, `NOTE-identity-accent-direction.md`.

**Previously — v4.41 LIVE `7c27cb9` — wave-1 #3 slice b: the flavour tagger + session-level tasting (D2/D3, Bug B) (R182)**
(cache **v151**, APP_VERSION v4.41, **no SQL**, **no new module**). The data-touching slice of
`SESSION-FLOW-REDESIGN.md`; slice c (guided mode, D4) is the remaining piece.
- **D3 tagger** — `flavorCaptureHTML` rewritten on `FLAVOR_TREE` (12 families → sub-families → notes): a
  `sweet · umami · crisp` strip above the twelve; tap a family (`d_flavFam`) to expand notes in place, two
  rows first ("You've noted in this tea" = `teaFlavorProfile ∩ family`; "Words you've used" =
  `tagLibrary ∩ family` = **Bug B**). Free-word door with a live resolution echo, stored as written. New
  `toggleSessionFlavor`/`d_flavFam`/`flavFamilyPanelHTML`/`flavorFamilies`/`FLAV_STRIP`.
- **Q1 session-level** — the tagger writes `sessionTags` (not per-steep), killing the "led early" artifact
  at the root; SOLE session-tasting UI, subsuming both "Overall tags" chip UIs (quick-log + finish) and the
  slice-a collapse. `curSteepTags`/`toggleFlavor` reserved for guided mode.
- **D2 reads (the reviewable heart)** — `distinctVocab` = `session.tags` ∪ `steeps[].tags` (quick/cold-brew
  now feed the profile); `flavorObservation` dropped "peaks/softens" + gates "runs steady" on a real spread;
  `sessionFlavorStory` dropped "led early". Finish "You tasted" + readback repointed; tea-page chips/bars/
  radar rendering unchanged.
- **Fixtures** — new `flavor-tagger-test.js` (27), `flavor-ladder §E` revised, all 40 green, export-gate
  first. Dead `KB_FLAVOR_FAMILIES`/`flavorFamilyOf`/`d_flavorMore` left for `flavor-ladder §A` (cleanup
  follow, CLAUDE.md backlog).
- **ON DEVICE (`smoke.md §v4.41`, POST-DEPLOY):** tagger tap-through (family expand, the two rows, free word
  + resolution echo, one session-tag UI everywhere); D2 on the tea page (session-level tags feed it, no
  "softens after" from a single tag); finish recap + edit still work.
- **SHIPPED:** code `7c27cb9` + docs `e8155ae` pushed; phone-look (`smoke.md §v4.41`) + Planning's
  clone-verify passed → LIVE.
- **NEXT — wave-1 #3 slice c:** guided tasting as its own path (D4), the per-steep evolution layer + Tier-1
  liquor capture. Then SECURITY re-blocks before the beta widens. **Design calls confirmed:** lowercase free
  words (exact-case a logged follow), merged "chosen" row, finish recap kept (drop-if-double phone-look).

**Previously — v4.40 LIVE `46ea175` — wave-1 #3 slice a: session-flow re-dress: IA + timer + focus cue (R181)**
(cache **v150**, APP_VERSION v4.40, **no SQL**, **no new module**). The first, contained slice of
`SESSION-FLOW-REDESIGN.md` (D1 + D5 + Bug A); slices b (`FLAVOR_TREE` tagger + session-level D2) and c
(guided mode) follow, D2 isolated as its own step.
- **D1 facts before feelings (#22)** — objective facts (temp · time · ratio) promoted directly under the
  timer, above tasting; the tasting capture (`flavorCaptureHTML`) demoted into a named `.fold-row` collapse,
  closed by default, "· N noted" + tapped chips shown while collapsed (no data stranded). Ratio READS
  `computeSessionRatio` (shown when it computes, else omitted — null for `ratioAdjust`-off, most of the beta).
  Notes (`#steepDesc`) stays a live input with the facts, forced by `saveSteepAndContinue`'s bare `.value`
  reads of `#steepTemp`/`#steepTime`/`#steepDesc`.
- **D5 time on the ring** — target is tap-to-edit running AND stopped (`d_beginTimeEdit` un-gated) + a
  `±10/±5` nudge row (`d_bumpTime`); every write through the single writer `setSteepTime` (#13), floors at 5s.
- **Bug A focus cue** — four CSS states off `#focusRing.is-paused` (running → "breathe in" ⇄ "breathe out" on
  the ring's 6s clock; paused/complete → "paused"; reduced-motion+running → static "breathe"). The per-tick
  override BECAME a class toggle (the interval-completion path has no `render()`, so it is the only cue
  updater there); ring breathe gated to `:not(.is-paused)` so ring + cue stop together.
- **Fixtures:** steeping-timer §G, focus §H. All 39 committed suites green, export-gate first.
- **ON DEVICE (`smoke.md §v4.40`, POST-DEPLOY):** facts above the collapsed tasting; collapse opens/closes;
  time tap-editable on the ring while running + the ± nudge the countdown live; the focus cue alternates with
  the breathe and lands on "paused" on pause AND on natural completion; reduced-motion degrades to a static
  label.
- **SHIPPED:** code `46ea175` + docs `762b5ba` pushed; Niklas's phone-look (`smoke.md §v4.40`) + Planning's
  clone-verify passed → LIVE.
- **NEXT — wave-1 #3 slice b:** the tagger writes session-level `sessionTags` (Q1: kills the "led early"
  artifact at the root), D2 repoints the reads + subsumes the two overall-tags UIs (`:784`/`:1648`); R182.
  Then slice c (guided mode). **SECURITY F1/F2 stays the hard pre-widening gate.**

**Previously — v4.39 LIVE `96be0d8` — wave-1 #2.5: tea-page polish + the info-popover + material suggester (R180)**
(cache **v149**, APP_VERSION v4.39, **no SQL**, **no new module**). Four parts, one slice, off
`TEA-PAGE-CALM-COPY-POLISH.md`.
- **D1 section rhythm** — three scoped CSS rules (`.td-sec` gap 18→30px; scoped `.td-sechead .eyebrow`
  presence; `.td-sechead` air), typography+space only, no re-box. **frame-test 46.**
- **D2 the info-popover** — `infoMark(text,label)` + `toggleInfoPop`/`closeInfoPop` in core.js beside
  `armConfirm`, plus a new `i-info-hl` sprite glyph. Tap-reveal explainer; four-way dismiss
  (re-tap/outside/Escape/render); viewport-safe (visualViewport flip above/right); `textContent` boundary;
  reduced-motion; button + aria. The app-wide contract **track #3 inherits**, intended for insight-reveals
  too (INSIGHT-ENGINE-SPEC refinement). Transient popover (tag-suggest family) → no `SURFACES`, frame-test 46.
  Proven on the tea page: photo note + both brew notes move behind marks, captions **deleted**.
- **D3 copy** — the named tea-page strings + the three tea-form hints rewritten plain (em-dashes gone, no
  "X, Y, never Z"). The house rule is in **CLAUDE.md** ("Copy voice"); it binds app strings + specs +
  prompts. Full app-wide purge + DESIGN.md fold-in = later pass.
- **D4 material suggester** — the vessel Material field gets the vendor treatment (`autocomplete="off"` +
  `distinctMaterials()` through the shared `renderFieldSuggest`); `pickVendorSuggest` → `pickFieldSuggest`
  (generic, two callers). `installKeyboardReveal` covers it by delegation (confirmed by design).
- **Fixtures:** new `tea-polish-test.js` (27) + `vendor-keyboard-test.js` rename update. All committed suites
  green, export-gate first; frame-test 46.
- **ON DEVICE (`smoke.md §v4.39`):** tea page reads as distinct journal entries; the info marks
  open/dismiss/stay-on-screen and the captions are gone from the always-on surface; copy reads human;
  material suggests from the shelf, no OS strip, clears the keyboard.
- **NEXT — wave-1 #3: session-flow re-dress** (`SESSION-FLOW-REDESIGN.md`), which picks up the info-popover.
  **SECURITY F1/F2 stays the hard pre-widening gate.**

**Previously — v4.38 LIVE `ad7b088` — wave-1 #2: vendor field + keyboard occlusion (R179)** (cache **v148**,
APP_VERSION v4.38, **no SQL**, **no new module**). The one genuine on-phone bug the v4.36 audit found (§B2, "Class 5"), and
it was systemic — the app had **zero** `visualViewport`/focus-scroll handling. Fixed as a class, not a field.
- **Systemic keyboard-reveal** (`installKeyboardReveal`, steep-core.js, installed once from `init` — mirrors
  `installResumeSync`): a delegated `visualViewport` resize + `focusin` scrolls the focused field above the
  keyboard using the visual viewport's real height, **only when it's occluded** (no jank on visible fields),
  instant under `prefers-reduced-motion`, `if(window.visualViewport)` feature-detected + try/catch. Covers all
  three `.overlay` modals (tea/vessel/settings) **and** the inline-page fields (`#tagInputField` during steeping,
  `#wishName`/`#userSearch`/`#timerTargetEdit`) by delegation — one writer, no per-field patch.
- **Both native `<datalist>`s retired** (tea-form `#source` + wishlist `#wishVendor`) → an in-form `.tag-suggest`
  inline suggester that rides the layout instead of an OS popup fighting the keyboard. `distinctVendors()`
  substring-filtered; a tap writes `input.value` (plain DOM write — uncontrolled form untouched, `submitTeaForm`
  still reads `name="source"`); a new typed vendor still saves.
- **Ratified split: vendor is NOT a full-screen picker.** Code-verified blocker — the tea form is uncontrolled
  (read on submit), so a router picker's `render()` would wipe every typed field. **Single writer:**
  `renderTagSuggest` + the vendor suggester share `renderFieldSuggest` (steep-core), extracted with the #29
  mousedown+preventDefault preserved (flavor-ladder H9 green across it).
- **Fence:** no new `SURFACES` — the reveal is behaviour, the suggester reuses the un-fenced `.tag-suggest`
  popover on the not-yet-spined tea-form modal; no styles.css change. **frame-test 46 unchanged.** New
  `fixtures/vendor-keyboard-test.js` (24, the 45th suite); all committed suites green, export-gate first.
- **ON DEVICE (`smoke.md §v4.38`, post-push — a vm has no keyboard):** vendor + every sibling + vessel/settings
  fields + `#tagInputField` during steeping + inline-page fields clear the keyboard; the suggester reads (no
  native popup; a tap fills; a new typed vendor saves); no regression (forms save, vendor round-trips, visible
  fields don't jump). Fix-forward if any fail.
- **NEXT — wave-1 #2.5: tea-page + calm-copy polish** (`TEA-PAGE-CALM-COPY-POLISH.md`), then wave-1 #3
  (session-flow re-dress, `SESSION-FLOW-REDESIGN.md`). **SECURITY F1/F2 stays the hard pre-widening gate.**

**Previously — v4.37 LIVE `5a8b03b` — wave-1 #1: the Sessions
list re-dress (spine + warmth + photo→swatch) (R178)** (cache **v147**, APP_VERSION v4.37, **no SQL**, **no
new module**). The first wave-1 build off the audit — the last list joins the spine, and colour-as-data reaches
the one surface that missed it.
- **Rows → RULE** (`.sess-row` de-carded to the `.shelf-row` hairline pattern — content on paper). **The lead
  is the SESSION'S own, not the tea's:** new single writer `sessLeadHTML(s, tea)` (replaces `sessThumbHTML`) —
  `photoUrl` → the session's own photo (the moment, 44×58 cohering with `.sd-swatch`); else the liquor swatch
  via `swatchAttr('sess-swatch', liquorFor(tea), …, true)` (single writer, no raw `--liquor-*`); deleted-tea +
  no-photo → the dashed tier-3 plate. **Never `tea.image`** — Sessions (your moments) vs Library (tea identity).
- **Header → `.lib-band` BAND; calendar → `.sess-cal` BOX** (cell-state fills untouched); the empty states + the
  Brewing-days heatmap card **de-carded** → a fully-spine tab. **Zero SLAB** (Log FAB is global; Insights posture).
- **Fence:** new `SURFACES.sessions` + a `.sess-cal` BOX positive + `chkNoClay(SURFACES.sessions)` + 3 biting
  controls; `.sess-lead`/`.sess-swatch` are MARKS, excluded (guarded in liquor-test). **frame-test 40→46;
  liquor-test 78→82** (F1 tints 12→10, F2 swatch sites 12→13). **All 44 committed suites exit 0**, export-gate first.
- **ON DEVICE (`smoke.md §v4.37`, post-push, locally drivable — a rendered component):** rows read as one warm
  list; a photo row vs a swatch row both read; tier-3 / deleted-tea → the dashed plate; header BAND + calendar
  BOX read; **Sessions now reads distinct from Library** (moment-forward vs identity-forward). Fix-forward if any fail.
- **NEXT — wave-1 #2: the vendor field + keyboard handling** (`AUDIT-REPORT-v4.36.md` §B2), then wave-1 #3
  (session-flow re-dress, `SESSION-FLOW-REDESIGN.md`). **SECURITY F1/F2 stays the hard pre-widening gate.**

**Previously — v4.36 LIVE `87264cf` — reflection Slice C: Your terroir + Teas over time (R174)** (cache
**v146**, APP_VERSION v4.36, **no SQL**, **no new module**). The last two reflection views — **the reflection
is COMPLETE** (Slices A/B/C all shipped). Both built on shipped fields; both ride the reflection spine.
- **Your terroir** (`viewOrigins` re-dressed IN PLACE — `state.view='origins'`/`goOrigins()` kept): a
  `.reflect-band` masthead over the kept atlas + two summaries — `terroirCensus` (shelf-weighted, the
  countries you span) + `terroirGravitate` (brew-weighted, what you reach for). Country-tier list preserved
  under the span count; region-tier teas stay the map's pins (not duplicated). No `REFLECT_ROUTE` entry (the
  lead engine has no origins type — untouched); **no hardcoded back** (origins is hub+Insights reachable). The
  Insights Origins door names "terroir."
- **Teas over time** (new `viewTimeline`, `state.view='timeline'`): `overtimeSeries` (month density) +
  `overtimeArrivals` (chronology) + `overtimeThenVsNow` (gated ≥3 months). Reached via a new Insights BOX door
  (`overtime` dashCard, gated ≥2 months) → `openReflection('timeline')`; `← Back to Insights`. In router +
  `HISTORY_VIEWS`.
- **Fence:** no new frame container — both ride `.reflect-band` + `.ins-sec`; a ⚡ note documents the join,
  atlas + timeline are excluded marks (frame-test 40 unchanged). Suites moved to the new model: liquor-test F2
  11→12, landing-test D1 "atlas"→"terroir", origins-test C2/C3/F13; reflection-test §K +12. **37 suites green.**
- **ON DEVICE (`smoke.md §v4.36`, post-deploy)** — terroir reads as a warm spine surface + the door names
  terroir & lands; teas-over-time reads (density legible, arrivals chronology, then-vs-now absent-not-broken on
  the thin log); Back returns correctly (terroir from **both** the hub and the Insights door; timeline → Insights).
- **NEXT — the full codebase/docs audit** (ROADMAP #3 — reflection is done) → a ranked backlog that informs the
  feature order. **SECURITY F1/F2 stays the hard pre-widening gate.**

**Previously — v4.35 LIVE `d0a994d` — reflection Slice B2: the tea's page, why + type-aware freshness (R173)** (cache
**v145**, APP_VERSION v4.35, **no SQL**). The reflection content on B1's re-dressed frame — **Reflection Slice
B complete.**
- **Why this tea** (`teaWhyHTML`, `#reflect-why` in Character): the palate connection — the tea's traits
  (type, roast) × your favourites + highly-rated teas ("You keep reaching for oolong — this is one of them").
  Type/rating reliable now; graceful (too little signal → the curated character alone).
- **Type-aware freshness** (`teaFreshnessHTML`, `#reflect-freshness` after Brewing): framing fits the type —
  fade-fast (greens) → peak/urgency; age-friendly (white/pu-erh/roasted oolong) → holding, never "freshest".
- **The `ttFreshness` oolong-by-roast fix** — a medium/heavy-roast oolong (catalog `roast` field) is now
  age-friendly; corrects the reading + the Home freshness insight + `statusLine` at once. (Catalog-matched; an
  unmatched sticky-rice oolong needs a catalog row — backlog.)
- **Deep-link landings** — freshness → tea-detail/freshness, haven-t → tea-detail/why (`REFLECT_ROUTE` +
  `leadDoorHTML` teaId + `openReflection` `teaDetailFrom='insights'`). **The last two unmapped lead types now
  land**, scrolled.
- **Fence:** why/freshness are spine-content (`.td-why`/`.td-fresh`, ink) — **frame-test 40 unchanged**.
  `reflection-test` §B + §J. **36 committed suites + v4 fixture green.** Ledger **R173**.
- **ON DEVICE (`smoke.md §v4.35`, post-deploy)** — the why reads as a palate connection; a roasted oolong
  reads "holding," never "freshest"; a green reads drink-fresh; the Home freshness + haven't doors land on the
  tea page, scrolled.
- **NEXT — reflection Slice C (R174)** (terroir + teas-over-time), then **the audit** (see the reordered
  ROADMAP at the top of "Continue here"). **SECURITY F1/F2 is a hard pre-widening gate.**

**Previously — v4.34 LIVE `68979db` — reflection Slice B1: tea-detail re-dressed to the spine (R177)** (cache
**v144**, APP_VERSION v4.34, **no SQL**). The **last major surface** joins the R5 spine — `viewTeaDetail`
re-dressed to a BAND masthead + RULE sections + one clay SLAB, on the session-detail precedent.
**Containers only — same content, re-framed** (no content logic; the why + freshness is B2/R173).
- **Masthead → `.td-band`** (composes `.band`, radius 0): the tea's `liquorFor` swatch (identity mark,
  colour-as-data) + a 56×58 photo thumb (the hero shrinks; a mark) + name/type/fav-rebuy pills/stars.
- **Five RULE sections** (reflection-first — Character above On hand): **Character** (leaf facts + flavour +
  description merged) → **On hand** → **Brewing** (guide + "Your last cup" merged; nested brew card
  **de-carded**) → **Where this came from** → **Your diary**. Each renders only with content.
- **One clay SLAB** (Start session; Edit ghost); warmth = marks only (masthead swatch + flavour marks).
  Anchors reserved for B2 (`#reflect-why` in Character, `#reflect-freshness` after Brewing).
- **Fence:** `SURFACES.teaDetail = ['.td-band','.td-sec','.td-sechead']` + `.td-band` radius-0 positive + 3
  controls; `.td-swatch`/`.td-thumb`/flavour excluded as marks — **frame-test 36→40**. `liquor-test` F2
  10→11. **36 committed suites + v4 fixture green.** Ledger **R177**.
- **ON DEVICE (`smoke.md §v4.34`, post-deploy)** — reads as a warm spine surface (BAND + RULE + one slab);
  **the photo thumb — does it read or want the hero back** (the one visual call); nothing broke.
- ~~**NEXT — reflection Slice B2 (R173): the why + freshness content**~~ **SHIPPED v4.35 (R173)** — see the
  NOW block. Reflection Slice B complete.

**Previously — v4.33 LIVE `7e674ca` — fix-forward: v4 pour-feedback surfacing (two bugs, R176 addendum)** (cache
**v143**, APP_VERSION v4.33, **no SQL**). Both content/render, fence unaffected. (1) **The "change" button
was dead** — `brewNudgeRowHTML`'s recorded-marker branch ran before the open-state check; reordered so the
actively-editing state (`pourFbOpenIdx===idx`) is checked first and renders the five chips even when a verdict
is recorded, current pick highlighted (re-tap changes it). (2) **The water check dead-ended `flat`** — it
replaced the extraction advice; now water is a **caveat alongside the lever** (`waterCaveat`; the shape gate
runs first so an opening-light flat still extends without a water caveat), so the flow always ends on
something actionable. Fixtures: brew-advice-v4-test §D (caveat contract) + §I7/§I8; **v4 fixture 45, 36 suites
green.** On-device: `smoke.md §v4.33`. **NEXT — reflection Slice B (R173)** (why + freshness; the earned brew
guide moved to v4) or brew-advice **Stage 2** (post-gate). **SECURITY stays the deferred pre-widening gate.**

**Previously — v4.32 LIVE `82435e4` — Brew-advice v4 Stage 1, Slice 2: the five-tap capture + the diagnosis (R176)**
(cache **v142**, APP_VERSION v4.32, **no SQL**). The deploy where the app **tells you which knob, and why.**
Wires the dormant Slice-1 engine (R175) to the UI (`SPEC-brew-advice-v4.md` §1/§2/§5), reusing v3's quietness.
- **Five-tap capture** — per-steep tap + session row widen to `{good, strong, flat, astringent, bitter}` and
  now write the new enum. Per-steep quietness: **collapsed-faint → expand → recorded-marker** (never five open
  chip-rows), method-gated (gongfu/senchadō), Tea-First.
- **Diagnosis surfacing** — tap → `diagnoseFeedback` → **one lever + a mechanism, as an experiment, never a
  verdict**; quiet on the tap, fuller **"Your last cup"** on the tea page (`teaBrewAdviceHTML`). Spine-content,
  no new BOX.
- **Role-aware `timeShift`** — astringent/bitter → shorten next (−); flat on a by-design-light opening steep →
  extend next (+); strong / flat-elsewhere → advice only. **Water/freshness pre-check** for flat (§6).
- **Reducer → character model** (consequence): `reduceSteepFeedback`/`feedbackSignalOf` return the dominant
  character (weak→flat alias), feeding the count-memory + tea-page line; the per-tap advice reads the raw tap.
- **Fence:** `.pour-*` advice/affordance classes are spine-content (no fill/border/radius) → no `SURFACES`
  entry, **frame-test 36 green**. Suites: `brew-advice-v4-test` 30→**41** (render wiring + timeShift),
  `brew-feedback-test` §A–F character model, `focus-test` §C. **36 committed suites + v4 green.** Ledger **R176**.
- **ON DEVICE (`smoke.md §v4.32`, post-deploy — the real gate)** — the 5-tap reads quiet + method-gated; the
  advice reads as an experiment not a verdict, right lever per context; the by-design-light opening case says
  "extend next / poured off too fast", never "add leaf"; flat surfaces the water check first.
- **NEXT — Stage 2 (post-gate): learned per-tea time adaptation + science-prior→preference** (needs the ~15
  feedback'd sessions Stage 1 collects). Also queued: **reflection Slice B** (roadmap #1). **SECURITY stays the
  deferred pre-widening gate.**

**Previously — v4.31 LIVE `fc32549` — Brew-advice v4 Stage 1: the context-gated diagnosis engine (dormant) (R175)**
(cache **v141**, APP_VERSION v4.31, **no SQL**). Slice 1 of 2 of the v4 rework (`SPEC-brew-advice-v4.md`): the
**feedback model** is replaced, the **engineering reused** (v3 §8). Engine ships **dormant + fixture-proven** —
the capture still writes the old 3-tap, nothing writes the new enum yet (dormant-engine-first, cf. tea-types
v3.87 / lead-insight v4.27). Slice 2 (R176) wires the 5-tap capture + surfacing.
- **`diagnoseFeedback(tap, ctx)`** (steep-core.js) — one character tap (`good/strong/flat/astringent/bitter`) →
  one lever + a one-line mechanism, framed as an experiment. Gated on tea type (`KB_TYPE_SHAPE`), style +
  infusion role (`KB_STYLE_SHAPE`), the steep's temp, and a water/freshness pre-check (§6). **Shape gate:**
  `flat` on a by-design-light gongfu/senchadō **opening** steep → "extend the next / poured off too fast",
  never "add leaf". `astringent` ≠ `bitter`; an already-cool tea switches temp→time.
- **`KB_TYPE_SHAPE`/`KB_STYLE_SHAPE`** (steep-knowledge.js, §7) — senchadō shape in the KB (sencha ~70–80,
  gyokuro ~50–60). **Diagnosis shape only** — v2 ratio untouched; the senchadō ratio-seed reachability is a
  separate v2-ratio task (backlog #9).
- **`weak ≡ flat`** read-side alias (`FB_ALIAS`, non-destructive) — the 23 legacy `weak` values read as `flat`,
  nothing rewritten (enum app-only, no DB CHECK, no SQL).
- **Net-sign auto-delta RETIRED** (`computeBrewAdvice`) — `tuned=base`, `hasNudge` false; the counts survive
  for the memory; consumers degrade gracefully (no "Your tuning" segment until Slice 2). `adviceSuggestionText`
  dormant; ephemeral `timeShift` unchanged in Slice 1.
- **fixtures/brew-advice-v4-test.js** (30) + brew-feedback §G rewritten to the v4 contract. **35 committed
  suites + v4 green.** Ledger **R175**.
- **ON DEVICE (`smoke.md §v4.31`, post-deploy)** — the setup preview reads right without the "Your tuning"
  segment (Guide/Off, counts shown, no "suggests"/"landing well"); per-steep taps still record; nothing
  brewing breaks.
- ~~**NEXT — Slice 2 (R176): the 5-tap capture + the diagnosis surfacing + the role-aware `timeShift`.**~~
  **SHIPPED v4.32 (R176)** — see the NOW block. Stage 1 complete; Stage 2 is post-gate.

**Previously — v4.30 LIVE `08ac1b4` (with v4.29 `37f43a7`), pushed — on-device checks (`smoke.md §v4.29/§v4.30`) run
**post-deploy** (a live PWA can't exercise the SW / real scroll / touch before it's served; the "before push"
wording fits only surfaces a local server can drive) — fix-forward if any fail — R5 reflection Slice A: the
deep pages behind the door (R172)** (cache **v140**,
APP_VERSION v4.30, **no SQL**). The deep pages the Home lead-insight door (R165) + the Insights sections point
at (`docs/r5/planning/REFLECTION-SPEC.md`) — the record to Home's moment. Built entirely on existing fields;
they wear the Insights spine (`.band`/`.reflect-band` masthead + `.ins-sec` RULE sections).
- **Deep-link mechanism** — `openReflection(view, focus, teaId?)` sets view + `state.reflectFocus`; `render()`'s
  tail scrolls `#reflect-<focus>` into view **once** (one-shot — nulled before the frame; `goView` nulls it too).
  `palate`/`ritual` join `HISTORY_VIEWS` (Back → opening tab), do **not** persist. **Routing** (`REFLECT_ROUTE`):
  palate-lean/highest-rated → palate, morning-truth/temps → ritual; unmapped types (freshness, haven-t — Slices
  B/C) fall back to Insights → never a broken door.
- **Whole-Insights-explorable** — type mix → Your palate, colour clock → Your ritual: `onclick` + jade chevron
  on the **existing** `.ins-sec` (`.ins-sec-door` behaviour class; `.ins-sec` frame unchanged → **Insights fence
  untouched**). Edit mode disables the tap.
- **Your ritual** (`viewRitual`) — clock expanded (when×what) · vessels · temps-by-type (timed only, cold-brew
  excluded) · rhythm (non-comparative). **Your palate** (`viewPalate`) — families×ratings bars (per-type avg ★)
  (per-type avg) + rated-highest; the flavour grain is a **note, not a guess** (awaits the tasting-input work).
- **Fence:** +`.reflect-band` (positive + 3 controls); RULE sections reuse the fenced `.ins-sec`; doors + palate
  bars (`dot-*`) are marks/behaviour, excluded (R170 pattern). **frame-test 32→36.** New
  `fixtures/reflection-test.js` (32). Suites: render-smoke 17→19, insights-room icon stub, liquor-test F1 11→12.
  **35 committed suites + fixtures green.** Ledger **R172** (Slices B/C reserve **R173**/**R174**).
- **ON DEVICE (`smoke.md §v4.30`)** — does the Home door land **on the section, scrolled**; are the Insights
  sections doors (type-mix→palate, clock→ritual); do ritual/palate read as spine surfaces; does Back return to
  Insights (no dead-end/loop)?
- **NEXT — reflection Slice B: why-this-tea + freshness (parts 1 & 2 only)** — the earned brew guide moved
  to the brew-advice cluster; freshness folds in the freshness-framing fix and rides the freshness research
  pass. See the **ROADMAP** at the top of "Continue here" for the full ordered plan. Also queued: run the
  §v4.29/§v4.30 on-device checks on the **live** site (post-deploy), fix-forward if any fail. **SECURITY
  stays the deferred pre-widening gate.**

**Previously — v4.29 LIVE `37f43a7` — R5 warmth pass: the swatch follow-on (R171)** (cache **v139**,
APP_VERSION v4.29, **no SQL**). The follow-on R170 named: the tea's own colour reaches the last three utility
surfaces. **Marks only, not a re-frame** — every change is a `liquorFor` swatch or a size; no container
class/count/fill/radius moves, so **F31 untouched** and Insights' fence unaffected. Colour is **data** (a want
with no shelf tea → no swatch).
- **Shelf** `.shelf-swatch` 24×32→**30×40** (SVG path/viewBox unchanged). **Shopping** a 14px `.rank-swatch`
  (Home's Running-low mark, R159) leads every running-low row + each rebuy **only when the want is on the
  shelf** (`shelfTeaForWish`); a plain want stays swatch-less. **Session-detail** `.sd-band` → a **row**: a
  **44×58** identity swatch leads, date/name/ident stack in `.sd-band-main`; unknown-tea → none. Files:
  `styles.css`, `steep-sessions.js`, `steep-shopping.js`, `service-worker.js` (v139), `steep-version.js`,
  `fixtures/liquor-test.js`, `smoke.md`.
- **Fence:** all three are **marks**, excluded like the shelf swatch / R170 clock bars (`.sd-swatch` is a new
  selector but a mark; **frame-test 32 unmoved**; Insights green). `liquor-test` F2 **7→10** swatchAttr sites;
  **steep-shopping.js added to the scan** (0 tint writes, F1 stays 11). **34 committed suites + 2 fixtures
  green.** Ledger: **R171**.
- **ON DEVICE (`smoke.md §v4.29`)** — does the 30×40 shelf plate read (bigger, still a distinct object vs a
  fill); does the session-detail **band row** hold (44×58 swatch | text, long names wrap, unknown-tea = no
  gap); do the Shopping swatches read (running-low always, rebuy only when on-shelf).
- ~~**NEXT — reflection Slice A (v4.30)**: deep-link mechanism + `viewRitual`/`viewPalate` + Insights doors~~
  **SHIPPED v4.30 (R172)** — see the NOW block.

**Previously — v4.28 (LIVE `8d4d44e`) — R5 warmth pass: Insights, the colour clock (R170)** (cache **v138**,
APP_VERSION v4.28, **no SQL**). The warmth pass lands the app's own colour on the utility surfaces, **Insights
first** (the priority + reflection-pages foundation). A **dressing pass, not a re-frame:** no container
class/count moves; **F31 untouched** (every mark is a mark, not frame). Colour is **data** (`liquorFor`); no
tea → no mark (never-guess).
- **The colour clock** (`clockDominant` + `brewingClockHTML`): each 2-hour bar takes the liquor of the tea
  most-brewed in that slot; empty/tie/no-liquor → **`--heat-empty`**. The peak leaves the amber fill for a
  **2px ink rule** (`.clock-peak.is-peak`) beside the mono label (R100 ties all lit). **"Teas brewed"** row
  gains the window's distinct liquors (ramp-ordered strip); grams/litres stay ink. **Notes**: 30px liquor
  swatch replaces the leaf/hanko icon. **Type bar** 10→20px/6→2px. **Hero** plain (R161), **doors** untouched,
  **zero clay** holds. Files: `styles.css`, `steep-dashboard.js`, `steep-insights.js`, `service-worker.js`
  (v138), `steep-version.js`, **new** `fixtures/insight-warmth-test.js` + 3 fixtures, `.gitignore`, `smoke.md`.
- **Fence:** all marks (clock fills/strip/note swatch/type bar), excluded like the shelf swatch — **no new
  `SURFACES`**; **32 checks unmoved**, nothing re-reddens; "excluded marks (R170)" note added. **34 committed
  suites + 2 engine/warmth fixtures green.** Ledger: **R170**. Suite updates: insights-room (note swatch +
  stubs), liquor-test F2 (6→7).
- **ON DEVICE (`smoke.md §v4.28`)** — does the colour clock read as **information** (12 liquor bars = "what
  you drank when," not noise); does `--heat-empty` read as absence; does the peak **ink rule** read; does the
  **Teas-brewed strip** read as your palette *(keep/remove call — one-line removal if decorative)*; do the
  note swatches land.
- **NEXT — v4.29 the warmth-pass follow-on:** ~~shelf 24×32→30×40, Shopping 14px on Running-low + rebuy,
  session-detail 44×58 in the band~~ **SHIPPED v4.29 (R171).** Then the **Insights reflection deep pages** the
  lead-insight door points at → now **v4.30 reflection Slice A** (see the NOW block).
- **Warmth-pass backlog (parked follow-ups, on the record — not blocking):** (1) **freshness-framing
  type-awareness** — the "at its freshest now" insight (`computeLeadInsight`) should fire drink-fresh urgency
  only for freshness-urgent types (greens); stable/ageing (oolong/white/pu-erh) get different framing or no
  fire — `ttFreshness` is already type-aware, the insight isn't using it. (2) **reliable masthead
  session-start** — a "Log a cup" always on the Home masthead, not only the nav FAB. (3) **stale-override
  reset** — offer a dash layout reset when a user's overrides predate a redesign (old Wrapped/`week` linger).
  (4) **Favourites default order** — consider lower by default. (5) ~~**liquor ramp too thin for some
  families**~~ **DONE v4.45/R187** — the ramp went 12→25 stops in six families (green arm 2→6, three new
  reds), per `docs/r5/planning/SPEC-colour-system.md`. Per-row assignments intact and never-guess held (Q2:
  the type cascade stays coarse, new stops tier-1-only, catalog un-re-authored); the 12 originals frozen.

**Previously — v4.27 (SHIPPED, LIVE `50e40f0`) — R5: the warm Home combined slice (R159 — frame + content + warmth)**
(cache **v137**, APP_VERSION v4.27, **no SQL**). The HELD Home slice, landed: the R2/R3 overhaul on Home +
the lead-insight engine + the warm direction. Two commits: **A** `fe42808` (engine dormant + fixture), **B**
`50e40f0` (visual wiring + fence).
- **Frame:** masthead → **BAND** (`.home-masthead`); `today`/`restock`/`favorites` de-carded to **RULE**
  (`.home-sec`/`.home-sechead`); **0 BOX, 1 SLAB**. **Warmth (R160/R164):** 30px liquor swatches (Earlier
  today), 14px (Running low) — colour as **data**, not decoration. **Whiter ground (R166):** `--porcelain
  #F6F2E9→#FAF8F3` **app-wide** (one `:root` token — all five surfaces; dark untouched; fence-safe).
- **The lead-insight engine (R167):** `computeLeadInsight` — 7 self-gating types on `computeInsights`/
  `computeStats`; pick = most-specifically-true, **sticky per day**, ~7-day cooldown; floor = **nothing**
  (no door), never fabricated. **Door (R165):** a band register (0 BOX), named-tea swatch + chevron + "why,
  on Insights" + press-wash → opens Insights (graceful; deep pages a later slice). **Cooldown (R168):**
  device-local `tealog_insightlog`, not synced. Guarded by `fixtures/insight-engine-test.js` (logic, never
  live values).
- **Front door:** Log **FAB** 54→58px (always visible); Start steeping (the one clay) when a tea is
  proposed. **Wrapped moment (R169):** time-gated ("Your {month}"), then gone (no remnant); archive on
  Insights (R103). **"a tea diary"** topbar tagline (app-wide). **clay-grams fix folded in** (Running low
  value → `--amber`). Files: `styles.css`, `steep-dashboard.js`, `steep-core.js`, `service-worker.js`
  (v137), `steep-version.js`, 3 fixtures + **new** `insight-engine-test.js`, `.gitignore`, `smoke.md`.
- **Fence:** `SURFACES.home` (masthead BAND positive; Wrapped/swatches excluded as rationed marks); **28 →
  32 checks**; whiter-ground verified not to falsely redden. **33 committed suites + engine fixture green.**
  Ledger: **R163–R169**. Suite updates: home-test E6/E7, liquor-test F2(4→6)/F9, greeting-v4 door-safe.
- **ON DEVICE (`smoke.md §v4.27`)** — the phone look Niklas owns: does the door read as a door; does the
  warmth land; **does the whiter ground work on the other four surfaces** (highest-attention — a token
  change touching shelf/Shopping/session-detail/Insights); does the lead stick-per-day + rotate; the FAB.
- **NEXT:** the R5 warm/contrast pass extends to the **four utility surfaces** (Home was the proving ground
  — R164); the **Insights reflection deep pages** the lead-insight door points at (the "why": profile/top
  five/spread, `INSIGHT-ENGINE-SPEC` § reflection layer) are the sequenced-next Insights slice so the door
  lands precisely; then the remaining threads (shelf board-13-rev2 tints, steeping, **tea-detail**
  mark-remediation). Insight copy + gate-threshold tuning are a later pass (the templates ship plain).
  **SECURITY stays the deferred pre-widening gate.**

**Previously — v4.26 (SHIPPED, LIVE `7e0a3a2`) — R5 slice 4: Insights re-dressed to the spine + a register-cull**
(cache **v136**, APP_VERSION v4.26, **no SQL**). Insights read as the old app (six white `.stat` boxes).
This gives it the spine — **containers only + a scoped copy pass** — and culls three cards. NOT held
(Insights is the retrospective surface; redress-in-isolation is fine, unlike Home).
- **What shipped:** hero → **BAND** (`.ins-band`; `--jade-pale`/15px retired; the unlabelled `ins-bars` hour
  graph dropped — it duplicated the labelled brewing clock, which **stays**). `totals`/`cost`/`week` KPI
  tiles → **RULE** ledger rows (`.ins-row`) under `.ins-sechead` rule-heads; `typemix`/`notes` already RULE.
  **Wrapped** + **Origins** → the two **BOX**es (`.ins-door`, `--white`/2px; `.ins-teaser`'s `#2A4130`
  retired), Wrapped prominent. **0 SLAB.** `.stat` **retired** (Insights-only). Files: `styles.css`,
  `steep-insights.js`, `steep-dashboard.js`, `steep-version.js` (v4.26), `service-worker.js` (v136), 4
  fixtures.
- **Three culls** (source-traced): **`cadence`** — the one vs-last-month *comparative*, which the surface's
  own register forbids (steep-insights.js:76-82); **`steepshape`** — unlabelled curve; **`recent`** —
  Sessions-tab duplicate (R118). Self-migrating (`dashLayout()` filters against `DASH_DEFAULT_ORDER`).
- **Copy (scoped):** hero eyebrow window labels only ("Lately, mostly"→**"Last four weeks"**, the honesty
  fix). "leads the cup" kept as-is; Origins content parked. **Fence R162:** `SURFACES.insights` + `.ins-door`
  positive + 3 controls + new **zero-clay** `chkNoClay` (a claim only a 0-SLAB surface makes). **22 → 28
  checks. 33 suites green.** Ledger: **R161** / **R162**. Cadence's non-comparative pattern → Home
  (`HOME-VISION.md`).
- **Phone look (F33 grouping-read):** ledger rows read as one ledger; sections stay distinct; hero reads as
  a sentence. **Known interaction:** `week` renders a single ledger row *above* the hero band (DASH order
  puts it first) — pre-existing order, de-boxed not re-ordered; flag if it reads oddly. **This is the
  v4.25→v4.26 transition** → run **`smoke.md §v4.25`** (first on-device confirmation of R158's banner fix).
- **NEXT:** **Home** stays HELD (R159/R160 — the combined frame+content effort, gated by `HOME-VISION.md`).
  Remaining R5: shelf board-13-rev2 tints, steeping (reorder + tasting input), **tea-detail**
  mark-remediation (inline `--jade-pale` → rationed marks; needs a markup guard, not the CSS fence), and the
  clay-grams one-liner backlog. **SECURITY stays the deferred pre-widening gate.**

**Previously — v4.25 (SHIPPED, LIVE `55a16ff`) — the update banner shows the INCOMING version's note (#36 / R158)**
(cache **v135**, APP_VERSION v4.25, **no SQL**). A correctness fix, not an R5 slice. **The bug:**
`showUpdateBanner` read `WHATS_NEW` from the **running (old) page**, so the banner's sub-line always
described the version being *left*; secondary, a worker still **installing** at page-load (its
`updatefound` already fired) was caught by neither the `reg.waiting` check nor the `updatefound` listener,
so the banner sometimes appeared a load late.
- **The fix — the note travels with the new SW, single source preserved:** new **`steep-version.js`** holds
  `APP_VERSION` + `WHATS_NEW` (`self.` globals), read by BOTH the page (as before) and `service-worker.js`
  (`importScripts` — *references*, never duplicates). The SW answers **`GET_WHATS_NEW`** (same channel as
  `SKIP_WAITING`) with its OWN `{note, version}`; `showUpdateBanner` asks the **waiting** worker (= the
  incoming version) and swaps the reply into the sub-line, with the page-local constant as the fallback.
  **`watchWorker`** routes `reg.waiting` + `reg.installing` + `updatefound` through one path (no-banner gap
  closed). Files: **new** `steep-version.js` + `fixtures/update-banner-test.js`; `index.html`,
  `service-worker.js` (v135), `steep-boot.js`, `steep-core.js` (consts removed → pointer), `steep-data.js`,
  `.gitignore`, `smoke.md`.
- **Single-writer is fixture-guarded:** `fixtures/update-banner-test.js` (source-scan — the vm can't reach
  the SW lifecycle) asserts the note lives only in `steep-version.js`, the SW holds no note literal / no
  `WHATS_NEW =`, the SW replies with `self.WHATS_NEW`+`self.APP_VERSION`, the banner asks+falls-back, and
  `reg.installing` is tracked. **33 suites green.** Ledger: **R158**.
- **Verification is TWO-DEPLOY** (the standing `smoke.md` check runs on the deploy AFTER v4.25): v4.25's own
  note still displays via the *old* v4.24 boot, so the first correctly-displayed note is the **next**
  deploy's. On v4.26+: trigger the update, assert the banner sub-line = the incoming deploy's `WHATS_NEW`,
  and the messaged `version` matches the incoming deploy (console cross-check in `smoke.md`, §v4.25).
- **Deploy-ritual change:** the per-deploy bump (CLAUDE.md **2b/2c**) now targets `steep-version.js`, not
  steep-core.js; the module map gained `1b. steep-version.js`. Closes
  [#36](https://github.com/Tosinik/steep-tea-log/issues/36).
- **NEXT — Home is HELD (R159/R160); the rollout continues around it.**
  - **Home: HELD (R159).** NOT a containers-only restyle — redressed in isolation its spare spine (masthead
    + three RULE sections) reads as **empty, not calm**; frame-alone under-delivers on the identity surface.
    Ships as ONE combined **frame + content** effort, **gated by the Home-distinct-data feature vision**
    (`docs/r5/planning/HOME-VISION.md`, elevated from parked to Home's gating dependency). The FRAME layer is
    **banked** at `docs/r5/boards/home-element-mix.dc.html`; its sub-rulings mint only when Home ships
    combined. **calm ≠ spare (R160):** Home earns warmth/imagery/liquor/character beyond the utility spine —
    do not re-flatten it into a utility list.
  - **Insights: the next Design draw** (NOT held — the retrospective surface, redress-in-isolation is fine).
    Scope: redress + **cull the unused cards** + plainer, **non-"AI"** copy + re-dress the old-looking
    all-time / month / week **stat cards**. A containers-plus-copy redress.
  - **Vessels:** a trivial empty-state/segment tidy, available standalone whenever.
  - **tea-detail:** still deferred — mark-remediation (inline `var(--jade-pale)` → rationed marks; needs a
    markup-level guard, not the CSS selector fence).
  - **SECURITY stays the deferred pre-widening gate** (F1/F2), unchanged.
- **Ready backlog — clay-grams (one-liner, independent of Home, ship anytime):** `steep-dashboard.js:1173`
  renders the restock grams value `color:var(--clay)`; low stock is **state, not a commitment**, and clay is
  rationed to the one committing action (R113) → move it to a state/xanthous token. Verified in source; no
  layout effect.

**Previously — v4.24 (SHIPPED, LIVE `0bd7f44`) — R5 slice 3: the session detail page re-dressed to the spine** (cache
**v134**, APP_VERSION v4.24, **no SQL**). The spine rollout (shelf v4.22 · Shopping v4.23) continued onto its
third surface — `viewSessionDetail`, **containers only** (F33). Chosen over tea-detail (nested `.card`s with
**inline** `var(--jade-pale)` fills — a mark-remediation job the selector fence can't police; deferred, NOT
containers-only) and vessels (already spined in slice 1 — a Teas-tab segment, one empty-state card).
session-detail verified cleanest: one wrapper `.card`, no nested cards, no jade-pale, `.sd-steep` already
`border-bottom`-ruled, zero existing clay.
- **What shipped:** the wrapper `.card` **deleted** (a detail page is not a discrete object → content on
  paper); identity → **BAND** (`.sd-band` composes `.band`, full-bleed like the shipped mastheads); the rest
  → **RULE** sections in per-group `.sd-sec` wrappers (facts · Steeps with `.rule-head` header · Your note ·
  Taste words); `.sd-photo` radius **14→2px** (board §1d shelf-thumb rule); **SLAB = "Brew this again"** →
  the existing `.btn-clay` (jade `.btn-primary` retired; Edit stays `.btn`, Delete in the `⋯` sheet, names
  `.sd-link`). Clay cap holds by construction (screen carried zero clay → exactly one introduced). **No BOX**
  — recorded (R156) so a later pass doesn't add one back. Files: `styles.css`, `steep-sessions.js`,
  `fixtures/frame-test.js`, `service-worker.js` (v134), `steep-core.js` (+WHATS_NEW).
- **The fence sees session-detail (R157):** `SURFACES` gains `sessionDetail`; positive assertion = `.sd-photo`
  at 2px — the **first box-less surface**, so the `.shelf-thumb` precedent stands in for a box. Three controls
  bite (fill on `.sd-sec`; torn radius on `.sd-photo` ×2). **19 → 22 checks. 32 suites green.** Ledger:
  **R156** (session-detail re-dressed; no BOX) · **R157** (fence third surface + no-box positive-assertion).
- **Left for Niklas's live look:** the F33 grouping-read — "Steeps · N", "Your note", "Taste words" must read
  as three distinct sections, not one merged run — and the two open hairline questions (band top vs topbar;
  first row under `.rule-head`), built like-for-like, not pre-diverged; they resolve centrally.
- **NEXT — the road is near its end for Code-alone re-dresses.** After session-detail, the self-contained set
  is essentially spent: vessels is a trivial empty-state/segment tidy, and everything left (Home, Settings #8,
  Insights, stat cards, steeping, **tea-detail**) is entangled behind a Design thread or the tea-detail
  **mark-remediation** (inline `var(--jade-pale)` → rationed marks; needs a markup-level guard, not the CSS
  fence — being folded into R5-AUDIT deferrals). Slice 4 is likely the inflection: the small vessels tidy, or
  hand back to Design to wake the entangled surfaces. **SECURITY stays the deferred pre-widening gate**, not
  the next slice. The two v4.22 cosmetic items remain open for the phone look — not re-touched.

**Previously — v4.23 (SHIPPED, LIVE `a2dcf2b`) — R5 slice 2: the Shopping list re-dressed to the spine** (cache
**v133**, APP_VERSION v4.23, **no SQL**). The spine rollout (slice 1 = the shelf, v4.22) continued onto its
second surface — `viewShopping`, **containers only** (F33, no global find-and-replace). Shopping was the
low-entanglement pick: a self-contained list screen absent from the R5 punch-list **and** the issue inbox,
so a containers-only pass can't read half-done (Home carries an element-mix + greeting-bug thread; Settings
carries #8 — both would).
- **What shipped:** masthead → **BAND** (`.shop-band` composes `.band`, layout mirrors the shelf's
  `.lib-band`); the add-to-list form → **BOX** (`.shop-add` carries the box values itself, radius 14→2px,
  mirroring `.shelf-card`); the two lists → **RULE** sections (`.shop-sec` wrappers, each opened by an
  `.eyebrow.rule-head`; rows were already ruled); the one committing action → the **SLAB**, `＋ Add` swapped
  jade `.btn-primary` → the existing `.btn-clay` (clay cap held — per-row `.lib-chip`/`.icon-btn` stay
  quiet). Shared `.section-title` (24 sites) / `.btn-primary` (20 sites) UNTOUCHED. Files: `styles.css`,
  `steep-shopping.js`, `fixtures/frame-test.js`, `service-worker.js` (v133), `steep-core.js` (+WHATS_NEW).
- **The fence sees Shopping (R155):** `fixtures/frame-test.js` refactored from a flat list to a per-surface
  registry (`SURFACES={shelf,shopping}`, `FRAME=[...flatten,'.band']`); `.shop-add` makes a positive box
  assertion, and three shopping negative controls bite (fill on `.shop-row`; torn radius on `.shop-add` ×2).
  **19 checks** (was 16). **32 suites green.** Ledger: **R154** (Shopping re-dressed; clay cap held) ·
  **R155** (fence per-surface registry).
- **Left for Niklas's live look** (one-line follow-ups if they bug him): the `.shop-band` top hairline vs
  the topbar border (built like-for-like with the shelf, not pre-dropped — the same open question the shelf
  has); the first `.shop-row` hairline under each `.rule-head`; the two-section grouping read (Running low
  vs Your list). **Filter chips / type-tints UNTOUCHED** (board-13-rev2, a separate Design thread).
- **NEXT:** the R5 spine rollout continues — remaining surfaces per-surface (F33), then the per-screen
  redraws (Home element mix, shelf board-13-rev2, stat cards, steeping) hang off the spine. **SECURITY stays
  the deferred pre-widening gate** (below), not the next slice. The two v4.22 cosmetic items (slab
  masthead-vs-bottom; possibly-doubled top band hairline) remain open for Niklas's phone look — not
  re-touched this slice.

**Previously — v4.22 (SHIPPED, LIVE `e8c18fa`) — R5 slice 1: the surface-language spine + shelf pilot** (cache
**v132**, APP_VERSION v4.22, **no SQL**). R5 lands the design overhaul the R2/R3 boards drew (founding ref
`docs/r5/planning/R5-AUDIT.md`); slice 1 adds the FRAME SYSTEM and re-dresses the SHELF as its pilot,
**containers only** (F33 — no global find-and-replace). Three commits, all on origin/main: docs `4ef2db9`
(ledger R146–R152 + board bank + §8) → docs `04808be` (CHANGELOG + STATE) → **app `e8c18fa` (deployed)**;
the unfold-curve brew-advice note parked at `7cc30b2`.
- **What shipped:** the four container primitives `.rule`/`.rule-head`/`.band`/`.box` (SLAB = existing
  `.btn-clay`, no second clay container); `--band` = **alias** of `--porcelain-dim` (zero new hex, R128,
  dark value free); the shelf re-dress — BAND masthead, BOX grid cards 16→2px, photo thumb 5→2px (board
  §1d), Add → clay slab (`.btn-add-slab`); rows were **already** RULE. Files: `styles.css`, `steep-teas.js`,
  `steep-core.js`, `service-worker.js` (v132), `fixtures/frame-test.js`.
- **Ledger:** the v4.21 picker reconciliations landed as **R146–R152**; R3-STATUS §8 gained **item 24**
  (R152's clay-cap catch — "a check saw red and it mattered"); the **F31 fill-law fence minted R153**.
- **The fence is the durable win** (`fixtures/frame-test.js`, R153): frame backgrounds ∈
  {`--porcelain`,`--band`,`--white`}, frame radii ∈ {0,2px}, torn radius rationed to the liquor swatch
  (SVG, R145) + the clay slab alone. Measured from **SOURCE** (R127/R128 — the board's `9/4/8/5`/`14/5/12/6`
  are its drawing; shipped is `8/4/7/4` + `.btn-clay 15/5/13/5`). 16 checks, six negative controls bite.
  **32 suites green.**
- **Two cosmetic items LEFT for Niklas's live phone look** (post-deploy follow-ups if they bug him, NOT
  pre-push): (1) the SLAB is in the masthead vs the board's bottom-of-list placement (one-line layout
  follow-up); (2) the top-most BAND's top hairline may double with the topbar border — drop it for the top
  band if so. **Filter chips / type-tints UNTOUCHED** (board-13-rev2, a separate Design thread).
- **NEXT:** the R5 spine rollout **continues** — the remaining surfaces, per-surface (F33), then the
  per-screen redraws (Home element mix, shelf board-13-rev2, stat cards, steeping) hang off the spine.
  **SECURITY is the deferred pre-widening gate** (below), not the next slice.

**Previously — v4.21 (SHIPPED, LIVE `71ad774`) — the session pickers (#14)** (cache **v131**, APP_VERSION
v4.21, **no SQL**). Tea + vessel are chosen on searchable **R58 SCREENS**; the three native selects
(setup, quick-log twin, edit modal) are retired. `teaRowIdentity` extracted from `shelfRowHTML` (one
writer, two wrappers — the spine re-dresses both); `pickChoose` dispatches by kind to
`d_setTea`/`d_setVessel`/`es_set`, so `methodPrefillFor` is **NOT bypassed** (a Kyusu still sets
`senchado`). Flat list + type filter, finished behind "show finished (n)", optional **"No vessel"** row
(R43). **Not in `HISTORY_VIEWS`** — in-screen "← Back"; a back-gesture exits draft-safe (v4.17 pattern).
**No long-press** (R89 deferred → its own gesture+commit build). **38 suites green** (new `pick-test.js`
15; `liquor` §F/F5b retargeted to `teaRowIdentity` + F5c; `render-smoke` 15→17 views). **No on-device
smoke** — DOM navigation, not touch.
- **PUSHED: origin/main = `71ad774`** (code) atop `28e930c` (R5-AUDIT) atop `b208a47` (v4.21 docs);
  verified at origin — APP_VERSION v4.21, cache v131, `viewPickTea` + `pick-test.js` present. Origin is
  consistent (code + docs both v4.21). The **R5 founding reference is `docs/r5/planning/R5-AUDIT.md`**.
- **NEXT: R5 continues — the SPINE ROLLOUT** (the surface-language frame system, per-surface, F33). The
  **greeting-copy bug** is available as a small early slice.
- **SECURITY is DEFERRED by decision (2026-08-28)** — it comes **after** the design work, **re-blocking
  before the beta widens** (before the next person logs in): the **pre-widening gate**, not the next
  slice. `SECURITY.md`'s two HIGH findings remain that gate; nothing about them changed.

**Previously — v4.20: the shelf leads with the swatch** (SHIPPED, live `5f8a28e`; cache **v130**,
APP_VERSION v4.20, **no SQL**). The library ROWS lead with the liquor swatch
and the photo trails as a 26×26 square thumb (board S1/S2, photo KEPT — F4/TD1). `swatchAttr` gained
R124's predicate `hasLabel` and is now **polymorphic by site** — CSS attributes for `.ref-swatch`/
`.social-tile`/`.today-tint` (unchanged), an SVG `<path>` for the shelf (R145): filled 1px at tier 1/2, a
dashed 1.5px plate (`dasharray "13 6"`, R144) at tier 3. `swatchAttr` stays the single writer (R124); a
standalone renderer §F can't see would pass `painted===3` vacuously (R132). Path `d` lifted verbatim from
the board (`shelf-swatch-ruling.dc.html:776`, R128); stroke/fill via `var(--line)`/`var(--liquor-*)`.
- **CARRYOVER (the later lane that enables the predicate on ref/social):** `.ref-swatch`/`.social-tile` are
  filed behind a later version — **after v4.20, sequence not yet ruled** (the R5 spine rollout is next; security is deferred — the pre-widening gate),
  R125. Enabling `hasLabel` at those two sites flips them **CSS→SVG**, which is R145's "at both tiers an SVG
  path" landing as R125 staged. `.today-tint` keeps its tint permanently by the predicate, not exemption.
- **Tests:** `liquor-test.js` §D (11) + §F (10, `painted 3→4`, `tinted` stays 11); F5→F5a/F5b (photo-trails
  pinned on `shelfRowHTML`'s body); self-exclusion regex updated + **negative control proven** (stale regex
  → 12/5). `shelf-order-test.js` gained `steep-tea-types.js` — the sweep caught `shelfRowHTML`'s new
  `liquorFor` crashing its under-provisioned sandbox. **37 suites green.**
- **NON-AUTOMATABLE GATE (smoke.md F29):** the ~1.3:1 plate legibility on a dimmed dark screen and CSS-var
  resolution on an SVG stroke are not vm-reachable — Niklas confirms on device before push. Live shelf:
  **12 filled / 9 plates** (matches the board's split).
- **Split-push:** docs (CHANGELOG, STATE, ROADMAP, smoke.md, SPEC §9/§10) **pushed on write**; the code
  commit (`steep-teas.js`, `styles.css`, `service-worker.js`, `steep-core.js`, `fixtures/liquor-test.js`,
  `fixtures/shelf-order-test.js`) **pauses UNPUSHED for review + the F29 phone check** — Niklas pushes.
- **NEXT: the security/legal hardening pass** (`SECURITY.md`'s two HIGH findings — the beta blocker; its
  own turn, not squeezed behind more build).

**Previously — v4.19: the liquor picker (R39/R89)** (cache **v129**, APP_VERSION v4.19,
**no SQL** — `v3_12` shipped v4.14). Slice 3 of 3 of the liquor swatch model; **unblocks #14 (R89)**.
**PUSHED: origin/main = `1ee6aaf`**, docs (`e6e5075` v4.19 + R143) below it; verified at origin — cache
v129, APP_VERSION v4.19. Code commit = `steep-teas.js`, `styles.css`, `service-worker.js`, `steep-core.js`,
`fixtures/liquor-test.js`, `fixtures/liquor-review.js` (a local, gitignored `xss-render-test.js` also
updated — it does not travel).
- **The COLOUR row** (tea form, after Type, above the Specifics fold): preview swatch + tier-honest source
  note + inline **13-cell `<button>` grid** (default cell + 12 ramp stops), `aria-pressed`/`aria-label`.
  DOM-only, never `render()`; selection writes a hidden input + dispatches `input` (WS1 dirty guard,
  `acceptOriginOffer`'s pattern); clearing → default cell → `''` → `null` → tier 2 (E4).
- **F1 fixed** — `submitTeaForm` silently dropped `liquor` (wrote 22 of `teaFromDb`'s 23 keys); now gated
  through `isLiquorKey`, and `liquor-test.js` **§G** asserts the **general** containment (`submitTeaForm`
  keys ⊇ `teaFromDb` keys), so the NEXT dropped field reddens too.
- **F2** — the default follows the NAME via `matchTeaType`, not the type (built to §4.1, not board #06 rev
  4). **Geometry R121** — preview 26×34, cells 22×22 (#06's 40×50 not adopted).
- **A2 fold** — `liquor-test.js` **D1 crossed** (picker exists → form-control fence; tea detail no in-place
  picker F6, no long-press dev.3); **D3 unchanged** (shelf renders none); **R124–R129 recorded as the
  v4.20 fences** (D6 pins `swatchAttr`'s signature). Site scan 9→11 tints (the +2 = picker tier-3 fallback,
  classified). **F4/F5 housekeeping** done in SPEC §7 / `liquor-review.js`.
- **No on-device gate** (smoke.md — DOM form state, vm-reachable). **30 committed suites green** (+ 7
  local; a local `xss-render-test.js` gained `steep-tea-types.js` in its sandbox) on the fresh
  **2026-08-26 export** (swapped this session; the Aug-17 set → `fixtures/archive/2026-08-26-pre-v4.19/`);
  `liquor-test.js` 59→**72**.
- **TWO JUDGMENT CALLS — both RESOLVED (R143).** JC1: the COLOUR row above the fold on **Add** (the one
  spot that brushes WS1's "name and type are all you need") — **Niklas looked at the rendered Add form
  and ruled it reads calm** (R143); no Add/Edit split, the tension is closed, v4.20+ don't reopen it.
  JC2: the tier-3 preview re-tinting on **type** change — correct (the tier-3 fallback is type-derived;
  the liquor still follows name only). **Both filed R143** (ledger). *(Filing R143 surfaced that
  **R139–R142 were absent from the ledger** despite being referenced here + in CHANGELOG/smoke — now
  **backfilled verbatim** (ledger R138→R143 contiguous); the contiguity failure is **§8 item 23**.)*
- **NEXT: v4.20 — the shelf, UNBLOCKED** (R141 ladder). Swatch-led rows per **R124–R129 + R144/R145**
  (dark plates = dashed 1.5px `--line` **SVG path**, not a CSS border — R145; `liquor-test.js` §D's D3/D6
  assert against a path when built). **Design's dark redraw LANDED + reconciled this session** — F20/F21/F30
  closed on the board, banked at `docs/r4/boards/shelf-swatch-ruling.dc.html`; **F29 (dashed plate on a
  dimmed screen) is the on-device item.** **Refresh the export first** — the shelf reads composition
  (R124–R129's fill/plate/scripted split was last confirmed at 58 sessions). Then the **security/legal
  hardening pass** — `SECURITY.md`'s two HIGH findings are the **beta blocker**, and it must be a turn
  *about* security, not squeezed behind shelf-shaped work (§8 item 23's neighbourhood). Then the beta is
  reachable.

**Previously — v4.18: #33/#30/#31, wake-lock bundle** (cache
**v128**, APP_VERSION v4.18, **no SQL**). Three feature commits + a release note.
- **#33 (R7):** screen stays awake while a steep timer runs, **and only then** — the lock follows the
  timer's `running` state (R142), not the session's existence. Acquire on start; release on
  pause/complete/`clearTimerInterval`; `onAppVisible` re-acquires on return **guarded by
  `timerRunning()`** so a paused steep is never held awake. Fail-silent.
- **#30-B (R142):** a timer left mid-steep **holds where you left it** — `onAppHidden` freezes a
  running steep on hide, before the draft persists. **No wall-clock** (rework A rejected): the app
  can't see the pot, so a "caught-up" clock would assert progress it never measured. Matches #35's
  restore-paused.
- **#31:** `VESSEL_TYPES` += `'Matcha bowl'` (separate commit; `VESSEL_KANJI` stays 3).
- **`fixtures/wake-timer-test.js`** (15, 2 controls bite) guards the running-scoped lock + pause
  logic; **30 committed suites green**. **NON-AUTOMATABLE GATE (smoke.md):** wakeLock has no vm reach
  — screen-stays-lit + lock-follows-running verified on device before push.
- ~~**NEXT: v4.19 — slice 3, the picker (R39 / R89).**~~ **SHIPPED v4.19 (see NOW block above).** **BUILD AUTHORITY = `SPEC-liquor-swatch-model.md`
  §4.1** — the full approved control spec (COLOUR row after Type, 13-cell grid with `<button>`+
  `aria-pressed`, DOM-only never `render()`, hidden field + `input` dispatch, form-Save commits,
  clear→default→tier 2), **F2** (the default follows the NAME via `matchTeaType`, not the TYPE — build
  to §4.1, not board #06 rev 4), **F1** (the containment guard: `submitTeaForm` writes ⊇ `teaFromDb`
  produces — it silently drops `liquor` today), **R121 geometry** (preview 26×34 `.ref-swatch` family,
  cells 22×22, #06's 40×50 NOT adopted), the **three accepted deviations**, and the **A2 fence timing**
  (R124–R129's fences fold into SPEC §9 + `liquor-test.js` §D as part of v4.19's touch of that suite —
  D1/D3 predate those rulings). All six were chat-only until the 2026-08-26 handoff; now in §4.1.
- ~~**Refresh the export FIRST**~~ **DONE v4.19** — export swapped to the **2026-08-26** set (Aug-17 →
  `fixtures/archive/2026-08-26-pre-v4.19/`); `/slowcup-deploy dry` ran clean before any file was touched.
  `swatchAttr`/`liquor-test.js` were in scope (S3 = R124–R129); **the shelf's R124–R129 fences remain
  v4.20** — recorded in `liquor-test.js` §D/D6, not built this slice.

**Previously — v4.17: #34/#35, work no longer lost** (cache
**v127**, APP_VERSION v4.17, **no SQL**). R137's one slice, two issues — the only queue item that
loses a user's work permanently.
- **#35 (R139):** `state.sessionDraft` was memory-only → an eviction mid-sitting lost it.
  `saveDraft`/`loadDraft`/`clearDraft` in `steep-data.js` beside the queue; pure `draftForPersist`
  in `steep-sessions.js` strips the inline `data:` photo (quota — a `QuotaExceededError` would break
  the *queue*) and pauses the timer. Persist on `pagehide`/`visibilitychange:hidden`, dirty drafts
  only; restore **silent** (R140), lands on the session. Photo-drop announced once at restore,
  past-tense, or dropped if it can't lose the imperative.
- **#34:** `history.pushState` rides `saveView` (the single writer; `openTeaDetail`'s hand-write
  folded in — F24 closed). `HISTORY_VIEWS` = read surfaces; session flow **absent** (popstate not
  cancellable → Back can't resurrect a live steep; it pops to the last tab, draft safe). Handler sets
  `state.view` directly, never `goView`.
- **NON-AUTOMATABLE GATE, standing:** no vm suite reaches pushState/popstate — **Niklas verifies the
  back gesture on device before push** (this deploy's step 7). `session-draft-test.js` (34 checks, 4
  negative controls bite) guards the R139 strip + history fence + single writer + clear sites. **29
  committed suites green** on the fresh 2026-08-17 export.
- **v1 scope flagged:** session-detail/origins don't push (pop to last tab); modals a separate axis,
  not built.
- **NEXT: v4.18 — #30/#33** (wake-lock bundle, R7 ratified-unbuilt), then **v4.19** slice 3 picker,
  **v4.20** shelf (R141 ladder). `/slowcup-deploy dry` first, before any file.

**Previously — v4.16: R123, the greeting looks at the day** (cache **v126**, APP_VERSION
v4.16, **no SQL**). **Niklas found it by using v4.15** — *Earlier today* listed his two sittings
while the masthead told him to go and have a tea. Fifth defect this round found by looking.
- **R117's one boundary HELD.** Both readers call `sessionsToday()`. The divergence was one layer up,
  in the **branch predicate**: the v3.67 ack gates on `bucketSessions` (today narrowed to the current
  hour bucket), so a morning brew read at 14:00 skipped every ack and fell through to rediscovery —
  present tense, with clay. The greeting already held **both** readings (the zero-session evening
  branch gates on the DAY), and that inconsistency inside one function is the whole defect.
- **R123 adds a day-level branch**, past-tense ack + the existing forward tail, **countless by rule**
  (R119: a numbered line here ships the filed COUNTED-UNIT item). Clay suppressed **by construction**
  — `card(ack+tail)` with no `commitTea`, exactly as the bucket branch does; R120 reaches it by its
  own terms. `home-test.js` **B8 reddened at "six return paths (got 7)"** and the seventh is
  classified: **7 paths, still exactly 2 committing.**
- **`bigDay` is NOT dead code** — the planning note's premise was wrong. It renders today whenever a
  sitting is in the current window (a two-sitting morning at 10:00 says *"Second pour today"*). What
  it could never reach is **precisely the case R123 creates**, and the likeliest one: a big day is
  read *after* the brewing. It renders in the new branch from its pool's four **countless** lines;
  the bucket branch's seven are untouched (two carry the ordinal — R119's item, not this deploy's).
- **One tail writer** (`dayTail`), because duplicating it would recreate the two-readers fault one
  level down. **Proven inert:** greetings dumped over the real export, 7 hours × 2 scenarios, are
  byte-identical on every bucket-branch row.
- **`d_rediscoveryPick` takes `d_scorePick`'s calendar anchor.** On the wall clock the sentence moved
  inside one day — **"4 weeks" at 14:30, "5 weeks" at 19:30**. The pick was stable; the number wasn't.
- **A second v4.15 defect closed in passing:** a shelf entirely brewed today rendered `card('')` — a
  greeting with **no line at all**. Found while building a negative control.
- **THREE new checks were wrong first, each caught by RUNNING the control.** J4 tested "names any
  tea" (the tail names one either way); **J1 passed twice with the branch disabled** (v3.55 redirect
  already suppressed clay for a morning-only drinker; then a two-tea shelf gave an empty body);
  **K3 passed on the reverted anchor** until the fixture brewed 49 days back at midday so the week
  boundary falls inside the day (control now reddens `6/7/7`). `J3b` deleted — it read `|| true`.
- **The planning lane's proposed check would have passed on v4.15**; the suite asserts the
  **property** instead. Section counts are **derived from `passed`**, not written.
- **PUSHED.** `origin/main` is `2eaba73`; slowcup.app serves `APP_VERSION v4.16` / `CACHE_NAME v126`,
  verified at the origin rather than from the tracking ref.
- **NEXT: v4.17 — #34/#35, the draft-loss slice (R137). THE GATE IS OPEN.** ~~v4.17 — slice 3, the
  picker~~ — **renumbered by R141**: the picker is now **v4.19**. The R4 ladder is **v4.17** #34/#35
  (back-gesture exits the app + session draft is memory-only → swipe back mid-sitting loses the cup;
  **the only queue item that loses a user's work permanently**) · **v4.18** #30/#33 (wake-lock
  bundle, R7) · **v4.19** slice 3 the picker (R39) · **v4.20** the shelf. `/slowcup-deploy dry` runs
  first, before any file. **v4.17 mechanics, ruled:** draft persists via `saveDraft`/`loadDraft`/
  `clearDraft` in `steep-data.js` beside `saveQueue` (R139); the inline photo is stripped on persist
  and the app says so once, at restore (R139); restore is silent (R140); history rides `saveView`
  not `goView` — `goVessels`/`goFriends` bypass `goView` (R140); `popstate` plan comes back for
  review before it is built.
- **SLICE 3 (picker) is now v4.19, and its S3 rulings still stand** — `swatchAttr` and
  `liquor-test.js` stay untouched until it opens. **R124** puts tier 3 behind a *predicate* (is a type
  label in this row?), not a site list; **R125** reaches three of four call sites but **only the
  shelf**, which is **v4.20** (renumbered twice — R125's heading records both), after slice 3 *and*
  Design's dark redraw. `.ref-swatch`/`.social-tile` filed behind v4.20; `.today-tint` keeps its tint
  permanently, by the rule not by exemption. **R129** drops per-tea script from the shelf row
  (`refScript` returns array position, not a fact). **R126** carries the tier distinction in border
  *style* — solid hairline for measured, dashed for plates — because `ivory`'s 1.17 margin over
  `GROUND_MIN` was never load-bearing. **R127 retires `#F5F0E3`**: 21 of 23 boards use it, zero app
  files do, 13.9 below the real ground. **R128** — look at renders to find, read `styles.css` to measure.
- **`/slowcup-deploy dry` RUNS FIRST, before any file is touched.** It was owed at v4.16 and missed;
  slice 3 edits `swatchAttr`, which is the whole reason for the step 0/1 ordering constraint.
- **Stale-SW precondition before any visual check** (R122's queue): unregister every worker, delete
  every cache, then **assert** the rendered `APP_VERSION` equals the bump. Three deploys reported
  "the Browser pane refused localhost" while a worker at cache v114 served v4.04 from disk.
- Carried into slice 3: F1's containment guard (`submitTeaForm` silently drops `liquor`), F2's
  name-vs-type mechanism, F4's stale §7 dark hexes, F5's self-falsifying `liquor-review.js` header,
  F6's stated-not-discovered secondary path, three accepted deviations, and **R121's scale-the-lock
  method for any new geometry**. **28 suites green** (greeting-v4 62 → 72).

**Previously — v4.15: the swatch becomes visible** (cache **v125**, APP_VERSION v4.15,
**no SQL** — `v3_12` shipped with v4.14). Slice 2 of 3. **The first time a liquor renders anywhere**,
four rounds after contract 1 was locked.
- **Three slots, one writer** (`swatchAttr`, steep-teas.js): `.ref-swatch` · `.social-tile` ·
  `.today-tint`. **Tier 3 lives at the render site**, not in `liquorFor` — tier 3 is a CSS class.
- **The scan is the deliverable and it points the OPPOSITE way from R104's.** Twelve `t-<type>`
  writes: 3 swatch slots · 3 photo placeholders · **4 type LABELS** (pills reading "Oolong" —
  painting one would be an active regression) · 2 chart segments. **A mechanical swap would be wrong
  at six of twelve.** §F asserts the classification; liquor-ising the shelf pill reddens five checks.
- **Three fences crossed, all REWRITTEN not deleted, and two lived in other suites** — `liquor-test`
  D3 → "the **shelf** draws no swatch" (deferred to a board; `shelfPhoto` holds that position on
  evidence, R81); `pass-record` D6 → "no invented **colour**". `stat-period` broke on a fixture load
  order the app never had.
- **`.today-tint` gains the hairline**, closing the `ivory`-at-19.2 item.
- **NEXT: slice 3, the picker** — form control first (keyboard-reachable, testable), long-press
  optional. **Clearing must return to tier 2**, already asserted at E4. Unblocks #14 (R89).
  **28 suites green.**

**Previously — v4.14: the liquor cascade — migration, mappers, resolver** (cache **v124**,
APP_VERSION v4.14, **`sql/v3_12-liquor.sql` applied BY HAND BEFORE THE PUSH**). Slice 1 of 3;
**nothing renders a swatch yet.**
- **Read time, never stored** (R97's `catalog_slug` reasoning applied to colour) — so authoring a
  catalog liquor later upgrades teas already on the shelf, and **clearing a correction returns the
  tea to tier 2 by construction**, because tier 2 was never copied anywhere. E4 asserts it.
- **An unknown key degrades to tier 2**; `LIQUOR_KEYS` is the membership set. That is why the column
  stores a key, not a hex.
- **Tier 3 is not a failure state** — nine of 21 teas land there (one deliberately null, eight with
  no catalog match).
- **The site scan is slice 2's deliverable and pointed the other way from the currency scan:** of 12
  type-tint uses, only **3 are true swatch slots** (`.ref-swatch`, `.social-tile`, `.today-tint` —
  two already carry the hairline border, and giving the third the same **resolves the `ivory`-at-19.2
  item**). **3 are photo placeholders**, **4 are type LABELS** (pills reading "Oolong" — liquor-ising
  one would be an active regression), **2 are a categorical chart**. A mechanical swap would be wrong
  at six of twelve.
- **Shelf swatch DEFERRED to a board** — `shelfPhoto` holds that position with evidence behind it
  (21/21 teas have photos), so a swatch there is an addition nobody has drawn (R81).
- **28 suites green. NEXT: slice 2** (the three slots + the classification scan), then **slice 3**
  (the picker — form control first, long-press optional; there is **no long-press machinery** in the
  app, only six touch handlers and none of them a long-press).

**Previously — v4.13: the dark pale end collapsed, and A3 was asserting a proxy** (cache
**v123**, APP_VERSION v4.13, **no SQL**). v4.12 shipped a collision the suite reported green on.
- **1.9 luminance between `yellow-pale` and `gold-pale` in DARK** — one fifth of their 9.2 light
  spacing — so Huang Ya and Fujian White would have been the same swatch on a dark card. Cause: A5's
  stops move down in dark while `gold-pale` was lifted up, closing the gap from both sides. **Each
  change was individually defensible**, which is why nothing caught it.
- **A3 was a PROXY that permitted the property to fail.** "Every dark stop is lifted" was protecting
  *adjacent stops stay tellable apart in every theme* — now asserted directly: **≥9 luminance between
  every adjacent pair, in both blocks**, the threshold taken from the light column's own tightest gap
  (9.2). **Where a proxy and the property disagree, assert the property.** No exemption list to
  maintain.
- **A3b, the ground check that was also missing:** every stop **≥18 from the card it sits on**. Same
  class — "can a human tell these apart" — separation from the surface rather than the neighbour. It
  is a **collapse detector and says so**; `ivory` at 19.2 in light is the tightest and unseen.
- Dark pale end retuned (`yellow-pale`, `gold-pale`); **light column verified unmoved by diff**.
  **28 suites, all green.**

**Previously — v4.12: A5, the ramp goes to twelve stops** (cache **v122**, APP_VERSION v4.12,
**no SQL**). Niklas tasted the four `gold-pale` teas; `ivory` (bud-only whites) and `yellow-pale`
(the one yellow row) came out of it. **Shelf now shows EIGHT distinct swatches across 12 teas.**
- **Both new stops are per-slug exceptions for the same reason: the separating fact is not a field.**
  Bud-only vs buds-and-leaf is recorded nowhere; `men huang` is a process step the catalog doesn't
  hold (which is why `huang-ya` reads `ox 0-0, roast:none`). **Third instance** after hojicha's roast
  and pu-erh's family.
- **Placement was set by TASTE, against the rule** — men huang predicted yellow *deeper*, Niklas
  reports paler, so `yellow-pale` sits **above** `gold-pale`. **C9 guards that specific ordering**, so
  a later reader can't "correct" it back to the reasoning. `bai-hao-yin-zhen` is **inferred, not
  tasted**.
- **These two are the ramp's only UN-LIFTED stops** (ivory 234.8→230.9, yellow-pale 225.3→223.7) —
  measured at the build, not taken on trust. A3 asserts the exemption **set by name**, so a third
  reddens it.
- **A6: Ruby Ruanzhi has NOT moved** (C10). A tea that disagrees with its style is tier 1; a style
  that disagrees with itself is a catalog defect — and the fixes are incompatible. Check is MainTee
  Würzburg's own description. **Also open:** the 2021 Fujian White may be aged-white-vs-fresh-yellow.
- Fences unchanged: no `teas.liquor`, no cascade, nothing renders a swatch. **28 suites, all green.**

**Previously — v4.11: R4's second half, the liquor swatch model** (cache **v121**,
APP_VERSION v4.11, **no SQL**). **Contract 1 was the last of the five visual contracts unbuilt;**
the model R82 found had never been written is now `docs/r4/planning/SPEC-liquor-swatch-model.md`.
- **Ten-stop ramp as `--liquor-<key>` tokens, both themes; `liquor` on 44 of 55 catalog rows.**
  **Nothing renders a swatch yet** — no `teas.liquor` column, no cascade. That is the fence (R116),
  not an omission, and `liquor-test.js` §D asserts it.
- **Dark is LIFTED, not inverted** — inverting would render pu-erh pale, and a pale pu-erh identifies
  a different tea. The order-guard is written against the **brown arm** only, because §2 gives the
  ramp a green arm too.
- **Eleven rows are deliberately null** (ten resolve to `roast: variable`, plus sheng pu-erh) — §B is
  the assertion this slice exists for, and it must be read on **resolved** rows: raw rows find three,
  resolved find ten.
- **§8 covered 54 of 55 rows.** `gui-fei-oolong` was missing and is on the shelf → ruled **`amber`**,
  so **the ramp has no headroom stop**. The spec's own generation run had printed it; the table was
  hand-written from memory. Seventh wrong-representation instance this round.
- **`liquor` is NOT in `TT_INHERIT`** — every member is authored explicitly, so inheritance would
  only ever let a future member inherit a colour nobody authored.
- **Expected quiet:** six distinct swatches over 12 teas; **nine stay on the type tint** (one
  deliberately null, eight with no catalog match). Correct by construction. **28 suites, all green.**
- **NEXT: the migration + the read-time cascade**, then the picker (R39), which unblocks #14 (R89).

**Previously — v4.10: R4 opens with the Home revision** (cache **v120**, APP_VERSION v4.10,
**no SQL**). **R3's build is closed; R4 is scoped by R93 as the Home revision (this) + the liquor
swatch (next).** R4 keeps no separate status doc: **this file plus the ledger is R4's state.**
- **The board is banked at `docs/r4/boards/`** — a new round folder needs **both** repo rules or it
  silently doesn't ship (`.gitignore` negation is path-scoped to r3; `.gitattributes -text`).
  **The ledger keeps its `R3-` name on purpose**: six docs cite it and one is CHANGELOG, which is
  never rewritten. Numbering is continuous — R113–R116 are R4's.
- **The greeting is the masthead, not a card.** Migration is free: `dashLayout()` already filtered
  both `order` and `hidden` against `DASH_DEFAULT_ORDER`. **It overrides a deliberate hide**, by ruling.
- **Clay exists for the first time** (`.btn-clay`, spine only, at most one per surface). Both masthead
  actions guard the dirty draft — this button is the first thing on the first screen.
- **R116: three of the five visual contracts shipped unimplemented.** Clay and washi were never built,
  so **R59 deferred a probation on a phantom and R113 accepted a cost that didn't exist**. Audit:
  liquor unbuilt-but-declared · clay built now · **xanthous built and confined** · kachi built v4.01 ·
  washi never built. **A locked contract is not implemented until something asserts it** — `home-test.js`
  §D is that assertion.
- **A negative control destroyed the build.** `git checkout -- <file>` restores from the **index**, so
  yesterday's rule is amended: **stage before you break anything.** Rebuilt, controls re-run staged.
- **R117 Earlier today** (its own card, not `recent` rescoped; boundary shared with the masthead via
  `sessionsToday()`; leads the stack; no stars; absent until the first cup) · **R118** glance rows open
  **detail**, fixed on the new card *and* `recent` · **R119** a cup is a steep — the greeting's counted
  "pour"/"steep" language is a defect **left for its own change** (R61) · **R120** clay stays suppressed
  beside a forward suggestion · **R121** only one swatch geometry is locked.
- **The R119 audit corrected two of its own premises:** `"Your 140th cup."` **exists nowhere** (one
  ordinal call site in the app, `steep-dashboard.js:900`), and grepping "pour" **under-counts** — the
  same pool attaches the same sitting ordinal to the word **"steep"**, which is the sharper
  contradiction. One call site, two mislabelled units. **Filed in ledger §4 as a COUNTED-UNIT item,
  not a copy item**: `:900` counts sittings, so relabelling alone would rename the same wrong number.
  The follow-up decides per line which unit the sentence means and which count feeds it.
- **Sixth instance of a check reading its own prose.** Every source `home-test.js` reads is
  comment-stripped. **Seventh: E4 matched the function's own declaration** — anchor on the call site,
  never the definition.
- **Clay reached one of its two branches, and LOOKING found it.** The masthead has six return paths;
  the first build wired only the bucket suggestion, so a furnished Home on the **rediscovery** branch
  ("waiting 4 weeks — today?") had no committing action. §B's "at most one clay" **passes at zero**;
  B8/B9 now enumerate the six paths and assert exactly two commit. The ship report also miscounted
  from a `grep -o` over the review page — which inlines the stylesheet — one deploy after that exact
  lesson went into the ledger. **Count what renders, not the file it lives in.**
  **27 committed suites, all green. NOT verified visually by me** (third deploy running).

**Previously — v4.09 R3 slice H3: #09 the door. THE R3 BUILD IS COMPLETE** (cache **v119**,
APP_VERSION v4.09, **no SQL**). Slices A · B · B2 · B3 · C · D · E · F · G · H1 · H2 · H3 all shipped.
- **`renderLogin()` stayed in `steep-data.js`**, as instructed and for a structural reason: it runs
  before boot, so there is no `state`, no `render()` and no inline-onclick pattern, and its handlers
  are wired directly because the auth functions are closure-private. Said in the code.
- **R29's door does double duty** — breathing ensō (clay) · wordmark · *"a slower cup, better kept"* ·
  the what-it-is line · Keep · Brew · Share · email → **Send magic link** · OR · Google · *"Invitation-only
  for now."* · version stamp. **The board's "Continue" was not taken**: its own flag delegates the
  mechanism, so "Continue" was the label for an *undecided* one. **Autofocus removed** — the keyboard
  covered the half of the screen that says what SlowCup is.
- **R33 by reuse:** the `#enso` symbol already existed in `index.html`'s sprite, **outside `#app`** —
  checked, because `renderLogin` overwrites `#app`. One definition, shared with the timer.
- **R94 holds on the most tempting screen:** no kachi token and **no hex** in the door's CSS.
- **The addendum was VERIFIED PRESENT, not written** — R19's zero-tea Origins state shipped in v4.07,
  the empty shelf and onboarding hero already read properly. Three surfaces checked, nothing authored.
- **R111** — `landing.html` is a superseded surface on a live public URL, orphaned by R29, **not
  touched** under R61 and flagged to the beta-hardening bundle. **R112** — the new suite asserts
  **source** (a closure-private function cannot be sandboxed) and says so; §D's empty states do render.
- **A layout defect shipped in the first cut and was caught by LOOKING** — the board is drawn at one
  height (812) and distributes slack with an auto top margin, so on a taller screen every extra pixel
  lands in one gap; Niklas saw ~500 px of it. Fixed as a flagged deviation: centred column, clamped
  gap, reviewed at 667/812/932/1280. **Third defect this round found by using the app; still none
  found by measuring.**
- **A check read its own prose for the fifth time, and this one had teeth** — E1 failed against the
  CSS comment explaining an auto top margin, which short-circuited a `&&` chain and let a stale
  `/tmp` file overwrite `styles.css` (recovered from git). **Strip comments before every absence
  check, in every language a suite reads; run negative controls through `git checkout`, never shell
  backups.**
- **NOT verified visually by me, second deploy running** — the Browser pane refused localhost all
  session. **26 committed suites, all green** (`landing-test.js` 31 checks).

**Previously — v4.08: the Origins map, rendered to the frame ruling** (cache **v118**,
APP_VERSION v4.08, **no SQL**). Three commits. **Niklas opened the map on a phone and two of its
seven marks rendered as one letter each** — "H" and "K", the two most-brewed origins.
- **The board that ruled direction 2 had never been banked.** It arrived after the export and lived
  only as a chat attachment, so the map was built to a summary of it — and a session searching for
  its two cited strings found nothing and reasoned from `origins-map-v3.html`, the **superseded**
  pre-direction-2 map. Now `docs/r3/boards/origins-frame-ruling.dc.html`, hash-verified on the
  staged blob. **Its badge says `R107`, which is taken** — the frame ruling has no ledger number.
- **One bug, not two.** Every dimension drawn over the outline was written as px inside a viewBox at
  3.727 px/unit: a **29.8 px** pin, an **18.6 px** label, a 24.2 px gap. `originsMerge` was the only
  dimension that took the conversion. One `upx` at the draw site now; sizes are the board's (pin 8,
  label 13, offset 6).
- **Rule 2's aspect expansion was missing, and that is what read as "cramped"** — 350×193 instead of
  350×258, ending just past the easternmost pin. **Japan's cut edge was a deviation from the ruling,
  not a consequence of it.** Scale moves 3.727 → **3.743**, nearer Design's published 3.74.
- **Deliberate deviation (rule 5):** flip when the label would not **fit**, not when the pin passes
  the outer 20%. Same two marks today; the proxy under-fires for a long name at 70%.
- **§F is the check that would have caught it** — 25 → 40 checks, negative controls proven, and
  **F3 forces every label right** so F2 cannot pass by construction. **NOT verified visually**: the
  Browser pane refused localhost all session. **25 committed suites, all green.**
  **NEXT: H3** — #09 landing, the last slice; do not move `renderLogin()` out of `steep-data.js`.

**Previously — v4.07 R3 slice H2: #37 Origins + the Passport removal** (cache **v117**,
APP_VERSION v4.07, **no SQL**). **New module `steep-origins-map.js`** — added to `index.html` AND
`FILES_TO_CACHE` — generated by **new `tools/gen-origins-outline.js`** (tracked: it produces a
shipped asset, so it is build infrastructure, not a fixture).
- **R106 built at direction 2.** 247 rings, 57 KB, no runtime dependency (d3 alone is 273 KB before
  its two companions, plus three CDN fetches that fail offline). **The tool refuses to write when a
  pin would land in the sea** — tolerance 1.0 is what that assertion permits, proven by running at
  1.5 and watching it exit 1 with the asset untouched.
- **The projection ships inside the asset**, beside the paths it produced, so a pin cannot be
  projected differently from the coastline. That is the reason Code generates the outline.
- **Every ruled figure reproduces**: 3.73 px/unit, 83% span, Kagoshima↔Chiran 3.3 px, tightest gap
  after merge 22.9 px, merged mark reads **"Kagoshima +1"**. My first build used a fixed 26-unit pad
  and got 2.69 px/unit and 60% — **the frame is the ruled span, not a padding number**, because a
  fixed pad silently changes what "14 px" means.
- **R45/R66 discharged — R3's only shipped-control removal, landed last.** Hub row and dot-map view
  gone; the passport TABLES stay and are used by Origins, asserted so "kept" isn't a euphemism.
- **The render harness caught the view swap on its first real test** (§C pins the list against
  `render()`'s routing). New `fixtures/origins-test.js` — **25 committed suites, all green.**
- **R105's rule is now in the verifier's standing method**: a check that cannot fail is worse than
  no check. ~~**NEXT: H3**~~ — **v4.08 came first**, above: the map shipped with its marks drawn
  3.7× oversized and two labels off the card, because this slice was built to a summary of a board
  that had never been banked.

**Previously — v4.06: R109, a passed tea goes to the wishlist** (cache **v116**, APP_VERSION
v4.06, **no SQL**).
- **R109 amends R36, and it is the first ruling this round overturned by USING the app.** Add-to-shelf
  claimed ownership of a tea the recipient had only been told about, **and the claim propagates**:
  0 g enters stock → `empty` under `stockTier` → Shopping's running-low list → a slot in "21 teas".
  The wishlist was already the right shape and needs no schema; **the sender's note rides onto the
  row with its attribution**, which the shelf had nowhere to put. Add-to-shelf stays secondary.
- **The guard is at the writer** (`addWishFromTea`'s had to move there after `rebuyYes` inherited the
  bug). Both halves proven by negative control; **F16 asserts the propagation rather than describing
  it**, because that is the part a future "simplify to one action" would not notice.
- **The map is still HELD.** Design chose direction 2 — country tier off the map, listed beside it,
  14 px merge rule, no edge indicator. Verified: 3.74 px/unit, 83% span. **Correction carried: the
  tightest remaining gap is 23.0 px (Hoshino↔Kagoshima), not 24.5** (that is Hoshino↔Chiran), and
  23 px is what the 14 px threshold is judged against. **Still owed by Design:** the merged-mark
  tie-break, and whether 14 px tracks pin width. **R45/R66's Passport removal stays behind it.**
  **24 committed suites, all green.**

**Previously — v4.05: R108's render smoke harness + R55's origin offer** (cache **v115**,
APP_VERSION v4.05, **no SQL**). **The map is HELD** — the planning lane measured the frame at drawn
size and ruled it a Design question (three collisions, and 44% of the frame empty because of one
outlying tea). Neither the outline artifact nor its generator is committed; both live in the
scratchpad. **R45/R66's Passport removal stays behind the map**, as ruled.
- **`fixtures/render-smoke-test.js` — 15 views × 2 passes** (real data, then an EMPTY account).
  Proven against the exact H1 defect: reintroducing it reddens two checks on `viewShopping`. **§D is
  the one that keeps the rest honest** — every other check passes against an empty string, so a view
  silently returning `''` would sail through while rendering a blank screen.
- **R55's offer does exactly three things** on this shelf — Gui Fei → Lugu, DHP → Wuyi Mountains,
  Ali Shan → Chiayi County (parentheticals stripped). R56 holds: no suggestion list.
- **A stated reason that was wrong, caught by negative control.** Oriental Beauty is suppressed by
  the slash rule, **not** the country-conflict rule the package describes — the conflict rule is
  unreachable on live data and is now isolated synthetically.
- **The three owed coordinate rows are still missing** (Wuyi Mountains · Lugu · Chiayi), so every
  accepted offer stays in the country tier. `tea-types-test.js` §I reports that itself now.
  **24 committed suites, all green.**

**Previously — v4.04 R3 slice H1: #08 Shopping + #07's currency row + R104's scan** (cache
**v114**, APP_VERSION v4.04, **no SQL**). **H is split three ways at the map** — H1 touches no
geography and ships now; **H2** (Origins + the map + the Passport hub-row removal) is **gated on
R106's outline artifact**, queued in ledger §4 as blocking; **H3** (#09 landing) stays last, because
R19's zero-tea Origins state needs Origins to exist.
- **R104's scan lands beside §E.** Against the v4.02 blob it flags all **seven** positions that
  shipped symbol-less; clean on the current tree. **Its limitation is in the header**: it catches a
  *known* money field rendered bare, never a *new* one nobody registered.
- **`statusLine` returns `{text, tone}`, not a string** (since B3). The first shopping draft printed
  `[object Object]` on every row — caught in the browser, because no suite renders that view.
- **SH1's overlap now reads as a rebuy** in the shelf's own words; **R11 restock is a repeat
  purchase** (three keys over the shipped prefill path, nothing written until the form is committed);
  **R12's search stores nothing**.
- **#07's currency row ships** — six options, verified live to move every cost site including the
  medians.
- **R107 — the completeness panel is deferred out of R3** and needs a product ruling first: R22 says
  it *moves* and it exists nowhere, and a progress bar for filling in fields is a calm-first question.
- **Checked and NOT changed:** SET2's false privacy line isn't in shipped code; **°F stays** (ledger
  over board); SET5 void. **23 committed suites, all green.**

**Previously — v4.03 R3 slice G: Insights + the Origins card + #11 Wrapped** (cache **v113**,
APP_VERSION v4.03, **no SQL**). Built to R100–R103.
- **R103 — Wrapped looks back at the last COMPLETE month.** Live: **July, 40 sittings**, not the 2
  August ones. `seasonInfo` had zero callers after and is **deleted**; the decorated "your August is
  just beginning" card is gone, because a retrospective with nothing behind it says so plainly.
- **R100 — a tie is named, never resolved.** `argmaxTies` (steep-core) replaces three `if(v>best)`
  reducers. **No live tie exists on the 08-05 export** — 08–10 leads at 16, Chiran at ×5, green at 20
  — so the fixture is the only thing that can see it. Don't read the absence as untested.
- **R102 — the fence is in the mover, not the table**, plus `dashSurface` and the rendered control.
  The negative control removed only the mover's guard and **H4 reddened while H3 stayed green** —
  the three mechanisms catch different failures and none is redundant.
- **`originTier` is the single writer** for the region/country split; `figures-report.js` had a
  private copy of the rule, so the tool reporting the split was a second definition of it.
- **Cost medians are new computation** (`avgCostPerGram` is a pooled ratio): **€0.24/g** from 14 of
  21 priced teas, **€0.95/session** from 33 of 42 costable sittings, denominators generated, and
  nothing rendered below two data points. The board's €0.17/€0.86 do not reproduce and aren't drawn.
- **Slice A's currency audit never reached the spend view** — six money sites printed no symbol at
  all. §E guards the *writer*, so it could not see an uncovered *site*. All six now use `currencyFmt`.
- **Two more expired board claims** (totalGrams + litres already shipped; R22's completeness panel
  exists nowhere) — six and seven this round. **23 committed suites, all green.**
  **NEXT: slice H** — #37 Origins (carrying R101's map decision) · #08 Shopping · #07 Settings row ·
  #09 landing; the Passport hub row comes out there.

**Previously — v4.02 R3 slice F: Social + the R25 pass record** (cache **v112**, APP_VERSION
v4.02, **`sql/v3_10-pass-record.sql` applied by hand BEFORE the push**). The round's second and last
migration, and the one where filename order genuinely differs from version order.
- **R96 — a pass carries a snapshot, not just an id.** `teas` is owner-only under RLS, so a recipient
  handed `tea_id` resolves nothing and the shelf renders blank rows. `tea_name` is `not null`, the
  same denormalisation `v3_0-social.sql` §3 already gave the feed. **R97** kept `catalog_slug` out:
  R36's tier resolves at read time, so authoring a `covers` entry later upgrades passes already sent.
- **The RLS was read against the shipped gate, not approved from a plan.** Circle reads use the same
  direction as "followers read shared sessions". A policy subquery does **not** bypass RLS — both
  `follows` lookups name the current user on one side of the edge, so they resolve; one that named
  them on neither side would have made every pass vanish with no error. No UPDATE policy; DELETE is
  owner-only with no UI, so a mis-send is recoverable at all.
- **Passed-to-you is empty by construction on ship day** (the v3.98 `opened_date` 0/21 shape), and a
  **failed** read renders differently from an empty one — "nothing passed yet" over a 404 would be a
  lie shaped exactly like the truth.
- **Social is one screen, and the feed kept its home (R61).** The board absorbed `following` into
  YOUR CIRCLE and `find` into the ＋ row, and drew no home for the feed — so it is a section below
  Passed-to-you, `feedRowHTML` and v3.66 paging untouched. The circle draws **both directions**:
  `getFollowers()` is new, and pebbi (follows Niklas, not followed back) was invisible to every read
  the app had.
- **R98 — the minimal preview has no script by construction**, and the board's own worked example
  fails its own rule: Rou Gui takes the *preview* branch, because `matchTeaType` is `covers`-only and
  `rou-gui` has none. Verified live alongside Kabusecha, which takes Go Deeper with 冠茶 in the tile.
- **A cascade bug shipped and was caught in the same slice** — `.social-tile` and `.t-green` are both
  (0,1,0) and this CSS block sits below the palette, so a base `background` flattened every type
  tint. Slice B's `.vessel-tile` bug, found the same way (computed background, not "the rule
  exists"). Guarded at §D7.
- **`fixtures/pass-record-test.js` (74 checks) — §E is the app's first guard on text another user
  authored.** Two negative controls bite: unescaping the note reddens E1+E2, narrowing the circle to
  `following` reddens B2+B4. **23 committed suites, all green.**
  **NEXT: slice G** — Insights + the Origins card (R54) + #11 Wrapped.

**Previously — v4.01 R3 slice E: #10 Focus** (cache **v111**, APP_VERSION v4.01, no SQL).
**A restyle, not a rescue** — #10's headline ("taste data is lost every session until this lands")
describes a bug fixed in v3.92.
- **R94 — kachi-iro is real now, on the Focus ring and nowhere else.** Visual contract 4 shipped
  **unimplemented for the whole round**: the ring was `#E3A15C` amber, no token existed, and the only
  two mentions of the word in the repo were comments deferring to a token nobody had created. Four
  tokens in both theme blocks; the ring reads them. **The steeping screen keeps its shipped amber and
  jade** — the board paints its chrome kachi, but that surface is round-1 under R53, and one surface
  total is the contract. The scarcity is the mechanism.
- **Focus is always dark regardless of page theme**, so `.focus-screen` pins the dark lift in a scoped
  re-declaration rather than inheriting `:root`'s deep indigo (which would be near-black on
  near-black). Verified `#7FA6C4` in **both** page themes. No hex at a render site.
- **`✓ saved` is a read, not a new write** — and worth drawing precisely because the write has been
  silent since v3.92: registered and stored looked identical on screen for weeks.
- **The steep context line is generated** (R68), each part omitted when absent.
- **R95 — a board's build-first stamp expires with its reason.** Fourth instance this round of a board
  describing shipped state as pending (after #06, #04, #02b). Priority stamps read as live instructions.
- **Verified correct and LEFT ALONE** so nobody "fixes" them: the timer is already two modes + one
  action; R44's no-avatar holds; Focus's dark field is shipped behaviour.
- **`fixtures/focus-test.js` (54 checks) — its most important section isn't about Focus.** §D pins six
  undrawn steeping states against shipped output (R53 asserted, not intended); §B's confinement check
  was verified to fail by leaking kachi onto `.pour-saved`. **22 committed suites, all green.**
  ~~**NEXT: slice F — Social + the R25 pass record, carrying `sql/v3_10-pass-record.sql`.**~~
  **SHIPPED v4.02** (above) — its migration applied before the push, as B3 did, and the version-order
  point held: `v3_10` was applied *after* `v3_11`.

**Previously — v4.00 R3 slice D: #02 Sessions + #02b detail + the edit-screen move** (cache
**v110**, APP_VERSION v4.00). **Two commits by design** — the guard first, the move second.
- **The guard held green across the move, UNEDITED.** `fixtures/session-edit-test.js` was written
  against the working modal and run green *before* any move existed; `git diff` on it across the move
  commit is empty. 67 field-values ride on the deep copy + whole-object writeback (30 steeps with real
  taste words, 37 with per-steep feedback, over 40 sessions / 133 steeps), and nothing in the UI would
  surface their loss. **Two negative controls proved its halves catch different failures** — a shallow
  copy reddens the identity checks only (aliasing *shares* data rather than losing it, and also means a
  *cancelled* edit silently keeps its changes); a field-by-field writeback reddens the round trip only.
  Neither section may be dropped as redundant.
- **R58 — editing is a screen.** Only the shell changed; the body, every setter and both copy
  mechanisms are untouched, which is what let the guard stay unedited. Cancel returns to the sitting.
- **#02b detail is new**, and rows now open **detail** rather than the edit form — reading a record and
  changing it are different intents.
- **R90 — no method shown on a null row, hero included.** The 6 Jul Da Hong Pao (`brew_style` empty,
  110 ml gaiwan) renders `Oolong · Dragon Gaiwan`; a stored row reads `Oolong · Senchadō · Main Kyusu`.
  8 of 40 render without a method line — correct, not a gap.
- **R91 — brew-again carries the vessel always, method only when stored.** Pinned with the case that
  separates the mechanisms: **Travel cuppa** (`Porcelain teapot`, so no vessel-type prefill; 115 ml, so
  the capacity heuristic *would* say gongfu) yields **null**. `quick-log-test.js` §H.
- **R92 — one "Brewing days" toggle** for the calendar *and* the heatmap, list default; closing it
  clears any day filter so the list is never left silently narrowed by an off-screen control.
- **Pass-tea omitted, not disabled** — it needs slice F's migration. **Landed in v4.02.** **21 committed suites, all green.**
  **NEXT: slice E** (#10 Focus, alone — it shares `sessionSteepingHTML` with every non-Focus steeping
  state R53 accepted as round-1, so hold each undrawn state to shipped behaviour and flag it).

**Previously — v3.99 R3 slice C: #04 Session setup + #12 Quick log** (cache **v109**, APP_VERSION v3.99).
**Three of #12's premises were false at HEAD**, so the slice is built to R87–R89, not to the board.
- **R87 — the nav Log button still opens SETUP.** #12 claims "as checked" that the nav and the
  in-setup shortcut both reach quick log; they don't (`quickLogSession` → `startSessionFor(null)` →
  `stage:'setup'`; `beginQuickLog()` is the only path to `'quick'`). Not built to. The prospective
  posture is the recoverable one — setup reaches quick log in one more tap, quick log can't reach the
  timer at all.
- **R88 — quick log gains BOTH pickers and carries the tea forward.** It had no tea control and no
  vessel control; it printed a name in a heading. The empty start is deliberately **not** built —
  you arrive from setup where a tea was chosen one tap earlier. Vessel optional and never blocking
  (R43); **a tea does block the save** — a cup with no tea isn't a record.
- **The date inverts, and #04's half was already shipped** (`sessionDate` inside *More details*), so
  the work was entirely #12's: relative chips (Just now · This morning · Yesterday · Pick a date),
  **selected chip in jade** — kachi-iro stays on the Focus ring. The active chip is **derived from the
  date**, not stored beside it, so no second source of truth for one field.
- **The schedule strip names its derivation, generated** — only stages that fired
  (`your brew guide → ratio-scaled`), nothing when off; the board's example string is not hard-coded.
- **The mood pill is computed**, never the board's stamped `48% (15/31)`: "noted on 5 of your 12
  sittings", omitted below 8 sessions and when unused.
- **R89 — #14's custom listbox deferred**; its long-press colour correction can't ship at all (R78 no
  column, R82 no palette data model). ~~The `<select>` controls stay. **#14 reopens with the swatch
  model.**~~ **CLOSED v4.21** — the swatch model shipped (v4.11–v4.20), #14 reopened and shipped as the
  R58 picker screens; the selects are retired. Long-press stays deferred (its own gesture+commit build).
- New `fixtures/quick-log-test.js` (38 checks) — **20 committed suites, all green.**
  **NEXT: slice D** (#02 Sessions + #02b detail, then the edit-screen move as its own commit — the
  riskiest item in the package, because the modal's deep-copy semantics must survive verbatim).

**Previously — v3.98 R3 slice B3: the freshness model** (cache **v108**, APP_VERSION v3.98).
**The round's first migration: `sql/v3_11-opened-date.sql`, applied BEFORE the push.** Adding a
nullable column is backward-compatible with v3.97, which never touched it; the reverse is not, because
v3.98's `teaToDb` sends `opened_date` on every save and PostgREST rejects an unknown column outright.
- **Freshness counts from the seal, not the harvest.** `teas.opened_date` is the measured rung; harvest
  is a fallback that **assumes sealed and says so**; purchase is deliberately not on the ladder (it
  says when the tea reached *you*) and keeps all its other jobs.
- **Two groundings, failing independently** — clock (openedDate → harvest → nothing) × window (catalog
  slug → family → `teas.type`). No clock → **no block at all**, absent rather than a zero.
- **R85: the third rung is load-bearing, not cosmetic.** The spec keyed windows on the catalog alone,
  decided at 13-of-14 coverage. At 21 teas it is 13, and slug→family alone would have removed a working
  reading from **Fei Bing Beeng Cha, Moonlight White, Chiran Sencha Okumidori, Spring White Anji**. Fei
  Bing is the only pu-erh and has no catalog row, so `ageing` could never have reached the one tea that
  actually ages. `puerh ↔ dark` lives in **one named constant** (`TT_TYPE_TO_FAMILY`), guarded against
  being inlined twice.
- **The shelf is two-key, quantity still first.** Ungrounded → plain quantity tone (a stock statement,
  not a freshness claim — WS5 forbids an empty slot). `empty · untracked · low · few` short-circuit
  ahead of any freshness branch, unchanged.
- **Ageing needs no clock** — the first build required both keys and silently dropped "ages well" from
  every ageing tea without a harvest date. Caught by the suite, not by review.
- **`FRESH_NEAR_WEEKS` retired as a global, kept as an idea** — the countdown threshold is now
  window-relative (half of a 30-day opened shincha vs half of a two-year oolong).
- **§7.1 done: `isTeaUnopened` is the fallback rung**, measured `openedDate` wins outright. Live for 3 teas.
- **DELETED**: `statusCategory` · `freshnessClass` · `freshnessStyleWord` · `freshnessWeeksLeft` ·
  `FRESH_WINDOW_MONTHS` · `FRESH_NEAR_WEEKS`. Both freshness suites **rewritten, not patched** —
  `status-line-test.js` for the second time in two slices, as the spec said it would be.
- **Quiet by design on ship day**: `opened_date` is 0/21, 3 teas read ageing, 3 ground a window, one
  countdown. Don't read it as a failed build. **NEXT: slice C** (#04 setup + pickers, #12 Quick log).

**Previously — v3.97 R3 slice B2: #06 Add/edit tea + #03 Tea detail** (cache **v107**, APP_VERSION v3.97).
R51's other half — slice B built the browsable mode, this builds the contextual entries.
- **Borrow from Go Deeper** is the shipped `saveSuggestedGuide` gesture against the **catalog** instead
  of the KB. No per-step times in `typical_brew`, so a borrow is temp + ratio over a `generateFormTimes`
  schedule, written through `scheduleToGuideText` and round-tripping through `parseBrewGuide` (verified:
  Da Hong Pao → `95°C, 30s / 21s / 27s / 35s / 44s / 57s, 6g/100ml`). **The no-guide guard is kept, not
  widened** — replacing a guide the user wrote is a separate decision. The source line names which rung
  answered, because on Da Hong Pao the KB says 1.5 g/100 ml and the catalog says 6.
- **Absent, not disabled**: for the 8 uncovered teas the borrow button, source line and Go Deeper link
  render nothing. The deep link **walks member → category** (`dhp` → `wuyi-yancha`), or it would have
  opened nothing, silently.
- **#03** splits into character + provenance clusters, empty fields **omitted not dashed** (zero dashes
  on a bare tea); the diary reads "starts with your first cup"; ⋯ = shopping · Go Deeper · delete
  (**pass-tea rides F** — landed v4.02); `inventorySparkline` stays (R80); **freshness untouched, slot included** — B3
  replaces the reading per `SPEC-freshness-model.md` §3/§4, and the board's ladder is not drawn because
  its column doesn't exist yet (R81).
- **`addWishFromTea` was not idempotent** — guarded at the writer (`wishHasTeaName`, R49's join), not
  just at the call site, so `rebuyYes` inherits it too.
- **#06**: rating · brew guide · favourite promoted **on Edit only** — they already shipped, folded, so
  this was a promotion not an addition. Add keeps WS1's minimum. **Those three and nothing else.**
- **The read-only guard caught its own slice**: `borrowGuideFrom` drafted into `steep-reference.js`
  failed section A on the first run, so it and `goDeeperFor` moved to `steep-teas.js`.
- **First commit of the deploy repaired `freshness` + `lifecycle` and tracked them (R79)** — 19
  committed suites, all green. **NEXT: slice B3, the freshness model** (R84) with
  `sql/v3_11-opened-date.sql`; its spec is the build authority, not the build plan's table.

**Previously — v3.96 R3 slice B: #13 Teas revision + #05 Vessels** (cache **v106**, APP_VERSION v3.96).
The Teas tab gains its second mode and its header rework; the vessel list becomes the surface #05 drew.
- **Go Deeper (R51)** — new `steep-reference.js` over `browseTeaTypes()`: 27 categories / 55 rows, search,
  expandable bodies, an "on your shelf" mark from `matchTeaType`. **Read-only by contract**, asserted
  structurally (the module may not name `SteepDB`/`persistTea`/`putTea`/`saveKey`; it assigns only
  `refSearch`/`refOpen`). Coverage is rendered **honestly**: 12/21 teas match, 11/27 categories marked,
  **16 dimmed** — the same gap `tea-types-test.js` G reports. A member row shows only what it **adds**;
  confidence is exempt, so a contested member keeps its hedge.
- **Header rework + where sort went.** Title · a generated count line · ⋯ overflow. The mode pair
  (`Your shelf`/`Go Deeper`) always draws; the `teas`/`vessels` segment row is **shelf-mode only**, which
  is what collapses two drawn controls into one three-valued `state.teaSeg`. Sort + density moved into the
  ⋯ sheet — **R60a preserves the capability, not the markup**; chips and search stay visible; **Add stays
  visible** (§0.5 contract 2), not in the overflow the board drew it in; Import backup is **not**
  duplicated out of Settings.
- **`shelf-order-test.js` E4 amended one deploy after landing** — the old assertion would now be asserting
  something false. Replaced by a stronger pair (trigger renders by default · control renders with the
  sheet open) plus a sanity check that the closed state genuinely lacks it, and E6 that all seven options
  reach the rendered sheet.
- **#05 Vessels** rides slice A's `kind`: `vesselPhoto(v,'tile')` at 58 px, rich rows, tap → edit (V2),
  usage counts read from sessions every render (R68 — "9 sittings" stopped distinguishing Main Kyusu once
  Mogake also hit 9). Delete moved off the row into the form, still `armConfirm`.
- **A cascade bug no "the rule exists" check could see:** `.vessel-tile` and `.vessel-kanji` are both
  (0,1,0), so declaring the tile's base rule below the kanji block replaced the per-type plate tint with
  the plain jade base. Found by reading computed background in **both** themes. Base rule moved above the
  ladder block; **B9b now pins the source order**.
- **R75–R78** in the ledger; **R74's doc sweep is now deploy step 5** in `slowcup-deploy` and CLAUDE.md.
- **`fixtures/reference-test.js` shipped untracked at first** — `.gitignore` blanket-ignores `fixtures/*`
  with a per-file exception list, no exception was added, and **`git add -A` skips an ignored file
  silently**. The pre-push verifier caught it; the exception is in and the file is committed. **When you
  add a committed suite, add its `.gitignore` line in the same edit** — and take the suite count from
  `git ls-files 'fixtures/*-test.js'`, never from the working tree. It is **17**.
- **Second commit, same deploy — the stale suites are repaired and all 17 committed suites are green.**
  `status-line` was comparing two worlds (never seeded `lowStockThreshold`, so it ran at the default 15
  against a shelf counted at the owner's 11) and was unscoped; it now seeds the threshold from the
  owner's `user_settings` row, scopes by `user_id`, and asserts the **engine agreeing with itself**
  instead of pinned names. `tea-types` G demanded coverage the catalog never claimed — coverage is now
  *reported loudly*, and the assertion is that no tea matches the **wrong** type. That red was hiding a
  real bug: `ya-shi-xiang`'s `covers` said `…Dancong Guandong` against a tea spelled `…Guangdong`, so an
  exact-fold match could never fire, and E6 "passed" by asserting the typo against itself. Coverage
  **12 → 13 of 21**. Local-only `freshness-test.js` ("exactly 2 cues fire") and `lifecycle-test.js` ("no
  real tea is finished") are red for the same stale-expectation reason — untracked, so a fresh clone
  sees neither.

**Previously — v3.95 R3 slice A: the shared primitives** (cache **v105**, APP_VERSION v3.95).
**R3's first code deploy** after a week of docs-only commits, so this is the first Refresh banner users
see in that time. Cross-cutting primitives land *before* any surface is rebuilt — retrofitting the method
control onto a finished surface is how the four-lane order went wrong the first time.
- **Currency is a preference (six sites, one writer).** `DEFAULT_SETTINGS.currency` = **`€`** (every
  vendor on the shelf is German/EU, so `$` was wrong for all 21 teas) + `currencyFmt()`. Three sites had
  the **wrong** symbol (Tea detail ×2 + `big_spender`'s dormant `unit:'$'`), three had **none** (the
  monthly cost card, Insights' Total-spent and Avg-per-gram). `unit:'cur'` resolves through `aUnit` so the
  symbol isn't re-hardcoded a layer down. **Settings row rides #07** — the key lands now because every
  cost surface downstream reads it.
- **Four-lane method control** (`methodLanesHTML`, R50/R64/R72): `gongfu · senchadō · western · cold brew`,
  one writer, both call sites. Cold brew is a **peer lane**, so both checkboxes are *replaced* (R61 holds).
  Storage untouched. The `resolve` flag encodes R72: a **draft** lights what `commitSession` will store,
  a **record** shows only stored `brew_style` and lights nothing when null. JC1 verbatim — opening a null
  session and saving writes nothing. Differs for exactly one vessel (Travel cuppa, `Porcelain teapot`,
  not in `VESSEL_METHOD_PREFILL`).
- **Dead `ratioSetupHTML` deleted** — its two-button segment would have lit *neither* lane for senchadō.
  Backlogged since v3.77, trigger fired and missed twice.
- **Vessel identity ladder** (`vesselPhoto`, R63): photo → kanji → type-tinted stripe. Separate from
  `shelfPhoto` (the *tea* tile, keyed on `tea.type`). `VESSEL_KANJI` = Gaiwan 蓋碗 · Shiboridashi 絞 ·
  Cold brew jar 冷; **旅 dropped** (no traveller type; it was keyed off a free-text name). Stripe keeps its
  shipped look exactly. `kind` present for #05's tile in slice B.
- **Two guards ARE the deliverable, not code.** `shelf-order-test.js` +E (R61: seven `SORT_OPTS` keys and
  a live `setTeaSort` caller still render — #13 not drawing it is not authorisation to delete it) and +F
  (`stockTier`/`statusLine` are the only tier/label writers; no tier string returned elsewhere). New
  **`fixtures/vessel-identity-test.js`** (53 checks, 17th suite) — the ladder is **invisible on current
  data** (all five vessels have photos), so the fixture is the only thing that can see rungs 2 and 3.
- **Known red, tracked separately, NOT from this slice:** `status-line-test.js` (E1/E3/G1/G2) and
  `tea-types-test.js` (G) hold expectations frozen against an older, smaller export; failure sets verified
  identical before and after. Local-only `freshness-test.js` and `lifecycle-test.js` are red for the same
  reason (ungated). Fix needs the threshold seeded from the fixture `user_settings` row and the engine's
  answer tracked — **no pinned literals** — plus `user_id` scoping per R69.

**Previously — v3.94 R31 recognition layer** (cache **v104**, APP_VERSION v3.94): the nested
flavour tree from `docs/r3/planning/DATA-flavour-tree.md` (Gascoyne wheel, 12 families, 111 recognition
nodes) lands as **recognition + roll-up DATA and a resolver** in steep-knowledge.js. `isFlavorVocab` now
resolves **exact → alias (EN word-forms + DE) → bare**; `flavorResolve` returns the `{term, subFamily,
family}` roll-up; `flavorNorm` is diacritic-tolerant (ä≡ae/ö≡oe/ü≡ue/ß≡ss + NFD strip). The **stored word
is never rewritten** (German "Aprikose" counts to Fruity/Fresh fruits, displays as written; `flavorLabel`
unchanged). **Visible win:** all 15 of Niklas's tag_library words count — the 8 R30 left invisible come
back (toasty/apricot/pear/date/dried fruit/fig/cocoa/spices); on the real steep export **0 of 23 tag words
stay bare**, one tea climbs none→chips. **Scope fence held:** recognition + roll-up data only — no
capture-family change, no bar/radar render change, no taste-panel. **Judgment calls (flagged, see
CHANGELOG):** (1) roast/roasted "one bar" needs a render change (out of fence) — they resolve to one node
but still draw as two bars; (2) **"milky" (live tag) seeded** as a Milky family-level node (DE `milchig`) —
folded in before push, reconciling the dataset's §1-family-listed vs §2-adjective-omitted inconsistency
(F4 asserts it resolves); (3) "rauchig" homed on smoky only (index collision-free). **No SQL.** Fixtures: new `flavor-tree-test.js` (27),
`flavor-ladder` A8 (tree ⊂ vocabulary); all 14 committed suites green.

**Earlier — v3.93 R30 flavour vocabulary** (cache **v103**, APP_VERSION v3.93): `DEFAULT_TAGS`
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
