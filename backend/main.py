import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, text

from config import settings
from database import engine, Base, SessionLocal, get_db
from models import ScreeningSession, ScreeningResult, MarketSnapshot
from screening.engine import run_screening

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ara-hunter")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE screening_results ADD COLUMN ml_prob FLOAT"))
            conn.commit()
        logger.info("Migration: added ml_prob column to screening_results")
    except Exception:
        pass

    db = SessionLocal()
    try:
        stale = db.query(ScreeningSession).filter(ScreeningSession.status == "running").all()
        for s in stale:
            s.status = "failed"
            s.error_message = "Scan interrupted on server restart"
            logger.warning(f"Expired stale scan session #{s.id}")
        if stale:
            db.commit()
    finally:
        db.close()

    yield


app = FastAPI(title="Ara-Hunter API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanResponse(BaseModel):
    session_id: int
    status: str
    message: str


class StockResultOut(BaseModel):
    id: int
    ticker: str
    company_name: Optional[str] = None
    sector: Optional[str] = None
    board: Optional[str] = None
    price: Optional[float] = None
    price_change_1d: Optional[float] = None
    price_change_3d: Optional[float] = None
    price_change_5d: Optional[float] = None
    volume: Optional[float] = None
    volume_ratio: Optional[float] = None
    rsi: Optional[float] = None
    bb_position: Optional[float] = None
    macd_bullish: Optional[int] = None
    consecutive_up_days: Optional[int] = None
    ara_limit_pct: Optional[float] = None
    ara_proximity_pct: Optional[float] = None
    momentum_score: Optional[float] = None
    volume_score: Optional[float] = None
    technical_score: Optional[float] = None
    proximity_score: Optional[float] = None
    consistency_score: Optional[float] = None
    total_score: Optional[float] = None
    ml_prob: Optional[float] = None

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    id: int
    created_at: datetime
    status: str
    stocks_scanned: int
    total_stocks: Optional[int] = None
    top_score: Optional[float] = None

    class Config:
        from_attributes = True


class MoversOut(BaseModel):
    ticker: str
    price: float
    change: float
    percent: float
    volume: float


def classify_signal(score: float | None) -> str:
    if score is None:
        return "Pass"
    if score >= 70:
        return "Strong Buy"
    if score >= 50:
        return "Buy"
    if score >= 30:
        return "Watch"
    return "Pass"





@app.post("/api/scan", response_model=ScanResponse)
async def start_scan(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    running = db.query(ScreeningSession).filter(ScreeningSession.status == "running").first()
    if running:
        raise HTTPException(
            status_code=409,
            detail={"message": f"Scan session #{running.id} is already in progress", "session_id": running.id},
        )
    session = ScreeningSession(status="running", stocks_scanned=0)
    db.add(session)
    db.commit()
    db.refresh(session)

    session_id = session.id

    background_tasks.add_task(run_scan_task, session_id)

    return ScanResponse(
        session_id=session_id,
        status="running",
        message="Scan started. Check /api/scan/{id} for results.",
    )


def run_scan_task(session_id: int):
    from database import SessionLocal
    db = SessionLocal()
    try:
        session = db.query(ScreeningSession).filter(ScreeningSession.id == session_id).first()
        if session:
            run_screening(db, session=session)
    except Exception as e:
        logger.error(f"Scan {session_id} failed: {e}")
        session = db.query(ScreeningSession).filter(ScreeningSession.id == session_id).first()
        if session:
            session.status = "failed"
            session.error_message = str(e)
            db.commit()
    finally:
        db.close()


@app.get("/api/scan/{session_id}", response_model=dict)
async def get_scan_results(
    session_id: int,
    sort: str = "total_score",
    order: str = "desc",
    min_score: float = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    session = db.query(ScreeningSession).filter(ScreeningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Scan session not found")

    query = db.query(ScreeningResult).filter(
        ScreeningResult.session_id == session_id,
        ScreeningResult.total_score >= min_score,
    )

    sort_col = getattr(ScreeningResult, sort, ScreeningResult.total_score)
    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    results = query.limit(limit).all()

    buy_signals = sum(
        1 for r in results
        if r.total_score is not None and r.total_score >= 50
    )

    return {
        "session": SessionOut.model_validate(session),
        "results": [StockResultOut.model_validate(r) for r in results],
        "total": len(results),
        "buy_signals": buy_signals,
    }


@app.get("/api/history", response_model=list[SessionOut])
async def get_history(limit: int = 20, db: Session = Depends(get_db)):
    sessions = (
        db.query(ScreeningSession)
        .order_by(desc(ScreeningSession.created_at))
        .limit(limit)
        .all()
    )
    return [SessionOut.model_validate(s) for s in sessions]


PERIOD_MAP = {
    "1d": "5d",
    "1w": "1mo",
    "1mo": "1mo",
    "3mo": "3mo",
    "6mo": "6mo",
    "1y": "1y",
}


@app.get("/api/stocks/search")
async def search_stocks(q: str = ""):
    import json, os
    path = os.path.join(os.path.dirname(__file__), "data", "stocks.json")
    if not os.path.exists(path):
        return []
    with open(path) as f:
        stocks = json.load(f)
    q = q.upper().strip()
    if not q:
        return [{"ticker": s["kode"], "company_name": s["nama"]} for s in stocks[:20]]
    results = []
    for s in stocks:
        ticker = s["kode"]
        name = s["nama"].upper()
        if q in ticker or q in name:
            results.append({"ticker": ticker, "company_name": s["nama"]})

    def sort_key(item):
        ticker = item["ticker"]
        name = item["company_name"].upper()
        if ticker == q:
            return (0, ticker)
        if ticker.startswith(q):
            return (1, ticker)
        if name.startswith(q):
            return (2, name)
        if q in ticker:
            return (3, ticker)
        return (4, name)

    results.sort(key=sort_key)
    return results[:20]


@app.get("/api/stocks/{ticker}", response_model=dict)
async def get_stock_detail(ticker: str, period: str = "1mo", db: Session = Depends(get_db)):
    ticker = ticker.upper()

    import json, os
    company_name = ticker
    stocks_path = os.path.join(os.path.dirname(__file__), "data", "stocks.json")
    if os.path.exists(stocks_path):
        with open(stocks_path) as f:
            for s in json.load(f):
                if s["kode"] == ticker:
                    company_name = s["nama"]
                    break

    latest = (
        db.query(ScreeningResult)
        .filter(ScreeningResult.ticker == ticker)
        .order_by(desc(ScreeningResult.id))
        .first()
    )

    history = (
        db.query(ScreeningResult)
        .filter(ScreeningResult.ticker == ticker)
        .order_by(desc(ScreeningResult.id))
        .limit(10)
        .all()
    ) if latest else []

    from data.yahoo_fetcher import fetch_historical, fetch_extended_info
    yf_period = PERIOD_MAP.get(period, "1mo")
    hist_result, ext_result = await asyncio.gather(
        asyncio.to_thread(fetch_historical, ticker, yf_period),
        asyncio.to_thread(fetch_extended_info, ticker),
    )
    chart_data = None
    if hist_result is not None and not hist_result.empty:
        chart_data = [
            {
                "date": str(idx.date()),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"]),
            }
            for idx, row in hist_result.iterrows()
            if row["Volume"] > 0
        ]

    extended = ext_result

    ara_target = None
    if latest and latest.price and latest.ara_limit_pct:
        ara_target = round(latest.price * (1 + latest.ara_limit_pct / 100), 2)

    return {
        "detail": StockResultOut.model_validate(latest) if latest else None,
        "history": [StockResultOut.model_validate(r) for r in history],
        "chart": chart_data,
        "extended": extended,
        "ara_target": ara_target,
        "ticker": ticker,
        "company_name": company_name,
    }


@app.get("/api/movers")
async def get_movers(db: Session = Depends(get_db)):
    snapshot = db.query(MarketSnapshot).order_by(desc(MarketSnapshot.created_at)).first()
    if snapshot:
        return json.loads(snapshot.data)

    from data.yahoo_fetcher import fetch_batch_prices_fast
    prices = fetch_batch_prices_fast()

    sorted_gainers = sorted(prices, key=lambda x: x["percent"], reverse=True)[:10]
    sorted_losers = sorted(prices, key=lambda x: x["percent"])[:10]
    sorted_volume = sorted(prices, key=lambda x: x["volume"], reverse=True)[:10]

    result = {
        "gainers": [MoversOut(**s).model_dump() for s in sorted_gainers],
        "losers": [MoversOut(**s).model_dump() for s in sorted_losers],
        "most_active": [MoversOut(**s).model_dump() for s in sorted_volume],
    }

    snapshot = MarketSnapshot(data=json.dumps(result))
    db.add(snapshot)
    db.commit()

    return result


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
