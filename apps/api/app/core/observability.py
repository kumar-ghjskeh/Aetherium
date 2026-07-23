from __future__ import annotations

import json
import logging
import re
import time
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")


class AetheriumJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key in (
            "request_id",
            "method",
            "path",
            "status_code",
            "duration_ms",
            "client_host",
            "service",
        ):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, separators=(",", ":"), sort_keys=True)


class AetheriumJsonStreamHandler(logging.StreamHandler[Any]):
    pass


def configure_logging(log_namespace: str) -> None:
    root_logger = logging.getLogger()
    if not any(isinstance(handler, AetheriumJsonStreamHandler) for handler in root_logger.handlers):
        handler = AetheriumJsonStreamHandler()
        handler.setFormatter(AetheriumJsonFormatter())
        root_logger.addHandler(handler)

    root_logger.setLevel(logging.INFO)
    logging.getLogger(log_namespace).setLevel(logging.INFO)


def normalize_request_id(value: str | None) -> str:
    if value is not None and REQUEST_ID_PATTERN.fullmatch(value):
        return value
    return str(uuid4())


class RequestContextMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, *, request_id_header: str, log_namespace: str) -> None:
        super().__init__(app)
        self.request_id_header = request_id_header
        self.logger = logging.getLogger(f"{log_namespace}.api.access")

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = normalize_request_id(request.headers.get(self.request_id_header))
        request.state.request_id = request_id
        started_at = time.perf_counter()
        client_host = request.client.host if request.client else None

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
            self.logger.exception(
                "request_failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "client_host": client_host,
                    "service": "api",
                },
            )
            raise

        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        response.headers[self.request_id_header] = request_id
        response.headers["X-Aetherium-Process-Time-Ms"] = f"{duration_ms:.2f}"
        self.logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client_host": client_host,
                "service": "api",
            },
        )
        return response
