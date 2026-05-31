import logging
import time
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

CACHE_TTL = 300
_fetch_cache: dict[str, tuple[float, Any]] = {}


def _cache_get(key: str) -> Any | None:
    entry = _fetch_cache.get(key)
    if entry and time.time() - entry[0] < CACHE_TTL:
        return entry[1]
    return None


def _cache_set(key: str, value: Any):
    _fetch_cache[key] = (time.time(), value)


def fetch_historical(ticker: str, period: str = "3mo") -> pd.DataFrame | None:
    cache_key = f"historical:{ticker}:{period}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    try:
        yahoo_ticker = f"{ticker}.JK"
        stock = yf.Ticker(yahoo_ticker)
        df = stock.history(period=period)
        if df.empty:
            return None
        _cache_set(cache_key, df)
        return df
    except Exception:
        return None


def fetch_extended_info(ticker: str) -> dict[str, Any]:
    cache_key = f"extended:{ticker}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    try:
        yahoo_ticker = f"{ticker}.JK"
        stock = yf.Ticker(yahoo_ticker)
        info = stock.info
        result = {
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
            "market_cap": info.get("marketCap"),
            "day_high": info.get("regularMarketDayHigh") or info.get("dayHigh"),
            "day_low": info.get("regularMarketDayLow") or info.get("dayLow"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
        }
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        logger.warning(f"Extended info fetch failed for {ticker}: {e}")
        return {k: None for k in ("fifty_two_week_high", "fifty_two_week_low", "market_cap", "day_high", "day_low", "sector", "industry")}


def fetch_current_price(ticker: str) -> float | None:
    try:
        yahoo_ticker = f"{ticker}.JK"
        stock = yf.Ticker(yahoo_ticker)
        info = stock.info
        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
        return float(price) if price else None
    except Exception:
        return None


def fetch_batch_prices(tickers: list[str]) -> list[dict[str, Any]]:
    if not tickers:
        return []

    yahoo_tickers = [f"{t}.JK" for t in tickers]
    results: list[dict[str, Any]] = []

    batch_size = 50
    for i in range(0, len(yahoo_tickers), batch_size):
        batch = yahoo_tickers[i:i + batch_size]
        try:
            ticker_str = " ".join(batch)
            data = yf.download(ticker_str, period="5d", group_by="ticker", progress=False, auto_adjust=True)
            if data.empty:
                continue

            for t in batch:
                code = t.replace(".JK", "")
                try:
                    if isinstance(data.columns, pd.MultiIndex):
                        ticker_data = data.xs(t, axis=1, level=0) if t in data.columns.get_level_values(0) else None
                        if ticker_data is None or ticker_data.empty:
                            continue
                        close = ticker_data["Close"] if "Close" in ticker_data.columns else None
                        volume = ticker_data["Volume"] if "Volume" in ticker_data.columns else None
                    else:
                        close = data["Close"] if "Close" in data.columns else None
                        volume = data["Volume"] if "Volume" in data.columns else None

                    if close is None or close.empty:
                        continue

                    close_vals = close.dropna()
                    if len(close_vals) < 2:
                        continue

                    price = float(close_vals.iloc[-1])
                    prev_close = float(close_vals.iloc[-2])
                    change = price - prev_close
                    percent = (change / prev_close) * 100 if prev_close else 0
                    vol = int(volume.dropna().iloc[-1]) if volume is not None and not volume.dropna().empty else 0

                    results.append({
                        "ticker": code,
                        "price": price,
                        "change": round(change, 2),
                        "percent": round(percent, 2),
                        "volume": vol,
                    })
                except Exception:
                    continue

            if i + batch_size < len(yahoo_tickers):
                time.sleep(0.5)

        except Exception as e:
            logger.warning(f"Batch download failed for batch starting at {i}: {e}")
            continue

    return results


_LIQUID_UNIVERSE: list[str] | None = None


def _get_liquid_universe(max_stocks: int = 200) -> list[str]:
    global _LIQUID_UNIVERSE
    if _LIQUID_UNIVERSE is not None:
        return _LIQUID_UNIVERSE
    import json, os
    path = os.path.join(os.path.dirname(__file__), "..", "backtest_universe.json")
    if os.path.exists(path):
        with open(path) as f:
            _LIQUID_UNIVERSE = json.load(f)[:max_stocks]
    else:
        _LIQUID_UNIVERSE = []
    return _LIQUID_UNIVERSE


def fetch_batch_prices_fast() -> list[dict[str, Any]]:
    codes = _get_liquid_universe()
    if not codes:
        return []
    cache_key = "batch_prices_fast"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    results = fetch_batch_prices(codes)
    _cache_set(cache_key, results)
    return results


def calculate_indicators(df: pd.DataFrame) -> dict[str, Any]:
    if df is None or df.empty:
        return {}

    df = df[df["Volume"] > 0].copy()
    if df.empty:
        return {}

    close = df["Close"]
    volume = df["Volume"]
    high = df["High"]
    low = df["Low"]

    result: dict[str, Any] = {}

    result["current_price"] = float(close.iloc[-1])
    result["current_volume"] = int(volume.iloc[-1]) if len(volume) > 0 else 0

    if len(close) >= 5:
        result["price_change_3d"] = float((close.iloc[-1] - close.iloc[-4]) / close.iloc[-4] * 100)
        result["price_change_5d"] = float((close.iloc[-1] - close.iloc[-6]) / close.iloc[-6] * 100) if len(close) >= 6 else None
    else:
        result["price_change_3d"] = None
        result["price_change_5d"] = None

    if len(close) >= 2:
        result["price_change_1d"] = float((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2] * 100)
    else:
        result["price_change_1d"] = None

    if len(volume) >= 20:
        avg_vol = volume.tail(20).mean()
        result["avg_volume_20d"] = int(avg_vol)
        result["volume_ratio"] = float(volume.iloc[-1] / avg_vol) if avg_vol > 0 else None
    else:
        result["avg_volume_20d"] = None
        result["volume_ratio"] = None

    if len(close) >= 14:
        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        result["rsi"] = float(rsi.iloc[-1]) if not pd.isna(rsi.iloc[-1]) else None
    else:
        result["rsi"] = None

    if len(close) >= 20:
        sma_20 = close.rolling(window=20).mean()
        std_20 = close.rolling(window=20).std()
        upper_bb = sma_20 + (std_20 * 2)
        lower_bb = sma_20 - (std_20 * 2)
        bb_width = upper_bb - lower_bb
        bb_pos = (close.iloc[-1] - lower_bb.iloc[-1]) / bb_width.iloc[-1] if bb_width.iloc[-1] != 0 else 0.5
        result["bb_position"] = float(bb_pos) if not pd.isna(bb_pos) else None
    else:
        result["bb_position"] = None

    if len(close) >= 26:
        ema_12 = close.ewm(span=12, adjust=False).mean()
        ema_26 = close.ewm(span=26, adjust=False).mean()
        macd_line = ema_12 - ema_26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        result["macd_bullish"] = int(macd_line.iloc[-1] > signal_line.iloc[-1])
    else:
        result["macd_bullish"] = None

    if len(close) >= 6:
        up_days = 0
        for i in range(-1, -6, -1):
            if close.iloc[i] > close.iloc[i - 1]:
                up_days += 1
        result["consecutive_up_days"] = up_days
    else:
        result["consecutive_up_days"] = 0

    if len(df) >= 15:
        tr = pd.concat([
            high - low,
            (high - close.shift(1)).abs(),
            (low - close.shift(1)).abs(),
        ], axis=1).max(axis=1)
        atr = tr.rolling(window=14).mean()
        atr_val = float(atr.iloc[-1]) if not pd.isna(atr.iloc[-1]) else None
        result["atr_14"] = atr_val
        current_price_val = result.get("current_price")
        result["atr_pct_14"] = (atr_val / current_price_val * 100) if atr_val and current_price_val else None
    else:
        result["atr_14"] = None
        result["atr_pct_14"] = None

    result["high_3d"] = float(high.tail(3).max()) if len(high) >= 3 else None
    result["low_3d"] = float(low.tail(3).min()) if len(low) >= 3 else None
    result["close_5d_ago"] = float(close.iloc[-6]) if len(close) >= 6 else None

    return result
