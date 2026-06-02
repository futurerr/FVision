@echo off
cd backend
echo Activating Conda environment 'aipytorch'...
call conda activate aipytorch
if errorlevel 1 (
    echo Failed to activate conda environment. Make sure conda is in your PATH.
    pause
    exit /b
)
echo Starting FVision Backend on Port 8002 (Host 0.0.0.0)...
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
pause
