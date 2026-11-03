import React from 'react';
import { ShieldCheck, BarChart2 } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
          Methodology & Mathematical Foundations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          MarketLens AI is engineered on transparent, mathematically sound quantitative principles.
          No black boxes, no direct buy/sell imperatives.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Core Principles */}
        <div className="bg-white dark:bg-fintech-card p-6 rounded-2xl border border-slate-200 dark:border-fintech-cardBorder">
          <div className="flex items-center space-x-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Zero Data Leakage Time-Series Validation
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Standard ML pipelines often suffer from Lookahead Bias (future data leaking into feature normalizers or target splits).
            MarketLens AI strictly enforces <strong>TimeSeriesSplit (Walk-Forward Validation)</strong>. All feature normalization,
            rolling standard deviations, and moving averages only compute on past timestamps.
          </p>
        </div>

        {/* Technical Oscillators */}
        <div className="bg-white dark:bg-fintech-card p-6 rounded-2xl border border-slate-200 dark:border-fintech-cardBorder">
          <div className="flex items-center space-x-3 mb-3">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Technical Indicator Suite
            </h2>
          </div>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
            <li><strong>Wilder's RSI (14):</strong> Exponentially smoothed ratio of upward vs downward price change over 14 bars.</li>
            <li><strong>MACD (12, 26, 9):</strong> Difference between 12-period EMA and 26-period EMA, compared against 9-period signal EMA.</li>
            <li><strong>Bollinger Bands (20, 2σ):</strong> 20-period SMA middle band with ±2 standard deviation volatility envelopes.</li>
            <li><strong>ADX (14):</strong> Directional movement index measuring absolute trend strength regardless of trend direction.</li>
          </ul>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-2 text-amber-600 dark:text-amber-400">
            Educational & Analytical Purpose Only
          </h3>
          <p>
            MarketLens AI is an analytical tool built for educational research. It is strictly NOT financial advice.
            Past performance, technical indicators, and machine learning forecasts do not guarantee future performance.
            Always conduct independent research and consult a licensed financial advisor before making investment decisions.
          </p>
        </div>

      </div>

    </div>
  );
};
