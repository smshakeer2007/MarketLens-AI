import pytest
from backend.app.services.sentiment_service import sentiment_service
from backend.app.services.insights_service import insights_service

def test_vader_polarity_scoring():
    analyzer = sentiment_service.analyzer
    pos = analyzer.polarity_scores("Company reports stellar earnings and surges 15% to new all-time high.")
    assert pos["compound"] > 0.3

    neg = analyzer.polarity_scores("Stock plunges following catastrophic revenue decline and credit downgrade.")
    assert neg["compound"] < -0.3

@pytest.mark.asyncio
async def test_sentiment_service_structure():
    res = await sentiment_service.analyze_stock_sentiment("AAPL", limit=5)
    assert res["ticker"] == "AAPL"
    assert "overall_sentiment" in res
    assert -1.0 <= res["sentiment_score"] <= 1.0
    dist = res["distribution"]
    assert pytest.approx(dist["bullish_pct"] + dist["neutral_pct"] + dist["bearish_pct"], 0.1) == 100.0
    assert len(res["articles"]) > 0

def test_grounded_report_generation():
    mock_metrics = {
        "ticker": "AAPL",
        "close": 230.50,
        "change": 3.25,
        "change_percent": 1.43,
        "primary_trend": "uptrend",
        "signal_score": 45.0,
        "signal_score_category": "Bullish",
        "rsi": 58.4,
        "macd": 2.15,
        "macd_signal": 1.40,
        "macd_hist": 0.75,
        "sma_20": 225.0,
        "sma_50": 220.0,
        "sma_200": 200.0,
        "annualized_volatility_pct": 21.5,
        "atr_14": 4.10,
        "adx": 28.5,
        "linear_regression_slope_pct": 18.2,
        "patterns": [{"name": "Bullish Engulfing", "type": "bullish", "date": "2026-10-25", "reliability": "High"}],
        "sentiment_label": "Moderately Bullish",
        "sentiment_score": 0.35
    }

    report = insights_service._generate_grounded_report(mock_metrics)
    assert "AAPL" in report["executive_summary"]
    assert "230.50" in report["executive_summary"]
    assert len(report["bullish_factors"]) > 0
    assert len(report["bearish_factors"]) > 0
    assert "volatility_risk" in report
    assert "technical_indicator_verdict" in report
    # Grounding check
    assert report["grounding_metrics"]["close"] == 230.50
