-- Steep v3.5 — purchase date (spend-tracking enabler). Run once in the Supabase SQL Editor.
-- Distinct from created_at (date-added): a tea only counts toward a month's spend when it has
-- a purchase_date in that month. Leaving it null = cataloguing stock you already had, so an
-- initial backlog isn't read as "all bought this month". Also unblocks inventory-over-time.
alter table teas add column if not exists purchase_date date;
