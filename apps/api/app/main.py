from typing import Any, cast

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import AppError, app_error_handler, validation_error_handler
from app.core.observability import RequestContextMiddleware, configure_logging
from app.core.security_headers import SecurityHeadersMiddleware
from app.security.rate_limit import InMemoryRateLimiter


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_namespace)
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )
    application.state.rate_limiter = InMemoryRateLimiter(settings.redis_key_prefix)

    application.add_exception_handler(AppError, cast(Any, app_error_handler))
    application.add_exception_handler(RequestValidationError, cast(Any, validation_error_handler))

    application.add_middleware(
        SecurityHeadersMiddleware,
        app_env=settings.app_env,
        content_security_policy=settings.content_security_policy,
        enabled=settings.security_headers_enabled,
    )
    application.add_middleware(
        RequestContextMiddleware,
        log_namespace=settings.log_namespace,
        request_id_header=settings.request_id_header,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_headers=["Content-Type", "Accept"],
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_origins=settings.allowed_origins,
    )

    application.include_router(api_router, prefix="/api/v1")

    return application


app = create_app()
