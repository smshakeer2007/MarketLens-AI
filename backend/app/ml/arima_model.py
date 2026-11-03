import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from statsmodels.tsa.arima.model import ARIMA
from backend.app.ml.evaluation import ModelEvaluator

logger = logging.getLogger(__name__)

class ARIMAForecaster:
    """ARIMA Time-Series Forecaster with analytic confidence bounds."""

    @staticmethod
    def forecast(
        df: pd.DataFrame,
        horizon: int = 7
    ) -> Dict[str, Any]:
        """
        Fits an ARIMA(1, 1, 1) model on logarithmic closing prices.
        Returns multi-step ahead forecasted prices with 80% and 95% confidence intervals
        and walk-forward out-of-sample evaluation metrics.
        """
        prices = df["Close"].values
        n = len(prices)
        if n < 30:
            raise ValueError("Insufficient data points for ARIMA fitting (minimum 30 required).")

        # 1. Walk-Forward Validation on the last fold (trailing test window)
        test_size = min(max(horizon, 14), 30)
        train_prices = prices[:-test_size]
        test_prices = prices[-test_size:]
        prev_prices = prices[-test_size - 1:-1]

        # Fit model on train
        log_train = np.log(train_prices)
        val_model = ARIMA(log_train, order=(1, 1, 1))
        val_fit = val_model.fit()
        
        # Forecast test_size steps ahead
        val_forecast_res = val_fit.get_forecast(steps=test_size)
        val_pred_log = val_forecast_res.predicted_mean
        val_pred_prices = np.exp(val_pred_log)

        # Evaluate against actual test_prices and baseline
        metrics = ModelEvaluator.evaluate(
            y_true=test_prices,
            y_pred=val_pred_prices,
            y_prev=prev_prices
        )

        # 2. Refit on ALL data to forecast into the future
        log_all = np.log(prices)
        final_model = ARIMA(log_all, order=(1, 1, 1))
        final_fit = final_model.fit()

        forecast_res = final_fit.get_forecast(steps=horizon)
        pred_log = forecast_res.predicted_mean
        se_log = forecast_res.se_mean

        pred_prices = np.exp(pred_log)
        
        # Normal quantiles: 80% CI -> z = 1.282, 95% CI -> z = 1.960
        ci_80_lower = np.exp(pred_log - 1.282 * se_log)
        ci_80_upper = np.exp(pred_log + 1.282 * se_log)

        ci_95_lower = np.exp(pred_log - 1.960 * se_log)
        ci_95_upper = np.exp(pred_log + 1.960 * se_log)

        # Generate forecast dates (excluding weekends)
        last_date = df["Date"].iloc[-1]
        future_dates = []
        curr = last_date
        while len(future_dates) < horizon:
            curr += pd.Timedelta(days=1)
            # Skip Saturday (5) and Sunday (6)
            if curr.weekday() < 5:
                future_dates.append(curr.strftime("%Y-%m-%d"))

        points = []
        for i in range(horizon):
            points.append({
                "date": future_dates[i],
                "predicted_price": round(float(pred_prices[i]), 2),
                "lower_80": round(float(ci_80_lower[i]), 2),
                "upper_80": round(float(ci_80_upper[i]), 2),
                "lower_95": round(float(ci_95_lower[i]), 2),
                "upper_95": round(float(ci_95_upper[i]), 2),
            })

        return {
            "model_name": "ARIMA(1,1,1)",
            "horizon_days": horizon,
            "forecast_points": points,
            "metrics": metrics
        }

