-- Partners Account Table
-- Stores authentication credentials and account status
CREATE TABLE partners_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_email VARCHAR(255) UNIQUE NOT NULL,
    partner_password TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partners Information Table
-- Stores detailed partner information and profile
CREATE TABLE partners_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID UNIQUE NOT NULL REFERENCES partners_account(id) ON DELETE CASCADE,

    -- Basic Information
    partner_fullname VARCHAR(255) NOT NULL,
    partner_phone VARCHAR(20),
    partner_address TEXT,
    partner_city VARCHAR(100),
    partner_province VARCHAR(100),
    partner_postal_code VARCHAR(20),

    -- Partner Details
    partner_type VARCHAR(100) DEFAULT 'hotel',

    -- Financial Details
    commission_rate NUMERIC(5,2) DEFAULT 10.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    total_earnings NUMERIC(12,2) DEFAULT 0.00,
    total_paid NUMERIC(12,2) DEFAULT 0.00,

    -- Additional Info
    profile_image_url VARCHAR(500),

    -- Operational Details
    availability_status VARCHAR(50) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'on_leave', 'unavailable')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE partners_property_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID UNIQUE NOT NULL REFERENCES partners_account(id) ON DELETE CASCADE,

    property_name VARCHAR(255) NOT NULL,
    property_description TEXT,
    property_address TEXT,
    property_city VARCHAR(100),
    property_province VARCHAR(100),
    property_postal_code VARCHAR(20),
    property_country VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)