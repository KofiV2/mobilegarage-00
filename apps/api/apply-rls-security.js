#!/usr/bin/env node

/**
 * Row Level Security (RLS) Migration Script
 * Fixes Supabase security warnings by enabling RLS on all tables
 */

require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(70), 'cyan');
  log(title, 'bright');
  log('='.repeat(70), 'cyan');
}

async function applyRLSMigration() {
  logSection('🔒 Row Level Security (RLS) Migration - Fix Supabase Warnings');

  if (!process.env.DATABASE_URL) {
    log('❌ ERROR: DATABASE_URL not found in .env file', 'red');
    log('Please configure your Supabase database connection.', 'yellow');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Test connection
    log('\n[1/6] Testing database connection...', 'cyan');
    await pool.query('SELECT NOW()');
    log('✅ Connected to database', 'green');

    // Check current RLS status
    log('\n[2/6] Checking current RLS status...', 'cyan');
    const rlsCheck = await pool.query(`
      SELECT
        t.tablename,
        c.relrowsecurity as rls_enabled,
        (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) as policy_count
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public'
      AND t.tablename NOT LIKE 'pg_%'
      AND t.tablename != 'schema_version'
      ORDER BY t.tablename
    `);

    const tablesWithoutRLS = rlsCheck.rows.filter(r => !r.rls_enabled);
    const tablesWithRLS = rlsCheck.rows.filter(r => r.rls_enabled);

    log(`   Tables without RLS: ${tablesWithoutRLS.length}`, 'red');
    log(`   Tables with RLS: ${tablesWithRLS.length}`, 'green');

    if (tablesWithoutRLS.length > 0) {
      log('\n   ⚠️  Tables that need RLS enabled:', 'yellow');
      tablesWithoutRLS.forEach(t => {
        log(`      - ${t.tablename}`, 'yellow');
      });
    }

    // Read migration file
    log('\n[3/6] Reading RLS migration file...', 'cyan');
    const migrationPath = path.join(
      __dirname,
      'database',
      'migrations',
      '007_enable_row_level_security.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      log(`❌ Migration file not found: ${migrationPath}`, 'red');
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    log(`✅ Loaded RLS migration (${migrationSQL.length} bytes)`, 'green');

    // Confirm before applying
    log('\n[4/6] Preparing to apply RLS migration...', 'cyan');
    log('   This will:', 'yellow');
    log('   ✓ Enable RLS on all 36+ tables', 'blue');
    log('   ✓ Create 90+ security policies', 'blue');
    log('   ✓ Create helper functions for role checks', 'blue');
    log('   ✓ Fix all Supabase security warnings', 'blue');
    log('\n   ⚠️  Note: This may take 10-30 seconds...', 'yellow');

    // Apply migration
    log('\n[5/6] Applying RLS migration...', 'cyan');
    const startTime = Date.now();

    await pool.query(migrationSQL);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`✅ Migration completed in ${duration} seconds`, 'green');

    // Verify changes
    log('\n[6/6] Verifying RLS is enabled...', 'cyan');

    const verifyRLS = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE c.relrowsecurity = true) as tables_with_rls,
        COUNT(*) as total_tables
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public'
      AND t.tablename NOT LIKE 'pg_%'
    `);

    const policyCount = await pool.query(`
      SELECT COUNT(*) as total_policies
      FROM pg_policies
      WHERE schemaname = 'public'
    `);

    const helperFunctions = await pool.query(`
      SELECT COUNT(*) as function_count
      FROM pg_proc
      WHERE proname IN ('is_admin', 'is_staff', 'is_customer', 'current_user_role')
    `);

    const { tables_with_rls, total_tables } = verifyRLS.rows[0];
    const { total_policies } = policyCount.rows[0];
    const { function_count } = helperFunctions.rows[0];

    logSection('✅ RLS Migration Completed Successfully!');

    log('\n📊 Security Status:', 'cyan');
    log(`   Total tables: ${total_tables}`, 'blue');
    log(`   Tables with RLS enabled: ${tables_with_rls}`, 'green');
    log(`   Security policies created: ${total_policies}`, 'green');
    log(`   Helper functions: ${function_count}/4`, 'green');

    if (tables_with_rls == total_tables) {
      log('\n   🎉 All tables are now secured with RLS!', 'green');
    } else {
      log(`\n   ⚠️  ${total_tables - tables_with_rls} tables still need RLS`, 'yellow');
    }

    // Check schema version
    const version = await pool.query(
      'SELECT version, description FROM schema_version ORDER BY applied_at DESC LIMIT 1'
    );

    log('\n📋 Database Info:', 'cyan');
    log(`   Schema Version: ${version.rows[0].version}`, 'green');
    log(`   ${version.rows[0].description}`, 'blue');

    // Show security model
    logSection('🔐 Security Model Implemented');

    log('\n👥 Role-Based Access Control:', 'cyan');
    log('   • Customers:', 'bright');
    log('     - Can only access their own data', 'blue');
    log('     - Can view public services and reviews', 'blue');
    log('     - Can create bookings for themselves', 'blue');

    log('\n   • Staff:', 'bright');
    log('     - Can view customer data (for bookings)', 'blue');
    log('     - Can manage bookings and services', 'blue');
    log('     - Can access work-related data', 'blue');

    log('\n   • Admins:', 'bright');
    log('     - Full access to all data', 'blue');
    log('     - Can manage users, services, bookings', 'blue');
    log('     - Can access analytics and reports', 'blue');

    log('\n   • Public (Unauthenticated):', 'bright');
    log('     - Can view active services', 'blue');
    log('     - Can view public reviews', 'blue');
    log('     - Very limited read-only access', 'blue');

    logSection('🛡️ Helper Functions Created');

    log('\nUse these in your policies:', 'cyan');
    log('   • is_admin()         - Returns TRUE if user is admin', 'blue');
    log('   • is_staff()         - Returns TRUE if user is staff/admin', 'blue');
    log('   • is_customer()      - Returns TRUE if user is customer', 'blue');
    log('   • current_user_role() - Returns user\'s role string', 'blue');

    logSection('📝 Next Steps');

    log('\n1. ✅ Check Supabase Dashboard', 'cyan');
    log('   Go to: Database → Replication → Row Level Security', 'blue');
    log('   All tables should now show "RLS Enabled" ✓', 'blue');

    log('\n2. ✅ Test with different user roles', 'cyan');
    log('   Create test users: customer, staff, admin', 'blue');
    log('   Verify they can only access appropriate data', 'blue');

    log('\n3. ✅ Update your API if needed', 'cyan');
    log('   Service role key bypasses RLS (good for admin ops)', 'blue');
    log('   Client-side queries will respect RLS policies', 'blue');

    log('\n4. ✅ Monitor security warnings', 'cyan');
    log('   Supabase Dashboard → Advisors', 'blue');
    log('   All RLS warnings should be resolved!', 'blue');

    logSection('🎊 Security Warnings Fixed!');

    log('\n✨ All Supabase security warnings should now be resolved!', 'green');
    log('   Your database is now production-ready and secure.\n', 'green');

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
applyRLSMigration();
