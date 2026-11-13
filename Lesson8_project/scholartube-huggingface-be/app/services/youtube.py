from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from langchain_community.document_loaders import YoutubeLoader
from langchain_community.document_loaders.youtube import TranscriptFormat


@dataclass(slots=True)
class LoadedTranscript:
    source: str
    title: str | None
    channel: str | None
    duration_seconds: int | None
    language: str | None
    chunks: list[dict[str, Any]]


def normalize_youtube_url(url: str) -> str:
    cleaned = (url or "").strip()
    return re.sub(r"\s+", "", cleaned)


def load_transcript(
    youtube_url: str,
    *,
    add_video_info: bool,
    chunked: bool,
    chunk_size_seconds: int,
    preferred_languages: list[str] | None = None,
    translate_to: str | None = None,
) -> LoadedTranscript:
    url = normalize_youtube_url(youtube_url)
    languages = preferred_languages or ["vi", "en"]

    if chunked:
        loader = YoutubeLoader.from_youtube_url(
            url,
            add_video_info=add_video_info,
            language=languages,
            translation=translate_to,
            transcript_format=TranscriptFormat.CHUNKS,
            chunk_size_seconds=chunk_size_seconds,
        )

    else:
        loader = YoutubeLoader.from_youtube_url(
            url,
            add_video_info=add_video_info,
            language=languages,
            translation=translate_to,
        )

    docs = loader.load()

    if not docs:
        raise ValueError("No transcript found for this video.")

    # chunks
    chunks = list[dict[str, Any]]()

    for index, doc in enumerate(docs):
        metadata = dict(doc.metadata or {})
        start = metadata.get("start_seconds") or metadata.get("start")
        end = metadata.get("end_seconds") or metadata.get("end")

        chunks.append(
            {
                "chunk_index": index,
                "start_seconds": _as_float(start),
                "end_seconds": _as_float(end),
                "text": doc.page_content,
                "extra_metadata": metadata,
            }
        )

    first_metadata = dict(docs[0].metadata or {})
    return LoadedTranscript(
        source=url,
        title=first_metadata.get("title"),
        channel=first_metadata.get("author") or first_metadata.get("channel"),
        duration_seconds=_as_int(first_metadata.get("length"))
        or _as_int(first_metadata.get("duration")),
        language=first_metadata.get("language") or first_metadata.get("language_code"),
        chunks=chunks,
    )


def _as_float(value: Any) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _as_int(value: Any) -> int | None:
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None
