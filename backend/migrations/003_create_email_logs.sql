-- Migration: Create email_logs table for tracking sent emails
-- File: 003_create_email_logs.sql

CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('custom', 'contact', 'lease_reminder', 'system')),
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_by ON email_logs(sent_by);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_contact_id ON email_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_lease_id ON email_logs(lease_id);

-- Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Realtors can only see their own sent emails
CREATE POLICY "Users can view their own email logs" ON email_logs
    FOR SELECT USING (sent_by = auth.uid());

-- Realtors can only insert their own email logs
CREATE POLICY "Users can create their own email logs" ON email_logs
    FOR INSERT WITH CHECK (sent_by = auth.uid());

-- Realtors can update their own email logs
CREATE POLICY "Users can update their own email logs" ON email_logs
    FOR UPDATE USING (sent_by = auth.uid());

-- Realtors can delete their own email logs
CREATE POLICY "Users can delete their own email logs" ON email_logs
    FOR DELETE USING (sent_by = auth.uid());

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_logs_updated_at 
    BEFORE UPDATE ON email_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
