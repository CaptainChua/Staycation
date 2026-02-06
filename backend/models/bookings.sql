CREATE TABLE booking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(50) UNIQUE NOT NULL,

  user_id UUID NULL, -- NULL for guest bookings
  room_name VARCHAR(255) NOT NULL,

  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  check_in_time TIME NOT NULL,
  check_out_time TIME NOT NULL,

  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'approved',
      'rejected',
      'confirmed',
      'checked-in',
      'completed',
      'cancelled'
    )),

  rejection_reason TEXT,

  has_security_deposit BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking guests table
CREATE TABLE booking_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL
    REFERENCES booking(id) ON DELETE CASCADE,

  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,

  facebook_link TEXT,
  valid_id_url VARCHAR(255)
);

-- Booking payments table
CREATE TABLE booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL
    REFERENCES booking(id) ON DELETE CASCADE,

  payment_method VARCHAR(50) NOT NULL,
  payment_proof_url TEXT,

  room_rate DECIMAL(10,2) NOT NULL,
  add_ons_total DECIMAL(10,2) DEFAULT 0,

  total_amount DECIMAL(10,2) NOT NULL,

  down_payment DECIMAL(10,2) NOT NULL,
  remaining_balance DECIMAL(10,2) NOT NULL,

  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN (
      'pending',
      'approved',
      'rejected',
      'refunded'
    )),

  reviewed_by UUID NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  amount_paid DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (down_payment <= total_amount),
  CHECK (remaining_balance = total_amount - down_payment)
);

CREATE TABLE booking_security_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL
    REFERENCES booking(id) ON DELETE CASCADE,

  amount DECIMAL(10,2) NOT NULL,

  deposit_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (deposit_status IN (
      'pending',
      'held',
      'returned',
      'partial',
      'forfeited'
    )),

  refunded_amount DECIMAL(10,2) DEFAULT 0,
  forfeited_amount DECIMAL(10,2) DEFAULT 0,

  payment_method VARCHAR(50),
  payment_proof_url TEXT,

  processed_by UUID NULL,
  held_at TIMESTAMPTZ DEFAULT NOW(),
  returned_at TIMESTAMPTZ,

  notes TEXT
);

CREATE TABLE booking_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL
    REFERENCES booking(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'preparing',
      'delivered',
      'cancelled',
      'refunded'
    )),

  delivered_at TIMESTAMPTZ,
  handled_by UUID NULL, -- employee id
  notes TEXT
);

-- Booking cleaning table
CREATE TABLE booking_cleaning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL
    REFERENCES booking(id) ON DELETE CASCADE,

  cleaning_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (cleaning_status IN (
      'pending',
      'assigned',
      'in-progress',
      'cleaned',
      'inspected'
    )),

  assigned_to UUID NULL, -- employee id

  cleaning_time_in TIMESTAMPTZ,
  cleaning_time_out TIMESTAMPTZ,

  cleaned_at TIMESTAMPTZ,
  inspected_at TIMESTAMPTZ
);

-- Booking
CREATE INDEX idx_booking_status ON booking(status);
CREATE INDEX idx_booking_dates ON booking(check_in_date, check_out_date);
CREATE INDEX idx_booking_room ON booking(room_name);

-- Guests
CREATE INDEX idx_booking_guests_booking_id
  ON booking_guests(booking_id);

-- Payments
CREATE INDEX idx_booking_payments_booking_id
  ON booking_payments(booking_id);
CREATE INDEX idx_booking_payments_status
  ON booking_payments(payment_status);

-- Security Deposit
CREATE INDEX idx_booking_deposit_booking_id
  ON booking_security_deposits(booking_id);
CREATE INDEX idx_booking_deposit_status
  ON booking_security_deposits(deposit_status);

-- Add-ons
CREATE INDEX idx_booking_add_ons_booking_id
  ON booking_add_ons(booking_id);
CREATE INDEX idx_booking_add_ons_status
  ON booking_add_ons(status);

-- Cleaning
CREATE INDEX idx_booking_cleaning_booking_id
  ON booking_cleaning(booking_id);
CREATE INDEX idx_booking_cleaning_status
  ON booking_cleaning(cleaning_status);
