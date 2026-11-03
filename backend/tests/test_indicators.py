import pytest
import pandas as pd
import numpy as np
from backend.app.services.indicator_service import IndicatorService

def test_sma_calculation():
    data = pd.Series([10.0, 20.0, 30.0, 40.0, 50.0])
    sma = IndicatorService.calculate_sma(data, window=3)
    # window=3 on index 2 (values 10, 20, 30) -> mean = 20.0
    assert pytest.approx(sma.iloc[2], 0.01) == 20.0
    # window=3 on index 4 (values 30, 40, 50) -> mean = 40.0
    assert pytest.approx(sma.iloc[4], 0.01) == 40.0

def test_ema_calculation():
    data = pd.Series([10.0, 10.0, 10.0, 10.0])
    ema = IndicatorService.calculate_ema(data, span=3)
    # Constant series should have EMA equal to constant
    for val in ema:
        assert pytest.approx(val, 0.01) == 10.0

def test_bollinger_bands():
    # 20 identical points -> std=0, upper=middle=lower
    data = pd.Series([100.0] * 25)
    bb = IndicatorService.calculate_bollinger_bands(data, window=20, num_std=2.0)
    assert pytest.approx(bb["middle"].iloc[-1], 0.01) == 100.0
    assert pytest.approx(bb["upper"].iloc[-1], 0.01) == 100.0
    assert pytest.approx(bb["lower"].iloc[-1], 0.01) == 100.0

    # With variance
    var_data = pd.Series([90.0, 110.0] * 12)
    bb_var = IndicatorService.calculate_bollinger_bands(var_data, window=20, num_std=2.0)
    assert bb_var["upper"].iloc[-1] > bb_var["middle"].iloc[-1]
    assert bb_var["lower"].iloc[-1] < bb_var["middle"].iloc[-1]

def test_rsi_extremes():
    # Monotonically increasing prices -> RSI should be high (> 80)
    increasing = pd.Series(np.linspace(10, 100, 30))
    rsi_high = IndicatorService.calculate_rsi(increasing, period=14)
    assert rsi_high.iloc[-1] > 80.0

    # Monotonically decreasing prices -> RSI should be low (< 20)
    decreasing = pd.Series(np.linspace(100, 10, 30))
    rsi_low = IndicatorService.calculate_rsi(decreasing, period=14)
    assert rsi_low.iloc[-1] < 20.0

def test_macd_relationship():
    # Close prices cycling
    data = pd.Series([100 + 5 * np.sin(i / 3.0) for i in range(50)])
    macd_res = IndicatorService.calculate_macd(data, 12, 26, 9)
    # Histogram must equal MACD line minus Signal line
    hist = macd_res["histogram"].iloc[-1]
    diff = macd_res["macd"].iloc[-1] - macd_res["signal"].iloc[-1]
    assert pytest.approx(hist, 1e-4) == diff

def test_stochastic_bounds():
    high = pd.Series([110.0, 115.0, 120.0, 118.0, 125.0] * 5)
    low = pd.Series([90.0, 95.0, 98.0, 92.0, 100.0] * 5)
    close = pd.Series([105.0, 110.0, 115.0, 100.0, 120.0] * 5)
    stoch = IndicatorService.calculate_stochastic(high, low, close, k_period=14, d_period=3)
    assert 0.0 <= stoch["k"].iloc[-1] <= 100.0
    assert 0.0 <= stoch["d"].iloc[-1] <= 100.0

def test_pivot_points():
    pivots = IndicatorService.calculate_pivot_points(high=150.0, low=100.0, close=125.0)
    # P = (150 + 100 + 125) / 3 = 125.0
    assert pivots["pivot"] == 125.0
    # R1 = 2*125 - 100 = 150.0
    assert pivots["r1"] == 150.0
    # S1 = 2*125 - 150 = 100.0
    assert pivots["s1"] == 100.0

def test_linear_regression_slope():
    # Strictly upward linear slope
    upward = pd.Series(np.linspace(100, 200, 30))
    slope_up = IndicatorService.calculate_linear_regression_slope(upward, window=30)
    assert slope_up > 0

    # Strictly downward linear slope
    downward = pd.Series(np.linspace(200, 100, 30))
    slope_down = IndicatorService.calculate_linear_regression_slope(downward, window=30)
    assert slope_down < 0

