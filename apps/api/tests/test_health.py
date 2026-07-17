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
