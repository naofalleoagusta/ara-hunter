"""ML-based ARA probability prediction."""
import os
import warnings
from typing import Any

import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore", message="X does not have valid feature names")

MODEL_FILE = os.path.join(os.path.dirname(__file__), "ara_predictor.pkl")

_model = None
_feature_cols = None


def _load_model():
    global _model, _feature_cols
    if _model is None:
        data = joblib.load(MODEL_FILE)
        _model = data["model"]
        _feature_cols = data["feature_cols"]
    return _model, _feature_cols


def _to_feature_vec(indicators: dict[str, Any], scores: dict[str, float]) -> pd.DataFrame:
    ind = indicators
    sub = scores

    f = {
        "price_change_1d": ind.get("price_change_1d") or 0,
        "price_change_3d": ind.get("price_change_3d") or 0,
        "price_change_5d": ind.get("price_change_5d") or 0,
        "volume_ratio": ind.get("volume_ratio") or 0,
        "rsi": ind.get("rsi") or 0,
        "bb_position": ind.get("bb_position") or 0.5,
        "macd_bullish": ind.get("macd_bullish") or 0,
        "consecutive_up_days": ind.get("consecutive_up_days") or 0,
        "atr_pct_14": ind.get("atr_pct_14") or 0,
        "ara_remaining_pct": ind.get("ara_remaining_pct") or 0,
        "price": ind.get("current_price") or 0,
        "momentum_score": sub.get("momentum_score", 0),
        "volume_score": sub.get("volume_score", 0),
        "technical_score": sub.get("technical_score", 0),
        "proximity_score": sub.get("proximity_score", 0),
        "consistency_score": sub.get("consistency_score", 0),
        "score": sub.get("total_score", 0),
    }

    pc5 = abs(f["price_change_5d"])
    f["acceleration"] = f["price_change_1d"] / (pc5 / 5 + 0.01)
    f["vol_x_mom"] = f["volume_ratio"] * f["price_change_1d"]
    f["rsi_sq"] = f["rsi"] ** 2
    f["bb_x_rsi"] = f["bb_position"] * f["rsi"]
    f["up_ratio"] = f["consecutive_up_days"] / 5.0
    f["room_pct"] = f["ara_remaining_pct"] / 25.0

    p = f["price"]
    f["price_tier"] = 0.0 if p < 50 else 1.0 if p < 100 else 2.0 if p < 200 else 3.0 if p < 500 else 4.0
    f["log_price"] = np.log1p(p)

    return pd.DataFrame([f])


def predict_ara_probability(indicators: dict[str, Any], scores: dict[str, float]) -> float:
    model, feature_cols = _load_model()
    X = _to_feature_vec(indicators, scores)[feature_cols]
    prob = model.predict_proba(X)[0, 1]
    return round(float(prob), 4)
