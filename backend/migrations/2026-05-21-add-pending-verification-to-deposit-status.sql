-- Add 'pending_verification' to the booking_security_deposits deposit_status CHECK constraint.
-- The cleaner payment collection flow sets this status when source='cleaner', but it was
-- missing from the original constraint, causing all cleaner deposit submissions to fail.

ALTER TABLE booking_security_deposits
  DROP CONSTRAINT IF EXISTS booking_security_deposits_deposit_status_check;

ALTER TABLE booking_security_deposits
  ADD CONSTRAINT booking_security_deposits_deposit_status_check
  CHECK (deposit_status IN (
    'pending',
    'held',
    'pending_verification',
    'returned',
    'partial',
    'forfeited'
  ));
