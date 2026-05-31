#!/usr/bin/env python3
"""Analyze indicator distributions across the stock universe to recalibrate scorer normalization ranges."""
import json
import os
import sys

import numpy as np
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.yahoo_fetcher import fetch_historical, calculate_indicators
from screening.indicators import get_ara_limit_pct


STOCKS_JSON = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "stocks.json")


def analyze():
    with open(STOCKS_JSON) as f:
        stocks = json.load(f)

    indicators_list = []
    codes = [s["kode"] for s in stocks[:400]]

    for ticker in tqdm(codes, desc="Analyzing"):
        df = fetch_historical(ticker, period="3mo")
        if df is None or df.empty:
            continue
        ind = calculate_indicators(df)
        price = ind.get("current_price")
        if not price:
            continue
        ara_limit = get_ara_limit_pct(price)
        if ara_limit is None:
            continue
        ind["ara_limit_pct"] = ara_limit
        atr_pct = ind.get("atr_pct_14")
        if atr_pct and atr_pct > 0:
            ind["ara_proximity_atr"] = ara_limit / atr_pct
        indicators_list.append(ind)

    print(f"\nAnalyzed {len(indicators_list)} stocks")

    fields = [
        ("price_change_3d", "Momentum 3d %"),
        ("price_change_5d", "Momentum 5d %"),
        ("volume_ratio", "Volume Ratio"),
        ("rsi", "RSI"),
        ("bb_position", "BB Position"),
        ("consecutive_up_days", "Consecutive Up Days"),
        ("ara_proximity_atr", "ARA Proximity (ATR distance)"),
        ("atr_pct_14", "ATR %"),
    ]

    for field, label in fields:
        values = [i[field] for i in indicators_list if i.get(field) is not None]
        if not values:
            print(f"\n{label} ({field}): NO DATA")
            continue
        arr = np.array(values)
        print(f"\n{label} ({field}):")
        print(f"  count={len(arr)}, mean={arr.mean():.2f}, std={arr.std():.2f}")
        print(f"  min={arr.min():.2f}, max={arr.max():.2f}")
        for p in [1, 5, 10, 25, 50, 75, 90, 95, 99]:
            print(f"  p{p}={np.percentile(arr, p):.2f}")

    print("\n\nSuggested normalization ranges (5th-95th percentile):")
    for field, label in fields:
        values = [i[field] for i in indicators_list if i.get(field) is not None]
        if not values:
            continue
        arr = np.array(values)
        p5 = np.percentile(arr, 5)
        p95 = np.percentile(arr, 95)
        p50 = np.percentile(arr, 50)
        print(f"  {label}: [{p5:.2f}, {p95:.2f}]  (median={p50:.2f})")


if __name__ == "__main__":
    analyze()
