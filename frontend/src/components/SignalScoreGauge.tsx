import React from 'react';

interface SignalScoreGaugeProps {
  score: number; // -100 to +100
  category: string;
}

export const SignalScoreGauge: React.FC<SignalScoreGaugeProps> = ({ score, category }) => {
  // Normalize score (-100 to +100) to angle (-90deg to +90deg)
  const clamped = Math.max(Math.min(score, 100), -100);
  const angle = (clamped / 100) * 90; // -90 deg at -100, 0 deg at 0, +90 deg at +100

  // Colors based on score
  const getBadgeStyle = () => {
    if (score >= 60) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
    if (score >= 20) return 'bg-green-500/10 text-green-500 border-green-500/30';
    if (score <= -60) return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
    if (score <= -20) return 'bg-red-500/10 text-red-500 border-red-500/30';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  };

  const getScoreColor = () => {
    if (score >= 20) return 'text-emerald-500';
    if (score <= -20) return 'text-rose-500';
    return 'text-slate-700 dark:text-slate-300';
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-fintech-card rounded-2xl border border-slate-200 dark:border-fintech-cardBorder shadow-sm">
      <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">
        Composite Signal Score
      </span>

      {/* SVG Semi-Circle Speedometer Arc */}
      <div className="relative w-64 h-36 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="30%" stopColor="#F87171" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="70%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Colored Gradient Gauge Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Dynamic Needle Pivot */}
          <g transform={`rotate(${angle}, 100, 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="28"
              stroke="#3B82F6"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="7" fill="#3B82F6" />
            <circle cx="100" cy="100" r="3" fill="#FFFFFF" />
          </g>
        </svg>

        {/* Min / Neutral / Max Labels */}
        <span className="absolute bottom-1 left-3 text-[10px] font-bold text-rose-500">-100</span>
        <span className="absolute top-1 text-[10px] font-bold text-slate-400">0</span>
        <span className="absolute bottom-1 right-3 text-[10px] font-bold text-emerald-500">+100</span>
      </div>

      {/* Numerical Score Display */}
      <div className="mt-1 text-center">
        <div className={`text-4xl font-black tracking-tight ${getScoreColor()}`}>
          {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">Scale: -100 to +100</div>

        {/* Category Pill */}
        <div className={`mt-2.5 inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${getBadgeStyle()}`}>
          {category}
        </div>
      </div>
    </div>
  );
};

