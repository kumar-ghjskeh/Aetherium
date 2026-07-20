from fastapi import APIRouter

from app.api.v1 import (
    audit_logs,
    auth,
    domain_events,
    files,
    health,
    notifications,
    settings,
    world,
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(world.router, prefix="/world", tags=["world"])
api_router.include_router(domain_events.router, prefix="/domain-events", tags=["domain-events"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
