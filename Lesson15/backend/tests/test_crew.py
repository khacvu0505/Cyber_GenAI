import os
from pathlib import Path
from unittest.mock import patch

os.environ.setdefault("CREWAI_STORAGE_DIR", str(Path(__file__).resolve().parents[1] / ".crewai"))
os.environ.setdefault("CREWAI_DISABLE_TELEMETRY", "true")

from crewai import LLM

from app.schemas import ProposalCreate
from app.services.proposal_crew import build_proposal_crew


def test_builds_four_agent_sequential_crew() -> None:
    payload = ProposalCreate(
        title="CRM Transformation Proposal",
        client_name="Acme Retail",
        company_name="Nova Consulting",
        client_brief="Acme needs a unified CRM implementation for sales and support teams across three regions.",
        service_description="We provide discovery, solution design, implementation, migration, training, and support.",
    )
    fake_llm = LLM(model="openai/gpt-4o-mini", api_key="sk-test-key")
    with patch("app.services.proposal_crew.create_openai_llm", return_value=fake_llm):
        crew = build_proposal_crew(payload)
    assert len(crew.agents) == 4
    assert len(crew.tasks) == 4
    assert crew.tasks[1].context == [crew.tasks[0]]
    assert crew.tasks[3].context == crew.tasks[:3]
