-- Steep v3.4 — brew advice. Run once in the Supabase SQL Editor.
-- Stores an optional per-session "how was it?" signal ('good' | 'strong' | 'weak')
-- used to gently tune future brews for that tea. Nullable; sessions stay loose.
alter table sessions add column if not exists feedback text;
