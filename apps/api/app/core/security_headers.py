from __future__ import annotations

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

DOCS_PATHS = {"/api/docs", "/api/redoc", "/api/openapi.json"}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        *,
        app_env: str,
        content_security_policy: str,
        enabled: bool,
    ) -> None:
        super().__init__(app)
        self.app_env = app_env
        self.content_security_policy = content_security_policy
        self.enabled = enabled

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        if not self.enabled:
            return response

        _set_default(response, "X-Content-Type-Options", "nosniff")
        _set_default(response, "X-Frame-Options", "DENY")
        _set_default(response, "Referrer-Policy", "no-referrer")
        _set_default(response, "Cross-Origin-Opener-Policy", "same-origin")
        _set_default(
            response,
            "Permissions-Policy",
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()",
        )
        if request.url.path not in DOCS_PATHS:
            _set_default(response, "Content-Security-Policy", self.content_security_policy)
        if self.app_env == "production":
            _set_default(
                response,
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload",
            )
        return response


def _set_default(response: Response, header: str, value: str) -> None:
    if header not in response.headers:
        response.headers[header] = value
