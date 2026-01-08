@echo off
setlocal enabledelayedexpansion
color 0B
title In and Out Car Wash - Logs Viewer

echo.
echo ========================================
echo  IN AND OUT CAR WASH
echo  Logs Viewer
echo ========================================
echo.

echo Select which logs to view:
echo.
echo  1. API Server Logs
echo  2. Web App Logs
echo  3. Mobile App Logs
echo  4. All Logs (Combined)
echo  5. Clear All Logs
echo  6. Exit
echo.

choice /C 123456 /N /M "Enter your choice (1-6): "
set choice=%errorlevel%

if %choice%==1 goto api
if %choice%==2 goto web
if %choice%==3 goto mobile
if %choice%==4 goto all
if %choice%==5 goto clear
if %choice%==6 goto exit

:api
cls
echo.
echo ========================================
echo  API SERVER LOGS
echo ========================================
echo.
if exist "logs\api.log" (
    type logs\api.log
) else (
    echo No API logs found.
    echo Logs will be created when you start the API server.
)
echo.
pause
goto end

:web
cls
echo.
echo ========================================
echo  WEB APP LOGS
echo ========================================
echo.
if exist "logs\web.log" (
    type logs\web.log
) else (
    echo No Web app logs found.
    echo Logs will be created when you start the Web app.
)
echo.
pause
goto end

:mobile
cls
echo.
echo ========================================
echo  MOBILE APP LOGS
echo ========================================
echo.
if exist "logs\mobile.log" (
    type logs\mobile.log
) else (
    echo No Mobile app logs found.
    echo Logs will be created when you start the Mobile app.
)
echo.
pause
goto end

:all
cls
echo.
echo ========================================
echo  ALL LOGS (COMBINED)
echo ========================================
echo.

echo [API SERVER]
echo ------------
if exist "logs\api.log" (
    type logs\api.log
) else (
    echo No API logs
)

echo.
echo [WEB APP]
echo ---------
if exist "logs\web.log" (
    type logs\web.log
) else (
    echo No Web logs
)

echo.
echo [MOBILE APP]
echo -----------
if exist "logs\mobile.log" (
    type logs\mobile.log
) else (
    echo No Mobile logs
)

echo.
pause
goto end

:clear
cls
echo.
echo ========================================
echo  CLEAR ALL LOGS
echo ========================================
echo.
echo WARNING: This will delete all log files!
echo.
choice /C YN /M "Are you sure"
if %errorlevel% equ 1 (
    if exist "logs\" (
        del /Q logs\*.log 2>nul
        echo Logs cleared successfully!
    ) else (
        echo No logs folder found.
    )
) else (
    echo Operation cancelled.
)
echo.
pause
goto end

:exit
exit /b 0

:end
cls
goto :eof

endlocal
