from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.db.session import get_async_session
from app.dependencies.file_vault import get_object_storage_service
from app.services.file_ingestion import FileIngestionService
from app.services.object_storage import ObjectStorageService


async def get_file_ingestion_service(
    db: Annotated[AsyncSession, Depends(get_async_session)],
    settings: Annotated[Settings, Depends(get_settings)],
    storage: Annotated[ObjectStorageService, Depends(get_object_storage_service)],
) -> FileIngestionService:
    return FileIngestionService(db=db, settings=settings, storage=storage)
