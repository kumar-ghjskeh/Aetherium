from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.pagination import PaginationParams
from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.file_vault import get_file_vault_service
from app.dependencies.pagination import get_pagination
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.file_vault import (
    CollectionCreateRequest,
    CollectionItemRequest,
    CollectionPage,
    CollectionResponse,
    DownloadUrlResponse,
    FilePage,
    FileResponse,
    FileTagCreateRequest,
    FileUpdateRequest,
    TagPage,
    TagResponse,
    UploadCompleteRequest,
    UploadInitiateRequest,
    UploadResponse,
)
from app.services.file_vault import FileVaultService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    404: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
    502: {"model": ApiErrorResponse},
}


@router.post(
    "/uploads",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def initiate_upload(
    payload: UploadInitiateRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> UploadResponse:
    try:
        result = await service.initiate_upload(
            current_user,
            checksum_sha256=payload.checksum_sha256,
            content_type=payload.content_type,
            file_name=payload.file_name,
            idempotency_key=payload.idempotency_key,
            size_bytes=payload.size_bytes,
        )
        await service.db.commit()
        if not result.created:
            response.status_code = status.HTTP_200_OK
        return UploadResponse.from_upload(result.upload, result.presigned)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/uploads/{upload_id}/complete",
    response_model=FileResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def complete_upload(
    upload_id: UUID,
    payload: UploadCompleteRequest,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    try:
        view = await service.complete_upload(
            current_user,
            display_name=payload.display_name,
            idempotency_key=payload.idempotency_key,
            upload_id=upload_id,
        )
        await service.db.commit()
        return FileResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/collections",
    response_model=CollectionPage,
    responses=ERROR_RESPONSES,
)
async def list_collections(
    current_user: User = Depends(get_current_user),
    pagination: PaginationParams = Depends(get_pagination),
    service: FileVaultService = Depends(get_file_vault_service),
) -> CollectionPage:
    page = await service.list_collections(current_user, pagination)
    await service.db.commit()
    return CollectionPage(
        items=[CollectionResponse.from_collection(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/collections",
    response_model=CollectionResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_collection(
    payload: CollectionCreateRequest,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> CollectionResponse:
    try:
        collection = await service.create_collection(
            current_user,
            description=payload.description,
            name=payload.name,
        )
        await service.db.commit()
        return CollectionResponse.from_collection(collection)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/collections/{collection_id}/items",
    response_model=FileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def add_file_to_collection(
    collection_id: UUID,
    payload: CollectionItemRequest,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    try:
        view = await service.add_file_to_collection(
            current_user,
            collection_id=collection_id,
            file_id=payload.file_id,
        )
        await service.db.commit()
        return FileResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.delete(
    "/collections/{collection_id}/items/{file_id}",
    response_model=FileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def remove_file_from_collection(
    collection_id: UUID,
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    try:
        view = await service.remove_file_from_collection(
            current_user,
            collection_id=collection_id,
            file_id=file_id,
        )
        await service.db.commit()
        return FileResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/tags", response_model=TagPage, responses=ERROR_RESPONSES)
async def list_tags(
    current_user: User = Depends(get_current_user),
    pagination: PaginationParams = Depends(get_pagination),
    service: FileVaultService = Depends(get_file_vault_service),
) -> TagPage:
    page = await service.list_tags(current_user, pagination)
    await service.db.commit()
    return TagPage(
        items=[TagResponse.from_tag(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.get("", response_model=FilePage, responses=ERROR_RESPONSES)
async def list_files(
    include_deleted: bool = Query(default=False, alias="includeDeleted"),
    favorite_only: bool = Query(default=False, alias="favoriteOnly"),
    query: str | None = Query(default=None, min_length=1, max_length=160),
    collection_id: UUID | None = Query(default=None, alias="collectionId"),
    tag_id: UUID | None = Query(default=None, alias="tagId"),
    current_user: User = Depends(get_current_user),
    pagination: PaginationParams = Depends(get_pagination),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FilePage:
    page = await service.list_files(
        current_user,
        collection_id=collection_id,
        favorite_only=favorite_only,
        include_deleted=include_deleted,
        pagination=pagination,
        query=query,
        tag_id=tag_id,
    )
    await service.db.commit()
    return FilePage(
        items=[FileResponse.from_view(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.get("/{file_id}", response_model=FileResponse, responses=ERROR_RESPONSES)
async def get_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    view = await service.get_file(current_user, file_id)
    await service.db.commit()
    return FileResponse.from_view(view)


@router.patch(
    "/{file_id}",
    response_model=FileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def update_file(
    file_id: UUID,
    payload: FileUpdateRequest,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    try:
        view = await service.update_file(
            current_user,
            display_name=payload.display_name,
            file_id=file_id,
        )
        await service.db.commit()
        return FileResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.delete(
    "/{file_id}",
    response_model=FileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def soft_delete_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    try:
        view = await service.soft_delete_file(current_user, file_id)
        await service.db.commit()
        return FileResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{file_id}/restore",
    response_model=FileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def restore_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    try:
        view = await service.restore_file(current_user, file_id)
        await service.db.commit()
        return FileResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.delete(
    "/{file_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def permanently_delete_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> Response:
    try:
        await service.permanently_delete_file(current_user, file_id)
        await service.db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/{file_id}/download", response_model=DownloadUrlResponse, responses=ERROR_RESPONSES)
async def create_download_url(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> DownloadUrlResponse:
    try:
        result = await service.create_download_url(current_user, file_id)
        await service.db.commit()
        return DownloadUrlResponse.from_presigned(result.file, result.presigned)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{file_id}/favorite",
    response_model=FileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def favorite_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    try:
        view = await service.favorite_file(current_user, file_id)
        await service.db.commit()
        return FileResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.delete(
    "/{file_id}/favorite",
    response_model=FileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def unfavorite_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    try:
        view = await service.unfavorite_file(current_user, file_id)
        await service.db.commit()
        return FileResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/{file_id}/tags",
    response_model=FileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def add_tag_to_file(
    file_id: UUID,
    payload: FileTagCreateRequest,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    try:
        view = await service.add_tag_to_file(
            current_user,
            color=payload.color,
            file_id=file_id,
            name=payload.name,
        )
        await service.db.commit()
        return FileResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise


@router.delete(
    "/{file_id}/tags/{tag_id}",
    response_model=FileResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def remove_tag_from_file(
    file_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FileVaultService = Depends(get_file_vault_service),
) -> FileResponse:
    try:
        view = await service.remove_tag_from_file(current_user, file_id=file_id, tag_id=tag_id)
        await service.db.commit()
        return FileResponse.from_view(view)
    except Exception:
        await service.db.rollback()
        raise
