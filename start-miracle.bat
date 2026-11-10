@echo off
title Miracle OS - Launcher
echo ========================================================
echo          STARTING MIRACLE LOCAL ECOSYSTEM (light mode)
echo ========================================================
echo.
cd /d "%~dp0"

REM Light mode: API + worker run from their built files (no file watchers), only the web app
REM hot-reloads. Uses far less RAM than `pnpm dev` (which starts ~18 processes).
REM   start-miracle.bat           fast start (builds only when a build is missing)
REM   start-miracle.bat build     rebuild packages + API + worker first (after changing their code)
REM   start-miracle.bat full      old behaviour: everything in watch mode (pnpm dev)

echo [1/4] Starting PostgreSQL (5433) + Redis (6380) inside WSL Ubuntu...
wsl -d Ubuntu -u root -- bash infrastructure/wsl/start.sh
if errorlevel 1 (
  echo.
  echo   Could not start the WSL services. First-time setup, run once:
  echo     wsl -d Ubuntu -u root -- bash infrastructure/wsl/install.sh
  pause
  exit /b 1
)
REM WSL shuts the distro down when its last process exits - keep one alive while we work.
start "Miracle Infra (WSL keep-alive - close this to let DB/Redis stop)" /min wsl -d Ubuntu -u root -- sleep infinity

if /i "%~1"=="full" goto full

set NEED_BUILD=0
if /i "%~1"=="build" set NEED_BUILD=1
if not exist "apps/api/dist/main.js" set NEED_BUILD=1
if not exist "apps/worker/dist/main.js" set NEED_BUILD=1
if not exist "packages/database/dist/index.js" set NEED_BUILD=1
if "%NEED_BUILD%"=="0" goto skipbuild

echo [2/4] Building packages + API + worker - takes a few minutes...
call pnpm build:packages
if errorlevel 1 goto buildfail
call pnpm --filter api build
if errorlevel 1 goto buildfail
call pnpm --filter worker build
if errorlevel 1 goto buildfail
goto run

:skipbuild
echo [2/4] Build found - skipping. Run "start-miracle.bat build" after changing API, worker or package code.

:run
echo [3/4] Starting API 4000 + worker + web 3000...
start "Miracle API" /min /d "%~dp0apps\api" cmd /k node dist/main.js
start "Miracle Worker" /min /d "%~dp0apps\worker" cmd /k node dist/main.js
start "Miracle Web" /min cmd /k pnpm dev:web

goto open

:full
echo [2/4] Full watch mode: pnpm dev ...
start "Miracle Dev - pnpm dev" cmd /k pnpm dev

:open
echo [4/4] Waiting for the web UI, then opening the browser...
timeout /t 15 /nobreak >nul
start http://localhost:3000/login
echo.
echo   Diagnostics : http://localhost:3000/diagnostics
echo   Stop all    : stop-miracle.bat
echo.
exit /b 0

:buildfail
echo.
echo   Build failed - see the error above.
pause
exit /b 1
