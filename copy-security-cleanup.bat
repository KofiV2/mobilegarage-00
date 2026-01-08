@echo off
echo ========================================
echo Copy SECURITY CLEANUP Migration
echo ========================================
echo.
echo This migration fixes the remaining security warnings:
echo   1. SECURITY DEFINER view issue
echo   2. RLS not enabled on AI/advanced tables
echo   3. Function search_path warnings
echo   4. Tables with RLS but no policies
echo.
echo Press any key to copy...
pause > nul

type "apps\api\database\migrations\009_security_cleanup_fixed.sql" | clip

echo.
echo ✅ Security cleanup migration copied to clipboard!
echo.
echo Next steps:
echo 1. Go to https://supabase.com/dashboard
echo 2. Select your project
echo 3. Go to SQL Editor
echo 4. Click "New Query"
echo 5. Press Ctrl+V to paste
echo 6. Click "Run"
echo.
echo This will fix:
echo   ✓ service_history SECURITY DEFINER warning
echo   ✓ ai_assistants RLS warning
echo   ✓ gamification RLS warning
echo   ✓ customer_retention policy warning
echo   ✓ Function search_path warnings
echo   ✓ All other remaining security issues
echo.
pause
