"""
Unit tests for Crop Yield Predictor FastAPI backend.
Tests predictions, metrics calculations, error handling, scenarios, and dataset info.
"""

from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
import ml_models

client = TestClient(app)

def test_get_crops():
    response = client.get("/api/crops")
    assert response.status_code == 200
    crops = response.json()
    assert isinstance(crops, list)
    assert len(crops) > 0
    assert "Wheat" in crops or "Maize" in crops

def test_dataset_info():
    response = client.get("/api/dataset-info")
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] > 0
    assert data["num_countries"] > 0
    assert data["num_crops"] > 0

def test_predict_valid():
    request_data = {
        "crop": "Wheat",
        "year": 2005,
        "rainfall": 600,
        "pesticides": 15000,
        "temp": 18.0,
        "model": "multiple_linear"
    }
    response = client.post("/api/predict", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_yield" in data
    assert "crop_average" in data
    assert "delta_percent" in data
    assert "is_outside_range" in data
    assert isinstance(data["predicted_yield"], (int, float))
    assert data["predicted_yield"] > 0

def test_predict_poly_model():
    request_data = {
        "crop": "Wheat",
        "year": 2005,
        "rainfall": 600,
        "pesticides": 15000,
        "temp": 18.0,
        "model": "poly_2_multi"
    }
    response = client.post("/api/predict", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_yield"] > 0

def test_predict_missing_field():
    request_data = {
        "crop": "Wheat",
        "year": 2005
    }
    response = client.post("/api/predict", json=request_data)
    assert response.status_code == 422

def test_invalid_crop():
    response = client.get("/api/eda?crop=NonExistentCrop999")
    assert response.status_code == 404

def test_models_compare():
    response = client.get("/api/models/compare?crop=Wheat")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert isinstance(data["models"], list)
    assert len(data["models"]) >= 8  # Multiple Linear, Poly, Ridge, etc.
    
    # Check that metric values are numbers and non-empty
    first_model = data["models"][0]
    assert "name" in first_model
    assert "r2" in first_model
    assert "rmse" in first_model
    assert "mae" in first_model
    assert isinstance(first_model["r2"], (int, float))

def test_scenario():
    response = client.get("/api/scenario?crop=Wheat&delta=1.5")
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "Wheat"
    assert data["delta_temp"] == 1.5
    assert "percent_change" in data
    assert "baseline_yield" in data
    assert "predicted_yield" in data

def test_surface():
    response = client.get("/api/surface?crop=Wheat&x=avg_temp&y=average_rain_fall_mm_per_year")
    assert response.status_code == 200
    data = response.json()
    assert "x_grid" in data
    assert "y_grid" in data
    assert "z_grid" in data

def test_countries():
    response = client.get("/api/countries?crop=Wheat")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "country" in data[0]
        assert "mean_yield" in data[0]
