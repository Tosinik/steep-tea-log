# ROADMAP — v4 "ready for strangers" (signed off 2026-07-10)

**This is the active forward roadmap** — successor to `ROADMAP-v3-next.md` (which is retained for the
Shipped log + the frozen/parked specs). Reconciled into the repo from the claude.ai strawman +
`TASK-issues-triage-addendum.md` (Downloads); the detailed per-deploy build specs for the cleanup tail
live in that Downloads addendum, with the essentials folded into Pillar F below. Keep this current as work
ships (move finished items to a Shipped note; mirror ship entries in CHANGELOG). Two themes:

**Theme 1 — ready for strangers:** a tea person can find, install, learn, and love SlowCup within two
days, without Niklas nearby.
**Theme 2 — the app learns from time:** SlowCup's moat is longitudinal personal data; every season of
logging should make it measurably smarter. Features are designed to read backward.

**v4.0 cut line:** launch checklist empty · a stranger's first 48h works (onboarding, empty states,
forms) · brew advice learns from the user's own sessions (phase 2) · design language coherent on every
surface.

## Pillar A — brew advice phase 2: learned defaults
- Gate: ≥15 ratio'd sessions with feedback, both methods — lands ~2026-07-20/24. Fresh CSV exports →
  spec drafted claude.ai-side, dry-run on real data, decisions batched. (`ratioAdjust` must be ON for the
  window to count.)
