-- Migration: Add 'on-going' to booking status check constraint
-- Run this on your PostgreSQL database to allow 'on-going' as a valid booking status.

BEGIN;

-- Drop the existing check constraint
ALTER TABLE booking DROP CONSTRAINT IF EXISTS booking_status_check;

-- Re-add it with 'on-going' included
ALTER TABLE booking
  ADD CONSTRAINT booking_status_check
  CHECK (status IN (
    'pending',
    'on-going',
    'approved',
    'rejected',
    'checked-in',
    'checked-out',
    'cancelled',
    'completed'
  ));

COMMIT;
