import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

class IndicatorService:
    """Vectorized calculation engine for technical indicators with high numerical accuracy."""

    @staticmethod
    def calculate_sma(series: pd.Series, window: int) -> pd.Series:
        return series.rolling(window=window, min_periods=1).mean()

    @staticmethod
    def calculate_ema(series: pd.Series, span: int) -> pd.Series:
        return series.ewm(span=span, adjust=False, min_periods=1).mean()

    @staticmethod
    def calculate_bollinger_bands(series: pd.Series, window: int = 20, num_std: float = 2.0) -> Dict[str, pd.Series]:
        middle = series.rolling(window=window, min_periods=1).mean()
        std = series.rolling(window=window, min_periods=1).std(ddof=0)
        upper = middle + (std * num_std)
        lower = middle - (std * num_std)
        bandwidth = (upper - lower) / middle.replace(0, np.nan)
        percent_b = (series - lower) / (upper - lower).replace(0, np.nan)
        return {
            "middle": middle,
            "upper": upper,
            "lower": lower,
            "bandwidth": bandwidth.fillna(0),
            "percent_b": percent_b.fillna(0.5)
        }

    @staticmethod
    def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI using Wilder's exponential smoothing method."""
        delta = series.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)

        # First average is simple mean
        avg_gain = pd.Series(0.0, index=series.index)
        avg_loss = pd.Series(0.0, index=series.index)

        if len(series) <= period:
            return pd.Series(50.0, index=series.index)

        avg_gain.iloc[period] = gain.iloc[1:period + 1].mean()
        avg_loss.iloc[period] = loss.iloc[1:period + 1].mean()

        for i in range(period + 1, len(series)):
            avg_gain.iloc[i] = (avg_gain.iloc[i - 1] * (period - 1) + gain.iloc[i]) / period
            avg_loss.iloc[i] = (avg_loss.iloc[i - 1] * (period - 1) + loss.iloc[i]) / period

        # Standard RSI formula: when avg_loss is 0, RSI is 100; when avg_gain is 0, RSI is 0
        rsi = pd.Series(50.0, index=series.index)
        both_zero = (avg_gain == 0) & (avg_loss == 0)
        loss_zero = (avg_loss == 0) & (avg_gain > 0)
        gain_zero = (avg_gain == 0) & (avg_loss > 0)
        normal = (avg_gain > 0) & (avg_loss > 0)

        rsi[both_zero] = 50.0
        rsi[loss_zero] = 100.0
        rsi[gain_zero] = 0.0

        rs = avg_gain[normal] / avg_loss[normal]
        rsi[normal] = 100.0 - (100.0 / (1.0 + rs))

        rsi.iloc[:period] = 50.0
        return rsi.round(2)

    @staticmethod
    def calculate_macd(
        series: pd.Series,
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9
    ) -> Dict[str, pd.Series]:
        fast_ema = series.ewm(span=fast_period, adjust=False, min_periods=1).mean()
        slow_ema = series.ewm(span=slow_period, adjust=False, min_periods=1).mean()
        macd_line = fast_ema - slow_ema
        signal_line = macd_line.ewm(span=signal_period, adjust=False, min_periods=1).mean()
        histogram = macd_line - signal_line
        return {
            "macd": macd_line,
            "signal": signal_line,
            "histogram": histogram
        }

    @staticmethod
    def calculate_stochastic(
        high: pd.Series,
        low: pd.Series,
        close: pd.Series,
        k_period: int = 14,
        d_period: int = 3
    ) -> Dict[str, pd.Series]:
        lowest_low = low.rolling(window=k_period, min_periods=1).min()
        highest_high = high.rolling(window=k_period, min_periods=1).max()
        range_hl = (highest_high - lowest_low).replace(0, np.nan)
        k_percent = 100 * ((close - lowest_low) / range_hl)
        k_percent = k_percent.fillna(50.0)
        d_percent = k_percent.rolling(window=d_period, min_periods=1).mean()
        return {
            "k": k_percent,
            "d": d_percent
        }

    @staticmethod
    def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
        prev_close = close.shift(1)
        tr1 = high - low
        tr2 = (high - prev_close).abs()
        tr3 = (low - prev_close).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        # Wilder's smoothing
        atr = tr.ewm(alpha=1.0 / period, adjust=False, min_periods=1).mean()
        return atr

    @staticmethod
    def calculate_adx(
        high: pd.Series,
        low: pd.Series,
        close: pd.Series,
        period: int = 14
    ) -> Dict[str, pd.Series]:
        """Calculates Average Directional Index (ADX), +DI, -DI."""
        up_move = high.diff()
        down_move = -low.diff()

        plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
        minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)

        plus_dm_s = pd.Series(plus_dm, index=high.index)
        minus_dm_s = pd.Series(minus_dm, index=high.index)

        tr = IndicatorService.calculate_atr(high, low, close, period=1)
        smooth_tr = tr.ewm(alpha=1.0 / period, adjust=False, min_periods=1).mean()
        smooth_plus_dm = plus_dm_s.ewm(alpha=1.0 / period, adjust=False, min_periods=1).mean()
        smooth_minus_dm = minus_dm_s.ewm(alpha=1.0 / period, adjust=False, min_periods=1).mean()

        plus_di = 100.0 * (smooth_plus_dm / smooth_tr.replace(0, np.nan)).fillna(0)
        minus_di = 100.0 * (smooth_minus_dm / smooth_tr.replace(0, np.nan)).fillna(0)

        di_diff = (plus_di - minus_di).abs()
        di_sum = (plus_di + minus_di).replace(0, np.nan)
        dx = 100.0 * (di_diff / di_sum).fillna(0)
        adx = dx.ewm(alpha=1.0 / period, adjust=False, min_periods=1).mean()

        return {
            "adx": adx,
            "plus_di": plus_di,
            "minus_di": minus_di
        }

    @staticmethod
    def calculate_linear_regression_slope(close: pd.Series, window: int = 30) -> float:
        """Calculate normalized slope of linear regression over trailing window."""
        if len(close) < window:
            window = len(close)
        if window < 2:
            return 0.0

        y = close.iloc[-window:].values
        x = np.arange(len(y))
        
        # Fit polynomial deg 1
        slope, intercept = np.polyfit(x, y, 1)
        avg_price = np.mean(y) if np.mean(y) != 0 else 1.0
        # Annualized normalized slope in percent
        annualized_slope_pct = (slope / avg_price) * 252 * 100
        return round(float(annualized_slope_pct), 2)

    @staticmethod
    def calculate_pivot_points(high: float, low: float, close: float) -> Dict[str, float]:
        """Calculates standard classic pivot points."""
        pivot = (high + low + close) / 3.0
        r1 = (2 * pivot) - low
        s1 = (2 * pivot) - high
        r2 = pivot + (high - low)
        s2 = pivot - (high - low)
        r3 = high + 2 * (pivot - low)
        s3 = low - 2 * (high - pivot)
        return {
            "pivot": round(pivot, 2),
            "r1": round(r1, 2),
            "r2": round(r2, 2),
            "r3": round(r3, 2),
            "s1": round(s1, 2),
            "s2": round(s2, 2),
            "s3": round(s3, 2)
        }

    @classmethod
    def compute_all_indicators(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Enriches the input OHLCV dataframe with all technical indicators."""
        df = df.copy()
        close = df["Close"]
        high = df["High"]
        low = df["Low"]

        # Moving Averages
        df["SMA_20"] = cls.calculate_sma(close, 20)
        df["SMA_50"] = cls.calculate_sma(close, 50)
        df["SMA_200"] = cls.calculate_sma(close, 200)

        df["EMA_20"] = cls.calculate_ema(close, 20)
        df["EMA_50"] = cls.calculate_ema(close, 50)
        df["EMA_200"] = cls.calculate_ema(close, 200)

        # Bollinger Bands
        bb = cls.calculate_bollinger_bands(close, window=20, num_std=2.0)
        df["BB_Middle"] = bb["middle"]
        df["BB_Upper"] = bb["upper"]
        df["BB_Lower"] = bb["lower"]
        df["BB_Bandwidth"] = bb["bandwidth"]
        df["BB_PercentB"] = bb["percent_b"]

        # Oscillators
        df["RSI_14"] = cls.calculate_rsi(close, period=14)
        
        macd = cls.calculate_macd(close)
        df["MACD"] = macd["macd"]
        df["MACD_Signal"] = macd["signal"]
        df["MACD_Hist"] = macd["histogram"]

        stoch = cls.calculate_stochastic(high, low, close)
        df["Stoch_K"] = stoch["k"]
        df["Stoch_D"] = stoch["d"]

        # Volatility & Trend Strength
        df["ATR_14"] = cls.calculate_atr(high, low, close, period=14)
        
        adx = cls.calculate_adx(high, low, close, period=14)
        df["ADX"] = adx["adx"]
        df["ADX_PlusDI"] = adx["plus_di"]
        df["ADX_MinusDI"] = adx["minus_di"]

        return df

    @classmethod
    def get_summary_snapshot(cls, df: pd.DataFrame) -> Dict[str, Any]:
        """Returns the latest indicator snapshot and trailing key returns."""
        if df.empty:
            return {}

        enriched = cls.compute_all_indicators(df)
        latest = enriched.iloc[-1]
        
        # Calculate trailing returns
        close = df["Close"]
        c_now = close.iloc[-1]
        ret_1d = ((c_now / close.iloc[-2]) - 1.0) * 100 if len(close) >= 2 else 0.0
        ret_1w = ((c_now / close.iloc[-5]) - 1.0) * 100 if len(close) >= 5 else 0.0
        ret_1m = ((c_now / close.iloc[-21]) - 1.0) * 100 if len(close) >= 21 else 0.0
        
        # Annualized volatility from daily log returns
        daily_returns = np.log(close / close.shift(1)).dropna()
        ann_vol = float(daily_returns.std() * np.sqrt(252) * 100) if len(daily_returns) > 5 else 0.0

        # Pivot points from latest bar
        pivots = cls.calculate_pivot_points(float(latest["High"]), float(latest["Low"]), float(latest["Close"]))

        # Linear regression slope (30 days)
        lr_slope = cls.calculate_linear_regression_slope(close, window=30)

        return {
            "close": round(float(latest["Close"]), 2),
            "sma_20": round(float(latest["SMA_20"]), 2),
            "sma_50": round(float(latest["SMA_50"]), 2),
            "sma_200": round(float(latest["SMA_200"]), 2),
            "ema_20": round(float(latest["EMA_20"]), 2),
            "ema_50": round(float(latest["EMA_50"]), 2),
            "ema_200": round(float(latest["EMA_200"]), 2),
            "rsi_14": round(float(latest["RSI_14"]), 2),
            "macd": round(float(latest["MACD"]), 2),
            "macd_signal": round(float(latest["MACD_Signal"]), 2),
            "macd_hist": round(float(latest["MACD_Hist"]), 2),
            "stoch_k": round(float(latest["Stoch_K"]), 2),
            "stoch_d": round(float(latest["Stoch_D"]), 2),
            "bb_upper": round(float(latest["BB_Upper"]), 2),
            "bb_middle": round(float(latest["BB_Middle"]), 2),
            "bb_lower": round(float(latest["BB_Lower"]), 2),
            "bb_percent_b": round(float(latest["BB_PercentB"]), 3),
            "atr_14": round(float(latest["ATR_14"]), 2),
            "adx": round(float(latest["ADX"]), 2),
            "plus_di": round(float(latest["ADX_PlusDI"]), 2),
            "minus_di": round(float(latest["ADX_MinusDI"]), 2),
            "linear_regression_slope_pct": lr_slope,
            "return_1d_pct": round(float(ret_1d), 2),
            "return_1w_pct": round(float(ret_1w), 2),
            "return_1m_pct": round(float(ret_1m), 2),
            "annualized_volatility_pct": round(float(ann_vol), 2),
            "pivots": pivots
        }

