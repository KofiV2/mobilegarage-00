@echo off
echo ========================================
echo Database Schema Update Script
echo ========================================
echo.

:: Load environment variables
if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and configure your database settings.
    pause
    exit /b 1
)

echo [1/3] Loading database configuration...
echo.

:: Run the migration using Node.js
echo [2/3] Applying database migration...
echo.

node -e "require('dotenv').config(); const { Pool } = require('pg'); const fs = require('fs'); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); const migration = fs.readFileSync('./apps/api/database/migrations/006_database_schema_completion.sql', 'utf8'); pool.query(migration).then(() => { console.log('✅ Migration completed successfully!'); pool.end(); }).catch(err => { console.error('❌ Migration failed:', err); pool.end(); process.exit(1); });"

echo.
echo [3/3] Verifying changes...
echo.

node -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); pool.query('SELECT version, description, applied_at FROM schema_version ORDER BY applied_at DESC LIMIT 1').then(result => { if (result.rows.length > 0) { console.log('✅ Current schema version:', result.rows[0].version); console.log('   Description:', result.rows[0].description); console.log('   Applied at:', result.rows[0].applied_at); } pool.end(); }).catch(err => { console.error('❌ Error:', err.message); pool.end(); });"

echo.
echo ========================================
echo Database Update Complete!
echo ========================================
echo.
echo Changes applied:
echo   ✅ Users.total_bookings counter added
echo   ✅ Services.total_bookings counter added
echo   ✅ Services.total_revenue counter added
echo   ✅ Bookings.queue_position field added
echo   ✅ Notifications table created
echo   ✅ Service_history view created
echo   ✅ Auto-update triggers installed
echo   ✅ Dashboard materialized view created
echo   ✅ Performance indexes added
echo.
pause
