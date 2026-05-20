-- 2026-05-20 — Amenity Verification System
-- Each amenity on a haven gets its own verification record so Superadmin can
-- approve/reject/request-revision per amenity, with photo/video proof per row.
-- Backfills existing `havens.amenities` JSONB → one row per TRUE amenity (status = 'pending').

BEGIN;

-- =========================================================================
-- 1) Table
-- =========================================================================
CREATE TABLE IF NOT EXISTS haven_amenity_verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  haven_id          UUID NOT NULL REFERENCES havens(uuid_id) ON DELETE CASCADE,
  amenity_key       TEXT NOT NULL,
  amenity_label     TEXT NOT NULL,
  amenity_icon_key  TEXT,
  amenity_icon_url  TEXT,
  category          TEXT NOT NULL DEFAULT 'Comfort',
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','verified','rejected','revision_requested')),
  notes             TEXT,
  reviewer_notes    TEXT,
  rejection_reason  TEXT,
  media             JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by       UUID,
  reviewed_at       TIMESTAMPTZ,
  reverify_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(haven_id, amenity_key)
);

CREATE INDEX IF NOT EXISTS idx_amenity_verifs_haven  ON haven_amenity_verifications(haven_id);
CREATE INDEX IF NOT EXISTS idx_amenity_verifs_status ON haven_amenity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_amenity_verifs_reverify ON haven_amenity_verifications(reverify_at)
  WHERE reverify_at IS NOT NULL;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION trg_amenity_verif_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS amenity_verif_updated_at ON haven_amenity_verifications;
CREATE TRIGGER amenity_verif_updated_at
  BEFORE UPDATE ON haven_amenity_verifications
  FOR EACH ROW EXECUTE FUNCTION trg_amenity_verif_updated_at();

-- =========================================================================
-- 2) Backfill — read each haven's existing amenities JSONB and create rows
-- =========================================================================
DO $$
DECLARE
  h            RECORD;
  amenity_pair RECORD;
  custom_item  JSONB;
  builtin      RECORD;
BEGIN
  -- Static label/category map mirroring the frontend AMENITIES_LIST
  FOR h IN SELECT uuid_id, amenities FROM havens WHERE amenities IS NOT NULL LOOP
    -- Built-in toggles (everything except the _custom array)
    FOR amenity_pair IN
      SELECT key, value::text::boolean AS enabled
      FROM jsonb_each(h.amenities)
      WHERE key <> '_custom'
        AND jsonb_typeof(value) = 'boolean'
    LOOP
      IF amenity_pair.enabled IS TRUE THEN
        -- Look up label + category from the static map
        SELECT label, category INTO builtin FROM (
          VALUES
            ('wifi',            'WiFi',              'Essential'),
            ('airConditioning', 'Air conditioning',  'Essential'),
            ('poolAccess',      'Pool access',       'Luxury'),
            ('netflix',         'Netflix',           'Essential'),
            ('kitchen',         'Kitchen',           'Essential'),
            ('parking',         'Parking',           'Essential'),
            ('ps4',             'PS4',               'Luxury'),
            ('balcony',         'Balcony',           'Comfort'),
            ('washerDryer',     'Washer/Dryer',      'Comfort'),
            ('glowBed',         'Glow Bed',          'Luxury'),
            ('tv',              'TV',                'Essential'),
            ('towels',          'Towels',            'Essential')
        ) AS m(key, label, category)
        WHERE m.key = amenity_pair.key;

        IF builtin IS NULL OR builtin.label IS NULL THEN
          -- Custom amenity (toggle exists but no static label) — handled below
          CONTINUE;
        END IF;

        INSERT INTO haven_amenity_verifications
          (haven_id, amenity_key, amenity_label, category, status)
        VALUES
          (h.uuid_id, amenity_pair.key, builtin.label, builtin.category, 'pending')
        ON CONFLICT (haven_id, amenity_key) DO NOTHING;
      END IF;
    END LOOP;

    -- Custom amenities from _custom array
    IF jsonb_typeof(h.amenities->'_custom') = 'array' THEN
      FOR custom_item IN SELECT * FROM jsonb_array_elements(h.amenities->'_custom') LOOP
        -- Only insert if the toggle is also true
        IF (h.amenities->>(custom_item->>'id'))::boolean IS TRUE THEN
          INSERT INTO haven_amenity_verifications
            (haven_id, amenity_key, amenity_label, amenity_icon_key, amenity_icon_url, category, status)
          VALUES (
            h.uuid_id,
            custom_item->>'id',
            COALESCE(custom_item->>'label', 'Custom amenity'),
            custom_item->>'iconKey',
            custom_item->>'iconUrl',
            COALESCE(custom_item->>'category', 'Custom'),
            'pending'
          )
          ON CONFLICT (haven_id, amenity_key) DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- Verify after running:
--   SELECT haven_id, amenity_key, amenity_label, status FROM haven_amenity_verifications LIMIT 20;
--   SELECT status, COUNT(*) FROM haven_amenity_verifications GROUP BY status;
