from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


Language = Literal["vi", "en"]
DetailLevel = Literal["brief", "standard", "deep"]
ArtifactType = Literal["key_concepts", "flashcards", "quiz", "outline"]


class HealthRead(BaseModel):
    status: str
    app_name: str
    environment: str
    database: str
    ai_provider: str
    hf_configured: bool
    hf_model: str
    hf_inference_provider: str


class TranscriptLoadCreate(BaseModel):
    youtube_url: str = Field(min_length=8, max_length=1024)
    add_video_info: bool = False
    chunked: bool = True
    chunk_size_seconds: int = Field(default=120, ge=15, le=600)
    preferred_languages: list[Language] = Field(default_factory=lambda: ["vi", "en"], min_length=1, max_length=5)
    translate_to: Language | None = None


class SummaryCreate(BaseModel):
    video_id: str | None = None
    youtube_url: str | None = Field(default=None, max_length=1024)
    language: Language = "vi"
    detail_level: DetailLevel = "standard"
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)
    model_name: str | None = None
    chunk_size_seconds: int = Field(default=120, ge=15, le=600)
    preferred_languages: list[Language] = Field(default_factory=lambda: ["vi", "en"], min_length=1, max_length=5)
    translate_to: Language | None = None


class StudyArtifactCreate(BaseModel):
    video_id: str | None = None
    youtube_url: str | None = Field(default=None, max_length=1024)
    artifact_type: ArtifactType = "flashcards"
    language: Language = "vi"
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)
    model_name: str | None = None
    chunk_size_seconds: int = Field(default=120, ge=15, le=600)
    preferred_languages: list[Language] = Field(default_factory=lambda: ["vi", "en"], min_length=1, max_length=5)
    translate_to: Language | None = None


class TranscriptChunkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chunk_index: int
    start_seconds: float | None = None
    end_seconds: float | None = None
    text: str
    extra_metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class SummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    video_id: str
    language: str
    detail_level: str
    content: str
    model_name: str
    created_at: datetime


class StudyArtifactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    video_id: str
    artifact_type: str
    language: str
    content: dict[str, Any]
    model_name: str
    created_at: datetime


class VideoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_url: str
    title: str | None = None
    channel: str | None = None
    duration_seconds: int | None = None
    language: str | None = None
    transcript_status: str
    created_at: datetime
    updated_at: datetime


class VideoDetailRead(VideoRead):
    chunks: list[TranscriptChunkRead] = Field(default_factory=list)
    summaries: list[SummaryRead] = Field(default_factory=list)
    study_artifacts: list[StudyArtifactRead] = Field(default_factory=list)
