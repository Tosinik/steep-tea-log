-- v3.7 — mood/energy enabler (v3.31)
-- Optional pre-brew mood/energy captured at session setup. Nullable — blank = not recorded.
-- Foundation for the later Garmin/caffeine-sleep correlation (Tier 4, normal mode only).
alter table sessions add column if not exists mood text;
