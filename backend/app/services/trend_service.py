import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from backend.app.services.indicator_service import IndicatorService

class TrendService:
    """Quantitative trend classification, candlestick pattern recognition, and transparent Signal Score engine."""

    @staticmethod
    def detect_candlestick_patterns(df: pd.DataFrame, lookback: int = 10) -> List[Dict[str, Any]]:
        """Detect candlestick patterns over the trailing lookback bars."""
        if len(df) < 5:
            return []

        patterns = []
        recent_df = df.iloc[-lookback:].copy().reset_index(drop=True)

        for i in range(1, len(recent_df)):
            curr = recent_df.iloc[i]
            prev = recent_df.iloc[i - 1]
            date_str = curr["Date"].strftime("%Y-%m-%d") if hasattr(curr["Date"], "strftime") else str(curr["Date"])

            o, h, l, c = curr["Open"], curr["High"], curr["Low"], curr["Close"]
            prev_o, prev_c = prev["Open"], prev["Close"]

            body = abs(c - o)
            candle_range = h - l
            if candle_range <= 0:
                continue

            upper_shadow = h - max(o, c)
            lower_shadow = min(o, c) - l

            # 1. Doji
            if body <= (candle_range * 0.08):
                patterns.append({
                    "date": date_str,
                    "name": "Doji",
                    "type": "neutral",
                    "description": "Indicates market indecision where buyers and sellers reached equilibrium.",
                    "reliability": "Medium"
                })

            # 2. Hammer (Bullish reversal pattern)
            elif lower_shadow >= (2.0 * body) and upper_shadow <= (0.2 * body) and body > 0:
                patterns.append({
                    "date": date_str,
                    "name": "Hammer",
                    "type": "bullish",
                    "description": "Bullish rejection of lower prices; sellers pushed lower but buyers regained control.",
                    "reliability": "High"
                })

            # 3. Inverted Hammer (Bullish potential reversal)
            elif upper_shadow >= (2.0 * body) and lower_shadow <= (0.2 * body) and body > 0:
                patterns.append({
                    "date": date_str,
                    "name": "Inverted Hammer",
                    "type": "bullish",
                    "description": "Buyers tested higher prices aggressively; indicates potential upward pressure.",
                    "reliability": "Medium"
                })

            # 4. Bullish Engulfing
            elif prev_c < prev_o and c > o and o <= prev_c and c >= prev_o:
                patterns.append({
                    "date": date_str,
                    "name": "Bullish Engulfing",
                    "type": "bullish",
                    "description": "Green candle completely engulfs previous red candle body, signaling aggressive buyer dominance.",
                    "reliability": "High"
                })

            # 5. Bearish Engulfing
            elif prev_c > prev_o and c < o and o >= prev_c and c <= prev_o:
                patterns.append({
                    "date": date_str,
                    "name": "Bearish Engulfing",
                    "type": "bearish",
                    "description": "Red candle completely engulfs previous green candle body, signaling strong selling takeover.",
                    "reliability": "High"
                })

            # 6. Three-bar patterns (Morning Star / Evening Star)
            if i >= 2:
                two_back = recent_df.iloc[i - 2]
                tb_o, tb_c = two_back["Open"], two_back["Close"]
                tb_body = abs(tb_c - tb_o)

                # Morning Star (Bullish reversal)
                if tb_c < tb_o and tb_body > 0 and abs(prev_c - prev_o) < (tb_body * 0.5) and c > o and c > (tb_o + tb_c) / 2:
                    patterns.append({
                        "date": date_str,
                        "name": "Morning Star",
                        "type": "bullish",
                        "description": "Classic 3-candle bullish reversal pattern confirming downside exhaustion.",
                        "reliability": "Very High"
                    })

                # Evening Star (Bearish reversal)
                elif tb_c > tb_o and tb_body > 0 and abs(prev_c - prev_o) < (tb_body * 0.5) and c < o and c < (tb_o + tb_c) / 2:
                    patterns.append({
                        "date": date_str,
                        "name": "Evening Star",
                        "type": "bearish",
                        "description": "Classic 3-candle bearish reversal pattern confirming upward exhaustion.",
                        "reliability": "Very High"
                    })

        # Return latest unique patterns
        return patterns[-5:]

    @classmethod
    def classify_trend(cls, df: pd.DataFrame, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """Classify macro and micro trend based on MAs, ADX, and Regression Slope."""
        close = snapshot["close"]
        sma20 = snapshot["sma_20"]
        sma50 = snapshot["sma_50"]
        sma200 = snapshot["sma_200"]
        adx = snapshot["adx"]
        slope = snapshot["linear_regression_slope_pct"]

        # Check for Golden Cross or Death Cross in trailing 30 bars
        cross_event = None
        if len(df) >= 35:
            enriched = IndicatorService.compute_all_indicators(df)
            s50 = enriched["SMA_50"]
            s200 = enriched["SMA_200"]
            # Look at crossover in last 10 bars
            for idx in range(-10, -1):
                if s50.iloc[idx - 1] <= s200.iloc[idx - 1] and s50.iloc[idx] > s200.iloc[idx]:
                    cross_event = {
                        "type": "golden_cross",
                        "label": "Golden Cross",
                        "description": "50-day SMA crossed above 200-day SMA (Major Bullish Milestone)"
                    }
                    break
                elif s50.iloc[idx - 1] >= s200.iloc[idx - 1] and s50.iloc[idx] < s200.iloc[idx]:
                    cross_event = {
                        "type": "death_cross",
                        "label": "Death Cross",
                        "description": "50-day SMA crossed below 200-day SMA (Major Bearish Milestone)"
                    }
                    break

        # Check for 20-day breakout
        recent_high_20 = df["High"].iloc[-21:-1].max() if len(df) >= 21 else df["High"].max()
        recent_low_20 = df["Low"].iloc[-21:-1].min() if len(df) >= 21 else df["Low"].min()

        breakout = "none"
        breakout_desc = "Price trading inside 20-day high/low boundaries."
        if close > recent_high_20:
            breakout = "bullish_breakout"
            breakout_desc = f"Price broke out above 20-day high (${recent_high_20:.2f})."
        elif close < recent_low_20:
            breakout = "bearish_breakdown"
            breakout_desc = f"Price broke down below 20-day low (${recent_low_20:.2f})."

        # Trend Classification:
        # Strong Uptrend: close > sma20 > sma50 > sma200 and slope > 0 and adx > 25
        # Uptrend: close > sma50 and slope > 0
        # Downtrend: close < sma50 and slope < 0
        # Sideways: ADX < 20 or mixed moving averages
        if adx < 18:
            primary_trend = "sideways"
            trend_strength = "Weak / Rangebound"
        elif close > sma50 and slope > 5:
            if close > sma20 and sma20 > sma50 and sma50 > sma200 and adx >= 25:
                primary_trend = "strong_uptrend"
                trend_strength = "Strong Bullish"
            else:
                primary_trend = "uptrend"
                trend_strength = "Moderate Bullish"
        elif close < sma50 and slope < -5:
            if close < sma20 and sma20 < sma50 and sma50 < sma200 and adx >= 25:
                primary_trend = "strong_downtrend"
                trend_strength = "Strong Bearish"
            else:
                primary_trend = "downtrend"
                trend_strength = "Moderate Bearish"
        else:
            primary_trend = "sideways"
            trend_strength = "Neutral / Consolidating"

        return {
            "primary_trend": primary_trend,
            "trend_strength": trend_strength,
            "adx_value": adx,
            "is_trending": adx >= 25,
            "linear_regression_slope_pct": slope,
            "cross_event": cross_event,
            "breakout": breakout,
            "breakout_description": breakout_desc,
            "ma_alignment": {
                "above_sma20": close > sma20,
                "above_sma50": close > sma50,
                "above_sma200": close > sma200,
                "golden_alignment": (sma20 > sma50 > sma200)
            }
        }

    @classmethod
    def calculate_signal_score(
        cls,
        df: pd.DataFrame,
        snapshot: Dict[str, Any],
        patterns: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculates the transparent Signal Score (-100 to +100).
        Every component and weight is strictly exposed with explanation.
        """
        components = []
        total_score = 0.0

        close = snapshot["close"]
        sma20 = snapshot["sma_20"]
        sma50 = snapshot["sma_50"]
        sma200 = snapshot["sma_200"]
        rsi = snapshot["rsi_14"]
        macd = snapshot["macd"]
        macd_signal = snapshot["macd_signal"]
        macd_hist = snapshot["macd_hist"]
        adx = snapshot["adx"]
        slope = snapshot["linear_regression_slope_pct"]
        bb_percent_b = snapshot["bb_percent_b"]

        # -------------------------------------------------------------------------
        # 1. Moving Average Trend (Max ±25 pts)
        # -------------------------------------------------------------------------
        ma_score = 0.0
        ma_details = []
        if close > sma20:
            ma_score += 7.0
            ma_details.append("Price > 20 SMA (+7)")
        else:
            ma_score -= 7.0
            ma_details.append("Price < 20 SMA (-7)")

        if close > sma50:
            ma_score += 8.0
            ma_details.append("Price > 50 SMA (+8)")
        else:
            ma_score -= 8.0
            ma_details.append("Price < 50 SMA (-8)")

        if close > sma200:
            ma_score += 10.0
            ma_details.append("Price > 200 SMA (+10)")
        else:
            ma_score -= 10.0
            ma_details.append("Price < 200 SMA (-10)")

        components.append({
            "name": "Moving Average Alignment",
            "category": "Trend",
            "weight": 25,
            "score": round(ma_score, 1),
            "reason": "; ".join(ma_details)
        })
        total_score += ma_score

        # -------------------------------------------------------------------------
        # 2. Momentum / RSI (Max ±20 pts)
        # -------------------------------------------------------------------------
        rsi_score = 0.0
        rsi_reason = ""
        if rsi >= 70:
            rsi_score = -10.0
            rsi_reason = f"RSI is overbought at {rsi:.1f} (exhaustion risk) (-10)"
        elif rsi <= 30:
            rsi_score = 10.0
            rsi_reason = f"RSI is oversold at {rsi:.1f} (potential mean-reversion bounce) (+10)"
        elif 50 <= rsi < 70:
            # Healthy bullish momentum
            rsi_score = 15.0 + ((rsi - 50) / 20.0) * 5.0
            rsi_reason = f"RSI is healthy bullish in active expansion zone ({rsi:.1f}) (+{rsi_score:.1f})"
        else:
            # Bearish momentum (30 to 50)
            rsi_score = -15.0 + ((rsi - 30) / 20.0) * 5.0
            rsi_reason = f"RSI is in bearish contraction zone ({rsi:.1f}) ({rsi_score:.1f})"

        components.append({
            "name": "RSI Momentum Oscillator",
            "category": "Momentum",
            "weight": 20,
            "score": round(rsi_score, 1),
            "reason": rsi_reason
        })
        total_score += rsi_score

        # -------------------------------------------------------------------------
        # 3. MACD Direction & Acceleration (Max ±20 pts)
        # -------------------------------------------------------------------------
        macd_score = 0.0
        macd_reasons = []
        if macd > macd_signal:
            macd_score += 12.0
            macd_reasons.append("MACD line above Signal (+12)")
        else:
            macd_score -= 12.0
            macd_reasons.append("MACD line below Signal (-12)")

        if macd_hist > 0:
            macd_score += 8.0
            macd_reasons.append("Positive histogram momentum (+8)")
        else:
            macd_score -= 8.0
            macd_reasons.append("Negative histogram momentum (-8)")

        components.append({
            "name": "MACD Convergence/Divergence",
            "category": "Momentum",
            "weight": 20,
            "score": round(macd_score, 1),
            "reason": "; ".join(macd_reasons)
        })
        total_score += macd_score

        # -------------------------------------------------------------------------
        # 4. Trend Strength & Direction (ADX + Slope) (Max ±15 pts)
        # -------------------------------------------------------------------------
        strength_score = 0.0
        strength_reasons = []
        if slope > 0:
            strength_score += 7.5
            strength_reasons.append(f"Positive 30-day linear regression slope ({slope:+.1f}%) (+7.5)")
        else:
            strength_score -= 7.5
            strength_reasons.append(f"Negative 30-day linear regression slope ({slope:+.1f}%) (-7.5)")

        if adx >= 25:
            # Multiplies conviction of the slope
            boost = 7.5 if slope > 0 else -7.5
            strength_score += boost
            strength_reasons.append(f"ADX at {adx:.1f} confirms strong directional trend ({boost:+.1f})")
        else:
            strength_reasons.append(f"ADX at {adx:.1f} shows low trend conviction (0)")

        components.append({
            "name": "Trend Strength (ADX & Slope)",
            "category": "Strength",
            "weight": 15,
            "score": round(strength_score, 1),
            "reason": "; ".join(strength_reasons)
        })
        total_score += strength_score

        # -------------------------------------------------------------------------
        # 5. Bollinger Bands Position (Max ±10 pts)
        # -------------------------------------------------------------------------
        bb_score = 0.0
        bb_reason = ""
        if bb_percent_b >= 1.0:
            bb_score = -8.0
            bb_reason = "Price pierced upper Bollinger Band (Extended / potential pullback) (-8)"
        elif bb_percent_b <= 0.0:
            bb_score = 8.0
            bb_reason = "Price pierced lower Bollinger Band (Oversold / potential bounce) (+8)"
        elif bb_percent_b >= 0.5:
            bb_score = 6.0
            bb_reason = "Price trading in upper Bollinger half (+6)"
        else:
            bb_score = -6.0
            bb_reason = "Price trading in lower Bollinger half (-6)"

        components.append({
            "name": "Bollinger Bands Volatility Envelope",
            "category": "Volatility",
            "weight": 10,
            "score": round(bb_score, 1),
            "reason": bb_reason
        })
        total_score += bb_score

        # -------------------------------------------------------------------------
        # 6. Candlestick Patterns (Max ±10 pts)
        # -------------------------------------------------------------------------
        pat_score = 0.0
        pat_reason = "No major reversal patterns in recent bars (0)"
        if patterns:
            latest_pat = patterns[-1]
            if latest_pat["type"] == "bullish":
                pat_score = 10.0
                pat_reason = f"Recent bullish pattern: {latest_pat['name']} detected (+10)"
            elif latest_pat["type"] == "bearish":
                pat_score = -10.0
                pat_reason = f"Recent bearish pattern: {latest_pat['name']} detected (-10)"
            else:
                pat_score = 0.0
                pat_reason = f"Recent neutral pattern: {latest_pat['name']} detected (0)"

        components.append({
            "name": "Candlestick Formations",
            "category": "Price Action",
            "weight": 10,
            "score": round(pat_score, 1),
            "reason": pat_reason
        })
        total_score += pat_score

        # Clamp score to [-100, 100]
        clamped_score = max(min(round(total_score, 1), 100.0), -100.0)

        # Categorize
        if clamped_score >= 60:
            category = "Strong Bullish"
            badge_color = "emerald"
        elif clamped_score >= 20:
            category = "Bullish"
            badge_color = "green"
        elif clamped_score <= -60:
            category = "Strong Bearish"
            badge_color = "rose"
        elif clamped_score <= -20:
            category = "Bearish"
            badge_color = "red"
        else:
            category = "Neutral"
            badge_color = "gray"

        return {
            "score": clamped_score,
            "category": category,
            "badge_color": badge_color,
            "components": components,
            "total_weight": 100
        }

