from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="student", index=True)
    grade: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    attempts: Mapped[list["LearningAttempt"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    user: Mapped[User] = relationship(back_populates="refresh_tokens")


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    subject: Mapped[str] = mapped_column(String(20), index=True)
    topic: Mapped[str] = mapped_column(String(120))
    grade: Mapped[int] = mapped_column(Integer)
    difficulty: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(200))
    prompt: Mapped[str] = mapped_column(Text)
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    estimated_minutes: Mapped[int] = mapped_column(Integer)
    expected_answer: Mapped[str] = mapped_column(Text)
    verification_method: Mapped[str] = mapped_column(String(40))
    explanation_anchor: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class LearningAttempt(Base):
    __tablename__ = "learning_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    problem_id: Mapped[str | None] = mapped_column(ForeignKey("problems.id", ondelete="SET NULL"), nullable=True)
    custom_problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    subject: Mapped[str] = mapped_column(String(20), index=True)
    grade: Mapped[int] = mapped_column(Integer)
    difficulty: Mapped[str] = mapped_column(String(20))
    mode: Mapped[str] = mapped_column(String(30))
    student_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="processing", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship(back_populates="attempts")
    reasoning_result: Mapped["ReasoningResult | None"] = relationship(back_populates="attempt", cascade="all, delete-orphan")


class ReasoningResult(Base):
    __tablename__ = "reasoning_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    attempt_id: Mapped[str] = mapped_column(ForeignKey("learning_attempts.id", ondelete="CASCADE"), unique=True)
    model_id: Mapped[str] = mapped_column(String(255))
    execution_mode: Mapped[str] = mapped_column(String(30))
    content: Mapped[dict] = mapped_column(JSON)
    candidates: Mapped[list[dict]] = mapped_column(JSON)
    verification: Mapped[dict] = mapped_column(JSON)
    misconception: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    attempt: Mapped[LearningAttempt] = relationship(back_populates="reasoning_result")


class MasteryRecord(Base):
    __tablename__ = "mastery_records"
    __table_args__ = (UniqueConstraint("user_id", "subject", "skill", name="uq_mastery_user_subject_skill"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject: Mapped[str] = mapped_column(String(20))
    skill: Mapped[str] = mapped_column(String(120))
    attempts_count: Mapped[int] = mapped_column(Integer, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class LearningStreak(Base):
    __tablename__ = "learning_streaks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    current_days: Mapped[int] = mapped_column(Integer, default=0)
    longest_days: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
