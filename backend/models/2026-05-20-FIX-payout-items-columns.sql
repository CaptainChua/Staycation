-- FIX: partner_payout_items already existed with a different column set.
-- Add every column my code expects (idempotent — IF NOT EXISTS). Then re-create
-- the indexes. Safe to run on top of the failed transaction.

-- 1) Ensure every expected column is present on the existing partner_payout_items
DO $$
BEGIN
  ALTER TABLE partner_payout_items
    ADD COLUMN IF NOT EXISTS booking_uuid    UUID,
    ADD COLUMN IF NOT EXISTS booking_id      TEXT,
    ADD COLUMN IF NOT EXISTS haven_id        UUID,
    ADD COLUMN IF NOT EXISTS haven_name      TEXT,
    ADD COLUMN IF NOT EXISTS guest_name      TEXT,
    ADD COLUMN IF NOT EXISTS check_in_date   DATE,
    ADD COLUMN IF NOT EXISTS check_out_date  DATE,
    ADD COLUMN IF NOT EXISTS nights          INTEGER,
    ADD COLUMN IF NOT EXISTS gross           NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cleaning_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS platform_share  NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS partner_share   NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS processing_fee  NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS commission_type TEXT,
    ADD COLUMN IF NOT EXISTS notes           TEXT,
    ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();
  RAISE NOTICE 'partner_payout_items: columns aligned';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'partner_payout_items ALTER failed: %', SQLERRM;
END $$;

-- 2) Now the indexes will work
CREATE INDEX IF NOT EXISTS idx_payout_items_payout  ON partner_payout_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_booking ON partner_payout_items(booking_uuid);
CREATE INDEX IF NOT EXISTS idx_payout_items_haven   ON partner_payout_items(haven_id);

-- 3) Booking table payout-tracking columns (auto-detect singular vs plural)
DO $$
DECLARE
  target_table TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'booking') THEN
    target_table := 'booking';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    target_table := 'bookings';
  ELSE
    RAISE NOTICE 'No booking table found — skipping payout_id column.';
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS payout_id UUID', target_table);
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS payout_settled_at TIMESTAMPTZ', target_table);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_payout ON %I(payout_id)', target_table, target_table);

  RAISE NOTICE 'Added payout_id + payout_settled_at to "%"', target_table;
END $$;

-- Verify the columns are now there:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='partner_payout_items' ORDER BY ordinal_position;
