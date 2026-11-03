export interface StockSearchItem {
  ticker: string;
  name: string;
  exchange?: string;
  category?: string;
}

export interface TickerInfo {
  ticker: string;
  name: string;
  exchange?: string;
  currency?: string;
  current_price?: number;
  previous_close?: number;
  change?: number;
  change_percent?: number;
  market_cap?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  volume?: number;
  average_volume?: number;
  sector?: string;
  industry?: string;
  description?: string;
}

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistoryResponse {
  ticker: string;
  range: string;
  interval: string;
  total_bars: number;
  bars: OHLCVBar[];
  disclaimer: string;
}

export interface PivotLevels {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface IndicatorSnapshot {
  close: number;
  sma_20: number;
  sma_50: number;
  sma_200: number;
  ema_20: number;
  ema_50: number;
  ema_200: number;
  rsi_14: number;
  macd: number;
  macd_signal: number;
  macd_hist: number;
  stoch_k: number;
  stoch_d: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  bb_percent_b: number;
  atr_14: number;
  adx: number;
  plus_di: number;
  minus_di: number;
  linear_regression_slope_pct: number;
  return_1d_pct: number;
  return_1w_pct: number;
  return_1m_pct: number;
  annualized_volatility_pct: number;
  pivots: PivotLevels;
}

export interface IndicatorTimeSeriesPoint {
  date: string;
  close: number;
  sma_20?: number | null;
  sma_50?: number | null;
  sma_200?: number | null;
  ema_20?: number | null;
  ema_50?: number | null;
  ema_200?: number | null;
  bb_upper?: number | null;
  bb_middle?: number | null;
  bb_lower?: number | null;
  rsi_14?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
  macd_hist?: number | null;
  stoch_k?: number | null;
  stoch_d?: number | null;
  adx?: number | null;
}

export interface IndicatorsResponse {
  ticker: string;
  snapshot: IndicatorSnapshot;
  series: IndicatorTimeSeriesPoint[];
  disclaimer: string;
}

export interface CandlestickPatternItem {
  date: string;
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  description: string;
  reliability: string;
}

export interface SignalComponent {
  name: string;
  category: string;
  weight: number;
  score: number;
  reason: string;
}

export interface SignalScoreResult {
  score: number;
  category: string;
  badge_color: string;
  components: SignalComponent[];
  total_weight: number;
}

export interface MAAlignment {
  above_sma20: boolean;
  above_sma50: boolean;
  above_sma200: boolean;
  golden_alignment: boolean;
}

export interface CrossEvent {
  type: string;
  label: string;
  description: string;
}

export interface TrendClassification {
  primary_trend: string;
  trend_strength: string;
  adx_value: number;
  is_trending: boolean;
  linear_regression_slope_pct: number;
  cross_event?: CrossEvent | null;
  breakout: string;
  breakout_description: string;
  ma_alignment: MAAlignment;
}

export interface TrendResponse {
  ticker: string;
  classification: TrendClassification;
  signal_score: SignalScoreResult;
  candlestick_patterns: CandlestickPatternItem[];
  disclaimer: string;
}

export interface ForecastPoint {
  date: string;
  predicted_price: number;
  lower_80: number;
  upper_80: number;
  lower_95: number;
  upper_95: number;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  mape: number;
  directional_accuracy_pct: number;
  naive_rmse: number;
  beats_baseline: boolean;
  reliability_rating: string;
  reliability_description: string;
}

export interface PredictResponse {
  ticker: string;
  model_name: string;
  horizon_days: number;
  current_price: number;
  forecast_points: ForecastPoint[];
  metrics: ModelMetrics;
  disclaimer: string;
}

// Phase 5 Sentiment & AI Insights Interfaces
export interface SentimentArticle {
  title: string;
  link: string;
  publisher: string;
  date: string;
  score: number;
  sentiment: string;
}

export interface SentimentDistribution {
  bullish_pct: number;
  neutral_pct: number;
  bearish_pct: number;
  total_articles: number;
}

export interface StockSentimentResponse {
  ticker: string;
  overall_sentiment: string;
  sentiment_score: number;
  distribution: SentimentDistribution;
  articles: SentimentArticle[];
  disclaimer: string;
}

export interface StockInsightsResponse {
  ticker: string;
  executive_summary: string;
  trend_assessment: string;
  bullish_factors: string[];
  bearish_factors: string[];
  volatility_risk: string;
  technical_indicator_verdict: string;
  grounding_metrics: Record<string, any>;
  disclaimer: string;
}

// Phase 6 Compare, Risk Metrics & Backtester Interfaces
export interface StockMetric {
  ticker: string;
  name: string;
  current_price: number;
  change_percent: number;
  total_return_pct: number;
  annualized_volatility_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  beta: number;
  var_95_pct: number;
  signal_score: number;
  signal_category: string;
}

export interface CorrelationPair {
  stock_a: string;
  stock_b: string;
  correlation: number;
}

export interface CompareResponse {
  tickers: string[];
  benchmark: string;
  normalized_series: Array<Record<string, any>>;
  metrics: StockMetric[];
  correlation_matrix: Record<string, Record<string, number>>;
  correlation_pairs: CorrelationPair[];
}

export interface TradeLog {
  trade_num: number;
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  shares: number;
  pnl: number;
  return_pct: number;
  holding_days: number;
  exit_reason: string;
}

export interface EquityPoint {
  date: string;
  strategy_equity: number;
  buy_and_hold_equity: number;
  close: number;
  signal_score?: number | null;
  in_position: boolean;
}

export interface BacktestSummary {
  initial_capital: number;
  final_strategy_value: number;
  final_buy_and_hold_value: number;
  strategy_return_pct: number;
  buy_and_hold_return_pct: number;
  strategy_cagr_pct: number;
  buy_and_hold_cagr_pct: number;
  strategy_max_drawdown_pct: number;
  buy_and_hold_max_drawdown_pct: number;
  strategy_sharpe_ratio: number;
  buy_and_hold_sharpe_ratio: number;
  strategy_annualized_volatility_pct: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_pct: number;
  profit_factor: number;
  avg_trade_return_pct: number;
}

export interface BacktestResponse {
  ticker: string;
  strategy: string;
  range: string;
  summary: BacktestSummary;
  equity_curve: EquityPoint[];
  trades: TradeLog[];
}

export interface WatchlistItemResponse {
  id: number;
  ticker: string;
  company_name?: string | null;
  exchange?: string | null;
  added_at: string;
  notes?: string | null;
  current_price?: number | null;
  change_percent?: number | null;
  signal_score?: number | null;
  signal_category?: string | null;
}

export interface WatchlistAddRequest {
  ticker: string;
  company_name?: string;
  exchange?: string;
  notes?: string;
}

