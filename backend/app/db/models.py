import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from backend.app.db.database import Base

class CachedPriceData(Base):
    __tablename__ = "cached_prices"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(32), index=True, nullable=False)
    range_param = Column(String(16), nullable=False)
    interval_param = Column(String(16), nullable=False)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class WatchlistItem(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(32), unique=True, index=True, nullable=False)
    company_name = Column(String(255), nullable=True)
    exchange = Column(String(32), nullable=True)
    added_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

class ModelMetadata(Base):
    __tablename__ = "model_metadata"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(32), index=True, nullable=False)
    model_name = Column(String(64), nullable=False)
    horizon_days = Column(Integer, nullable=False)
    metrics = Column(JSON, nullable=False)  # MAE, RMSE, MAPE, Directional Accuracy
    beats_baseline = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SavedInsight(Base):
    __tablename__ = "saved_insights"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(32), index=True, nullable=False)
    summary = Column(Text, nullable=False)
    bullish_factors = Column(JSON, nullable=True)
    bearish_factors = Column(JSON, nullable=True)
    sentiment_score = Column(Float, nullable=True)
    raw_metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

