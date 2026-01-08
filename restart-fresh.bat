@echo off
setlocal enabledelayedexpansion

title CarWash System - Fresh Restart

echo.
echo  ███████╗██████╗ ███████╗███████╗██╗  ██╗    ███████╗████████╗ █████╗ ██████╗ ████████╗
echo  ██╔════╝██╔══██╗██╔════╝██╔════╝██║  ██║    ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝
echo  █████╗  ██████╔╝█████╗  ███████╗███████║    ███████╗   ██║   ███████║██████╔╝   ██║
echo  ██╔══╝  ██╔══██╗██╔══╝  ╚════██║██╔══██║    ╚════██║   ██║   ██╔══██║██╔══██╗   ██║
echo  ██║     ██║  ██║███████╗███████║██║  ██║    ███████║   ██║   ██║  ██║██║  ██║   ██║
echo  ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝    ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝
echo.
echo ================================================================================
echo  CarWash Management System - Fresh Restart Script
echo ================================================================================
echo.

REM Step 1: Kill all existing processes
echo [STEP 1/4] Terminating existing processes...
echo.

echo   → Killing processes on port 3000 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo     ✓ Killed PID %%a
    )
)

echo   → Killing processes on port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo     ✓ Killed PID %%a
    )
)

echo   → Killing processes on port 5174...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo     ✓ Killed PID %%a
    )
)

echo   → Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo     ✓ All Node.js processes terminated
) else (
    echo     ℹ No Node.js processes were running
)

echo.
echo   ✅ Step 1 Complete: All processes terminated
timeout /t 2 /nobreak >nul

REM Step 2: Verify ports are free
echo.
echo [STEP 2/4] Verifying ports are available...
echo.

set "port_issues=0"

REM Check port 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if !errorlevel! equ 0 (
    echo   ✗ Port 3000 still in use!
    set /a port_issues+=1
) else (
    echo   ✓ Port 3000 is available
)

REM Check port 5173
netstat -ano | findstr :5173 | findstr LISTENING >nul 2>&1
if !errorlevel! equ 0 (
    echo   ✗ Port 5173 still in use!
    set /a port_issues+=1
) else (
    echo   ✓ Port 5173 is available
)

if !port_issues! gtr 0 (
    echo.
    echo   ⚠️  Warning: Some ports are still in use. Waiting 3 more seconds...
    timeout /t 3 /nobreak >nul
) else (
    echo.
    echo   ✅ Step 2 Complete: All ports available
)

REM Step 3: Start Backend
echo.
echo [STEP 3/4] Starting Backend Server...
echo.
cd apps\api
echo   → Starting on http://localhost:3000
start "🚀 CarWash Backend (Port 3000)" cmd /k "echo Starting Backend... && npm start"
cd ..\..

echo   ⏳ Waiting 4 seconds for backend to initialize...
timeout /t 4 /nobreak >nul
echo   ✅ Step 3 Complete: Backend started

REM Step 4: Start Frontend
echo.
echo [STEP 4/4] Starting Frontend Server...
echo.
cd apps\web
echo   → Starting on http://localhost:5173 (or next available port)
start "🌐 CarWash Frontend (Vite)" cmd /k "echo Starting Frontend... && npm run dev"
cd ..\..

echo   ⏳ Waiting 3 seconds for frontend to initialize...
timeout /t 3 /nobreak >nul
echo   ✅ Step 4 Complete: Frontend started

REM Final Status
echo.
echo ================================================================================
echo  ✅ FRESH START COMPLETE!
echo ================================================================================
echo.
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5173 (check terminal if using 5174)
echo.
echo  📊 Admin Panel:     http://localhost:5173/admin/dashboard
echo  👤 Staff Panel:     http://localhost:5173/staff/dashboard
echo  🏠 Customer Portal: http://localhost:5173/dashboard
echo.
echo  🔑 Test Credentials (see credentials.txt):
echo     Admin:    admin@test.com / admin123
echo     Staff:    staff@test.com / staff123
echo     Customer: customer@test.com / customer123
echo.
echo ================================================================================
echo.
echo  ℹ️  Two new terminal windows have opened:
echo     • Backend terminal (npm start)
echo     • Frontend terminal (npm run dev)
echo.
echo  ℹ️  You can now close this window or press any key...
echo.
pause >nul
