from __future__ import annotations

from datetime import datetime

from sqlalchemy import select

from .database import AuditRow, Base, DocumentRow, SessionLocal, engine
from .schemas import AuditEvent


def initialize_database(documents: list[dict]) -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        if session.scalar(select(DocumentRow.document_id).limit(1)) is None:
            session.add_all([DocumentRow(
                document_id=item["document_id"], title=item["title"], tenant_id=item["tenant_id"],
                department=item["department"], classification=item["classification"],
                allowed_roles=item["allowed_roles"], allowed_users=item["allowed_users"],
            ) for item in documents])
            session.commit()


def document_count() -> int:
    with SessionLocal() as session:
        return len(session.scalars(select(DocumentRow)).all())


def save_audit(event: AuditEvent) -> None:
    with SessionLocal() as session:
        session.add(AuditRow(timestamp=datetime.fromisoformat(event.timestamp), user_id=event.user_id,
                             tenant_id=event.tenant_id, question=event.question,
                             allowed_document_ids=event.allowed_document_ids,
                             denied_document_ids=event.denied_document_ids))
        session.commit()


def latest_audits(limit: int = 30) -> list[AuditEvent]:
    with SessionLocal() as session:
        rows = session.scalars(select(AuditRow).order_by(AuditRow.timestamp.desc()).limit(limit)).all()
    return [AuditEvent(timestamp=row.timestamp.isoformat(), user_id=row.user_id, tenant_id=row.tenant_id,
                       question=row.question, allowed_document_ids=row.allowed_document_ids,
                       denied_document_ids=row.denied_document_ids) for row in rows]
