#!/usr/bin/env bash
echo "==================================================================="
echo " Predicting Crop Yield Using Environmental and Agricultural Factors"
echo " Starting Backend API (FastAPI) and Frontend (Vite + React)"
echo "==================================================================="

# Start backend
(cd backend && uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

# Start frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:5173"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
