from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.db.session import get_async_session
from app.services.file_vault import FileVaultService
from app.services.object_storage import ObjectStorageService, create_object_storage_service


def get_object_storage_service(
    settings: Settings = Depends(get_settings),
) -> ObjectStorageService:
    return create_object_storage_service(settings)


def get_file_vault_service(
    db: AsyncSession = Depends(get_async_session),
    settings: Settings = Depends(get_settings),
    storage: ObjectStorageService = Depends(get_object_storage_service),
) -> FileVaultService:
    return FileVaultService(db=db, settings=settings, storage=storage)
