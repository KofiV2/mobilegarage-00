@echo off
setlocal
color 0E
title In and Out Car Wash - Restart Manager

echo.
echo ========================================
echo  IN AND OUT CAR WASH
echo  Restart Manager
echo ========================================
echo.

echo Restarting all services...
echo.

:: Stop all services first
echo Step 1: Stopping services...
call stop.bat

echo.
echo Step 2: Starting services...
timeout /t 2 /nobreak >nul
call start.bat

endlocal
