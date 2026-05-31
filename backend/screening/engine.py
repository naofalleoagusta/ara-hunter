import json
import logging
from datetime import datetime
from typing import Any
from sqlalchemy.orm import Session

from data.idx_client import IDXClient
from data.yahoo_fetcher import fetch_historical, calculate_indicators
from screening.indicators import get_ara_limit_pct, calculate_ara_remaining_pct
from screening.scorer import compute_total_score
from models import ScreeningSession, ScreeningResult, MarketSnapshot

logger = logging.getLogger(__name__)


def run_screening(db: Session, session: ScreeningSession | None = None) -> int:
    idx = IDXClient()
    profiles = idx.get_company_profiles()
    logger.info(f"Loaded {len(profiles)} company profiles")

    if session is None:
        session = ScreeningSession(status="running", stocks_scanned=0)
        db.add(session)
        db.commit()

    scored_stocks: list[dict[str, Any]] = []
    total = len(profiles)
    session.total_stocks = total
    db.commit()

    for i, company in enumerate(profiles):
        ticker = company.get("kode", "").strip().upper()
        name = company.get("nama", "")

        if not ticker:
            continue

        try:
            df = fetch_historical(ticker, period="3mo")
            if df is None or df.empty:
                logger.debug(f"No data for {ticker}, skipping")
                continue

            indicators = calculate_indicators(df)
            price = indicators.get("current_price")

            ara_limit = get_ara_limit_pct(board=company.get("papan", ""), price=price)
            ara_remaining = calculate_ara_remaining_pct(price, ara_limit, indicators.get("price_change_1d"))
            indicators["ara_limit_pct"] = ara_limit
            indicators["ara_remaining_pct"] = ara_remaining

            scores = compute_total_score(indicators)

            scored_stocks.append({
                "ticker": ticker,
                "company_name": name,
                "sector": company.get("sektor", ""),
                "board": company.get("papan", ""),
                "price": price,
                "price_change_1d": indicators.get("price_change_1d"),
                "price_change_3d": indicators.get("price_change_3d"),
                "price_change_5d": indicators.get("price_change_5d"),
                "volume": indicators.get("current_volume"),
                "volume_ratio": indicators.get("volume_ratio"),
                "avg_volume_20d": indicators.get("avg_volume_20d"),
                "rsi": indicators.get("rsi"),
                "bb_position": indicators.get("bb_position"),
                "macd_bullish": indicators.get("macd_bullish"),
                "consecutive_up_days": indicators.get("consecutive_up_days"),
                "ara_limit_pct": ara_limit,
                "ara_proximity_pct": ara_remaining,
                **scores,
            })

            if (i + 1) % 10 == 0:
                logger.info(f"Processed {i + 1}/{total} stocks")
                db.commit()

            session.stocks_scanned = i + 1

        except Exception as e:
            logger.warning(f"Error processing {ticker}: {e}")
            continue

    scored_stocks.sort(key=lambda x: x.get("total_score", 0) or 0, reverse=True)

    for stock in scored_stocks:
        result = ScreeningResult(
            session_id=session.id,
            ticker=stock["ticker"],
            company_name=stock["company_name"],
            sector=stock["sector"],
            board=stock["board"],
            price=stock["price"],
            price_change_1d=stock["price_change_1d"],
            price_change_3d=stock["price_change_3d"],
            price_change_5d=stock["price_change_5d"],
            volume=stock["volume"],
            volume_ratio=stock["volume_ratio"],
            avg_volume_20d=stock["avg_volume_20d"],
            rsi=stock["rsi"],
            bb_position=stock["bb_position"],
            macd_bullish=stock["macd_bullish"],
            consecutive_up_days=stock["consecutive_up_days"],
            ara_limit_pct=stock["ara_limit_pct"],
            ara_proximity_pct=stock["ara_proximity_pct"],
            momentum_score=stock["momentum_score"],
            volume_score=stock["volume_score"],
            technical_score=stock["technical_score"],
            proximity_score=stock["proximity_score"],
            consistency_score=stock["consistency_score"],
            total_score=stock["total_score"],
        )
        db.add(result)

    session.status = "completed"
    session.stocks_scanned = len(scored_stocks)
    session.top_score = scored_stocks[0]["total_score"] if scored_stocks else None
    db.commit()

    try:
        sorted_by_1d = sorted(scored_stocks, key=lambda x: x.get("price_change_1d") or 0, reverse=True)
        gainers = [{"ticker": s["ticker"], "price": s["price"], "change": s.get("price_change_1d") or 0, "percent": s.get("price_change_1d") or 0, "volume": s.get("volume") or 0} for s in sorted_by_1d[:10]]
        losers = [{"ticker": s["ticker"], "price": s["price"], "change": s.get("price_change_1d") or 0, "percent": s.get("price_change_1d") or 0, "volume": s.get("volume") or 0} for s in sorted_by_1d[-10:]]
        sorted_by_vol = sorted(scored_stocks, key=lambda x: x.get("volume") or 0, reverse=True)
        most_active = [{"ticker": s["ticker"], "price": s["price"], "change": s.get("price_change_1d") or 0, "percent": s.get("price_change_1d") or 0, "volume": s.get("volume") or 0} for s in sorted_by_vol[:10]]
        movers_data = json.dumps({"gainers": gainers, "losers": losers, "most_active": most_active})
        existing = db.query(MarketSnapshot).order_by(MarketSnapshot.id.desc()).first()
        if existing:
            existing.data = movers_data
            existing.created_at = datetime.utcnow()
        else:
            db.add(MarketSnapshot(data=movers_data))
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to cache movers: {e}")

    logger.info(f"Screening complete: {len(scored_stocks)} stocks scored")
    return session.id
