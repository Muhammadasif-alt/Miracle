@echo off
title Miracle OS - Stop Services
cd /d "%~dp0"
echo Stopping Miracle local services...

REM web (3000) + api (4000), then the app windows (light mode: Web / API / Worker; full mode: Dev)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING"') do taskkill /F /T /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000 " ^| findstr "LISTENING"') do taskkill /F /T /PID %%a >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq Miracle Web*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq Miracle API*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq Miracle Worker*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq Miracle Dev*" >nul 2>&1

REM PostgreSQL + Redis inside WSL, then release the keep-alive (the distro stops by itself a few seconds later)
wsl -d Ubuntu -u root -- bash infrastructure/wsl/stop.sh
taskkill /F /FI "WINDOWTITLE eq Miracle Infra*" >nul 2>&1

echo All Miracle services stopped. (The Windows PostgreSQL 18 service on 5432 is not touched.)
if /i not "%~1"=="nopause" pause
