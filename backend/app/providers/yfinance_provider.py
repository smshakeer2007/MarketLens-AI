import asyncio
import logging
from typing import List, Dict, Any, Optional
import pandas as pd
import yfinance as yf
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from backend.app.providers.base import BaseDataProvider

logger = logging.getLogger(__name__)

# Pre-seeded popular tickers for instantaneous search response & autocomplete
POPULAR_TICKERS = [
    # US Equities & Indices
    {"ticker": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "category": "US"},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "category": "US"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "exchange": "NASDAQ", "category": "US"},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "exchange": "NASDAQ", "category": "US"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "category": "US"},
    {"ticker": "TSLA", "name": "Tesla, Inc.", "exchange": "NASDAQ", "category": "US"},
    {"ticker": "META", "name": "Meta Platforms, Inc.", "exchange": "NASDAQ", "category": "US"},
    {"ticker": "SPY", "name": "SPDR S&P 500 ETF Trust", "exchange": "NYSE", "category": "Index ETF"},
    {"ticker": "QQQ", "name": "Invesco QQQ Trust", "exchange": "NASDAQ", "category": "Index ETF"},
    
    # Indian Equities & Indices
    {"ticker": "RELIANCE.NS", "name": "Reliance Industries Limited", "exchange": "NSE", "category": "India"},
    {"ticker": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE", "category": "India"},
    {"ticker": "INFY.NS", "name": "Infosys Limited", "exchange": "NSE", "category": "India"},
    {"ticker": "HDFCBANK.NS", "name": "HDFC Bank Limited", "exchange": "NSE", "category": "India"},
    {"ticker": "ICICIBANK.NS", "name": "ICICI Bank Limited", "exchange": "NSE", "category": "India"},
    {"ticker": "TATAMOTORS.NS", "name": "Tata Motors Limited", "exchange": "NSE", "category": "India"},
    {"ticker": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE", "category": "India"},
    {"ticker": "^NSEI", "name": "NIFTY 50", "exchange": "NSE", "category": "Index"},
    {"ticker": "^BSESN", "name": "S&P BSE SENSEX", "exchange": "BSE", "category": "Index"},

    # Crypto / Commodities
    {"ticker": "BTC-USD", "name": "Bitcoin USD", "exchange": "Crypto", "category": "Crypto"},
    {"ticker": "ETH-USD", "name": "Ethereum USD", "exchange": "Crypto", "category": "Crypto"},
]

RANGE_MAPPING = {
    "1d": "1d",
    "5d": "5d",
    "1m": "1mo",
    "1mo": "1mo",
    "3m": "3mo",
    "3mo": "3mo",
    "6m": "6mo",
    "6mo": "6mo",
    "1y": "1y",
    "5y": "5y",
    "max": "max",
    "ytd": "ytd"
}

class YFinanceProvider(BaseDataProvider):
    """Yahoo Finance API Data Provider implementation with resilience and backoff."""

    @staticmethod
    def _normalize_ticker(ticker: str) -> str:
        t = ticker.strip().upper()
        # Common aliases
        if t == "NIFTY" or t == "NIFTY50":
            return "^NSEI"
        if t == "SENSEX":
            return "^BSESN"
        return t

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=6),
        retry=retry_if_exception_type(Exception),
        reraise=True
    )
    def _fetch_history_sync(self, ticker: str, range_val: str, interval: str) -> pd.DataFrame:
        clean_ticker = self._normalize_ticker(ticker)
        mapped_period = RANGE_MAPPING.get(range_val.lower(), "1y")
        
        # Check if intraday interval needs constrained range
        if interval in ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h"] and mapped_period in ["1y", "5y", "max"]:
            mapped_period = "1mo"

        ticker_obj = yf.Ticker(clean_ticker)
        df = ticker_obj.history(period=mapped_period, interval=interval, auto_adjust=True)

        if df.empty:
            # Try without .NS if failed, or try with .NS if missing exchange
            if not clean_ticker.endswith(".NS") and not clean_ticker.startswith("^") and "-" not in clean_ticker:
                alt_ticker = f"{clean_ticker}.NS"
                alt_obj = yf.Ticker(alt_ticker)
                alt_df = alt_obj.history(period=mapped_period, interval=interval, auto_adjust=True)
                if not alt_df.empty:
                    df = alt_df
                    clean_ticker = alt_ticker

        if df.empty:
            raise ValueError(f"No price history found for ticker '{ticker}'")

        df = df.reset_index()
        # Standardize date column
        date_col = "Date" if "Date" in df.columns else "Datetime"
        if date_col in df.columns:
            df["Date"] = pd.to_datetime(df[date_col]).dt.tz_localize(None)
            if date_col != "Date":
                df.drop(columns=[date_col], inplace=True)

        # Ensure required columns
        for col in ["Open", "High", "Low", "Close", "Volume"]:
            if col not in df.columns:
                raise ValueError(f"Missing required price column: {col}")

        # Drop any remaining unneeded columns like Dividends, Stock Splits
        cols_to_keep = ["Date", "Open", "High", "Low", "Close", "Volume"]
        df = df[cols_to_keep].dropna().sort_values("Date").reset_index(drop=True)
        return df

    async def get_history(
        self,
        ticker: str,
        range_val: str = "1y",
        interval: str = "1d"
    ) -> pd.DataFrame:
        return await asyncio.to_thread(self._fetch_history_sync, ticker, range_val, interval)

    def _fetch_ticker_info_sync(self, ticker: str) -> Dict[str, Any]:
        clean_ticker = self._normalize_ticker(ticker)
        t = yf.Ticker(clean_ticker)
        
        # Fast info provides reliable, instantaneous fundamental stats
        fast = getattr(t, "fast_info", None)
        info = {}
        try:
            info = t.info or {}
        except Exception as e:
            logger.warning(f"Could not load extended info for {clean_ticker}: {e}")

        # Aggregate reliable metrics
        last_price = None
        prev_close = None
        market_cap = None
        year_high = None
        year_low = None
        currency = "USD"
        
        if fast:
            last_price = getattr(fast, "last_price", None)
            prev_close = getattr(fast, "previous_close", None)
            market_cap = getattr(fast, "market_cap", None)
            year_high = getattr(fast, "year_high", None)
            year_low = getattr(fast, "year_low", None)
            currency = getattr(fast, "currency", "USD")

        # Fallback to info dict
        if last_price is None:
            last_price = info.get("currentPrice") or info.get("regularMarketPrice")
        if prev_close is None:
            prev_close = info.get("regularMarketPreviousClose") or info.get("previousClose")
        if market_cap is None:
            market_cap = info.get("marketCap")
        if year_high is None:
            year_high = info.get("fiftyTwoWeekHigh")
        if year_low is None:
            year_low = info.get("fiftyTwoWeekLow")
        if not currency or currency == "USD":
            currency = info.get("currency", "USD")

        # Change & Change %
        change = 0.0
        change_percent = 0.0
        if last_price and prev_close and prev_close > 0:
            change = last_price - prev_close
            change_percent = (change / prev_close) * 100

        name = info.get("shortName") or info.get("longName") or clean_ticker
        exchange = info.get("exchange") or ("NSE" if clean_ticker.endswith(".NS") else "US")

        return {
            "ticker": clean_ticker,
            "name": name,
            "exchange": exchange,
            "currency": currency,
            "current_price": round(float(last_price), 2) if last_price is not None else None,
            "previous_close": round(float(prev_close), 2) if prev_close is not None else None,
            "change": round(float(change), 2),
            "change_percent": round(float(change_percent), 2),
            "market_cap": market_cap,
            "fifty_two_week_high": round(float(year_high), 2) if year_high is not None else None,
            "fifty_two_week_low": round(float(year_low), 2) if year_low is not None else None,
            "volume": info.get("regularMarketVolume") or info.get("volume"),
            "average_volume": info.get("averageVolume") or info.get("averageDailyVolume10Day"),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "description": info.get("longBusinessSummary", ""),
        }

    async def get_ticker_info(self, ticker: str) -> Dict[str, Any]:
        return await asyncio.to_thread(self._fetch_ticker_info_sync, ticker)

    def _search_tickers_sync(self, query: str) -> List[Dict[str, Any]]:
        q = query.strip().upper()
        results = []
        
        # 1. Match from our curated popular list first
        for item in POPULAR_TICKERS:
            if q in item["ticker"].upper() or q in item["name"].upper():
                results.append(item.copy())

        # 2. Query yf.Search if query length >= 2
        if len(q) >= 2:
            try:
                search_obj = yf.Search(query, max_results=6)
                if hasattr(search_obj, "quotes") and search_obj.quotes:
                    for quote in search_obj.quotes:
                        symbol = quote.get("symbol", "")
                        if not any(r["ticker"] == symbol for r in results):
                            results.append({
                                "ticker": symbol,
                                "name": quote.get("shortname") or quote.get("longname") or symbol,
                                "exchange": quote.get("exchange", "Unknown"),
                                "category": quote.get("quoteType", "EQUITY")
                            })
            except Exception as e:
                logger.warning(f"Yahoo Search query failed: {e}")

        # Limit to top 10 unique suggestions
        seen = set()
        deduped = []
        for r in results:
            if r["ticker"] not in seen:
                seen.add(r["ticker"])
                deduped.append(r)
        return deduped[:10]

    async def search_tickers(self, query: str) -> List[Dict[str, Any]]:
        return await asyncio.to_thread(self._search_tickers_sync, query)

    def _get_news_sync(self, ticker: str, limit: int = 10) -> List[Dict[str, Any]]:
        clean_ticker = self._normalize_ticker(ticker)
        t = yf.Ticker(clean_ticker)
        articles = []
        try:
            news_items = t.news or []
            for item in news_items[:limit]:
                # yfinance news schema can vary: 'content' or direct keys
                title = item.get("title", "")
                link = item.get("link", "")
                pub_time = item.get("providerPublishTime", 0)
                publisher = item.get("publisher", "Financial News")
                if not title and "content" in item:
                    c = item["content"]
                    title = c.get("title", "")
                    link = c.get("canonicalUrl", {}).get("url", "")
                    publisher = c.get("provider", {}).get("displayName", "Financial News")
                
                if title:
                    articles.append({
                        "title": title,
                        "link": link,
                        "publisher": publisher,
                        "publish_time": pub_time
                    })
        except Exception as e:
            logger.warning(f"Failed to fetch news for {clean_ticker}: {e}")
        return articles

    async def get_news(self, ticker: str, limit: int = 10) -> List[Dict[str, Any]]:
        return await asyncio.to_thread(self._get_news_sync, ticker, limit)

