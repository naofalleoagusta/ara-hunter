#!/usr/bin/env python3
import json
import os
import sys
import time
from collections import Counter
from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data.yahoo_fetcher import calculate_indicators
from screening.indicators import get_ara_limit_pct, calculate_ara_remaining_pct
from screening.scorer import compute_total_score
from ara_ml import predict_ara_probability

STOCKS_JSON = os.path.join(os.path.dirname(__file__), "data", "stocks.json")
PROFILES_JSON = os.path.join(os.path.dirname(__file__), "data", "profiles.json")
RESULTS_FILE = os.path.join(os.path.dirname(__file__), "backtest_results.json")
TOP_N = 20
ML_CANDIDATE_POOL = 50
PROB_THRESHOLD = 0.60
LOOKAHEAD = 5
BATCH_SIZE = 100


def batch_download(ticker_codes, start, end, batch_size=BATCH_SIZE):
    all_data = {}
    for i in range(0, len(ticker_codes), batch_size):
        batch = ticker_codes[i : i + batch_size]
        ytickers = [f"{t}.JK" for t in batch]
        try:
            ticker_str = " ".join(ytickers)
            data = yf.download(
                ticker_str,
                start=start,
                end=end,
                group_by="ticker",
                progress=False,
                auto_adjust=True,
            )
            if data.empty:
                continue
            for yt in ytickers:
                ticker = yt.replace(".JK", "")
                try:
                    if isinstance(data.columns, pd.MultiIndex):
                        if yt in data.columns.get_level_values(0):
                            td = data.xs(yt, axis=1, level=0).dropna(subset=['Close', 'Volume'])
                            if not td.empty:
                                all_data[ticker] = td
                    else:
                        all_data[batch[0]] = data.dropna(subset=['Close', 'Volume'])
                except Exception:
                    continue
        except Exception:
            pass
        if i + batch_size < len(ticker_codes):
            time.sleep(0.3)
    return all_data


def get_weekly_dates(weeks_back=26):
    today = datetime.now().date()
    current = today
    while current.weekday() != 2:
        current -= timedelta(days=1)
    dates = []
    end_date = current - timedelta(weeks=weeks_back - 1)
    d = current
    while d >= end_date:
        dates.append(d)
        d -= timedelta(weeks=1)
    dates.reverse()
    return dates


def build_profiles():
    if os.path.exists(PROFILES_JSON):
        with open(PROFILES_JSON) as f:
            profiles = json.load(f)
        has_board = any(p.get("papan") for p in profiles)
        if has_board:
            print(f"Loaded {len(profiles)} profiles with board info")
            return profiles

    with open(STOCKS_JSON) as f:
        stocks = json.load(f)
    for s in stocks:
        s.setdefault("papan", "Utama")
    print(f"Loaded {len(stocks)} stocks from IDX (default board: Utama)")
    return stocks


def run_backtest():
    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    profiles = build_profiles()
    universe = [p["kode"] for p in profiles if p.get("kode")]
    board_map = {p["kode"]: p.get("papan", "Utama") for p in profiles if p.get("kode")}

    dates = get_weekly_dates(weeks_back=52)
    today = datetime.now().date()
    dates = [d for d in dates if d + timedelta(days=LOOKAHEAD * 2 + 2) <= today]

    print(f"\nRunning backtest on {len(universe)} stocks over {len(dates)} weeks")
    print(f"Period: {dates[0]} to {dates[-1]} ({len(dates)} weeks)\n")

    full_start = dates[0] - timedelta(days=180)
    full_end = dates[-1] + timedelta(days=LOOKAHEAD * 2 + 2) + timedelta(days=1)
    print(f"Downloading data: {full_start} to {full_end}")
    all_data = batch_download(universe, full_start, full_end)
    print(f"Downloaded data for {len(all_data)} stocks\n")

    all_results = []

    for date_idx, d in enumerate(tqdm(dates, desc="Backtesting")):
        hist_start = pd.Timestamp(d - timedelta(days=120))
        hist_end = pd.Timestamp(d + timedelta(days=1))

        scored = []
        for ticker in universe:
            df = all_data.get(ticker)
            if df is None or df.empty:
                continue

            window = df.loc[hist_start:hist_end].copy()
            if len(window) < 20:
                continue

            indicators = calculate_indicators(window)
            price = indicators.get("current_price")
            if price is None or price <= 0:
                continue

            board = board_map.get(ticker, "Utama")
            ara_limit = get_ara_limit_pct(board=board, price=price)
            if ara_limit is None:
                continue
            indicators["ara_limit_pct"] = ara_limit
            indicators["ara_remaining_pct"] = calculate_ara_remaining_pct(
                price, ara_limit, indicators.get("price_change_1d")
            )
            scores = compute_total_score(indicators)
            total = scores.get("total_score", 0)
            scored.append({
                "ticker": ticker,
                "price": price,
                "ara_limit_pct": ara_limit,
                "total_score": total,
                "indicators": indicators,
                "scores": scores,
            })

        scored.sort(key=lambda x: x["total_score"], reverse=True)
        candidates = scored[:ML_CANDIDATE_POOL]

        for c in candidates:
            c["ml_prob"] = predict_ara_probability(c["indicators"], c["scores"])

        candidates.sort(key=lambda x: x["ml_prob"], reverse=True)
        top = [c for c in candidates if c["ml_prob"] >= PROB_THRESHOLD]
        if not top:
            top = candidates[:TOP_N]

        fwd_start = pd.Timestamp(d + timedelta(days=1))
        fwd_end = pd.Timestamp(d + timedelta(days=12))

        for rank, stock in enumerate(top, 1):
            ticker = stock["ticker"]
            price_on_d = stock["price"]
            ara_limit = stock["ara_limit_pct"]
            ara_price = price_on_d * (1 + ara_limit / 100)

            fdf = all_data.get(ticker)
            hit_ara = False
            best_return = 0.0
            if fdf is not None and not fdf.empty:
                fwd_window = fdf.loc[fwd_start:fwd_end]
                if not fwd_window.empty:
                    check_df = fwd_window.head(LOOKAHEAD)
                    if not check_df.empty:
                        highs = check_df["High"].values
                        if any(h >= ara_price for h in highs):
                            hit_ara = True
                        best_return = round(
                            float((check_df["High"].max() / price_on_d - 1) * 100), 2
                        )

            ind = stock.get("indicators", {})
            sub = stock.get("scores", {})
            all_results.append({
                "date": d.isoformat(),
                "ticker": ticker,
                "score": stock["total_score"],
                "ml_prob": stock.get("ml_prob", 0),
                "rank": rank,
                "price": price_on_d,
                "ara_limit": ara_limit,
                "ara_price": round(ara_price, 2),
                "hit_ara": hit_ara,
                "best_return": best_return,
                "price_change_1d": ind.get("price_change_1d"),
                "price_change_3d": ind.get("price_change_3d"),
                "price_change_5d": ind.get("price_change_5d"),
                "volume_ratio": ind.get("volume_ratio"),
                "avg_volume_20d": ind.get("avg_volume_20d"),
                "current_volume": ind.get("current_volume"),
                "rsi": ind.get("rsi"),
                "bb_position": ind.get("bb_position"),
                "macd_bullish": ind.get("macd_bullish"),
                "consecutive_up_days": ind.get("consecutive_up_days"),
                "atr_pct_14": ind.get("atr_pct_14"),
                "ara_remaining_pct": ind.get("ara_remaining_pct"),
                "momentum_score": sub.get("momentum_score"),
                "volume_score": sub.get("volume_score"),
                "technical_score": sub.get("technical_score"),
                "proximity_score": sub.get("proximity_score"),
                "consistency_score": sub.get("consistency_score"),
            })

    generate_report(all_results, dates)
    with open(RESULTS_FILE, "w") as f:
        json.dump(all_results, f, indent=2, default=str)
    print(f"\nDetailed results saved to {RESULTS_FILE}")


