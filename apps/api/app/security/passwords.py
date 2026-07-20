import hashlib
import hmac
import secrets
from dataclasses import dataclass

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from argon2.low_level import Type

from app.core.config import Settings

PASSWORD_MAX_LENGTH = 128


class PasswordPolicyError(ValueError):
    pass


def normalize_email(email: str) -> str:
    return email.strip().casefold()


def validate_password_strength(password: str, minimum_length: int = 12) -> None:
    if len(password) < minimum_length:
        raise PasswordPolicyError(f"Password must be at least {minimum_length} characters long")
    if len(password) > PASSWORD_MAX_LENGTH:
        raise PasswordPolicyError(f"Password must be at most {PASSWORD_MAX_LENGTH} characters long")
    if not any(character.islower() for character in password):
        raise PasswordPolicyError("Password must include a lowercase letter")
    if not any(character.isupper() for character in password):
        raise PasswordPolicyError("Password must include an uppercase letter")
    if not any(character.isdigit() for character in password):
        raise PasswordPolicyError("Password must include a number")
    if not any(not character.isalnum() for character in password):
        raise PasswordPolicyError("Password must include a symbol")


def create_password_hasher(settings: Settings) -> PasswordHasher:
    return PasswordHasher(
        time_cost=settings.argon2_time_cost,
        memory_cost=settings.argon2_memory_cost,
        parallelism=settings.argon2_parallelism,
        type=Type.ID,
    )


@dataclass(frozen=True)
class PasswordService:
    settings: Settings

    def hash_password(self, password: str) -> str:
        validate_password_strength(password, self.settings.password_min_length)
        return create_password_hasher(self.settings).hash(password)

    def verify_password(self, password: str, password_hash: str) -> bool:
        try:
            return create_password_hasher(self.settings).verify(password_hash, password)
        except VerifyMismatchError:
            return False


def generate_session_token() -> str:
    return secrets.token_urlsafe(48)


def hash_session_token(token: str, settings: Settings) -> str:
    return hmac.new(
        settings.session_signing_secret.encode("utf-8"),
        token.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
