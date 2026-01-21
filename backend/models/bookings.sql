-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID, -- NULL for guest bookings, UUID for logged-in users
  guest_first_name VARCHAR(100) NOT NULL,
  guest_last_name VARCHAR(100) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20) NOT NULL,
  room_name VARCHAR(255),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  check_in_time TIME NOT NULL,
  check_out_time TIME NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  facebook_link TEXT,
  payment_method VARCHAR(50) NOT NULL,
  payment_proof_url TEXT,
  room_rate DECIMAL(10, 2) NOT NULL,
  security_deposit DECIMAL(10, 2) DEFAULT 0,
  add_ons_total DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  down_payment DECIMAL(10, 2) NOT NULL,
  remaining_balance DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'confirmed', 'checked-in', 'completed', 'cancelled')),
  rejection_reason TEXT,
  add_ons JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Create index on guest_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON bookings(guest_email);

-- Create index on user_id for transaction history queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
