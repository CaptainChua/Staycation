-- ============================================================================
-- DISCOUNTS MANAGEMENT SCHEMA
-- ============================================================================
-- This schema manages promotional discounts that can be applied to:
-- 1. Multiple properties (havens) via discount_havens junction table
-- 2. Specific users via discount_users junction table
-- ============================================================================

-- Main Discounts Table
-- Stores all discount/promotional code information
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- e.g., "Summer Promo", "Holiday Discount"
    code VARCHAR(50) UNIQUE NOT NULL, -- promo code for users to apply
    description TEXT, -- optional explanation of the discount
    discount_type VARCHAR(20) NOT NULL
        CHECK (discount_type IN ('percentage', 'fixed')), -- type of discount
    discount_value NUMERIC(10,2) NOT NULL, -- amount or percentage value
    min_booking_amount NUMERIC(10,2) DEFAULT NULL, -- optional minimum booking amount to apply
    start_date TIMESTAMP NOT NULL, -- when discount becomes active
    end_date TIMESTAMP NOT NULL, -- when discount expires
    max_uses INT DEFAULT NULL, -- optional limit of total uses (NULL = unlimited)
    used_count INT DEFAULT 0, -- track current number of times used
    active BOOLEAN DEFAULT TRUE, -- is discount currently active/available
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Discount to Properties Junction Table
-- Associates discounts with specific properties (havens)
-- IMPORTANT: If a discount has NO rows in this table, it applies to ALL properties
-- If a discount HAS rows in this table, it applies ONLY to those properties
CREATE TABLE IF NOT EXISTS discount_havens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    haven_id UUID NOT NULL REFERENCES havens(uuid_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(discount_id, haven_id)
);

-- Discount to Users Junction Table
-- Associates discounts with specific users for targeted promotions
-- IMPORTANT: If a discount has NO rows in this table, it's available to ALL users
-- If a discount HAS rows in this table, it's ONLY available to those users
CREATE TABLE IF NOT EXISTS discount_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    used BOOLEAN DEFAULT FALSE, -- has this specific user used this discount
    used_at TIMESTAMP, -- when the user used this discount
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(discount_id, user_id)
);

-- ============================================================================
-- INDEXES - For query performance optimization
-- ============================================================================

-- Discounts table indexes
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(active);
CREATE INDEX IF NOT EXISTS idx_discounts_created_at ON discounts(created_at);
CREATE INDEX IF NOT EXISTS idx_discounts_end_date ON discounts(end_date);

-- Discount Havens junction table indexes
CREATE INDEX IF NOT EXISTS idx_discount_havens_discount_id ON discount_havens(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_havens_haven_id ON discount_havens(haven_id);

-- Discount Users junction table indexes
CREATE INDEX IF NOT EXISTS idx_discount_users_discount_id ON discount_users(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_users_user_id ON discount_users(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_users_used ON discount_users(used);

-- ============================================================================
-- USEFUL VIEWS FOR QUERIES
-- ============================================================================

-- View: Get all properties for each discount
-- Shows which properties a discount applies to
-- CREATE OR REPLACE VIEW v_discount_properties AS
-- SELECT
--     d.id as discount_id,
--     d.code,
--     d.name,
--     d.active,
--     h.uuid_id as haven_id,
--     h.haven_name,
--     h.tower,
--     d.discount_type,
--     d.discount_value
-- FROM discounts d
-- LEFT JOIN discount_havens dh ON d.id = dh.discount_id
-- LEFT JOIN havens h ON dh.haven_id = h.uuid_id
-- ORDER BY d.code, h.haven_name;

-- View: Get all users for each discount
-- Shows which users a discount is assigned to
-- CREATE OR REPLACE VIEW v_discount_target_users AS
-- SELECT
--     d.id as discount_id,
--     d.code,
--     d.name,
--     d.active,
--     u.user_id,
--     u.email,
--     du.used,
--     du.used_at
-- FROM discounts d
-- LEFT JOIN discount_users du ON d.id = du.discount_id
-- LEFT JOIN users u ON du.user_id = u.user_id
-- ORDER BY d.code, u.email;

-- View: Discount summary with statistics
-- Aggregates property and user counts for each discount
-- CREATE OR REPLACE VIEW v_discount_summary AS
-- SELECT
--     d.id,
--     d.code,
--     d.name,
--     d.discount_type,
--     d.discount_value,
--     d.active,
--     d.max_uses,
--     d.used_count,
--     ROUND((d.used_count::numeric / NULLIF(d.max_uses, 0) * 100)::numeric, 2) as usage_percentage,
--     d.start_date,
--     d.end_date,
--     CASE
--         WHEN d.end_date < now() THEN 'Expired'
--         WHEN d.start_date > now() THEN 'Scheduled'
--         WHEN d.active THEN 'Active'
--         ELSE 'Inactive'
--     END as status,
--     COUNT(DISTINCT dh.haven_id) as property_count,
--     COUNT(DISTINCT du.user_id) as user_count,
--     d.created_at,
--     d.updated_at
-- FROM discounts d
-- LEFT JOIN discount_havens dh ON d.id = dh.discount_id
-- LEFT JOIN discount_users du ON d.id = du.discount_id
-- GROUP BY d.id, d.code, d.name, d.discount_type, d.discount_value,
--          d.active, d.max_uses, d.used_count, d.start_date, d.end_date,
--          d.created_at, d.updated_at;