from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class PivotLevels(BaseModel):
    pivot: float
    r1: float
    r2: float
    r3: float
    s1: float
    s2: float
    s3: float

class IndicatorSnapshot(BaseModel):
    close: float
    sma_20: float
    sma_50: float
    sma_200: float
    ema_20: float
    ema_50: float
    ema_200: float
    rsi_14: float
    macd: float
    macd_signal: float
    macd_hist: float
    stoch_k: float
    stoch_d: float
    bb_upper: float
    bb_middle: float
    bb_lower: float
    bb_percent_b: float
    atr_14: float
    adx: float
    plus_di: float
    minus_di: float
    linear_regression_slope_pct: float
    return_1d_pct: float
    return_1w_pct: float
    return_1m_pct: float
    annualized_volatility_pct: float
    pivots: PivotLevels

class IndicatorTimeSeriesPoint(BaseModel):
    date: str
    close: float
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    ema_20: Optional[float] = None
    ema_50: Optional[float] = None
    ema_200: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None
    rsi_14: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None
    stoch_k: Optional[float] = None
    stoch_d: Optional[float] = None
    adx: Optional[float] = None

class IndicatorsResponse(BaseModel):
    ticker: str
    snapshot: IndicatorSnapshot
    series: List[IndicatorTimeSeriesPoint]
    disclaimer: str

