# Ara-Hunter

IHSG stock screener for ARA (Auto Rejection Auction) potential.

Scans IDX stocks against a multi-dimensional scoring system to identify stocks approaching their ARA limit — the point where IDX's auto-rejection mechanism triggers a trading halt.

## Features

- **Dashboard** — Market overview with top gainers/losers, recent scans, buy signals
- **Live Scanning** — One-click scan of 900+ IDX stocks with progress tracking
- **Stock Detail** — Price charts (area/candlestick), 52-week range, radar score breakdown, metric cards, screening history
- **Search** — Ticker/company search with autocomplete
- **Results Table** — Sortable, filterable scan results with buy-signal toggle

## Scoring System

| Dimension | Weight | Measures |
|-----------|--------|---------|
| Momentum | 30% | 3-day and 5-day price change |
| Technical | 25% | RSI positioning, MACD trend, Bollinger Band position |
| Volume | 20% | Volume ratio vs 20-day average |
| Proximity | 15% | Distance from ARA limit price |
| Consistency | 10% | Consecutive up days, sustained buying pressure |

### Score Signals

| Range | Signal |
|-------|--------|
| >= 70 | Strong Buy |
| >= 50 | Buy |
| >= 30 | Watch |
| < 30 | Pass |

## Tech Stack

- **Backend:** Python + FastAPI + SQLAlchemy + SQLite + yfinance
- **Frontend:** Next.js 15 + React 19 + TanStack Query + recharts + Tailwind CSS v4
- **Data:** yfinance for price data, IDX website scraping for company universe

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+

### Install

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Run

```bash
./dev.sh
```

Or each service independently:

```bash
# Backend (http://localhost:8000)
cd backend && uvicorn main:app --reload --port 8000

# Frontend (http://localhost:3000)
cd frontend && npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/history` | Recent scan sessions |
| POST | `/api/scan` | Start a new scan |
| GET | `/api/scan/{id}` | Scan results with sorting/filtering |
| GET | `/api/stocks/{ticker}` | Stock detail with chart data |
| GET | `/api/movers` | Top gainers, losers, most active |
| GET | `/api/stocks/search` | Stock ticker/company search |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `8000` | Backend server port |
| `FRONTEND_PORT` | `3000` | Frontend dev server port |
| `API_BASE_URL` | `http://localhost:8000` | Backend URL for server-side fetches |

### Backend Settings (config.py)

| Setting | Default | Description |
|---------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./ara_hunter.db` | Database connection string |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |
| `YAHOO_CACHE_DAYS` | `1` | Cache TTL for yahoo finance data |
| `SCAN_MAX_STOCKS` | `900` | Maximum stocks per scan |

## Project Structure

```
ara-hunter/
  backend/
    main.py              FastAPI server
    config.py            Settings
    database.py          SQLAlchemy engine
    models.py            ORM models
    data/
      yahoo_fetcher.py   yfinance data fetching
      idx_client.py      IDX website scraping
    screening/
      engine.py          Scan orchestrator
      indicators.py      Technical indicators
      scorer.py          Scoring logic
  frontend/
    app/                 Next.js App Router pages
    components/          React components
    lib/
      api.ts             API client
      queries.ts         TanStack Query hooks
      api-server.ts      Server-side API client
  dev.sh                 Run both services
```
