import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { predictStockPrice } from '../api/client';
import type { OHLCVBar } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  RefreshCw,
} from 'lucide-react';

interface ForecastPanelProps {
  ticker: string;
  recentBars: OHLCVBar[];
}

export const ForecastPanel: React.FC<ForecastPanelProps> = ({ ticker, recentBars }) => {
  const { theme } = useTheme();
  const [selectedModel, setSelectedModel] = useState<'arima' | 'random_forest' | 'lstm'>('random_forest');
  const [selectedHorizon, setSelectedHorizon] = useState<number>(7);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1F2937' : '#F3F4F6';
  const textColor = isDark ? '#9CA3AF' : '#6B7280';

  const {
    data: forecastData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['stockPrediction', ticker, selectedModel, selectedHorizon],
    queryFn: () => predictStockPrice(ticker, selectedModel, selectedHorizon),
    staleTime: 60000,
    retry: 1,
  });

  const models = [
    { id: 'random_forest', name: 'Random Forest', badge: 'Feature Ensemble', desc: '100 trees on lag/volatility features' },
    { id: 'arima', name: 'ARIMA (1,1,1)', badge: 'Statistical Univariate', desc: 'Autoregressive integrated moving average' },
    { id: 'lstm', name: 'PyTorch LSTM', badge: 'Deep Sequence Model', desc: '2-layer recurrent sequence neural network' },
  ];

  const horizons = [
    { days: 1, label: '1 Day' },
    { days: 7, label: '7 Days' },
    { days: 30, label: '30 Days' },
  ];

  // Merge last 20 historical bars with future forecast points for seamless fan chart
  const historicalTail = recentBars.slice(-20).map((b) => ({
    date: b.date.slice(5),
    fullDate: b.date,
    historicalPrice: b.close,
    forecastPrice: null as number | null,
    lower80: null as number | null,
    upper80: null as number | null,
    lower95: null as number | null,
    upper95: null as number | null,
    ciBand80: null as [number, number] | null,
    ciBand95: null as [number, number] | null,
  }));

  // Bridge point at the last historical bar
  const lastBar = historicalTail[historicalTail.length - 1];
  if (lastBar && forecastData) {
    lastBar.forecastPrice = lastBar.historicalPrice;
    lastBar.lower80 = lastBar.historicalPrice;
    lastBar.upper80 = lastBar.historicalPrice;
    lastBar.lower95 = lastBar.historicalPrice;
    lastBar.upper95 = lastBar.historicalPrice;
  }

  const forecastPoints = forecastData
    ? forecastData.forecast_points.map((pt) => ({
        date: pt.date.slice(5),
        fullDate: pt.date,
        historicalPrice: null as number | null,
        forecastPrice: pt.predicted_price,
        lower80: pt.lower_80,
        upper80: pt.upper_80,
        lower95: pt.lower_95,
        upper95: pt.upper_95,
        // Area range tuples for Recharts
        ciBand80: [pt.lower_80, pt.upper_80] as [number, number],
        ciBand95: [pt.lower_95, pt.upper_95] as [number, number],
      }))
    : [];

  const chartData = [...historicalTail, ...forecastPoints];

  const currentPrice = forecastData?.current_price ?? (recentBars[recentBars.length - 1]?.close ?? 0);

  return (
    <div className="space-y-6 mb-8">
      
      {/* Controls: Model & Horizon Selectors */}
      <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Model Toggle Buttons */}
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
              Select Forecasting Model
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id as any)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedModel === m.id
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {m.name}
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {m.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {m.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Horizon Selector */}
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
              Forecast Horizon
            </span>
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl">
              {horizons.map((h) => (
                <button
                  key={h.days}
                  onClick={() => setSelectedHorizon(h.days)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                    selectedHorizon === h.days
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="bg-white dark:bg-fintech-card rounded-2xl p-12 border border-slate-200 dark:border-fintech-cardBorder text-center animate-pulse">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Executing walk-forward cross-validation and fitting {selectedModel.toUpperCase()} model...
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Guaranteed zero lookahead leakage &bull; Computing 80% and 95% confidence intervals
          </span>
        </div>
      )}

      {isError && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
            Prediction Calculation Encountered an Error
          </h4>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 mb-4">
            Model fitting requires sufficient historical data. Please retry or choose a different model.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Forecast</span>
          </button>
        </div>
      )}

      {/* Loaded Forecast View */}
      {!isLoading && !isError && forecastData && (
        <>
          {/* Honest Model Reliability Banner */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              forecastData.metrics.beats_baseline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              {forecastData.metrics.beats_baseline ? (
                <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">
                    {forecastData.metrics.reliability_rating}
                  </h4>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      forecastData.metrics.beats_baseline
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {forecastData.metrics.beats_baseline ? 'OUTPERFORMS BASELINE' : 'UNDERPERFORMS BASELINE'}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed max-w-2xl">
                  {forecastData.metrics.reliability_description}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-current/20 pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[11px] block opacity-75">Model vs Naive RMSE</span>
              <span className="font-black text-sm">
                ${forecastData.metrics.rmse.toFixed(2)}{' '}
                <span className="text-xs font-normal opacity-80">
                  vs ${forecastData.metrics.naive_rmse.toFixed(2)}
                </span>
              </span>
            </div>
          </div>

          {/* Confidence Interval Fan Chart */}
          <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Forecast Trajectory with Confidence Bands</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({forecastData.model_name} &bull; {selectedHorizon}D Horizon)
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Historical prices (solid line) transitioning into projected points with 80% &amp; 95% uncertainty ribbons.
                </span>
              </div>

              {/* Legend Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center space-x-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span>Forecast</span>
                </span>
                <span className="flex items-center space-x-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/30 inline-block" />
                  <span>80% CI</span>
                </span>
                <span className="flex items-center space-x-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/10 inline-block" />
                  <span>95% CI</span>
                </span>
              </div>
            </div>

            {/* Recharts Chart Canvas */}
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" stroke={textColor} fontSize={11} tickLine={false} />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke={textColor}
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => {
                      if (name === '95% CI Ribbon') return [`$${val}`, '95% CI'];
                      if (name === '80% CI Ribbon') return [`$${val}`, '80% CI'];
                      if (name === 'Forecasted Price') return [`$${val}`, 'Predicted'];
                      if (name === 'Historical Close') return [`$${val}`, 'Close'];
                      return [val, name];
                    }}
                  />
                  <ReferenceLine
                    y={currentPrice}
                    stroke="#94A3B8"
                    strokeDasharray="3 3"
                    label={{ value: `Current $${currentPrice.toFixed(2)}`, fill: '#94A3B8', fontSize: 10 }}
                  />

                  {/* 95% Confidence Interval Ribbon */}
                  <Area
                    type="monotone"
                    dataKey="upper95"
                    stroke="none"
                    fill="#3B82F6"
                    fillOpacity={0.12}
                    name="95% CI Ribbon"
                  />
                  {/* 80% Confidence Interval Ribbon */}
                  <Area
                    type="monotone"
                    dataKey="upper80"
                    stroke="none"
                    fill="#3B82F6"
                    fillOpacity={0.25}
                    name="80% CI Ribbon"
                  />

                  {/* Historical Close Line */}
                  <Line
                    type="monotone"
                    dataKey="historicalPrice"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    dot={false}
                    name="Historical Close"
                  />

                  {/* Forecast Line */}
                  <Line
                    type="monotone"
                    dataKey="forecastPrice"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#3B82F6' }}
                    name="Forecasted Price"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            
            <div className="bg-white dark:bg-fintech-card p-4 rounded-xl border border-slate-200 dark:border-fintech-cardBorder">
              <span className="text-[11px] text-slate-400 block mb-1">MAE (Mean Absolute Error)</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                ${forecastData.metrics.mae.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Average dollar deviance</span>
            </div>

            <div className="bg-white dark:bg-fintech-card p-4 rounded-xl border border-slate-200 dark:border-fintech-cardBorder">
              <span className="text-[11px] text-slate-400 block mb-1">RMSE (Root Mean Square)</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                ${forecastData.metrics.rmse.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Penalizes large errors</span>
            </div>

            <div className="bg-white dark:bg-fintech-card p-4 rounded-xl border border-slate-200 dark:border-fintech-cardBorder">
              <span className="text-[11px] text-slate-400 block mb-1">MAPE (Percentage Error)</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {forecastData.metrics.mape.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Relative variance</span>
            </div>

            <div className="bg-white dark:bg-fintech-card p-4 rounded-xl border border-slate-200 dark:border-fintech-cardBorder">
              <span className="text-[11px] text-slate-400 block mb-1">Directional Accuracy</span>
              <span
                className={`text-xl font-black ${
                  forecastData.metrics.directional_accuracy_pct >= 55
                    ? 'text-emerald-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {forecastData.metrics.directional_accuracy_pct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Sign match on price delta</span>
            </div>

            <div className="bg-white dark:bg-fintech-card p-4 rounded-xl border border-slate-200 dark:border-fintech-cardBorder col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 block mb-1">Naive Baseline RMSE</span>
              <span className="text-xl font-black text-slate-700 dark:text-slate-300">
                ${forecastData.metrics.naive_rmse.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Tomorrow = Today baseline</span>
            </div>

          </div>

          {/* Granular Horizon Breakdown Table */}
          <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Forecast Point Details &amp; Confidence Bands
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Forecast Price</th>
                    <th className="py-2.5 px-3">80% Conf. Range</th>
                    <th className="py-2.5 px-3">95% Conf. Range</th>
                    <th className="py-2.5 px-3 text-right">Implied Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {forecastData.forecast_points.map((pt) => {
                    const delta = pt.predicted_price - currentPrice;
                    const deltaPct = (delta / currentPrice) * 100;
                    return (
                      <tr key={pt.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{pt.date}</td>
                        <td className="py-2 px-3 font-bold text-blue-600 dark:text-blue-400">${pt.predicted_price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-500">${pt.lower_80.toFixed(2)} - ${pt.upper_80.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-400">${pt.lower_95.toFixed(2)} - ${pt.upper_95.toFixed(2)}</td>
                        <td className={`py-2 px-3 text-right font-bold ${delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(2)} ({delta >= 0 ? '+' : ''}{deltaPct.toFixed(2)}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Methodology & Strict Disclaimer Pill */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-start space-x-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong>Methodology Note:</strong> All models are evaluated using expanding-window walk-forward validation (TimeSeriesSplit) to prevent lookahead bias.
          Confidence bands expand with forecast horizon (proportional to &radic;days) to reflect cumulative entropy. Educational tool only; not financial advice.
        </p>
      </div>

    </div>
  );
};
