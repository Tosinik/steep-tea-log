# SECURITY.md — pre-beta security & legal findings (capture only)

> **This is documentation, not remediation.** Nothing here is fixed by writing it down, and no app
> code, RLS policy, bucket flag, or auth setting is changed by this file. It exists because the
> planning lane was carrying these items in session memory only — they lived in no repo file and would
> have died with the session that held them. Captured now, at the current state, so the schedule can
> point at something real.
>
> **The remediation is a scheduled pass** — a security/legal hardening bundle sequenced **after v4.20**
> and **before any public beta** (see `ROADMAP-v4.md`, Pillar D). Findings 1 and 2 (both HIGH) **gate
> the beta**: the Datenschutzerklärung must not go live until they are fixed (§Legal below).
>
> **Verified against the live Supabase project** (`duuosbgjozjjfyfusjzf`, `eu-west-1`,
> Postgres 17.6) on **2026-08-26**, not transcribed from the planning lane's recollection. Evidence
> (the actual `pg_policies` rows / `storage.buckets` flag) is quoted under each finding. Where the MCP
> surface could not reach a setting, that is stated rather than guessed.

---

## Summary

| # | Finding | Where it lives | Severity | Verified state (2026-08-26) |
|---|---|---|---|---|
| 1 | `profiles` readable by every authenticated user; no allowlist enforces "invitation-only" | `public.profiles` RLS | **HIGH** | **CONFIRMED** |
| 2 | `tea-photos` storage bucket is `public: true` and its read policy is unscoped | `storage.buckets` + `storage.objects` RLS | **HIGH** | **CONFIRMED** |
| 3 | Shared sessions/steeps expose the full row (incl. `mood`, free-text notes, `feedback`) to followers | `public.sessions` / `public.steeps` RLS | **MEDIUM** | **CONFIRMED** |
| 4 | Auth redirect allowlist — was the old github.io origin removed? | Supabase Auth (GoTrue) URL config | **LOW** (see below) | **Unverifiable via MCP** — STATE.md:42 claims DONE; needs a 30-second dashboard confirm |
| A | Leaked-password protection disabled (from `get_advisors`) | Supabase Auth | **WARN / low practical** | CONFIRMED by advisor |

**No CRITICAL item surfaced.** The security advisor (§Advisor below) returned exactly one lint, a WARN,
already listed as item A. It did **not** flag findings 1–3, because RLS is enabled on every table and
the linter reports *missing* RLS, not *intentionally-broad* policies — which is precisely why findings
1–3 need human security judgement and this document.

---

## Finding 1 — `profiles` readable by all authenticated users  (HIGH — CONFIRMED)

**Where:** `public.profiles`, RLS policy `profiles readable`.

**Evidence (live `pg_policies`):**
```
policy "profiles readable"  cmd=SELECT  roles={authenticated}  qual=(true)
policy "own profile write"  cmd=ALL     roles={public}         qual=(auth.uid() = id)  with_check=(auth.uid() = id)
```

**What is true:** any authenticated user can `SELECT` **every** profile row (`qual` is literally
`true`). Writes are correctly self-scoped. There is **no allowlist table** anywhere in `public` gating
who may hold an account — verified by listing the public schema (tables: `follows`, `passes`,
`profiles`, `sessions`, `steeps`, `tag_library`, `teas`, `user_settings`, `vessels`, `wishlist`; no
`allowlist`/`invites`/`members` table exists).

