import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_settings_defaults_use_aetherium_isolation_names() -> None:
    settings = Settings(_env_file=None)

    assert settings.redis_key_prefix.startswith("aetherium:")
    assert settings.object_storage_bucket.startswith("aetherium")
    assert settings.session_cookie_name != "session"
    assert "aetherium" in settings.session_cookie_name


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
