from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Git for Research Backend"
    debug: bool = False
    database_url: str = "sqlite:///./gfr.db"
    cors_allow_origins: list[str] = [
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(
        env_prefix="GFR_",
        env_file=".env",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
