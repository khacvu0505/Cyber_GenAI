from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models import LearningAttempt, Problem, ReasoningResult, User
from app.schemas.learning import AttemptRead, DashboardRead
from app.schemas.reasoning import HealthRead, ProblemRead, ReasoningRequest, ReasoningResponse, Subject
from app.services.huggingface_engine import (
    HuggingFaceConfigurationError,
    HuggingFaceEngine,
    HuggingFaceGenerationError,
    get_huggingface_engine,
)
from app.services.learning import get_dashboard, list_attempts, update_progress
from app.services.problem_bank import ProblemRecord
from app.services.reasoning import solve_problem


router = APIRouter()


def get_engine(settings: Settings = Depends(get_settings)) -> HuggingFaceEngine:
    return get_huggingface_engine(settings)


@router.get("/health", response_model=HealthRead)
def health(settings: Settings = Depends(get_settings), db: Session = Depends(get_db)) -> HealthRead:
    db.execute(text("SELECT 1"))
    return HealthRead(
        status="ok",
        app_name=settings.app_name,
        environment=settings.environment,
        ai_provider="huggingface",
        execution_mode=settings.hf_execution_mode,
        model_id=settings.hf_model_id,
        model_ready=settings.hf_configured,
    )


@router.get("/problems", response_model=list[ProblemRead])
def problems(
    subject: Subject | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ProblemRead]:
    statement = select(Problem).where(Problem.is_active.is_(True)).order_by(Problem.subject, Problem.id)
    if subject:
        statement = statement.where(Problem.subject == subject)
    return [ProblemRecord.from_model(item).public() for item in db.scalars(statement).all()]


@router.post("/reason", response_model=ReasoningResponse)
def reason(
    payload: ReasoningRequest,
    settings: Settings = Depends(get_settings),
    engine: HuggingFaceEngine = Depends(get_engine),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReasoningResponse:
    problem = db.get(Problem, payload.problem_id) if payload.problem_id else None
    record = ProblemRecord.from_model(problem) if problem else None
    attempt = LearningAttempt(
        user_id=user.id,
        problem_id=problem.id if problem else None,
        custom_problem=None if problem else payload.problem,
        subject=problem.subject if problem else payload.subject,
        grade=problem.grade if problem else payload.grade,
        difficulty=problem.difficulty if problem else payload.difficulty,
        mode=payload.mode,
        student_answer=payload.student_answer,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    try:
        result = solve_problem(request=payload, settings=settings, engine=engine, record=record)
    except HuggingFaceConfigurationError as exc:
        attempt.status = "failed"
        db.commit()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except HuggingFaceGenerationError as exc:
        attempt.status = "failed"
        db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except (ValueError, KeyError, TypeError) as exc:
        attempt.status = "failed"
        db.commit()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    result.attempt_id = attempt.id
    try:
        attempt.final_answer = result.final_answer
        attempt.verified = result.verification.passed
        attempt.confidence = result.confidence
        attempt.status = "completed"
        attempt.completed_at = datetime.now(timezone.utc)
        db.add(
            ReasoningResult(
                attempt_id=attempt.id,
                model_id=result.model_id,
                execution_mode=result.execution_mode,
                content=result.model_dump(mode="json"),
                candidates=[item.model_dump(mode="json") for item in result.candidates],
                verification=result.verification.model_dump(mode="json"),
                misconception=result.misconception,
            )
        )
        update_progress(db, attempt, problem)
        db.commit()
    except Exception as exc:
        attempt_id = attempt.id
        db.rollback()
        failed_attempt = db.get(LearningAttempt, attempt_id)
        if failed_attempt is not None:
            failed_attempt.status = "failed"
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể lưu kết quả học tập. Vui lòng thử lại.",
        ) from exc
    return result


@router.get("/me/attempts", response_model=list[AttemptRead])
def attempts(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[AttemptRead]:
    return list_attempts(db, user.id, limit)


@router.get("/me/dashboard", response_model=DashboardRead)
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> DashboardRead:
    return get_dashboard(db, user.id)
