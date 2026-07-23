from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

HealthStatus = Literal["ok", "degraded"]


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    checks: dict[str, str] = Field(default_factory=dict)
    service: Literal["api"]
    status: HealthStatus
    version: str


class ObservabilityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    error_tracking_configured: bool = Field(alias="errorTrackingConfigured")
    log_namespace: str = Field(alias="logNamespace")
    metrics_enabled: bool = Field(alias="metricsEnabled")
    request_id_header: str = Field(alias="requestIdHeader")
    security_headers_enabled: bool = Field(alias="securityHeadersEnabled")
    service: Literal["api"]
    status: HealthStatus
    version: str
