from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models.learning import Course, CourseSection, Enrollment, Lesson, LessonProgress, User
from app.models.video import StudyArtifact, Summary, TranscriptChunk, Video
from app.schemas.learning import (
    AuthLoginCreate,
    AuthRegisterCreate,
    AuthTokenRead,
    CourseDetailRead,
    CourseListRead,
    EnrollmentCreate,
    EnrollmentRead,
    LessonArtifactCreate,
    LessonStudyStateRead,
    LessonSummaryCreate,
    ProgressRead,
    ProgressUpdate,
    UserRead,
)
from app.schemas.video import (
    HealthRead,
    StudyArtifactCreate,
    StudyArtifactRead,
    SummaryCreate,
    SummaryRead,
    TranscriptLoadCreate,
    VideoDetailRead,
    VideoRead,
)
from app.services.summarizer import (
    LLMGenerationError,
    LLMNotConfiguredError,
    generate_study_artifact,
    summarize_transcript,
)
from app.services.auth import create_access_token, get_current_user, hash_password, verify_password
from app.services.youtube import load_transcript, normalize_youtube_url

router = APIRouter()


@router.get("/health", response_model=HealthRead)
def health(settings: Settings = Depends(get_settings)) -> dict:
    status_payload = settings.public_status
    return {
        "status": "ok",
        "app_name": settings.app_name,
        **status_payload,
    }


@router.get("/videos", response_model=list[VideoRead])
def list_videos(db: Session = Depends(get_db)) -> list[Video]:
    return list(db.scalars(select(Video).order_by(Video.created_at.desc())).all())


@router.get("/videos/{video_id}", response_model=VideoDetailRead)
def get_video(video_id: str, db: Session = Depends(get_db)) -> Video:
    video = db.scalar(_video_detail_query(video_id))
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    return video


@router.post("/auth/register", response_model=AuthTokenRead, status_code=status.HTTP_201_CREATED)
def register(payload: AuthRegisterCreate, db: Session = Depends(get_db)) -> AuthTokenRead:
    email = payload.email.strip().lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered.")

    user = User(
        name=payload.name.strip(),
        email=email,
        role=payload.role,
        avatar_url=None,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthTokenRead(access_token=create_access_token(user), user=UserRead.model_validate(user))


@router.post("/auth/login", response_model=AuthTokenRead)
def login(payload: AuthLoginCreate, db: Session = Depends(get_db)) -> AuthTokenRead:
    email = payload.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    return AuthTokenRead(access_token=create_access_token(user), user=UserRead.model_validate(user))


@router.get("/auth/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/marketplace/users", response_model=list[UserRead])
def list_demo_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[User]:
    return list(db.scalars(select(User).order_by(User.role, User.name)).all())


@router.get("/marketplace/courses", response_model=list[CourseListRead])
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_id: str | None = Query(default=None),
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
) -> list[CourseListRead]:
    effective_user_id = user_id or current_user.id
    _authorize_user_action(current_user, effective_user_id)

    query = select(Course).options(selectinload(Course.instructor), selectinload(Course.sections).selectinload(CourseSection.lessons))

    if category and category != "all":
        query = query.where(Course.category == category)
    if q:
        like = f"%{q.strip()}%"
        query = query.where(Course.title.ilike(like) | Course.subtitle.ilike(like) | Course.category.ilike(like))

    courses = list(db.scalars(query.order_by(Course.rating.desc(), Course.students_count.desc())).unique().all())
    enrollments = _enrollment_map(db, effective_user_id)
    return [_course_to_list_read(course, enrollments.get(course.id)) for course in courses]


@router.get("/marketplace/courses/{course_id}", response_model=CourseDetailRead)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_id: str | None = Query(default=None),
) -> CourseDetailRead:
    effective_user_id = user_id or current_user.id
    _authorize_user_action(current_user, effective_user_id)

    course = db.scalar(_course_detail_query(course_id))
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")
    enrollment = _enrollment_map(db, effective_user_id).get(course.id)
    return _course_to_detail_read(course, enrollment)


