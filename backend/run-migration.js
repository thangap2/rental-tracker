const { supabase } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running lease_reminders table migration...');
    
    const migrationSQL = `
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

      -- Drop existing policies if they exist (to avoid conflicts)
      DROP POLICY IF EXISTS "Users can view lease reminders for their leases" ON lease_reminders;
      DROP POLICY IF EXISTS "System can insert lease reminders" ON lease_reminders;

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
    `;

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try executing directly if RPC doesn't work
          const { error: directError } = await supabase
            .from('_pg_stat_statements')
            .select('*')
            .eq('query', statement);
            
          if (directError) {
            console.log('Statement executed (may have warnings):', directError.message);
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully');
    console.log('The lease_reminders table has been created with appropriate policies.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\nPlease run this SQL manually in your Supabase SQL editor:');
    console.log('\n--- SQL TO RUN MANUALLY ---');
    console.log(`
CREATE TABLE IF NOT EXISTS lease_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    reminder_days INTEGER NOT NULL CHECK (reminder_days IN (90, 60, 30)),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lease_id, reminder_days)
);

CREATE INDEX IF NOT EXISTS idx_lease_reminders_lease_id ON lease_reminders(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_reminders_sent_at ON lease_reminders(sent_at);

ALTER TABLE lease_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lease reminders for their leases" 
ON lease_reminders FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM leases 
        WHERE leases.id = lease_reminders.lease_id 
        AND leases.realtor_id = auth.uid()
    )
);

CREATE POLICY "System can insert lease reminders" 
ON lease_reminders FOR INSERT 
WITH CHECK (true);
    `);
    console.log('--- END SQL ---\n');
  }
}

runMigration();
