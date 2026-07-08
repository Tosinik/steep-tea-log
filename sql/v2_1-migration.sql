-- Steep v2.1 — run this in the Supabase SQL Editor on your EXISTING project.
-- Safe to run once; uses IF NOT EXISTS so it won't clobber existing data.

-- 1. Vessel photos
alter table vessels add column if not exists image_data text;

-- 2. Synced user settings (temp unit, sounds, achievements, font)
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

-- Create the policy only if it isn't there yet.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_settings' and policyname = 'own settings'
  ) then
    create policy "own settings" on user_settings
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
