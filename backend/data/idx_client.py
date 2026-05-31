import json
import logging
import os
import re
import time
from dataclasses import dataclass, field
from typing import Any

from curl_cffi import requests
from curl_cffi.requests import RequestsError
from config import settings

logger = logging.getLogger(__name__)

STOCKS_JSON_PATH = os.path.join(os.path.dirname(__file__), "stocks.json")


@dataclass
class StockData:
    code: str
    price: float
    change: float
    percent: float
    volume: float
    value: float
    frequency: float

    @property
    def is_gainer(self) -> bool:
        return self.percent > 0

    @property
    def is_loser(self) -> bool:
        return self.percent < 0


@dataclass
class IndexData:
    code: str
    closing: str
    change: str
    percent: str
    current: str
    time: str


class IDXClient:
    BASE_URL = "https://www.idx.co.id"
    COMPANY_PROFILES_PATH = "/id/perusahaan-tercatat/profil-perusahaan-tercatat/"

    def __init__(
        self,
        delay: float | None = None,
        max_retries: int | None = None,
        timeout: int | None = None,
    ):
        self.delay = delay or settings.idx_delay
        self.max_retries = max_retries or settings.idx_max_retries
        self.timeout = timeout or settings.idx_timeout
        self._last_request = 0.0
        self.session = self._create_session()
        self._stocks_cache: list[dict] | None = None

    def _create_session(self):
        s = requests.Session(impersonate="chrome124")
        s.headers.update({
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
            "Referer": "https://www.idx.co.id/",
        })
        return s

    def _rate_limit(self):
        elapsed = time.time() - self._last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_request = time.time()

    def _get(self, url: str, params: dict | None = None) -> str:
        self._rate_limit()
        for attempt in range(self.max_retries):
            try:
                resp = self.session.get(url, params=params, timeout=self.timeout)
                resp.raise_for_status()
                return resp.text
            except RequestsError as e:
                if attempt == self.max_retries - 1:
                    raise
                time.sleep(self.delay * (attempt + 1))
        return ""

    def get_company_profiles(self) -> list[dict]:
        if self._stocks_cache is not None:
            return self._stocks_cache

        html = self._get(f"{self.BASE_URL}{self.COMPANY_PROFILES_PATH}")

        stocks = self._parse_nuxt_state(html)
        if stocks:
            self._stocks_cache = stocks
            return stocks

        logger.warning("Nuxt parse returned no stocks, falling back to cached JSON")
        return self._load_fallback()

    def _parse_nuxt_state(self, html: str) -> list[dict]:
        match = re.search(r'window\.__NUXT__\s*=\s*(.*?);\s*</script>', html, re.DOTALL)
        if not match:
            return []

        raw = match.group(1)
        stocks = []

        for m in re.finditer(r'KodeEmiten:"([A-Z]+)"', raw):
            code = m.group(1)
            obj_start = raw.rfind('{', 0, m.start())
            obj_end = raw.find('}', m.end())
            if obj_start >= 0 and obj_end >= 0:
                obj_text = raw[obj_start:obj_end + 1]
                stock = {"kode": code}
                name_m = re.search(r'NamaEmiten:"([^"]*)"', obj_text)
                if name_m:
                    stock["nama"] = name_m.group(1)
                date_m = re.search(r'TanggalPencatatan:"([^"]*)"', obj_text)
                if date_m:
                    stock["tanggal_pencatatan"] = date_m.group(1)
                papan_m = re.search(r'JenisPapan:"([^"]*)"', obj_text)
                if papan_m:
                    stock["papan"] = papan_m.group(1)
                stocks.append(stock)

        return stocks

    def _load_fallback(self) -> list[dict]:
        if os.path.exists(STOCKS_JSON_PATH):
            with open(STOCKS_JSON_PATH) as f:
                return json.load(f)
        return []

    def get_stock_codes(self) -> list[str]:
        profiles = self.get_company_profiles()
        return [p["kode"] for p in profiles if p.get("kode")]

    def _parse_stock_list(self, data: Any, limit: int = 20) -> list[StockData]:
        results = []
        items = []
        if isinstance(data, dict) and "data" in data:
            items = data["data"]
        elif isinstance(data, list):
            items = data
        for item in items[:limit]:
            try:
                results.append(StockData(
                    code=item.get("KodeEmiten", "") or item.get("code", "") or "",
                    price=float(item.get("Harga", 0) or item.get("price", 0) or 0),
                    change=float(item.get("Perubahan", 0) or item.get("change", 0) or 0),
                    percent=float(item.get("Persen", 0) or item.get("percent", 0) or 0),
                    volume=float(item.get("Volume", 0) or item.get("volume", 0) or 0),
                    value=float(item.get("Nilai", 0) or item.get("value", 0) or 0),
                    frequency=float(item.get("Frekuensi", 0) or item.get("frequency", 0) or 0),
                ))
            except (ValueError, TypeError):
                continue
        return results

    def get_top_gainers(self, limit: int = 20) -> list[StockData]:
        return []

    def get_top_losers(self, limit: int = 20) -> list[StockData]:
        return []

    def get_top_volume(self, limit: int = 20) -> list[StockData]:
        return []

    def get_top_value(self, limit: int = 20) -> list[StockData]:
        return []

    def get_top_frequent(self, limit: int = 20) -> list[StockData]:
        return []

    def screen_market(
        self,
        gainers_only: bool = False,
        min_change: float = 0,
        min_volume: float = 0,
        price_min: float | None = None,
        price_max: float | None = None,
    ) -> list[StockData]:
        return []
