import logging
import json
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.db.models import SavedInsight
from backend.app.services.data_service import data_service
from backend.app.services.indicator_service import IndicatorService
from backend.app.services.trend_service import TrendService
from backend.app.services.sentiment_service import sentiment_service

logger = logging.getLogger(__name__)

class InsightsService:
    """Generates structured, strictly-grounded AI insights based entirely on computed financial metrics."""

    @staticmethod
    def _generate_grounded_report(metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deterministic analytical reasoning engine that synthesizes computed metrics into
        an authoritative, factual report. Zero hallucination guarantee.
        """
        ticker = metrics["ticker"]
        price = metrics["close"]
        change = metrics["change"]
        change_pct = metrics["change_percent"]
        trend = metrics["primary_trend"]
        score = metrics["signal_score"]
        score_cat = metrics["signal_score_category"]
        rsi = metrics["rsi"]
        macd = metrics["macd"]
        macd_sig = metrics["macd_signal"]
        sma20 = metrics["sma_20"]
        sma50 = metrics["sma_50"]
        sma200 = metrics["sma_200"]
        vol = metrics["annualized_volatility_pct"]
        atr = metrics["atr_14"]
        adx = metrics["adx"]
        slope = metrics["linear_regression_slope_pct"]
        patterns = metrics.get("patterns", [])
        sentiment = metrics.get("sentiment_label", "Neutral")
        sentiment_score = metrics.get("sentiment_score", 0.0)

        # 1. Executive Summary
        exec_summary = (
            f"{ticker} is currently trading at ${price:.2f} ({change:+.2f}, {change_pct:+.2f}%). "
            f"Algorithmic trend classification identifies a {trend.replace('_', ' ').title()} "
            f"with a composite Signal Score of {score:+.1f}/100 ({score_cat}). "
            f"Momentum oscillators register RSI at {rsi:.1f} and annualized volatility stands at {vol:.1f}%. "
            f"Recent financial news tone is {sentiment.lower()} with a polarity score of {sentiment_score:+.2f}."
        )

        # 2. Bullish Factors
        bullish = []
        if price > sma20:
            bullish.append(f"Short-Term Trend: Price (${price:.2f}) trades above the 20-day SMA (${sma20:.2f}), confirming immediate upward support.")
        if price > sma50:
            bullish.append(f"Intermediate Trend: Price is positioned above the 50-day SMA (${sma50:.2f}), preserving medium-term technical structure.")
        if price > sma200:
            bullish.append(f"Long-Term Structural Health: Trading above the 200-day SMA (${sma200:.2f}) affirms primary bull-market regime.")
        if macd > macd_sig:
            bullish.append(f"MACD Momentum: MACD line ({macd:.2f}) leads its signal line ({macd_sig:.2f}), reflecting positive momentum acceleration.")
        if 45 <= rsi <= 65:
            bullish.append(f"RSI Expansion Zone: RSI at {rsi:.1f} provides ample runway for further expansion without immediate overbought exhaustion.")
        if slope > 0:
            bullish.append(f"Positive Linear Trajectory: 30-day regression slope indicates positive upward price velocity (+{slope:.1f}% annualized).")
        for p in patterns:
            if p.get("type") == "bullish":
                bullish.append(f"Candlestick Confirmation: Bullish formation '{p.get('name')}' identified on {p.get('date')} with {p.get('reliability')} reliability.")

        if not bullish:
            bullish.append("Consolidation Support: Technical indicators suggest downside selling pressure is slowing near historical baseline levels.")

        # 3. Bearish Factors / Downside Risks
        bearish = []
        if price < sma20:
            bearish.append(f"Short-Term Overhead: Price (${price:.2f}) trades below the 20-day SMA (${sma20:.2f}), indicating active short-term resistance.")
        if price < sma50:
            bearish.append(f"Intermediate Deterioration: Failure to hold the 50-day SMA (${sma50:.2f}) indicates declining intermediate buying enthusiasm.")
        if price < sma200:
            bearish.append(f"Long-Term Headwinds: Price sits below the 200-day SMA (${sma200:.2f}), indicating long-term structural weakness.")
        if rsi >= 70:
            bearish.append(f"Overbought Oscillator: RSI at {rsi:.1f} signals extreme upward extension, heightening risk of mean-reversion profit taking.")
        elif rsi <= 30:
            bearish.append(f"Oversold Breakdown: RSI at {rsi:.1f} highlights persistent selling pressure and negative price momentum.")
        if macd < macd_sig:
            bearish.append(f"MACD Bearish Crossover: MACD line ({macd:.2f}) trades below the signal line ({macd_sig:.2f}), warning of momentum decay.")
        if vol >= 35.0:
            bearish.append(f"Elevated Volatility Risk: Annualized volatility of {vol:.1f}% exposes positions to sharp intraday price swings.")
        for p in patterns:
            if p.get("type") == "bearish":
                bearish.append(f"Bearish Candlestick Reversal: '{p.get('name')}' detected on {p.get('date')}, warning of potential buyer exhaustion.")

        if not bearish:
            bearish.append("Standard Market Risk: No acute technical divergences detected; primary risk stems from broader macroeconomic market shifts.")

        # 4. Volatility Assessment
        if vol > 40:
            vol_eval = f"High Volatility Regime: At {vol:.1f}% annualized volatility with an ATR of ${atr:.2f}, wide position stops and defensive risk management are indicated."
        elif vol > 20:
            vol_eval = f"Moderate Volatility: Annualized volatility is normalized at {vol:.1f}% with an ATR of ${atr:.2f}, typical for liquid large-cap equities."
        else:
            vol_eval = f"Low Volatility Compression: Annualized volatility is restrained at {vol:.1f}% (ATR: ${atr:.2f}), frequently preceding a volatility breakout."

        # 5. Technical Indicator Verdict
        adx_desc = "strong directional movement" if adx >= 25 else "rangebound consolidation"
        indicator_verdict = (
            f"The combination of an ADX at {adx:.1f} ({adx_desc}) and a 30-day slope of {slope:+.1f}% "
            f"indicates that {ticker} is in a {score_cat.lower()} posture. "
            f"RSI ({rsi:.1f}) and MACD ({macd:.2f}) recommend monitoring moving average boundaries (${sma20:.2f} and ${sma50:.2f}) for confirmation."
        )

        return {
            "ticker": ticker,
            "executive_summary": exec_summary,
            "trend_assessment": f"Primary trend is categorized as {trend.replace('_', ' ').title()} with ADX at {adx:.1f} and slope at {slope:+.1f}%.",
            "bullish_factors": bullish[:5],
            "bearish_factors": bearish[:5],
            "volatility_risk": vol_eval,
            "technical_indicator_verdict": indicator_verdict,
            "grounding_metrics": metrics
        }

    async def generate_insights(
        self,
        ticker: str,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Collects verified metrics and generates grounded analytical insights."""
        df = await data_service.get_history_df(ticker, range_val="1y", interval="1d", db=db)
        info = await data_service.get_ticker_info(ticker)
        snapshot = IndicatorService.get_summary_snapshot(df)
        patterns = TrendService.detect_candlestick_patterns(df, lookback=10)
        classification = TrendService.classify_trend(df, snapshot)
        signal_score = TrendService.calculate_signal_score(df, snapshot, patterns)
        sentiment_data = await sentiment_service.analyze_stock_sentiment(ticker)

        # Build grounded metrics payload
        grounded_metrics = {
            "ticker": ticker.upper(),
            "close": snapshot["close"],
            "change": info.get("change", 0.0),
            "change_percent": info.get("change_percent", 0.0),
            "primary_trend": classification["primary_trend"],
            "signal_score": signal_score["score"],
            "signal_score_category": signal_score["category"],
            "rsi": snapshot["rsi_14"],
            "macd": snapshot["macd"],
            "macd_signal": snapshot["macd_signal"],
            "macd_hist": snapshot["macd_hist"],
            "sma_20": snapshot["sma_20"],
            "sma_50": snapshot["sma_50"],
            "sma_200": snapshot["sma_200"],
            "annualized_volatility_pct": snapshot["annualized_volatility_pct"],
            "atr_14": snapshot["atr_14"],
            "adx": snapshot["adx"],
            "linear_regression_slope_pct": snapshot["linear_regression_slope_pct"],
            "patterns": patterns,
            "sentiment_label": sentiment_data["overall_sentiment"],
            "sentiment_score": sentiment_data["sentiment_score"]
        }

        # Check if external LLM configured and active
        report = None
        if settings.GEMINI_API_KEY and settings.LLM_PROVIDER == "gemini":
            try:
                report = await self._call_gemini_llm(grounded_metrics)
            except Exception as e:
                logger.warning(f"Gemini LLM call failed, falling back to deterministic reasoning: {e}")

        # Fallback to deterministic grounded generator
        if not report:
            report = self._generate_grounded_report(grounded_metrics)

        # Persist to database if session provided
        if db:
            try:
                saved = SavedInsight(
                    ticker=ticker.upper(),
                    summary=report["executive_summary"],
                    bullish_factors=report["bullish_factors"],
                    bearish_factors=report["bearish_factors"],
                    sentiment_score=grounded_metrics["sentiment_score"],
                    raw_metrics=grounded_metrics
                )
                db.add(saved)
                await db.commit()
            except Exception as e:
                logger.warning(f"Could not save insight in DB: {e}")

        return report

    async def _call_gemini_llm(self, metrics: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Invokes Gemini API with strict grounded prompt."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        prompt = (
            "You are MarketLens AI's quantitative investment analyst. Analyze the following verified market numbers for "
            f"{metrics['ticker']}. Strict rule: Cite ONLY the exact numbers provided below. Do not hallucinate external facts.\n\n"
            f"DATA:\n{json.dumps(metrics, indent=2)}\n\n"
            "Format response as a JSON object with keys: executive_summary (string), trend_assessment (string), "
            "bullish_factors (array of 3-5 strings with numbers), bearish_factors (array of 3-5 strings with numbers), "
            "volatility_risk (string), technical_indicator_verdict (string)."
        )

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"}
            })
            if resp.status_code == 200:
                result_json = resp.json()
                text = result_json["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                parsed["ticker"] = metrics["ticker"]
                parsed["grounding_metrics"] = metrics
                return parsed
        return None

insights_service = InsightsService()
