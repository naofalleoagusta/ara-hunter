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
    change_3d = indicators.get("price_change_3d") or 0
    change_5d = indicators.get("price_change_5d") or 0
    avg_momentum = (change_3d + change_5d) / 2
    score = normalize(avg_momentum, 0, 15)
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
        if 50 <= rsi <= 75:
            rsi_score = 100
        elif rsi > 75:
            rsi_score = max(0, 100 - (rsi - 75) * 4)
        elif rsi < 50:
            rsi_score = normalize(rsi, 30, 50) * 100
        else:
            rsi_score = 0
        scores.append(rsi_score)

    bb_pos = indicators.get("bb_position")
    if bb_pos is not None:
        if 0.6 <= bb_pos <= 0.9:
            bb_score = 100
        elif bb_pos > 0.9:
            bb_score = max(0, 100 - (bb_pos - 0.9) * 500)
        elif bb_pos < 0.6:
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
    ara_proximity = indicators.get("ara_proximity_pct")
    if ara_proximity is None:
        return 0.0
    score = normalize(ara_proximity, 1.47, 15.54)
    return round((1 - score) * 100, 1)


def score_consistency(indicators: dict[str, Any]) -> float:
    up_days = indicators.get("consecutive_up_days") or 0
    score = normalize(up_days, 0, 5)
    return round(score * 100, 1)


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
