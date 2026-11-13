import asyncio
from uuid import UUID

from ..database import SessionFactory
from ..repositories.proposals import ProposalRepository
from ..schemas import ProposalCreate
from .proposal_crew import generate_proposal


async def run_proposal_job(proposal_id: UUID) -> None:
    async with SessionFactory() as session:
        repository = ProposalRepository(session)
        proposal = await repository.get(proposal_id)
        if proposal is None:
            return
        await repository.mark_running(proposal)
        payload = ProposalCreate(
            title=proposal.title,
            client_name=proposal.client_name,
            company_name=proposal.company_name,
            client_brief=proposal.client_brief,
            service_description=proposal.service_description,
            budget=proposal.budget,
            timeline=proposal.timeline,
            constraints=proposal.constraints,
            language=proposal.language,
            auto_run=False,
        )
        try:
            result = await asyncio.to_thread(generate_proposal, payload)
            await repository.mark_completed(
                proposal,
                requirements_analysis=result.requirements_analysis.model_dump(),
                solution_plan=result.solution_plan.model_dump(),
                risk_review=result.risk_review.model_dump(),
                final_markdown=result.final_markdown,
            )
        except Exception as exc:
            await repository.mark_failed(proposal, str(exc))
