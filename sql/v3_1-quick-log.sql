-- Steep v3.1 — quick / gongfu log. Run once in the Supabase SQL Editor.
-- Adds a lightweight "brewed this N times" count for sessions logged without the
-- per-steep timer flow. Detailed sessions leave this null and count their steeps
-- rows instead; quick sessions carry no steeps and use this number.

alter table sessions add column if not exists infusion_count integer
  check (infusion_count is null or infusion_count >= 1);

-- No RLS change needed: infusion_count lives on sessions, already covered by the
-- existing "own sessions" and "followers read shared sessions" policies.
