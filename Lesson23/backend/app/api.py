from fastapi import APIRouter, HTTPException

from .auth import authenticated_user, encode_token
from .catalog import DOCUMENTS, USERS
from .config import DATABASE_URL
from .repositories import document_count, latest_audits, save_audit
from .schemas import AskRequest, AuditEvent, LoginRequest, User
from .services import secure_retrieval

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "documents": document_count(), "users": len(USERS), "database": DATABASE_URL.split(":")[0]}


@router.get("/users", response_model=list[User])
def users():
    return list(USERS.values())


@router.post("/auth/demo-login")
def login(request: LoginRequest):
    user = USERS.get(request.user_id)
    if not user:
        raise HTTPException(404, "Không tìm thấy demo user")
    return {"token": encode_token(user), "user": user}


@router.post("/ask")
def ask(request: AskRequest):
    user = authenticated_user(request.token)
    answer, sources, candidates, event = secure_retrieval(user, request.question, DOCUMENTS)
    save_audit(event)
    return {"user": user, "answer": answer, "sources": sources, "candidates": candidates, "audit_event": event}


@router.get("/audit", response_model=list[AuditEvent])
def audit():
    return latest_audits()
