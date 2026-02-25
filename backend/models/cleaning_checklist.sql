-- ===============================================
-- Cleaning Checklist Model
-- Defines tables for cleaning_checklists and cleaning_tasks
-- ===============================================

-- 1. CLEANING CHECKLISTS TABLE
CREATE TABLE cleaning_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Reference to the haven (room) that needs cleaning
    haven_id UUID NOT NULL,

    -- Optional reference to a booking if checklist is tied to a specific booking
    booking_id UUID,

    -- Employee assigned to perform the checklist (optional)
    assigned_to UUID,

    -- Current status of the checklist: pending, in_progress, completed
    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    -- Timestamp set when checklist is completed
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_cleaning_checklists_haven FOREIGN KEY (haven_id)
        REFERENCES havens(uuid_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cleaning_checklists_assigned_to FOREIGN KEY (assigned_to)
        REFERENCES employees(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_cleaning_checklists_booking FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE SET NULL,

    CONSTRAINT check_status CHECK (status IN ('pending','in_progress','completed')),
    -- If status is completed, completed_at should be set
    CONSTRAINT check_completed_timestamp CHECK (status != 'completed' OR completed_at IS NOT NULL)
);

-- 2. CLEANING TASKS TABLE
CREATE TABLE cleaning_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key to the checklist this task belongs to
    checklist_id UUID NOT NULL,

    -- Category (e.g., Bedroom, Bathroom, Kitchen, etc.)
    category VARCHAR(100) NOT NULL,

    -- Task description
    task_description TEXT NOT NULL,

    -- Completion flag
    completed BOOLEAN DEFAULT false,

    -- Order within the category / checklist
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_cleaning_checklists
        FOREIGN KEY (checklist_id)
        REFERENCES cleaning_checklists(id)
        ON DELETE CASCADE
);

-- 3. INDEXES (performance helpers)
CREATE INDEX idx_cleaning_checklists_haven_id ON cleaning_checklists(haven_id);
CREATE INDEX idx_cleaning_checklists_assigned_to ON cleaning_checklists(assigned_to);
CREATE INDEX idx_cleaning_checklists_booking ON cleaning_checklists(booking_id);
CREATE INDEX idx_cleaning_tasks_checklist_id ON cleaning_tasks(checklist_id);
CREATE INDEX idx_cleaning_tasks_category ON cleaning_tasks(category);
CREATE INDEX idx_cleaning_tasks_completed ON cleaning_tasks(completed);

-- Optional: ensure only one active (non-completed) checklist per haven
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_checklist_per_haven
  ON cleaning_checklists(haven_id)
  WHERE status != 'completed';

-- 4. UPDATED_AT TRIGGERS
-- Reuse existing update_updated_at_column() trigger function defined elsewhere in the schema
CREATE TRIGGER update_cleaning_checklists_updated_at
    BEFORE UPDATE ON cleaning_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_tasks_updated_at
    BEFORE UPDATE ON cleaning_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
