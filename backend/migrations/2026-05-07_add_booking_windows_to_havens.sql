-- Add booking_windows JSONB column to store multiple time windows per booking type
ALTER TABLE havens
ADD COLUMN IF NOT EXISTS booking_windows JSONB DEFAULT '{
  "six_hour": [],
  "ten_hour": [],
  "twenty_one_hour": []
}'::jsonb;
