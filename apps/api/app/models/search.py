from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, CheckConstraint, ForeignKey, Index, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class RecentSearch(TimestampMixin, Base):
    __tablename__ = "recent_searches"
    __table_args__ = (
        CheckConstraint("length(query_text) > 0", name="query_text_not_empty"),
        CheckConstraint("result_count >= 0", name="result_count_nonnegative"),
        Index("ix_recent_searches_owner_created", "owner_user_id", "created_at"),
        Index("ix_recent_searches_owner_query", "owner_user_id", "normalized_query"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    query_text: Mapped[str] = mapped_column(String(240), nullable=False)
    normalized_query: Mapped[str] = mapped_column(String(240), nullable=False)
    entity_types: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    filters_json: Mapped[dict[str, Any]] = mapped_column(
        "filters", JSON, nullable=False, default=dict
    )
    result_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
