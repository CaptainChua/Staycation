-- Migration: Add Facebook OAuth and register_as support
-- This adds facebook_id and register_as columns to the users table

-- Add facebook_id column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255) UNIQUE;

-- Add register_as column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS register_as VARCHAR(50);

-- Add index for faster lookups on facebook_id
CREATE INDEX IF NOT EXISTS idx_users_facebook_id ON users(facebook_id);

-- Add index for faster lookups on register_as
CREATE INDEX IF NOT EXISTS idx_users_register_as ON users(register_as);

-- Comments for documentation
COMMENT ON COLUMN users.facebook_id IS 'Facebook OAuth ID for social login';
COMMENT ON COLUMN users.register_as IS 'Registration method: google, facebook, email, etc.';
