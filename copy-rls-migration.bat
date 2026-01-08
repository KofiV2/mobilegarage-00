@echo off
echo ========================================
echo Copy RLS Migration to Clipboard
echo ========================================
echo.
echo This will copy the RLS migration SQL to your clipboard.
echo You can then paste it directly into Supabase SQL Editor.
echo.
echo Press any key to copy...
pause > nul

type "apps\api\database\migrations\007_enable_row_level_security.sql" | clip

echo.
echo ✅ Migration SQL copied to clipboard!
echo.
echo Next steps:
echo 1. Go to https://supabase.com/dashboard
echo 2. Select your project
echo 3. Go to SQL Editor (left sidebar)
echo 4. Click "New Query"
echo 5. Press Ctrl+V to paste
echo 6. Click "Run" button
echo.
echo The migration will apply all security policies!
echo.
pause
