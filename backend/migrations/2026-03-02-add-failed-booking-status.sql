-- Staycation/backend/migrations/2026-03-02-add-failed-booking-status.sql
-- Migration: allow booking.status = 'failed' for edit/update flows.
--
-- IMPORTANT:
--  - BACKUP your database before running this migration.
--  - Run in staging first.
--  - This script is idempotent for environments with varying constraint names.

BEGIN;

-- Drop existing booking status check constraint(s) regardless of generated name.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'booking'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
      AND pg_get_constraintdef(oid) ILIKE '%pending%'
      AND pg_get_constraintdef(oid) ILIKE '%approved%'
  LOOP
    EXECUTE format('ALTER TABLE booking DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END
$$;

ALTER TABLE booking
  ADD CONSTRAINT booking_status_check
  CHECK (
    status IN (
      'pending',
      'approved',
      'rejected',
      'confirmed',
      'checked-in',
      'completed',
      'cancelled',
      'failed'
    )
  );

COMMIT;

-- Verify constraint now allows failed.
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'booking'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) ILIKE '%status%';
