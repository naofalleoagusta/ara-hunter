import numpy as np
from typing import Any


def normalize(value, min_val, max_val) -> float:
    if value is None:
        return 0.0
    if max_val <= min_val:
        return 0.5
    clipped = np.clip(value, min_val, max_val)
    return float((clipped - min_val) / (max_val - min_val))


def score_momentum(indicators: dict[str, Any]) -> float:
    change_1d = indicators.get("price_change_1d") or 0
    change_3d = indicators.get("price_change_3d") or 0
    change_5d = indicators.get("price_change_5d") or 0
    weighted = change_1d * 0.5 + change_3d * 0.3 + change_5d * 0.2
    score = normalize(weighted, 0, 25)
    return round(score * 100, 1)


def score_volume(indicators: dict[str, Any]) -> float:
    vol_ratio = indicators.get("volume_ratio") or 0
    if vol_ratio <= 0:
        return 0.0
    score = normalize(vol_ratio, 1, 10)
    return round(score * 100, 1)


def score_technical(indicators: dict[str, Any]) -> float:
    scores = []

    rsi = indicators.get("rsi")
    if rsi is not None:
        if 70 <= rsi <= 90:
            rsi_score = 100
        elif 50 <= rsi < 70:
            rsi_score = 100
        elif rsi > 90:
            rsi_score = max(50, 100 - (rsi - 90) * 10)
        elif rsi >= 30:
            rsi_score = normalize(rsi, 30, 50) * 100
        else:
            rsi_score = 0
        scores.append(rsi_score)

    bb_pos = indicators.get("bb_position")
    if bb_pos is not None:
        if 0.8 <= bb_pos <= 1.0:
            bb_score = 100
        elif bb_pos > 1.0:
            bb_score = max(70, 100 - (bb_pos - 1.0) * 100)
        elif 0.6 <= bb_pos < 0.8:
            bb_score = 100
        elif bb_pos >= 0:
            bb_score = normalize(bb_pos, 0, 0.6) * 100
        else:
            bb_score = 0
        scores.append(bb_score)

    macd = indicators.get("macd_bullish")
    if macd is not None:
        scores.append(100 if macd else 0)

    if not scores:
        return 0.0
    return round(float(np.mean(scores)), 1)


def score_proximity(indicators: dict[str, Any]) -> float:
    remaining = indicators.get("ara_remaining_pct")
    limit = indicators.get("ara_limit_pct")
    if remaining is None or limit is None or limit <= 0:
        return 0.0
    score = normalize(remaining, 0, limit)
    return round((1 - score) * 100, 1)


def score_consistency(indicators: dict[str, Any]) -> float:
    up_days = indicators.get("consecutive_up_days") or 0
    if up_days <= 0:
        return 0.0
    if up_days <= 3:
        return round((up_days / 3) * 100, 1)
    if up_days <= 5:
        return round(100 - (up_days - 3) * 20, 1)
    return 40.0


def compute_total_score(indicators: dict[str, Any]) -> dict[str, float]:
    weights = {
        "momentum": 0.30,
        "volume": 0.20,
        "technical": 0.25,
        "proximity": 0.15,
        "consistency": 0.10,
    }

    scores = {
        "momentum_score": score_momentum(indicators),
        "volume_score": score_volume(indicators),
        "technical_score": score_technical(indicators),
        "proximity_score": score_proximity(indicators),
        "consistency_score": score_consistency(indicators),
    }

    total = (
        scores["momentum_score"] * weights["momentum"]
        + scores["volume_score"] * weights["volume"]
        + scores["technical_score"] * weights["technical"]
        + scores["proximity_score"] * weights["proximity"]
        + scores["consistency_score"] * weights["consistency"]
    )

    scores["total_score"] = round(total, 1)
    return scores
