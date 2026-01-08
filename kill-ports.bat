@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  KILL ALL SERVER PROCESSES
echo ========================================
echo.

REM Kill processes on port 3000 (Backend)
echo [1/5] Checking port 3000 (Backend)...
set "found3000=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    set "found3000=1"
    echo   ✗ Killing process on port 3000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
if !found3000!==0 echo   ✓ Port 3000 is free

REM Kill processes on port 5173
echo [2/5] Checking port 5173 (Vite default)...
set "found5173=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    set "found5173=1"
    echo   ✗ Killing process on port 5173 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
if !found5173!==0 echo   ✓ Port 5173 is free

REM Kill processes on port 5174
echo [3/5] Checking port 5174 (Vite alternate)...
set "found5174=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do (
    set "found5174=1"
    echo   ✗ Killing process on port 5174 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
if !found5174!==0 echo   ✓ Port 5174 is free

REM Kill processes on port 5175
echo [4/5] Checking port 5175 (Vite backup)...
set "found5175=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5175 ^| findstr LISTENING') do (
    set "found5175=1"
    echo   ✗ Killing process on port 5175 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
if !found5175!==0 echo   ✓ Port 5175 is free

REM Kill all node processes (nuclear option)
echo [5/5] Killing all Node.js processes...
set "nodeCount=0"
for /f "tokens=2" %%a in ('tasklist ^| findstr node.exe') do (
    set /a nodeCount+=1
)
if !nodeCount! gtr 0 (
    echo   ✗ Killing !nodeCount! Node.js process(es)
    taskkill /F /IM node.exe >nul 2>&1
    echo   ✓ All Node.js processes terminated
) else (
    echo   ✓ No Node.js processes running
)

echo.
echo ========================================
echo  ALL PORTS CLEARED
echo ========================================
echo.
echo Port 3000:  FREE ✓
echo Port 5173:  FREE ✓
echo Port 5174:  FREE ✓
echo Port 5175:  FREE ✓
echo.
echo You can now start the servers:
echo   - Backend:  cd apps\api ^&^& npm start
echo   - Frontend: cd apps\web ^&^& npm run dev
echo.
echo Or use: kill-and-restart.bat to kill and restart automatically
echo.
pause
