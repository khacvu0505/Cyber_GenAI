from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator


Subject = Literal["math", "physics", "chemistry"]
Difficulty = Literal["foundation", "intermediate", "advanced"]
ReasoningMode = Literal["direct", "guided", "self_consistency"]


class HealthRead(BaseModel):
    status: str
    app_name: str
    environment: str
    ai_provider: Literal["huggingface"]
    execution_mode: str
    model_id: str
    model_ready: bool


class ProblemRead(BaseModel):
    id: str
    subject: Subject
    topic: str
    grade: int
    difficulty: Difficulty
    title: str
    prompt: str
    skills: list[str]
    estimated_minutes: int


class ReasoningRequest(BaseModel):
    problem_id: str | None = None
    problem: str | None = Field(default=None, max_length=6000)
    subject: Subject = "math"
    grade: int = Field(default=10, ge=6, le=12)
    difficulty: Difficulty = "intermediate"
    mode: ReasoningMode = "guided"
    student_answer: str | None = Field(default=None, max_length=3000)
    samples: int | None = Field(default=None, ge=3, le=9)

    @model_validator(mode="after")
    def ensure_problem_source(self) -> "ReasoningRequest":
        if not self.problem_id and not (self.problem or "").strip():
            raise ValueError("Provide problem_id or problem.")
        return self


class SolutionStep(BaseModel):
    title: str
    explanation: str
    checkpoint: str


class VerificationRead(BaseModel):
    status: Literal["verified", "rejected", "consensus_only", "unavailable"]
    passed: bool | None
    method: str
    message: str


class CandidateSummary(BaseModel):
    answer: str
    confidence: float = Field(ge=0, le=1)
    verified: bool | None = None


class ReasoningResponse(BaseModel):
    attempt_id: str | None = None
    problem_id: str | None
    subject: Subject
    mode: ReasoningMode
    model_id: str
    execution_mode: str
    concepts: list[str]
    solution_steps: list[SolutionStep]
    hints: list[str]
    final_answer: str
    confidence: float = Field(ge=0, le=1)
    candidates: list[CandidateSummary]
    verification: VerificationRead
    student_feedback: str
    misconception: str | None = None
    follow_up_questions: list[str]
