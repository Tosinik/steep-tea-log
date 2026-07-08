-- Steep v3.0 — accounts & friends. Run once in the Supabase SQL Editor.
-- Model: asymmetric follow; profiles are a minimal discoverable card; a session
-- is visible to a follower ONLY if the owner marked it shared. Teas/vessels stay
-- fully private — shared sessions carry denormalized name/type so nothing leaks.

-- 1. Profiles (minimal public card)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;

-- 2. Follows (follower_id follows followee_id)
create table if not exists follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
alter table follows enable row level security;

-- 3. Per-session sharing + denormalized display fields (so teas/vessels stay private)
alter table sessions add column if not exists is_shared boolean default false;
alter table sessions add column if not exists tea_name text;
alter table sessions add column if not exists tea_type text;
alter table sessions add column if not exists vessel_name text;
create index if not exists idx_sessions_shared on sessions (user_id, is_shared, session_date desc);

-- ---------------- Policies ----------------
do $$
begin
  -- profiles: any signed-in user can read (needed to find people); write only your own
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles readable') then
    create policy "profiles readable" on profiles for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='own profile write') then
    create policy "own profile write" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
  end if;

  -- follows: see rows you're part of; create/remove only your own follows
  if not exists (select 1 from pg_policies where tablename='follows' and policyname='follows selectable') then
    create policy "follows selectable" on follows for select to authenticated
      using (auth.uid() = follower_id or auth.uid() = followee_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='follows' and policyname='follows insert own') then
    create policy "follows insert own" on follows for insert to authenticated
      with check (auth.uid() = follower_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='follows' and policyname='follows delete own') then
    create policy "follows delete own" on follows for delete to authenticated
      using (auth.uid() = follower_id);
  end if;

  -- sessions: followers may read a session only if it's shared AND they follow the owner
  if not exists (select 1 from pg_policies where tablename='sessions' and policyname='followers read shared sessions') then
    create policy "followers read shared sessions" on sessions for select to authenticated
      using (
        is_shared = true
        and exists (select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = sessions.user_id)
      );
  end if;

  -- steeps: same gate, via the parent session
  if not exists (select 1 from pg_policies where tablename='steeps' and policyname='followers read shared steeps') then
    create policy "followers read shared steeps" on steeps for select to authenticated
      using (
        exists (
          select 1 from sessions s
          join follows f on f.follower_id = auth.uid() and f.followee_id = s.user_id
          where s.id = steeps.session_id and s.is_shared = true
        )
      );
  end if;
end $$;
