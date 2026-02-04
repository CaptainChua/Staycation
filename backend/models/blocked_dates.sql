CREATE TABLE blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    haven_id UUID NOT NULL
     REFERENCES havens(uuid_id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
      CHECK (status IN (
        'active',
        'inactive'
      )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)