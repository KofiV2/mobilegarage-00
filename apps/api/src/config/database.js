const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool configuration
// Supabase pooler (port 6543) doesn't require SSL, direct connection (port 5432) does
const isPoolerConnection = process.env.DATABASE_URL && process.env.DATABASE_URL.includes(':6543');

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased to 10 seconds for Supabase
};

// Add SSL only for direct connections (not pooler)
// Pooler (port 6543) doesn't need SSL
if (!isPoolerConnection && process.env.DATABASE_URL) {
  poolConfig.ssl = {
    rejectUnauthorized: false // Required for Supabase direct connection
  };
}

const pool = new Pool(poolConfig);

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected successfully!');
    console.log('   Connection:', isPoolerConnection ? 'Pooler (6543)' : 'Direct (5432)');
    console.log('   Database: postgres');
    console.log('   Time:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    console.error('   Connection string:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
    console.error('   SSL enabled:', !isPoolerConnection);
    return false;
  }
};

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Get a client from the pool
const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Error getting client from pool:', error);
    throw error;
  }
};

// Close pool (for graceful shutdown)
const closePool = async () => {
  try {
    await pool.end();
    console.log('✅ Database pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool
};
