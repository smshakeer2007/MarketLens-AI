from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class CompareRequest(BaseModel):
    tickers: List[str] = Field(..., min_length=2, max_length=5, description="List of 2 to 5 stock ticker symbols")
    range: str = Field("1y", description="Historical range: 1m, 3m, 6m, 1y, 2y, 5y")

class StockMetric(BaseModel):
    ticker: str
    name: str
    current_price: float
    change_percent: float
    total_return_pct: float
    annualized_volatility_pct: float
    sharpe_ratio: float
    max_drawdown_pct: float
    beta: float
    var_95_pct: float
    signal_score: float
    signal_category: str

class CorrelationPair(BaseModel):
    stock_a: str
    stock_b: str
    correlation: float

class CompareResponse(BaseModel):
    tickers: List[str]
    benchmark: str
    normalized_series: List[Dict[str, Any]]
    metrics: List[StockMetric]
    correlation_matrix: Dict[str, Dict[str, float]]
    correlation_pairs: List[CorrelationPair]

class BacktestRequest(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol (e.g. AAPL, RELIANCE.NS)")
    strategy: str = Field("signal_score", description="Strategy type: signal_score or sma_cross")
    range: str = Field("2y", description="Historical range: 6m, 1y, 2y, 5y")
    initial_capital: float = Field(10000.0, ge=100.0, description="Initial investment capital")
    buy_threshold: float = Field(20.0, description="Signal score threshold to initiate long position")
    sell_threshold: float = Field(-10.0, description="Signal score threshold to exit long position")
    commission_pct: float = Field(0.001, ge=0.0, le=0.05, description="Slippage and commission per trade (0.001 = 0.1%)")

class TradeLog(BaseModel):
    trade_num: int
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    shares: float
    pnl: float
    return_pct: float
    holding_days: int
    exit_reason: str

class EquityPoint(BaseModel):
    date: str
    strategy_equity: float
    buy_and_hold_equity: float
    close: float
    signal_score: Optional[float] = None
    in_position: bool

class BacktestSummary(BaseModel):
    initial_capital: float
    final_strategy_value: float
    final_buy_and_hold_value: float
    strategy_return_pct: float
    buy_and_hold_return_pct: float
    strategy_cagr_pct: float
    buy_and_hold_cagr_pct: float
    strategy_max_drawdown_pct: float
    buy_and_hold_max_drawdown_pct: float
    strategy_sharpe_ratio: float
    buy_and_hold_sharpe_ratio: float
    strategy_annualized_volatility_pct: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate_pct: float
    profit_factor: float
    avg_trade_return_pct: float

class BacktestResponse(BaseModel):
    ticker: str
    strategy: str
    range: str
    summary: BacktestSummary
    equity_curve: List[EquityPoint]
    trades: List[TradeLog]

class WatchlistAddRequest(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol")
    company_name: Optional[str] = None
    exchange: Optional[str] = None
    notes: Optional[str] = None

class WatchlistItemResponse(BaseModel):
    id: int
    ticker: str
    company_name: Optional[str] = None
    exchange: Optional[str] = None
    added_at: datetime
    notes: Optional[str] = None
    current_price: Optional[float] = None
    change_percent: Optional[float] = None
    signal_score: Optional[float] = None
    signal_category: Optional[str] = None
