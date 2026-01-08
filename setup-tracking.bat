@echo off
echo ========================================
echo   CAR WASH TRACKING SYSTEM SETUP
echo ========================================
echo.

echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo OK - Node.js is installed
echo.

echo [2/3] Testing database connection...
node apps/api/test-tracking-system.js
if errorlevel 1 (
    echo.
    echo ERROR: Database test failed!
    echo.
    echo Please make sure:
    echo 1. You ran the migration: 004_add_car_wash_tracking.sql
    echo 2. Your .env file has correct Supabase credentials
    echo 3. Your internet connection is working
    echo.
    pause
    exit /b 1
)
echo.

echo [3/3] All tests passed!
echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo The tracking system is ready to use!
echo.
echo Next steps:
echo 1. Read: CAR_WASH_TRACKING_GUIDE.md
echo 2. Start API: cd apps/api ^&^& npm start
echo 3. Test endpoints using the guide
echo.
echo API Endpoints:
echo - POST /api/tracking/staff/:employeeId/start-wash
echo - PUT  /api/tracking/staff/wash/:washId/complete
echo - GET  /api/tracking/staff/:employeeId/stats
echo - GET  /api/tracking/staff/leaderboard
echo - GET  /api/tracking/dashboard
echo.
pause
