from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class ScreeningSession(Base):
    __tablename__ = "screening_sessions"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(20), default="running")  # running, completed, failed
    stocks_scanned = Column(Integer, default=0)
    total_stocks = Column(Integer, nullable=True)
    top_score = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)

    results = relationship("ScreeningResult", back_populates="session", cascade="all, delete-orphan")


class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("screening_sessions.id"), nullable=False)
    ticker = Column(String(10), nullable=False, index=True)
    company_name = Column(String(200), nullable=True)
    sector = Column(String(100), nullable=True)
    board = Column(String(50), nullable=True)

    price = Column(Float, nullable=True)
    price_change_1d = Column(Float, nullable=True)
    price_change_3d = Column(Float, nullable=True)
    price_change_5d = Column(Float, nullable=True)

    volume = Column(Float, nullable=True)
    volume_ratio = Column(Float, nullable=True)
    avg_volume_20d = Column(Float, nullable=True)

    rsi = Column(Float, nullable=True)
    bb_position = Column(Float, nullable=True)
    macd_bullish = Column(Integer, nullable=True)
    consecutive_up_days = Column(Integer, nullable=True)

    ara_limit_pct = Column(Float, nullable=True)
    ara_proximity_pct = Column(Float, nullable=True)

    momentum_score = Column(Float, nullable=True)
    volume_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    proximity_score = Column(Float, nullable=True)
    consistency_score = Column(Float, nullable=True)
    total_score = Column(Float, nullable=True, index=True)
    ml_prob = Column(Float, nullable=True)

    session = relationship("ScreeningSession", back_populates="results")

    class Config:
        from_attributes = True


class StockSnapshot(Base):
    __tablename__ = "stock_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), nullable=False, index=True)
    price = Column(Float, nullable=True)
    change_pct = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    value = Column(Float, nullable=True)
    frequency = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ARAEvent(Base):
    __tablename__ = "ara_events"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), nullable=False, index=True)
    company_name = Column(String(200), nullable=True)
    date = Column(DateTime, nullable=False)
    price_before = Column(Float, nullable=True)
    price_after = Column(Float, nullable=True)
    change_pct = Column(Float, nullable=True)
    source = Column(String(50), default="idx")  # idx, yahoo


class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