**The real substance is the enrollment gate, not the column exposure.** The columns `profiles` exposes
are low-sensitivity social data — `username`, `display_name`, `avatar_url`, `bio`, `created_at`; no
email, no auth secrets. The HIGH rating is because **"Invitation-only for now"** (the login-door copy,
`renderLogin`) is a *social* claim with **no technical enforcement**: auth is email magic-link + Google
OAuth, so anyone who can request a magic link for any address becomes a full member — and once in, reads
every profile and can follow anyone (which then unlocks finding 3's shared content). The invitation gate
is aspirational until an allowlist (or manual-approval enrollment) backs it.

**Remediation shape (for the hardening pass, not now):** an allowlist/enrollment table checked at
sign-in (or a Supabase Auth hook that rejects un-allowlisted emails), and/or narrowing `profiles
readable` to followers + self. Either is a design decision for the batch, not a hotfix.

---

## Finding 2 — `tea-photos` bucket is public and unscoped  (HIGH — CONFIRMED)

**Where:** `storage.buckets` row `tea-photos`; `storage.objects` RLS policy `tea-photos read`.

**Evidence (live):**
```
storage.buckets: id=tea-photos  public=true  file_size_limit=null  allowed_mime_types=null
storage.objects policies:
  "tea-photos read"        cmd=SELECT  roles={public}         qual=(bucket_id='tea-photos')          -- no folder scope
  "tea-photos insert own"  cmd=INSERT  roles={authenticated}  with_check=(bucket_id='tea-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  "tea-photos update own"  cmd=UPDATE  roles={authenticated}  qual=(... foldername[1] = auth.uid())
  "tea-photos delete own"  cmd=DELETE  roles={authenticated}  qual=(... foldername[1] = auth.uid())
```

**What is true:** the bucket is `public: true`, so every object is served unauthenticated over the CDN
path `…/storage/v1/object/public/tea-photos/<uid>/<file>` — and every tea, vessel, and session photo in
the app is stored exactly there (confirmed in the current export: all `image_data` / `photo_url` /
`avatar_url` values are `…/object/public/tea-photos/…` URLs). Write/update/delete **are** correctly
scoped to the owner's `<uid>/` folder — that half is fine. The exposure is on **read**: the SELECT
policy grants `{public}` and scopes only by `bucket_id`, with **no folder restriction**, so combined
with `public: true` the bucket's objects are world-readable, and a `{public}` SELECT on
`storage.objects` also permits **enumeration** of object paths via the storage API. Object names are
UUIDs, which is obscurity, not access control.

**Note — no `file_size_limit` / `allowed_mime_types`:** both null, so the bucket also accepts arbitrary
size and MIME. Secondary to the read exposure but worth folding into the same fix.

**Remediation shape:** flip the bucket to private and serve photos through signed URLs (or a
folder-scoped read policy), or accept public-read as a product decision and *document that photos are
public* — but that decision must be made explicitly before the Datenschutzerklärung is published,
because it changes what that document must disclose.

---

## Finding 3 — shared sessions/steeps expose the whole row to followers  (MEDIUM — CONFIRMED)

**Where:** `public.sessions` policy `followers read shared sessions`; `public.steeps` policy
`followers read shared steeps`.

**Evidence (live):**
```
sessions "followers read shared sessions"  cmd=SELECT  roles={authenticated}
  qual = (is_shared = true AND EXISTS(select 1 from follows f
                                      where f.follower_id = auth.uid() and f.followee_id = sessions.user_id))
steeps "followers read shared steeps"  cmd=SELECT  roles={authenticated}
  qual = EXISTS(select 1 from sessions s join follows f
                on f.follower_id = auth.uid() and f.followee_id = s.user_id
                where s.id = steeps.session_id and s.is_shared = true)
```

**What is true:** Postgres RLS is **row-level, not column-level**. A follower who can read a shared
session gets **every column of that row**, not just what the social feed chooses to render — including
`mood`, `description` (the free-text session note), `feedback`, `water_type`, `water_tds`,
`grams_used`, `rating`, and `photo_url`. The same applies one level down to `steeps`: a follower reads
each shared session's per-steep `description`, `feedback`, and `tags`. In the current data these fields
carry genuinely personal content (e.g. a session note "I'm sick so maybe I can't taste well", `mood`
values, tasting diary text). The feed UI showing less does not restrict what the API returns.

**Why MEDIUM, not HIGH:** exposure is limited to a user's own approved followers on rows the user
explicitly marked `is_shared = true` — it is a *scope-creep within an opt-in share*, not an open leak.

**Remediation shape:** expose shared sessions through a **view** (or a security-definer function) that
projects only the intended columns, and point the feed reader at it — column privileges/RLS alone
cannot do column-level restriction here.

---

## Finding 4 — auth redirect allowlist  (was MEDIUM → LOW; STATE.md:42 vs. planning-lane memory)

**The conflict:** `STATE.md:42` states the redirect-allowlist cleanup is **DONE** — "Niklas removed the
`tosinik.github.io/steep-tea-log` entry **2026-07-20** (Ruth reinstalled on the new origin), so the
allowlist now holds only slowcup.app." The planning lane's memory says it "needs re-verification."

**What could be verified:** **nothing conclusive from here.** The redirect allowlist
(GoTrue `additional_redirect_urls` / URI allow-list) is **not exposed by the Supabase MCP surface** —
`get_project` returns only `ref` / `organization` / `region` / `database` / `status` (no auth config),
there is no auth-settings tool, and the setting is not stored in any query-able `public`/`auth` table.
So I can neither confirm nor refute STATE:42 with the tools available in this session.

**Resolution / verdict:** STATE:42's claim is **specific, dated, and credible** (a named action with a
named reason), so it should **not** be marked stale without evidence — it stands until a dashboard
reading contradicts it. The residual risk even in the worst case (the old entry still present) is
**LOW**, which is why this drops from MEDIUM: the only origin in question is Niklas's **own** GitHub
Pages, which now **301s to slowcup.app** — it is self-owned, not attacker-controlled, so a token that
redirected there would land at the canonical app, not an adversary. **Action:** a 30-second confirm in
Supabase Dashboard → Authentication → URL Configuration that the Redirect URLs list holds only
`slowcup.app` origins. If it does, this item closes and STATE:42 is correct as written; if the github.io
entry is still present, remove it and STATE:42 needs no change (it already claims removed — it would
just mean the removal didn't take).

---

## Legal items (documentation only — these gate the same beta)

Both are **noted, not drafted here**, and both block the public beta:

1. **Datenschutzerklärung (privacy policy).** The planning lane referenced a
   `DRAFT-datenschutzerklaerung.md`. **It is not in the repo** (searched 2026-08-26 —
   no `*datenschutz*` file exists), so the draft either lives outside the repo or has not been written.
   **Gating rule:** the Datenschutzerklärung **must not go live before findings 1 and 2 are fixed** —
   publishing a privacy policy while profiles are world-readable-to-members and photos are world-public
   would make the policy's disclosures inaccurate on day one. Whatever the final decision on finding 2
   (private bucket vs. explicitly-public photos), the privacy policy must describe the *actual* state.
2. **Impressum.** Needs a **ladungsfähige Anschrift** (a real, service-of-process postal address — not
   a P.O. box / packstation), per German §5 TMG / §18 MStV for a publicly reachable service. No
   `impressum` file exists in the repo today.

---

## Advisor output — `get_advisors(type: security)`, run 2026-08-26

This was queued unrun for the whole round; it is the authoritative machine source and was run against
the live project. **It returned exactly one lint, and nothing CRITICAL:**

| lint | level | facing | category | note |
|---|---|---|---|---|
| `auth_leaked_password_protection` — *Leaked Password Protection Disabled* | **WARN** | EXTERNAL | SECURITY | HaveIBeenPwned check on passwords is off. Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection |

**Practical relevance is low:** primary auth is magic-link + Google OAuth, so email+password signup may
be unused entirely; enabling the check is cheap and harmless but not urgent. Fold into the hardening
pass.

**The advisor's silence on findings 1–3 is itself informative:** it does not flag broad-but-present RLS
policies or a deliberately-public bucket, only *missing* protection. The four planning-lane items are
exactly the class a linter cannot see — which is the argument for keeping this file.

---

## Method note (what this verification did and did not touch)

- **Read-only.** Every check was a `SELECT` against `pg_policies` / `storage.buckets`, plus
  `get_advisors` and `get_project`. No policy, flag, table, or setting was modified. No app file was
  written for these findings.
- **Reachable via MCP and verified:** findings 1, 2, 3 (RLS policies + bucket flag), and the advisor
  lint. **Not reachable via MCP:** finding 4 (auth redirect allowlist) — recorded as a dashboard
  confirm, not an assertion.
- Re-run `get_advisors(type: security)` after the hardening pass lands, per its own guidance (it
  re-checks RLS after DDL changes).
