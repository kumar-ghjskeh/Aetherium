from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.models.auth import AuthSession, User
from app.security.audit import log_security_event
from app.security.passwords import (
    PasswordService,
    generate_session_token,
    hash_session_token,
    normalize_email,
)

AUTH_GENERIC_ERROR = "Email or password is incorrect."


def ensure_aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


@dataclass(frozen=True)
class CreatedSession:
    token: str
    session: AuthSession


@dataclass(frozen=True)
class AuthService:
    db: AsyncSession
    settings: Settings

    async def register_user(self, email: str, password: str, display_name: str) -> User:
        normalized_email = normalize_email(email)
        existing_user = await self.get_user_by_normalized_email(normalized_email)
        if existing_user is not None:
            raise AppError(409, "email_unavailable", "Unable to register with those credentials.")

        password_hash = PasswordService(self.settings).hash_password(password)
        user = User(
            email=email.strip(),
            normalized_email=normalized_email,
            password_hash=password_hash,
            display_name=display_name,
            is_active=True,
            is_email_verified=False,
        )
        self.db.add(user)
        await self.db.flush()
        log_security_event("registration_success", self.settings, user_id=str(user.id), email=email)
        return user

    async def authenticate_user(self, email: str, password: str) -> User:
        normalized_email = normalize_email(email)
        user = await self.get_user_by_normalized_email(normalized_email)
        if user is None or user.deleted_at is not None or not user.is_active:
            log_security_event("login_failure", self.settings, email=email)
            raise AppError(401, "invalid_credentials", AUTH_GENERIC_ERROR)

        if not PasswordService(self.settings).verify_password(password, user.password_hash):
            log_security_event("login_failure", self.settings, user_id=str(user.id), email=email)
            raise AppError(401, "invalid_credentials", AUTH_GENERIC_ERROR)

        now = datetime.now(UTC)
        user.last_login_at = now
        user.updated_at = now
        await self.db.flush()
        log_security_event("login_success", self.settings, user_id=str(user.id), email=email)
        return user

    async def create_session(self, user: User, user_agent: str | None) -> CreatedSession:
        token = generate_session_token()
        now = datetime.now(UTC)
        auth_session = AuthSession(
            user_id=user.id,
            token_hash=hash_session_token(token, self.settings),
            last_used_at=now,
            expires_at=now + timedelta(seconds=self.settings.session_duration_seconds),
            user_agent=user_agent[:512] if user_agent else None,
        )
        self.db.add(auth_session)
        await self.db.flush()
        return CreatedSession(token=token, session=auth_session)

    async def get_user_by_normalized_email(self, normalized_email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.normalized_email == normalized_email, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_valid_session(self, token: str) -> AuthSession:
        token_hash = hash_session_token(token, self.settings)
        result = await self.db.execute(
            select(AuthSession).where(AuthSession.token_hash == token_hash)
        )
        auth_session = result.scalar_one_or_none()
        now = datetime.now(UTC)

        if auth_session is None:
            raise AppError(401, "unauthenticated", "Authentication is required.")
        if auth_session.revoked_at is not None:
            log_security_event("revoked_session_used", self.settings)
            raise AppError(401, "unauthenticated", "Authentication is required.")
        if ensure_aware_utc(auth_session.expires_at) <= now:
            log_security_event("expired_session_used", self.settings)
            raise AppError(401, "unauthenticated", "Authentication is required.")

        auth_session.last_used_at = now
        auth_session.updated_at = now
        await self.db.flush()
        return auth_session

    async def get_current_user_for_token(self, token: str) -> User:
        auth_session = await self.get_valid_session(token)
        user = await self.db.get(User, auth_session.user_id)
        if user is None or user.deleted_at is not None or not user.is_active:
            raise AppError(401, "unauthenticated", "Authentication is required.")

        return user

    async def revoke_session(self, token: str) -> None:
        token_hash = hash_session_token(token, self.settings)
        result = await self.db.execute(
            select(AuthSession).where(AuthSession.token_hash == token_hash)
        )
        auth_session = result.scalar_one_or_none()
        if auth_session is None:
            return

        now = datetime.now(UTC)
        auth_session.revoked_at = now
        auth_session.updated_at = now
        await self.db.flush()
        log_security_event("logout", self.settings, user_id=str(auth_session.user_id))
