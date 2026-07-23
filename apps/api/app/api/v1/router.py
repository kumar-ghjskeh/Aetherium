from fastapi import APIRouter

from app.api.v1 import (
    achievements,
    ai,
    analytics,
    audit_logs,
    auth,
    coding,
    domain_events,
    files,
    habits,
    health,
    knowledge,
    learning,
    mentors,
    notifications,
    projects,
    search,
    settings,
    users,
    world,
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(achievements.router, prefix="/achievements", tags=["achievements"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(world.router, prefix="/world", tags=["world"])
api_router.include_router(domain_events.router, prefix="/domain-events", tags=["domain-events"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(habits.router, prefix="/habits", tags=["habits"])
api_router.include_router(learning.router, prefix="/learning", tags=["learning"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(coding.router, prefix="/coding", tags=["coding"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(mentors.router, prefix="/mentors", tags=["mentors"])
