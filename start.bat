@echo off
echo ========================================
echo  IN AND OUT CAR WASH - STARTUP SCRIPT
echo ========================================
echo.

REM Kill processes on common ports
echo [1/4] Killing processes on ports 3000, 5173, 8081, 19000, 19001...
echo.

REM Kill port 3000 (API)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a 2>nul
)

REM Kill port 5173 (Web/Vite)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /F /PID %%a 2>nul
)

REM Kill port 8081 (Metro/Expo)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081') do (
    taskkill /F /PID %%a 2>nul
)

REM Kill port 19000 (Expo DevTools)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :19000') do (
    taskkill /F /PID %%a 2>nul
)

REM Kill port 19001 (Expo)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :19001') do (
    taskkill /F /PID %%a 2>nul
)

echo Ports cleared!
echo.

echo [2/4] Starting API Server...
echo.
start "CarWash API" cmd /k "cd apps\api && npm start"

timeout /t 3 /nobreak >nul

echo [3/4] Starting Web App...
echo.
start "CarWash Web" cmd /k "cd apps\web && npm run dev"

timeout /t 2 /nobreak >nul

echo [4/4] Starting Mobile App...
echo.
start "CarWash Mobile" cmd /k "cd apps\mobile && npx expo start"

echo.
echo ========================================
echo  ALL SERVERS STARTED!
echo ========================================
echo.
echo  API Server: http://localhost:3000
echo  Web App: http://localhost:5173
echo  Mobile App: http://localhost:8081
echo.
echo Press any key to exit this window...
pause >nul
