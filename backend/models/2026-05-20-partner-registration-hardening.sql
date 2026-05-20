-- 2026-05-20 — Partner Registration Hardening
-- Extends partners_account + partners_information so the full Airbnb-style partner
-- onboarding flow is captured: business info, valid ID upload, signed contract upload,
-- payout details (GCash/Maya/Bank), tax info, and an approval audit trail.
--
-- Status workflow:
--   pending      → freshly registered, can log in but cannot list properties
--   active       → admin-approved, can list and earn (spec calls this "approved")
--   suspended    → temporarily blocked
--   rejected     → application denied (with reason)
--   inactive     → soft-deleted / account closed

BEGIN;

-- =========================================================================
-- 1) Widen partners_account.status to include 'rejected'
-- =========================================================================
ALTER TABLE partners_account
  DROP CONSTRAINT IF EXISTS partners_account_status_check;

ALTER TABLE partners_account
  ADD CONSTRAINT partners_account_status_check
  CHECK (status IN ('pending', 'active', 'suspended', 'inactive', 'rejected'));

-- Approval audit fields on the account
ALTER TABLE partners_account
  ADD COLUMN IF NOT EXISTS approved_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by        UUID,
  ADD COLUMN IF NOT EXISTS rejected_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by        UUID,
  ADD COLUMN IF NOT EXISTS rejection_reason   TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason  TEXT;

-- =========================================================================
-- 2) Extend partners_information with onboarding fields
-- =========================================================================
ALTER TABLE partners_information
  -- Business / identity
  ADD COLUMN IF NOT EXISTS business_name         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS valid_id_url          TEXT,
  ADD COLUMN IF NOT EXISTS valid_id_public_id    TEXT,
  ADD COLUMN IF NOT EXISTS valid_id_type         VARCHAR(50),    -- 'passport' | 'driver_license' | 'national_id' | 'umid' | 'philhealth' | 'sss' | etc.
  ADD COLUMN IF NOT EXISTS contract_url          TEXT,
  ADD COLUMN IF NOT EXISTS contract_public_id    TEXT,
  ADD COLUMN IF NOT EXISTS contract_signed_at    TIMESTAMPTZ,

  -- Payout details (mirrors and extends the prior revenue-share migration)
  ADD COLUMN IF NOT EXISTS gcash_number          VARCHAR(50),
  ADD COLUMN IF NOT EXISTS gcash_holder_name     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS maya_number           VARCHAR(50),
  ADD COLUMN IF NOT EXISTS maya_holder_name      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_name             VARCHAR(120),
  ADD COLUMN IF NOT EXISTS bank_account_name     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_account_number   VARCHAR(60),

  -- Tax info (optional per spec)
  ADD COLUMN IF NOT EXISTS tax_id                VARCHAR(60),    -- TIN / VAT ID
  ADD COLUMN IF NOT EXISTS tax_registered_name   VARCHAR(255),

  -- Registration completion checklist (denormalized for fast partner-side UI)
  ADD COLUMN IF NOT EXISTS docs_submitted_at     TIMESTAMPTZ;

-- =========================================================================
-- 3) Helpful index for the admin "pending approval" queue
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_partners_account_status ON partners_account(status);

COMMIT;

-- Verify after running:
--   \d partners_account
--   \d partners_information
--   SELECT status, COUNT(*) FROM partners_account GROUP BY status;
