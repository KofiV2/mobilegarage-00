@echo off
setlocal
color 0B
title Test API Server

echo.
echo ========================================
echo  IN AND OUT CAR WASH
echo  API Server Test
echo ========================================
echo.

echo This will test if the API server starts correctly.
echo.
echo Starting API server in test mode...
echo.

cd apps\api

echo Running: npm start
echo.
echo ========================================
echo.

npm start

pause
endlocal
