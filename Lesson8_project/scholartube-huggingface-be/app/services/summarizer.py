from __future__ import annotations

import json
import re
from collections.abc import Iterable
from typing import Any

from app.core.config import Settings
from app.models.video import TranscriptChunk


class LLMNotConfiguredError(RuntimeError):
    pass


class LLMGenerationError(RuntimeError):
    pass


class HuggingFaceChatClient:
    """Small adapter around Hugging Face Inference Providers chat completion."""

    def __init__(self, *, settings: Settings, model: str, temperature: float) -> None:
        if not settings.hf_token:
            raise LLMNotConfiguredError("HF_TOKEN is not configured.")

        try:
            from huggingface_hub import InferenceClient
        except ImportError as exc:
            raise LLMNotConfiguredError(
                "huggingface-hub is not installed. Run: pip install -r requirements.txt"
            ) from exc

        self.model = model
        self.temperature = temperature
        self.max_tokens = settings.hf_max_tokens
        self.client = InferenceClient(
            model=model,
            provider=settings.hf_inference_provider,
            token=settings.hf_token,
            timeout=settings.hf_timeout_seconds,
        )

    def invoke(self, *, system: str, user: str, max_tokens: int | None = None) -> str:
        try:
            # Code here
            response = self.client.chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": system,
                    },
                    {
                        "role": "user",
                        "content": user,
                    },
                ],
                max_tokens=max_tokens or self.max_tokens,
                temperature=self.temperature,
            )
            content = response[0].message.content
        except Exception as exc:
            raise LLMGenerationError(f"Hugging Face inference failed: {exc}") from exc

        if not content or not content.strip():
            raise LLMGenerationError("Hugging Face returned an empty response.")
        return content.strip()


def summarize_transcript(
    *,
    settings: Settings,
    chunks: list[TranscriptChunk],
    language: str,
    detail_level: str,
    temperature: float,
    model_name: str | None,
) -> tuple[str, str]:
    usable_chunks = _usable_chunks(chunks)

    llm = HuggingFaceChatClient(
        settings=settings,
        model=model_name or settings.hf_model,
        temperature=temperature,
    )
    language_name = "Vietnamese" if language == "vi" else "English"

    chunk_summaries: list[str] = []
    for chunk in usable_chunks:
        time_range = _time_range(chunk)
        # Code by yourself
        summary = llm.invoke(
            system=(
                f"Bạn là người tổng hợp thông tin bằng tiếng {language_name}. Tổng hợp thông tin của script bên dưới. Ưu tiên ngắn gọn và đầy đủ thông tin"
                if language == "vi"
                else "You are a {language_name} summarizer. Summarize the transcript below. Prioritize concise and accurate information."
            ),
            user=f"{time_range}\n\n{chunk.transcript}",
        )

    reduced = _hierarchical_reduce(
        llm=llm,
        parts=chunk_summaries,
        batch_size=settings.hf_reduce_batch_size,
        language=language,
        purpose="summary",
    )
    final_instruction = (
        f"Tổng hợp các ghi chú nguồn bên dưới thành bản tóm tắt cuối cùng bằng {language_name}. "
        "Chỉ dùng thông tin có trong nguồn, tuyệt đối không thêm kiến thức ngoài. "
        "Giữ lại các mốc thời gian quan trọng và tuân thủ đúng định dạng đầu ra được yêu cầu."
        if language == "vi"
        else f"Synthesize the source notes below into a final {language_name} summary. "
        "Use only information present in the sources and add nothing beyond them. "
        "Preserve important timestamps and follow the requested output format exactly."
    )
    result = llm.invoke(
        system=(
            "Bạn là trợ lý tổng hợp cấp cao, ưu tiên tính chính xác, cấu trúc và giá trị học tập."
            if language == "vi"
            else "You are a senior synthesis assistant prioritizing accuracy, structure, and study value."
        ),
        user=f"{final_instruction}\n\n{_summary_format(language=language, detail_level=detail_level)}\n\nSOURCE NOTES:\n{reduced}",
    )
    return result, model


