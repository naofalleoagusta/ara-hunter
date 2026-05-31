ARA_LIMITS_BY_BOARD: dict[str, float] = {
    "Utama": 25.0,
    "Pengembangan": 25.0,
    "Akselerasi": 35.0,
}


def get_ara_limit_pct(board: str | None, price: float | None = None) -> float | None:
    if board and board in ARA_LIMITS_BY_BOARD:
        return ARA_LIMITS_BY_BOARD[board]
    if price is not None and price > 0:
        return 25.0
    return None


def calculate_ara_remaining_pct(price: float | None, ara_limit_pct: float | None, price_change_1d: float | None) -> float | None:
    if price is None or ara_limit_pct is None or price_change_1d is None:
        return None
    remaining = ara_limit_pct - abs(price_change_1d)
    return float(max(0, remaining))
