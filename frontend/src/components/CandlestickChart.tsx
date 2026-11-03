import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import type { IChartApi, Time } from 'lightweight-charts';
import type { OHLCVBar, IndicatorTimeSeriesPoint } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Layers } from 'lucide-react';

interface CandlestickChartProps {
  bars: OHLCVBar[];
  indicatorSeries?: IndicatorTimeSeriesPoint[];
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  bars,
  indicatorSeries = [],
  selectedRange,
  onRangeChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { theme } = useTheme();

  // Overlay state toggles
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showSMA200, setShowSMA200] = useState(false);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showEMA50, setShowEMA50] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);

  // Active hover data
  const [hoverData, setHoverData] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  } | null>(null);

  const ranges = ['1M', '3M', '6M', '1Y', '5Y', 'Max'];

  useEffect(() => {
    if (!chartContainerRef.current || bars.length === 0) return;

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#111827' : '#FFFFFF';
    const textColor = isDark ? '#9CA3AF' : '#6B7280';
    const gridColor = isDark ? '#1F2937' : '#F3F4F6';

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 480,
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor: textColor,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: gridColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.25, // Leaves room for volume histogram
        },
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // 1. Candlestick Main Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    // Format & sort data strictly ascending by Date
    const formattedCandles = bars
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((b) => ({
        time: b.date as Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }));

    candleSeries.setData(formattedCandles);

    // 2. Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3B82F6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay scale
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const formattedVolume = bars
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((b) => ({
        time: b.date as Time,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
      }));

    volumeSeries.setData(formattedVolume);

    // 3. Technical Indicator Overlays
    const indSorted = indicatorSeries
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (showSMA20) {
      const sma20Series = chart.addSeries(LineSeries, {
        color: '#06B6D4', // Cyan
        lineWidth: 2,
        title: 'SMA 20',
      });
      sma20Series.setData(
        indSorted
          .filter((p) => p.sma_20 != null)
          .map((p) => ({ time: p.date as Time, value: p.sma_20! }))
      );
    }

    if (showSMA50) {
      const sma50Series = chart.addSeries(LineSeries, {
        color: '#F97316', // Orange
        lineWidth: 2,
        title: 'SMA 50',
      });
      sma50Series.setData(
        indSorted
          .filter((p) => p.sma_50 != null)
          .map((p) => ({ time: p.date as Time, value: p.sma_50! }))
      );
    }

    if (showSMA200) {
      const sma200Series = chart.addSeries(LineSeries, {
        color: '#A855F7', // Purple
        lineWidth: 2,
        title: 'SMA 200',
      });
      sma200Series.setData(
        indSorted
          .filter((p) => p.sma_200 != null)
          .map((p) => ({ time: p.date as Time, value: p.sma_200! }))
      );
    }

    if (showEMA20) {
      const ema20Series = chart.addSeries(LineSeries, {
        color: '#14B8A6', // Teal
        lineWidth: 2,
        title: 'EMA 20',
      });
      ema20Series.setData(
        indSorted
          .filter((p) => p.ema_20 != null)
          .map((p) => ({ time: p.date as Time, value: p.ema_20! }))
      );
    }

    if (showEMA50) {
      const ema50Series = chart.addSeries(LineSeries, {
        color: '#EAB308', // Yellow
        lineWidth: 2,
        title: 'EMA 50',
      });
      ema50Series.setData(
        indSorted
          .filter((p) => p.ema_50 != null)
          .map((p) => ({ time: p.date as Time, value: p.ema_50! }))
      );
    }

    if (showBollinger) {
      const bbUpper = chart.addSeries(LineSeries, {
        color: 'rgba(59, 130, 246, 0.7)',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'BB Upper',
      });
      bbUpper.setData(
        indSorted
          .filter((p) => p.bb_upper != null)
          .map((p) => ({ time: p.date as Time, value: p.bb_upper! }))
      );

      const bbLower = chart.addSeries(LineSeries, {
        color: 'rgba(59, 130, 246, 0.7)',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'BB Lower',
      });
      bbLower.setData(
        indSorted
          .filter((p) => p.bb_lower != null)
          .map((p) => ({ time: p.date as Time, value: p.bb_lower! }))
      );
    }

    // Subscribe to crosshair move for tooltip values
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoverData(null);
        return;
      }
      const candleData = param.seriesData.get(candleSeries) as any;
      const volData = param.seriesData.get(volumeSeries) as any;

      if (candleData) {
        setHoverData({
          time: String(param.time),
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volData ? volData.value : undefined,
        });
      }
    });

    chart.timeScale().fitContent();

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [
    bars,
    indicatorSeries,
    theme,
    showSMA20,
    showSMA50,
    showSMA200,
    showEMA20,
    showEMA50,
    showBollinger,
  ]);

  const latestBar = bars.length > 0 ? bars[bars.length - 1] : null;

  return (
    <div className="bg-white dark:bg-fintech-card rounded-2xl p-5 border border-slate-200 dark:border-fintech-cardBorder shadow-sm mb-6">
      
      {/* Top Controls: Range Buttons & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        
        {/* Active Values or Latest Bar Display */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {hoverData?.time || latestBar?.date || ''}
          </span>
          <span className="text-slate-500">
            O: <strong className="text-slate-900 dark:text-white">${(hoverData?.open ?? latestBar?.open ?? 0).toFixed(2)}</strong>
          </span>
          <span className="text-slate-500">
            H: <strong className="text-slate-900 dark:text-white">${(hoverData?.high ?? latestBar?.high ?? 0).toFixed(2)}</strong>
          </span>
          <span className="text-slate-500">
            L: <strong className="text-slate-900 dark:text-white">${(hoverData?.low ?? latestBar?.low ?? 0).toFixed(2)}</strong>
          </span>
          <span className="text-slate-500">
            C: <strong className="text-slate-900 dark:text-white">${(hoverData?.close ?? latestBar?.close ?? 0).toFixed(2)}</strong>
          </span>
          {(hoverData?.volume || latestBar?.volume) && (
            <span className="text-slate-500">
              Vol: <strong className="text-slate-900 dark:text-white">{(hoverData?.volume ?? latestBar?.volume ?? 0).toLocaleString()}</strong>
            </span>
          )}
        </div>

        {/* Timeframe Selectors */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r.toLowerCase())}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                selectedRange.toUpperCase() === r.toUpperCase()
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

      </div>

      {/* Indicator Overlay Toggle Bar */}
      <div className="flex flex-wrap items-center gap-2 py-3 text-xs">
        <span className="flex items-center text-slate-400 font-semibold mr-1">
          <Layers className="w-3.5 h-3.5 mr-1" /> Overlays:
        </span>

        <button
          onClick={() => setShowSMA20(!showSMA20)}
          className={`px-2.5 py-1 rounded-md font-semibold border transition flex items-center space-x-1.5 ${
            showSMA20
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-600 dark:text-cyan-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
          <span>SMA 20</span>
        </button>

        <button
          onClick={() => setShowSMA50(!showSMA50)}
          className={`px-2.5 py-1 rounded-md font-semibold border transition flex items-center space-x-1.5 ${
            showSMA50
              ? 'bg-orange-500/10 border-orange-500/40 text-orange-600 dark:text-orange-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
          <span>SMA 50</span>
        </button>

        <button
          onClick={() => setShowSMA200(!showSMA200)}
          className={`px-2.5 py-1 rounded-md font-semibold border transition flex items-center space-x-1.5 ${
            showSMA200
              ? 'bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
          <span>SMA 200</span>
        </button>

        <button
          onClick={() => setShowEMA20(!showEMA20)}
          className={`px-2.5 py-1 rounded-md font-semibold border transition flex items-center space-x-1.5 ${
            showEMA20
              ? 'bg-teal-500/10 border-teal-500/40 text-teal-600 dark:text-teal-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
          <span>EMA 20</span>
        </button>

        <button
          onClick={() => setShowEMA50(!showEMA50)}
          className={`px-2.5 py-1 rounded-md font-semibold border transition flex items-center space-x-1.5 ${
            showEMA50
              ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-600 dark:text-yellow-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          <span>EMA 50</span>
        </button>

        <button
          onClick={() => setShowBollinger(!showBollinger)}
          className={`px-2.5 py-1 rounded-md font-semibold border transition flex items-center space-x-1.5 ${
            showBollinger
              ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          <span>Bollinger Bands</span>
        </button>
      </div>

      {/* Main Candlestick Chart Viewport */}
      <div ref={chartContainerRef} className="w-full h-[480px] rounded-xl overflow-hidden" />

    </div>
  );
};
