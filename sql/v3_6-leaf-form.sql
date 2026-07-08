-- v3.6 — leaf-form enabler (v3.29)
-- Physical leaf form (rolled/open/bud/pan-fired green/steamed green/compressed) drives
-- the per-steep time curves: default schedule when a tea has no guide, and how times ramp
-- past the last listed steep. Nullable — blank means "infer from type + name at runtime",
-- so no backfill is needed and existing teas keep working.
alter table teas add column if not exists leaf_form text;
