-- 2026-05-21 — Add-on categories (formerly "rentable items").
--
-- Per-haven add-ons used to be a flat list (haven_rentable_items). The owner
-- now groups them under categories: "Add Category" → "Add Items inside it".
--
-- We KEEP the legacy haven_rentable_items table name to avoid breaking the
-- booking flow and PDF generators that already reference it — we just rename
-- it conceptually to "add-on items" in the UI/copy, and tag each item with
-- an optional category_id.

BEGIN;

CREATE TABLE IF NOT EXISTS haven_addon_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  haven_id    UUID NOT NULL REFERENCES havens(uuid_id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,
  icon        VARCHAR(20) DEFAULT '📦',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_haven_addon_categories_haven_id
  ON haven_addon_categories(haven_id);
CREATE INDEX IF NOT EXISTS idx_haven_addon_categories_sort
  ON haven_addon_categories(haven_id, sort_order);

-- Items now belong to a category (nullable so existing rows still load —
-- "uncategorized" items show up under an implicit "Other" bucket on the UI).
ALTER TABLE haven_rentable_items
  ADD COLUMN IF NOT EXISTS category_id UUID
  REFERENCES haven_addon_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_haven_rentable_items_category_id
  ON haven_rentable_items(category_id);

COMMIT;

-- Verify:
--   \d haven_addon_categories
--   \d haven_rentable_items
--   SELECT haven_id, name, icon FROM haven_addon_categories LIMIT 5;
