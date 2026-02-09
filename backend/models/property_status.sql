CREATE TABLE property_approval (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    haven_id UUID NOT NULL UNIQUE
        REFERENCES havens(uuid_id) ON DELETE CASCADE,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending  = waiting for admin approval (hidden)
    -- approved = visible on index page
    -- blocked  = temporarily hidden
    -- rejected = permanently hidden

    reason TEXT DEFAULT NULL,

    approved_at TIMESTAMPTZ DEFAULT NULL,
    approved_by UUID DEFAULT NULL, -- admin user id (future use)

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_property_approval_status
        CHECK (status IN ('pending', 'approved', 'blocked', 'rejected'))
);

CREATE INDEX idx_property_approval_status ON property_approval(status);
