-- 2026-05-20 — Revenue Share & Commission Engine + Payout Management
-- Adds per-haven commission config (with partner-level default fallback), extends
-- partner_payouts with proof_of_payment + deductions, and creates partner_payout_items
-- (the line items showing which bookings funded each payout).

BEGIN;

-- =========================================================================
-- 1) Commission config on havens (overrides the partner default)
-- =========================================================================
ALTER TABLE havens
  ADD COLUMN IF NOT EXISTS commission_type        TEXT
    CHECK (commission_type IN ('percentage','fixed_daily','fixed_commission','hybrid')),
  ADD COLUMN IF NOT EXISTS partner_share_pct      NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS platform_share_pct     NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS fixed_daily_guarantee  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS fixed_commission       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cleaning_fee_share_pct NUMERIC(5,2) DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS payment_schedule       TEXT
    CHECK (payment_schedule IN ('weekly','biweekly','monthly','per_booking'));

-- Partner-level default config (used when a haven leaves its config NULL)
ALTER TABLE partners_information
  ADD COLUMN IF NOT EXISTS default_commission_type        TEXT
    CHECK (default_commission_type IN ('percentage','fixed_daily','fixed_commission','hybrid')) DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS default_partner_share_pct      NUMERIC(5,2) DEFAULT 88.00,
  ADD COLUMN IF NOT EXISTS default_platform_share_pct     NUMERIC(5,2) DEFAULT 12.00,
  ADD COLUMN IF NOT EXISTS default_fixed_daily_guarantee  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS default_fixed_commission       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS default_cleaning_fee_share_pct NUMERIC(5,2) DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS default_payment_schedule       TEXT
    CHECK (default_payment_schedule IN ('weekly','biweekly','monthly','per_booking')) DEFAULT 'biweekly',
  ADD COLUMN IF NOT EXISTS payout_method                  TEXT
    CHECK (payout_method IN ('gcash','maya','bank')) DEFAULT 'gcash',
  ADD COLUMN IF NOT EXISTS payout_destination             TEXT;  -- account number / bank+account / etc.

-- =========================================================================
-- 2) Partner Payouts (create if missing; otherwise extend)
-- =========================================================================
CREATE TABLE IF NOT EXISTS partner_payouts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id           UUID NOT NULL,
  cycle_start          DATE NOT NULL,
  cycle_end            DATE NOT NULL,
  scheduled_date       DATE,
  paid_at              TIMESTAMPTZ,
  gross_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  processing_fee       NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions           JSONB NOT NULL DEFAULT '[]'::jsonb,
  net_amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method       TEXT,
  payment_destination  TEXT,
  reference_number     TEXT,
  proof_of_payment_url TEXT,
  status               TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','paid','failed','cancelled')),
  notes                TEXT,
  reviewer_notes       TEXT,
  created_by           UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extra columns in case the table existed from earlier seed (no-ops if already present)
ALTER TABLE partner_payouts
  ADD COLUMN IF NOT EXISTS deductions_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deductions           JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proof_of_payment_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_destination  TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_notes       TEXT,
  ADD COLUMN IF NOT EXISTS created_by           UUID;

CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner ON partner_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_status  ON partner_payouts(status);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_cycle   ON partner_payouts(cycle_start, cycle_end);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION trg_partner_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS partner_payouts_updated_at ON partner_payouts;
CREATE TRIGGER partner_payouts_updated_at
  BEFORE UPDATE ON partner_payouts
  FOR EACH ROW EXECUTE FUNCTION trg_partner_payouts_updated_at();

-- =========================================================================
-- 3) Line items — which bookings made up each payout
-- =========================================================================
CREATE TABLE IF NOT EXISTS partner_payout_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id         UUID NOT NULL REFERENCES partner_payouts(id) ON DELETE CASCADE,
  booking_uuid      UUID,
  booking_id        TEXT,            -- human-readable BK-XXXXX
  haven_id          UUID,
  haven_name        TEXT,
  guest_name        TEXT,
  check_in_date     DATE,
  check_out_date    DATE,
  nights            INTEGER,
  gross             NUMERIC(10,2) NOT NULL DEFAULT 0,
  cleaning_fee      NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_share    NUMERIC(10,2) NOT NULL DEFAULT 0,
  partner_share     NUMERIC(10,2) NOT NULL DEFAULT 0,
  processing_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_type   TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_items_payout  ON partner_payout_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_booking ON partner_payout_items(booking_uuid);
CREATE INDEX IF NOT EXISTS idx_payout_items_haven   ON partner_payout_items(haven_id);

-- =========================================================================
-- 4) Make sure bookings know which payout they've been settled into
--    (prevents double-paying the same booking on two payouts)
-- =========================================================================
ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS payout_id UUID,
  ADD COLUMN IF NOT EXISTS payout_settled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_booking_payout ON booking(payout_id);

COMMIT;

-- Verify:
--   \d havens
--   \d partner_payouts
--   \d partner_payout_items
--   SELECT column_name FROM information_schema.columns WHERE table_name='booking' AND column_name='payout_id';
