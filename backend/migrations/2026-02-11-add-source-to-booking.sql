-- Migration: Add `source` column to booking table
-- Adds optional `source` column with default 'online_checkout'
-- Run this on your PostgreSQL database (test/staging first)

BEGIN;

ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'online_checkout';

COMMIT;

-- Optional: verify
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'booking' AND column_name = 'source';
