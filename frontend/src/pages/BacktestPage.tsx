import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Play, 
  Award, 
  BarChart3, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  RotateCcw
} from 'lucide-react';
import { runBacktest } from '../api/client';
import type { BacktestResponse } from '../types';

const POPULAR_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'RELIANCE.NS', 'MSFT'];

export const BacktestPage: React.FC = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [inputTicker, setInputTicker] = useState('AAPL');
  const [strategy, setStrategy] = useState('signal_score');
  const [range, setRange] = useState('2y');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [buyThreshold, setBuyThreshold] = useState(20);
  const [sellThreshold, setSellThreshold] = useState(-10);
  const [commissionPct, setCommissionPct] = useState(0.001);

  const { data, isLoading, isError, error, refetch } = useQuery<BacktestResponse>({
    queryKey: ['backtest', ticker, strategy, range, initialCapital, buyThreshold, sellThreshold, commissionPct],
    queryFn: () => runBacktest({
      ticker,
      strategy,
      range,
      initial_capital: initialCapital,
      buy_threshold: buyThreshold,
      sell_threshold: sellThreshold,
      commission_pct: commissionPct,
    }),
  });

  const handleApplyTicker = (t: string) => {
    const clean = t.trim().toUpperCase();
    if (!clean) return;
    setInputTicker(clean);
    setTicker(clean);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyTicker(inputTicker);
  };

  const summary = data?.summary;
  const isOutperforming = summary ? summary.strategy_return_pct > summary.buy_and_hold_return_pct : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Quantitative Strategy Backtester
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historical trade simulation comparing MarketLens AI transparent Signal Score execution vs Buy &amp; Hold benchmark.
        </p>
      </div>

      {/* Control Panel */}
      <div className="p-6 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm space-y-6">
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Ticker Symbol */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Stock Ticker
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputTicker}
                onChange={(e) => setInputTicker(e.target.value)}
                placeholder="AAPL, RELIANCE.NS"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500 font-bold"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {POPULAR_TICKERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleApplyTicker(t)}
                  className={`text-[10px] px-2 py-0.5 rounded transition ${
                    ticker === t
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy & Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Strategy &amp; Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="signal_score">Signal Score Strategy</option>
                <option value="sma_cross">SMA 20/50 Crossover</option>
              </select>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="6m">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
                <option value="5y">5 Years</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-400">
              Historical lookback window for signal simulation.
            </p>
          </div>

          {/* Buy & Sell Thresholds */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Entry: &ge; {buyThreshold}</span>
              <span>Exit: &le; {sellThreshold}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  value={buyThreshold}
                  onChange={(e) => setBuyThreshold(Number(e.target.value))}
                  step="5"
                  className="w-full px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold"
                  placeholder="Buy >= 20"
                />
                <span className="text-[10px] text-slate-400">Buy Threshold</span>
              </div>
              <div>
                <input
                  type="number"
                  value={sellThreshold}
                  onChange={(e) => setSellThreshold(Number(e.target.value))}
                  step="5"
                  className="w-full px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold"
                  placeholder="Sell <= -10"
                />
                <span className="text-[10px] text-slate-400">Sell Threshold</span>
              </div>
            </div>
          </div>

          {/* Capital & Commission */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Capital &amp; Commission
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  step="1000"
                  className="w-full px-2.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
                />
                <span className="text-[10px] text-slate-400">Initial ($)</span>
              </div>
              <div>
                <select
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(Number(e.target.value))}
                  className="w-full px-2 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value={0.0}>0.0% (Zero Fee)</option>
                  <option value={0.001}>0.1% (Standard)</option>
                  <option value={0.0025}>0.25% (Conservative)</option>
                </select>
                <span className="text-[10px] text-slate-400">Slippage/Fee</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {isLoading && (
        <div className="p-16 flex flex-col items-center justify-center space-y-4 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">
            Running historical simulation on {ticker} ({range})...
          </p>
        </div>
      )}

      {isError && (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              {(error as any)?.response?.data?.detail || 'Failed to execute backtest simulation.'}
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

      {data && summary && !isLoading && (
        <>
          {/* Outcome Banner */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between ${
            isOutperforming 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                {isOutperforming ? <Award className="w-5 h-5 text-emerald-600" /> : <RotateCcw className="w-5 h-5 text-amber-600" />}
              </span>
              <div>
                <h3 className="text-sm font-bold">
                  {isOutperforming 
                    ? `Signal Strategy Outperformed Buy & Hold by ${(summary.strategy_return_pct - summary.buy_and_hold_return_pct).toFixed(2)}%`
                    : `Buy & Hold Outperformed Strategy by ${(summary.buy_and_hold_return_pct - summary.strategy_return_pct).toFixed(2)}%`
                  }
                </h3>
                <p className="text-xs opacity-80">
                  {isOutperforming 
                    ? `Strategy captured upside while minimizing downside drawdowns (${summary.strategy_max_drawdown_pct.toFixed(1)}% vs ${summary.buy_and_hold_max_drawdown_pct.toFixed(1)}% B&H).`
                    : `In a sustained secular bull market, full market exposure generated higher returns than timing entries and exits.`
                  }
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold block uppercase tracking-wider text-slate-400">Total Trades</span>
              <span className="text-lg font-bold">{summary.total_trades}</span>
            </div>
          </div>

          {/* Performance Summary Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Final Value</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  ${summary.final_strategy_value.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                B&amp;H: ${summary.final_buy_and_hold_value.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Return</span>
              <div className="mt-1 flex items-center space-x-1">
                {summary.strategy_return_pct >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-rose-500" />
                )}
                <span className={`text-base font-extrabold ${summary.strategy_return_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {summary.strategy_return_pct >= 0 ? '+' : ''}{summary.strategy_return_pct.toFixed(2)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                B&amp;H: {summary.buy_and_hold_return_pct >= 0 ? '+' : ''}{summary.buy_and_hold_return_pct.toFixed(2)}%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Max Drawdown</span>
              <div className="mt-1">
                <span className="text-base font-extrabold text-rose-500">
                  {summary.strategy_max_drawdown_pct.toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                B&amp;H: {summary.buy_and_hold_max_drawdown_pct.toFixed(1)}%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sharpe Ratio</span>
              <div className="mt-1">
                <span className="text-base font-extrabold text-indigo-500">
                  {summary.strategy_sharpe_ratio.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                B&amp;H: {summary.buy_and_hold_sharpe_ratio.toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Win Rate</span>
              <div className="mt-1">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {summary.win_rate_pct.toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {summary.winning_trades} Win / {summary.losing_trades} Loss
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Profit Factor</span>
              <div className="mt-1">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {summary.profit_factor.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Avg Trade: {summary.avg_trade_return_pct >= 0 ? '+' : ''}{summary.avg_trade_return_pct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Historical Equity Curve ($)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compounded account value comparison across the test horizon (Initial: ${summary.initial_capital.toLocaleString()}).
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.equity_curve} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    tickFormatter={(val) => val ? val.slice(5) : ''}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `$${Math.round(val)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: '#334155', 
                      borderRadius: '8px', 
                      color: '#fff',
                      fontSize: '12px' 
                    }}
                    formatter={(value: any, name: any) => [
                      `$${Number(value).toLocaleString()}`, 
                      name === 'strategy_equity' ? 'Strategy Equity' : 'Buy & Hold'
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    formatter={(val) => val === 'strategy_equity' ? 'Signal Strategy' : 'Buy & Hold Benchmark'}
                  />
                  <Line
                    type="monotone"
                    dataKey="strategy_equity"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="buy_and_hold_equity"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade Execution Log */}
          <div className="p-6 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-fintech-cardBorder shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Completed Trades Log ({data.trades.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Individual round-trip trades executed by the Signal Score rules engine.
                </p>
              </div>
            </div>

            {data.trades.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No trades were triggered during this period with the current threshold parameters.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-fintech-card z-10">
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Entry Date</th>
                      <th className="py-2.5 px-3">Exit Date</th>
                      <th className="py-2.5 px-3 text-right">Entry Price</th>
                      <th className="py-2.5 px-3 text-right">Exit Price</th>
                      <th className="py-2.5 px-3 text-right">Shares</th>
                      <th className="py-2.5 px-3 text-right">PnL ($)</th>
                      <th className="py-2.5 px-3 text-right">Return %</th>
                      <th className="py-2.5 px-3 text-right">Hold Days</th>
                      <th className="py-2.5 px-3 text-right">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {data.trades.map((t) => (
                      <tr key={t.trade_num} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 text-slate-400 font-bold">{t.trade_num}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{t.entry_date}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{t.exit_date}</td>
                        <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-semibold">
                          ${t.entry_price.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-semibold">
                          ${t.exit_price.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {t.shares.toFixed(2)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${t.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.pnl >= 0 ? '+$' : '-$'}{Math.abs(t.pnl).toFixed(2)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${t.return_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.return_pct >= 0 ? '+' : ''}{t.return_pct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {t.holding_days}d
                        </td>
                        <td className="py-2.5 px-3 text-right text-[11px] text-slate-400">
                          {t.exit_reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
