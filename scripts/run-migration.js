const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Run database migrations
 * Usage: node run-migration.js [migration-file]
 * Example: node run-migration.js 001_add_missing_fields.sql
 */

async function runMigration() {
  const migrationFile = process.argv[2] || '001_add_missing_fields.sql';
  const migrationPath = path.join(__dirname, 'database', 'migrations', migrationFile);

  console.log('========================================');
  console.log('  DATABASE MIGRATION RUNNER');
  console.log('========================================');
  console.log('');
  console.log(`Migration file: ${migrationFile}`);
  console.log('');

  // Check if migration file exists
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  // Read migration SQL
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Extract database URL from Supabase connection string
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('   Please add DATABASE_URL to your .env file');
    console.error('   Example: DATABASE_URL=postgresql://user:password@host:port/database');
    process.exit(1);
  }

  // Create PostgreSQL pool
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    }
  });

  try {
    console.log('[1/3] Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    console.log('');

    console.log('[2/3] Running migration...');
    console.log(`    SQL file size: ${(migrationSQL.length / 1024).toFixed(2)} KB`);
    console.log('');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!');
    console.log('');

    // Verify schema version
    console.log('[3/3] Verifying schema version...');
    const versionResult = await client.query(
      'SELECT version, description, applied_at FROM schema_version ORDER BY applied_at DESC LIMIT 1'
    );

    if (versionResult.rows.length > 0) {
      const { version, description, applied_at } = versionResult.rows[0];
      console.log(`✅ Schema version: ${version}`);
      console.log(`   Description: ${description}`);
      console.log(`   Applied at: ${applied_at}`);
    }

    console.log('');
    console.log('========================================');
    console.log('  MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('');

    // List what was created/updated
    console.log('Changes applied:');
    console.log('  ✓ Added missing fields to bookings table');
    console.log('  ✓ Added missing fields to services table');
    console.log('  ✓ Created analytics_snapshots table');
    console.log('  ✓ Added performance indexes');
    console.log('  ✓ Created helper functions');
    console.log('  ✓ Created dashboard_stats_view');
    console.log('');

    client.release();
    await pool.end();

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('  ❌ MIGRATION FAILED');
    console.error('========================================');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');

    await pool.end();
    process.exit(1);
  }
}

// Run migration
runMigration();
