from collections.abc import AsyncIterator

import pytest
from fastapi.testclient import TestClient

from app.api.v1.health import ReadinessProbe, get_readiness_probe
from app.main import create_app


class PassingProbe:
    async def check(self) -> None:
        return None


class FailingProbe:
    async def check(self) -> None:
        raise RuntimeError("database unavailable")


@pytest.fixture()
def client() -> AsyncIterator[TestClient]:
    app = create_app()

    with TestClient(app) as test_client:
        yield test_client


def test_liveness_returns_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health/live")

    assert response.status_code == 200
    assert response.json() == {
        "checks": {},
        "service": "api",
        "status": "ok",
        "version": "0.1.0",
    }
    assert response.headers["X-Request-ID"]
    assert response.headers["X-Aetherium-Process-Time-Ms"]
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["Content-Security-Policy"].startswith("default-src 'none'")


def test_readiness_returns_ok_when_database_probe_passes(client: TestClient) -> None:
    async def override_probe() -> ReadinessProbe:
        return PassingProbe()

    client.app.dependency_overrides[get_readiness_probe] = override_probe

    response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json() == {
        "checks": {"database": "ok"},
        "service": "api",
        "status": "ok",
        "version": "0.1.0",
    }


def test_readiness_returns_degraded_when_database_probe_fails(client: TestClient) -> None:
    async def override_probe() -> ReadinessProbe:
        return FailingProbe()

    client.app.dependency_overrides[get_readiness_probe] = override_probe

    response = client.get("/api/v1/health/ready")

    assert response.status_code == 503
    assert response.json() == {
        "checks": {"database": "unavailable"},
        "service": "api",
        "status": "degraded",
        "version": "0.1.0",
    }


def test_request_id_header_echoes_safe_client_value(client: TestClient) -> None:
    response = client.get("/api/v1/health/live", headers={"X-Request-ID": "aetherium-test-123"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "aetherium-test-123"


def test_request_id_header_replaces_unsafe_client_value(client: TestClient) -> None:
    response = client.get("/api/v1/health/live", headers={"X-Request-ID": "not safe"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] != "not safe"
    assert len(response.headers["X-Request-ID"]) >= 32


def test_observability_reports_non_sensitive_runtime_controls(client: TestClient) -> None:
    response = client.get("/api/v1/health/observability")

    assert response.status_code == 200
    assert response.json() == {
        "errorTrackingConfigured": False,
        "logNamespace": "aetherium",
        "metricsEnabled": True,
        "requestIdHeader": "X-Request-ID",
        "securityHeadersEnabled": True,
        "service": "api",
        "status": "ok",
        "version": "0.1.0",
    }
