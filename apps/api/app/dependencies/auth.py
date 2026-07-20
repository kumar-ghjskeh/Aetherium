from __future__ import annotations

from urllib.parse import urlparse

from fastapi import Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.db.session import get_async_session
from app.models.auth import User
from app.security.rate_limit import InMemoryRateLimiter
from app.services.auth import AuthService


def get_auth_service(
    db: AsyncSession = Depends(get_async_session),
    settings: Settings = Depends(get_settings),
) -> AuthService:
    return AuthService(db=db, settings=settings)


def get_rate_limiter(
    request: Request, settings: Settings = Depends(get_settings)
) -> InMemoryRateLimiter:
    limiter = getattr(request.app.state, "rate_limiter", None)
    if limiter is None:
        limiter = InMemoryRateLimiter(settings.redis_key_prefix)
        request.app.state.rate_limiter = limiter
    return limiter


def _origin_from_referer(referer: str) -> str | None:
    parsed = urlparse(referer)
    if not parsed.scheme or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"


async def verify_allowed_origin(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    if request.method.upper() not in {"POST", "PUT", "PATCH", "DELETE"}:
        return

    origin = request.headers.get("origin")
    if origin is None:
        referer = request.headers.get("referer")
        origin = _origin_from_referer(referer) if referer else None

    if origin is None:
        if settings.app_env in {"development", "test"}:
            return
        raise AppError(status.HTTP_403_FORBIDDEN, "origin_required", "Request origin is required.")

    if origin not in settings.allowed_origins:
        raise AppError(
            status.HTTP_403_FORBIDDEN, "origin_not_allowed", "Request origin is not allowed."
        )


async def get_session_token_from_cookie(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> str:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise AppError(
            status.HTTP_401_UNAUTHORIZED, "unauthenticated", "Authentication is required."
        )
    return token


async def get_current_user(
    token: str = Depends(get_session_token_from_cookie),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    try:
        user = await auth_service.get_current_user_for_token(token)
        await auth_service.db.commit()
        return user
    except Exception:
        await auth_service.db.rollback()
        raise


async def get_optional_session_token(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> str | None:
    return request.cookies.get(settings.session_cookie_name)


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_duration_seconds,
        path=settings.session_cookie_path,
        domain=settings.session_cookie_domain,
        secure=settings.should_secure_session_cookie,
        httponly=True,
        samesite=settings.session_cookie_samesite,
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        path=settings.session_cookie_path,
        domain=settings.session_cookie_domain,
        secure=settings.should_secure_session_cookie,
        httponly=True,
        samesite=settings.session_cookie_samesite,
    )