@router.post("/marketplace/enrollments", response_model=EnrollmentRead, status_code=status.HTTP_201_CREATED)
def create_enrollment(
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Enrollment:
    _authorize_user_action(current_user, payload.user_id)
    _require_user(db, payload.user_id)
    course = db.get(Course, payload.course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")

    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.user_id == payload.user_id,
            Enrollment.course_id == payload.course_id,
        )
    )
    if enrollment:
        return enrollment

    enrollment = Enrollment(user_id=payload.user_id, course_id=payload.course_id, status="active", progress_percent=0)
    course.students_count += 1
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.post("/marketplace/progress", response_model=ProgressRead)
def update_progress(
    payload: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProgressRead:
    _authorize_user_action(current_user, payload.user_id)
    _require_user(db, payload.user_id)
    lesson = db.scalar(_lesson_detail_query(payload.lesson_id))
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found.")

    progress = db.scalar(
        select(LessonProgress).where(
            LessonProgress.user_id == payload.user_id,
            LessonProgress.lesson_id == payload.lesson_id,
        )
    )
    if not progress:
        progress = LessonProgress(user_id=payload.user_id, lesson_id=payload.lesson_id)
        db.add(progress)

    progress.progress_percent = 100 if payload.completed else payload.progress_percent
    progress.status = "completed" if payload.completed or payload.progress_percent >= 100 else "in_progress"
    progress.completed_at = datetime.utcnow() if progress.status == "completed" else None

    course = lesson.section.course
    enrollment = _ensure_enrollment(db, user_id=payload.user_id, course_id=course.id)
    db.flush()
    enrollment.progress_percent = _calculate_course_progress(db, user_id=payload.user_id, course=course)
    db.commit()
    db.refresh(progress)

    return ProgressRead.model_validate(progress).model_copy(
        update={"course_progress_percent": enrollment.progress_percent}
    )


@router.get("/marketplace/lessons/{lesson_id}/study-state", response_model=LessonStudyStateRead)
def get_lesson_study_state(
    lesson_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> LessonStudyStateRead:
    lesson = db.scalar(_lesson_detail_query(lesson_id))
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found.")

    latest_summary = db.scalar(
        select(Summary)
        .where(Summary.video_id == lesson.video_id)
        .order_by(Summary.created_at.desc())
        .limit(1)
    )
    latest_key_concepts = db.scalar(
        select(StudyArtifact)
        .where(StudyArtifact.video_id == lesson.video_id, StudyArtifact.artifact_type == "key_concepts")
        .order_by(StudyArtifact.created_at.desc())
        .limit(1)
    )
    latest_flashcards = db.scalar(
        select(StudyArtifact)
        .where(StudyArtifact.video_id == lesson.video_id, StudyArtifact.artifact_type == "flashcards")
        .order_by(StudyArtifact.created_at.desc())
        .limit(1)
    )
    return LessonStudyStateRead(
        lesson_id=lesson.id,
        summary=latest_summary,
        key_concepts=latest_key_concepts,
        flashcards=latest_flashcards,
    )


@router.post("/marketplace/lessons/{lesson_id}/summary", response_model=SummaryRead, status_code=status.HTTP_201_CREATED)
def create_lesson_summary(
    lesson_id: str,
    payload: LessonSummaryCreate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    _current_user: User = Depends(get_current_user),
) -> Summary:
    lesson = _ensure_lesson_transcript(
        db=db,
        lesson_id=lesson_id,
        chunk_size_seconds=payload.chunk_size_seconds,
        preferred_languages=payload.preferred_languages,
        translate_to=payload.translate_to,
    )
    try:
        content, model = summarize_transcript(
            settings=settings,
            chunks=lesson.video.chunks,
            language=payload.language,
            detail_level=payload.detail_level,
            temperature=payload.temperature,
            model_name=payload.model_name,
        )
    except LLMNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LLMGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    summary = Summary(
        video_id=lesson.video_id,
        language=payload.language,
        detail_level=payload.detail_level,
        content=content,
        model_name=model,
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


@router.post("/marketplace/lessons/{lesson_id}/artifacts", response_model=StudyArtifactRead, status_code=status.HTTP_201_CREATED)
def create_lesson_artifact(
    lesson_id: str,
    payload: LessonArtifactCreate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    _current_user: User = Depends(get_current_user),
) -> StudyArtifact:
    lesson = _ensure_lesson_transcript(
        db=db,
        lesson_id=lesson_id,
        chunk_size_seconds=payload.chunk_size_seconds,
        preferred_languages=payload.preferred_languages,
        translate_to=payload.translate_to,
    )
    try:
        content, model = generate_study_artifact(
            settings=settings,
            chunks=lesson.video.chunks,
            artifact_type=payload.artifact_type,
            language=payload.language,
            temperature=payload.temperature,
            model_name=payload.model_name,
        )
    except LLMNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LLMGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    artifact = StudyArtifact(
        video_id=lesson.video_id,
        artifact_type=payload.artifact_type,
        language=payload.language,
        content=content,
        model_name=model,
    )
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    return artifact


@router.post("/transcripts", response_model=VideoDetailRead, status_code=status.HTTP_201_CREATED)
def create_transcript(payload: TranscriptLoadCreate, db: Session = Depends(get_db)) -> Video:
    return _load_or_refresh_transcript(
        db=db,
        youtube_url=payload.youtube_url,
        add_video_info=payload.add_video_info,
        chunked=payload.chunked,
        chunk_size_seconds=payload.chunk_size_seconds,
        preferred_languages=payload.preferred_languages,
        translate_to=payload.translate_to,
    )


@router.post("/summaries", response_model=SummaryRead, status_code=status.HTTP_201_CREATED)
def create_summary(
    payload: SummaryCreate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Summary:
    video = _resolve_video_from_payload(
        db=db,
        video_id=payload.video_id,
        youtube_url=payload.youtube_url,
        chunk_size_seconds=payload.chunk_size_seconds,
        preferred_languages=payload.preferred_languages,
        translate_to=payload.translate_to,
    )
    if not video.chunks:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Video has no transcript chunks.")

    try:
        content, model = summarize_transcript(
            settings=settings,
            chunks=video.chunks,
            language=payload.language,
            detail_level=payload.detail_level,
            temperature=payload.temperature,
            model_name=payload.model_name,
        )
    except LLMNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LLMGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    summary = Summary(
        video_id=video.id,
        language=payload.language,
        detail_level=payload.detail_level,
        content=content,
        model_name=model,
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


@router.post("/study-artifacts", response_model=StudyArtifactRead, status_code=status.HTTP_201_CREATED)
def create_study_artifact(
    payload: StudyArtifactCreate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> StudyArtifact:
    video = _resolve_video_from_payload(
        db=db,
        video_id=payload.video_id,
        youtube_url=payload.youtube_url,
        chunk_size_seconds=payload.chunk_size_seconds,
        preferred_languages=payload.preferred_languages,
        translate_to=payload.translate_to,
    )
    if not video.chunks:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Video has no transcript chunks.")

    try:
        content, model = generate_study_artifact(
            settings=settings,
            chunks=video.chunks,
            artifact_type=payload.artifact_type,
            language=payload.language,
            temperature=payload.temperature,
            model_name=payload.model_name,
        )
    except LLMNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LLMGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    artifact = StudyArtifact(
        video_id=video.id,
        artifact_type=payload.artifact_type,
        language=payload.language,
        content=content,
        model_name=model,
    )
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    return artifact


def _resolve_video_from_payload(
    *,
    db: Session,
    video_id: str | None,
    youtube_url: str | None,
    chunk_size_seconds: int,
    preferred_languages: list[str],
    translate_to: str | None,
) -> Video:
    if video_id:
        video = db.scalar(_video_detail_query(video_id))
        if not video:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
        return video

    if youtube_url:
        url = normalize_youtube_url(youtube_url)
        existing = db.scalar(select(Video).where(Video.source_url == url).options(selectinload(Video.chunks)))
        if existing and (not translate_to or existing.language == translate_to):
            return existing
        return _load_or_refresh_transcript(
            db=db,
            youtube_url=url,
            add_video_info=False,
            chunked=True,
            chunk_size_seconds=chunk_size_seconds,
            preferred_languages=preferred_languages,
            translate_to=translate_to,
        )

    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Provide either video_id or youtube_url.")


def _load_or_refresh_transcript(
    *,
    db: Session,
    youtube_url: str,
    add_video_info: bool,
    chunked: bool,
    chunk_size_seconds: int,
    preferred_languages: list[str],
    translate_to: str | None,
) -> Video:
    try:
        loaded = load_transcript(
            youtube_url,
            add_video_info=add_video_info,
            chunked=chunked,
            chunk_size_seconds=chunk_size_seconds,
            preferred_languages=preferred_languages,
            translate_to=translate_to,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Cannot load transcript: {exc}") from exc

    video = db.scalar(select(Video).where(Video.source_url == loaded.source_url))
    if video:
        db.execute(delete(TranscriptChunk).where(TranscriptChunk.video_id == video.id))
        video.title = loaded.title or video.title
        video.channel = loaded.channel or video.channel
        video.duration_seconds = loaded.duration_seconds or video.duration_seconds
        video.language = loaded.language or video.language
        video.transcript_status = "loaded"
    else:
        video = Video(
            source_url=loaded.source_url,
            title=loaded.title,
            channel=loaded.channel,
            duration_seconds=loaded.duration_seconds,
            language=loaded.language,
            transcript_status="loaded",
        )
        db.add(video)
        db.flush()

    for chunk in loaded.chunks:
        db.add(TranscriptChunk(video_id=video.id, **chunk))

    db.commit()
    video = db.scalar(_video_detail_query(video.id))
    if not video:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Transcript was saved but could not be reloaded.")
    return video


def _video_detail_query(video_id: str):
    return (
        select(Video)
        .where(Video.id == video_id)
        .options(
            selectinload(Video.chunks),
            selectinload(Video.summaries),
            selectinload(Video.study_artifacts),
        )
    )


def _course_detail_query(course_id: str):
    return (
        select(Course)
        .where(Course.id == course_id)
        .options(
            selectinload(Course.instructor),
            selectinload(Course.sections).selectinload(CourseSection.lessons),
        )
    )


def _lesson_detail_query(lesson_id: str):
    return (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(
            selectinload(Lesson.video).selectinload(Video.chunks),
            selectinload(Lesson.section).selectinload(CourseSection.course).selectinload(Course.sections).selectinload(CourseSection.lessons),
        )
    )


def _enrollment_map(db: Session, user_id: str | None) -> dict[str, Enrollment]:
    if not user_id:
        return {}
    enrollments = db.scalars(select(Enrollment).where(Enrollment.user_id == user_id)).all()
    return {enrollment.course_id: enrollment for enrollment in enrollments}


def _course_to_list_read(course: Course, enrollment: Enrollment | None = None) -> CourseListRead:
    lesson_count = sum(len(section.lessons) for section in course.sections)
    return CourseListRead.model_validate(course).model_copy(
        update={
            "section_count": len(course.sections),
            "lesson_count": lesson_count,
            "enrolled": enrollment is not None,
            "progress_percent": enrollment.progress_percent if enrollment else 0,
        }
    )


def _course_to_detail_read(course: Course, enrollment: Enrollment | None = None) -> CourseDetailRead:
    base = _course_to_list_read(course, enrollment)
    return CourseDetailRead(**base.model_dump(), description=course.description, sections=course.sections)


def _require_user(db: Session, user_id: str) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


def _authorize_user_action(current_user: User, requested_user_id: str) -> None:
    if current_user.role == "admin" or current_user.id == requested_user_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot act on behalf of another user.")


def _ensure_enrollment(db: Session, *, user_id: str, course_id: str) -> Enrollment:
    enrollment = db.scalar(select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id))
    if enrollment:
        return enrollment
    enrollment = Enrollment(user_id=user_id, course_id=course_id, status="active", progress_percent=0)
    db.add(enrollment)
    return enrollment


def _calculate_course_progress(db: Session, *, user_id: str, course: Course) -> float:
    lesson_ids = [lesson.id for section in course.sections for lesson in section.lessons]
    if not lesson_ids:
        return 0
    completed_count = db.scalar(
        select(func.count(LessonProgress.id)).where(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id.in_(lesson_ids),
            LessonProgress.status == "completed",
        )
    )
    return round((completed_count or 0) / len(lesson_ids) * 100, 2)


def _ensure_lesson_transcript(
    *,
    db: Session,
    lesson_id: str,
    chunk_size_seconds: int,
    preferred_languages: list[str],
    translate_to: str | None,
) -> Lesson:
    lesson = db.scalar(_lesson_detail_query(lesson_id))
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found.")

    if lesson.video.chunks and (not translate_to or lesson.video.language == translate_to):
        return lesson

    _load_or_refresh_transcript(
        db=db,
        youtube_url=lesson.youtube_url,
        add_video_info=False,
        chunked=True,
        chunk_size_seconds=chunk_size_seconds,
        preferred_languages=preferred_languages,
        translate_to=translate_to,
    )
    refreshed_lesson = db.scalar(_lesson_detail_query(lesson_id))
    if not refreshed_lesson or not refreshed_lesson.video.chunks:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Lesson transcript could not be loaded.")
    return refreshed_lesson
