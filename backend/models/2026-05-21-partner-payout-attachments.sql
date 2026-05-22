-- 2026-05-21 — Multi-file evidence attachments for partner payouts.
--
-- partner_payouts already has a single proof_of_payment_url column (kept for
-- back-compat with existing rows + the legacy upload UI). This table backs a
-- multi-file gallery so the Owner can attach as many receipts / bank
-- screenshots / GCash confirmations as a payout needs, and the Partner can
-- view them from the Cost Breakdown's Payout history card.

BEGIN;

CREATE TABLE IF NOT EXISTS partner_payout_attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id       UUID NOT NULL REFERENCES partner_payouts(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  cloudinary_public_id TEXT,
  mime_type       TEXT,
  file_size_bytes INTEGER,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_payout_attachments_payout_id
  ON partner_payout_attachments(payout_id);
CREATE INDEX IF NOT EXISTS idx_partner_payout_attachments_uploaded_at
  ON partner_payout_attachments(uploaded_at DESC);

COMMIT;

-- Verify:
--   \d partner_payout_attachments
--   SELECT payout_id, label, uploaded_at FROM partner_payout_attachments LIMIT 5;
