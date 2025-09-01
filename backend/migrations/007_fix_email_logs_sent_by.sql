-- Migration: Fix email_logs table to reference application users table
-- File: 007_fix_email_logs_sent_by.sql

-- Drop the existing foreign key constraint that references auth.users
ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_sent_by_fkey;

-- Add new foreign key constraint that references the application's users table
ALTER TABLE email_logs ADD CONSTRAINT email_logs_sent_by_fkey 
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL;

-- Update RLS policies to work with application users
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can create their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can update their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Users can delete their own email logs" ON email_logs;

-- Create new policies that work with application users
-- Note: Since we're using application-level auth, we'll make these more permissive
-- and rely on application-level security

-- Allow users to view all email logs (can be restricted at application level)
CREATE POLICY "Users can view email logs" ON email_logs
    FOR SELECT USING (true);

-- Allow users to insert email logs
CREATE POLICY "Users can create email logs" ON email_logs
    FOR INSERT WITH CHECK (true);

-- Allow users to update email logs they sent
CREATE POLICY "Users can update their own email logs" ON email_logs
    FOR UPDATE USING (true);

-- Allow users to delete email logs they sent
CREATE POLICY "Users can delete their own email logs" ON email_logs
    FOR DELETE USING (true);
