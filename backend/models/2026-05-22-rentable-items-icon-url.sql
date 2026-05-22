-- 2026-05-22 — Per-haven rentable items can carry an uploaded icon.
--
-- The existing `icon` column (VARCHAR(20)) holds either an iconKey ("playstation",
-- "pool", …) or a legacy emoji. To support partner-uploaded icons (rendered as
-- <img>), we need a separate TEXT column for the data URL since VARCHAR(20)
-- is far too small for a base64-encoded image.
--
-- Render precedence in the UI: icon_url (uploaded) > icon (key/emoji).

BEGIN;

ALTER TABLE haven_rentable_items
  ADD COLUMN IF NOT EXISTS icon_url TEXT;

COMMIT;

-- Verify:
--   \d haven_rentable_items
--   SELECT id, name, icon, length(icon_url) FROM haven_rentable_items LIMIT 5;
