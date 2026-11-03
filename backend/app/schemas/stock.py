from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class StockSearchItem(BaseModel):
    ticker: str
    name: str
    exchange: Optional[str] = None
    category: Optional[str] = None

class TickerInfoResponse(BaseModel):
    ticker: str
    name: str
    exchange: Optional[str] = "US"
    currency: Optional[str] = "USD"
    current_price: Optional[float] = None
    previous_close: Optional[float] = None
    change: Optional[float] = 0.0
    change_percent: Optional[float] = 0.0
    market_cap: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    volume: Optional[int] = None
    average_volume: Optional[int] = None
    sector: Optional[str] = "N/A"
    industry: Optional[str] = "N/A"
    description: Optional[str] = ""

class OHLCVBar(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class StockHistoryResponse(BaseModel):
    ticker: str
    range: str
    interval: str
    total_bars: int
    bars: List[OHLCVBar]
    disclaimer: str

class NewsItem(BaseModel):
    title: str
    link: str
    publisher: str
    publish_time: int

