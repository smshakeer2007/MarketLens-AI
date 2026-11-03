from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SentimentArticle(BaseModel):
    title: str
    link: str
    publisher: str
    date: str
    score: float
    sentiment: str

class SentimentDistribution(BaseModel):
    bullish_pct: float
    neutral_pct: float
    bearish_pct: float
    total_articles: int

class StockSentimentResponse(BaseModel):
    ticker: str
    overall_sentiment: str
    sentiment_score: float
    distribution: SentimentDistribution
    articles: List[SentimentArticle]
    disclaimer: str

class StockInsightsResponse(BaseModel):
    ticker: str
    executive_summary: str
    trend_assessment: str
    bullish_factors: List[str]
    bearish_factors: List[str]
    volatility_risk: str
    technical_indicator_verdict: str
    grounding_metrics: Dict[str, Any]
    disclaimer: str
