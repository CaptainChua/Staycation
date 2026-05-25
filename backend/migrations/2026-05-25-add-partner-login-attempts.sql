-- 2026-05-25 — Add brute-force lockout counter to partners_account.
-- Mirrors the `login_attempts` column already on `employees`. Used by the
-- partner branch of lib/auth.ts to lock the account after 3 failed password
-- attempts and require an OTP unlock (same ACCOUNT_LOCK flow as employees).

ALTER TABLE partners_account
  ADD COLUMN IF NOT EXISTS login_attempts INT NOT NULL DEFAULT 0;

-- Verify:
--   SELECT column_name, data_type, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'partners_account' AND column_name = 'login_attempts';
