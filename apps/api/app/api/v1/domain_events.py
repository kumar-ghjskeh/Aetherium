from typing import Any

from fastapi import APIRouter, Depends, Query, Response, status

from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.foundation import get_user_data_service
from app.dependencies.pagination import PaginationParams, get_pagination
from app.domain.foundation import DomainEventType
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.foundation import DomainEventCreate, DomainEventPage, DomainEventResponse
from app.services.foundation import UserDataService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
}


@router.post(
    "",
    response_model=DomainEventResponse,
    responses=ERROR_RESPONSES,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_domain_event(
    payload: DomainEventCreate,
    response: Response,
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> DomainEventResponse:
    try:
        result = await service.create_domain_event(
            current_user,
            event_type=payload.event_type,
            idempotency_key=payload.idempotency_key,
            payload=payload.payload,
        )
        if result.created:
            await service.record_audit_log(
                current_user,
                action="domain_event.recorded",
                entity_type="domain_event",
                entity_id=result.event.id,
                metadata={"eventType": payload.event_type.value},
            )
        else:
            response.status_code = status.HTTP_200_OK
        await service.db.commit()
        return DomainEventResponse.model_validate(result.event)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "",
    response_model=DomainEventPage,
    responses={401: {"model": ApiErrorResponse}},
)
async def list_domain_events(
    pagination: PaginationParams = Depends(get_pagination),
    event_type: DomainEventType | None = Query(default=None, alias="eventType"),
    current_user: User = Depends(get_current_user),
    service: UserDataService = Depends(get_user_data_service),
) -> DomainEventPage:
    page = await service.list_domain_events(current_user, pagination, event_type)
    return DomainEventPage(
        items=[DomainEventResponse.model_validate(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )
