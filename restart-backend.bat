@echo off
echo.
echo ========================================
echo  Restarting Backend API Server
echo ========================================
echo.
echo Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
cd apps\api
start "Car Wash API" cmd /k "npm start"

echo.
echo ========================================
echo  Backend server is starting...
echo  Check the new terminal window
echo ========================================
echo.
pause
