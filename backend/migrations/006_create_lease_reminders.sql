-- Create lease_reminders table to track sent reminders
CREATE TABLE IF NOT EXISTS lease_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    reminder_days INTEGER NOT NULL CHECK (reminder_days IN (90, 60, 30)),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure we don't send duplicate reminders for the same lease and days
    UNIQUE(lease_id, reminder_days)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_lease_reminders_lease_id ON lease_reminders(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_reminders_sent_at ON lease_reminders(sent_at);

-- Add RLS policy for lease_reminders
ALTER TABLE lease_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see reminders for leases they have access to
CREATE POLICY "Users can view lease reminders for their leases" 
ON lease_reminders FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM leases 
        WHERE leases.id = lease_reminders.lease_id 
        AND leases.realtor_id = auth.uid()
    )
);

-- Policy: Only system can insert reminder records (this will be done via service account)
CREATE POLICY "System can insert lease reminders" 
ON lease_reminders FOR INSERT 
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE lease_reminders IS 'Tracks automatic lease expiration reminder emails sent to landlords and realtors';
COMMENT ON COLUMN lease_reminders.reminder_days IS 'Number of days before lease expiration when reminder was sent (90, 60, or 30)';
COMMENT ON COLUMN lease_reminders.sent_at IS 'Timestamp when the reminder email was actually sent';