def generate_study_artifact(
    *,
    settings: Settings,
    chunks: list[TranscriptChunk],
    artifact_type: str,
    language: str,
    temperature: float,
    model_name: str | None,
) -> tuple[dict[str, Any], str]:
    """Generate artifacts from every transcript chunk using hierarchical map-reduce."""

    usable_chunks = _usable_chunks(chunks)
    llm = HuggingFaceChatClient(
        settings=settings,
        model=model_name or settings.hf_model,
        temperature=temperature,
    )
    language_name = "Vietnamese" if language == "vi" else "English"

    candidates: list[str] = []
    for chunk in usable_chunks:
        time_range = _time_range(chunk)
        # Code by yourself
        candidate = llm.invoke(
            system=(
                f"Bạn là người tạo học liệu từ script bên dưới. Tạo học liệu bằng tiếng {language_name}. "
                if language == "vi"
                else f"You are a {language_name} study material creator. Create study material from the transcript below."
            ),
            user=f"{time_range}\n\n{chunk.transcript}",
        )

    reduced = _hierarchical_reduce(
        llm=llm,
        parts=candidates,
        batch_size=settings.hf_reduce_batch_size,
        language=language,
        purpose=artifact_type,
    )
    raw = llm.invoke(
        system=(
            "Bạn tạo học liệu từ candidate đã được tổng hợp. Chỉ trả một JSON object hợp lệ, không markdown, "
            "không thêm kiến thức ngoài nguồn."
            if language == "vi"
            else "Create study material from the consolidated candidates. Return one valid JSON object only, "
            "without Markdown or information outside the source."
        ),
        user=(
            f"Ngôn ngữ đầu ra: {language_name}\nLoại: {artifact_type}\n"
            f"Yêu cầu cuối: {_final_artifact_instruction(artifact_type, language)}\n"
            f'JSON shape: {{"type":"{artifact_type}","items":[...]}}\n'
            "Loại bỏ nội dung trùng, bảo đảm bao phủ toàn bài và giữ source_chunk/source_time cho từng item."
            f"\n\nCONSOLIDATED CANDIDATES:\n{reduced}"
        ),
    )
    return _parse_json_object(raw, expected_type=artifact_type), model


def _hierarchical_reduce(
    *,
    llm: HuggingFaceChatClient,
    parts: list[str],
    batch_size: int,
    language: str,
    purpose: str,
) -> str:
    current = parts
    level = 1
    while len(current) > batch_size:
        next_level: list[str] = []
        for group_index, group in enumerate(_batched(current, batch_size), start=1):
            next_level.append(
                llm.invoke(
                    system=(
                        "Bạn hợp nhất ghi chú trung gian. Giữ dữ kiện, timestamp và độ bao phủ; loại bỏ trùng "
                        "lặp; không thêm thông tin mới."
                        if language == "vi"
                        else "Merge intermediate notes while preserving facts, timestamps, and coverage. "
                        "Remove duplicates and add no new information."
                    ),
                    user=(
                        f"Reduce level {level}, group {group_index}, purpose={purpose}.\n"
                        f"Retain source_chunk/source_time references.\n\n"
                        + "\n\n".join(group)
                    ),
                )
            )
        current = next_level
        level += 1
    return "\n\n".join(current)


def _usable_chunks(chunks: list[TranscriptChunk]) -> list[TranscriptChunk]:
    usable = [chunk for chunk in chunks if chunk.text and chunk.text.strip()]
    if not usable:
        raise LLMGenerationError("Transcript has no non-empty chunks.")
    return usable


def _batched(items: list[str], size: int) -> Iterable[list[str]]:
    for start in range(0, len(items), size):
        yield items[start : start + size]


def _time_range(chunk: TranscriptChunk) -> str:
    start = _format_seconds(chunk.start_seconds)
    end = _format_seconds(chunk.end_seconds)
    return f"{start}-{end}" if end else start


