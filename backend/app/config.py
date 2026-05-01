from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    openai_api_key: str = "your-token-plan-api-key"
    openai_base_url: str = "https://token-plan-cn.xiaomimimo.com/v1"
    openai_model: str = "mimo-v2.5-pro"

    class Config:
        env_file = str(BACKEND_DIR / ".env")
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
