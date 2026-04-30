from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    openai_api_key: str = "ollama"
    openai_base_url: str = "http://localhost:11434/v1"
    openai_model: str = "qwen2.5-coder:7b"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
