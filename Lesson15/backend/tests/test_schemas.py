import pytest
from pydantic import ValidationError

from app.schemas import ProposalCreate


def valid_payload() -> dict:
    return {
        "title": "CRM Transformation Proposal",
        "client_name": "Acme Retail",
        "company_name": "Nova Consulting",
        "client_brief": "Acme needs a unified CRM implementation for sales and support teams across three regions.",
        "service_description": "We provide discovery, solution design, implementation, migration, training, and support.",
    }


def test_proposal_create_normalizes_required_text() -> None:
    payload = valid_payload()
    payload["title"] = "  CRM Transformation Proposal  "
    assert ProposalCreate(**payload).title == "CRM Transformation Proposal"


def test_proposal_create_rejects_short_brief() -> None:
    payload = valid_payload()
    payload["client_brief"] = "Too short"
    with pytest.raises(ValidationError):
        ProposalCreate(**payload)
