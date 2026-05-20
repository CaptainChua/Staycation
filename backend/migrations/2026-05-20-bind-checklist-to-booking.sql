-- Bind cleaning checklists to specific bookings so each (haven + booking) pair
-- gets its own isolated checklist, tasks, and photos.

-- Fix FK: the original constraint incorrectly pointed to the 'bookings' table.
-- The cleaner system uses the 'booking' table (matching booking_cleaning's FK).
ALTER TABLE cleaning_checklists DROP CONSTRAINT IF EXISTS fk_cleaning_checklists_booking;
ALTER TABLE cleaning_checklists ADD CONSTRAINT fk_cleaning_checklists_booking
  FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE SET NULL;

-- Drop the old per-haven-only unique constraint that caused all bookings of
-- the same haven to share one checklist.
DROP INDEX IF EXISTS uniq_active_checklist_per_haven;

-- New: one active checklist per (haven, booking) when booking_id is present
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_checklist_per_haven_booking
  ON cleaning_checklists(haven_id, booking_id)
  WHERE status != 'completed' AND booking_id IS NOT NULL;

-- Backward compat: keep one active checklist per haven for legacy records (no booking_id)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_checklist_per_haven_legacy
  ON cleaning_checklists(haven_id)
  WHERE status != 'completed' AND booking_id IS NULL;
