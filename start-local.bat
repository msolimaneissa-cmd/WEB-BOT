@echo off
echo ==========================================
echo    Family Legends Local Startup Script
echo ==========================================

echo.
echo [1/4] Starting MongoDB...
start "MongoDB" cmd /k "mongod --dbpath D:\abd\WEB-BOT\data\mongodb --bind_ip 127.0.0.1 --port 27017"

echo [2/4] Starting Redis...
start "Redis" cmd /k "redis-server --bind 127.0.0.1 --port 6379"

timeout /t 3 /nobreak > nul

echo [3/4] Starting Discord Bot (port 3001)...
start "Discord Bot" cmd /k "cd /d D:\abd\WEB-BOT\discord-bot && npm run dev"

timeout /t 5 /nobreak > nul

echo [4/4] Starting Web Dashboard (port 9002)...
start "Family Legends Web" cmd /k "cd /d D:\abd\WEB-BOT\familylegends && npm run dev"

echo.
echo ==========================================
echo    All services starting
echo ==========================================
echo.
echo   Bot API:    http://localhost:3001
echo   Web:       http://localhost:9002
echo   MongoDB:   mongodb://127.0.0.1:27017
echo   Redis:     127.0.0.1:6379
echo.
echo   Press any key to close this window...
pause > nul