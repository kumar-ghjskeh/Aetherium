from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.domain.knowledge import (
    KnowledgeNodeStatus,
    KnowledgeNodeType,
    KnowledgeRelationshipSource,
    KnowledgeRelationType,
)
from app.models.foundation import enum_values_sql


class KnowledgeNode(TimestampMixin, Base):
    __tablename__ = "knowledge_nodes"
    __table_args__ = (
        CheckConstraint(
            f"node_type IN ({enum_values_sql(KnowledgeNodeType)})",
            name="node_type_allowed",
        ),
        CheckConstraint(
            f"status IN ({enum_values_sql(KnowledgeNodeStatus)})",
            name="status_allowed",
        ),
        UniqueConstraint(
            "owner_user_id",
            "node_type",
            "source_key",
            name="uq_knowledge_nodes_owner_type_source_key",
        ),
        Index("ix_knowledge_nodes_owner_type_status", "owner_user_id", "node_type", "status"),
        Index("ix_knowledge_nodes_owner_source", "owner_user_id", "source_id"),
        Index("ix_knowledge_nodes_owner_updated", "owner_user_id", "updated_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    node_type: Mapped[str] = mapped_column(String(32), nullable=False)
    source_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True, index=True)
    source_key: Mapped[str] = mapped_column(String(160), nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    open_url: Mapped[str] = mapped_column(String(600), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=KnowledgeNodeStatus.ACTIVE.value
    )
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )


class KnowledgeRelationship(TimestampMixin, Base):
    __tablename__ = "knowledge_relationships"
    __table_args__ = (
        CheckConstraint(
            f"relation_type IN ({enum_values_sql(KnowledgeRelationType)})",
            name="relation_type_allowed",
        ),
        CheckConstraint(
            f"source IN ({enum_values_sql(KnowledgeRelationshipSource)})",
            name="source_allowed",
        ),
        CheckConstraint("weight >= 0 AND weight <= 1", name="weight_range"),
        CheckConstraint("source_node_id <> target_node_id", name="different_nodes"),
        UniqueConstraint(
            "owner_user_id",
            "source_node_id",
            "target_node_id",
            "relation_type",
            name="uq_knowledge_relationships_owner_source_target_type",
        ),
        Index(
            "ix_knowledge_relationships_owner_source",
            "owner_user_id",
            "source_node_id",
            "relation_type",
        ),
        Index(
            "ix_knowledge_relationships_owner_target",
            "owner_user_id",
            "target_node_id",
            "relation_type",
        ),
        Index("ix_knowledge_relationships_owner_updated", "owner_user_id", "updated_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_node_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("knowledge_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_node_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("knowledge_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    relation_type: Mapped[str] = mapped_column(String(48), nullable=False)
    source: Mapped[str] = mapped_column(
        String(32), nullable=False, default=KnowledgeRelationshipSource.SYSTEM.value
    )
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    evidence: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
