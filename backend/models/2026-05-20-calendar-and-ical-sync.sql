-- 2026-05-20 — Calendar Module + iCal Sync
-- Extends blocked_dates so it can hold manual blocks, maintenance, AND iCal-imported
-- bookings from external platforms (Airbnb / Booking.com). Adds haven_ical_feeds for
-- per-haven external calendar feed configuration. Adds booking_source to booking
-- so we can show "Booked via Airbnb / Staycation / Booking.com" in the UI.

BEGIN;

-- =========================================================================
-- 1) Extend blocked_dates
-- =========================================================================
ALTER TABLE blocked_dates
  ADD COLUMN IF NOT EXISTS block_type        TEXT NOT NULL DEFAULT 'manual_partner'
    CHECK (block_type IN ('manual_partner','manual_admin','maintenance','imported_external')),
  ADD COLUMN IF NOT EXISTS blocked_by_role   TEXT,
  ADD COLUMN IF NOT EXISTS blocked_by_id     UUID,
  ADD COLUMN IF NOT EXISTS external_source   TEXT,           -- 'airbnb' | 'booking.com' | 'agoda' | etc.
  ADD COLUMN IF NOT EXISTS external_uid      TEXT,           -- the iCal VEVENT UID
  ADD COLUMN IF NOT EXISTS external_summary  TEXT,           -- the iCal SUMMARY (e.g. "Reserved")
  ADD COLUMN IF NOT EXISTS synced_at         TIMESTAMPTZ;

-- Upsert key for incremental iCal sync (re-syncing the same VEVENT should update in place)
CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_dates_external_unique
  ON blocked_dates(haven_id, external_source, external_uid)
  WHERE external_source IS NOT NULL AND external_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blocked_dates_haven_range
  ON blocked_dates(haven_id, from_date, to_date);

-- =========================================================================
-- 2) iCal feed config (one row per haven per platform)
-- =========================================================================
CREATE TABLE IF NOT EXISTS haven_ical_feeds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  haven_id        UUID NOT NULL REFERENCES havens(uuid_id) ON DELETE CASCADE,
  source          TEXT NOT NULL,                -- 'airbnb' | 'booking.com' | 'agoda' | 'other'
  label           TEXT,                          -- partner-defined nickname
  url             TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at  TIMESTAMPTZ,
  last_status     TEXT,                          -- 'ok' | 'error'
  last_error      TEXT,
  last_event_count INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(haven_id, source, url)
);

CREATE INDEX IF NOT EXISTS idx_ical_feeds_active ON haven_ical_feeds(is_active);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION trg_ical_feeds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ical_feeds_updated_at ON haven_ical_feeds;
CREATE TRIGGER ical_feeds_updated_at
  BEFORE UPDATE ON haven_ical_feeds
  FOR EACH ROW EXECUTE FUNCTION trg_ical_feeds_updated_at();

-- =========================================================================
-- 3) Booking source (so the UI can show "Booked via Airbnb / Staycation")
-- =========================================================================
ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS booking_source TEXT NOT NULL DEFAULT 'staycation';

COMMIT;

-- Verify:
--   \d blocked_dates
--   \d haven_ical_feeds
--   SELECT column_name FROM information_schema.columns WHERE table_name='booking' AND column_name='booking_source';
