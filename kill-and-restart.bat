@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  KILL AND RESTART SERVERS
echo ========================================
echo.

REM Kill processes on port 3000 (Backend)
echo [1/4] Killing processes on port 3000 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo   - Killing PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill processes on port 5173 (Frontend - Vite default)
echo [2/4] Killing processes on port 5173 (Frontend - Vite)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo   - Killing PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill processes on port 5174 (Frontend - Vite alternate)
echo [3/4] Killing processes on port 5174 (Frontend - Vite alternate)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do (
    echo   - Killing PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill all node processes (safer approach)
echo [4/4] Killing all node.exe processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo ✅ All processes killed successfully!
echo.
echo Waiting 2 seconds for ports to be released...
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo  STARTING SERVERS
echo ========================================
echo.

REM Start Backend
echo [1/2] Starting Backend on port 3000...
cd apps\api
start "CarWash Backend" cmd /k "npm start"
cd ..\..

REM Wait for backend to start
echo   Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [2/2] Starting Frontend...
cd apps\web
start "CarWash Frontend" cmd /k "npm run dev"
cd ..\..

echo.
echo ========================================
echo  SERVERS STARTED
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173 or 5174
echo.
echo Check the terminal windows for startup logs.
echo.
echo Press any key to exit this window...
pause >nul
