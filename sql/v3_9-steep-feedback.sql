-- v3_9 — phase-2 brew advice: per-steep feedback (run once in the Supabase SQL editor)
-- One nullable column on steeps; no RLS/policy changes (the "own steeps" row policy
-- covers every column), no backfill. Safe to run before the app deploy — old code
-- ignores it. Mirrors sessions.feedback exactly: 'good' | 'strong' | 'weak', else null.
alter table steeps add column if not exists feedback text;
