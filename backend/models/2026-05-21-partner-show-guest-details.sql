-- 2026-05-21 — Per-partner toggle: show guest details to the partner.
--
-- When true (default), the partner sees guest first/last name on their own
-- bookings in the Analytics > Booking details card. When the platform owner
-- flips this to false on a specific partner, the booking row still appears
-- but the guest name is hidden. The partner cannot change this themselves.

BEGIN;

ALTER TABLE partners_information
  ADD COLUMN IF NOT EXISTS show_guest_details BOOLEAN NOT NULL DEFAULT true;

COMMIT;

-- Verify:
--   \d partners_information
--   SELECT partner_id, show_guest_details FROM partners_information LIMIT 5;
