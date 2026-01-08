@echo off
setlocal enabledelayedexpansion
color 0C
title In and Out Car Wash - Shutdown Manager

echo.
echo ========================================
echo  IN AND OUT CAR WASH
echo  Shutdown Manager
echo ========================================
echo.

echo Stopping all services...
echo.

:: Kill all Node.js processes
echo [1/5] Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo     Node.js processes stopped!
) else (
    echo     No Node.js processes found.
)

:: Kill specific ports just to be sure
echo [2/5] Freeing port 3000 (API)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo     Port 3000 freed!
)

echo [3/5] Freeing port 5173 (Web)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo     Port 5173 freed!
)

echo [4/5] Freeing port 19000-19001 (Expo)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :19000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :19001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
    echo     Expo ports freed!
)

:: Clean up any PID files
echo [5/5] Cleaning up...
if exist ".pids" del .pids
echo     Cleanup complete!

echo.
color 0A
echo ========================================
echo  ALL SERVICES STOPPED SUCCESSFULLY!
echo ========================================
echo.
echo  All ports are now free.
echo  You can run start.bat again to restart.
echo.
echo ========================================
echo.

pause
endlocal
