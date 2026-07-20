from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.dependencies.foundation import get_user_data_service
from app.dependencies.pagination import PaginationParams, get_pagination
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.foundation import AuditLogPage, AuditLogResponse
from app.services.foundation import UserDataService

router = APIRouter()


@router.get(
    "",
    response_model=AuditLogPage,
    responses={401: {"model": ApiErrorResponse}},
)
async def list_audit_logs(
    pagination: PaginationParams = Depends(get_pagination),
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> AuditLogPage:
    page = await service.list_audit_logs(current_user, pagination)
    return AuditLogPage(
        items=[AuditLogResponse.model_validate(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )
