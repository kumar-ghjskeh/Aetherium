from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

HealthStatus = Literal["ok", "degraded"]


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    checks: dict[str, str] = Field(default_factory=dict)
    service: Literal["api"]
    status: HealthStatus
    version: str