- **NEW (Niklas 2026-07-10): third brewing method `japanese` (senchadō).** Green tea in a kyusu is
  neither gongfu nor western — multiple short infusions at moderate ratio. Today it's mislabeled
  "western", and the "raised JP-green westerns" (sencha 1.8 / kabusecha 2.0) are really senchadō values
  wearing the wrong name — true western (big-pot, e.g. the MainTee label's 3–4 tsp/1L ≈ 0.6–0.8 g/100ml)
  is a different animal. Fold into phase 2: KB gains `ratioJapanese` for JP-green styles (current raised
  values move there; `ratioWestern` re-lowers to true big-pot values), inference gains a rule
  (Japanese-green style + mid-size vessel/kyusu → japanese), the session switch becomes 3-way for those
  teas, stored `brew_style` stays free text so no migration. Existing kyusu sessions relabel cleanly since
  inference is deterministic from vessel + style.
- Learned defaults proper: good sessions (rating/feedback) contribute ratio-normalised, method-normalised
  evidence; KB/LEAF_PROFILES = prior, user data = posterior; confidence-gated per tea (~4–6 rated
  sessions), pooled per style/leaf-form sooner.

## Pillar B — launch infrastructure (checklist consolidated in ROADMAP-v3-next.md)
Register slowcup.app (CRITICAL PATH, name is public) → root/`index.html` split → domain migration (repo
URL, manifest, SW scope — the once-only move) → reshoot 3 landing screenshots → install guide (Android
`beforeinstallprompt` + iOS manual) → beta package.

## Pillar C — first-run experience [the one big NEW build]
- Onboarding / feature-discovery pass: light guided intro; features surface on thresholds (already the
  pattern — make it deliberate). Empty states for every surface (Design R2 provides the visual language;
  several accents — seigaiha — were reserved for exactly this).
- First-session flow: the redesigned setup form (Design R2 WS1) doubles as onboarding — core fields only,
  everything else folded.
- Vocabulary: one-line explainer pattern for tea/app terms (gongfu, TDS, cultivar) — hooks into Pillar E's
  atlas later.

## Pillar D — design round 2 (brief: DESIGN-SESSION-2-BRIEF.md) + follow-on builds
Forms (setup + add tea) · Home + greeting · steeping screen (hero) · flavor experience · tea library
cards · menu decision boards. Each workstream returns as its own versioned deploy.
- **Flavor experience (Niklas 2026-07-10):** the infrastructure exists and is unloved — `steeps.tags` +
  `sessions.tags` arrays in the schema, `KB_FLAVOR_CHIPS` (20 EN/DE quick-tap terms) + `KB_FLAVOR_AXES` in
  the KB. Build: a "what are you tasting?" quick-tap moment (per steep, optional, one thumb) → per-session
  summary → **tea-page flavor profile aggregated from the user's own sessions** (honest counts, "your last
  6 sessions" framing). Design R2 owns the experience; data conventions: chips write into the existing tags
  arrays with a `flavor:` namespace so free tags stay untouched.

## Pillar E — the smarter-over-time backlog (Theme 2, ship as data matures)
Each with its data prerequisite — the point is they get better every season:
- **Sweet-spot detection** [after phase 2]: per tea, the parameter fingerprint of its best-rated sessions
  ("Your best Shincha: 68°C · ~1.9 g/100ml · 3 steeps").
- **Per-tea learned steep curves** [needs steeps history, exists]: actual "use this time" data reshapes the
  curve, not just the ratio.
- **Flavor evolution** [after flavor experience]: taste chips per steep index → "peaks at steep 3";
  per-tea and per-style.
- **Mood correlations** [mood logging since v3.31, unused]: "Lively, mostly after morning sencha" —
  Insights card, observational only.
- **Freshness × rating** [needs purchase dates + a year of time]: does the shincha really fade? The
  freshness cues get evidence.
- **Restock lead-time learning** [needs shopping-list + rebuy history]: "you usually rebuy ~5 days after
  the low warning" → earlier, smarter Running-low timing.
- **Seasonal palate** [needs 2+ seasons]: Wrapped gains year-over-year texture.
- **Tea atlas** [M, mostly rendering work]: browsable KB — types → ~35 styles → 30+ cultivars, regions,
  brewing terminology, EN/DE keywords. MVP is realistic precisely because it renders the KB that already
  powers advice (offline, no backend, no licensing). Linked from tea pages ("about sencha →") and the
  vocabulary explainers. A *universal* tea database (every commercial tea) is explicitly out of scope —
  wrong product, endless upkeep.
- **Insights v2 interactivity** [small, near-term]: tap-the-type-bar reveal · mood card · vessel note ·
  steep-depth habit · cost sentence. All optional/hideable. (Builds on the WS2 reflective room.)

## Pillar F — cleanup tail (all 5 open issues triaged 2026-07-10; pause after each deploy)
Detailed build specs: `TASK-cleanup-and-issues.md` + `TASK-issues-triage-addendum.md` (Downloads). Read
each issue's body via the REST API at build time and reconcile before building.
- ~~**v3.66 feed pagination + socialErr inline notice**~~ ✓ **shipped** (`.range()` paging + "Load more";
  `socialErr` → sticky `.social-notice`, the app's last `alert()` gone).
- ~~**v3.67 — greeting v3, session-aware (issue #2), EXTENDED.**~~ ✓ **shipped.** Session-aware branch in
  `greetingCardHTML`: a session in the current bucket → acknowledge (predicted-vs-actual, never scored) →
  forward-suggest for a later active window (same-day type-variety guard via `VARIETY_GUARD_SAME_DAY` +
  shared `d_scorePick`) or rest. `d_copyPick` gained a `salt`. Local `greeting-test.js` → 44. Issue #2
  fixed (close with a comment). Original spec, for reference:
  Base spec: acknowledge a logged session in the current bucket; if a later active window is unsessioned,
  redirect forward; if the day's windows are done, rest with a closing line (no third-session nudge). The
  issue body added two requirements:
  1. **Predicted-vs-actual acknowledgment** — the card knows its own deterministic pick (same seed). After
     a session in the current bucket: picked the predicted tea → "Good choice — the {name} it is." register;
     picked something else → warm surprise, never correction: "The {name} instead — didn't see that
     coming." Small pools each via `d_copyPick`; **never scold, never score the prediction** ("I was
     right/wrong" is out).
  2. **Same-day type-variety guard** — forward suggestions (later-today AND a tomorrow-redirect that lands
     the same calendar day) must not suggest the same TYPE as the just-logged session (Niklas: "I don't
     drink two green teas in a row in the morning"). Scoring exclusion with graceful fallback: if every
     candidate shares the type, suggest none (closing-line register) rather than break the rule loudly.
     Keep a tunable `VARIETY_GUARD_SAME_DAY = true` (phase-2 learning may later replace the hard rule).
  Fixtures: predicted-taken vs not-taken branches; variety guard excludes same-type; all-same-type
  fallback; determinism unchanged. Deploy: `steep-dashboard.js`, `service-worker.js`. Close issue #2.
- **v3.68 — in-session "turn off" fix (issue #1, `bug`).** The in-session guide card's "turn off"
  (`d_setBrewMode('off')`, steep-sessions.js) removes the whole card with no way back AND resets
  `timeShift` (discarding the user's ±5s pour adjustment). Fix, reversible + calm: render a one-line ghost
  "Brew guide hidden · show" (remember `d.lastBrewMode` to restore Guide vs Your tuning); do NOT reset
  `timeShift` on an in-session hide (keep the reset only on setup-level mode switches); no confirm needed.
  Deploy: `steep-sessions.js`, `service-worker.js`. Close issue #1.
- **v3.69 — "what's new" line on the update banner (rider, [S]).** Add a `WHATS_NEW` constant next to
  `APP_VERSION` (one short human sentence), rendered as a second quiet line on the v3.27 update banner.
  Bumping it joins the deploy ritual (step 2c). One line only, no changelog list, no link-out.
  Deploy: `steep-core.js` (or wherever the banner renders), `service-worker.js`.
- **v3.70 — greeting v4, habit-aware (issues #4 + #5), NEW.** Two ingredients + pool expansion:
  1. **Out-of-habit situations** (issue #4), each a generous 6–8 line pool (one voice/day via `d_copyPick`):
     - **Zero-session day, evening only** — DECIDED (Niklas 2026-07-10): **guilt-free, playful** — the
       tea/kettle/shelf is the character, never the user's absence. Good: "The gaiwan enjoyed the day off."
       / "Quiet day — the shelf held the fort." Banned register: "no time for tea today?", "we missed you",
       anything owing the app an explanation. HARD RULES: fires at most once, evening-only, **never
       references counts or consecutive days**, gone by the next morning, no sad-emoji energy.
     - **More-than-usual day** (sessions today > the user's typical per-day from history, ≥5-day signal):
       celebratory-warm, never consumption-pushing / caffeine-nagging. e.g. "Third pot — big tea day."
  2. **Rediscovery ingredient** (issue #5): teas in stock but unbrewed for ≥N weeks (tunable, ship 3)
     occasionally become the day's pick — deterministic (e.g. `d_hash(todayKey+'|shelf') % 4 === 0`) with
     its own register ("The {name} has been waiting three weeks — remember it?"). Respects the variety
     guard + all exclusions. Also expand the normal pools (all branches) by 2–3 lines each.
  Fixtures: zero-session evening fires once + evening-only + never mentions counts; more-than-usual
  threshold math; rediscovery determinism + ≥N-weeks predicate; pools keep intact tap-targets.
- **Issue #3** (workflow question — "do issues resolve themselves?") — **close now, no build**: post a
  comment stating issues close manually, with a CHANGELOG-linking comment, when the fix ships (and note
  #2/#4 are sequenced as v3.67/v3.70). Documents the convention for future reporters. *(Closing needs
  auth — a token or `gh`; Niklas can do it in the web UI. Labels while there: #2/#4/#5 `idea`, #3
  `question`.)*

## Suggested sequencing (parallel-friendly)
Now: Design R2 session (Niklas) ∥ v3.67→v3.70 tail (Code) ∥ register domain (Niklas).
Then: R2 implementation deploys ∥ phase-2 spec (~Jul 20) → phase-2 build.
Then: Pillar C onboarding (with R2 language) → Pillar B migration + beta package → **v4.0**.
Pillar E ships opportunistically behind its data gates, before or after v4.0.
