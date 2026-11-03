import React from 'react';
import type { TrendResponse } from '../types';
import { SignalScoreGauge } from './SignalScoreGauge';
import {
  TrendingUp,
  TrendingDown,
  Compass,
  Zap,
  Flame,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface TrendAnalysisPanelProps {
  trend: TrendResponse;
}

export const TrendAnalysisPanel: React.FC<TrendAnalysisPanelProps> = ({ trend }) => {
  const { classification, signal_score, candlestick_patterns } = trend;
  const isUptrend = classification.primary_trend.includes('uptrend');
  const isDowntrend = classification.primary_trend.includes('downtrend');

  const getTrendBadge = () => {
    if (isUptrend) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
        icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
        label: classification.trend_strength,
      };
    }
    if (isDowntrend) {
      return {
        bg: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
        icon: <TrendingDown className="w-5 h-5 text-rose-500" />,
        label: classification.trend_strength,
      };
    }
    return {
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      icon: <Compass className="w-5 h-5 text-slate-400" />,
      label: classification.trend_strength,
    };
  };

  const trendBadge = getTrendBadge();

  return (
    <div className="space-y-6 mb-8">
      
      {/* Top Row: Macro Trend Classification & Signal Score Speedometer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Macro Trend Card (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Trend Engine Classification
                  </h3>
                  <span className="text-xs text-slate-400">
                    Vectorized Multi-Timeframe Algorithmic Analysis
                  </span>
                </div>
              </div>

              <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${trendBadge.bg}`}>
                {trendBadge.icon}
                <span>{trendBadge.label}</span>
              </div>
            </div>

            {/* Cross Events & Breakout Alerts */}
            {classification.cross_event && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3 text-xs text-amber-900 dark:text-amber-200">
                <Flame className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <strong className="font-bold text-amber-600 dark:text-amber-400">
                    {classification.cross_event.label}:
                  </strong>{' '}
                  {classification.cross_event.description}
                </div>
              </div>
            )}

            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Breakout Status:
                </span>
                <span className="text-slate-500">{classification.breakout_description}</span>
              </div>
              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                classification.breakout.includes('bullish')
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : classification.breakout.includes('bearish')
                  ? 'bg-rose-500/20 text-rose-500'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                {classification.breakout}
              </span>
            </div>

            {/* Quantitative Diagnostics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 block mb-1">ADX Trend Strength</span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {classification.adx_value.toFixed(1)}
                  </span>
                  <span className={`text-[10px] font-semibold ${classification.is_trending ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {classification.is_trending ? 'Trending (>25)' : 'Range (<25)'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <span className="text-[11px] text-slate-400 block mb-1">30D Regression Slope</span>
                <div className="flex items-baseline space-x-1.5">
                  <span className={`text-lg font-bold ${classification.linear_regression_slope_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {classification.linear_regression_slope_pct > 0 ? '+' : ''}{classification.linear_regression_slope_pct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">annualized</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400 block mb-1">Moving Average Hierarchy</span>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {classification.ma_alignment.golden_alignment ? (
                    <span className="text-emerald-500 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> SMA 20 &gt; 50 &gt; 200
                    </span>
                  ) : (
                    <span className="text-slate-400">Mixed Alignment</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom MA Checklist */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Price Alignment:</span>
            <span className={`inline-flex items-center space-x-1 font-semibold ${classification.ma_alignment.above_sma20 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {classification.ma_alignment.above_sma20 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>Above 20 SMA</span>
            </span>
            <span className={`inline-flex items-center space-x-1 font-semibold ${classification.ma_alignment.above_sma50 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {classification.ma_alignment.above_sma50 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>Above 50 SMA</span>
            </span>
            <span className={`inline-flex items-center space-x-1 font-semibold ${classification.ma_alignment.above_sma200 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {classification.ma_alignment.above_sma200 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>Above 200 SMA</span>
            </span>
          </div>

        </div>

        {/* Signal Score Speedometer Dial */}
        <SignalScoreGauge score={signal_score.score} category={signal_score.category} />

      </div>

      {/* Transparent Component Weight Breakdown */}
      <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Transparent Signal Score Breakdown</span>
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono">
                Weights Sum to 100%
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every contributing quantitative factor is fully auditable. No black-box estimations.
            </p>
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Composite Output:{' '}
            <span className={signal_score.score >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
              {signal_score.score > 0 ? `+${signal_score.score.toFixed(1)}` : signal_score.score.toFixed(1)} / 100
            </span>
          </div>
        </div>

        {/* Component Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {signal_score.components.map((comp) => {
            const isPos = comp.score > 0;
            const isZero = comp.score === 0;
            return (
              <div
                key={comp.name}
                className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {comp.name}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Max ±{comp.weight} pts
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                    {comp.category}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {comp.reason}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Contribution:</span>
                  <span
                    className={`text-sm font-black ${
                      isZero
                        ? 'text-slate-400'
                        : isPos
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {isPos ? `+${comp.score.toFixed(1)}` : comp.score.toFixed(1)} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Candlestick Formations Card */}
      <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
        
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Detected Candlestick Formations
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Trailing 10-Bar Recognition
          </span>
        </div>

        {candlestick_patterns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candlestick_patterns.map((pat, idx) => (
              <div
                key={`${pat.name}-${pat.date}-${idx}`}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {pat.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded uppercase ${
                      pat.type === 'bullish'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : pat.type === 'bearish'
                        ? 'bg-rose-500/20 text-rose-500'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {pat.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mb-1.5 flex justify-between">
                  <span>Detected on: {pat.date}</span>
                  <span>Reliability: <strong className="text-slate-300">{pat.reliability}</strong></span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pat.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
            No high-conviction candlestick reversal patterns identified in the trailing 10 sessions.
          </div>
        )}

      </div>

    </div>
  );
};
