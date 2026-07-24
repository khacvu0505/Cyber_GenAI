from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.reasoning import Subject


class AttemptRead(BaseModel):
    id: str
    problem_id: str | None
    problem_title: str
    subject: Subject
    mode: str
    final_answer: str | None
    verified: bool | None
    confidence: float | None
    status: str
    created_at: datetime


class MasteryRead(BaseModel):
    subject: Subject
    skill: str
    attempts_count: int
    correct_count: int
    score: float


class DashboardRead(BaseModel):
    total_attempts: int
    verified_attempts: int
    mastery_score: float
    current_streak: int
    longest_streak: int
    mastery: list[MasteryRead]
