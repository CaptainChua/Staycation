-- 2026-05-21 — Per-booking guest-detail visibility override.
--
-- Until now the partner-level `partners_information.show_guest_details` flag
-- gated ALL of a partner's bookings. The owner asked for per-booking control,
-- so each booking row now gets an optional override:
--   NULL  → inherit partner-level default (existing behaviour)
--   true  → force show guest name on this booking
--   false → force hide guest name on this booking

BEGIN;

ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS show_guest_details_override BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_booking_show_guest_details_override
  ON booking(show_guest_details_override)
  WHERE show_guest_details_override IS NOT NULL;

COMMIT;

-- Verify:
--   \d booking
--   SELECT id, booking_id, show_guest_details_override FROM booking LIMIT 5;
