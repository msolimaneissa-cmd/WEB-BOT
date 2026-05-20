@echo off
echo ==========================================
echo 🚀 Family Legends Local Startup Script
echo ==========================================

echo [1/2] Starting Discord Bot...
start "Discord Bot" cmd /k "cd /d D:\abd\WEB-BOT\discord-bot && npm run dev"

timeout /t 5 /nobreak > nul

echo [2/2] Starting Website...
start "Family Legends Web" cmd /k "cd /d D:\abd\WEB-BOT\familylegends && npm run dev"

echo.
echo ✅ Both services are launching in separate windows.
echo 🌐 Website: http://localhost:3000
echo 🤖 Bot API: http://localhost:3001
echo.
echo Note: Ensure MongoDB and Redis are running if required.
pause
