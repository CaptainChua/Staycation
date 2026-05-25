-- 2026-05-25 — Database-level guard against double-bookings.
--
-- The app code in createBooking does a transactional overlap check, but at
-- READ COMMITTED two simultaneous requests for the same room+dates can both
-- pass the SELECT and both INSERT — a TOCTOU race. This constraint makes
-- Postgres itself reject the second concurrent insert.
--
-- Scope: covers the SAME-DATE case (date precision). The existing app check
-- handles the more precise time-aware case (different time slots on the same
-- date). The constraint is the safety net against races, not a replacement.
--
-- Status filter matches the app check: only `pending|approved|confirmed|
-- checked-in|on-going` block a new booking. Completed/cancelled/rejected
-- don't, so they're excluded from the constraint.
--
-- IMPORTANT — RUN ORDER:
--   1) Run the SELECT in section 1 first. If it returns any rows, you have
--      existing overlapping active bookings. Resolve them (cancel one, fix
--      the status, etc.) before running section 2. The ALTER TABLE will
--      fail noisily if you skip this step.
--   2) Then run section 2 inside a transaction.

-- =========================================================================
-- 1) PRE-FLIGHT — list existing conflicts (must be empty before proceeding)
-- =========================================================================
-- Run this manually first. If it returns rows, fix them before continuing.

SELECT
  a.id          AS a_id,
  a.booking_id  AS a_booking,
  a.status      AS a_status,
  a.check_in_date  AS a_in,
  a.check_out_date AS a_out,
  b.id          AS b_id,
  b.booking_id  AS b_booking,
  b.status      AS b_status,
  b.check_in_date  AS b_in,
  b.check_out_date AS b_out,
  a.room_name
FROM booking a
JOIN booking b
  ON a.id < b.id
  AND a.room_name = b.room_name
  AND a.status IN ('pending','approved','confirmed','checked-in','on-going')
  AND b.status IN ('pending','approved','confirmed','checked-in','on-going')
  AND daterange(a.check_in_date, a.check_out_date, '[)')
      && daterange(b.check_in_date, b.check_out_date, '[)')
ORDER BY a.room_name, a.check_in_date;

-- =========================================================================
-- 2) Add the constraint (only after section 1 returns 0 rows)
-- =========================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- The actual safety net. EXCLUDE USING gist with btree_gist lets us combine
-- equality on room_name with range overlap on the booking dates.
ALTER TABLE booking
  ADD CONSTRAINT booking_no_double_book_active
  EXCLUDE USING gist (
    room_name WITH =,
    daterange(check_in_date, check_out_date, '[)') WITH &&
  )
  WHERE (status IN ('pending','approved','confirmed','checked-in','on-going'));

COMMIT;

-- Verify:
--   \d booking
--   -- should show the booking_no_double_book_active constraint
--   --
--   -- Try inserting a conflicting row (should fail with conflicting key value):
--   --   INSERT INTO booking (booking_id, room_name, check_in_date, check_out_date,
--   --     check_in_time, check_out_time, adults, status)
--   --   VALUES ('TEST-DUP-001', '<some-existing-room>', '<existing-date>',
--   --     '<existing-date+1>', '08:00', '17:00', 1, 'pending');

-- =========================================================================
-- ROLLBACK (if needed)
-- =========================================================================
-- ALTER TABLE booking DROP CONSTRAINT IF EXISTS booking_no_double_book_active;
-- DROP EXTENSION IF EXISTS btree_gist;  -- only if nothing else uses it
