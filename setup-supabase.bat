@echo off
setlocal enabledelayedexpansion
color 0B
title In and Out Car Wash - Supabase Setup

echo.
echo ========================================
echo  IN AND OUT CAR WASH
echo  Supabase Database Setup
echo ========================================
echo.
echo  Database Name: INANDOUT
echo  Password: CuZ3QVFthRc3ZIoK
echo.
echo ========================================
echo.

echo This script will help you set up Supabase for your car wash system.
echo.

echo [STEP 1] Prerequisites Check
echo.
echo Have you created a Supabase project?
echo   1. Go to https://supabase.com
echo   2. Create a new project named "In and Out Car Wash"
echo   3. Use password: CuZ3QVFthRc3ZIoK
echo   4. Wait for project to be ready (2-3 minutes)
echo.
choice /C YN /M "Have you completed this step"
if %errorlevel% equ 2 (
    echo.
    echo Please create a Supabase project first.
    echo Visit: https://supabase.com
    echo.
    pause
    exit /b 1
)

echo.
echo [STEP 2] Get Your Supabase Credentials
echo.
echo You need to get these from your Supabase project:
echo   - Project URL (from Settings ^> API)
echo   - anon public key (from Settings ^> API)
echo   - service_role key (from Settings ^> API)
echo   - Connection string (from Settings ^> Database)
echo.
choice /C YN /M "Do you have these credentials ready"
if %errorlevel% equ 2 (
    echo.
    echo Please get your credentials from Supabase dashboard:
    echo   1. Go to your project settings
    echo   2. Click on "API" section
    echo   3. Copy the URL and keys
    echo   4. Click on "Database" section
    echo   5. Copy the connection string
    echo.
    pause
    exit /b 1
)

echo.
echo [STEP 3] Install Supabase Dependencies
echo.
echo Installing @supabase/supabase-js and pg...
echo.

cd apps\api
call npm install @supabase/supabase-js pg
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Failed to install Supabase dependencies!
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo.
color 0A
echo     Dependencies installed successfully!
echo.

echo [STEP 4] Configure Environment Variables
echo.
echo You need to update the .env file in apps/api/.env
echo.
echo Please open apps/api/.env and update:
echo   - SUPABASE_URL=https://your-project.supabase.co
echo   - SUPABASE_ANON_KEY=eyJ...
echo   - SUPABASE_SERVICE_ROLE_KEY=eyJ...
echo   - DATABASE_URL=postgresql://postgres:...
echo.
choice /C YN /M "Have you updated the .env file"
if %errorlevel% equ 2 (
    echo.
    echo Please update apps/api/.env file with your Supabase credentials.
    echo See SUPABASE_SETUP_GUIDE.md for detailed instructions.
    echo.
    notepad apps\api\.env
    echo.
    pause
)

echo.
echo [STEP 5] Run Database Schema
echo.
echo You need to run the schema.sql file in Supabase SQL Editor:
echo.
echo   1. Go to your Supabase project dashboard
echo   2. Click "SQL Editor" in the sidebar
echo   3. Click "New Query"
echo   4. Open the file: apps/api/database/schema.sql
echo   5. Copy ALL the contents
echo   6. Paste into Supabase SQL Editor
echo   7. Click "Run" (or press Ctrl+Enter)
echo   8. Wait for execution (5-10 seconds)
echo.
echo This will create all 36 tables for your car wash system!
echo.
choice /C YN /M "Have you run the schema.sql in Supabase"
if %errorlevel% equ 2 (
    echo.
    echo Please run the schema.sql file in Supabase SQL Editor.
    echo.
    echo Opening the schema file for you...
    notepad apps\api\database\schema.sql
    echo.
    echo Copy this entire file and paste it in Supabase SQL Editor.
    echo.
    pause
)

echo.
echo [STEP 6] Verify Setup
echo.
echo Let's verify your Supabase setup:
echo.
echo   1. Go to "Table Editor" in Supabase dashboard
echo   2. You should see 36 tables
echo   3. Check the "users" table - should have 3 default users
echo   4. Check the "services" table - should have 4 default services
echo.
choice /C YN /M "Can you see all the tables in Supabase"
if %errorlevel% equ 2 (
    color 0E
    echo.
    echo WARNING: Tables might not have been created successfully.
    echo Please run the schema.sql again in Supabase SQL Editor.
    echo.
    pause
    exit /b 1
)

echo.
color 0A
echo ========================================
echo  SUPABASE SETUP COMPLETED!
echo ========================================
echo.
echo  Database: INANDOUT
echo  Tables: 36 (All created!)
echo  Status: Ready to use
echo.
echo  Your system is now connected to Supabase!
echo.
echo  Next steps:
echo  1. Run start.bat to start all services
echo  2. Test the API connection
echo  3. Start building your car wash empire!
echo.
echo  Default Login Credentials:
echo  - Admin:    admin@carwash.com / admin123
echo  - Staff:    staff@carwash.com / staff123
echo  - Customer: customer@test.com / customer123
echo.
echo  Note: Passwords are placeholders - you need to hash them
echo        See SUPABASE_SETUP_GUIDE.md for instructions
echo.
echo ========================================
echo.
echo  For detailed guide, see:
echo  SUPABASE_SETUP_GUIDE.md
echo.
echo ========================================
echo.

pause
endlocal
