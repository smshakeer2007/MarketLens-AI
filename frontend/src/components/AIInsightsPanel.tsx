import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStockInsights } from '../api/client';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react';

interface AIInsightsPanelProps {
  ticker: string;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ ticker }) => {
  const [showGrounding, setShowGrounding] = useState(false);

  const {
    data: insights,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['stockInsights', ticker],
    queryFn: () => getStockInsights(ticker),
    staleTime: 60000,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-fintech-card rounded-2xl p-12 border border-slate-200 dark:border-fintech-cardBorder text-center animate-pulse">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Synthesizing multi-factor technical indicators, trend momentum, and news sentiment...
        </p>
        <span className="text-xs text-slate-400 mt-1 block">
          Generating grounded factual report &bull; Zero external hallucinations
        </span>
      </div>
    );
  }

  if (isError || !insights) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
          AI Insights Temporarily Unavailable
        </h4>
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 mb-4">
          Could not generate insights report for {ticker}.
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Generation</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      
      {/* Executive Summary Card */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-fintech-card to-fintech-card rounded-2xl p-6 border border-indigo-500/30 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Executive Synthesis
              </h3>
              <span className="text-xs text-indigo-400">
                Grounded Mathematical Intelligence &bull; {ticker}
              </span>
            </div>
          </div>

          <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            Factually Grounded
          </span>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          {insights.executive_summary}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 text-xs text-slate-400">
          <strong>Trend Diagnostic:</strong> {insights.trend_assessment}
        </div>
      </div>

      {/* Bullish Factors vs Downside Risks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Bullish Catalysts */}
        <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Key Bullish Catalysts &amp; Supports
            </h4>
          </div>
          <ul className="space-y-3">
            {insights.bullish_factors.map((factor, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Downside Risks */}
        <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Downside Risks &amp; Headwinds
            </h4>
          </div>
          <ul className="space-y-3">
            {insights.bearish_factors.map((risk, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Volatility & Oscillator Verdict Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Volatility Assessment */}
        <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <Activity className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Volatility &amp; Capital Risk Assessment
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {insights.volatility_risk}
          </p>
        </div>

        {/* Technical Oscillator Verdict */}
        <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Technical Indicator Consensus
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {insights.technical_indicator_verdict}
          </p>
        </div>

      </div>

      {/* Collapsible Grounding Metrics Transparency Drawer */}
      <div className="bg-white dark:bg-fintech-card rounded-2xl border border-slate-200 dark:border-fintech-cardBorder overflow-hidden">
        <button
          onClick={() => setShowGrounding(!showGrounding)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
        >
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Auditable Grounding Metrics (Exact Numbers Passed to AI)
            </span>
          </div>
          {showGrounding ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showGrounding && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 dark:text-slate-300">
              <div>Close: <strong>${insights.grounding_metrics.close}</strong></div>
              <div>Change: <strong>{insights.grounding_metrics.change_percent}%</strong></div>
              <div>RSI (14): <strong>{insights.grounding_metrics.rsi}</strong></div>
              <div>MACD: <strong>{insights.grounding_metrics.macd}</strong></div>
              <div>SMA 20: <strong>${insights.grounding_metrics.sma_20}</strong></div>
              <div>SMA 50: <strong>${insights.grounding_metrics.sma_50}</strong></div>
              <div>SMA 200: <strong>${insights.grounding_metrics.sma_200}</strong></div>
              <div>ADX: <strong>{insights.grounding_metrics.adx}</strong></div>
              <div>Ann. Volatility: <strong>{insights.grounding_metrics.annualized_volatility_pct}%</strong></div>
              <div>30D Slope: <strong>{insights.grounding_metrics.linear_regression_slope_pct}%</strong></div>
              <div>Signal Score: <strong>{insights.grounding_metrics.signal_score}</strong></div>
              <div>Sentiment: <strong>{insights.grounding_metrics.sentiment_score}</strong></div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
