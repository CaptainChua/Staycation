CREATE TABLE otp_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    otp_type VARCHAR(50) NOT NULL, -- 'password_change', 'account_unlock', 'login_verification'
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_otp_verification_email ON otp_verification(email);
CREATE INDEX idx_otp_verification_code ON otp_verification(otp_code);
CREATE INDEX idx_otp_verification_expires ON otp_verification(expires_at);
