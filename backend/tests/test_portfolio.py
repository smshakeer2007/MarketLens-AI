import pytest
import pandas as pd
import numpy as np
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.services.portfolio_service import portfolio_service
from backend.app.services.backtester_service import backtester_service

def create_sample_df(n=100, trend="up"):
    dates = pd.date_range("2023-01-01", periods=n, freq="B")
    if trend == "up":
        prices = [100.0 * (1.002 ** i) + (i % 3) for i in range(n)]
    else:
        prices = [100.0 * (0.998 ** i) - (i % 2) for i in range(n)]
    
    df = pd.DataFrame({
        "Date": dates,
        "Open": [p - 0.5 for p in prices],
        "High": [p + 1.0 for p in prices],
        "Low": [p - 1.0 for p in prices],
        "Close": prices,
        "Volume": [1000000 + i * 1000 for i in range(n)]
    })
    return df

def test_risk_metrics():
    df = create_sample_df(100, trend="up")
    metrics = portfolio_service.calculate_risk_metrics(df)

    assert "annualized_volatility_pct" in metrics
    assert "max_drawdown_pct" in metrics
    assert "sharpe_ratio" in metrics
    assert "var_95_daily_pct" in metrics
    assert metrics["annualized_volatility_pct"] > 0
    assert metrics["max_drawdown_pct"] <= 0.0
    assert metrics["total_return_pct"] > 0

def test_rolling_scores_and_backtest_logic():
    df = create_sample_df(120, trend="up")
    from backend.app.services.indicator_service import IndicatorService
    enriched = IndicatorService.compute_all_indicators(df)
    scores = backtester_service._calculate_rolling_scores(enriched)

    assert len(scores) == len(df)
    assert not scores.isna().any()
    assert (scores >= -100.0).all() and (scores <= 100.0).all()

@pytest.mark.asyncio
async def test_watchlist_crud_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        test_ticker = "TEST_TICKER_X"
        
        # 1. Add to watchlist
        add_res = await ac.post("/api/v1/watchlist", json={
            "ticker": test_ticker,
            "company_name": "Test Company X",
            "exchange": "NASDAQ",
            "notes": "Testing watchlist"
        })
        assert add_res.status_code == 200
        data = add_res.json()
        assert data["ticker"] == test_ticker

        # 2. Duplicate rejection
        dup_res = await ac.post("/api/v1/watchlist", json={"ticker": test_ticker})
        assert dup_res.status_code == 400

        # 3. Get watchlist
        get_res = await ac.get("/api/v1/watchlist")
        assert get_res.status_code == 200
        watchlist = get_res.json()
        assert any(item["ticker"] == test_ticker for item in watchlist)

        # 4. Remove from watchlist
        del_res = await ac.delete(f"/api/v1/watchlist/{test_ticker}")
        assert del_res.status_code == 200

        # 5. Verify removal
        get_res2 = await ac.get("/api/v1/watchlist")
        assert not any(item["ticker"] == test_ticker for item in get_res2.json())

@pytest.mark.asyncio
async def test_pdf_report_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/stocks/AAPL/report.pdf")
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert len(res.content) > 1000
        assert res.content.startswith(b"%PDF")

