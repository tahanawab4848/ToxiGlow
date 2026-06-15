@echo off
echo Starting PathoGlow Backend...
cd /d "d:\Patho\pathoglow\backend"

REM Check if dependencies are installed
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo Installing backend dependencies...
    pip install fastapi uvicorn python-multipart pillow opencv-python numpy sqlalchemy pydantic python-dotenv openai
)

echo Backend starting on http://127.0.0.1:8000
python main.py
pause