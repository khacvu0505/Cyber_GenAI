from __future__ import annotations

import unittest

from fastapi.testclient import TestClient

from app.main import app
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Problem
from app.services.problem_bank import PROBLEMS


class ApiContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.create_all(engine)
        with SessionLocal() as db:
            if db.get(Problem, PROBLEMS[0].id) is None:
                db.add_all(
                    [
                        Problem(
                            id=item.id,
                            subject=item.subject,
                            topic=item.topic,
                            grade=item.grade,
                            difficulty=item.difficulty,
                            title=item.title,
                            prompt=item.prompt,
                            skills=list(item.skills),
                            estimated_minutes=item.estimated_minutes,
                            expected_answer=item.expected_answer,
                            verification_method=item.verification_method,
                            explanation_anchor=item.explanation_anchor,
                        )
                        for item in PROBLEMS
                    ]
                )
                db.commit()

    def setUp(self) -> None:
        self.client = TestClient(app)
        email = "api-test@example.com"
        response = self.client.post(
            "/api/auth/register",
            json={"email": email, "name": "API Test", "password": "test-password-123", "grade": 10},
        )
        if response.status_code == 409:
            response = self.client.post("/api/auth/login", json={"email": email, "password": "test-password-123"})
        self.token = response.json()["access_token"]

    def test_health_exposes_huggingface_provider(self) -> None:
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["ai_provider"], "huggingface")
        self.assertIn("model_ready", payload)

    def test_problem_bank_hides_expected_answers(self) -> None:
        response = self.client.get(
            "/api/problems?subject=math",
            headers={"Authorization": f"Bearer {self.token}"},
        )
        self.assertEqual(response.status_code, 200)
        problems = response.json()
        self.assertGreaterEqual(len(problems), 2)
        self.assertNotIn("expected_answer", problems[0])

    def test_problems_require_authentication(self) -> None:
        response = self.client.get("/api/problems")
        self.assertEqual(response.status_code, 401)

    def test_refresh_rotates_session_cookie(self) -> None:
        response = self.client.post("/api/auth/refresh")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())


if __name__ == "__main__":
    unittest.main()
