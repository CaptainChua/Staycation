-- 2026-05-21 — Platform-wide documents (shared with all partners).
--
-- The Docs & Analytics tab on Partner Management used to show three hardcoded
-- placeholder rows ("Partnership agreement template", "Platform guidelines",
-- etc.) with no upload functionality. This table backs a real gallery so the
-- Owner can publish actual files (PDFs, policy docs, contract templates)
-- and partners can download them from their own dashboards.

BEGIN;

CREATE TABLE IF NOT EXISTS platform_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label           TEXT NOT NULL,           -- e.g. "Partnership agreement v2.1"
  description     TEXT,                    -- optional short description
  file_url        TEXT NOT NULL,
  cloudinary_public_id TEXT,
  mime_type       TEXT,
  file_size_bytes INTEGER,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_documents_uploaded_at
  ON platform_documents(uploaded_at DESC);

COMMIT;

-- Verify:
--   \d platform_documents
--   SELECT label, uploaded_at FROM platform_documents LIMIT 5;
