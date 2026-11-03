from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CandlestickPatternItem(BaseModel):
    date: str
    name: str
    type: str  # bullish, bearish, neutral
    description: str
    reliability: str

class SignalComponent(BaseModel):
    name: str
    category: str
    weight: float
    score: float
    reason: str

class SignalScoreResult(BaseModel):
    score: float
    category: str
    badge_color: str
    components: List[SignalComponent]
    total_weight: float

class MAAlignment(BaseModel):
    above_sma20: bool
    above_sma50: bool
    above_sma200: bool
    golden_alignment: bool

class CrossEvent(BaseModel):
    type: str
    label: str
    description: str

class TrendClassification(BaseModel):
    primary_trend: str
    trend_strength: str
    adx_value: float
    is_trending: bool
    linear_regression_slope_pct: float
    cross_event: Optional[CrossEvent] = None
    breakout: str
    breakout_description: str
    ma_alignment: MAAlignment

class TrendResponse(BaseModel):
    ticker: str
    classification: TrendClassification
    signal_score: SignalScoreResult
    candlestick_patterns: List[CandlestickPatternItem]
    disclaimer: str

