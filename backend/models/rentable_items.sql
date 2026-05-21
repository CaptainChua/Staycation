-- ===============================================
-- HAVEN RENTABLE ITEMS TABLE
-- Optional add-ons the owner offers per haven.
-- Shown in the guest pamphlet sent with each booking.
-- ===============================================

CREATE TABLE IF NOT EXISTS haven_rentable_items (
    id SERIAL PRIMARY KEY,
    haven_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(20) DEFAULT '🛎️',
    price_per_night DECIMAL(10,2) NOT NULL CHECK (price_per_night >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_haven_rentable_items
        FOREIGN KEY (haven_id)
        REFERENCES havens(uuid_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_haven_rentable_items_haven_id
    ON haven_rentable_items(haven_id);

CREATE OR REPLACE FUNCTION update_haven_rentable_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_haven_rentable_items_updated_at
    BEFORE UPDATE ON haven_rentable_items
    FOR EACH ROW
    EXECUTE FUNCTION update_haven_rentable_items_updated_at();
