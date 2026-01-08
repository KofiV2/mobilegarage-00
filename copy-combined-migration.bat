@echo off
echo ========================================
echo Copy COMBINED Migration to Clipboard
echo ========================================
echo.
echo This migration includes BOTH:
echo   1. Schema updates (counters, notifications)
echo   2. Row Level Security (RLS policies)
echo.
echo This will fix:
echo   - Missing tables (notifications, analytics_snapshots)
echo   - All 33 security warnings
echo.
echo Press any key to copy...
pause > nul

type "apps\api\database\migrations\008_combined_schema_and_rls.sql" | clip

echo.
echo ✅ Combined migration copied to clipboard!
echo.
echo Next steps:
echo 1. Go to https://supabase.com/dashboard
echo 2. Select your project
echo 3. Go to SQL Editor (left sidebar)
echo 4. Click "New Query"
echo 5. Press Ctrl+V to paste
echo 6. Click "Run" button
echo.
echo This will:
echo   ✓ Add all missing database fields
echo   ✓ Create notifications table
echo   ✓ Enable RLS on all tables
echo   ✓ Fix all security warnings
echo.
echo Expected time: 10-30 seconds
echo.
pause
