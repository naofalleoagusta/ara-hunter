---
type: project
created: 2026-05-31
updated: 2026-05-31
---

# Project Conventions

## Tech Stack
- **Frontend:** Next.js 15 App Router + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first config, no v3)
- **Data Fetching:** TanStack React Query v5
- **Charts:** Recharts v2 (dynamically imported via `next/dynamic`)
- **Backend:** Python FastAPI + SQLAlchemy + SQLite
- **Market Data:** yfinance (yahoo finance fetcher)

## Design System
- **Accent:** #c84b31 (orange-red, used for CTAs, score indicators)
- **Surface:** #f8f6f3 (page background)
- **Card:** #ffffff (component backgrounds)
- **Border:** #e6e0d6 (dividers, card borders)
- **Text:** #1a1a1a (primary), #8a8580 (muted)
- **Green:** #2e7d32 (positive, bullish)
- **Red:** #c62828 (negative, bearish)
- **Amber:** #e67e22 (warning, watch)
- **Blue:** #1565c0 (used for TradingView brand hover)
- **Rounded:** `rounded-xl` (cards), `rounded-lg` (buttons), `rounded-md` (small controls)
- **Typography:** `font-serif` for headings, `font-sans` for body

## Signal Thresholds
- `>= 70`: Strong Buy (purple)
- `>= 50`: Buy (green)
- `>= 30`: Watch (amber)
- `< 30`: Pass (gray)
- 5 dimensions: Momentum (30%), Technical (25%), Volume (20%), Proximity (15%), Consistency (10%)

## Code Organization
- Components in `frontend/components/` (named PascalCase, one per file)
- API functions in `frontend/lib/api.ts`
- React Query hooks in `frontend/lib/queries.ts`
- Page routes in `frontend/app/` following App Router conventions
- Backend routes in `backend/main.py`
- Scoring logic in `backend/screening/scorer.py`
- Indicators in `backend/data/yahoo_fetcher.py` (calculate_indicators)

## ML Model
- Random Forest (300 trees, max_depth=5, min_samples_leaf=10, class_weight='balanced')
- Training: 1000 observations from 50-week backtest (208 ARA hits, 792 misses)
- 22 features: raw indicators + engineered (acceleration, vol_x_mom, rsi_sq, bb_x_rsi, up_ratio, room_pct, price_tier, log_price)
- Two-stage ranking: scorer top 50 → ML re-rank → dynamic threshold (default 0.6)
- Backtest (50wk recent data): Precision@1=70.6%, hit rate @0.6=66.2%, @0.5=58.6%
- 2-year backtest underperforms (noisier older data) — use recent 50wk model
- Training pipeline: `backend/ml_train.py`, prediction: `backend/ara_ml.py`
- Model saved as `backend/ara_predictor.pkl` via joblib (lazy-loaded in ara_ml.py)

## ML Confidence Thresholds (Frontend)
  | Level  | Range       | Color |
  |--------|-------------|-------|
  | High   | prob >= 0.6 | Green |
  | Medium | prob >= 0.5 | Amber |
  | Low    | prob < 0.5  | Muted |

## ML-First UI
- Dashboard: MLConfidenceBadge primary on cards, "High confidence" count, Top ML Confidence metric
- Results page: sorted by ml_prob, Prob column shown
- Stock detail: MLConfidenceBadge in header before ScoreBadge, ML Confidence metric card, Prob in history
- StockRatingReasoning: ML Confidence section as first factor card, ML-first summary text
- MLConfidenceBadge component shares same styling pattern as ScoreBadge

## Performance Patterns
- Heavy chart libraries (recharts) imported via `next/dynamic` with `ssr: false`
- Expensive computations wrapped in `useMemo`
- Components memoized with `React.memo` where re-render is costly
- `keepPreviousData` replaced with `(prev) => prev` (TanStack Query v5)
- Zero-volume rows filtered from yfinance DataFrames before computing indicators
- Candlestick chart coordinates memoized (candles, yLabels, xLabels)

## Page Layout (Stock Detail)
1. Header (ticker, price, back link)
2. Price Chart (with timeframe + view toggles, TV/SB external links)
3. 52-Week Range
4. Rating Analysis (Strengths/Concerns/Summary)
5. Radar Score + Metric Cards
6. Score Trend
7. Screening History
