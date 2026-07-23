from collections.abc import AsyncIterator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.services.notifications import NotificationWorkflowService


async def get_notification_workflow_service(
    session: AsyncSession = Depends(get_async_session),
) -> AsyncIterator[NotificationWorkflowService]:
    yield NotificationWorkflowService(session)
