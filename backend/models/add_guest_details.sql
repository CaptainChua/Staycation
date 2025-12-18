-- Add new columns for main guest details and additional guests
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS guest_age INTEGER,
ADD COLUMN IF NOT EXISTS guest_gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS valid_id_url TEXT,
ADD COLUMN IF NOT EXISTS additional_guests JSONB;

-- Add comment for documentation
COMMENT ON COLUMN bookings.guest_age IS 'Age of the main guest';
COMMENT ON COLUMN bookings.guest_gender IS 'Gender of the main guest (male, female, other)';
COMMENT ON COLUMN bookings.valid_id_url IS 'Cloudinary URL of the main guest valid ID (required if 10+ years old)';
COMMENT ON COLUMN bookings.additional_guests IS 'JSON array of additional guest details including firstName, lastName, age, gender, and validIdUrl';
