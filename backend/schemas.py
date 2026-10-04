from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CropInfo(BaseModel):
    name: str
    record_count: int
    countries: int

class EDAResponse(BaseModel):
    statistics: Dict[str, Any]
    distributions: Dict[str, Any]
    correlations: Dict[str, float]
    trends: Dict[str, Any]
    box_plot_data: Dict[str, Any]

class ModelMetrics(BaseModel):
    r2: float
    rmse: float
    mae: float
    cv_r2_mean: float
    cv_r2_std: float
    time_r2: float
    time_rmse: float
    time_mae: float

class ModelCompareResponse(BaseModel):
    models: Dict[str, ModelMetrics]

class PredictRequest(BaseModel):
    crop: str
    year: int
    rainfall: float
    pesticides: float
    temp: float
    model: str

class PredictResponse(BaseModel):
    prediction: float
    delta_from_mean: float
    confidence_interval: List[float]

class ScenarioResponse(BaseModel):
    delta_temp: float
    predicted_yield_change_percent: float

class SurfaceResponse(BaseModel):
    x_feature: str
    y_feature: str
    x_grid: List[List[float]]
    y_grid: List[List[float]]
    z_grid: List[List[float]]

class CountryInfo(BaseModel):
    country: str
    average_yield: float
    total_records: int
