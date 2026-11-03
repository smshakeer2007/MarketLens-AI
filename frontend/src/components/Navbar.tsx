import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, TrendingUp, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { searchStocks } from '../api/client';
import type { StockSearchItem } from '../types';

const POPULAR_CHIPS = [
  { label: 'AAPL', ticker: 'AAPL' },
  { label: 'TSLA', ticker: 'TSLA' },
  { label: 'NVDA', ticker: 'NVDA' },
  { label: 'RELIANCE', ticker: 'RELIANCE.NS' },
  { label: 'NIFTY 50', ticker: '^NSEI' },
];

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 1) {
        setIsLoading(true);
        try {
          const data = await searchStocks(query);
          setResults(data);
          setIsOpen(true);
        } catch (e) {
          console.error('Search failed', e);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTicker = (ticker: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/stock/${ticker}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-fintech-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-fintech-cardBorder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2.5 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                MarketLens
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 ml-1.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                AI
              </span>
            </div>
          </div>

          {/* Search Autocomplete Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim() && setIsOpen(true)}
                placeholder="Search symbol (e.g. AAPL, RELIANCE, ^NSEI)..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
              />
              {isLoading && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                {results.length > 0 ? (
                  results.map((item) => (
                    <div
                      key={item.ticker}
                      onClick={() => handleSelectTicker(item.ticker)}
                      className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 last:border-0 transition"
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white mr-2">
                          {item.ticker}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {item.exchange || 'EQUITY'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching stocks found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Popular Ticker Quick Chips */}
          <div className="hidden lg:flex items-center space-x-1.5">
            {POPULAR_CHIPS.map((chip) => (
              <button
                key={chip.ticker}
                onClick={() => handleSelectTicker(chip.ticker)}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Nav Links & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <nav className="hidden sm:flex items-center space-x-1">
              <button
                onClick={() => navigate('/compare')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  location.pathname === '/compare'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Compare
              </button>
              <button
                onClick={() => navigate('/backtest')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  location.pathname === '/backtest'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Backtest
              </button>
              <button
                onClick={() => navigate('/watchlist')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  location.pathname === '/watchlist'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Watchlist
              </button>
              <button
                onClick={() => navigate('/methodology')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  location.pathname === '/methodology'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Methodology
              </button>
            </nav>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
