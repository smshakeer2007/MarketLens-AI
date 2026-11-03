from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import pandas as pd

class BaseDataProvider(ABC):
    """Abstract data provider interface for financial data sources."""

    @abstractmethod
    async def get_history(
        self,
        ticker: str,
        range_val: str = "1y",
        interval: str = "1d"
    ) -> pd.DataFrame:
        """Fetch historical OHLCV data as a pandas DataFrame."""
        pass

    @abstractmethod
    async def get_ticker_info(self, ticker: str) -> Dict[str, Any]:
        """Fetch company profile, key statistics, 52w range, volume."""
        pass

    @abstractmethod
    async def search_tickers(self, query: str) -> List[Dict[str, Any]]:
        """Search tickers with autocomplete suggestions."""
        pass

    @abstractmethod
    async def get_news(self, ticker: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent news articles for sentiment analysis."""
        pass

