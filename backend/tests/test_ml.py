import pytest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from backend.app.ml.evaluation import ModelEvaluator
from backend.app.ml.features import FeaturePipeline
from backend.app.ml.arima_model import ARIMAForecaster
from backend.app.ml.rf_model import RandomForestForecaster
from backend.app.ml.lstm_model import LSTMForecaster

def create_synthetic_data(n=80):
    np.random.seed(42)
    dates = [datetime(2025, 1, 1) + timedelta(days=i) for i in range(n)]
    price = 100.0
    records = []
    for d in dates:
        price += np.random.normal(0.2, 1.0)
        price = max(price, 10.0)
        o = price - 0.2
        c = price + 0.1
        h = max(o, c) + 0.5
        l = min(o, c) - 0.5
        v = 500000 + int(np.random.uniform(0, 100000))
        records.append({"Date": d, "Open": o, "High": h, "Low": l, "Close": c, "Volume": v})
    return pd.DataFrame(records)

def test_model_evaluator_metrics():
    y_true = np.array([105.0, 110.0, 95.0, 100.0])
    y_pred = np.array([104.0, 112.0, 96.0, 99.0])
    y_prev = np.array([100.0, 105.0, 100.0, 95.0])

    metrics = ModelEvaluator.evaluate(y_true, y_pred, y_prev)
    assert metrics["mae"] > 0
    assert metrics["rmse"] > 0
    assert metrics["mape"] > 0
    assert 0.0 <= metrics["directional_accuracy_pct"] <= 100.0
    assert "beats_baseline" in metrics
    assert "reliability_rating" in metrics

def test_evaluator_beats_baseline_flag():
    # Model with very low error vs large actual changes
    y_true = np.array([110.0, 120.0, 130.0])
    y_pred = np.array([109.9, 120.1, 129.9])
    y_prev = np.array([100.0, 100.0, 100.0])

    res = ModelEvaluator.evaluate(y_true, y_pred, y_prev)
    assert res["beats_baseline"] is True
    assert "beats naive baseline" in res["reliability_description"].lower()

    # Model worse than naive
    y_bad = np.array([150.0, 150.0, 150.0])
    res_bad = ModelEvaluator.evaluate(y_true, y_bad, y_prev)
    assert res_bad["beats_baseline"] is False
    assert "Underperforming" in res_bad["reliability_rating"]

def test_feature_pipeline_zero_leakage():
    df = create_synthetic_data(60)
    X, y = FeaturePipeline.create_features(df)
    
    assert len(X) == len(y)
    assert len(X) > 20
    # Check all expected features exist
    for f in FeaturePipeline.FEATURE_NAMES:
        assert f in X.columns

    # Verify no NaN values in features
    assert not X.isna().any().any()
    assert not y.isna().any()

def test_arima_forecaster_bounds():
    df = create_synthetic_data(60)
    res = ARIMAForecaster.forecast(df, horizon=7)

    assert res["model_name"] == "ARIMA(1,1,1)"
    assert res["horizon_days"] == 7
    points = res["forecast_points"]
    assert len(points) == 7

    for pt in points:
        assert pt["lower_80"] <= pt["predicted_price"] <= pt["upper_80"]
        assert pt["lower_95"] <= pt["lower_80"]
        assert pt["upper_95"] >= pt["upper_80"]

def test_random_forest_forecaster():
    df = create_synthetic_data(70)
    res = RandomForestForecaster.forecast(df, horizon=5)

    assert "Random Forest" in res["model_name"]
    assert res["horizon_days"] == 5
    points = res["forecast_points"]
    assert len(points) == 5

    for pt in points:
        assert pt["lower_80"] <= pt["predicted_price"] <= pt["upper_80"]
        assert pt["lower_95"] <= pt["upper_95"]

def test_lstm_forecaster():
    df = create_synthetic_data(70)
    res = LSTMForecaster.forecast(df, horizon=5)

    assert "LSTM" in res["model_name"]
    assert res["horizon_days"] == 5
    points = res["forecast_points"]
    assert len(points) == 5

    for pt in points:
        assert pt["lower_80"] <= pt["predicted_price"] <= pt["upper_80"]
        assert pt["lower_95"] <= pt["upper_95"]


