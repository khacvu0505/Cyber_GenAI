from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Proposal
from ..schemas import ProposalCreate


class ProposalRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, payload: ProposalCreate, user_id: UUID) -> Proposal:
        proposal = Proposal(user_id=user_id, **payload.model_dump(exclude={"auto_run"}))
        self.session.add(proposal)
        await self.session.commit()
        await self.session.refresh(proposal)
        return proposal

    async def get(self, proposal_id: UUID) -> Proposal | None:
        return await self.session.get(Proposal, proposal_id)

    async def get_for_user(self, proposal_id: UUID, user_id: UUID) -> Proposal | None:
        query = select(Proposal).where(
            Proposal.id == proposal_id, Proposal.user_id == user_id
        )
        return await self.session.scalar(query)

    async def list_recent(self, user_id: UUID, limit: int = 50) -> list[Proposal]:
        query = (
            select(Proposal)
            .where(Proposal.user_id == user_id)
            .order_by(Proposal.created_at.desc())
            .limit(limit)
        )
        return list((await self.session.scalars(query)).all())

    async def mark_running(self, proposal: Proposal) -> Proposal:
        proposal.status = "running"
        proposal.current_stage = "Crew đang phân tích và soạn proposal"
        proposal.error_message = None
        await self.session.commit()
        await self.session.refresh(proposal)
        return proposal

    async def mark_completed(
        self,
        proposal: Proposal,
        *,
        requirements_analysis: dict,
        solution_plan: dict,
        risk_review: dict,
        final_markdown: str,
    ) -> Proposal:
        proposal.status = "completed"
        proposal.current_stage = "Proposal đã sẵn sàng"
        proposal.requirements_analysis = requirements_analysis
        proposal.solution_plan = solution_plan
        proposal.risk_review = risk_review
        proposal.final_markdown = final_markdown
        proposal.error_message = None
        await self.session.commit()
        await self.session.refresh(proposal)
        return proposal

    async def mark_failed(self, proposal: Proposal, message: str) -> Proposal:
        proposal.status = "failed"
        proposal.current_stage = "Crew gặp lỗi"
        proposal.error_message = message[:4000]
        await self.session.commit()
        await self.session.refresh(proposal)
        return proposal
