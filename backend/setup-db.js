#!/usr/bin/env node

const { supabase } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing Supabase database...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../docs/supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📄 Found ${statements.length} SQL statements to execute...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use the service role contact for schema operations
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`⚠️  Warning on statement ${i + 1}: ${error.message}`);
          // Continue with other statements as some errors might be expected (like "already exists")
        }
      } catch (err) {
        console.log(`⚠️  Error on statement ${i + 1}: ${err.message}`);
        // Continue with other statements
      }
    }

    console.log('✅ Database initialization completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Set up your environment variables in .env');
    console.log('2. Update SUPABASE_URL and SUPABASE_SECRET_KEY');
    console.log('3. Run "npm run dev" to start the development server');
    
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

// Check if Supabase connection is configured
async function checkConnection() {
  try {
    console.log('🔍 Checking Supabase connection...');
    
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('⚠️  Connection test failed, but this might be expected if tables don\'t exist yet.');
      console.log('Proceeding with initialization...');
    } else {
      console.log('✅ Supabase connection successful!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('');
    console.log('Please check your .env file and ensure:');
    console.log('- SUPABASE_URL is set correctly');
    console.log('- SUPABASE_SECRET_KEY is set correctly');
    console.log('- Your Supabase project is active');
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Rental Tracker - Database Setup');
  console.log('=====================================');
  
  const connectionOk = await checkConnection();
  
  if (connectionOk) {
    await initializeDatabase();
  } else {
    process.exit(1);
  }
}

main().catch(console.error);
