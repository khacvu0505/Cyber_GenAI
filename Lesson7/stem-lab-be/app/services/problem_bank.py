from __future__ import annotations

from dataclasses import dataclass

from app.schemas.reasoning import Difficulty, ProblemRead, Subject
from app.models import Problem


@dataclass(frozen=True, slots=True)
class ProblemRecord:
    id: str
    subject: Subject
    topic: str
    grade: int
    difficulty: Difficulty
    title: str
    prompt: str
    skills: tuple[str, ...]
    estimated_minutes: int
    expected_answer: str
    verification_method: str
    explanation_anchor: str

    def public(self) -> ProblemRead:
        return ProblemRead(
            id=self.id,
            subject=self.subject,
            topic=self.topic,
            grade=self.grade,
            difficulty=self.difficulty,
            title=self.title,
            prompt=self.prompt,
            skills=list(self.skills),
            estimated_minutes=self.estimated_minutes,
        )

    @classmethod
    def from_model(cls, problem: Problem) -> "ProblemRecord":
        return cls(
            id=problem.id,
            subject=problem.subject,  # type: ignore[arg-type]
            topic=problem.topic,
            grade=problem.grade,
            difficulty=problem.difficulty,  # type: ignore[arg-type]
            title=problem.title,
            prompt=problem.prompt,
            skills=tuple(problem.skills),
            estimated_minutes=problem.estimated_minutes,
            expected_answer=problem.expected_answer,
            verification_method=problem.verification_method,
            explanation_anchor=problem.explanation_anchor,
        )


PROBLEMS: tuple[ProblemRecord, ...] = (
    ProblemRecord(
        id="math-cube-001",
        subject="math",
        topic="Số học",
        grade=8,
        difficulty="intermediate",
        title="Lập phương và ba số liên tiếp",
        prompt="Số lập phương dương nhỏ nhất có thể viết thành tổng của ba số nguyên dương liên tiếp là số nào?",
        skills=("biểu diễn đại số", "tính chia hết", "số lập phương"),
        estimated_minutes=8,
        expected_answer="27",
        verification_method="numeric",
        explanation_anchor="27 = 8 + 9 + 10 và 27 = 3³.",
    ),
    ProblemRecord(
        id="math-sequence-002",
        subject="math",
        topic="Cấp số cộng",
        grade=11,
        difficulty="foundation",
        title="Tổng cấp số cộng",
        prompt="Một cấp số cộng có số hạng đầu bằng 3, công sai bằng 4. Tổng 10 số hạng đầu bằng bao nhiêu?",
        skills=("cấp số cộng", "công thức tổng", "thay số"),
        estimated_minutes=6,
        expected_answer="210",
        verification_method="numeric",
        explanation_anchor="S₁₀ = 10/2 × [2×3 + 9×4] = 210.",
    ),
    ProblemRecord(
        id="physics-force-001",
        subject="physics",
        topic="Định luật Newton",
        grade=10,
        difficulty="foundation",
        title="Gia tốc của vật",
        prompt="Một lực không đổi 12 N tác dụng lên vật có khối lượng 6 kg trên mặt phẳng không ma sát. Gia tốc của vật bằng bao nhiêu?",
        skills=("định luật II Newton", "đơn vị SI", "biến đổi công thức"),
        estimated_minutes=5,
        expected_answer="2",
        verification_method="numeric",
        explanation_anchor="a = F/m = 12/6 = 2 m/s².",
    ),
    ProblemRecord(
        id="physics-energy-002",
        subject="physics",
        topic="Cơ năng",
        grade=10,
        difficulty="intermediate",
        title="Động năng",
        prompt="Một vật có khối lượng 2 kg chuyển động với vận tốc 10 m/s. Động năng của vật bằng bao nhiêu joule?",
        skills=("động năng", "lũy thừa", "đơn vị joule"),
        estimated_minutes=6,
        expected_answer="100",
        verification_method="numeric",
        explanation_anchor="Wđ = 1/2 × 2 × 10² = 100 J.",
    ),
    ProblemRecord(
        id="chemistry-mole-001",
        subject="chemistry",
        topic="Mol",
        grade=10,
        difficulty="foundation",
        title="Số mol của nước",
        prompt="Có 9 gam nước H₂O. Biết khối lượng mol của H₂O là 18 g/mol. Mẫu nước này có bao nhiêu mol?",
        skills=("khái niệm mol", "khối lượng mol", "chia đại lượng"),
        estimated_minutes=5,
        expected_answer="0.5",
        verification_method="numeric",
        explanation_anchor="n = m/M = 9/18 = 0,5 mol.",
    ),
    ProblemRecord(
        id="chemistry-balance-002",
        subject="chemistry",
        topic="Phương trình hóa học",
        grade=8,
        difficulty="intermediate",
        title="Cân bằng phản ứng tạo nước",
        prompt="Cân bằng phương trình hóa học: H₂ + O₂ → H₂O.",
        skills=("bảo toàn nguyên tố", "hệ số phản ứng", "phương trình hóa học"),
        estimated_minutes=7,
        expected_answer="2H2+O2->2H2O",
        verification_method="chemical_equation",
        explanation_anchor="Đặt hệ số 2 trước H₂ và H₂O: 2H₂ + O₂ → 2H₂O.",
    ),
)

PROBLEM_BY_ID = {problem.id: problem for problem in PROBLEMS}


def list_problems(subject: Subject | None = None) -> list[ProblemRead]:
    items = PROBLEMS if subject is None else tuple(item for item in PROBLEMS if item.subject == subject)
    return [item.public() for item in items]


def get_problem(problem_id: str | None) -> ProblemRecord | None:
    if not problem_id:
        return None
    return PROBLEM_BY_ID.get(problem_id)
