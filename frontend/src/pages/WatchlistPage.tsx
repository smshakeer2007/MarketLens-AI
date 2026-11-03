import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../api/client';
import type { WatchlistItemResponse } from '../types';

const POPULAR_SUGGESTIONS = ['AAPL', 'TSLA', 'NVDA', 'RELIANCE.NS', 'TCS.NS', 'MSFT'];

export const WatchlistPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tickerInput, setTickerInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: watchlist, isLoading, isError, error, refetch } = useQuery<WatchlistItemResponse[]>({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
    refetchInterval: 20000, // Auto-update watchlist quotes every 20 seconds
    staleTime: 10000,
  });

  const addMutation = useMutation({
    mutationFn: (ticker: string) => addToWatchlist({ ticker }),
    onSuccess: () => {
      setTickerInput('');
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to add ticker to watchlist.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (ticker: string) => removeFromWatchlist(ticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tickerInput.trim().toUpperCase();
    if (!clean) return;
    addMutation.mutate(clean);
  };

  const handleQuickAdd = (t: string) => {
    addMutation.mutate(t);
  };

  const getSignalBadge = (score?: number | null, category?: string | null) => {
    if (score === null || score === undefined) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500">
          Neutral
        </span>
      );
    }
    if (score >= 20) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
          +{score.toFixed(0)} ({category || 'Bullish'})
        </span>
      );
    }
    if (score <= -20) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400">
          {score.toFixed(0)} ({category || 'Bearish'})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400">
        {score > 0 ? '+' : ''}{score.toFixed(0)} (Neutral)
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header & Add Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Bookmark className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Portfolio Watchlist
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time price monitoring, daily momentum delta, and AI Signal Score conviction badges.
          </p>
        </div>

        {/* Add Ticker Form */}
        <form onSubmit={handleAddSubmit} className="flex items-center space-x-2 self-start md:self-auto">
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            placeholder="Add ticker (e.g. AAPL)"
            className="px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-medium"
          />
          <button
            type="submit"
            disabled={addMutation.isPending || !tickerInput.trim()}
            className="inline-flex items-center space-x-1 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Quick Suggestions Chips */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder text-xs">
        <span className="text-slate-400 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Quick Add:</span>
        </span>
        {POPULAR_SUGGESTIONS.map((t) => (
          <button
            key={t}
            onClick={() => handleQuickAdd(t)}
            disabled={addMutation.isPending || watchlist?.some((w) => w.ticker === t)}
            className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition font-medium"
          >
            + {t}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {isLoading && (
        <div className="p-16 flex flex-col items-center justify-center space-y-4 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">
            Refreshing watchlist prices and calculating latest signal scores...
          </p>
        </div>
      )}

      {isError && (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              {(error as any)?.response?.data?.detail || 'Failed to load watchlist.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Watchlist Cards Grid */}
      {watchlist && !isLoading && (
        <>
          {watchlist.length === 0 ? (
            <div className="p-16 text-center rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Your Watchlist is Empty
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add tickers above to monitor real-time prices, daily returns, and AI Signal Scores in one place.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {watchlist.map((item) => {
                const isPositive = (item.change_percent ?? 0) >= 0;
                return (
                  <div
                    key={item.ticker}
                    className="p-5 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm hover:shadow-md transition space-y-4 group"
                  >
                    {/* Top Row: Symbol, Exchange & Actions */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {item.ticker}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                            {item.exchange || 'EQUITY'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                          {item.company_name}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => removeMutation.mutate(item.ticker)}
                          disabled={removeMutation.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/stock/${item.ticker}`)}
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                          title="View Full Technical &amp; AI Analysis"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Price & 24h Change */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          ${item.current_price !== null && item.current_price !== undefined ? item.current_price.toFixed(2) : '---'}
                        </span>
                      </div>

                      <div className={`flex items-center space-x-1 text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>
                          {item.change_percent !== null && item.change_percent !== undefined 
                            ? `${isPositive ? '+' : ''}${item.change_percent.toFixed(2)}%`
                            : '0.00%'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: AI Signal Score */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center space-x-1">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span>Signal Score:</span>
                      </span>
                      <div>
                        {getSignalBadge(item.signal_score, item.signal_category)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
