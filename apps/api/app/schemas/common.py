from typing import Any

from pydantic import BaseModel, ConfigDict


class ApiError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    message: str
    fields: dict[str, Any] | None = None


class ApiErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    error: ApiError
