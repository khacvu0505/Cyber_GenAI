from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services.youtube import load_transcript


class YoutubeTranscriptLanguageTests(unittest.TestCase):
    @patch("app.services.youtube.YoutubeLoader.from_youtube_url")
    def test_language_priority_and_translation_are_forwarded(self, from_url: MagicMock) -> None:
        loader = MagicMock()
        loader.load.return_value = [
            SimpleNamespace(
                page_content="Xin chào",
                metadata={"start_seconds": 0, "end_seconds": 120, "language_code": "en"},
            )
        ]
        from_url.return_value = loader

        transcript = load_transcript(
            "https://youtu.be/example",
            add_video_info=False,
            chunked=True,
            chunk_size_seconds=120,
            preferred_languages=["vi", "en"],
            translate_to="vi",
        )

        kwargs = from_url.call_args.kwargs
        self.assertEqual(kwargs["language"], ["vi", "en"])
        self.assertEqual(kwargs["translation"], "vi")
        self.assertEqual(transcript.language, "vi")


if __name__ == "__main__":
    unittest.main()
