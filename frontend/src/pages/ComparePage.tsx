import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  Plus, 
  X, 
  AlertTriangle, 
  Activity, 
  ExternalLink 
} from 'lucide-react';
import { compareStocks } from '../api/client';
import type { CompareResponse } from '../types';

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

const PRESETS = [
  { label: 'Big Tech US', tickers: ['AAPL', 'MSFT', 'GOOGL', 'NVDA'] },
  { label: 'Auto & EV', tickers: ['TSLA', 'AAPL', 'NVDA'] },
  { label: 'Indian Giants', tickers: ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', '^NSEI'] },
];

export const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const [tickers, setTickers] = useState<string[]>(['AAPL', 'MSFT', 'NVDA']);
  const [inputTicker, setInputTicker] = useState('');
  const [range, setRange] = useState('1y');

  const { data, isLoading, isError, error, refetch } = useQuery<CompareResponse>({
    queryKey: ['compare', tickers, range],
    queryFn: () => compareStocks(tickers, range),
    enabled: tickers.length >= 2,
  });

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputTicker.trim().toUpperCase();
    if (!clean) return;
    if (tickers.includes(clean)) return;
    if (tickers.length >= 5) return;
    setTickers([...tickers, clean]);
    setInputTicker('');
  };

  const handleRemoveTicker = (tickerToRemove: string) => {
    if (tickers.length <= 2) return;
    setTickers(tickers.filter((t) => t !== tickerToRemove));
  };

  const getCorrelationColor = (val: number) => {
    if (val >= 0.8) return 'bg-purple-600/80 text-white font-bold';
    if (val >= 0.5) return 'bg-blue-600/70 text-white font-semibold';
    if (val >= 0.2) return 'bg-blue-500/30 text-blue-900 dark:text-blue-200';
    if (val >= -0.2) return 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300';
    if (val >= -0.5) return 'bg-emerald-500/30 text-emerald-900 dark:text-emerald-200';
    return 'bg-emerald-600/80 text-white font-bold';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Multi-Asset Stock Comparison &amp; Risk Analytics
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rebased normalized return curves, modern portfolio risk statistics, and cross-asset correlation matrix.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center space-x-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start md:self-auto">
          {['1m', '3m', '6m', '1y', '5y'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md uppercase transition ${
                range === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Ticker Management Bar & Presets */}
      <div className="p-5 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mr-1">
              Active Tickers ({tickers.length}/5):
            </span>
            {tickers.map((t, idx) => (
              <span
                key={t}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PRESET_COLORS[idx % PRESET_COLORS.length] }}
                />
                <span>{t}</span>
                {tickers.length > 2 && (
                  <button
                    onClick={() => handleRemoveTicker(t)}
                    className="text-slate-400 hover:text-red-500 ml-1 transition"
                    title="Remove ticker"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* Add Ticker Input */}
          <form onSubmit={handleAddTicker} className="flex items-center space-x-2">
            <input
              type="text"
              value={inputTicker}
              onChange={(e) => setInputTicker(e.target.value)}
              placeholder="Add symbol (e.g. INFY.NS)"
              disabled={tickers.length >= 5}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={tickers.length >= 5 || !inputTicker.trim()}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <span className="text-slate-400">Quick Presets:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setTickers(p.tickers)}
              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="p-16 flex flex-col items-center justify-center space-y-4 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">
            Synchronizing historical price series and calculating multi-asset risk metrics...
          </p>
        </div>
      )}

      {isError && (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              {(error as any)?.response?.data?.detail || 'Failed to compute multi-asset comparison.'}
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

      {data && !isLoading && (
        <>
          {/* Normalized Performance Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Normalized Relative Performance (%)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Base date rebased to 0% to illustrate percentage return trajectories across the period.
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.normalized_series} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    tickFormatter={(val) => val ? val.slice(5) : ''}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    unit="%"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: '#334155', 
                      borderRadius: '8px', 
                      color: '#fff',
                      fontSize: '12px' 
                    }}
                    formatter={(value: any) => [`${Number(value) > 0 ? '+' : ''}${value}%`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {data.tickers.map((t, idx) => (
                    <Line
                      key={t}
                      type="monotone"
                      dataKey={t}
                      name={t}
                      stroke={PRESET_COLORS[idx % PRESET_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Metrics Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Quantitative Risk &amp; Performance Comparison
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Benchmark: <span className="font-semibold text-blue-500">{data.benchmark}</span> (Risk-free rate: 4.5% annualized).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Ticker</th>
                    <th className="py-3 px-3 text-right">Current Price</th>
                    <th className="py-3 px-3 text-right">Total Return</th>
                    <th className="py-3 px-3 text-right">Ann. Volatility</th>
                    <th className="py-3 px-3 text-right">Sharpe Ratio</th>
                    <th className="py-3 px-3 text-right">Max Drawdown</th>
                    <th className="py-3 px-3 text-right">Beta vs {data.benchmark}</th>
                    <th className="py-3 px-3 text-right">1D 95% VaR</th>
                    <th className="py-3 px-3 text-center">Signal Score</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {data.metrics.map((m) => (
                    <tr key={m.ticker} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white">{m.ticker}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{m.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ${m.current_price?.toFixed(2)}
                      </td>
                      <td className={`py-3.5 px-3 text-right font-bold ${m.total_return_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {m.total_return_pct >= 0 ? '+' : ''}{m.total_return_pct.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300">
                        {m.annualized_volatility_pct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold">
                        <span className={m.sharpe_ratio >= 1.0 ? 'text-emerald-500' : m.sharpe_ratio >= 0 ? 'text-slate-300' : 'text-rose-400'}>
                          {m.sharpe_ratio.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right text-rose-500 font-semibold">
                        {m.max_drawdown_pct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300">
                        {m.beta.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-amber-500 font-semibold">
                        {m.var_95_pct.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          m.signal_score >= 20 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400' :
                          m.signal_score <= -20 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {m.signal_score > 0 ? '+' : ''}{m.signal_score} ({m.signal_category})
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => navigate(`/stock/${m.ticker}`)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition"
                          title="Open detailed analysis"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pearson Correlation Heatmap */}
          <div className="p-6 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pearson Return Correlation Matrix
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Measures co-movement of daily returns. Lower or negative correlation offers superior portfolio diversification benefits.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="border-collapse text-xs mx-auto">
                <thead>
                  <tr>
                    <th className="p-2"></th>
                    {data.tickers.map((t) => (
                      <th key={t} className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.tickers.map((rowT) => (
                    <tr key={rowT}>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-300 text-right pr-4">
                        {rowT}
                      </td>
                      {data.tickers.map((colT) => {
                        const val = data.correlation_matrix[rowT]?.[colT] ?? 1.0;
                        return (
                          <td key={colT} className="p-1 text-center">
                            <div className={`w-16 h-12 flex items-center justify-center rounded-lg transition ${getCorrelationColor(val)}`}>
                              <span className="text-xs">{val.toFixed(2)}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-center space-x-4 pt-4 text-[11px] text-slate-400">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600/80"></span>
                <span>Negative/Low (Diversifier)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-blue-500/40"></span>
                <span>Moderate (0.2 - 0.5)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-purple-600/80"></span>
                <span>High Correlation (&ge; 0.8)</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
