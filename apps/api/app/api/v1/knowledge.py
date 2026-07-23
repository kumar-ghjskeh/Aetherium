from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.pagination import PaginationParams
from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.knowledge import get_knowledge_service
from app.dependencies.pagination import get_pagination
from app.domain.knowledge import (
    KnowledgeNodeType,
    KnowledgeRelationshipDirection,
    KnowledgeRelationType,
)
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.knowledge import (
    KnowledgeNodeCreateRequest,
    KnowledgeNodePage,
    KnowledgeNodeResponse,
    KnowledgeRecommendationPage,
    KnowledgeRecommendationResponse,
    KnowledgeRelatedNodePage,
    KnowledgeRelatedNodeResponse,
    KnowledgeRelationshipCreateRequest,
    KnowledgeRelationshipPage,
    KnowledgeRelationshipResponse,
    KnowledgeSummaryResponse,
    KnowledgeSyncResponse,
)
from app.services.knowledge import KnowledgeGraphService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    404: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
}


@router.get("/nodes", response_model=KnowledgeNodePage, responses=ERROR_RESPONSES)
async def list_nodes(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[KnowledgeGraphService, Depends(get_knowledge_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    node_type: KnowledgeNodeType | None = Query(default=None, alias="nodeType"),
    query: str | None = Query(default=None, max_length=120),
) -> KnowledgeNodePage:
    page = await service.list_nodes(
        current_user,
        pagination,
        node_type=node_type,
        query=query,
    )
    await service.db.commit()
    return KnowledgeNodePage(
        items=[KnowledgeNodeResponse.from_node(node) for node in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/nodes",
    response_model=KnowledgeNodeResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_node(
    payload: KnowledgeNodeCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[KnowledgeGraphService, Depends(get_knowledge_service)],
) -> KnowledgeNodeResponse:
    try:
        node = await service.create_node(
            current_user,
            node_type=payload.node_type,
            title=payload.title,
            description=payload.description,
            open_url=payload.open_url,
            metadata=payload.metadata,
        )
        await service.db.commit()
        return KnowledgeNodeResponse.from_node(node)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/relationships",
    response_model=KnowledgeRelationshipPage,
    responses=ERROR_RESPONSES,
)
async def list_relationships(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[KnowledgeGraphService, Depends(get_knowledge_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    node_id: UUID | None = Query(default=None, alias="nodeId"),
    relation_type: KnowledgeRelationType | None = Query(default=None, alias="relationType"),
    direction: KnowledgeRelationshipDirection = Query(
        default=KnowledgeRelationshipDirection.BOTH,
    ),
) -> KnowledgeRelationshipPage:
    page = await service.list_relationships(
        current_user,
        pagination,
        node_id=node_id,
        relation_type=relation_type,
        direction=direction,
    )
    await service.db.commit()
    return KnowledgeRelationshipPage(
        items=[
            KnowledgeRelationshipResponse.from_relationship(relationship)
            for relationship in page.items
        ],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/relationships",
    response_model=KnowledgeRelationshipResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_relationship(
    payload: KnowledgeRelationshipCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[KnowledgeGraphService, Depends(get_knowledge_service)],
) -> KnowledgeRelationshipResponse:
    try:
        relationship = await service.create_relationship(
            current_user,
            source_node_id=payload.source_node_id,
            target_node_id=payload.target_node_id,
            relation_type=payload.relation_type,
            weight=payload.weight,
            evidence=payload.evidence,
        )
        await service.db.commit()
        return KnowledgeRelationshipResponse.from_relationship(relationship)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/sync",
    response_model=KnowledgeSyncResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def sync_knowledge_graph(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[KnowledgeGraphService, Depends(get_knowledge_service)],
) -> KnowledgeSyncResponse:
    try:
        result = await service.sync_from_sources(current_user)
        await service.db.commit()
        return KnowledgeSyncResponse.from_result(result)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/topics/{topic_id}/related",
    response_model=KnowledgeRelatedNodePage,
    responses=ERROR_RESPONSES,
)
async def related_topic(
    topic_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[KnowledgeGraphService, Depends(get_knowledge_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> KnowledgeRelatedNodePage:
    page = await service.related_topic(current_user, topic_id, pagination)
    await service.db.commit()
    return KnowledgeRelatedNodePage(
        items=[KnowledgeRelatedNodeResponse.from_related(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.get(
    "/topics/{topic_id}/prerequisites",
    response_model=KnowledgeRelatedNodePage,
    responses=ERROR_RESPONSES,
)
async def prerequisites(
    topic_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[KnowledgeGraphService, Depends(get_knowledge_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> KnowledgeRelatedNodePage:
    page = await service.prerequisites(current_user, topic_id, pagination)
    await service.db.commit()
    return KnowledgeRelatedNodePage(
        items=[KnowledgeRelatedNodeResponse.from_related(item) for item in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.get(
    "/recommendations",
    response_model=KnowledgeRecommendationPage,
    responses=ERROR_RESPONSES,
)
async def recommendations(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[KnowledgeGraphService, Depends(get_knowledge_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> KnowledgeRecommendationPage:
    page = await service.recommendations(current_user, pagination)
    await service.db.commit()
    return KnowledgeRecommendationPage(
        items=[
            KnowledgeRecommendationResponse.from_recommendation(recommendation)
            for recommendation in page.items
        ],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.get("/summary", response_model=KnowledgeSummaryResponse, responses=ERROR_RESPONSES)
async def summary(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[KnowledgeGraphService, Depends(get_knowledge_service)],
) -> KnowledgeSummaryResponse:
    summary_payload = await service.summary(current_user)
    await service.db.commit()
    return KnowledgeSummaryResponse(**summary_payload)
