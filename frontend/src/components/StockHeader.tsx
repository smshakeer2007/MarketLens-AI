import React, { useState } from 'react';
import { TrendingUp, TrendingDown, FileDown, RefreshCw } from 'lucide-react';
import type { TickerInfo } from '../types';
import { apiClient } from '../api/client';
import { useLiveTicker } from '../hooks/useLiveTicker';

interface StockHeaderProps {
  info: TickerInfo;
  isFetching?: boolean;
  onRefresh?: () => void;
  lastUpdated?: number;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ info, isFetching, onRefresh }) => {
  const [isExporting, setIsExporting] = useState(false);

  // Connect 1-second WebSocket real-time tick streamer
  const live = useLiveTicker(
    info.ticker,
    info.current_price,
    info.change,
    info.change_percent,
    info.volume
  );

  const displayPrice = live.price > 0 ? live.price : (info.current_price ?? 0);
  const displayChange = live.price > 0 ? live.change : (info.change ?? 0);
  const displayChangePercent = live.price > 0 ? live.changePercent : (info.change_percent ?? 0);
  const displayVolume = live.volume > 0 ? live.volume : (info.volume ?? 0);
  const isPositive = displayChange >= 0;
  const current = displayPrice;
  const low52 = info.fifty_two_week_low ?? 0;
  const high52 = info.fifty_two_week_high ?? 0;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/stocks/${encodeURIComponent(info.ticker)}/report.pdf`);
      if (!response.ok) throw new Error('PDF export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MarketLens_${info.ticker}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 52-week position calculation (0 to 100%)
  const range52 = high52 - low52;
  const pos52 = range52 > 0 ? Math.min(Math.max(((current - low52) / range52) * 100, 0), 100) : 50;

  const formatMarketCap = (cap?: number) => {
    if (!cap) return 'N/A';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  return (
    <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Ticker, Name, Price */}
        <div>
          <div className="flex items-center space-x-3 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {info.ticker}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {info.exchange || 'STOCK'}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {info.currency || 'USD'}
            </span>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition border border-slate-200 dark:border-slate-700 disabled:opacity-50 ml-2"
              title="Download institutional analytical PDF report"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-500" />
              <span>{isExporting ? 'Generating...' : 'Export PDF'}</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
            <span className="font-medium text-slate-500 dark:text-slate-400 truncate max-w-sm">
              {info.name} • {info.sector || 'Equities'}
            </span>
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                {live.isConnected ? '1s Live Stream' : 'Connecting Feed...'}
              </span>
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                &bull; {new Date(live.lastTickTime).toLocaleTimeString()}
              </span>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isFetching}
                  className="p-0.5 rounded text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 transition"
                  title="Force fetch newest market tick now"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isFetching ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Current Price & Change Badge */}
          <div className="flex items-baseline space-x-3 mt-3">
            <span
              className={`text-3xl sm:text-4xl font-black tracking-tight transition-colors duration-300 ${
                live.direction === 'up'
                  ? 'text-emerald-500'
                  : live.direction === 'down'
                  ? 'text-rose-500'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {info.currency === 'INR' ? '₹' : '$'}{displayPrice.toFixed(2)}
            </span>
            <div
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-sm font-bold transition-colors duration-300 ${
                isPositive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {isPositive ? '+' : ''}{displayChange.toFixed(2)} ({isPositive ? '+' : ''}{displayChangePercent.toFixed(2)}%)
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Prev Close: {info.currency === 'INR' ? '₹' : '$'}{(info.previous_close ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right: Key Stats & 52-week Range Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          
          {/* 52W Range Bar */}
          <div className="w-full sm:w-56">
            <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>52W Low: {low52.toFixed(2)}</span>
              <span>52W High: {high52.toFixed(2)}</span>
            </div>
            <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                style={{ width: `${pos52}%` }}
              />
            </div>
            <div className="text-[11px] text-right text-slate-400 mt-1">
              {pos52.toFixed(0)}% of 52W range
            </div>
          </div>

          {/* Fundamental Quick Stats */}
          <div className="grid grid-cols-2 gap-4 text-xs border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
            <div>
              <span className="text-slate-400 block">Market Cap</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {formatMarketCap(info.market_cap)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Volume</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {displayVolume.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Avg Volume</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {(info.average_volume ?? 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Industry</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate max-w-[110px] block">
                {info.industry || 'General'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
