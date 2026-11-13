from datetime import datetime

from sqlalchemy import JSON, DateTime, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from .config import DATABASE_URL


class Base(DeclarativeBase):
    pass


class DocumentRow(Base):
    __tablename__ = "documents"
    document_id: Mapped[str] = mapped_column(String(120), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    tenant_id: Mapped[str] = mapped_column(String(120), index=True)
    department: Mapped[str] = mapped_column(String(120), index=True)
    classification: Mapped[str] = mapped_column(String(40), index=True)
    allowed_roles: Mapped[list] = mapped_column(JSON)
    allowed_users: Mapped[list] = mapped_column(JSON)


class AuditRow(Base):
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    user_id: Mapped[str] = mapped_column(String(120), index=True)
    tenant_id: Mapped[str] = mapped_column(String(120), index=True)
    question: Mapped[str] = mapped_column(String(2000))
    allowed_document_ids: Mapped[list] = mapped_column(JSON)
    denied_document_ids: Mapped[list] = mapped_column(JSON)


connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
