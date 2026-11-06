import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStockInfo, getStockHistory, getStockIndicators, getStockTrend } from '../api/client';
import { StockHeader } from '../components/StockHeader';
import { CandlestickChart } from '../components/CandlestickChart';
import { TechnicalSubCharts } from '../components/TechnicalSubCharts';
import { KeyStatsPanel } from '../components/KeyStatsPanel';
import { TrendAnalysisPanel } from '../components/TrendAnalysisPanel';
import { ForecastPanel } from '../components/ForecastPanel';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { NewsSentimentPanel } from '../components/NewsSentimentPanel';
import { BarChart3, Cpu, FileText, Newspaper, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export const StockDetailPage: React.FC = () => {
  const { ticker: paramTicker } = useParams<{ ticker: string }>();
  const ticker = (paramTicker || 'AAPL').toUpperCase();

  const [activeTab, setActiveTab] = useState<'overview' | 'technicals' | 'forecast' | 'insights' | 'news'>('overview');
  const [selectedRange, setSelectedRange] = useState('1y');

  // Queries
  const {
    data: info,
    isLoading: isInfoLoading,
    isFetching: isInfoFetching,
    dataUpdatedAt: infoUpdatedAt,
    isError: isInfoError,
    refetch: refetchInfo,
  } = useQuery({
    queryKey: ['stockInfo', ticker],
    queryFn: () => getStockInfo(ticker),
    refetchInterval: 15000, // Live real-time market polling every 15 seconds
    staleTime: 10000,
    retry: 2,
  });

  const {
    data: history,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['stockHistory', ticker, selectedRange],
    queryFn: () => getStockHistory(ticker, selectedRange),
    staleTime: 60000,
    retry: 2,
  });

  const {
    data: indicators,
    isLoading: isIndicatorsLoading,
    isError: isIndicatorsError,
    refetch: refetchIndicators,
  } = useQuery({
    queryKey: ['stockIndicators', ticker, selectedRange],
    queryFn: () => getStockIndicators(ticker, selectedRange),
    staleTime: 60000,
    retry: 2,
  });

  const {
    data: trend,
    isLoading: isTrendLoading,
    isError: isTrendError,
    refetch: refetchTrend,
  } = useQuery({
    queryKey: ['stockTrend', ticker, selectedRange],
    queryFn: () => getStockTrend(ticker, selectedRange),
    staleTime: 60000,
    retry: 2,
  });

  const isLoading = isInfoLoading || isHistoryLoading || isIndicatorsLoading || isTrendLoading;
  const isError = isInfoError || isHistoryError || isIndicatorsError || isTrendError;

  const handleRetryAll = () => {
    refetchInfo();
    refetchHistory();
    refetchIndicators();
    refetchTrend();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between text-blue-200 text-sm">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
              <div>
                <span className="font-semibold">Loading live market data for {ticker}...</span>
                <p className="text-xs text-blue-300/80 mt-0.5">
                  Connecting to cloud server. If waking from idle, please allow ~30 seconds.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-6 animate-pulse">
            <div className="h-40 bg-slate-200 dark:bg-fintech-card rounded-2xl w-full" />
            <div className="h-10 bg-slate-200 dark:bg-fintech-card rounded-xl w-72" />
            <div className="h-[480px] bg-slate-200 dark:bg-fintech-card rounded-2xl w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-fintech-card rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 text-center my-12">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-rose-900 dark:text-rose-200 mb-2">
            Failed to Load Stock Data for {ticker}
          </h2>
          <p className="text-sm text-rose-600 dark:text-rose-400 max-w-md mx-auto mb-6">
            The symbol might be invalid, or financial provider rate limits may be active. Please check the ticker symbol or retry.
          </p>
          <button
            onClick={handleRetryAll}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm inline-flex items-center space-x-2 transition shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Loaded State */}
      {!isLoading && !isError && info && history && indicators && (
        <>
          {/* Real-time Header */}
          <StockHeader 
            info={info} 
            isFetching={isInfoFetching} 
            onRefresh={() => refetchInfo()} 
            lastUpdated={infoUpdatedAt} 
          />

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-fintech-cardBorder mb-6 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview & Chart</span>
            </button>

            <button
              onClick={() => setActiveTab('technicals')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'technicals'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Technicals & Signal Score</span>
            </button>

            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'forecast'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>ML Forecasts</span>
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'insights'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>AI Insights</span>
            </button>

            <button
              onClick={() => setActiveTab('news')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
                activeTab === 'news'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>News Sentiment</span>
            </button>
          </div>

          {/* Tab 1: Overview View */}
          {activeTab === 'overview' && (
            <div>
              {/* Candlestick Main Chart */}
              <CandlestickChart
                bars={history.bars}
                indicatorSeries={indicators.series}
                selectedRange={selectedRange}
                onRangeChange={(r) => setSelectedRange(r)}
              />

              {/* Key Stats Cards */}
              <KeyStatsPanel snapshot={indicators.snapshot} />

              {/* Technical Sub-Charts: RSI, MACD, Stochastic */}
              <TechnicalSubCharts
                series={indicators.series}
                snapshot={indicators.snapshot}
              />
            </div>
          )}

          {/* Tab 2: Technicals & Signal Score View */}
          {activeTab === 'technicals' && trend && (
            <div>
              <TrendAnalysisPanel trend={trend} />
            </div>
          )}

          {/* Tab 3: ML Forecasts View */}
          {activeTab === 'forecast' && (
            <div>
              <ForecastPanel ticker={ticker} recentBars={history.bars} />
            </div>
          )}

          {/* Tab 4: AI Insights View */}
          {activeTab === 'insights' && (
            <div>
              <AIInsightsPanel ticker={ticker} />
            </div>
          )}

          {/* Tab 5: News Sentiment View */}
          {activeTab === 'news' && (
            <div>
              <NewsSentimentPanel ticker={ticker} />
            </div>
          )}
        </>
      )}

    </div>
  );
};
