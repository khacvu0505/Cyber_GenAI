from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...config import settings
from ...database import get_session
from ...models import User
from ...repositories.proposals import ProposalRepository
from ...schemas import ProposalCreate, ProposalRead, ProposalSummary
from ...services.proposal_jobs import run_proposal_job
from ..dependencies import get_current_user

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.post("", response_model=ProposalRead, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    payload: ProposalCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ProposalRead:
    proposal = await ProposalRepository(session).create(payload, current_user.id)
    if payload.auto_run:
        background_tasks.add_task(run_proposal_job, proposal.id)
    return ProposalRead.model_validate(proposal)


@router.get("", response_model=list[ProposalSummary])
async def list_proposals(
    limit: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[ProposalSummary]:
    proposals = await ProposalRepository(session).list_recent(
        current_user.id, min(limit, settings.max_recent_proposals)
    )
    return [ProposalSummary.model_validate(item) for item in proposals]


@router.get("/{proposal_id}", response_model=ProposalRead)
async def get_proposal(
    proposal_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ProposalRead:
    proposal = await ProposalRepository(session).get_for_user(proposal_id, current_user.id)
    if proposal is None:
        raise HTTPException(status_code=404, detail="Proposal không tồn tại.")
    return ProposalRead.model_validate(proposal)


@router.post("/{proposal_id}/run", response_model=ProposalRead, status_code=status.HTTP_202_ACCEPTED)
async def retry_proposal(
    proposal_id: UUID,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ProposalRead:
    proposal = await ProposalRepository(session).get_for_user(proposal_id, current_user.id)
    if proposal is None:
        raise HTTPException(status_code=404, detail="Proposal không tồn tại.")
    if proposal.status in {"queued", "running"}:
        raise HTTPException(status_code=409, detail="Proposal đang được xử lý.")
    proposal.status = "queued"
    proposal.current_stage = "Đang chờ chạy lại"
    proposal.error_message = None
    await session.commit()
    await session.refresh(proposal)
    background_tasks.add_task(run_proposal_job, proposal.id)
    return ProposalRead.model_validate(proposal)
