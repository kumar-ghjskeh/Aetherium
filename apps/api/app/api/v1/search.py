from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.dependencies.auth import get_current_user
from app.dependencies.pagination import get_pagination
from app.dependencies.search import get_search_service
from app.models.auth import User
from app.schemas.search import (
    RecentSearchPage,
    RecentSearchResponse,
    SearchRequest,
    SearchResponse,
    SearchResultResponse,
)
from app.services.search import SearchService

router = APIRouter()


@router.post("", response_model=SearchResponse)
async def run_search(
    payload: SearchRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[SearchService, Depends(get_search_service)],
) -> SearchResponse:
    try:
        page = await service.search(
            current_user,
            query_text=payload.query,
            entity_types=payload.entity_types,
            mode=payload.mode,
            sort=payload.sort,
            pagination=PaginationParams(limit=payload.limit, offset=payload.offset),
        )
        await service.db.commit()
    except AppError:
        await service.db.rollback()
        raise

    return SearchResponse(
        query=payload.query.strip(),
        mode=payload.mode,
        semanticEnabled=False,
        items=[SearchResultResponse.from_item(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.get("/recent", response_model=RecentSearchPage)
async def list_recent_searches(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[SearchService, Depends(get_search_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> RecentSearchPage:
    page = await service.list_recent_searches(current_user, pagination)
    return RecentSearchPage(
        items=[RecentSearchResponse.from_recent_search(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )
