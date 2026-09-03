-- v4.42 (app R184) — Smart Restock: the per-entry purchase log.
--
-- Run this in the Supabase SQL editor BEFORE pushing the v4.42 code. Adding a nullable column is
-- backward-compatible with the shipped v4.41 build, which neither selects nor writes it, so the
-- window between applying this and pushing is safe in that direction. The reverse is NOT: v4.42's
-- teaToDb sends `purchase_log` on every tea save, and PostgREST rejects an unknown column outright,
-- so pushing the code first would break saving a tea until the SQL landed.
--
-- Why the field exists (docs/r5/planning/SPEC-restock-model.md, retires R11): rebuying the exact
-- same tea (name + vendor + harvest year) now tops up ONE entry via a Restock button, not a second
-- row. Each entry carries an ordered purchase log — one {grams, date, cost, opened} event per buy —
-- and everything "smart" (purchase history, per-batch lifespan, total spend + weighted cost/gram,
-- the "teas you return to" insight) falls out of it. A plain "sum the grams" update is rejected
-- because it forgets the entry was bought twice.
--
-- Empty on existing rows by construction; the payoff is in data not yet entered.

alter table teas add column if not exists purchase_log jsonb;

comment on column teas.purchase_log is
  'Smart Restock (R184): ordered array of purchase events, one per buy — '
  '{grams, date (purchase date), cost, opened (date the bag was opened, or null while stockpiled)}. '
  'The initial add is buy #1; each restock appends. Source of truth for cost + purchase history; '
  'cost_total / cost_original_grams remain the legacy fallback for rows with no log. Nullable, empty '
  'on existing rows.';
