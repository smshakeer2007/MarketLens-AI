import React from 'react';
import type { IndicatorSnapshot } from '../types';
import { Compass, Shield, Percent, BarChart } from 'lucide-react';

interface KeyStatsPanelProps {
  snapshot: IndicatorSnapshot;
}

export const KeyStatsPanel: React.FC<KeyStatsPanelProps> = ({ snapshot }) => {
  const close = snapshot.close;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Trailing Returns Card */}
      <div className="bg-white dark:bg-fintech-card p-5 rounded-2xl border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-3">
          <Percent className="w-3.5 h-3.5 text-blue-500" />
          <span>Trailing Returns</span>
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">1-Day Return</span>
            <span
              className={`font-bold flex items-center ${
                snapshot.return_1d_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {snapshot.return_1d_pct >= 0 ? '+' : ''}
              {snapshot.return_1d_pct.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">1-Week Return</span>
            <span
              className={`font-bold flex items-center ${
                snapshot.return_1w_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {snapshot.return_1w_pct >= 0 ? '+' : ''}
              {snapshot.return_1w_pct.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">1-Month Return</span>
            <span
              className={`font-bold flex items-center ${
                snapshot.return_1m_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {snapshot.return_1m_pct >= 0 ? '+' : ''}
              {snapshot.return_1m_pct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Volatility & Trend Strength */}
      <div className="bg-white dark:bg-fintech-card p-5 rounded-2xl border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-3">
          <BarChart className="w-3.5 h-3.5 text-indigo-500" />
          <span>Volatility & Strength</span>
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Ann. Volatility</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {snapshot.annualized_volatility_pct.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">ATR (14)</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {snapshot.atr_14.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">ADX (Trend Strength)</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {snapshot.adx.toFixed(1)}{' '}
              <span className="text-[10px] text-slate-400">
                ({snapshot.adx > 25 ? 'Strong' : 'Weak/Range'})
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Moving Averages Status */}
      <div className="bg-white dark:bg-fintech-card p-5 rounded-2xl border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-3">
          <Compass className="w-3.5 h-3.5 text-cyan-500" />
          <span>Moving Averages</span>
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">SMA 20</span>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">${snapshot.sma_20.toFixed(2)}</span>
              <span className={`text-[10px] px-1 rounded ${close >= snapshot.sma_20 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {close >= snapshot.sma_20 ? 'Above' : 'Below'}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">SMA 50</span>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">${snapshot.sma_50.toFixed(2)}</span>
              <span className={`text-[10px] px-1 rounded ${close >= snapshot.sma_50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {close >= snapshot.sma_50 ? 'Above' : 'Below'}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">SMA 200</span>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">${snapshot.sma_200.toFixed(2)}</span>
              <span className={`text-[10px] px-1 rounded ${close >= snapshot.sma_200 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {close >= snapshot.sma_200 ? 'Above' : 'Below'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Pivot Levels (Support & Resistance) */}
      <div className="bg-white dark:bg-fintech-card p-5 rounded-2xl border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>Support & Resistance Pivots</span>
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-rose-500 font-semibold">Resist (R1 / R2)</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ${snapshot.pivots.r1.toFixed(2)} / ${snapshot.pivots.r2.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">Pivot Point (P)</span>
            <span className="font-bold text-blue-500">
              ${snapshot.pivots.pivot.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-emerald-500 font-semibold">Support (S1 / S2)</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ${snapshot.pivots.s1.toFixed(2)} / ${snapshot.pivots.s2.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
