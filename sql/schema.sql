-- Steep v2 — Supabase schema
-- Run in Supabase SQL Editor. Assumes email magic-link auth (auth.users built in).

create table teas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('green','black','oolong','puerh','yellow','white')),
  amount_grams numeric default 0,
  rating numeric default 0 check (rating >= 0 and rating <= 5),
  harvest_year text,
  harvest_season text,
  origin text,
  cultivar text,
  source text,
  cost_total numeric default 0,
  cost_original_grams numeric default 0,
  brew_guide text,
  description text,
  is_favorite boolean default false,
  would_rebuy boolean default false,
  purchase_type text default 'first' check (purchase_type in ('first','repeat')),
  image_data text,          -- base64 data URL (v2.1: move to Supabase Storage bucket)
  created_at timestamptz default now()
);

create table vessels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text,
  material text,
  capacity_ml integer,
  image_data text,          -- base64 data URL (v2.1: move to Supabase Storage bucket)
  created_at timestamptz default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tea_id uuid references teas(id) on delete set null,
  vessel_id uuid references vessels(id) on delete set null,
  session_date timestamptz not null default now(),
  is_cold_brew boolean default false,
  water_type text,
  water_tds integer,
  grams_used numeric default 0,
  rating numeric default 0 check (rating >= 0 and rating <= 5),
  description text,
  tags text[] default '{}',
  created_at timestamptz default now()
);

create table steeps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  steep_order integer not null,
  temp_c numeric,
  time_seconds integer not null,
  description text,
  tags text[] default '{}'
);

create table tag_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tag text not null,
  unique (user_id, tag)
);

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Row Level Security: each user only ever sees their own rows
alter table teas enable row level security;
alter table vessels enable row level security;
alter table sessions enable row level security;
alter table steeps enable row level security;
alter table tag_library enable row level security;
alter table user_settings enable row level security;

create policy "own teas" on teas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own vessels" on vessels for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own steeps" on steeps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tags" on tag_library for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Helpful indexes
create index idx_sessions_user_date on sessions (user_id, session_date desc);
create index idx_steeps_session on steeps (session_id, steep_order);
create index idx_teas_user on teas (user_id);
