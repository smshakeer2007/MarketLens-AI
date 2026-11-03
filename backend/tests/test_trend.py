import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from backend.app.services.trend_service import TrendService
from backend.app.services.indicator_service import IndicatorService

def create_synthetic_df(rows=50, base_price=100.0, trend=0.5):
    dates = [datetime(2025, 1, 1) + timedelta(days=i) for i in range(rows)]
    data = []
    price = base_price
    for d in dates:
        price += trend + np.random.uniform(-0.5, 0.5)
        o = price - 0.2
        c = price + 0.2
        h = max(o, c) + 0.5
        l = min(o, c) - 0.5
        v = 1000000
        data.append({"Date": d, "Open": o, "High": h, "Low": l, "Close": c, "Volume": v})
    return pd.DataFrame(data)

def test_candlestick_hammer_detection():
    df = create_synthetic_df(20)
    # Inject a hammer at last bar: small body near high, long lower shadow
    df.loc[df.index[-1], "Open"] = 100.0
    df.loc[df.index[-1], "Close"] = 100.5 # body = 0.5
    df.loc[df.index[-1], "High"] = 100.6  # upper shadow = 0.1
    df.loc[df.index[-1], "Low"] = 98.0   # lower shadow = 2.0 (>= 2 * body)

    patterns = TrendService.detect_candlestick_patterns(df, lookback=5)
    assert any(p["name"] == "Hammer" for p in patterns)

def test_candlestick_bullish_engulfing():
    df = create_synthetic_df(20)
    # Bar -2 is red: open=100, close=98
    df.loc[df.index[-2], "Open"] = 100.0
    df.loc[df.index[-2], "Close"] = 98.0
    df.loc[df.index[-2], "High"] = 100.5
    df.loc[df.index[-2], "Low"] = 97.5

    # Bar -1 is green and engulfs: open=97.5, close=101.0
    df.loc[df.index[-1], "Open"] = 97.5
    df.loc[df.index[-1], "Close"] = 101.0
    df.loc[df.index[-1], "High"] = 101.5
    df.loc[df.index[-1], "Low"] = 97.0

    patterns = TrendService.detect_candlestick_patterns(df, lookback=5)
    assert any(p["name"] == "Bullish Engulfing" for p in patterns)

def test_signal_score_bounds_and_transparency():
    df = create_synthetic_df(60, base_price=100.0, trend=1.0)
    snapshot = IndicatorService.get_summary_snapshot(df)
    patterns = TrendService.detect_candlestick_patterns(df)
    
    result = TrendService.calculate_signal_score(df, snapshot, patterns)
    
    # Range check
    assert -100.0 <= result["score"] <= 100.0
    assert result["category"] in ["Strong Bullish", "Bullish", "Neutral", "Bearish", "Strong Bearish"]
    
    # Transparency check: components exposed and weights sum to 100
    components = result["components"]
    assert len(components) == 6
    total_weights = sum(c["weight"] for c in components)
    assert total_weights == 100.0
    
    for c in components:
        assert "name" in c
        assert "score" in c
        assert "reason" in c
        assert len(c["reason"]) > 0

def test_trend_classification_uptrend():
    df = create_synthetic_df(60, base_price=50.0, trend=2.0)
    snapshot = IndicatorService.get_summary_snapshot(df)
    classification = TrendService.classify_trend(df, snapshot)
    
    assert classification["primary_trend"] in ["uptrend", "strong_uptrend"]
    assert "ma_alignment" in classification
    assert classification["ma_alignment"]["above_sma20"] is True

