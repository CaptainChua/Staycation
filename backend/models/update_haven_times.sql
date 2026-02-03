-- Add check-out time columns to havens table
ALTER TABLE havens 
ADD COLUMN IF NOT EXISTS six_hour_check_out TIME DEFAULT '15:00:00',
ADD COLUMN IF NOT EXISTS ten_hour_check_out TIME DEFAULT '19:00:00',
ADD COLUMN IF NOT EXISTS twenty_one_hour_check_out TIME DEFAULT '11:00:00';
