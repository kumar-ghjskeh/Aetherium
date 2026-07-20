from typing import Any

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.schemas.common import ApiError, ApiErrorResponse


class AppError(Exception):
    def __init__(
        self, status_code: int, code: str, message: str, fields: dict[str, Any] | None = None
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.fields = fields
        super().__init__(message)


def api_error_response(
    status_code: int,
    code: str,
    message: str,
    fields: dict[str, Any] | None = None,
) -> JSONResponse:
    payload = ApiErrorResponse(error=ApiError(code=code, message=message, fields=fields))
    return JSONResponse(status_code=status_code, content=payload.model_dump(exclude_none=True))


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return api_error_response(exc.status_code, exc.code, exc.message, exc.fields)


async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    field_errors: dict[str, str] = {}
    for error in exc.errors():
        location = ".".join(str(part) for part in error.get("loc", []) if part != "body")
        if location:
            field_errors[location] = str(error.get("msg", "Invalid value"))

    return api_error_response(
        status.HTTP_422_UNPROCESSABLE_ENTITY,
        "validation_failed",
        "Please check the submitted fields.",
        field_errors or None,
    )
