from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.search import SearchEntityType, SearchMatchReason, SearchMode, SearchSort
from app.models.search import RecentSearch
from app.services.search import SearchResultItem, SearchResultSource


class SearchSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class SearchRequest(SearchSchema):
    query: str = Field(min_length=1, max_length=240)
    entity_types: list[SearchEntityType] | None = Field(default=None, alias="entityTypes")
    mode: SearchMode = SearchMode.HYBRID
    sort: SearchSort = SearchSort.RELEVANCE
    limit: int = Field(default=20, ge=1, le=50)
    offset: int = Field(default=0, ge=0, le=1000)


class SearchResultSourceResponse(SearchSchema):
    file_id: UUID | None = Field(default=None, alias="fileId")
    chunk_id: UUID | None = Field(default=None, alias="chunkId")
    page_number: int | None = Field(default=None, alias="pageNumber")
    section_label: str | None = Field(default=None, alias="sectionLabel")

    @classmethod
    def from_source(cls, source: SearchResultSource) -> SearchResultSourceResponse:
        return cls(
            fileId=source.file_id,
            chunkId=source.chunk_id,
            pageNumber=source.page_number,
            sectionLabel=source.section_label,
        )


class SearchResultResponse(SearchSchema):
    id: str
    entity_type: SearchEntityType = Field(alias="entityType")
    entity_id: UUID = Field(alias="entityId")
    title: str
    snippet: str
    match_reason: SearchMatchReason = Field(alias="matchReason")
    score: float
    open_url: str = Field(alias="openUrl")
    world_location_id: str | None = Field(default=None, alias="worldLocationId")
    source: SearchResultSourceResponse | None
    created_at: datetime = Field(alias="createdAt")

    @classmethod
    def from_item(cls, item: SearchResultItem) -> SearchResultResponse:
        return cls(
            id=item.id,
            entityType=item.entity_type,
            entityId=item.entity_id,
            title=item.title,
            snippet=item.snippet,
            matchReason=item.match_reason,
            score=item.score,
            openUrl=item.open_url,
            worldLocationId=item.world_location_id,
            source=SearchResultSourceResponse.from_source(item.source) if item.source else None,
            createdAt=item.created_at,
        )


class SearchResponse(SearchSchema):
    query: str
    mode: SearchMode
    semantic_enabled: bool = Field(alias="semanticEnabled")
    items: list[SearchResultResponse]
    total: int
    limit: int
    offset: int


class RecentSearchResponse(SearchSchema):
    id: UUID
    query: str
    entity_types: list[SearchEntityType] = Field(alias="entityTypes")
    filters: dict[str, Any]
    result_count: int = Field(alias="resultCount")
    created_at: datetime = Field(alias="createdAt")

    @classmethod
    def from_recent_search(cls, recent_search: RecentSearch) -> RecentSearchResponse:
        return cls(
            id=recent_search.id,
            query=recent_search.query_text,
            entityTypes=[
                SearchEntityType(entity_type) for entity_type in recent_search.entity_types
            ],
            filters=recent_search.filters_json,
            resultCount=recent_search.result_count,
            createdAt=recent_search.created_at,
        )


class RecentSearchPage(SearchSchema):
    items: list[RecentSearchResponse]
    total: int
    limit: int
    offset: int
