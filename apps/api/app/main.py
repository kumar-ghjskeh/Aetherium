from typing import Any, cast

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import AppError, app_error_handler, validation_error_handler
from app.security.rate_limit import InMemoryRateLimiter


def create_app() -> FastAPI:
    settings = get_settings()
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
        CORSMiddleware,
        allow_credentials=True,
        allow_headers=["Content-Type", "Accept"],
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_origins=settings.allowed_origins,
    )

    application.include_router(api_router, prefix="/api/v1")

    return application


app = create_app()
