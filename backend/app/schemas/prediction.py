from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class PredictRequest(BaseModel):
    model: str = Field("random_forest", description="Forecasting model: arima, random_forest, lstm")
    horizon: int = Field(7, description="Forecast horizon in days: 1, 7, 30")

class ForecastPoint(BaseModel):
    date: str
    predicted_price: float
    lower_80: float
    upper_80: float
    lower_95: float
    upper_95: float

class ModelMetrics(BaseModel):
    mae: float
    rmse: float
    mape: float
    directional_accuracy_pct: float
    naive_rmse: float
    beats_baseline: bool
    reliability_rating: str
    reliability_description: str

class PredictResponse(BaseModel):
    ticker: str
    model_name: str
    horizon_days: int
    current_price: float
    forecast_points: List[ForecastPoint]
    metrics: ModelMetrics
    disclaimer: str

