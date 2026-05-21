-- Migration: 2026-05-20-create-cleaning-checklist-photos
-- Adds photo proof per category per cleaning checklist

CREATE TABLE IF NOT EXISTS cleaning_checklist_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    checklist_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(255),

    uploaded_at TIMESTAMP DEFAULT timezone('Asia/Manila', NOW()),

    CONSTRAINT fk_ccphotos_checklist
        FOREIGN KEY (checklist_id)
        REFERENCES cleaning_checklists(id)
        ON DELETE CASCADE,

    -- One photo per category per checklist (upsert replaces)
    CONSTRAINT uq_ccphotos_checklist_category UNIQUE (checklist_id, category)
);

CREATE INDEX IF NOT EXISTS idx_ccphotos_checklist_id ON cleaning_checklist_photos(checklist_id);
