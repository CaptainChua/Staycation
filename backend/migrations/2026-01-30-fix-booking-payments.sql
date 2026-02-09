-- Staycation/backend/migrations/2026-01-30-fix-booking-payments.sql
-- Migration: Move remaining_balance derivation to use `amount_paid` instead of `down_payment`
-- Add `amount_paid` column (if missing), backfill from existing data, and replace the legacy check
-- constraint that ties remaining_balance to down_payment with one that ties it to amount_paid.
--
-- IMPORTANT:
--  - BACKUP your database before running this migration.
--  - Test on a staging copy first. If any rows violate the final constraints,
--    inspect them manually before proceeding.
--  - This script is written for PostgreSQL.

-- Preview any rows that would *currently* be inconsistent w.r.t. the new model.
-- (This helps you examine problematic rows before changing anything.)
SELECT id, booking_id, total_amount, down_payment, amount_paid, remaining_balance
FROM booking_payments
WHERE remaining_balance != total_amount - COALESCE(amount_paid, down_payment)
   OR down_payment > total_amount;

-- If the above returns rows you should inspect and decide how to handle them,
-- then proceed with the migration below when ready.

BEGIN;

-- 1) Add amount_paid column (idempotent).
ALTER TABLE booking_payments
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2);

-- 2) Backfill amount_paid for existing rows.
-- Prefer using an explicit amount_paid if present; otherwise compute it from
-- the currently stored remaining_balance (preferred) or fallback to down_payment.
UPDATE booking_payments
SET amount_paid = COALESCE(amount_paid, total_amount - remaining_balance, down_payment)
WHERE amount_paid IS NULL;

-- 3) Make stored remaining_balance consistent with the new canonical formula:
-- remaining_balance = total_amount - amount_paid
-- (This will fix rows that may be inconsistent due to past behavior.)
UPDATE booking_payments
SET remaining_balance = total_amount - amount_paid
WHERE remaining_balance IS DISTINCT FROM total_amount - amount_paid;

-- 4) Remove legacy constraint (names may differ between environments). The
-- error you saw references `booking_payments_check1`; drop that if present.
ALTER TABLE booking_payments DROP CONSTRAINT IF EXISTS booking_payments_check1;
ALTER TABLE booking_payments DROP CONSTRAINT IF EXISTS booking_payments_remaining_check;

-- 5) Add new constraints based on amount_paid:
--    - amount_paid must not exceed total_amount
--    - remaining_balance must equal total_amount - amount_paid
ALTER TABLE booking_payments
  ADD CONSTRAINT booking_payments_amount_paid_check CHECK (amount_paid <= total_amount);

ALTER TABLE booking_payments
  ADD CONSTRAINT booking_payments_remaining_check CHECK (remaining_balance = total_amount - amount_paid);

COMMIT;

-- Verification: there should be zero violations after the migration
SELECT
  (SELECT COUNT(*) FROM booking_payments WHERE remaining_balance != total_amount - amount_paid) AS remaining_mismatch,
  (SELECT COUNT(*) FROM booking_payments WHERE amount_paid > total_amount) AS overpaid_count;

-- NOTES / ROLLBACK
-- - If you need to undo: restore from your DB backup (recommended).
-- - Alternatively, you can DROP the newly added constraints, revert any amount_paid
--   back to NULL for rows where you copied it, etc. But the safest, quickest
--   rollback is a snapshot restore.

-- After running:
--  - Restart the application server.
--  - Re-test the payment approve flow: approving/collecting should now update
--    `amount_paid` and `remaining_balance`, and `down_payment` will remain the
--    originally submitted down payment (as intended).
--  - Once confirmed, you can safely remove any temporary compatibility code
--    that updates `down_payment` during approve operations (if you added one).
