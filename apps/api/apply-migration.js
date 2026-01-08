#!/usr/bin/env node

/**
 * Database Migration Script
 * Applies migration 006_database_schema_completion.sql to Supabase PostgreSQL
 */

require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(70), 'cyan');
  log(title, 'bright');
  log('='.repeat(70), 'cyan');
}

async function applyMigration() {
  logSection('🚀 Database Schema Update - Migration 006');

  // Validate environment variables
  if (!process.env.DATABASE_URL) {
    log('❌ ERROR: DATABASE_URL not found in .env file', 'red');
    log('Please configure your Supabase database connection.', 'yellow');
    process.exit(1);
  }

  // Create database pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase
    },
  });

  try {
    // Test connection
    log('\n[1/5] Testing database connection...', 'cyan');
    const testResult = await pool.query('SELECT NOW()');
    log(`✅ Connected to database at ${testResult.rows[0].now}`, 'green');

    // Check current schema version
    log('\n[2/5] Checking current schema version...', 'cyan');
    try {
      const versionResult = await pool.query(
        'SELECT version, description, applied_at FROM schema_version ORDER BY applied_at DESC LIMIT 1'
      );
      if (versionResult.rows.length > 0) {
        const current = versionResult.rows[0];
        log(`   Current version: ${current.version}`, 'blue');
        log(`   Description: ${current.description}`, 'blue');
        log(`   Applied: ${current.applied_at}`, 'blue');
      }
    } catch (err) {
      log('   No schema_version table found (will be created)', 'yellow');
    }

    // Read migration file
    log('\n[3/5] Reading migration file...', 'cyan');
    const migrationPath = path.join(__dirname, 'database', 'migrations', '006_database_schema_completion.sql');

    if (!fs.existsSync(migrationPath)) {
      log(`❌ Migration file not found: ${migrationPath}`, 'red');
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    log(`✅ Loaded migration (${migrationSQL.length} bytes)`, 'green');

    // Apply migration
    log('\n[4/5] Applying migration...', 'cyan');
    log('   This may take a few moments...', 'yellow');

    await pool.query(migrationSQL);
    log('✅ Migration executed successfully!', 'green');

    // Verify changes
    log('\n[5/5] Verifying changes...', 'cyan');

    const verifications = [
      {
        name: 'Users.total_bookings',
        query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_bookings'",
      },
      {
        name: 'Services.total_bookings',
        query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'total_bookings'",
      },
      {
        name: 'Services.total_revenue',
        query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'total_revenue'",
      },
      {
        name: 'Bookings.queue_position',
        query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'queue_position'",
      },
      {
        name: 'Notifications table',
        query: "SELECT table_name FROM information_schema.tables WHERE table_name = 'notifications'",
      },
      {
        name: 'Service_history view',
        query: "SELECT table_name FROM information_schema.views WHERE table_name = 'service_history'",
      },
      {
        name: 'Dashboard materialized view',
        query: "SELECT matviewname FROM pg_matviews WHERE matviewname = 'dashboard_stats_materialized'",
      },
    ];

    for (const check of verifications) {
      const result = await pool.query(check.query);
      const exists = result.rows.length > 0;
      const status = exists ? '✅' : '❌';
      const color = exists ? 'green' : 'red';
      log(`   ${status} ${check.name}`, color);
    }

    // Get updated schema version
    const newVersionResult = await pool.query(
      'SELECT version, description FROM schema_version ORDER BY applied_at DESC LIMIT 1'
    );

    logSection('✅ Migration Completed Successfully!');
    log(`\n   New Schema Version: ${newVersionResult.rows[0].version}`, 'green');
    log(`   ${newVersionResult.rows[0].description}\n`, 'blue');

    log('📋 Changes Applied:', 'cyan');
    log('   • Users.total_bookings counter (auto-updated via trigger)', 'blue');
    log('   • Services.total_bookings counter (auto-updated via trigger)', 'blue');
    log('   • Services.total_revenue tracker (auto-updated via trigger)', 'blue');
    log('   • Bookings.queue_position field for queue management', 'blue');
    log('   • Notifications table with RLS policies', 'blue');
    log('   • Service_history view (alias for vehicle_care_history)', 'blue');
    log('   • Dashboard materialized view (ultra-fast queries)', 'blue');
    log('   • Auto-update triggers for counters', 'blue');
    log('   • Notification functions (create, mark_read, get_unread_count)', 'blue');
    log('   • Performance indexes on all new columns', 'blue');

    log('\n💡 Next Steps:', 'yellow');
    log('   1. Restart your API server to use the new schema', 'blue');
    log('   2. Test the admin dashboard to verify stats are working', 'blue');
    log('   3. Create a test booking to verify auto-notifications', 'blue');
    log('   4. Check that counters update automatically\n', 'blue');

  } catch (error) {
    logSection('❌ Migration Failed');
    log(`\nError: ${error.message}`, 'red');
    if (error.detail) {
      log(`\nDetail: ${error.detail}`, 'yellow');
    }
    if (error.hint) {
      log(`\nHint: ${error.hint}`, 'yellow');
    }
    log('\nFull error:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
applyMigration();
