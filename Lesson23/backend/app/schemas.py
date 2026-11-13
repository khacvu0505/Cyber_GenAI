from typing import Literal

from pydantic import BaseModel


class User(BaseModel):
    user_id: str
    display_name: str
    tenant_id: str
    department: str
    roles: list[str]


class LoginRequest(BaseModel):
    user_id: str


class AskRequest(BaseModel):
    token: str
    question: str


class Candidate(BaseModel):
    document_id: str
    title: str
    score: float
    decision: Literal["allowed", "denied"]
    reason: str
    classification: str
    department: str
    excerpt: str | None = None


class AuditEvent(BaseModel):
    timestamp: str
    user_id: str
    tenant_id: str
    question: str
    allowed_document_ids: list[str]
    denied_document_ids: list[str]
