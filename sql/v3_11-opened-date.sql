-- v3.11 (app v3.98) — the freshness model's rung-1 anchor.
--
-- Run this in the Supabase SQL editor BEFORE pushing the v3.98 code. Adding a nullable column is
-- backward-compatible with the shipped v3.97 build, which neither selects nor writes it, so the
-- window between applying this and pushing is safe in that direction. The reverse is NOT: v3.98's
-- teaToDb sends `opened_date` on every tea save, and PostgREST rejects an unknown column outright,
-- so pushing first would break saving a tea until the SQL landed.
--
-- Why the field exists at all (docs/r3/planning/SPEC-freshness-model.md §1): shelf age is not what
-- stales tea — whether the pouch is open is. Sealed vs opened is roughly a 5-10x swing, so a
-- freshness reading is only trustworthy once we know when the seal broke. Harvest remains a
-- FALLBACK that assumes sealed, and purchase is deliberately NOT on the ladder: it says when the
-- tea reached you, not when it was made, so a 2023 harvest bought in 2026 would read as fresh.
--
-- It is 0/21 filled on ship day, by construction. The payoff is entirely in data not yet entered,
-- which is the argument for shipping the field early even though the reading stays quiet.

alter table teas add column if not exists opened_date date;

comment on column teas.opened_date is
  'When the pouch was opened. Rung 1 of the freshness clock (opened_date -> harvest -> nothing). '
  'Nullable and expected empty on existing rows. Not the same join as purchase_date, which keeps '
  'its own jobs: cost-by-month, the inventory curve and the ledger consumption rate.';