def _format_seconds(value: float | None) -> str:
    if value is None:
        return "unknown"
    seconds = max(0, int(value))
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return (
        f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        if hours
        else f"{minutes:02d}:{seconds:02d}"
    )


def _map_artifact_instruction(artifact_type: str, language: str) -> str:
    instructions = {
        "key_concepts": (
            "Trích xuất tối đa 5 khái niệm quan trọng với giải thích và ý nghĩa."
            if language == "vi"
            else "Extract up to 5 important concepts with explanation and significance."
        ),
        "flashcards": (
            "Đề xuất tối đa 5 flashcard hỏi-đáp có thể kiểm chứng từ chunk."
            if language == "vi"
            else "Propose up to 5 question-answer flashcards verifiable from the chunk."
        ),
        "quiz": (
            "Đề xuất tối đa 4 câu hỏi trắc nghiệm kèm đáp án và giải thích."
            if language == "vi"
            else "Propose up to 4 multiple-choice questions with answers and explanations."
        ),
        "outline": (
            "Trích xuất các chủ đề và luận điểm để xây dựng dàn ý."
            if language == "vi"
            else "Extract topics and arguments for a study outline."
        ),
    }
    return instructions[artifact_type]


def _final_artifact_instruction(artifact_type: str, language: str) -> str:
    instructions = {
        "key_concepts": (
            "Tạo 10-15 items có term, explanation, why_it_matters, source_chunk, source_time."
            if language == "vi"
            else "Create 10-15 items with term, explanation, why_it_matters, source_chunk, source_time."
        ),
        "flashcards": (
            "Tạo 12 items có front, back, source_hint, source_chunk, source_time."
            if language == "vi"
            else "Create 12 items with front, back, source_hint, source_chunk, source_time."
        ),
        "quiz": (
            "Tạo 10 items có question, choices, answer, explanation, source_chunk, source_time."
            if language == "vi"
            else "Create 10 items with question, choices, answer, explanation, source_chunk, source_time."
        ),
        "outline": (
            "Tạo các section có title, bullets, source_chunk và source_time."
            if language == "vi"
            else "Create sections with title, bullets, source_chunk, and source_time."
        ),
    }
    return instructions[artifact_type]


def _summary_format(*, language: str, detail_level: str) -> str:
    if language == "en":
        formats = {
            "brief": "Output:\n1. TL;DR (2-3 sentences)\n2. 5 key points\n3. One study takeaway",
            "standard": "Output:\n1. TL;DR (3-4 sentences)\n2. Main points (8-12 bullets)\n3. Key terms\n4. Study questions",
            "deep": "Output:\n1. Executive summary\n2. Structured outline\n3. Key terms and concepts\n4. Timeline if available\n5. Open study questions",
        }
    else:
        formats = {
            "brief": "Đầu ra:\n1. TL;DR (2-3 câu)\n2. 5 ý chính\n3. Một takeaway học tập",
            "standard": "Đầu ra:\n1. TL;DR (3-4 câu)\n2. Ý chính (8-12 bullet)\n3. Thuật ngữ quan trọng\n4. Câu hỏi ôn tập",
            "deep": "Đầu ra:\n1. Tóm tắt điều hành\n2. Dàn ý có cấu trúc\n3. Thuật ngữ/khái niệm chính\n4. Timeline nếu có\n5. Câu hỏi học sâu",
        }
    return formats[detail_level]


def _parse_json_object(raw: str, *, expected_type: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
        if not match:
            raise LLMGenerationError(
                "Hugging Face did not return a valid JSON artifact."
            )
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise LLMGenerationError(
                "Hugging Face did not return a valid JSON artifact."
            ) from exc

    if not isinstance(parsed, dict):
        raise LLMGenerationError(
            "Hugging Face artifact response must be a JSON object."
        )
    parsed.setdefault("type", expected_type)
    parsed.setdefault("items", [])
    if not isinstance(parsed["items"], list):
        raise LLMGenerationError(
            "Hugging Face artifact response must contain an items array."
        )
    return parsed
