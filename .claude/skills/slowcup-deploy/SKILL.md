---
name: slowcup-deploy
description: Run the SlowCup deploy ritual — version bumps, changelog, docs, checks, fixtures — exactly as the house convention requires. Explicit invocation only.
disable-model-invocation: true
---

# /slowcup-deploy — the deploy ritual as a checklist

Usage: `/slowcup-deploy vX.YY — <title>` · add `dry` anywhere in the arguments for DRY RUN.
**DRY RUN (default if the word "dry" appears in $ARGUMENTS): print every step below with the
exact edits you WOULD make (old → new values, the drafted changelog entry, files touched) and
STOP. Change nothing.** This is the low-risk test mode — first invocations should be dry.

The ritual, in order. Do not skip, reorder, or batch steps silently:

1. **Version bumps** (all three, same commit):
   - `service-worker.js`: `CACHE_NAME` `steep-tea-log-vNN` → `vNN+1`. Never rename the prefix.
   - `steep-core.js`: `APP_VERSION` → the new `vX.YY`.
   - `WHATS_NEW` (once it exists, v3.69+): one short human sentence for the update banner.
2. **CHANGELOG.md** — newest-first entry in house format:
   `## vX.YY — <title>` · `Deploy: <exact file list> (vNN). [SQL note or "No SQL."]` ·
   bullets that explain *why*, name the key functions/constants, and record any judgment
   calls. Match the voice of recent entries.
3. **STATE.md** — update the "Continue here"/NOW block: new cache + version, one-line summary
   of what shipped, anything the next session must know.
4. **ROADMAP-v4.md** — tick the shipped item; move parked/decided notes if the deploy
   resolved one.
5. **Checks** — `node --check` on EVERY touched `.js` file (use the full node path from
   memory if node isn't on PATH).
6. **Fixtures** — run ALL committed suites (`fixtures/brew-roundtrip-test.js` at minimum,
   plus insights-room / wrapped-cards and any suite covering touched modules). Local
   gitignored suites for the changed feature run too. ANY red = stop, fix, rerun; never
   ship red. The gitignored `fixtures/*.csv` exports must be **current** before this step
   counts — a fresh clone has none, so real-data sections (e.g. brew-feedback's R) graceful-
   skip and their guards never fire; drop the latest Supabase exports in first.
7. **Commit & push** — message `vX.YY — <title>` (matches the changelog heading). Docs-only
   changes use a `docs:` prefix and SKIP steps 1 and 6 (no bumps for non-app artifacts —
   the landing-page precedent).
8. **Report** — in the pause message: commit hash, cache number, what shipped, verification
   summary, judgment calls flagged, what's next in the tail.

House rules that override anything else: one coherent change per version · pause after each
deploy · never bump for files outside the PWA (landing.html etc.) · destructive-action
friction is sacred · if a step conflicts with CLAUDE.md, CLAUDE.md wins and say so.
