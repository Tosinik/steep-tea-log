-- v3.10 (app v4.02) — R25's pass record: one table for "I passed you this tea".
--
-- Run this in the Supabase SQL editor BEFORE pushing the v4.02 code. A NEW table is backward-
-- compatible in BOTH directions: v4.01 never names `passes`, so applying this early changes
-- nothing for the running build. Pushing first would leave every pass read and write failing
-- with "relation does not exist" until the SQL landed.
--
-- FILING NOTE: this is v3_10 and it lands AFTER v3_11-opened-date.sql, which already shipped
-- (app v3.98). Apply migrations in VERSION order, never filename order — `v3_10` sorts between
-- `v3_1` and `v3_2` as a string. The two happen to be order-independent; read the version anyway.
--
-- WHAT IT IS (R25): one record yields three things `is_shared` cannot express — per-recipient
-- sharing, the Passed-to-you shelf, and the note that rides along with a passed cup. It is NOT a
-- reactions system and NOT a message thread.

create table if not exists passes (
  id           uuid        primary key default gen_random_uuid(),
  from_profile uuid        not null references auth.users(id) on delete cascade,
  to_profile   uuid        references auth.users(id) on delete cascade,  -- null = the whole circle
  session_id   uuid        references sessions(id) on delete set null,
  tea_id       uuid        references teas(id)     on delete set null,
  tea_name     text        not null,
  tea_type     text,
  note         text,
  created_at   timestamptz not null default now()
);

-- WHY tea_name IS NOT NULL, and not just tea_id (R96).
-- `teas` is owner-only under RLS ("own teas", schema.sql:88), so a recipient handed a tea_id can
-- resolve exactly nothing — the shelf would render blank rows. This is the same problem
-- v3_0-social.sql §3 already solved for the feed by denormalizing tea_name/tea_type onto sessions
-- ("so nothing leaks"). The snapshot is what the recipient reads; it is written AS STORED and
-- never re-spelled later.
--
-- WHY session_id AND tea_id ARE on delete set null (R96).
-- They are the sender's provenance, not the recipient's content. The sender deleting their own tea
-- or sitting must not delete the record of what someone else was sent. Nothing on the receive side
-- renders from either column — a recipient may well be unable to read the referenced session at
-- all (sessions are follower-readable only when is_shared), and that is fine by design.
--
-- WHY THERE IS NO catalog_slug (R97).
-- R36's three-tier destination resolves through matchTeaType() client-side, against a catalog that
-- ships in the bundle. Storing the slug would freeze the answer at send time; resolving on read
-- means authoring a `covers` entry later upgrades passes already sent. With 8 of 21 shelf teas
-- uncovered, that is not hypothetical.
--
-- The default above is gen_random_uuid() to match every other table in this schema (teas,
-- sessions, steeps, vessels, wishlist). The app supplies its own client-side uuid, so the default
-- is never used in normal operation — it exists so a manual insert in the SQL editor works, which
-- on this table is the only way to exercise the receive side.

alter table passes enable row level security;

do $$
begin
  -- READ. Three disjoint cases and nothing else:
  --   · the sender always sees what they sent;
  --   · a named recipient sees their own row;
  --   · a circle pass (to_profile null) is readable by the sender's FOLLOWERS — the same gate
  --     v3_0-social.sql:63 uses for shared sessions, so "the circle" means one thing app-wide.
  -- A user who follows nobody and is followed by nobody sees exactly zero rows. A pass named to
  -- one person is invisible to everyone else: the circle branch requires to_profile is null.
  -- NOTE: a policy subquery does NOT bypass RLS — `follows` enforces its own select policy here.
  -- Both lookups below name the current user on one side of the edge, so the row they need is
  -- visible under "follows selectable" (auth.uid() = follower_id or auth.uid() = followee_id).
  -- Had either named the user on neither side, the policy would evaluate false with no error and
  -- every pass would silently vanish.
  if not exists (select 1 from pg_policies where tablename='passes' and policyname='passes readable') then
    create policy "passes readable" on passes for select to authenticated
      using (
        auth.uid() = from_profile
        or auth.uid() = to_profile
        or (to_profile is null and exists (
              select 1 from follows f
              where f.follower_id = auth.uid() and f.followee_id = passes.from_profile))
      );
  end if;

  -- INSERT. You may only send AS yourself, and only TO someone who follows you (or to the circle,
  -- which is that same set). The recipient opted in by following. This is what stops a pass from
  -- being an unsolicited message to any account whose id you happen to know. A self-pass is
  -- already impossible: follows carries check (follower_id <> followee_id), so no self-edge
  -- exists for this check to match.
  if not exists (select 1 from pg_policies where tablename='passes' and policyname='passes insert own') then
    create policy "passes insert own" on passes for insert to authenticated
      with check (
        auth.uid() = from_profile
        and (
          to_profile is null
          or exists (select 1 from follows f
                     where f.follower_id = to_profile and f.followee_id = auth.uid())
        )
      );
  end if;

  -- DELETE. The sender may retract. No UI ships in v4.02 — the policy exists so a mis-sent pass is
  -- recoverable at all, and it is owner-only, so it grants a sender nothing they don't already have.
  if not exists (select 1 from pg_policies where tablename='passes' and policyname='passes delete own') then
    create policy "passes delete own" on passes for delete to authenticated
      using (auth.uid() = from_profile);
  end if;

  -- NO update policy, deliberately: a pass is a sent message. Nothing edits one after the fact,
  -- sender included.
end $$;

create index if not exists passes_to_idx   on passes (to_profile,   created_at desc);
create index if not exists passes_from_idx on passes (from_profile, created_at desc);
