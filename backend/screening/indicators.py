ARA_LIMITS = [
    (50, 200, 35.0),
    (200, 500, 25.0),
    (500, 5000, 15.0),
    (5000, float("inf"), 7.0),
]


def get_ara_limit_pct(price: float | None) -> float | None:
    if price is None or price <= 0:
        return None
    price_rp = price
    for low, high, limit in ARA_LIMITS:
        if low <= price_rp < high:
            return limit
    return 7.0


def calculate_ara_proximity(price: float | None, ara_limit_pct: float | None) -> float | None:
    if price is None or ara_limit_pct is None:
        return None
    ara_price = price * (1 + ara_limit_pct / 100)
    distance_pct = (ara_price - price) / price * 100
    return float(distance_pct)


def calculate_ara_proximity_atr(price: float | None, ara_limit_pct: float | None, atr_pct_14: float | None) -> float | None:
    if any(v is None for v in [price, ara_limit_pct, atr_pct_14]) or atr_pct_14 <= 0:
        return None
    return float(ara_limit_pct / atr_pct_14)
