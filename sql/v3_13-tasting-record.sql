-- v3_13 — Tea Tasting mode (guided mode, D4, slice c1): the tasting record blob.
--
-- APPLY THIS IN THE SUPABASE SQL EDITOR BEFORE PUSHING ANY c1 CODE. Adding a nullable column is
-- backward-compatible with the running v4.45 build, which neither selects nor writes it, so the window
-- between applying this and pushing c1 is safe in that direction. The reverse is NOT: c1's sessionToDb
-- will send `tasting_record` on every session save, and PostgREST rejects an unknown column outright,
-- so pushing c1 first would break saving ANY session until this landed. SQL first, alone, then the code.
--
-- (Naming: this continues the v3_ migration SERIES, per STATE.md's "the v3_ prefix is a series number,
-- not the app version" rule — v3_10 was applied at app v4.02. The lone v4_42-purchase-log.sql deviated
-- from that; this file follows the documented rule. add-column-if-not-exists is order-independent, so
-- applying v3_13 after v4_42 on the live DB is fine.)
--
-- What it is (docs/r5/planning/SPEC-guided-mode-FINAL.md, reconcile issued): a tasting is a SESSION
-- VARIANT. This one jsonb column holds the Tier-2, render-only tasting record, and it is present ONLY on
-- tasting sessions — its presence IS the "this is a tasting" flag (no separate boolean, which could
-- disagree). Ordinary sessions leave it null.
--
-- What does NOT live here (the tier boundary, decided): the Tier-1 reusable data stays in the columns it
-- already has. Aroma/taste tags feed the tea's flavour profile via sessions.tags (FLAVOR_TREE) as normal;
-- the verdict writes sessions.rating + the offered teas.rating + teas.would_rebuy; per-steep evolution
-- (c3) lands in the steeps rows. The blob is the rich in-the-moment record the tasting view renders back.
--
-- Shape (c1 keys; c2/c3 nest inside with NO further migration): a versioned object
--   { v, register, startedAt, endedEarly, dryLeaf{form,colour,aroma,note}, wetLeaf{aromaShift,note},
--     liquor{colour,aroma,note}, taste{notes,note}, mouthfeel{note}, finish{note}, verdict{liked,...} }.
-- Worded-intensity axes (c2) store {word, position} and render the FROZEN word, never re-derived. Ramp
-- colours store a KEY (a --liquor-*/--leaf-* key), so a later ramp re-tune never rewrites a stored tasting.
--
-- NOT SHAREABLE (decided, F3): a tasting must never reach the "followers read shared sessions" path
-- (v3_0-social.sql), which hands the whole row to followers. c1 enforces this at the single writer
-- (sessionToDb forces is_shared = false whenever tasting_record is present); this migration adds the
-- column ALONE and changes no RLS. A defensive RLS clause (…and tasting_record is null) pairs with the
-- F3 fix in the security round, not here.
--
-- Nullable, empty on every existing row by construction; the payoff is in data not yet entered.

alter table sessions add column if not exists tasting_record jsonb;

comment on column sessions.tasting_record is
  'Tea Tasting mode (guided mode D4, c1): the Tier-2 render-only tasting record. Present ONLY on tasting '
  'sessions, and its presence is the tasting flag. A versioned object of per-stage observations (dry/wet '
  'leaf, liquor, taste, mouthfeel, finish), ramp colour KEYS (retune-safe), and the verdict takeaway. '
  'Tier-1 data lives elsewhere: profile tags -> sessions.tags, rating -> sessions.rating, tea rating + '
  'would-rebuy -> teas, per-steep -> steeps. Never shared: a tasting is kept out of the followers-read '
  'path (is_shared forced false when this is set). Nullable, empty on existing rows.';
