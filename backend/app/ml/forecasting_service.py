import logging
from typing import Dict, Any, Optional
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.ml.arima_model import ARIMAForecaster
from backend.app.ml.rf_model import RandomForestForecaster
from backend.app.ml.lstm_model import LSTMForecaster
from backend.app.db.models import ModelMetadata

logger = logging.getLogger(__name__)

class ForecastingService:
    """Coordinates time-series forecasting, walk-forward evaluation, and metadata persistence."""

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_cache_key(self, ticker: str, model_type: str, horizon: int) -> str:
        return f"{ticker.upper()}:{model_type.lower()}:{horizon}"

    async def predict(
        self,
        df: pd.DataFrame,
        ticker: str,
        model_type: str = "random_forest",
        horizon: int = 7,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        cache_key = self._get_cache_key(ticker, model_type, horizon)

        # Map model name
        m_type = model_type.lower()
        if m_type in ["arima", "auto_arima"]:
            result = ARIMAForecaster.forecast(df, horizon)
        elif m_type in ["lstm", "pytorch_lstm"]:
            result = LSTMForecaster.forecast(df, horizon)
        else: # default to random_forest
            result = RandomForestForecaster.forecast(df, horizon)

        # Store in DB metadata if session provided
        if db:
            try:
                meta = ModelMetadata(
                    ticker=ticker.upper(),
                    model_name=result["model_name"],
                    horizon_days=horizon,
                    metrics=result["metrics"],
                    beats_baseline=result["metrics"]["beats_baseline"]
                )
                db.add(meta)
                await db.commit()
            except Exception as e:
                logger.warning(f"Could not persist model metadata: {e}")

        return result

forecasting_service = ForecastingService()

