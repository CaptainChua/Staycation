-- Employee Activity Logs Model
-- This table will track all activities performed by employees in the system

-- Create activity logs table
CREATE TABLE employee_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- User-defined activity type (LOGIN, CREATE_BOOKING, etc.)
    description TEXT NOT NULL,
    entity_type VARCHAR(50), -- Type of entity affected (booking, payment, deposit, etc.)
    entity_id UUID, -- ID of the entity affected
    ip_address INET, -- IP address from which activity was performed
    user_agent TEXT, -- Browser/user agent information
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_employee_activity_logs_employee_id ON employee_activity_logs(employee_id);
CREATE INDEX idx_employee_activity_logs_activity_type ON employee_activity_logs(activity_type);
CREATE INDEX idx_employee_activity_logs_created_at ON employee_activity_logs(created_at);
CREATE INDEX idx_employee_activity_logs_entity ON employee_activity_logs(entity_type, entity_id);

-- Create a simple function to log activity
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
    ) RETURNING id INTO activity_log_id;
    
    RETURN activity_log_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE employee_activity_logs IS 'Tracks all activities performed by employees in the system for audit purposes';
COMMENT ON COLUMN employee_activity_logs.employee_id IS 'Reference to the employee who performed the activity';
COMMENT ON COLUMN employee_activity_logs.activity_type IS 'Type of activity performed (user-defined, e.g., LOGIN, CREATE_BOOKING, etc.)';
COMMENT ON COLUMN employee_activity_logs.description IS 'Human-readable description of what was done';
COMMENT ON COLUMN employee_activity_logs.entity_type IS 'Type of entity that was affected (booking, payment, deposit, etc.)';
COMMENT ON COLUMN employee_activity_logs.entity_id IS 'ID of the specific entity that was affected';
COMMENT ON COLUMN employee_activity_logs.ip_address IS 'IP address from which the activity was performed';
COMMENT ON COLUMN employee_activity_logs.user_agent IS 'Browser or client user agent string';

-- Sample usage examples:
/*
-- Log a login
SELECT log_employee_activity(
    'employee-uuid-here',
    'LOGIN',
    'Employee logged into the system',
    NULL,
    NULL,
    '192.168.1.100'::INET,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);

-- Log a booking update
SELECT log_employee_activity(
    'employee-uuid-here',
    'UPDATE_BOOKING',
    'Updated booking status from Pending to Confirmed',
    'booking',
    'booking-uuid-here',
    '192.168.1.100'::INET,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);

-- Log a custom activity
SELECT log_employee_activity(
    'employee-uuid-here',
    'CUSTOMER_SERVICE_CALL',
    'Handled customer complaint about room cleanliness',
    'booking',
    'booking-uuid-here',
    '192.168.1.100'::INET,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);
*/
