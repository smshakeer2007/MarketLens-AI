import axios from 'axios';
import type {
  StockSearchItem,
  TickerInfo,
  StockHistoryResponse,
  IndicatorsResponse,
  TrendResponse,
  PredictResponse,
  StockSentimentResponse,
  StockInsightsResponse,
  CompareResponse,
  BacktestResponse,
  WatchlistItemResponse,
  WatchlistAddRequest,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : 'https://marketlens-backend-abv8.onrender.com/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchStocks = async (query: string): Promise<StockSearchItem[]> => {
  if (!query || query.trim().length === 0) return [];
  const response = await apiClient.get<StockSearchItem[]>('/stocks/search', {
    params: { q: query },
  });
  return response.data;
};

export const getStockInfo = async (ticker: string): Promise<TickerInfo> => {
  const response = await apiClient.get<TickerInfo>(`/stocks/${encodeURIComponent(ticker)}/info`);
  return response.data;
};

export const getStockHistory = async (
  ticker: string,
  range: string = '1y',
  interval: string = '1d'
): Promise<StockHistoryResponse> => {
  const response = await apiClient.get<StockHistoryResponse>(
    `/stocks/${encodeURIComponent(ticker)}/history`,
    { params: { range, interval } }
  );
  return response.data;
};

export const getStockIndicators = async (
  ticker: string,
  range: string = '1y'
): Promise<IndicatorsResponse> => {
  const response = await apiClient.get<IndicatorsResponse>(
    `/stocks/${encodeURIComponent(ticker)}/indicators`,
    { params: { range } }
  );
  return response.data;
};

export const getStockTrend = async (
  ticker: string,
  range: string = '1y'
): Promise<TrendResponse> => {
  const response = await apiClient.get<TrendResponse>(
    `/stocks/${encodeURIComponent(ticker)}/trend`,
    { params: { range } }
  );
  return response.data;
};

export const predictStockPrice = async (
  ticker: string,
  model: string = 'random_forest',
  horizon: number = 7
): Promise<PredictResponse> => {
  const response = await apiClient.post<PredictResponse>(
    `/stocks/${encodeURIComponent(ticker)}/predict`,
    { model, horizon }
  );
  return response.data;
};

export const getStockSentiment = async (ticker: string): Promise<StockSentimentResponse> => {
  const response = await apiClient.get<StockSentimentResponse>(
    `/stocks/${encodeURIComponent(ticker)}/sentiment`
  );
  return response.data;
};

export const getStockInsights = async (ticker: string): Promise<StockInsightsResponse> => {
  const response = await apiClient.get<StockInsightsResponse>(
    `/stocks/${encodeURIComponent(ticker)}/insights`
  );
  return response.data;
};

// Phase 6 API endpoints
export const compareStocks = async (
  tickers: string[],
  range: string = '1y'
): Promise<CompareResponse> => {
  const response = await apiClient.post<CompareResponse>('/compare', {
    tickers,
    range,
  });
  return response.data;
};

export const runBacktest = async (params: {
  ticker: string;
  strategy?: string;
  range?: string;
  initial_capital?: number;
  buy_threshold?: number;
  sell_threshold?: number;
  commission_pct?: number;
}): Promise<BacktestResponse> => {
  const response = await apiClient.post<BacktestResponse>('/backtest', params);
  return response.data;
};

export const getWatchlist = async (): Promise<WatchlistItemResponse[]> => {
  const response = await apiClient.get<WatchlistItemResponse[]>('/watchlist');
  return response.data;
};

export const addToWatchlist = async (data: WatchlistAddRequest): Promise<WatchlistItemResponse> => {
  const response = await apiClient.post<WatchlistItemResponse>('/watchlist', data);
  return response.data;
};

export const removeFromWatchlist = async (ticker: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(
    `/watchlist/${encodeURIComponent(ticker)}`
  );
  return response.data;
};



