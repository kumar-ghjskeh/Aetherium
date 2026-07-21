import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.domain.ai import (
    AETHERIUM_DETERMINISTIC_PROVIDER,
    DISABLED_PROVIDER,
    OPENAI_PROVIDER,
)


def test_settings_defaults_use_aetherium_isolation_names() -> None:
    settings = Settings(_env_file=None)

    assert settings.redis_key_prefix.startswith("aetherium:")
    assert settings.object_storage_bucket.startswith("aetherium")
    assert settings.object_storage_derived_assets_bucket.startswith("aetherium")
    assert settings.object_storage_user_avatars_bucket.startswith("aetherium")
    assert settings.file_ingestion_queue_name.startswith("aetherium:")
    assert settings.session_cookie_name != "session"
    assert "aetherium" in settings.session_cookie_name
    assert settings.ai_provider_default == DISABLED_PROVIDER
    assert settings.ai_external_calls_enabled is False


def test_settings_reject_non_aetherium_redis_prefix(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AETHERIUM_REDIS_KEY_PREFIX", "shared:")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_reject_generic_session_cookie_name(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AETHERIUM_SESSION_COOKIE_NAME", "session")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_reject_non_aetherium_bucket_name(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AETHERIUM_OBJECT_STORAGE_BUCKET", "shared-files")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_reject_non_aetherium_file_ingestion_queue(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AETHERIUM_FILE_INGESTION_QUEUE_NAME", "shared:file-ingestion")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_reject_ingestion_overlap_larger_than_chunk_size(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AETHERIUM_FILE_INGESTION_CHUNK_SIZE_CHARS", "100")
    monkeypatch.setenv("AETHERIUM_FILE_INGESTION_CHUNK_OVERLAP_CHARS", "100")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_reject_insecure_production_file_upload_verification(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "production")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-production-test-secret")
    monkeypatch.setenv("AETHERIUM_SESSION_COOKIE_SECURE", "true")
    monkeypatch.setenv("AETHERIUM_S3_ACCESS_KEY_ID", "aetherium-access")
    monkeypatch.setenv("AETHERIUM_S3_SECRET_ACCESS_KEY", "aetherium-secret")
    monkeypatch.setenv("AETHERIUM_FILE_VAULT_VERIFY_UPLOADS", "false")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_reject_unknown_ai_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AETHERIUM_AI_PROVIDER_DEFAULT", "shared-ai-provider")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_reject_external_ai_provider_without_enablement(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AETHERIUM_AI_PROVIDER_DEFAULT", OPENAI_PROVIDER)
    monkeypatch.setenv("AETHERIUM_AI_OPENAI_API_KEY", "aetherium-openai-test-key")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_reject_openai_default_without_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AETHERIUM_AI_PROVIDER_DEFAULT", OPENAI_PROVIDER)
    monkeypatch.setenv("AETHERIUM_AI_EXTERNAL_CALLS_ENABLED", "true")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_reject_deterministic_ai_provider_in_production(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AETHERIUM_APP_ENV", "production")
    monkeypatch.setenv("AETHERIUM_SESSION_SIGNING_SECRET", "aetherium-production-test-secret")
    monkeypatch.setenv("AETHERIUM_SESSION_COOKIE_SECURE", "true")
    monkeypatch.setenv("AETHERIUM_S3_ACCESS_KEY_ID", "aetherium-access")
    monkeypatch.setenv("AETHERIUM_S3_SECRET_ACCESS_KEY", "aetherium-secret")
    monkeypatch.setenv("AETHERIUM_FILE_VAULT_VERIFY_UPLOADS", "true")
    monkeypatch.setenv("AETHERIUM_AI_PROVIDER_DEFAULT", AETHERIUM_DETERMINISTIC_PROVIDER)

    with pytest.raises(ValidationError):
        Settings(_env_file=None)
