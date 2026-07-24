from __future__ import annotations

import math
import re
from dataclasses import dataclass

from app.services.problem_bank import ProblemRecord


@dataclass(frozen=True, slots=True)
class VerificationResult:
    status: str
    passed: bool | None
    method: str
    message: str


def verify_answer(answer: str, problem: ProblemRecord | None) -> VerificationResult:
    if problem is None:
        return VerificationResult(
            status="consensus_only",
            passed=None,
            method="self-consistency",
            message="Bài tự nhập chưa có đáp án chuẩn; kết quả chỉ được kiểm tra bằng độ đồng thuận giữa các mẫu.",
        )

    if problem.verification_method == "numeric":
        expected = _first_number(problem.expected_answer)
        actual = _first_number(answer)
        passed = expected is not None and actual is not None and math.isclose(actual, expected, rel_tol=1e-6, abs_tol=1e-6)
    elif problem.verification_method == "chemical_equation":
        passed = _normalize_equation(answer) == _normalize_equation(problem.expected_answer)
    else:
        passed = _normalize_text(answer) == _normalize_text(problem.expected_answer)

    return VerificationResult(
        status="verified" if passed else "rejected",
        passed=passed,
        method=problem.verification_method,
        message=(
            f"Đáp án đã vượt qua bộ kiểm chứng. {problem.explanation_anchor}"
            if passed
            else "Đáp án chưa khớp với điều kiện hoặc đáp án chuẩn của bài. Hệ thống sẽ ưu tiên một lời giải khác."
        ),
    )


def normalize_for_vote(answer: str) -> str:
    number = _first_number(answer)
    if number is not None:
        return f"{number:.10g}"
    return _normalize_equation(answer)


def _first_number(value: str) -> float | None:
    normalized = value.replace(",", ".")
    match = re.search(r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)", normalized)
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def _normalize_equation(value: str) -> str:
    normalized = (
        value.lower()
        .replace("₂", "2")
        .replace("₃", "3")
        .replace("→", "->")
        .replace("=", "->")
    )
    normalized = re.sub(r"answer\s*:", "", normalized)
    return re.sub(r"[^a-z0-9+>\\-]", "", normalized)


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", "", value.strip().lower())
