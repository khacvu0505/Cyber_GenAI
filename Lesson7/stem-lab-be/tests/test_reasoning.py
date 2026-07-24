from __future__ import annotations

import json
import unittest

from app.core.config import Settings
from app.schemas.reasoning import ReasoningRequest
from app.services.problem_bank import get_problem
from app.services.reasoning import solve_problem
from app.services.verifier import verify_answer


def candidate(answer: str, confidence: float = 0.7) -> str:
    return json.dumps(
        {
            "concepts": ["số lập phương", "ba số liên tiếp"],
            "solution_steps": [
                {
                    "title": "Biểu diễn",
                    "explanation": "Gọi ba số liên tiếp là n-1, n, n+1.",
                    "checkpoint": "Tổng của chúng bằng bao nhiêu?",
                }
            ],
            "hints": ["Hãy biểu diễn bằng số ở giữa."],
            "final_answer": answer,
            "misconception": "Không nhầm số chính phương với số lập phương.",
            "follow_up_questions": ["Nếu là năm số liên tiếp thì sao?"],
            "confidence": confidence,
        },
        ensure_ascii=False,
    )


class FakeEngine:
    def __init__(self, outputs: list[str]) -> None:
        self.outputs = iter(outputs)
        self.calls: list[dict[str, object]] = []

    def generate(
        self,
        messages: list[dict[str, str]],
        *,
        do_sample: bool,
        seed: int,
    ) -> str:
        self.calls.append({"messages": messages, "do_sample": do_sample, "seed": seed})
        return next(self.outputs)


class ReasoningPipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = Settings(_env_file=None, HF_TOKEN="test-token")

    def test_self_consistency_prefers_verified_candidate(self) -> None:
        engine = FakeEngine([candidate("9"), candidate("27", 0.82), candidate("9")])
        response = solve_problem(
            request=ReasoningRequest(
                problem_id="math-cube-001",
                mode="self_consistency",
                samples=3,
                student_answer="9",
            ),
            settings=self.settings,
            engine=engine,  # type: ignore[arg-type]
            record=get_problem("math-cube-001"),
        )

        self.assertEqual(len(engine.calls), 3)
        self.assertTrue(all(call["do_sample"] is True for call in engine.calls))
        self.assertEqual(response.final_answer, "27")
        self.assertTrue(response.verification.passed)
        self.assertIn("chưa đúng", response.student_feedback)

    def test_guided_mode_uses_one_deterministic_sample(self) -> None:
        engine = FakeEngine([candidate("2")])
        response = solve_problem(
            request=ReasoningRequest(problem_id="physics-force-001", mode="guided"),
            settings=self.settings,
            engine=engine,  # type: ignore[arg-type]
            record=get_problem("physics-force-001"),
        )

        self.assertEqual(len(engine.calls), 1)
        self.assertFalse(engine.calls[0]["do_sample"])
        self.assertEqual(response.final_answer, "2")
        self.assertTrue(response.verification.passed)


class VerifierTests(unittest.TestCase):
    def test_chemical_equation_accepts_unicode_subscripts(self) -> None:
        problem = get_problem("chemistry-balance-002")
        result = verify_answer("2H₂ + O₂ → 2H₂O", problem)
        self.assertTrue(result.passed)


if __name__ == "__main__":
    unittest.main()
