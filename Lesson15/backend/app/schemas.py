from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


ProposalStatus = Literal["queued", "running", "completed", "failed"]


class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("full_name", "email")
    @classmethod
    def normalize_user_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Email không hợp lệ.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Mật khẩu không được vượt quá 72 bytes.")
        return value


class UserLogin(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=1, max_length=72)


class UserRead(BaseModel):
    id: UUID
    email: str
    full_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserRead


class ProposalCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    client_name: str = Field(min_length=2, max_length=160)
    company_name: str = Field(min_length=2, max_length=160)
    client_brief: str = Field(min_length=30, max_length=20_000)
    service_description: str = Field(min_length=20, max_length=12_000)
    budget: str = Field(default="", max_length=120)
    timeline: str = Field(default="", max_length=120)
    constraints: str = Field(default="", max_length=8_000)
    language: Literal["Tiếng Việt", "English"] = "Tiếng Việt"
    auto_run: bool = True

    @field_validator("title", "client_name", "company_name", "client_brief", "service_description")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        return value.strip()


class ProposalRead(BaseModel):
    id: UUID
    title: str
    client_name: str
    company_name: str
    language: str
    client_brief: str
    service_description: str
    budget: str
    timeline: str
    constraints: str
    status: ProposalStatus
    current_stage: str
    requirements_analysis: dict | None
    solution_plan: dict | None
    risk_review: dict | None
    final_markdown: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProposalSummary(BaseModel):
    id: UUID
    title: str
    client_name: str
    company_name: str
    status: ProposalStatus
    current_stage: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RequirementAnalysis(BaseModel):
    executive_need: str
    objectives: list[str]
    mandatory_requirements: list[str]
    success_criteria: list[str]
    stakeholders: list[str]
    assumptions: list[str]
    clarification_questions: list[str]


class Workstream(BaseModel):
    name: str
    description: str
    deliverables: list[str]


class Milestone(BaseModel):
    phase: str
    duration: str
    outcomes: list[str]


class SolutionPlan(BaseModel):
    solution_summary: str
    approach: list[str]
    workstreams: list[Workstream]
    milestones: list[Milestone]
    team_roles: list[str]
    assumptions: list[str]
    exclusions: list[str]


class RiskItem(BaseModel):
    risk: str
    impact: Literal["low", "medium", "high"]
    likelihood: Literal["low", "medium", "high"]
    mitigation: str


class RiskReview(BaseModel):
    compliance_score: int = Field(ge=0, le=100)
    covered_requirements: list[str]
    gaps: list[str]
    risks: list[RiskItem]
    recommendations: list[str]


class ProposalGenerationResult(BaseModel):
    requirements_analysis: RequirementAnalysis
    solution_plan: SolutionPlan
    risk_review: RiskReview
    final_markdown: str
