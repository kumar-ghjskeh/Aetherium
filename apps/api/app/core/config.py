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
    app_env: str = Field(default="development", validation_alias="AETHERIUM_APP_ENV")
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        validation_alias="AETHERIUM_CORS_ORIGINS",
    )
    database_url: str = Field(
        default="postgresql+asyncpg://aetherium_app:aetherium_local_password@localhost:5432/aetherium_app_dev",
        validation_alias="AETHERIUM_DATABASE_URL",
    )
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        validation_alias="AETHERIUM_REDIS_URL",
    )
    redis_key_prefix: str = Field(
        default="aetherium:",
        validation_alias="AETHERIUM_REDIS_KEY_PREFIX",
    )
    object_storage_bucket: str = Field(
        default="aetherium-files-dev",
        validation_alias="AETHERIUM_OBJECT_STORAGE_BUCKET",
    )
    session_cookie_name: str = Field(
        default="aetherium_session",
        validation_alias="AETHERIUM_SESSION_COOKIE_NAME",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]

        return value

    @field_validator("redis_key_prefix")
    @classmethod
    def require_aetherium_redis_prefix(cls, value: str) -> str:
        if not value.startswith("aetherium:"):
            raise ValueError("Aetherium Redis keys must use the 'aetherium:' namespace prefix")

        return value

    @field_validator("object_storage_bucket")
    @classmethod
    def require_aetherium_bucket_prefix(cls, value: str) -> str:
        if not value.startswith("aetherium"):
            raise ValueError("Aetherium object-storage buckets must use an 'aetherium' prefix")

        return value

    @field_validator("session_cookie_name")
    @classmethod
    def require_product_specific_session_cookie(cls, value: str) -> str:
        if value == "session" or "aetherium" not in value:
            raise ValueError("Aetherium session cookies must be product-specific")

        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
