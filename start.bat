@echo off
echo ===================================================================
echo  Predicting Crop Yield Using Environmental and Agricultural Factors
echo  Starting Backend API (FastAPI) and Frontend (Vite + React)
echo ===================================================================

start "Crop Yield Backend" cmd /k "cd backend && uvicorn main:app --reload --port 8000"
start "Crop Yield Frontend" cmd /k "cd frontend && npm run dev"

echo Backend running on http://localhost:8000
echo Frontend running on http://localhost:5173
echo.
echo Press any key to exit this launcher window (services keep running)...
pause >nul
