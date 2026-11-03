import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStockSentiment } from '../api/client';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Compass,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface NewsSentimentPanelProps {
  ticker: string;
}

export const NewsSentimentPanel: React.FC<NewsSentimentPanelProps> = ({ ticker }) => {
  const {
    data: sentimentData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['stockSentiment', ticker],
    queryFn: () => getStockSentiment(ticker),
    staleTime: 60000,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-fintech-card rounded-2xl p-12 border border-slate-200 dark:border-fintech-cardBorder text-center animate-pulse">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Gathering latest financial news headlines and computing VADER polarity scores...
        </p>
      </div>
    );
  }

  if (isError || !sentimentData) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
          Sentiment Analysis Temporarily Unavailable
        </h4>
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 mb-4">
          Could not retrieve news headlines for {ticker}.
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry News Stream</span>
        </button>
      </div>
    );
  }

  const { overall_sentiment, sentiment_score, distribution, articles } = sentimentData;

  const getSentimentStyle = (sentiment: string) => {
    const s = sentiment.toLowerCase();
    if (s.includes('bullish')) {
      return {
        badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
        icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
      };
    }
    if (s.includes('bearish')) {
      return {
        badge: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
        icon: <TrendingDown className="w-4 h-4 text-rose-500" />,
      };
    }
    return {
      badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      icon: <Compass className="w-4 h-4 text-slate-400" />,
    };
  };

  const currentStyle = getSentimentStyle(overall_sentiment);

  return (
    <div className="space-y-6 mb-8">
      
      {/* Top Banner: Aggregated Sentiment Gauge & Breakdown */}
      <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          
          {/* Left: Overall Sentiment Label & Score */}
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              Aggregated News Sentiment
            </span>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {sentiment_score > 0 ? `+${sentiment_score.toFixed(2)}` : sentiment_score.toFixed(2)}
              </span>
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentStyle.badge}`}>
                {currentStyle.icon}
                <span>{overall_sentiment}</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Analyzed {distribution.total_articles} recent financial articles via VADER NLP
            </span>
          </div>

          {/* Right: Distribution Visual Bar */}
          <div className="w-full lg:w-96">
            <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
              <span className="text-emerald-500 font-bold">{distribution.bullish_pct}% Bullish</span>
              <span className="text-slate-400 font-bold">{distribution.neutral_pct}% Neutral</span>
              <span className="text-rose-500 font-bold">{distribution.bearish_pct}% Bearish</span>
            </div>

            {/* Segmented Color Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
              <div
                style={{ width: `${distribution.bullish_pct}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Bullish: ${distribution.bullish_pct}%`}
              />
              <div
                style={{ width: `${distribution.neutral_pct}%` }}
                className="bg-slate-400 dark:bg-slate-600 transition-all duration-500"
                title={`Neutral: ${distribution.neutral_pct}%`}
              />
              <div
                style={{ width: `${distribution.bearish_pct}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Bearish: ${distribution.bearish_pct}%`}
              />
            </div>
          </div>

        </div>

        {/* Sentiment Stats Row */}
        <div className="grid grid-cols-3 gap-4 pt-4 text-center">
          <div>
            <span className="text-[11px] text-slate-400 block">Bullish Coverage</span>
            <span className="text-base font-black text-emerald-500">{distribution.bullish_pct}%</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Neutral / Balanced</span>
            <span className="text-base font-black text-slate-700 dark:text-slate-300">{distribution.neutral_pct}%</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Bearish Coverage</span>
            <span className="text-base font-black text-rose-500">{distribution.bearish_pct}%</span>
          </div>
        </div>
      </div>

      {/* Article Stream */}
      <div className="bg-white dark:bg-fintech-card rounded-2xl p-6 border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <Newspaper className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent News Headlines &amp; Individual Sentiment
          </h3>
        </div>

        <div className="space-y-3">
          {articles.map((item, idx) => {
            const itemStyle = getSentimentStyle(item.sentiment);
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 pr-4">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-blue-500 dark:hover:text-blue-400 transition inline-flex items-center gap-1.5"
                  >
                    <span>{item.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </a>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1.5">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{item.publisher}</span>
                    <span>&bull;</span>
                    <span>{item.date}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center space-x-1 ${itemStyle.badge}`}>
                    {itemStyle.icon}
                    <span>{item.sentiment} ({item.score > 0 ? `+${item.score.toFixed(2)}` : item.score.toFixed(2)})</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
