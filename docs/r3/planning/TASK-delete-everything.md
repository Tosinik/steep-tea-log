# TASK — delete everything (account + data), and verify export completeness

**Why now:** R3's Settings screen will carry the privacy line *"Export or delete everything,
anytime."* Export exists; **delete does not exist anywhere in the codebase.** Rather than
weaken the copy, we're committing to the function — a personal diary app that can't be
erased is a real gap, and beta users are close.

**Plan-review pause before commit.** Options-not-choices on the flagged forks. This is a
destructive, irreversible feature — treat the confirmation design as seriously as the
deletion itself.

---

## What "delete everything" must actually cover

Verified against the live schema (`sql/schema.sql`) and data layer:

1. **Postgres rows — mostly free.** Every table declares
   `user_id uuid not null references auth.users(id) on delete cascade` (teas, vessels,
   sessions, steeps, settings). Deleting the **auth user** cascades all of them. Steeps also
   cascade from sessions. So no manual table-by-table deletion is needed *if* the auth user
   is deleted.
2. **Storage is NOT covered by the cascade.** Session/tea photos are files in
   `PHOTO_BUCKET` (`steep-data.js` — `sb.storage.from(PHOTO_BUCKET).upload(...)`). Deleting
   rows leaves **orphaned image files**. Storage objects must be listed and removed
   explicitly, and this is the piece most likely to be missed.
3. **The auth user itself** — see the constraint below.

## The constraint that shapes the design

**A client cannot delete its own auth user with the anon key.** `auth.admin.deleteUser()`
requires the service-role key, which must never ship to the browser. So there are three
viable shapes — **give me options, don't pick silently:**

- **(a) Supabase Edge Function** with the service-role key, called by the authenticated
  client, which deletes storage objects then the auth user (cascade does the rest). Cleanest
  and most complete; cost is new infrastructure (SlowCup currently has zero edge functions).
- **(b) Postgres RPC with `SECURITY DEFINER`** that deletes the caller's auth row. No new
  service to deploy, but it needs careful RLS/permission scoping, and storage still has to
  be cleared client-side first.
- **(c) Data-wipe only, account retained** — delete all rows + storage client-side (RLS
  permits the user to delete their own rows), leaving an empty account. Simplest, no new
  infra, but it does **not** satisfy "delete everything" literally — the account still
  exists. Only acceptable if paired with honest copy.

**Assess and recommend.** If (a) or (b) is disproportionate for a solo side project, say so —
then the honest move is (c) plus copy that says what it actually does. **Do not ship copy
that overstates what the function does** — that's the exact problem this task exists to fix.

## Scope question to resolve

Two different user intents, and the spec should decide whether both exist:
- **"Delete my data"** — wipe rows + photos, keep the account (start fresh).
- **"Delete my account"** — the above plus the auth user; the login stops existing.

Lean: offer **account deletion** as the primary (that's what the privacy promise implies);
a data-only wipe is optional and can be deferred. Flag if you disagree.

## UX — friction is the feature

- **Offer export first.** The delete flow should route through / prominently offer
  `exportData()` before proceeding — "download your diary first" is the humane default.
- **Real confirmation.** Not a single "Are you sure?" — destructive and irreversible needs
  deliberate friction (e.g. type the word DELETE, or a two-step confirm naming exactly what
  will be destroyed: N teas, N sessions, N photos).
- **State exactly what goes.** The confirm should enumerate what's about to be deleted from
  live counts, not generic copy.
- **Calm-first, not alarmist.** Serious and clear, no red-scare styling. This is someone
  leaving on good terms.
- Lives in Settings under the existing privacy/data grouping.

## Verify export completeness (same task, since the copy promises both halves)

`exportData()` currently serializes `{teas, vessels, sessions, tagLibrary}` to JSON.
Confirm and report:
- **Are steeps included?** (They may ride nested inside session objects — verify, don't
  assume.) A backup without per-infusion records isn't "everything."
- **Photos are not in the export** — only URLs, which die with the account. Decide whether
  "export everything" honestly requires bundling image files (a zip), or whether the copy
  should say "export your diary (JSON)" and be accurate about photos.
Report findings; propose the minimal change that makes the copy true.

## Verification

Fixtures are weak here — this is destructive I/O, not branching logic. Be honest about that
rather than pretending coverage:
- **Do NOT test destructively against the real account.** Use a throwaway test user.
- Verify: rows gone across all five tables, storage objects gone (list the bucket prefix
  after), auth user gone (if (a)/(b)), and the app returns to a clean signed-out state.
- What *can* be fixtured: the confirmation-gate logic (nothing deletes without explicit
  confirm) and the pre-delete counts. Pin those.
- Manual verification steps go in the ship report, clearly labelled as manual.

## Deploy mechanics
`/slowcup-deploy` (dry-run first). SQL likely (RPC route) or an edge function (route a) —
if either, the SQL/function file is committed as the repo record like
`sql/v3_9-steep-feedback.sql`. User-visible → earns a banner, but keep the WHATS_NEW line
calm and factual.

**Out of scope:** R3 visual work, phase-2, anything gated.
