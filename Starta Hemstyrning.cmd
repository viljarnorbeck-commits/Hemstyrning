@echo off
setlocal
cd /d "%~dp0"
echo Startar Hemstyrning i din vanliga Windows-session...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1"
set "startResult=%ERRORLEVEL%"
echo.
pause
exit /b %startResult%
