-- =========================================================
-- Employee Activity Logs
-- Tracks all actions performed by employees (audit trail)
-- Time strategy:
--   • Store ALL timestamps in UTC using TIMESTAMPTZ
--   • Convert to Asia/Manila only when querying or in the app
-- =========================================================

-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- Create employee activity logs table
-- =========================================================
CREATE TABLE IF NOT EXISTS employee_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    employee_id UUID NOT NULL
        REFERENCES employees(id)
        ON DELETE CASCADE,

    activity_type VARCHAR(100) NOT NULL, -- LOGIN, CREATE_BOOKING, UPDATE_PAYMENT, etc.
    description TEXT NOT NULL,

    entity_type VARCHAR(50), -- booking, payment, deposit, etc.
    entity_id UUID,

    ip_address INET,
    user_agent TEXT,

    -- Always store in UTC with timezone info
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Indexes for performance
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_employee_activity_logs_employee_id
    ON employee_activity_logs(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_activity_logs_activity_type
    ON employee_activity_logs(activity_type);

CREATE INDEX IF NOT EXISTS idx_employee_activity_logs_created_at
    ON employee_activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_employee_activity_logs_entity
    ON employee_activity_logs(entity_type, entity_id);

-- =========================================================
-- Activity logging function
-- =========================================================
CREATE OR REPLACE FUNCTION log_employee_activity(
    p_employee_id UUID,
    p_activity_type VARCHAR(100),
    p_description TEXT,
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    activity_log_id UUID;
BEGIN
    INSERT INTO employee_activity_logs (
        employee_id,
        activity_type,
        description,
        entity_type,
        entity_id,
        ip_address,
        user_agent
    ) VALUES (
        p_employee_id,
        p_activity_type,
        p_description,
        p_entity_type,
        p_entity_id,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO activity_log_id;

    RETURN activity_log_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- Documentation
-- =========================================================
COMMENT ON TABLE employee_activity_logs IS
'Audit log of all employee actions. Timestamps are stored in UTC using TIMESTAMPTZ.';

COMMENT ON COLUMN employee_activity_logs.employee_id IS
'Employee who performed the action';

COMMENT ON COLUMN employee_activity_logs.activity_type IS
'Type of activity (LOGIN, CREATE_BOOKING, UPDATE_PAYMENT, etc.)';

COMMENT ON COLUMN employee_activity_logs.description IS
'Human-readable description of the activity';

COMMENT ON COLUMN employee_activity_logs.entity_type IS
'Entity affected by the activity (booking, payment, deposit, etc.)';

COMMENT ON COLUMN employee_activity_logs.entity_id IS
'ID of the affected entity';

COMMENT ON COLUMN employee_activity_logs.ip_address IS
'IP address of the employee';

COMMENT ON COLUMN employee_activity_logs.user_agent IS
'Browser or client user agent';

COMMENT ON COLUMN employee_activity_logs.created_at IS
'Timestamp stored in UTC with timezone (TIMESTAMPTZ)';

-- =========================================================
-- SAMPLE USAGE
-- =========================================================
/*
-- Log employee login
SELECT log_employee_activity(
    'employee-uuid-here',
    'LOGIN',
    'Employee logged into the system',
    NULL,
    NULL,
    '192.168.1.100'::INET,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
);

-- Log booking update
SELECT log_employee_activity(
    'employee-uuid-here',
    'UPDATE_BOOKING',
    'Updated booking status from Pending to Confirmed',
    'booking',
    'booking-uuid-here',
    '192.168.1.100'::INET,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
);
*/

-- =========================================================
-- QUERY MANILA TIME (READ-ONLY CONVERSION)
-- =========================================================
-- Example:
-- SELECT
--   created_at AT TIME ZONE 'Asia/Manila' AS created_at_manila
-- FROM employee_activity_logs;
