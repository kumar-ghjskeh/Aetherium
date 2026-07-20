from typing import Any

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.exc import IntegrityError

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.dependencies.auth import (
    clear_session_cookie,
    get_auth_service,
    get_current_user,
    get_optional_session_token,
    get_rate_limiter,
    set_session_cookie,
    verify_allowed_origin,
)
from app.models.auth import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserPublic
from app.schemas.common import ApiErrorResponse
from app.security.passwords import normalize_email
from app.security.rate_limit import InMemoryRateLimiter
from app.services.auth import AuthService

router = APIRouter()

AUTH_ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
    429: {"model": ApiErrorResponse},
}


def public_user(user: User) -> UserPublic:
    return UserPublic.model_validate(user)


def check_rate_limit(
    limiter: InMemoryRateLimiter,
    *,
    key: str,
    attempts: int,
    window_seconds: int,
) -> None:
    decision = limiter.check(key, attempts, window_seconds)
    if not decision.allowed:
        raise AppError(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "rate_limited",
            "Too many authentication attempts. Please wait before trying again.",
        )


@router.post(
    "/register",
    response_model=AuthResponse,
    responses=AUTH_ERROR_RESPONSES,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_allowed_origin)],
)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
    limiter: InMemoryRateLimiter = Depends(get_rate_limiter),
    settings: Settings = Depends(get_settings),
) -> AuthResponse:
    client_host = request.client.host if request.client else "unknown"
    normalized_email = normalize_email(str(payload.email))
    check_rate_limit(
        limiter,
        key=f"register:{client_host}:{normalized_email}",
        attempts=settings.auth_register_rate_limit_attempts,
        window_seconds=settings.auth_register_rate_limit_window_seconds,
    )

    try:
        user = await auth_service.register_user(
            str(payload.email),
            payload.password,
            payload.display_name,
        )
        created_session = await auth_service.create_session(user, request.headers.get("user-agent"))
        await auth_service.db.commit()
    except IntegrityError as exc:
        await auth_service.db.rollback()
        raise AppError(
            409, "email_unavailable", "Unable to register with those credentials."
        ) from exc
    except Exception:
        await auth_service.db.rollback()
        raise

    set_session_cookie(response, created_session.token, settings)
    return AuthResponse(user=public_user(user))


@router.post(
    "/login",
    response_model=AuthResponse,
    responses=AUTH_ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
    limiter: InMemoryRateLimiter = Depends(get_rate_limiter),
    settings: Settings = Depends(get_settings),
) -> AuthResponse:
    client_host = request.client.host if request.client else "unknown"
    normalized_email = normalize_email(str(payload.email))
    check_rate_limit(
        limiter,
        key=f"login:{client_host}:{normalized_email}",
        attempts=settings.auth_login_rate_limit_attempts,
        window_seconds=settings.auth_login_rate_limit_window_seconds,
    )

    try:
        user = await auth_service.authenticate_user(str(payload.email), payload.password)
        created_session = await auth_service.create_session(user, request.headers.get("user-agent"))
        await auth_service.db.commit()
    except AppError:
        await auth_service.db.rollback()
        raise
    except Exception:
        await auth_service.db.rollback()
        raise

    set_session_cookie(response, created_session.token, settings)
    return AuthResponse(user=public_user(user))


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={401: {"model": ApiErrorResponse}, 403: {"model": ApiErrorResponse}},
    dependencies=[Depends(verify_allowed_origin)],
)
async def logout(
    response: Response,
    token: str | None = Depends(get_optional_session_token),
    auth_service: AuthService = Depends(get_auth_service),
    settings: Settings = Depends(get_settings),
) -> Response:
    if token:
        await auth_service.revoke_session(token)
        await auth_service.db.commit()
    clear_session_cookie(response, settings)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserPublic, responses={401: {"model": ApiErrorResponse}})
async def me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return public_user(current_user)
