-- =====================================================================
-- PARTNER BACKEND — FULL MIGRATION
-- Run this in Neon SQL Editor to enable the partner portal end-to-end.
--
-- Safe to re-run: all statements use IF NOT EXISTS / DO blocks.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. LINK HAVENS TO PARTNERS
-- A haven is either owner-owned (partner_id IS NULL) or partner-owned.
-- ---------------------------------------------------------------------
ALTER TABLE havens
  ADD COLUMN IF NOT EXISTS partner_id UUID
  REFERENCES partners_account(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_havens_partner_id ON havens(partner_id);

COMMENT ON COLUMN havens.partner_id IS
  'NULL = owner-created haven. Non-NULL = partner-submitted listing tied to partners_account.id';


-- ---------------------------------------------------------------------
-- 2. PARTNER PAYOUTS
-- One row per scheduled or completed payout to a partner.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners_account(id) ON DELETE CASCADE,

  cycle_start DATE NOT NULL,           -- billing cycle start
  cycle_end DATE NOT NULL,             -- billing cycle end
  scheduled_date DATE NOT NULL,        -- when payout will be released
  paid_at TIMESTAMPTZ,                 -- actual release timestamp (NULL = pending)

  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  processing_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

  payment_method VARCHAR(50) NOT NULL DEFAULT 'gcash'
    CHECK (payment_method IN ('gcash', 'bank', 'paymaya', 'cash')),
  reference_number VARCHAR(100),

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner_id ON partner_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_status ON partner_payouts(status);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_scheduled_date ON partner_payouts(scheduled_date);


-- ---------------------------------------------------------------------
-- 3. PARTNER PAYOUT LINE ITEMS
-- Each booking that contributed to a payout (for transparent receipts).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES partner_payouts(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES booking(id) ON DELETE SET NULL,

  description VARCHAR(255) NOT NULL,
  gross NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission NUMERIC(12,2) NOT NULL DEFAULT 0,
  fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  net NUMERIC(12,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_payout_items_payout_id ON partner_payout_items(payout_id);


-- ---------------------------------------------------------------------
-- 4. PARTNER MESSAGE THREADS
-- A conversation between a partner and a counterparty (support, manager, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners_account(id) ON DELETE CASCADE,

  thread_key VARCHAR(50) NOT NULL,     -- 'support' | 'manager' | 'billing' | 'verify'
  display_name VARCHAR(150) NOT NULL,  -- e.g. "Staycation Haven Support"
  role_label VARCHAR(150),             -- e.g. "Customer service · 24/7"
  avatar_initials VARCHAR(4),
  avatar_color VARCHAR(20),            -- tailwind color slug

  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (partner_id, thread_key)
);

CREATE INDEX IF NOT EXISTS idx_partner_message_threads_partner_id ON partner_message_threads(partner_id);


-- ---------------------------------------------------------------------
-- 5. PARTNER MESSAGES
-- Individual messages inside a thread.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES partner_message_threads(id) ON DELETE CASCADE,

  sender VARCHAR(10) NOT NULL CHECK (sender IN ('partner', 'staff')),
  sender_name VARCHAR(150),            -- staff display name when sender='staff'
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_messages_thread_id ON partner_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_created_at ON partner_messages(created_at);


-- ---------------------------------------------------------------------
-- 6. PARTNER NOTIFICATIONS
-- System alerts shown on the partner dashboard ("Needs your attention")
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners_account(id) ON DELETE CASCADE,

  kind VARCHAR(20) NOT NULL DEFAULT 'info'
    CHECK (kind IN ('info', 'review', 'rejected', 'approved', 'payout', 'message')),

  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,

  related_haven_id UUID REFERENCES havens(uuid_id) ON DELETE SET NULL,
  related_booking_id UUID REFERENCES booking(id) ON DELETE SET NULL,
  related_payout_id UUID REFERENCES partner_payouts(id) ON DELETE SET NULL,

  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(500),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner_id ON partner_notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_is_read ON partner_notifications(is_read);


-- ---------------------------------------------------------------------
-- 7. AUTO-UPDATE updated_at TIMESTAMPS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_partner_payouts') THEN
    CREATE TRIGGER set_updated_at_partner_payouts
      BEFORE UPDATE ON partner_payouts
      FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_partner_message_threads') THEN
    CREATE TRIGGER set_updated_at_partner_message_threads
      BEFORE UPDATE ON partner_message_threads
      FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- 8. ANALYTICS HELPER VIEW
-- Convenience view that joins bookings with the partner who owns the haven.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW partner_bookings_view AS
SELECT
  b.id                    AS booking_uuid,
  b.booking_id            AS booking_code,
  h.uuid_id               AS haven_id,
  h.haven_name            AS haven_name,
  h.partner_id            AS partner_id,
  b.check_in_date,
  b.check_out_date,
  (b.check_out_date - b.check_in_date) AS nights,
  b.status,
  b.adults,
  b.children,
  b.infants,
  b.created_at
FROM booking b
JOIN havens h ON h.haven_name = b.room_name
WHERE h.partner_id IS NOT NULL;

COMMENT ON VIEW partner_bookings_view IS
  'Bookings on partner-owned havens, with partner_id and computed nights.';


-- =====================================================================
-- DONE. To verify, run:
--   SELECT COUNT(*) FROM partner_payouts;
--   SELECT COUNT(*) FROM partner_message_threads;
--   SELECT COUNT(*) FROM partner_notifications;
--   \d+ havens  -- should show partner_id column
-- =====================================================================
