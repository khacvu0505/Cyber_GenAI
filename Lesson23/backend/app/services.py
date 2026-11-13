from datetime import UTC, datetime

from .policy import decide
from .retrieval import excerpt, rank, score
from .schemas import AskRequest, AuditEvent, Candidate, User


def secure_retrieval(user: User, question: str, documents: list[dict]) -> tuple[str, list[str], list[Candidate], AuditEvent]:
    candidates: list[Candidate] = []
    allowed_context: list[dict] = []
    for document in rank(question, documents):
        permitted, reason = decide(user, document)
        candidates.append(Candidate(document_id=document["document_id"], title=document["title"],
                                    score=score(question, document["text"]), decision="allowed" if permitted else "denied",
                                    reason=reason, classification=document["classification"], department=document["department"],
                                    excerpt=excerpt(document["text"]) if permitted else None))
        if permitted:
            allowed_context.append(document)
    answer = " ".join(excerpt(item["text"]) for item in allowed_context[:2]) if allowed_context else "Không tìm thấy nguồn mà tài khoản hiện tại được phép truy cập."
    sources = [item["document_id"] for item in allowed_context[:2]]
    event = AuditEvent(timestamp=datetime.now(UTC).isoformat(), user_id=user.user_id, tenant_id=user.tenant_id,
                       question=question, allowed_document_ids=[item.document_id for item in candidates if item.decision == "allowed"],
                       denied_document_ids=[item.document_id for item in candidates if item.decision == "denied"])
    return answer, sources, candidates, event
