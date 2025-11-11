@echo off
echo ========================================
echo   Starting Stress Analysis Backend
echo ========================================
echo.
cd /d %~dp0backend
call venv\Scripts\activate.bat
echo Backend server starting on http://localhost:8000
echo API documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
pause

