-- Staycation/backend/migrations/2026-01-30-set-downpayment-500.sql
-- Migration: set down_payment to 500 (or total_amount when total < 500), set amount_paid
-- equal to down_payment, recompute remaining_balance = total_amount - amount_paid,
-- and set payment_status to 'pending' for all booking_payments.
--
-- IMPORTANT:
--  - BACKUP your database before running this migration.
--  - This migration is intentionally idempotent: running it multiple times has no
--    additional side effects beyond the first run.
--  - This WILL overwrite existing `down_payment` and `amount_paid` values and
--    set `remaining_balance` and `payment_status` accordingly, per your request.
--
-- Preview how many rows would be affected:
SELECT
  COUNT(*) AS total_rows,
  SUM(CASE WHEN down_payment <> LEAST(500::numeric, total_amount) THEN 1 ELSE 0 END) AS downpayment_mismatches,
  SUM(CASE WHEN amount_paid <> LEAST(500::numeric, total_amount) THEN 1 ELSE 0 END) AS amount_paid_mismatches,
  SUM(CASE WHEN remaining_balance <> total_amount - LEAST(500::numeric, total_amount) THEN 1 ELSE 0 END) AS remaining_mismatches,
  SUM(CASE WHEN payment_status <> 'pending' THEN 1 ELSE 0 END) AS status_mismatches
FROM booking_payments;

-- Perform the safe, idempotent update:
BEGIN;

UPDATE booking_payments
SET
  down_payment = LEAST(500::numeric, total_amount),
  amount_paid = LEAST(500::numeric, total_amount),
  remaining_balance = total_amount - LEAST(500::numeric, total_amount),
  payment_status = 'pending'
WHERE
  down_payment IS DISTINCT FROM LEAST(500::numeric, total_amount)
  OR amount_paid IS DISTINCT FROM LEAST(500::numeric, total_amount)
  OR remaining_balance IS DISTINCT FROM (total_amount - LEAST(500::numeric, total_amount))
  OR payment_status IS DISTINCT FROM 'pending';

COMMIT;

-- Verify the update:
SELECT
  COUNT(*) AS total_rows,
  SUM(CASE WHEN down_payment = LEAST(500::numeric, total_amount) AND
                amount_paid = LEAST(500::numeric, total_amount) AND
                remaining_balance = total_amount - LEAST(500::numeric, total_amount) AND
                payment_status = 'pending' THEN 1 ELSE 0 END) AS rows_matching_expected
FROM booking_payments;

-- (Optional) Quick spot-check of a few sample rows (remove LIMIT for full listing):
SELECT id, booking_id, total_amount, down_payment, amount_paid, remaining_balance, payment_status
FROM booking_payments
ORDER BY created_at DESC
LIMIT 20;
