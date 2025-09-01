-- Migration to add Google OAuth support to users table
-- Run this in your Supabase SQL editor

-- Make password_hash nullable
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add Google OAuth columns to users table
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN profile_picture TEXT;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Update existing users to have email_verified = true (optional)
-- UPDATE users SET email_verified = true WHERE password_hash IS NOT NULL;

-- Create index on google_id for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
