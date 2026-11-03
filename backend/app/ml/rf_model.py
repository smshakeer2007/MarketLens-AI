import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from backend.app.ml.features import FeaturePipeline
from backend.app.ml.evaluation import ModelEvaluator

logger = logging.getLogger(__name__)

class RandomForestForecaster:
    """Random Forest Time-Series Forecaster using engineered lag/volatility features."""

    @staticmethod
    def forecast(
        df: pd.DataFrame,
        horizon: int = 7
    ) -> Dict[str, Any]:
        X, y = FeaturePipeline.create_features(df)
        if len(X) < 40:
            raise ValueError("Insufficient feature rows for Random Forest training (minimum 40).")

        # 1. Walk-Forward Validation on Out-of-Sample Trailing Split
        test_size = min(max(horizon, 14), 30)
        X_train, X_test = X.iloc[:-test_size], X.iloc[-test_size:]
        y_train, y_test = y.iloc[:-test_size], y.iloc[-test_size:]

        # Price of previous bar for naive baseline
        # In create_features, y is close.shift(-1), so the baseline is the close at the current bar
        prev_prices = df.loc[X_test.index, "Close"].values

        # Strict scaling inside train split only (Zero Data Leakage)
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        val_rf = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
        val_rf.fit(X_train_scaled, y_train)
        val_preds = val_rf.predict(X_test_scaled)

        # Residual standard error from validation
        val_residuals = y_test.values - val_preds
        residual_std = float(np.std(val_residuals)) if len(val_residuals) > 1 else float(np.std(y_train) * 0.05)

        metrics = ModelEvaluator.evaluate(
            y_true=y_test.values,
            y_pred=val_preds,
            y_prev=prev_prices
        )

        # 2. Retrain on ALL historical data
        full_scaler = StandardScaler()
        X_full_scaled = full_scaler.fit_transform(X)
        final_rf = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
        final_rf.fit(X_full_scaled, y)

        # 3. Multi-Step Ahead Forecasting
        # Start from latest real feature vector and price
        sim_df = df.copy()
        current_close = float(df["Close"].iloc[-1])

        forecast_prices = []
        for step in range(1, horizon + 1):
            latest_features = FeaturePipeline.get_latest_feature_vector(sim_df)
            feat_scaled = full_scaler.transform(latest_features)
            pred_next = float(final_rf.predict(feat_scaled)[0])
            forecast_prices.append(pred_next)

            # Append synthetic row to simulate next step for recursive features
            next_date = sim_df["Date"].iloc[-1] + pd.Timedelta(days=1)
            sim_row = pd.DataFrame([{
                "Date": next_date,
                "Open": pred_next,
                "High": pred_next * 1.002,
                "Low": pred_next * 0.998,
                "Close": pred_next,
                "Volume": sim_df["Volume"].iloc[-1]
            }])
            sim_df = pd.concat([sim_df, sim_row], ignore_index=True)

        # 4. Confidence Intervals (widening with sqrt(step))
        last_date = df["Date"].iloc[-1]
        future_dates = []
        curr = last_date
        while len(future_dates) < horizon:
            curr += pd.Timedelta(days=1)
            if curr.weekday() < 5:
                future_dates.append(curr.strftime("%Y-%m-%d"))

        points = []
        for i in range(horizon):
            p = forecast_prices[i]
            # Uncertainty expands as sqrt of step
            step_uncertainty = residual_std * np.sqrt(i + 1)
            
            ci_80_lower = max(p - 1.282 * step_uncertainty, 0.01)
            ci_80_upper = p + 1.282 * step_uncertainty
            ci_95_lower = max(p - 1.960 * step_uncertainty, 0.01)
            ci_95_upper = p + 1.960 * step_uncertainty

            points.append({
                "date": future_dates[i],
                "predicted_price": round(p, 2),
                "lower_80": round(ci_80_lower, 2),
                "upper_80": round(ci_80_upper, 2),
                "lower_95": round(ci_95_lower, 2),
                "upper_95": round(ci_95_upper, 2),
            })

        return {
            "model_name": "Random Forest Regressor",
            "horizon_days": horizon,
            "forecast_points": points,
            "metrics": metrics
        }

