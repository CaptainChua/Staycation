-- 2026-05-21 — Platform documents: add slot_key for predefined slots.
--
-- The Docs & Analytics tab on Partner Management has three hardcoded rows
-- (Partnership agreement template / Platform guidelines / Commission policy).
-- The owner attaches ONE file per row. We pin those files to fixed slot keys
-- so we can find/replace/remove them without UUID juggling.
--
-- NULL slot_key = ad-hoc upload (the earlier free-form gallery still works
-- for any other documents that aren't a "predefined slot").

BEGIN;

ALTER TABLE platform_documents
  ADD COLUMN IF NOT EXISTS slot_key TEXT;

-- Partial unique index: at most one file per slot, but unlimited NULL rows
-- so ad-hoc uploads aren't restricted.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_platform_documents_slot_key
  ON platform_documents(slot_key)
  WHERE slot_key IS NOT NULL;

COMMIT;

-- Verify:
--   \d platform_documents
--   SELECT slot_key, label FROM platform_documents ORDER BY slot_key;
