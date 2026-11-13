from __future__ import annotations

import unittest
from unittest.mock import patch

from app.core.config import Settings
from app.models.video import TranscriptChunk
from app.services.summarizer import generate_study_artifact


class FakeHuggingFaceClient:
    calls: list[dict[str, str]] = []

    def __init__(self, **_: object) -> None:
        pass

    def invoke(self, *, system: str, user: str, max_tokens: int | None = None) -> str:
        self.calls.append({"system": system, "user": user})
        if "JSON object" in system:
            return '{"type":"flashcards","items":[{"front":"Q","back":"A","source_chunk":25,"source_time":"48:00-50:00"}]}'
        return f"candidate-{len(self.calls)}"


class StudyArtifactMapReduceTests(unittest.TestCase):
    def setUp(self) -> None:
        FakeHuggingFaceClient.calls = []

    def test_every_transcript_chunk_is_mapped(self) -> None:
        chunks = [
            TranscriptChunk(
                chunk_index=index,
                start_seconds=index * 120,
                end_seconds=(index + 1) * 120,
                text=f"Transcript content {index + 1}",
                extra_metadata={},
            )
            for index in range(25)
        ]
        settings = Settings(
            _env_file=None,
            HF_TOKEN="test-token",
            HF_REDUCE_BATCH_SIZE=4,
        )

        with patch("app.services.summarizer.HuggingFaceChatClient", FakeHuggingFaceClient):
            artifact, model = generate_study_artifact(
                settings=settings,
                chunks=chunks,
                artifact_type="flashcards",
                language="en",
                temperature=0.1,
                model_name=None,
            )

        mapped_prompts = [call["user"] for call in FakeHuggingFaceClient.calls if "TRANSCRIPT:" in call["user"]]
        self.assertEqual(len(mapped_prompts), 25)
        self.assertTrue(any("Chunk: 25" in prompt for prompt in mapped_prompts))
        self.assertEqual(artifact["type"], "flashcards")
        self.assertEqual(model, settings.hf_model)


if __name__ == "__main__":
    unittest.main()