def generate_report(results, dates):
    print("\n" + "=" * 60)
    print("=== Backtest Results ===")
    print("=" * 60)
    print(f"Period: {dates[0]} to {dates[-1]} ({len(dates)} weeks)")

    distinct_tickers = set(r["ticker"] for r in results)
    print(f"Universe: {len(distinct_tickers)} stocks")
    print(f"Total observations: {len(results)}")
    print()

    for k in [1, 3, 5, 10, 20]:
        top_k = [r for r in results if r["rank"] <= k]
        hits = sum(1 for r in top_k if r["hit_ara"])
        pct = (hits / len(top_k) * 100) if top_k else 0
        print(f"Precision@{k}: {pct:.1f}%  (top {k} -> hit ARA within {LOOKAHEAD} days)")

    ml_high = [r for r in results if r.get("ml_prob", 0) >= 0.5]
    if ml_high:
        hits = sum(1 for r in ml_high if r["hit_ara"])
        print(f"\nML prob >= 0.5: {hits}/{len(ml_high)} = {hits/len(ml_high)*100:.1f}%")
    ml_high = [r for r in results if r.get("ml_prob", 0) >= 0.6]
    if ml_high:
        hits = sum(1 for r in ml_high if r["hit_ara"])
        print(f"ML prob >= 0.6: {hits}/{len(ml_high)} = {hits/len(ml_high)*100:.1f}%")
    ml_high = [r for r in results if r.get("ml_prob", 0) >= 0.7]
    if ml_high:
        hits = sum(1 for r in ml_high if r["hit_ara"])
        print(f"ML prob >= 0.7: {hits}/{len(ml_high)} = {hits/len(ml_high)*100:.1f}%")

    print("\nScore Bracket Analysis:")
    brackets = [
        (70, 100, "70-100"),
        (50, 69, "50-69"),
        (30, 49, "30-49"),
        (0, 29, "<30"),
    ]
    for lo, hi, label in brackets:
        bracket = [r for r in results if lo <= r["score"] <= hi]
        if bracket:
            hits = sum(1 for r in bracket if r["hit_ara"])
            pct = hits / len(bracket) * 100
            print(f"  {label:>5}: {pct:.1f}% hit rate ({len(bracket)} obs)")
        else:
            print(f"  {label:>5}: N/A (0 observations)")

    print(f"\nTop 10 Most Frequent ARA Hitters (within {LOOKAHEAD} days):")
    ticker_hits = Counter(r["ticker"] for r in results if r["hit_ara"])
    for ticker, count in ticker_hits.most_common(10):
        print(f"  {ticker}: hit {count} times")

    print("\nTop 10 by Average Best Return (when ranked):")
    ticker_returns = {}
    for r in results:
        ticker_returns.setdefault(r["ticker"], []).append(r["best_return"])
    avg_returns = {
        t: round(sum(v) / len(v), 2) for t, v in ticker_returns.items()
    }
    for ticker, avg_ret in sorted(
        avg_returns.items(), key=lambda x: x[1], reverse=True
    )[:10]:
        print(f"  {ticker}: {avg_ret:.2f}% avg return")


if __name__ == "__main__":
    run_backtest()
