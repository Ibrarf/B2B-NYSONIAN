@echo off
echo.
echo  Starting B2B Finance...
echo.

:: ── Kill anything on port 3001 ───────────────────────────────────────────────
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    echo  Killing stale process on port 3001 (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: ── Kill anything on port 5173 (optional cleanup) ───────────────────────────
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo  Killing stale process on port 5173 (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: ── Start backend (nodemon = auto-restart on crash or file change) ───────────
echo  Starting backend (nodemon)...
start "B2B Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 /nobreak >nul

:: ── Start frontend ────────────────────────────────────────────────────────────
echo  Starting frontend...
start "B2B Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 5 /nobreak >nul

:: ── Open browser ─────────────────────────────────────────────────────────────
start "" http://localhost:5173

echo.
echo  Done. App is running.
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173  (or 5174 if 5173 was taken)
echo.
