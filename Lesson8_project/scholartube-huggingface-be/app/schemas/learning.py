from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.video import StudyArtifactRead, SummaryRead


Role = Literal["student", "instructor", "admin"]


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    avatar_url: str | None = None


class AuthRegisterCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["student", "instructor"] = "student"


class AuthLoginCreate(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class AuthTokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class InstructorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    role: str
    avatar_url: str | None = None


class EnrollmentCreate(BaseModel):
    user_id: str
    course_id: str


class EnrollmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    course_id: str
    status: str
    progress_percent: float
    enrolled_at: datetime


class ProgressUpdate(BaseModel):
    user_id: str
    lesson_id: str
    progress_percent: float = Field(default=100, ge=0, le=100)
    completed: bool = True


class ProgressRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    lesson_id: str
    status: str
    progress_percent: float
    completed_at: datetime | None = None
    updated_at: datetime
    course_progress_percent: float = 0


class LessonRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    video_id: str
    title: str
    description: str
    position: int
    duration_minutes: int
    is_preview: bool
    youtube_url: str


class SectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    position: int
    lessons: list[LessonRead] = Field(default_factory=list)


class CourseListRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    slug: str
    subtitle: str
    category: str
    level: str
    language: str
    price: float
    rating: float
    rating_count: int
    students_count: int
    duration_minutes: int
    thumbnail_url: str
    instructor: InstructorRead
    section_count: int = 0
    lesson_count: int = 0
    enrolled: bool = False
    progress_percent: float = 0


class CourseDetailRead(CourseListRead):
    description: str
    sections: list[SectionRead] = Field(default_factory=list)


class LessonSummaryCreate(BaseModel):
    language: Literal["vi", "en"] = "vi"
    detail_level: Literal["brief", "standard", "deep"] = "standard"
    temperature: float = Field(default=0.2, ge=0, le=1)
    model_name: str | None = None
    chunk_size_seconds: int = Field(default=120, ge=15, le=600)
    preferred_languages: list[Literal["vi", "en"]] = Field(default_factory=lambda: ["vi", "en"], min_length=1, max_length=5)
    translate_to: Literal["vi", "en"] | None = None


class LessonArtifactCreate(BaseModel):
    artifact_type: Literal["key_concepts", "flashcards"] = "key_concepts"
    language: Literal["vi", "en"] = "vi"
    temperature: float = Field(default=0.2, ge=0, le=1)
    model_name: str | None = None
    chunk_size_seconds: int = Field(default=120, ge=15, le=600)
    preferred_languages: list[Literal["vi", "en"]] = Field(default_factory=lambda: ["vi", "en"], min_length=1, max_length=5)
    translate_to: Literal["vi", "en"] | None = None


class LessonStudyStateRead(BaseModel):
    lesson_id: str
    summary: SummaryRead | None = None
    key_concepts: StudyArtifactRead | None = None
    flashcards: StudyArtifactRead | None = None
