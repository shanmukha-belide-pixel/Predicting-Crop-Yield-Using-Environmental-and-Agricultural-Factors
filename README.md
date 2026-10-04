# Predicting Crop Yield Using Environmental and Agricultural Factors

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A polished, production-quality full-stack web application that translates regression-based crop yield analysis ($R^2$, RMSE, MAE, 5-fold cross-validation, and chronological time-based testing) into an interactive analytical tool for farmers, students, agronomists, and researchers.

---

## 🌾 Project Overview

- **Problem:** Predict crop yield ($\text{tonnes/ha}$) from temperature ($^\circ\text{C}$), annual rainfall ($\text{mm/year}$), pesticide usage ($\text{tonnes}$), and time ($\text{year}$).
- **Dataset:** Country-level records from 1990–2013 across ~100 countries and 10 major crops (Maize, Wheat, Rice paddy, Potatoes, Soybeans, Sorghum, Cassava, Sweet potatoes, Plantains, Yams). Yields are converted from $\text{hg/ha}$ ($\div 10,000 \rightarrow \text{t/ha}$).
- **Models Compared (12 Total):**
  1. Simple Linear Regression ($\text{temp}$)
  2. Multiple Linear Regression ($4\text{ features}$)
  3. Exponential Decay Fit ($\text{temp}$) via `scipy.optimize.curve_fit`
  4. Logistic Growth Fit ($\text{temp}$) via `scipy.optimize.curve_fit`
  5. Polynomial Degree 2 ($\text{temp}$)
  6. Polynomial Degree 3 ($\text{temp}$)
  7. Multivariate Polynomial Degree 2 ($4\text{ features}$)
  8. Multivariate Polynomial Degree 3 ($4\text{ features}$)
  9. Multivariate Polynomial Degree 4 ($4\text{ features}$)
  10. Multivariate Polynomial Degree 5 ($4\text{ features}$)
  11. Polynomial Degree 4 + Ridge Regularisation ($\alpha = 10$)
  12. Polynomial Degree 5 + Ridge Regularisation ($\alpha = 30$)

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Data Layer
        CSV[("Bundled yield_df.csv\n(13,176 Records, 1990-2013)")]
        Upload["CSV Upload Endpoint\n(/api/upload-dataset)"]
    end

    subgraph Backend Engine (FastAPI + scikit-learn + scipy)
        ML["ML Engine (ml_models.py)\n- Preprocessing & Scalers\n- 12 Regression Pipelines\n- In-Memory Cache per Crop"]
        Eval["Model Evaluator\n- Random 80/20 Holdout\n- 5-Fold Cross Validation\n- Chronological Time Split"]
        API["FastAPI REST Endpoints\n- /api/predict\n- /api/models/compare\n- /api/eda\n- /api/scenario\n- /api/surface\n- /api/countries"]
    end

    subgraph Frontend Client (React + Vite + TypeScript)
        Nav["Navbar & Shell\n- Shortened Title\n- Theme Toggle (Dark/Light)\n- Report Export Modal"]
        Views["Interactive Pages\n- Landing / Hero\n- Live Yield Predictor\n- Data Explorer (EDA)\n- Model Lab (Diagnostics)\n- Climate Scenarios (0-3°C)\n- 3D & Immersive Visuals\n- Satellite Context (GIS)\n- Methodology & Viva FAQ"]
    end

    CSV --> ML
    Upload --> ML
    ML --> Eval
    Eval --> API
    API <-->|REST JSON| Views
    Views --> Nav
```

---

## 🔍 Key Honesty & Scientific Disclaimers

This application enforces four foundational principles across all user interfaces:
1. **`year` is a Temporal Proxy:** `year` accounts for cumulative technology, genetics, mechanisation, and management practices over time — it is **not** a direct causal agronomic driver.
2. **Association, Not Causation:** All outputs are empirical statistical associations derived from regression models, not causal physical crop simulations.
3. **Satellite Imagery is Context Only:** Maps and NASA/Esri imagery are displayed strictly for geographical and contextual orientation and are **NOT** model inputs.
4. **Macro-Level Data:** All data represents national country-level aggregations. The system is designed for exploratory, educational, and evaluative purposes — **not** for individual farm-level management decisions.

---

## 🎨 Design Rationale

- **Theme & Aesthetic:** Modern agri-tech, calm, scientific, and trustworthy. Built with bespoke Tailwind design tokens:
  - **Primary:** Deep forest green (`#14532D`) evoking healthy vegetation and authority.
  - **Accent:** Fresh leaf green (`#22C55E`) for highlights, active links, and positive deltas.
  - **Highlight:** Wheat gold (`#F5B83D`) for temporal proxies, alerts, and cautions.
  - **Danger:** Terracotta orange (`#C2410C`) for negative deltas, extreme temperatures, and overfitting markers.
  - **Info:** Sky blue (`#0EA5E9`) for precipitation and metrics.
  - **Neutrals:** Warm agricultural paper background (`#FAFAF7`) in light mode; deep obsidian stone (`#0C0A09` / `#1C1917`) in dark mode.
- **Typography:**
  - Headings: **Sora** (`font-display`) for an authoritative, geometric agri-tech identity.
  - Body: **Inter** (`font-body`) for maximum legibility and readability.
  - Metrics & Stats: **JetBrains Mono** (`font-mono`) for precision figures and scientific values.
- **Micro-Interactions:** Smooth Framer Motion transitions, live debounced slider inputs (~250ms), radial SVG yield gauges, responsive code-split 3D plots, and full WCAG AA contrast compliance.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ (tested on Node.js 24)
- npm 9+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend API will be live at: `http://localhost:8000` (Interactive docs at `http://localhost:8000/docs`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend web application will be live at: `http://localhost:5173`.

---

## 🧪 Testing & Model Retraining

### Run Backend Unit Tests
```bash
cd backend
python -m pytest tests/test_api.py -v
```
*Validates 10 automated unit tests covering predictions, metrics, splits, error handling, scenarios, and schema compliance.*

### Retrain Models CLI
To retrain and evaluate all 12 regression models from terminal:
```bash
cd backend
python retrain.py --crop Wheat
# Or retrain all crops:
python retrain.py --all
```

### Run Playwright Smoke Tests
```bash
cd frontend
npx playwright test
```

---

## 🐳 Docker Deployment (One-Command Run)

Run the full stack with Docker Compose:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## ☁️ Cloud Deployment Guide

### Option A: Frontend on Vercel / Netlify + Backend on Render / Railway

#### 1. Backend on Render or Railway
- Create a new **Web Service** pointing to the `backend/` directory.
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set environment variables from `.env.example`.

#### 2. Frontend on Vercel or Netlify
- Create a new project pointing to the `frontend/` directory.
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_BASE_URL` to your live Render/Railway backend URL.

---

## 📄 License
MIT License &copy; 2026 Predicting Crop Yield Team.
