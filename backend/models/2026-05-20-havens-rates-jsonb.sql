-- 2026-05-20 — Add flexible rates JSONB column to havens
-- Each rate: { "label": "6 Hours", "hours": 6, "price": 1500 }
-- Partners can now define any number of custom rate types per haven.
-- Existing six/ten/weekday/weekend rate columns are kept for backward compatibility
-- and backfilled into the new rates array.

BEGIN;

-- 1) Add the JSONB column (default to empty array so existing reads don't NPE)
ALTER TABLE havens
  ADD COLUMN IF NOT EXISTS rates JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2) Backfill from existing fixed columns — only positive rates get an entry
UPDATE havens
SET rates = COALESCE(
  (
    SELECT jsonb_agg(r ORDER BY pos)
    FROM (
      SELECT 1 AS pos, jsonb_build_object(
        'label', '6 Hours', 'hours', 6, 'price', six_hour_rate
      ) AS r
      WHERE six_hour_rate IS NOT NULL AND six_hour_rate > 0
      UNION ALL
      SELECT 2, jsonb_build_object(
        'label', '10 Hours', 'hours', 10, 'price', ten_hour_rate
      )
      WHERE ten_hour_rate IS NOT NULL AND ten_hour_rate > 0
      UNION ALL
      SELECT 3, jsonb_build_object(
        'label', 'Weekday (21 Hours)', 'hours', 21, 'price', weekday_rate
      )
      WHERE weekday_rate IS NOT NULL AND weekday_rate > 0
      UNION ALL
      SELECT 4, jsonb_build_object(
        'label', 'Weekend (21 Hours)', 'hours', 21, 'price', weekend_rate
      )
      WHERE weekend_rate IS NOT NULL AND weekend_rate > 0
    ) sub
  ),
  '[]'::jsonb
)
WHERE rates = '[]'::jsonb;  -- only backfill rows that haven't been migrated yet

-- 3) Helpful index for querying rates (optional but cheap)
CREATE INDEX IF NOT EXISTS idx_havens_rates_gin ON havens USING gin (rates);

COMMIT;

-- After running, verify:
--   SELECT haven_name, rates FROM havens LIMIT 5;
