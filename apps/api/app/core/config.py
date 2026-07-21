from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.domain.file_ingestion import (
    DEFAULT_CHUNK_OVERLAP_CHARS,
    DEFAULT_CHUNK_SIZE_CHARS,
    DEFAULT_INGESTION_MAX_ATTEMPTS,
    DEFAULT_WORKER_POLL_SECONDS,
)
from app.domain.file_vault import (
    MAX_FILE_SIZE_BYTES,
    PRESIGNED_DOWNLOAD_EXPIRES_SECONDS,
    PRESIGNED_UPLOAD_EXPIRES_SECONDS,
)

DEFAULT_DEV_SESSION_SIGNING_SECRET = "aetherium-dev-session-secret-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Aetherium API"
    app_version: str = "0.1.0"
    app_env: str = Field(default="development", validation_alias="AETHERIUM_APP_ENV")
    cors_origins: str = Field(
        default="http://localhost:3000",
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
    object_storage_endpoint: str = Field(
        default="http://localhost:9000",
        validation_alias="AETHERIUM_OBJECT_STORAGE_ENDPOINT",
    )
    object_storage_bucket: str = Field(
        default="aetherium-private-files-dev",
        validation_alias="AETHERIUM_OBJECT_STORAGE_BUCKET",
    )
    object_storage_derived_assets_bucket: str = Field(
        default="aetherium-derived-assets-dev",
        validation_alias="AETHERIUM_OBJECT_STORAGE_DERIVED_ASSETS_BUCKET",
    )
    object_storage_user_avatars_bucket: str = Field(
        default="aetherium-user-avatars-dev",
        validation_alias="AETHERIUM_OBJECT_STORAGE_USER_AVATARS_BUCKET",
    )
    s3_access_key_id: str | None = Field(
        default=None,
        validation_alias="AETHERIUM_S3_ACCESS_KEY_ID",
    )
    s3_secret_access_key: str | None = Field(
        default=None,
        validation_alias="AETHERIUM_S3_SECRET_ACCESS_KEY",
    )
    s3_region: str = Field(default="us-east-1", validation_alias="AETHERIUM_S3_REGION")
    file_vault_max_upload_bytes: int = Field(
        default=MAX_FILE_SIZE_BYTES,
        validation_alias="AETHERIUM_FILE_VAULT_MAX_UPLOAD_BYTES",
    )
    file_vault_upload_url_expires_seconds: int = Field(
        default=PRESIGNED_UPLOAD_EXPIRES_SECONDS,
        validation_alias="AETHERIUM_FILE_VAULT_UPLOAD_URL_EXPIRES_SECONDS",
    )
    file_vault_download_url_expires_seconds: int = Field(
        default=PRESIGNED_DOWNLOAD_EXPIRES_SECONDS,
        validation_alias="AETHERIUM_FILE_VAULT_DOWNLOAD_URL_EXPIRES_SECONDS",
    )
    file_vault_verify_uploads: bool = Field(
        default=False,
        validation_alias="AETHERIUM_FILE_VAULT_VERIFY_UPLOADS",
    )
    file_ingestion_max_attempts: int = Field(
        default=DEFAULT_INGESTION_MAX_ATTEMPTS,
        validation_alias="AETHERIUM_FILE_INGESTION_MAX_ATTEMPTS",
    )
    file_ingestion_chunk_size_chars: int = Field(
        default=DEFAULT_CHUNK_SIZE_CHARS,
        validation_alias="AETHERIUM_FILE_INGESTION_CHUNK_SIZE_CHARS",
    )
    file_ingestion_chunk_overlap_chars: int = Field(
        default=DEFAULT_CHUNK_OVERLAP_CHARS,
        validation_alias="AETHERIUM_FILE_INGESTION_CHUNK_OVERLAP_CHARS",
    )
    file_ingestion_embeddings_enabled: bool = Field(
        default=False,
        validation_alias="AETHERIUM_FILE_INGESTION_EMBEDDINGS_ENABLED",
    )
    file_ingestion_queue_name: str = Field(
        default="aetherium:file-ingestion",
        validation_alias="AETHERIUM_FILE_INGESTION_QUEUE_NAME",
    )
    worker_poll_seconds: int = Field(
        default=DEFAULT_WORKER_POLL_SECONDS,
        validation_alias="AETHERIUM_WORKER_POLL_SECONDS",
    )
    session_cookie_name: str = Field(
        default="aetherium_session",
        validation_alias="AETHERIUM_SESSION_COOKIE_NAME",
    )
    session_signing_secret: str = Field(
        default=DEFAULT_DEV_SESSION_SIGNING_SECRET,
        validation_alias="AETHERIUM_SESSION_SIGNING_SECRET",
    )
    session_duration_seconds: int = Field(
        default=60 * 60 * 24 * 14,
        validation_alias="AETHERIUM_SESSION_DURATION_SECONDS",
    )
    session_cookie_domain: str | None = Field(
        default=None,
        validation_alias="AETHERIUM_SESSION_COOKIE_DOMAIN",
    )
    session_cookie_path: str = Field(default="/", validation_alias="AETHERIUM_SESSION_COOKIE_PATH")
    session_cookie_samesite: Literal["lax", "strict", "none"] = Field(
        default="lax",
        validation_alias="AETHERIUM_SESSION_COOKIE_SAMESITE",
    )
    session_cookie_secure: bool | None = Field(
        default=None,
        validation_alias="AETHERIUM_SESSION_COOKIE_SECURE",
    )
    password_min_length: int = Field(
        default=12,
        validation_alias="AETHERIUM_PASSWORD_MIN_LENGTH",
    )
    argon2_time_cost: int = Field(default=3, validation_alias="AETHERIUM_ARGON2_TIME_COST")
    argon2_memory_cost: int = Field(default=65536, validation_alias="AETHERIUM_ARGON2_MEMORY_COST")
    argon2_parallelism: int = Field(default=4, validation_alias="AETHERIUM_ARGON2_PARALLELISM")
    auth_login_rate_limit_attempts: int = Field(
        default=5,
        validation_alias="AETHERIUM_AUTH_LOGIN_RATE_LIMIT_ATTEMPTS",
    )
    auth_login_rate_limit_window_seconds: int = Field(
        default=60,
        validation_alias="AETHERIUM_AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS",
    )
    auth_register_rate_limit_attempts: int = Field(
        default=3,
        validation_alias="AETHERIUM_AUTH_REGISTER_RATE_LIMIT_ATTEMPTS",
    )
    auth_register_rate_limit_window_seconds: int = Field(
        default=300,
        validation_alias="AETHERIUM_AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS",
    )

    @field_validator("cors_origins")
    @classmethod
    def reject_wildcard_cors_with_credentials(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        if "*" in origins:
            raise ValueError("Aetherium credentialed CORS must not use wildcard origins")
        if not origins:
            raise ValueError("At least one Aetherium CORS origin is required")

        return value

    @field_validator("redis_key_prefix")
    @classmethod
    def require_aetherium_redis_prefix(cls, value: str) -> str:
        if not value.startswith("aetherium:"):
            raise ValueError("Aetherium Redis keys must use the 'aetherium:' namespace prefix")

        return value

    @field_validator(
        "object_storage_bucket",
        "object_storage_derived_assets_bucket",
        "object_storage_user_avatars_bucket",
    )
    @classmethod
    def require_aetherium_bucket_prefix(cls, value: str) -> str:
        if not value.startswith("aetherium"):
            raise ValueError("Aetherium object-storage buckets must use an 'aetherium' prefix")

        return value

    @field_validator("file_vault_max_upload_bytes")
    @classmethod
    def require_positive_file_upload_limit(cls, value: int) -> int:
        if value < 1:
            raise ValueError("Aetherium file upload limit must be positive")

        return value

    @field_validator(
        "file_ingestion_max_attempts",
        "file_ingestion_chunk_size_chars",
        "worker_poll_seconds",
    )
    @classmethod
    def require_positive_ingestion_numbers(cls, value: int) -> int:
        if value < 1:
            raise ValueError("Aetherium ingestion numeric settings must be positive")

        return value

    @field_validator("file_ingestion_chunk_overlap_chars")
    @classmethod
    def require_nonnegative_chunk_overlap(cls, value: int) -> int:
        if value < 0:
            raise ValueError("Aetherium ingestion chunk overlap must not be negative")

        return value

    @field_validator("file_ingestion_queue_name")
    @classmethod
    def require_aetherium_ingestion_queue(cls, value: str) -> str:
        if not value.startswith("aetherium:"):
            raise ValueError("Aetherium ingestion queues must use the 'aetherium:' namespace")

        return value

    @field_validator(
        "file_vault_upload_url_expires_seconds",
        "file_vault_download_url_expires_seconds",
    )
    @classmethod
    def require_positive_presign_expiration(cls, value: int) -> int:
        if value < 60:
            raise ValueError("Aetherium presigned URL expirations must be at least 60 seconds")

        return value

    @field_validator("session_cookie_name")
    @classmethod
    def require_product_specific_session_cookie(cls, value: str) -> str:
        if value == "session" or "aetherium" not in value:
            raise ValueError("Aetherium session cookies must be product-specific")

        return value

    @field_validator("session_duration_seconds")
    @classmethod
    def require_positive_session_duration(cls, value: int) -> int:
        if value < 300:
            raise ValueError("Aetherium session duration must be at least 300 seconds")

        return value

    @field_validator("password_min_length")
    @classmethod
    def require_reasonable_password_minimum(cls, value: int) -> int:
        if value < 12:
            raise ValueError("Aetherium password minimum length must be at least 12")

        return value

    @model_validator(mode="after")
    def require_production_secret_and_secure_cookie(self) -> "Settings":
        if self.app_env == "production":
            if self.session_signing_secret == DEFAULT_DEV_SESSION_SIGNING_SECRET:
                raise ValueError("A production Aetherium session signing secret is required")
            if not self.should_secure_session_cookie:
                raise ValueError("Aetherium production session cookies must be Secure")
            if not self.file_vault_verify_uploads:
                raise ValueError("Aetherium production file uploads must verify object storage")
            if not self.s3_access_key_id or not self.s3_secret_access_key:
                raise ValueError("Aetherium production object-storage credentials are required")
        if self.file_ingestion_chunk_overlap_chars >= self.file_ingestion_chunk_size_chars:
            raise ValueError("Aetherium ingestion chunk overlap must be smaller than chunk size")

        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def should_secure_session_cookie(self) -> bool:
        if self.session_cookie_secure is not None:
            return self.session_cookie_secure

        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
