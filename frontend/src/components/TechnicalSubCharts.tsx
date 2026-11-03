import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { IndicatorTimeSeriesPoint, IndicatorSnapshot } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Info, Activity } from 'lucide-react';

interface TechnicalSubChartsProps {
  series: IndicatorTimeSeriesPoint[];
  snapshot: IndicatorSnapshot;
}

export const TechnicalSubCharts: React.FC<TechnicalSubChartsProps> = ({
  series,
  snapshot,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'rsi' | 'macd' | 'stoch'>('rsi');

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1F2937' : '#F3F4F6';
  const textColor = isDark ? '#9CA3AF' : '#6B7280';

  // Last 90 points for clean sub-chart resolution
  const subData = series.slice(-90).map((d) => ({
    date: d.date.slice(5), // MM-DD for compact axis
    fullDate: d.date,
    rsi: d.rsi_14,
    macd: d.macd,
    signal: d.macd_signal,
    hist: d.macd_hist,
    stochK: d.stoch_k,
    stochD: d.stoch_d,
  }));

  return (
    <div className="bg-white dark:bg-fintech-card rounded-2xl p-5 border border-slate-200 dark:border-fintech-cardBorder shadow-sm mb-6">
      
      {/* Header & Sub-chart Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Technical Oscillators & Sub-Charts
          </h3>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('rsi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'rsi'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>RSI (14)</span>
            <span className="text-[10px] opacity-80 font-mono">[{snapshot.rsi_14}]</span>
          </button>

          <button
            onClick={() => setActiveTab('macd')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'macd'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>MACD (12,26,9)</span>
            <span className="text-[10px] opacity-80 font-mono">[{snapshot.macd_hist}]</span>
          </button>

          <button
            onClick={() => setActiveTab('stoch')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'stoch'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Stochastic (%K, %D)</span>
            <span className="text-[10px] opacity-80 font-mono">[{snapshot.stoch_k}]</span>
          </button>
        </div>

      </div>

      {/* Explanatory Tooltip Banner */}
      <div className="flex items-start space-x-2 py-3 px-3 my-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 text-xs">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          {activeTab === 'rsi' && (
            <span>
              <strong>Relative Strength Index (RSI):</strong> Current value is{' '}
              <strong>{snapshot.rsi_14}</strong>.{' '}
              {snapshot.rsi_14 >= 70
                ? '⚠️ Overbought territory (>70): momentum is elevated, potential for pullback.'
                : snapshot.rsi_14 <= 30
                ? '🟢 Oversold territory (<30): potential for bullish relief bounce.'
                : 'Momentum is balanced between 30 and 70.'}
            </span>
          )}
          {activeTab === 'macd' && (
            <span>
              <strong>Moving Average Convergence Divergence (MACD):</strong> Line ={' '}
              {snapshot.macd}, Signal = {snapshot.macd_signal}, Histogram = {snapshot.macd_hist}.{' '}
              {snapshot.macd > snapshot.macd_signal
                ? '🟢 Bullish momentum: MACD line is above the 9-day signal line.'
                : '🔴 Bearish momentum: MACD line is below the 9-day signal line.'}
            </span>
          )}
          {activeTab === 'stoch' && (
            <span>
              <strong>Stochastic Oscillator:</strong> %K = {snapshot.stoch_k}, %D ={' '}
              {snapshot.stoch_d}. Values above 80 indicate overbought conditions, while values
              below 20 indicate oversold conditions.
            </span>
          )}
        </div>
      </div>

      {/* Sub-Chart Canvas */}
      <div className="w-full h-52">
        {activeTab === 'rsi' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={subData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" stroke={textColor} fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[20, 30, 50, 70, 80]} stroke={textColor} fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: '70 Overbought', fill: '#EF4444', fontSize: 10 }} />
              <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" label={{ value: '30 Oversold', fill: '#10B981', fontSize: 10 }} />
              <ReferenceLine y={50} stroke="#6B7280" strokeDasharray="2 2" />
              <Line
                type="monotone"
                dataKey="rsi"
                name="RSI (14)"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'macd' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" stroke={textColor} fontSize={11} tickLine={false} />
              <YAxis stroke={textColor} fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={0} stroke="#6B7280" />
              <Bar dataKey="hist" name="MACD Histogram">
                {subData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={(entry.hist ?? 0) >= 0 ? '#10B981' : '#EF4444'}
                  />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" name="MACD" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="signal" name="Signal" stroke="#F97316" strokeWidth={1.5} dot={false} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'stoch' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={subData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" stroke={textColor} fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[20, 50, 80]} stroke={textColor} fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" label={{ value: '80 OB', fill: '#EF4444', fontSize: 10 }} />
              <ReferenceLine y={20} stroke="#10B981" strokeDasharray="3 3" label={{ value: '20 OS', fill: '#10B981', fontSize: 10 }} />
              <Line type="monotone" dataKey="stochK" name="%K (Fast)" stroke="#06B6D4" strokeWidth={1.8} dot={false} />
              <Line type="monotone" dataKey="stochD" name="%D (Slow)" stroke="#A855F7" strokeWidth={1.8} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
};
