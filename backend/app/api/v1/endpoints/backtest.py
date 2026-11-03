from fastapi import APIRouter, HTTPException
from backend.app.schemas.portfolio import BacktestRequest, BacktestResponse
from backend.app.services.backtester_service import backtester_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("", response_model=BacktestResponse)
async def run_backtest(req: BacktestRequest):
    """
    Runs historical backtesting of the transparent Signal Score strategy
    against a Buy & Hold benchmark. Reports equity curve, drawdown, win rate,
    profit factor, and full trade log.
    """
    try:
        result = await backtester_service.run_backtest(
            ticker=req.ticker,
            strategy=req.strategy,
            range_val=req.range,
            initial_capital=req.initial_capital,
            buy_threshold=req.buy_threshold,
            sell_threshold=req.sell_threshold,
            commission_pct=req.commission_pct
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error executing backtest: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Backtest execution failed: {str(e)}")
