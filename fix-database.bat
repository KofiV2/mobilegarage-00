@echo off
color 0E
title Fix Database - total_price Column
echo.
echo ========================================
echo  DATABASE QUICK FIX
echo ========================================
echo.
echo This will help you fix the "total_price does not exist" error
echo.
echo INSTRUCTIONS:
echo.
echo 1. Open your Supabase Dashboard
echo 2. Go to "SQL Editor" (in the left sidebar)
echo 3. Click "New Query"
echo 4. Open the file: FIX_TOTAL_PRICE.sql
echo 5. Copy ALL the contents
echo 6. Paste into Supabase SQL Editor
echo 7. Click "Run" button
echo.
echo This will rename total_amount to total_price in the bookings table.
echo.
echo ========================================
echo.
echo Opening the SQL fix file for you...
echo.
pause

notepad FIX_TOTAL_PRICE.sql

echo.
echo ========================================
echo.
echo After running the SQL in Supabase:
echo.
echo 1. Restart your API server (stop.bat then start.bat)
echo 2. The error should be fixed!
echo.
echo ========================================
echo.
pause
