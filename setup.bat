@echo off
echo =======================================
echo VPS Panel - Quick Setup
echo =======================================
echo.

echo [1/3] Creating admin user...
call npm run create-admin

echo.
echo [2/3] Setup complete!
echo.
echo [3/3] Starting development server...
echo.
echo Visit: http://localhost:3000
echo.
call npm run dev
