CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    haven_id UUID REFERENCES havens(uuid_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Summer Promo", "Holiday Discount"
    code VARCHAR(50) UNIQUE,    -- optional promo code for users to apply
    description TEXT,           -- optional explanation of the discount
    discount_type VARCHAR(20) NOT NULL
        CHECK (discount_type IN ('percentage', 'fixed')), -- type of discount
    discount_value NUMERIC(10,2) NOT NULL, -- amount or percentage
    min_booking_amount NUMERIC(10,2) DEFAULT NULL,     -- optional minimum booking to apply
    start_date TIMESTAMP NOT NULL,        -- when discount starts
    end_date TIMESTAMP NOT NULL,          -- when discount ends
    max_uses INT DEFAULT NULL,                         -- optional limit of uses
    used_count INT DEFAULT 0,             -- track how many times used
    active BOOLEAN DEFAULT TRUE,          -- is discount active
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);