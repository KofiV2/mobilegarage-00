@echo off
color 0B
title System Check - In and Out Car Wash
echo.
echo ========================================
echo  SYSTEM CHECK
echo ========================================
echo.
echo Checking if all fixes have been applied...
echo.

echo [1/5] Checking API Server...
netstat -an | findstr ":3000" > nul
if %errorlevel% equ 0 (
    color 0A
    echo  ✓ API Server is running on port 3000
) else (
    color 0C
    echo  ✗ API Server is NOT running
    echo    Run: start.bat
)

echo.
echo [2/5] Checking Web Server...
netstat -an | findstr ":5173" > nul
if %errorlevel% equ 0 (
    color 0A
    echo  ✓ Web Server is running on port 5173
) else (
    color 0C
    echo  ✗ Web Server is NOT running
    echo    Run: start.bat
)

echo.
echo [3/5] Checking Configuration Files...
if exist "apps\web\.env" (
    color 0A
    echo  ✓ Web .env file exists
) else (
    color 0E
    echo  ⚠ Web .env file missing
    echo    Copy apps\web\.env.example to apps\web\.env
)

if exist "apps\api\.env" (
    color 0A
    echo  ✓ API .env file exists
) else (
    color 0C
    echo  ✗ API .env file missing
    echo    See SUPABASE_SETUP_GUIDE.md
)

echo.
echo [4/5] Checking Fix Files...
if exist "FIX_TOTAL_PRICE.sql" (
    color 0A
    echo  ✓ Database fix file exists
) else (
    color 0E
    echo  ⚠ Database fix file missing (might be already applied)
)

echo.
echo [5/5] Checking Documentation...
if exist "QUICK_FIX_GUIDE.md" (
    color 0A
    echo  ✓ Quick fix guide available
) else (
    color 0C
    echo  ✗ Documentation missing
)

echo.
echo ========================================
echo  NEXT STEPS
echo ========================================
echo.
echo 1. If servers are running:
echo    → Open http://localhost:5173
echo    → Login and test the system
echo.
echo 2. If servers are NOT running:
echo    → Run: start.bat
echo.
echo 3. If database errors occur:
echo    → Run: fix-database.bat
echo    → Or manually run FIX_TOTAL_PRICE.sql in Supabase
echo.
echo 4. For network access:
echo    → Read: QUICK_FIX_GUIDE.md
echo.
echo 5. For complete details:
echo    → Read: FIXES_SUMMARY_2024-12-31.md
echo.
echo ========================================
echo.

pause
