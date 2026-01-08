@echo off
setlocal enabledelayedexpansion
color 0B
title In and Out Car Wash - Status Checker

echo.
echo ========================================
echo  IN AND OUT CAR WASH
echo  System Status Checker
echo ========================================
echo.

:: Check Node.js
echo [System Requirements]
echo.
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js: Installed
    for /f "tokens=*" %%i in ('node --version') do echo     Version: %%i
) else (
    echo [X]  Node.js: NOT FOUND
)

:: Check npm
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] npm: Installed
    for /f "tokens=*" %%i in ('npm --version') do echo     Version: %%i
) else (
    echo [X]  npm: NOT FOUND
)

:: Check MongoDB
mongod --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MongoDB: Installed
) else (
    echo [X]  MongoDB: NOT FOUND
)

echo.
echo [Port Status]
echo.

:: Check port 3000 (API)
netstat -an | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [RUNNING] Port 3000: API Server
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
        echo           PID: %%a
    )
) else (
    echo [STOPPED] Port 3000: API Server
)

:: Check port 5173 (Web)
netstat -an | findstr :5173 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [RUNNING] Port 5173: Web App
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
        echo           PID: %%a
    )
) else (
    echo [STOPPED] Port 5173: Web App
)

:: Check port 19000 (Expo)
netstat -an | findstr :19000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [RUNNING] Port 19000: Expo DevTools
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :19000 ^| findstr LISTENING') do (
        echo           PID: %%a
    )
) else (
    echo [STOPPED] Port 19000: Expo DevTools
)

echo.
echo [Dependencies]
echo.

:: Check root node_modules
if exist "node_modules\" (
    echo [OK] Root dependencies installed
) else (
    echo [X]  Root dependencies missing
)

:: Check API node_modules
if exist "apps\api\node_modules\" (
    echo [OK] API dependencies installed
) else (
    echo [X]  API dependencies missing
)

:: Check Web node_modules
if exist "apps\web\node_modules\" (
    echo [OK] Web dependencies installed
) else (
    echo [X]  Web dependencies missing
)

:: Check Mobile node_modules
if exist "apps\mobile\node_modules\" (
    echo [OK] Mobile dependencies installed
) else (
    echo [X]  Mobile dependencies missing
)

echo.
echo [Database]
echo.

:: Check if seed file exists
if exist "apps\api\seed.js" (
    echo [OK] Seed file found
) else (
    echo [X]  Seed file missing
)

echo.
echo [URLs]
echo.
echo  API:    http://localhost:3000
echo  Web:    http://localhost:5173
echo  Mobile: Expo DevTools (scan QR code)
echo.

echo ========================================
echo.

pause
endlocal
