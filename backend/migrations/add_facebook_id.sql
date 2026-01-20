-- Migration: Add Facebook ID support to users table
-- This migration adds a facebook_id column to support Facebook OAuth login

-- Add facebook_id column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255) UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_facebook_id ON users(facebook_id);

-- Comment for documentation
COMMENT ON COLUMN users.facebook_id IS 'Facebook OAuth ID for social login';
