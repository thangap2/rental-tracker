const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const https = require('https');
const { Pool } = require('pg');

// For development, allow self-signed certificates
if (process.env.NODE_ENV === 'development') {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_PUBLIC_KEY;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  console.error('Required: SUPABASE_URL and SUPABASE_SECRET_KEY');
  process.exit(1);
}

// Create HTTPS agent that handles SSL issues in development
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production'
});

// Create Supabase contact with node-fetch and SSL handling
const supabaseOptions = {
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
};

// Service role client for backend operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, supabaseOptions);

// Public client (for frontend operations that should respect RLS)
const supabasePublic = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)
  : null;

// Direct PostgreSQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || extractHostFromSupabaseUrl(supabaseUrl),
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // maximum number of connections in the pool
  idleTimeoutMillis: 30000, // close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
};

// Function to extract database host from Supabase URL
function extractHostFromSupabaseUrl(url) {
  if (!url) return 'localhost';
  try {
    const parsedUrl = new URL(url);
    // Convert from https://project.supabase.co to db.project.supabase.co
    const hostname = parsedUrl.hostname;
    if (hostname.includes('.supabase.co')) {
      const projectId = hostname.split('.')[0];
      return `db.${projectId}.supabase.co`;
    }
    return hostname;
  } catch (error) {
    console.warn('Could not parse Supabase URL for database host:', error.message);
    return 'localhost';
  }
}

// Create PostgreSQL connection pool
let pgPool = null;
try {
  pgPool = new Pool(dbConfig);
  
  // Test the connection
  pgPool.connect()
    .then(client => {
      console.log('✅ Direct PostgreSQL connection established');
      client.release();
    })
    .catch(err => {
      console.warn('⚠️  Direct PostgreSQL connection failed, falling back to REST API only:', err.message);
      pgPool = null;
    });

  // Handle pool errors
  pgPool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
  });
} catch (error) {
  console.warn('⚠️  Could not create PostgreSQL pool, using REST API only:', error.message);
}

// Database query helper functions
const db = {
  // Execute a raw SQL query with parameters
  async query(text, params = []) {
    if (!pgPool) {
      throw new Error('Direct database connection not available. Use Supabase REST client instead.');
    }
    
    const start = Date.now();
    const client = await pgPool.connect();
    
    try {
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('SQL Query executed:', { 
          query: text, 
          params, 
          duration: `${duration}ms`, 
          rows: result.rowCount 
        });
      }
      
      return result;
    } finally {
      client.release();
    }
  },

  // Execute a query and return rows as JSON
  async queryRows(text, params = []) {
    const result = await this.query(text, params);
    return result.rows;
  },

  // Execute a query and return a single row
  async queryOne(text, params = []) {
    const result = await this.query(text, params);
    return result.rows[0] || null;
  },

  // Execute a transaction
  async transaction(callback) {
    if (!pgPool) {
      throw new Error('Direct database connection not available. Use Supabase REST client instead.');
    }

    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get table information
  async getTableInfo(tableName) {
    return this.queryRows(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);
  },

  // Check if direct connection is available
  isDirectConnectionAvailable() {
    return pgPool !== null;
  },

  // Close the pool (for graceful shutdown)
  async close() {
    if (pgPool) {
      await pgPool.end();
      console.log('PostgreSQL pool closed');
    }
  }
};

module.exports = {
  supabase,
  supabaseAdmin: supabase, // Same as supabase for backend
  supabasePublic,
  db, // Direct PostgreSQL connection
  pgPool // Direct access to the pool if needed
};
