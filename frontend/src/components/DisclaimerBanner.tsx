import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs py-2 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-2 max-w-6xl mx-auto">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
        <span>
          <strong className="font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mr-1.5">Educational Tool Only:</strong>
          MarketLens AI provides probabilistic mathematical calculations and technical metrics. It is strictly NOT financial advice.
          Trading in securities involves significant capital risk.
        </span>
      </div>
      <button 
        onClick={() => setDismissed(true)} 
        className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-100 ml-4 p-0.5 rounded"
        title="Dismiss warning"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

