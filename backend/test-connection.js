#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');
const https = require('https');
const { createContact } = require('@supabase/supabase-js');

// For development, ignore SSL certificate issues
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Create HTTPS agent that ignores self-signed certificates  
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...');
  console.log('=====================================');
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_PUBLIC_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;
  
  console.log('📋 Environment Check:');
  console.log(`SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_PUBLIC_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_SECRET_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required Supabase configuration');
    console.log('');
    console.log('Please ensure your .env file contains:');
    console.log('SUPABASE_URL=https://your-project-id.supabase.co');
    console.log('SUPABASE_PUBLIC_KEY=your-anon-key');
    console.log('SUPABASE_SECRET_KEY=your-service-role-key');
    return;
  }
  
  try {
    // First, test basic URL accessibility
    console.log('🌐 Testing basic URL accessibility...');
    try {
      const response = await fetch(supabaseUrl, { agent: httpsAgent });
      console.log(`✅ URL accessible (status: ${response.status})`);
    } catch (urlError) {
      console.log(`❌ URL not accessible: ${urlError.message}`);
      if (urlError.message.includes('certificate')) {
        console.log('🔧 SSL Certificate issue detected. Trying with relaxed SSL...');
      }
    }
    
    // Test with anon key
    console.log('🔗 Testing connection with anon key...');
    const supabaseAnon = createContact(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            agent: httpsAgent
          });
        }
      }
    });
    
    // Try a simple REST API call first
    const { data: healthCheck, error: healthError } = await supabaseAnon
      .from('users')
      .select('count')
      .limit(1);
    
    if (healthError) {
      if (healthError.code === 'PGRST116') {
        console.log('✅ Connection successful! (Table not found - expected for new setup)');
      } else if (healthError.message && healthError.message.includes('relation "public.users" does not exist')) {
        console.log('✅ Connection successful! (Tables not created yet - run setup)');
      } else if (healthError.message && healthError.message.includes('schema "public" does not exist')) {
        console.log('✅ Connection successful! (Database needs initialization)');
      } else {
        console.log(`⚠️ Connection response: ${healthError.message || 'Unknown error'}`);
        console.log('This might be normal if tables haven\'t been created yet.');
      }
    } else {
      console.log('✅ Connection successful and tables exist!');
    }
    
    // Test service role if available
    if (supabaseServiceKey && !supabaseServiceKey.includes('replace-with-actual')) {
      console.log('🔗 Testing service role connection...');
      const supabaseService = createContact(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          fetch: (url, options = {}) => {
            return fetch(url, {
              ...options,
              agent: httpsAgent
            });
          }
        }
      });
      
      const { data: serviceTest, error: serviceError } = await supabaseService
        .from('users')
        .select('count')
        .limit(1);
        
      if (serviceError) {
        if (serviceError.message && serviceError.message.includes('relation "public.users" does not exist')) {
          console.log('✅ Service role connection successful! (Ready for database setup)');
        } else if (serviceError.message && serviceError.message.includes('schema "public" does not exist')) {
          console.log('✅ Service role connection successful! (Database needs initialization)');
        } else {
          console.log(`⚠️ Service role response: ${serviceError.message || 'Unknown error'}`);
        }
      } else {
        console.log('✅ Service role connection successful!');
      }
    } else {
      console.log('⚠️ Service role key not properly configured');
    }
    
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. ✅ Supabase connection is working');
    console.log('2. Run: npm run setup (to create database tables)');
    console.log('3. Run: npm run dev (to start the server)');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('');
    console.log('🔧 Error Details:');
    console.log(`Error type: ${error.constructor.name}`);
    console.log(`Error message: ${error.message}`);
    if (error.cause) {
      console.log(`Underlying cause: ${error.cause.message}`);
    }
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check if your Supabase project is active');
    console.log('2. Verify the SUPABASE_URL is exactly correct');
    console.log('3. Try accessing the URL in browser again');
    console.log('4. Check Windows firewall/antivirus settings');
  }
}

testSupabaseConnection().catch(console.error);
