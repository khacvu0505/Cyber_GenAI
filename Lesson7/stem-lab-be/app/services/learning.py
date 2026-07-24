from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import LearningAttempt, LearningStreak, MasteryRecord, Problem
from app.schemas.learning import AttemptRead, DashboardRead, MasteryRead


def update_progress(db: Session, attempt: LearningAttempt, problem: Problem | None) -> None:
    today = date.today()
    streak = db.scalar(select(LearningStreak).where(LearningStreak.user_id == attempt.user_id))
    if streak is None:
        streak = LearningStreak(user_id=attempt.user_id, current_days=1, longest_days=1, last_activity_date=today)
        db.add(streak)
    elif streak.last_activity_date != today:
        streak.current_days = streak.current_days + 1 if streak.last_activity_date == today - timedelta(days=1) else 1
        streak.longest_days = max(streak.longest_days, streak.current_days)
        streak.last_activity_date = today

    skills = problem.skills if problem else ["tự luyện"]
    for skill in skills:
        mastery = db.scalar(
            select(MasteryRecord).where(
                MasteryRecord.user_id == attempt.user_id,
                MasteryRecord.subject == attempt.subject,
                MasteryRecord.skill == skill,
            )
        )
        if mastery is None:
            mastery = MasteryRecord(
                user_id=attempt.user_id,
                subject=attempt.subject,
                skill=skill,
                attempts_count=0,
                correct_count=0,
                score=0.0,
            )
            db.add(mastery)
        mastery.attempts_count += 1
        if attempt.verified is True:
            mastery.correct_count += 1
        mastery.score = round(100 * mastery.correct_count / mastery.attempts_count, 1)


def list_attempts(db: Session, user_id: str, limit: int = 20) -> list[AttemptRead]:
    rows = db.execute(
        select(LearningAttempt, Problem.title)
        .outerjoin(Problem, LearningAttempt.problem_id == Problem.id)
        .where(LearningAttempt.user_id == user_id)
        .order_by(LearningAttempt.created_at.desc())
        .limit(limit)
    ).all()
    return [
        AttemptRead(
            id=attempt.id,
            problem_id=attempt.problem_id,
            problem_title=title or (attempt.custom_problem or "Bài tự nhập")[:100],
            subject=attempt.subject,  # type: ignore[arg-type]
            mode=attempt.mode,
            final_answer=attempt.final_answer,
            verified=attempt.verified,
            confidence=attempt.confidence,
            status=attempt.status,
            created_at=attempt.created_at,
        )
        for attempt, title in rows
    ]


def get_dashboard(db: Session, user_id: str) -> DashboardRead:
    total = db.scalar(select(func.count()).select_from(LearningAttempt).where(LearningAttempt.user_id == user_id)) or 0
    verified = db.scalar(
        select(func.count()).select_from(LearningAttempt).where(
            LearningAttempt.user_id == user_id,
            LearningAttempt.status == "completed",
            LearningAttempt.verified.is_(True),
        )
    ) or 0
    records = db.scalars(
        select(MasteryRecord).where(MasteryRecord.user_id == user_id).order_by(MasteryRecord.score.desc())
    ).all()
    streak = db.scalar(select(LearningStreak).where(LearningStreak.user_id == user_id))
    score = round(sum(item.score for item in records) / len(records), 1) if records else 0.0
    return DashboardRead(
        total_attempts=total,
        verified_attempts=verified,
        mastery_score=score,
        current_streak=streak.current_days if streak else 0,
        longest_streak=streak.longest_days if streak else 0,
        mastery=[
            MasteryRead(
                subject=item.subject,  # type: ignore[arg-type]
                skill=item.skill,
                attempts_count=item.attempts_count,
                correct_count=item.correct_count,
                score=item.score,
            )
            for item in records
        ],
    )
