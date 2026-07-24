"""Create authentication and learning schema, then seed the problem bank."""
from __future__ import annotations

from alembic import op

from app.db.base import Base
from app.services.problem_bank import PROBLEMS


revision = "20260724_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)
    problem_table = Base.metadata.tables["problems"]
    op.bulk_insert(
        problem_table,
        [
            {
                "id": item.id,
                "subject": item.subject,
                "topic": item.topic,
                "grade": item.grade,
                "difficulty": item.difficulty,
                "title": item.title,
                "prompt": item.prompt,
                "skills": list(item.skills),
                "estimated_minutes": item.estimated_minutes,
                "expected_answer": item.expected_answer,
                "verification_method": item.verification_method,
                "explanation_anchor": item.explanation_anchor,
                "is_active": True,
            }
            for item in PROBLEMS
        ],
    )


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
