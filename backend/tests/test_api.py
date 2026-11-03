import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_root_and_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "online"
        assert "disclaimer" in data
        assert "educational" in data["disclaimer"].lower()

        health_res = await ac.get("/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_search_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/stocks/search?q=AAPL")
        assert res.status_code == 200
        results = res.json()
        assert isinstance(results, list)
        assert any(r["ticker"] == "AAPL" for r in results)

@pytest.mark.asyncio
async def test_search_indian_ticker():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/stocks/search?q=RELIANCE")
        assert res.status_code == 200
        results = res.json()
        assert any("RELIANCE" in r["ticker"] for r in results)

