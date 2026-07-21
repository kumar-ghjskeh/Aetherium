from fastapi import APIRouter

from app.api.v1 import (
    ai,
    audit_logs,
    auth,
    domain_events,
    files,
    habits,
    health,
    learning,
    mentors,
    notifications,
    search,
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
api_router.include_router(habits.router, prefix="/habits", tags=["habits"])
api_router.include_router(learning.router, prefix="/learning", tags=["learning"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(mentors.router, prefix="/mentors", tags=["mentors"])
