-- Migration to add registration source tracking to users table
-- Run this in your Supabase SQL editor

-- Add registration_source column to users table
ALTER TABLE users ADD COLUMN registration_source VARCHAR(20) DEFAULT 'email' 
CHECK (registration_source IN ('email', 'google', 'facebook', 'apple', 'linkedin', 'microsoft', 'other'));

-- Add source_user_id column to store the external user ID (for OAuth providers)
ALTER TABLE users ADD COLUMN source_user_id VARCHAR(255);

-- Add source_metadata column to store additional source-specific data
ALTER TABLE users ADD COLUMN source_metadata JSONB;

-- Update existing users to have registration_source = 'email' for password-based users
UPDATE users SET registration_source = 'email' WHERE password_hash IS NOT NULL;

-- Update existing Google OAuth users to have registration_source = 'google'
UPDATE users SET registration_source = 'google', source_user_id = google_id 
WHERE google_id IS NOT NULL;

-- Create index on registration_source for analytics
CREATE INDEX idx_users_registration_source ON users(registration_source);

-- Create index on source_user_id for faster OAuth lookups
CREATE INDEX idx_users_source_user_id ON users(source_user_id);

-- Add comment for documentation
COMMENT ON COLUMN users.registration_source IS 'The source/method used for user registration (email, google, facebook, etc.)';
COMMENT ON COLUMN users.source_user_id IS 'The external user ID from the registration source (e.g., Google ID, Facebook ID)';
COMMENT ON COLUMN users.source_metadata IS 'Additional metadata from the registration source (profile data, permissions, etc.)';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('registration_source', 'source_user_id', 'source_metadata')
ORDER BY ordinal_position;
