-- 2026-05-21 — Per-haven commission override.
--
-- Adds an optional commission_rate on havens so the platform owner can set a
-- per-room rate that overrides the partner's default (partners.commission_rate).
-- NULL means "fall back to the partner's default rate", so existing rooms keep
-- behaving exactly as before.

BEGIN;

ALTER TABLE havens
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2)
    CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100));

COMMIT;

-- Verify:
--   \d havens
--   SELECT haven_name, commission_rate FROM havens LIMIT 5;
