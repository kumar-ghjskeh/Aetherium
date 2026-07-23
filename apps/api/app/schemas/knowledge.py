from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.knowledge import (
    KnowledgeNodeStatus,
    KnowledgeNodeType,
    KnowledgeRecommendationPriority,
    KnowledgeRelationshipDirection,
    KnowledgeRelationshipSource,
    KnowledgeRelationType,
)
from app.models.knowledge import KnowledgeNode, KnowledgeRelationship
from app.services.knowledge import (
    KnowledgeRecommendation,
    KnowledgeRelatedNode,
    KnowledgeSyncResult,
)


class KnowledgeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class KnowledgeNodeCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    node_type: KnowledgeNodeType = Field(default=KnowledgeNodeType.SKILL, alias="nodeType")
    title: str = Field(min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=4000)
    open_url: str | None = Field(default=None, alias="openUrl", max_length=600)
    metadata: dict[str, Any] = Field(default_factory=dict)


class KnowledgeNodeResponse(KnowledgeSchema):
    id: UUID
    node_type: KnowledgeNodeType = Field(alias="nodeType")
    source_id: UUID | None = Field(alias="sourceId")
    source_key: str = Field(alias="sourceKey")
    title: str
    description: str | None
    open_url: str = Field(alias="openUrl")
    status: KnowledgeNodeStatus
    metadata_json: dict[str, Any] = Field(alias="metadata")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_node(cls, node: KnowledgeNode) -> KnowledgeNodeResponse:
        return cls.model_validate(
            {
                "id": node.id,
                "nodeType": KnowledgeNodeType(node.node_type),
                "sourceId": node.source_id,
                "sourceKey": node.source_key,
                "title": node.title,
                "description": node.description,
                "openUrl": node.open_url,
                "status": KnowledgeNodeStatus(node.status),
                "metadata": node.metadata_json,
                "createdAt": node.created_at,
                "updatedAt": node.updated_at,
            }
        )


class KnowledgeNodePage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[KnowledgeNodeResponse]
    total: int
    limit: int
    offset: int


class KnowledgeRelationshipCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    source_node_id: UUID = Field(alias="sourceNodeId")
    target_node_id: UUID = Field(alias="targetNodeId")
    relation_type: KnowledgeRelationType = Field(alias="relationType")
    weight: float = Field(default=1.0, ge=0, le=1)
    evidence: dict[str, Any] = Field(default_factory=dict)


class KnowledgeRelationshipResponse(KnowledgeSchema):
    id: UUID
    source_node_id: UUID = Field(alias="sourceNodeId")
    target_node_id: UUID = Field(alias="targetNodeId")
    relation_type: KnowledgeRelationType = Field(alias="relationType")
    source: KnowledgeRelationshipSource
    weight: float
    evidence: dict[str, Any]
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_relationship(
        cls, relationship: KnowledgeRelationship
    ) -> KnowledgeRelationshipResponse:
        return cls.model_validate(
            {
                "id": relationship.id,
                "sourceNodeId": relationship.source_node_id,
                "targetNodeId": relationship.target_node_id,
                "relationType": KnowledgeRelationType(relationship.relation_type),
                "source": KnowledgeRelationshipSource(relationship.source),
                "weight": relationship.weight,
                "evidence": relationship.evidence,
                "createdAt": relationship.created_at,
                "updatedAt": relationship.updated_at,
            }
        )


class KnowledgeRelationshipPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[KnowledgeRelationshipResponse]
    total: int
    limit: int
    offset: int


class KnowledgeRelatedNodeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    node: KnowledgeNodeResponse
    relationship: KnowledgeRelationshipResponse
    direction: KnowledgeRelationshipDirection
    reason: str

    @classmethod
    def from_related(cls, related: KnowledgeRelatedNode) -> KnowledgeRelatedNodeResponse:
        return cls(
            node=KnowledgeNodeResponse.from_node(related.node),
            relationship=KnowledgeRelationshipResponse.from_relationship(related.relationship),
            direction=related.direction,
            reason=related.reason,
        )


class KnowledgeRelatedNodePage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[KnowledgeRelatedNodeResponse]
    total: int
    limit: int
    offset: int


class KnowledgeRecommendationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    topic_id: UUID = Field(alias="topicId")
    title: str
    reason: str
    priority: KnowledgeRecommendationPriority
    open_url: str = Field(alias="openUrl")
    mastery_score: float | None = Field(alias="masteryScore")
    stale_since: datetime | None = Field(alias="staleSince")

    @classmethod
    def from_recommendation(
        cls, recommendation: KnowledgeRecommendation
    ) -> KnowledgeRecommendationResponse:
        return cls.model_validate(
            {
                "topicId": recommendation.topic_id,
                "title": recommendation.title,
                "reason": recommendation.reason,
                "priority": recommendation.priority,
                "openUrl": recommendation.open_url,
                "masteryScore": recommendation.mastery_score,
                "staleSince": recommendation.stale_since,
            }
        )


class KnowledgeRecommendationPage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[KnowledgeRecommendationResponse]
    total: int
    limit: int
    offset: int


class KnowledgeSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    node_count: int = Field(alias="nodeCount")
    relationship_count: int = Field(alias="relationshipCount")
    weak_topic_count: int = Field(alias="weakTopicCount")
    stale_topic_count: int = Field(alias="staleTopicCount")


class KnowledgeSyncResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nodes_created: int = Field(alias="nodesCreated")
    nodes_updated: int = Field(alias="nodesUpdated")
    relationships_created: int = Field(alias="relationshipsCreated")
    relationships_reused: int = Field(alias="relationshipsReused")

    @classmethod
    def from_result(cls, result: KnowledgeSyncResult) -> KnowledgeSyncResponse:
        return cls.model_validate(
            {
                "nodesCreated": result.nodes_created,
                "nodesUpdated": result.nodes_updated,
                "relationshipsCreated": result.relationships_created,
                "relationshipsReused": result.relationships_reused,
            }
        )
