-- v3_8 — brew-advice v2 phase 1 (run once in the Supabase SQL editor)
-- Adds two nullable columns to sessions; no RLS/policy changes, no backfill needed.
-- Safe to run BEFORE the v3.57 app deploy (old code simply ignores the columns).

-- Per-session water volume override in ml. Null = use the vessel's capacity_ml.
-- Absorbs the parked "partial vessel fill" item (half-filled kyusu etc.).
alter table sessions add column if not exists water_ml integer;

-- Brewing method used for the session: 'gongfu' | 'western'. Null = legacy/unset,
-- in which case the app infers from vessel capacity (<= ~150ml -> gongfu).
-- Needed so phase-2 learned defaults can normalise within-method.
alter table sessions add column if not exists brew_style text;
