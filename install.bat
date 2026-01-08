@echo off
setlocal enabledelayedexpansion
color 0B
title In and Out Car Wash - Installation Manager

echo.
echo ========================================
echo  IN AND OUT CAR WASH
echo  Installation Manager
echo ========================================
echo.

:: Check for Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js 18+ from: https://nodejs.org/
    echo After installation, run this script again.
    pause
    exit /b 1
)
echo     Node.js found!
for /f "tokens=*" %%i in ('node --version') do echo     Version: %%i

:: Check for npm
echo [2/5] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)
echo     npm found!
for /f "tokens=*" %%i in ('npm --version') do echo     Version: %%i

:: Install root dependencies
echo [3/5] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Failed to install root dependencies!
    pause
    exit /b 1
)
echo     Root dependencies installed!

:: Install API dependencies
echo [4/5] Installing API dependencies...
cd apps\api
call npm install
if %errorlevel% neq 0 (
    cd ..\..
    color 0C
    echo ERROR: Failed to install API dependencies!
    pause
    exit /b 1
)
cd ..\..
echo     API dependencies installed!

:: Install Web dependencies
echo     Installing Web dependencies...
cd apps\web
call npm install
if %errorlevel% neq 0 (
    cd ..\..
    color 0C
    echo ERROR: Failed to install Web dependencies!
    pause
    exit /b 1
)
cd ..\..
echo     Web dependencies installed!

:: Install Mobile dependencies
echo     Installing Mobile dependencies...
cd apps\mobile
call npm install
if %errorlevel% neq 0 (
    cd ..\..
    color 0C
    echo ERROR: Failed to install Mobile dependencies!
    pause
    exit /b 1
)
cd ..\..
echo     Mobile dependencies installed!

:: Seed database
echo [5/5] Database setup...
choice /C YN /M "Do you want to seed the database now"
if !errorlevel! equ 1 (
    echo     Seeding database...
    cd apps\api
    node seed.js
    if %errorlevel% neq 0 (
        cd ..\..
        color 0E
        echo WARNING: Database seeding failed!
        echo Make sure MongoDB is running and try again.
    ) else (
        echo     Database seeded successfully!
    )
    cd ..\..
)

echo.
color 0A
echo ========================================
echo  INSTALLATION COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo  Next steps:
echo  1. Make sure MongoDB is running
echo  2. Run start.bat to start all services
echo  3. Access:
echo     - API:    http://localhost:3000
echo     - Web:    http://localhost:5173
echo     - Mobile: Scan QR with Expo Go app
echo.
echo  Default Login:
echo  - Admin:    admin@carwash.com / admin123
echo  - Staff:    staff@carwash.com / staff123
echo  - Customer: customer@test.com / customer123
echo.
echo ========================================
echo.

pause
endlocal
