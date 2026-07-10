@echo off
echo Starting B2B Finance Dashboard...

start "API Server" cmd /k "cd /d "%~dp0" && node server.js"
timeout /t 2 /nobreak >nul
start "React App" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul

start "" http://localhost:5173
echo Done. App running at http://localhost:5173
