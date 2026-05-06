-- Staycation migration: add image_data support to messages
-- File: 2026-05-05_add_image_data_to_messages.sql
--
-- Purpose:
-- 1) Add the optional image_data column to the messages table so image-only
--    messages can be stored.
-- 2) Preserve the existing message_text column for text messages.

BEGIN;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_data TEXT;

COMMIT;

-- Notes:
-- - Run this migration against your PostgreSQL database.
-- - If you already have a migration runner, include this SQL in your pipeline.
-- - After applying this migration, image attachments can be saved with messages.
