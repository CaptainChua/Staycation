-- 2026-05-21 — Partner documents (multi-file gallery).
--
-- Stores any number of labeled documents a partner submits during onboarding
-- (IDs, permits, BIR, bank certificates, etc.) and any additional files the
-- Owner uploads on the partner's behalf later. Files live in Cloudinary;
-- we keep the URL + public_id so we can delete remotely on row removal.

BEGIN;

CREATE TABLE IF NOT EXISTS partner_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID NOT NULL REFERENCES partners_account(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,             -- partner-supplied label, e.g. "Mayor's Permit"
  file_url        TEXT NOT NULL,
  cloudinary_public_id TEXT,                 -- for cleanup
  mime_type       TEXT,
  file_size_bytes INTEGER,
  uploaded_by     TEXT NOT NULL DEFAULT 'partner'
                   CHECK (uploaded_by IN ('partner', 'owner')),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_documents_partner_id
  ON partner_documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_documents_uploaded_at
  ON partner_documents(uploaded_at DESC);

COMMIT;

-- Verify:
--   \d partner_documents
--   SELECT partner_id, label, uploaded_by, uploaded_at FROM partner_documents LIMIT 5;
