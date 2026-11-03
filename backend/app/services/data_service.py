import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.providers.base import BaseDataProvider
from backend.app.providers.yfinance_provider import YFinanceProvider
from backend.app.db.models import CachedPriceData

logger = logging.getLogger(__name__)

class DataService:
    """Orchestrates data fetching, caching, provider fallback, and transformations."""

    def __init__(self, provider: Optional[BaseDataProvider] = None):
        self.provider = provider or YFinanceProvider()
        # In-memory LRU cache for ultra-fast repeated dashboard requests
        self._memory_cache: Dict[str, Dict[str, Any]] = {}

    def _get_cache_key(self, ticker: str, range_val: str, interval: str) -> str:
        return f"{ticker.upper()}:{range_val.lower()}:{interval.lower()}"

    async def get_history_df(
        self,
        ticker: str,
        range_val: str = "1y",
        interval: str = "1d",
        db: Optional[AsyncSession] = None
    ) -> pd.DataFrame:
        cache_key = self._get_cache_key(ticker, range_val, interval)
        now = datetime.utcnow()
        is_short_term = range_val.lower() in ["1d", "5d", "1m", "3m"] or interval.lower() in ["1m", "5m", "15m", "1h"]
        memory_ttl = 30 if is_short_term else settings.CACHE_EXPIRATION_SECONDS

        # 1. Check in-memory cache
        if cache_key in self._memory_cache:
            entry = self._memory_cache[cache_key]
            if now - entry["timestamp"] < timedelta(seconds=memory_ttl):
                return entry["df"].copy()

        # 2. Check Database cache if DB session provided
        if db:
            try:
                stmt = select(CachedPriceData).where(
                    and_(
                        CachedPriceData.ticker == ticker.upper(),
                        CachedPriceData.range_param == range_val.lower(),
                        CachedPriceData.interval_param == interval.lower()
                    )
                )
                res = await db.execute(stmt)
                cached_row = res.scalars().first()
                if cached_row and cached_row.updated_at:
                    ttl_seconds = settings.HISTORICAL_CACHE_EXPIRATION_SECONDS if range_val in ["1y", "5y", "max"] else settings.CACHE_EXPIRATION_SECONDS
                    if now - cached_row.updated_at < timedelta(seconds=ttl_seconds):
                        records = cached_row.data
                        df = pd.DataFrame(records)
                        df["Date"] = pd.to_datetime(df["Date"])
                        self._memory_cache[cache_key] = {"df": df, "timestamp": now}
                        return df
            except Exception as e:
                logger.warning(f"Error querying price cache: {e}")

        # 3. Fetch from provider
        df = await self.provider.get_history(ticker, range_val, interval)
        
        # 4. Save to in-memory cache
        self._memory_cache[cache_key] = {"df": df, "timestamp": now}

        # 5. Save to DB cache asynchronously if available
        if db:
            try:
                # Convert date to string for JSON serialization
                export_df = df.copy()
                export_df["Date"] = export_df["Date"].dt.strftime("%Y-%m-%d %H:%M:%S")
                json_data = export_df.to_dict(orient="records")

                stmt = select(CachedPriceData).where(
                    and_(
                        CachedPriceData.ticker == ticker.upper(),
                        CachedPriceData.range_param == range_val.lower(),
                        CachedPriceData.interval_param == interval.lower()
                    )
                )
                res = await db.execute(stmt)
                cached_row = res.scalars().first()
                if cached_row:
                    cached_row.data = json_data
                    cached_row.updated_at = now
                else:
                    new_cache = CachedPriceData(
                        ticker=ticker.upper(),
                        range_param=range_val.lower(),
                        interval_param=interval.lower(),
                        data=json_data,
                        updated_at=now
                    )
                    db.add(new_cache)
                await db.commit()
            except Exception as e:
                logger.warning(f"Failed to persist cache in DB: {e}")

        return df

    async def get_ticker_info(self, ticker: str) -> Dict[str, Any]:
        return await self.provider.get_ticker_info(ticker)

    async def search_tickers(self, query: str) -> List[Dict[str, Any]]:
        return await self.provider.search_tickers(query)

    async def get_news(self, ticker: str, limit: int = 10) -> List[Dict[str, Any]]:
        return await self.provider.get_news(ticker, limit)

data_service = DataService()

