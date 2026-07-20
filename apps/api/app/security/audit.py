import hashlib
import hmac
import logging

from app.core.config import Settings

logger = logging.getLogger("aetherium.security")


def fingerprint_identifier(identifier: str, settings: Settings) -> str:
    return hmac.new(
        settings.session_signing_secret.encode("utf-8"),
        identifier.strip().casefold().encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:16]


def log_security_event(
    event: str,
    settings: Settings,
    *,
    user_id: str | None = None,
    email: str | None = None,
) -> None:
    extra: dict[str, str] = {"event": event}
    if user_id is not None:
        extra["user_id"] = user_id
    if email is not None:
        extra["email_fingerprint"] = fingerprint_identifier(email, settings)

    logger.info("aetherium_auth_event", extra=extra)
