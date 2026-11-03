from fastapi import APIRouter
from backend.app.api.v1.endpoints import stocks, compare, backtest, watchlist

api_router = APIRouter()
api_router.include_router(stocks.router, prefix="/stocks", tags=["Stocks & Technical Indicators"])
api_router.include_router(compare.router, prefix="/compare", tags=["Compare & Risk Analytics"])
api_router.include_router(backtest.router, prefix="/backtest", tags=["Strategy Backtester"])
api_router.include_router(watchlist.router, prefix="/watchlist", tags=["Portfolio Watchlist"])
