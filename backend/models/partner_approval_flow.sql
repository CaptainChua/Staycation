-- =====================================================================
-- PARTNER HAVEN APPROVAL FLOW
-- Run this in Neon SQL Editor after partners_full_backend.sql.
--
-- Adds the approval workflow for partner-submitted havens:
--   1. Ensures property_approval table exists
--   2. Adds reviewer columns (reviewer notes, who acted)
--   3. Trigger: when a partner haven is inserted, auto-create
--      property_approval row with status='pending'
--   4. Owner havens (partner_id IS NULL) auto-approve
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. ENSURE property_approval TABLE EXISTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_approval (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  haven_id UUID NOT NULL UNIQUE REFERENCES havens(uuid_id) ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'blocked', 'rejected')),

  reason TEXT,
  reviewer_notes TEXT,

  approved_at TIMESTAMPTZ,
  approved_by UUID,              -- employee id who approved/rejected

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_approval_status ON property_approval(status);
CREATE INDEX IF NOT EXISTS idx_property_approval_haven_id ON property_approval(haven_id);


-- ---------------------------------------------------------------------
-- 2. AUTO-CREATE APPROVAL ROW WHEN A HAVEN IS CREATED
-- Partner-submitted -> status='pending'
-- Owner-submitted   -> status='approved'
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_auto_create_haven_approval()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO property_approval (haven_id, status, approved_at)
  VALUES (
    NEW.uuid_id,
    CASE WHEN NEW.partner_id IS NULL THEN 'approved' ELSE 'pending' END,
    CASE WHEN NEW.partner_id IS NULL THEN NOW() ELSE NULL END
  )
  ON CONFLICT (haven_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_haven_approval ON havens;
CREATE TRIGGER auto_create_haven_approval
  AFTER INSERT ON havens
  FOR EACH ROW EXECUTE FUNCTION trg_auto_create_haven_approval();


-- ---------------------------------------------------------------------
-- 3. BACKFILL: any existing haven without an approval row gets one
-- (owner havens auto-approved, partner havens marked pending)
-- ---------------------------------------------------------------------
INSERT INTO property_approval (haven_id, status, approved_at)
SELECT
  h.uuid_id,
  CASE WHEN h.partner_id IS NULL THEN 'approved' ELSE 'pending' END,
  CASE WHEN h.partner_id IS NULL THEN NOW() ELSE NULL END
FROM havens h
LEFT JOIN property_approval pa ON pa.haven_id = h.uuid_id
WHERE pa.id IS NULL;


-- ---------------------------------------------------------------------
-- 4. updated_at trigger
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_property_approval') THEN
    CREATE TRIGGER set_updated_at_property_approval
      BEFORE UPDATE ON property_approval
      FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
  END IF;
END $$;


-- =====================================================================
-- DONE. To verify:
--   SELECT status, COUNT(*) FROM property_approval GROUP BY status;
--   -- Should show 'approved' (owner havens) and 'pending' (partner havens)
-- =====================================================================
