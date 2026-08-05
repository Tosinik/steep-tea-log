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
   **Build the Deploy list from `git diff --name-only <remote>..HEAD`, never from memory of what
   you meant to touch.** Three deploys running (v3.96, v3.98, v4.00) shipped a Deploy line that
   over- or under-stated the set — a file named but unchanged, a doc changed but unnamed, a file
   attributed to the wrong commit. Every one was written from intention rather than from the diff,
   and every one was caught by the verifier rather than by re-reading. Name doc files individually;
   a generic "docs" is what the v3.98 entry was pulled up on.
3. **STATE.md** — update the "Continue here"/NOW block: new cache + version, one-line summary
   of what shipped, anything the next session must know.
4. **ROADMAP-v4.md** — tick the shipped item; move parked/decided notes if the deploy
   resolved one.
5. **Sweep the instructing documents (R74)** — every document a fresh session reads *before* it
   reads the code: **`CLAUDE.md`'s cleanup backlog and known-bugs list**, `STATE.md`, both
   roadmaps, `docs/r3/R3-BUILD-PLAN.md`, and any hand-off section describing engine state.
   Anything this deploy shipped is **struck with its version noted, never deleted** — the record
   of what was planned is worth as much as the correction. Historical provenance and CHANGELOG
   entries are never rewritten. *Why it sits here and not before step 1: striking an item names
   the version, so the sweep needs the number step 1 assigns. Why it exists at all: a stale
   figure misinforms, a stale backlog item **commands** — slice A left six such claims across
   five documents, each a live instruction to rebuild finished work.* Sweep for what this deploy
   invalidated, don't just re-read the items you already remember.
6. **Checks** — `node --check` on EVERY touched `.js` file (use the full node path from
   memory if node isn't on PATH).
7. **Fixtures** — run ALL committed suites (`fixtures/brew-roundtrip-test.js` at minimum,
   plus insights-room / wrapped-cards and any suite covering touched modules). Local
   gitignored suites for the changed feature run too. ANY red = stop, fix, rerun; never
   ship red. The gitignored `fixtures/*.csv` exports must be **current** before this step
   counts — a fresh clone has none, so real-data sections (e.g. brew-feedback's R) graceful-
   skip and their guards never fire; drop the latest Supabase exports in first.
8. **Commit & push** — message `vX.YY — <title>` (matches the changelog heading). Docs-only
   changes use a `docs:` prefix and SKIP steps 1 and 7 (no bumps for non-app artifacts —
   the landing-page precedent). Step 5 still runs: a docs-only deploy is often the sweep itself.
9. **Report** — in the pause message: commit hash, cache number, what shipped, verification
   summary, judgment calls flagged, what's next in the tail.

House rules that override anything else: one coherent change per version · pause after each
deploy · never bump for files outside the PWA (landing.html etc.) · destructive-action
friction is sacred · if a step conflicts with CLAUDE.md, CLAUDE.md wins and say so.
