@echo off
echo Starting PathoGlow Frontend...
cd /d "d:\Patho\pathoglow\frontend"

REM Check if node_modules exists
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

echo Frontend starting...
npm run dev
pause