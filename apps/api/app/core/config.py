from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Aetherium API"
    app_version: str = "0.1.0"
    app_env: str = Field(default="development", validation_alias="APP_ENV")
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        validation_alias="CORS_ORIGINS",
    )
    database_url: str = Field(
        default="postgresql+asyncpg://aetherium:aetherium@localhost:5432/aetherium",
        validation_alias="DATABASE_URL",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]

        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
