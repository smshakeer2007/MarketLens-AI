from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
import logging
from backend.app.db.database import get_db
from backend.app.db.models import WatchlistItem
from backend.app.schemas.portfolio import WatchlistAddRequest, WatchlistItemResponse
from backend.app.services.data_service import data_service
from backend.app.services.indicator_service import IndicatorService
from backend.app.services.trend_service import TrendService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[WatchlistItemResponse])
async def get_watchlist(db: AsyncSession = Depends(get_db)):
    """
    Retrieves all watchlist items enriched with real-time price snapshot and Signal Score.
    """
    stmt = select(WatchlistItem).order_by(WatchlistItem.added_at.desc())
    result = await db.execute(stmt)
    items = result.scalars().all()

    enriched_items = []
    for item in items:
        price = None
        change_pct = None
        score = None
        category = "Neutral"
        try:
            info = await data_service.get_ticker_info(item.ticker)
            price = info.get("current_price")
            change_pct = info.get("change_percent")

            # Try to fetch quick signal score
            df = await data_service.get_history_df(item.ticker, range_val="6m", interval="1d")
            if len(df) >= 30:
                snap = IndicatorService.get_summary_snapshot(df)
                pats = TrendService.detect_candlestick_patterns(df)
                sig = TrendService.calculate_signal_score(df, snap, pats)
                score = sig.get("score")
                category = sig.get("category", "Neutral")
        except Exception as e:
            logger.warning(f"Could not enrich watchlist item {item.ticker}: {e}")

        enriched_items.append(
            WatchlistItemResponse(
                id=item.id,
                ticker=item.ticker,
                company_name=item.company_name or item.ticker,
                exchange=item.exchange,
                added_at=item.added_at,
                notes=item.notes,
                current_price=price,
                change_percent=change_pct,
                signal_score=score,
                signal_category=category
            )
        )

    return enriched_items

@router.post("", response_model=WatchlistItemResponse)
async def add_to_watchlist(req: WatchlistAddRequest, db: AsyncSession = Depends(get_db)):
    """
    Adds a stock ticker to the user's watchlist.
    """
    clean_ticker = req.ticker.strip().upper()

    # Check if already in watchlist
    stmt = select(WatchlistItem).where(WatchlistItem.ticker == clean_ticker)
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Ticker {clean_ticker} is already in your watchlist.")

    company_name = req.company_name
    exchange = req.exchange
    try:
        info = await data_service.get_ticker_info(clean_ticker)
        if not company_name:
            company_name = info.get("name", clean_ticker)
        if not exchange:
            exchange = info.get("exchange", "Unknown")
    except Exception:
        company_name = company_name or clean_ticker

    item = WatchlistItem(
        ticker=clean_ticker,
        company_name=company_name,
        exchange=exchange,
        notes=req.notes
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return WatchlistItemResponse(
        id=item.id,
        ticker=item.ticker,
        company_name=item.company_name,
        exchange=item.exchange,
        added_at=item.added_at,
        notes=item.notes
    )

@router.delete("/{ticker}")
async def remove_from_watchlist(ticker: str, db: AsyncSession = Depends(get_db)):
    """
    Removes a stock ticker from the watchlist.
    """
    clean_ticker = ticker.strip().upper()
    stmt = delete(WatchlistItem).where(WatchlistItem.ticker == clean_ticker)
    result = await db.execute(stmt)
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail=f"Ticker {clean_ticker} not found in watchlist.")

    return {"message": f"Successfully removed {clean_ticker} from watchlist."}
