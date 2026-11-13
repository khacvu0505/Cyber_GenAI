from .schemas import User


def decide(user: User, document: dict) -> tuple[bool, str]:
    if document["tenant_id"] != user.tenant_id:
        return False, "TENANT_MISMATCH"
    if "tenant_admin" in user.roles:
        return True, "TENANT_ADMIN"
    if document["classification"] == "public":
        return True, "PUBLIC_SAME_TENANT"
    if document["classification"] == "internal":
        return (True, "SAME_DEPARTMENT") if document["department"] == user.department else (False, "DEPARTMENT_MISMATCH")
    if user.user_id in document.get("allowed_users", []):
        return True, "EXPLICIT_USER_GRANT"
    if set(user.roles).intersection(document.get("allowed_roles", [])):
        return True, "ROLE_MATCH"
    return False, "INSUFFICIENT_ROLE"
