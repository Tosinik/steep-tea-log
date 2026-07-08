-- Steep v3.3 — shopping list / wishlist. Run once in the Supabase SQL Editor.
-- A lightweight "to buy" list. Wishlist items are NOT teas (no grams/cost/etc.),
-- so they live in their own table; "add as tea" in the app creates a real tea.

create table if not exists wishlist (
  id         uuid        primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  vendor     text,
  tea_type   text,
  note       text,
  done       boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table wishlist enable row level security;

-- Matches the existing owner-only convention ("own teas", "own vessels", ...).
create policy "own wishlist" on wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists wishlist_user_idx on wishlist (user_id, created_at);
