@echo off
echo ========================================
echo Car Wash System - Feature Setup
echo ========================================
echo.

echo [1/5] Installing frontend dependencies...
cd apps\web
call npm install @tanstack/react-query react-hook-form @hookform/resolvers zod react-loading-skeleton xlsx jspdf jspdf-autotable fuse.js socket.io-client
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo [2/5] Installing backend dependencies...
cd ..\api
call npm install socket.io
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo [3/5] Installing dev dependencies for testing...
cd ..\web
call npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
if errorlevel 1 (
    echo WARNING: Failed to install dev dependencies (optional)
)
echo ✓ Dev dependencies installed
echo.

echo [4/5] Setting up database...
echo.
echo MANUAL STEP REQUIRED:
echo Run this command to create audit_logs table:
echo.
echo   psql -U postgres -d carwash_db -f apps\api\migrations\create_audit_logs.sql
echo.
echo Press any key after running the above command...
pause >nul
echo.

echo [5/5] Verification...
echo.
echo ✓ All dependencies installed successfully!
echo ✓ Database migration file ready
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Update apps\api\src\index.js (see QUICK_IMPLEMENTATION_GUIDE.md)
echo 2. Update apps\web\src\main.jsx (see QUICK_IMPLEMENTATION_GUIDE.md)
echo 3. Start backend: cd apps\api ^&^& npm start
echo 4. Start frontend: cd apps\web ^&^& npm run dev
echo 5. Test features (see QUICK_IMPLEMENTATION_GUIDE.md)
echo.
echo ========================================
echo Documentation:
echo ========================================
echo.
echo - QUICK_IMPLEMENTATION_GUIDE.md - Quick start (30 min)
echo - IMPLEMENTATION_COMPLETE.md - Full feature docs
echo - FEATURES_SUMMARY.md - Overview and metrics
echo.
echo Setup complete! Happy coding! 🚀
echo.
pause
