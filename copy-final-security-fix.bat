@echo off
echo ========================================
echo Copy FINAL SECURITY FIX Migration
echo ========================================
echo.
echo This is the FINAL security fix for ALL remaining warnings:
echo.
echo Fixes:
echo   ✓ service_history SECURITY DEFINER issue
echo   ✓ schema_version table RLS
echo   ✓ staff_car_washes table RLS
echo   ✓ fleet_vehicle_washes table RLS
echo   ✓ staff_daily_stats table RLS
echo   ✓ fleet_vehicle_daily_stats table RLS
echo   ✓ is_admin function search_path
echo   ✓ is_staff function search_path
echo   ✓ update_staff_daily_stats search_path
echo   ✓ update_fleet_daily_stats search_path
echo   ✓ ALL other function search_paths
echo.
echo Press any key to copy...
pause > nul

type "apps\api\database\migrations\010_final_security_fix.sql" | clip

echo.
echo ✅ Final security fix migration copied to clipboard!
echo.
echo Next steps:
echo 1. Go to https://supabase.com/dashboard
echo 2. Select your project
echo 3. Go to SQL Editor
echo 4. Click "New Query"
echo 5. Press Ctrl+V to paste
echo 6. Click "Run"
echo.
echo Expected result:
echo   🎉 ALL SECURITY WARNINGS RESOLVED!
echo   Zero warnings in Supabase Advisors
echo.
pause
