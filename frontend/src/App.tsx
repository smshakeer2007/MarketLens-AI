import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { StockDetailPage } from './pages/StockDetailPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { ComparePage } from './pages/ComparePage';
import { BacktestPage } from './pages/BacktestPage';
import { WatchlistPage } from './pages/WatchlistPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-fintech-dark text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <DisclaimerBanner />
            <Navbar />
            
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Navigate to="/stock/AAPL" replace />} />
                <Route path="/stock/:ticker" element={<StockDetailPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/backtest" element={<BacktestPage />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/methodology" element={<MethodologyPage />} />
                {/* Fallback to stock detail */}
                <Route path="*" element={<Navigate to="/stock/AAPL" replace />} />
              </Routes>
            </main>

            <footer className="border-t border-slate-200 dark:border-fintech-cardBorder py-6 mt-12 bg-white/60 dark:bg-fintech-darker/60 text-center text-xs text-slate-500 dark:text-slate-400">
              <div className="max-w-7xl mx-auto px-4 space-y-2">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  MarketLens AI &bull; Quantitative Market Analytics &amp; Machine Learning Engine
                </p>
                <p className="max-w-3xl mx-auto text-[11px] text-slate-400">
                  Strictly for educational and analytical purposes. Not financial advice. Past probabilistic performance does not guarantee future results.
                </p>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
