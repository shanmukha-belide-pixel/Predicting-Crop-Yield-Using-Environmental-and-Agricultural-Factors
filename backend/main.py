"""
FastAPI backend for Predicting Crop Yield Using Environmental and Agricultural Factors.
Serves ML model predictions, EDA data, and comparison metrics.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import pandas as pd
import io
import ml_models

app = FastAPI(
    title="Predicting Crop Yield - API",
    description="Backend API for crop yield prediction using environmental and agricultural factors.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Pre-train models for the first crop on startup."""
    crops = ml_models.get_crops()
    if crops:
        print(f"Pre-training models for {crops[0]}...")
        ml_models.train_models_for_crop(crops[0])
        print("Startup training complete.")


# ------------------------------------------------------------------ #
#  Core endpoints                                                      #
# ------------------------------------------------------------------ #

@app.get("/api/crops")
async def get_crops():
    """Return list of available crop names."""
    return ml_models.get_crops()


@app.get("/api/eda")
async def get_eda(crop: Optional[str] = Query(None, description="Crop name (optional, defaults to all crops)")):
    """Return comprehensive EDA data for a specific crop or all crops."""
    crops = ml_models.get_crops()
    if crop and crop.lower() not in ('all', 'all crops', ''):
        if crop not in crops:
            raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")
        return ml_models.get_eda(crop)
    return ml_models.get_eda(None)


@app.get("/api/models/compare")
async def compare_models(crop: str = Query(..., description="Crop name")):
    """Return all model metrics for comparison."""
    if crop not in ml_models.get_crops():
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")
    return {"models": ml_models.get_model_comparison(crop)}


@app.post("/api/predict")
async def predict(request: dict):
    """Predict yield for given inputs."""
    required = ['crop', 'model', 'year', 'rainfall', 'pesticides', 'temp']
    for field in required:
        if field not in request:
            raise HTTPException(status_code=422, detail=f"Missing field: {field}")

    crop = request['crop']
    if crop not in ml_models.get_crops():
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")

    try:
        result = ml_models.predict(
            crop=crop,
            model_key=request['model'],
            year=float(request['year']),
            rainfall=float(request['rainfall']),
            pesticides=float(request['pesticides']),
            temp=float(request['temp']),
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/api/scenario")
async def get_scenario(
    crop: str = Query(..., description="Crop name"),
    delta: float = Query(..., description="Temperature delta in degrees C"),
):
    """Predict yield change for a warming scenario."""
    if crop not in ml_models.get_crops():
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")
    return ml_models.get_scenario(crop, delta)


@app.get("/api/countries")
async def get_countries(crop: str = Query(..., description="Crop name")):
    """Return country-level statistics for a crop."""
    if crop not in ml_models.get_crops():
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")
    return ml_models.get_countries(crop)


@app.get("/api/surface")
async def get_surface(
    crop: str = Query(..., description="Crop name"),
    x: str = Query("avg_temp", description="X-axis feature"),
    y: str = Query("average_rain_fall_mm_per_year", description="Y-axis feature"),
):
    """Return 3D surface grid data."""
    if crop not in ml_models.get_crops():
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")
    return ml_models.get_surface(crop, x, y)


@app.get("/api/actual-vs-predicted")
async def get_actual_vs_predicted(
    crop: str = Query(..., description="Crop name"),
    model: str = Query("multiple_linear", description="Model key"),
):
    """Return actual vs predicted scatter data."""
    if crop not in ml_models.get_crops():
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")
    return ml_models.get_actual_vs_predicted(crop, model)


@app.get("/api/residuals")
async def get_residuals(
    crop: str = Query(..., description="Crop name"),
    model: str = Query("multiple_linear", description="Model key"),
):
    """Return residual diagnostic data."""
    if crop not in ml_models.get_crops():
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")
    return ml_models.get_residuals(crop, model)


@app.get("/api/bias-variance")
async def get_bias_variance(
    crop: str = Query(..., description="Crop name"),
    degree: int = Query(2, description="Polynomial degree 1-8"),
):
    """Return bias-variance data for polynomial degree."""
    if crop not in ml_models.get_crops():
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")
    if degree < 1 or degree > 8:
        raise HTTPException(status_code=400, detail="Degree must be between 1 and 8")
    return ml_models.get_bias_variance(crop, degree)


@app.get("/api/feature-importance")
async def get_feature_importance(crop: str = Query(..., description="Crop name")):
    """Return standardised coefficients and VIF."""
    if crop not in ml_models.get_crops():
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")
    return ml_models.get_feature_importance(crop)


@app.get("/api/nonlinear-fits")
async def get_nonlinear_fits(crop: str = Query(..., description="Crop name")):
    """Return nonlinear fit data (linear, exponential, logistic curves)."""
    if crop not in ml_models.get_crops():
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found")
    return ml_models.get_nonlinear_fits(crop)


@app.get("/api/dataset-info")
async def dataset_info():
    """Return dataset summary statistics."""
    return ml_models.get_dataset_info()


@app.post("/api/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a CSV dataset with validation."""
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")

    try:
        content = await file.read()
        df_new = pd.read_csv(io.BytesIO(content))

        required_cols = ['Area', 'Item', 'Year', 'hg/ha_yield',
                         'average_rain_fall_mm_per_year', 'pesticides_tonnes', 'avg_temp']
        missing = [c for c in required_cols if c not in df_new.columns]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing)}. "
                       f"Required: {', '.join(required_cols)}"
            )

        # Save and reload
        save_path = ml_models.DATA_PATH
        df_new.to_csv(save_path, index=False)

        # Clear caches and reload
        ml_models.models_cache.clear()
        ml_models.metrics_cache.clear()
        ml_models.load_data(save_path)

        return {
            "status": "success",
            "filename": file.filename,
            "rows": len(df_new),
            "crops": sorted(df_new['Item'].unique().tolist()),
            "countries": int(df_new['Area'].nunique()),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
