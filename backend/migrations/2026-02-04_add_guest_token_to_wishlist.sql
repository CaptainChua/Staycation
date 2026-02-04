-- Staycation migration: add guest_token support to wishlist
-- File: 2026-02-04_add_guest_token_to_wishlist.sql
--
-- Purpose:
-- 1) Allow wishlist entries for guest users by adding `guest_token`
-- 2) Make `user_id` nullable so guest entries are possible
-- 3) Add partial unique indexes to ensure unique (user_id,haven_id) for users
--    and unique (guest_token,haven_id) for guests
-- 4) Attempt to safely drop any pre-existing UNIQUE constraint on (user_id, haven_id)
--    if it exists (we detect it dynamically to avoid hard-coded constraint names)

BEGIN;

-- 1) Allow user_id to be nullable (so guest entries can exist)
ALTER TABLE wishlist ALTER COLUMN user_id DROP NOT NULL;

-- 2) Add guest_token column if it's missing
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS guest_token VARCHAR(255);

-- 3) If an old UNIQUE constraint exists on (user_id, haven_id), attempt to drop it
--    We look for unique constraints defined on the wishlist table that match the exact
--    column list user_id,haven_id (order-insensitive) and drop them.
DO $$
DECLARE
  r RECORD;
  col_list TEXT;
BEGIN
  FOR r IN
    SELECT con.conname, con.conkey
    FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'wishlist' AND con.contype = 'u'
  LOOP
    SELECT string_agg(att.attname, ',' ORDER BY s.pos) INTO col_list
    FROM unnest(r.conkey) WITH ORDINALITY AS s(attnum, pos)
    JOIN pg_attribute att ON att.attrelid = (SELECT oid FROM pg_class WHERE relname = 'wishlist') AND att.attnum = s.attnum;

    IF col_list = 'user_id,haven_id' OR col_list = 'haven_id,user_id' THEN
      EXECUTE format('ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS %I', r.conname);
    END IF;
  END LOOP;
END $$;

-- 4) Create partial unique indexes so uniqueness is enforced only for the relevant identifier
--    (user or guest) while allowing the other identifier to be NULL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_haven
  ON wishlist (user_id, haven_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_guest_haven
  ON wishlist (guest_token, haven_id)
  WHERE guest_token IS NOT NULL;

COMMIT;

-- Notes:
-- - Run this migration against your PostgreSQL database. Make sure to have a backup.
-- - If your environment uses a migration tool (eg, Flyway, Liquibase, sqitch, etc.),
--   incorporate this SQL into your usual migration mechanism/file.
-- - After applying this migration, backend APIs that use the new `guest_token` column
--   will be able to store guest wishlists. If you prefer, I can add this migration file
--   into your repo's migration pipeline or adapt it to your project's migration tool.
