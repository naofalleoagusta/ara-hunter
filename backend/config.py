import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = f"sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ara_hunter.db')}"
    cors_origins: list[str] = ["*"]
    yahoo_cache_days: int = 1
    idx_delay: float = 1.0
    idx_max_retries: int = 3
    idx_timeout: int = 30
    scan_max_stocks: int = 900

    class Config:
        env_file = ".env"


settings = Settings()
