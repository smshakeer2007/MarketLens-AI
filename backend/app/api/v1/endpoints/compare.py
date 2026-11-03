from fastapi import APIRouter, HTTPException
from backend.app.schemas.portfolio import CompareRequest, CompareResponse
from backend.app.services.portfolio_service import portfolio_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("", response_model=CompareResponse)
async def compare_stocks(req: CompareRequest):
    """
    Compares 2 to 5 stocks: normalized performance chart, risk comparison
    (volatility, Sharpe, max drawdown, beta vs benchmark, VaR 95%),
    and Pearson correlation matrix.
    """
    try:
        result = await portfolio_service.compare_stocks(
            tickers=req.tickers,
            range_val=req.range
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in compare_stocks: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")
