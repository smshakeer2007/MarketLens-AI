import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any
from sklearn.preprocessing import StandardScaler
from backend.app.services.indicator_service import IndicatorService

class FeaturePipeline:
    """Zero-leakage backward-looking feature engineering pipeline for financial time-series."""

    FEATURE_NAMES = [
        "ret_1", "ret_2", "ret_3", "ret_5", "ret_10",
        "vol_5", "vol_20",
        "dist_sma20", "dist_sma50",
        "rsi", "macd_hist",
        "vol_ratio"
    ]

    @classmethod
    def create_features(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Builds strictly backward-looking features without lookahead leakage.
        Returns (X_df, y_series) where y is the 1-step ahead close price.
        """
        df = df.copy()
        close = df["Close"]
        vol = df["Volume"]

        # 1. Trailing Returns (strictly backwards)
        features = pd.DataFrame(index=df.index)
        features["ret_1"] = close.pct_change(1)
        features["ret_2"] = close.pct_change(2)
        features["ret_3"] = close.pct_change(3)
        features["ret_5"] = close.pct_change(5)
        features["ret_10"] = close.pct_change(10)

        # 2. Rolling historical volatility of log returns
        log_ret = np.log(close / close.shift(1))
        features["vol_5"] = log_ret.rolling(5).std()
        features["vol_20"] = log_ret.rolling(20).std()

        # 3. Distance from Moving Averages
        sma20 = IndicatorService.calculate_sma(close, 20)
        sma50 = IndicatorService.calculate_sma(close, 50)
        features["dist_sma20"] = (close - sma20) / sma20.replace(0, np.nan)
        features["dist_sma50"] = (close - sma50) / sma50.replace(0, np.nan)

        # 4. Oscillators
        features["rsi"] = IndicatorService.calculate_rsi(close, 14) / 100.0  # scaled [0, 1]
        macd_dict = IndicatorService.calculate_macd(close)
        features["macd_hist"] = macd_dict["histogram"] / close.replace(0, np.nan)

        # 5. Volume activity
        avg_vol_20 = vol.rolling(20).mean()
        features["vol_ratio"] = (vol / avg_vol_20.replace(0, np.nan)).clip(upper=5.0)

        # Target: Next period's closing price
        target = close.shift(-1)

        # Drop NaN rows caused by rolling windows and shift
        valid_idx = features.dropna().index.intersection(target.dropna().index)
        
        X = features.loc[valid_idx]
        y = target.loc[valid_idx]
        
        return X, y

    @classmethod
    def get_latest_feature_vector(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Construct feature vector for the very latest bar (to predict future steps)."""
        X, _ = cls.create_features(df)
        # Even though target is NaN for the last bar in create_features,
        # we can build the features for the latest bar directly:
        df_copy = df.copy()
        close = df_copy["Close"]
        vol = df_copy["Volume"]

        latest_dict = {
            "ret_1": [float(close.pct_change(1).iloc[-1])],
            "ret_2": [float(close.pct_change(2).iloc[-1])],
            "ret_3": [float(close.pct_change(3).iloc[-1])],
            "ret_5": [float(close.pct_change(5).iloc[-1])],
            "ret_10": [float(close.pct_change(10).iloc[-1])],
            "vol_5": [float(np.log(close / close.shift(1)).rolling(5).std().iloc[-1])],
            "vol_20": [float(np.log(close / close.shift(1)).rolling(20).std().iloc[-1])],
            "dist_sma20": [float((close.iloc[-1] - IndicatorService.calculate_sma(close, 20).iloc[-1]) / IndicatorService.calculate_sma(close, 20).iloc[-1])],
            "dist_sma50": [float((close.iloc[-1] - IndicatorService.calculate_sma(close, 50).iloc[-1]) / IndicatorService.calculate_sma(close, 50).iloc[-1])],
            "rsi": [float(IndicatorService.calculate_rsi(close, 14).iloc[-1] / 100.0)],
            "macd_hist": [float(IndicatorService.calculate_macd(close)["histogram"].iloc[-1] / close.iloc[-1])],
            "vol_ratio": [float(min(vol.iloc[-1] / max(vol.rolling(20).mean().iloc[-1], 1.0), 5.0))]
        }
        return pd.DataFrame(latest_dict)

