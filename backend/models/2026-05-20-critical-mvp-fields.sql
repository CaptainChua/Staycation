-- 2026-05-20 — Critical MVP gap fields: bathrooms, per-unit cleaning fee, disabled status
--
-- 1) bathrooms — spec lists "Number of Bathrooms" as required for unit details
-- 2) cleaning_fee — per-unit guest-facing cleaning fee (separate from cleaning_fee_share_pct
--                   which is the commission split). This is the ₱ amount guests pay.
-- 3) listing_status — partner-level enable/disable + admin-level suspend, so Superadmin
--                     can take a listing public-down without rejecting it outright.
--                     Pre-existing property_approval handles approve/reject; this is the
--                     "Disable" / "Suspend Listing" override the spec lists separately.

BEGIN;

ALTER TABLE havens
  ADD COLUMN IF NOT EXISTS bathrooms          INTEGER,
  ADD COLUMN IF NOT EXISTS cleaning_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS property_type      TEXT,        -- per-unit type (condo/house/villa/loft/etc.)
  ADD COLUMN IF NOT EXISTS listing_status     TEXT NOT NULL DEFAULT 'active'
    CHECK (listing_status IN ('active', 'disabled', 'suspended')),
  ADD COLUMN IF NOT EXISTS listing_status_reason  TEXT,
  ADD COLUMN IF NOT EXISTS listing_status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS listing_status_changed_by UUID;

CREATE INDEX IF NOT EXISTS idx_havens_listing_status ON havens(listing_status);

COMMIT;

-- Verify:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='havens' AND column_name IN
--      ('bathrooms','cleaning_fee','property_type','listing_status');
