-- Steep v3.2 — session photos. Run once in the Supabase SQL Editor.
-- Stores an optional photo per session (URL in the existing tea-photos bucket).
-- Shared sessions already expose their row to followers via existing RLS, so the
-- photo rides along in the feed — no policy change needed.

alter table sessions add column if not exists photo_url text;
