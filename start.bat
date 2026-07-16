@echo off
echo Starting B2B Finance Dashboard...

:: Kill any stale process on port 3001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 1 /nobreak >nul

start "API Server" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 2 /nobreak >nul
start "React App" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul

echo Done. Open http://localhost:5173 or http://localhost:5174
