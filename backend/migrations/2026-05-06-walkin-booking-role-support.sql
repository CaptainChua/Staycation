BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'employee_role'
  ) THEN
    BEGIN
      ALTER TYPE employee_role ADD VALUE IF NOT EXISTS 'WalkInStaff';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) NOT NULL DEFAULT 'online'
  CHECK (booking_type IN ('online', 'walk_in'));

ALTER TABLE booking_payments
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_booking_booking_type
  ON booking (booking_type);

COMMIT;
