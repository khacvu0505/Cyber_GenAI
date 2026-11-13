from app.catalog import DOCUMENTS, USERS
from app.policy import decide


def doc(document_id: str):
    return next(item for item in DOCUMENTS if item["document_id"] == document_id)


def test_cross_tenant_is_denied():
    allowed, reason = decide(USERS["hoa.orion.finance"], doc("nova_finance_bonus_plan"))
    assert not allowed and reason == "TENANT_MISMATCH"


def test_finance_manager_can_read_bonus_plan():
    allowed, reason = decide(USERS["mai.finance.manager"], doc("nova_finance_bonus_plan"))
    assert allowed and reason == "ROLE_MATCH"


def test_employee_cannot_read_confidential_bonus_plan():
    allowed, reason = decide(USERS["an.finance"], doc("nova_finance_bonus_plan"))
    assert not allowed and reason == "INSUFFICIENT_ROLE"
