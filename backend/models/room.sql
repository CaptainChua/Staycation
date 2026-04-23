-- ===============================================
-- 1. HAVENS TABLE (Main table for room/haven info)
-- ===============================================
CREATE TABLE havens (
    uuid_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    haven_name VARCHAR(100) NOT NULL,
    tower VARCHAR(50) NOT NULL,
    floor VARCHAR(10) NOT NULL,
    view_type VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    room_size DECIMAL(10,2) NOT NULL,
    beds VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    youtube_url TEXT,

    six_hour_rate DECIMAL(10,2) NOT NULL,
    ten_hour_rate DECIMAL(10,2) NOT NULL,
    weekday_rate DECIMAL(10,2) NOT NULL,
    weekend_rate DECIMAL(10,2) NOT NULL,

    six_hour_check_in TIME DEFAULT '09:00:00',
    ten_hour_check_in TIME DEFAULT '09:00:00',
    twenty_one_hour_check_in TIME DEFAULT '14:00:00',

    amenities JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT check_capacity CHECK (capacity > 0 AND capacity <= 20),
    CONSTRAINT check_room_size CHECK (room_size > 0)
);


-- ===============================================
-- 2. HAVEN IMAGES TABLE (Main display images)
-- ===============================================
CREATE TABLE haven_images (
    id SERIAL PRIMARY KEY,
    haven_id UUID NOT NULL,

    image_url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_haven_images
        FOREIGN KEY (haven_id)
        REFERENCES havens(uuid_id)
        ON DELETE CASCADE
);


-- ===============================================
-- 3. PHOTO TOUR IMAGES TABLE (Category-based photos)
-- ===============================================
CREATE TABLE photo_tour_images (
    id SERIAL PRIMARY KEY,
    haven_id UUID NOT NULL,

    category VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_photo_tour_haven
        FOREIGN KEY (haven_id)
        REFERENCES havens(uuid_id)
        ON DELETE CASCADE,

    CONSTRAINT check_category CHECK (
        category IN (
            'livingArea','kitchenette','diningArea','fullBathroom',
            'garage','exterior','pool','bedroom','additional'
        )
    )
);


-- ===============================================
-- 4. BLOCKED DATES TABLE (Availability management)
-- ===============================================
CREATE TABLE blocked_dates (
    id SERIAL PRIMARY KEY,
    haven_id UUID NOT NULL,

    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_blocked_haven
        FOREIGN KEY (haven_id)
        REFERENCES havens(uuid_id)
        ON DELETE CASCADE,

    CONSTRAINT check_date_range CHECK (to_date >= from_date)
);


-- ===============================================
-- 5. CREATE INDEXES (For faster queries)
-- ===============================================
CREATE INDEX idx_havens_tower ON havens(tower);
CREATE INDEX idx_havens_view ON havens(view_type);
CREATE INDEX idx_havens_capacity ON havens(capacity);
CREATE INDEX idx_haven_images_haven_id ON haven_images(haven_id);
CREATE INDEX idx_photo_tour_haven_id ON photo_tour_images(haven_id);
CREATE INDEX idx_photo_tour_category ON photo_tour_images(category);
CREATE INDEX idx_blocked_dates_haven_id ON blocked_dates(haven_id);
CREATE INDEX idx_blocked_dates_range ON blocked_dates(from_date, to_date);

-- ===============================================
-- 6. CREATE UPDATED_AT TRIGGER FUNCTION
-- ===============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to havens table
CREATE TRIGGER update_havens_updated_at
    BEFORE UPDATE ON havens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();