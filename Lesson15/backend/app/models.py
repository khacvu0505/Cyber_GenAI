from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(180))
    client_name: Mapped[str] = mapped_column(String(160))
    company_name: Mapped[str] = mapped_column(String(160))
    language: Mapped[str] = mapped_column(String(30), default="Tiếng Việt")
    client_brief: Mapped[str] = mapped_column(Text)
    service_description: Mapped[str] = mapped_column(Text)
    budget: Mapped[str] = mapped_column(String(120), default="")
    timeline: Mapped[str] = mapped_column(String(120), default="")
    constraints: Mapped[str] = mapped_column(Text, default="")

    status: Mapped[str] = mapped_column(String(30), default="queued", index=True)
    current_stage: Mapped[str] = mapped_column(String(120), default="Đang chờ xử lý")
    requirements_analysis: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    solution_plan: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    risk_review: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    final_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(160))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
