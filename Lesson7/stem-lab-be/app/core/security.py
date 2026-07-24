from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import Settings


password_hash = PasswordHash.recommended()
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_access_token(user_id: str, settings: Settings) -> tuple[str, int]:
    seconds = settings.access_token_minutes * 60
    now = datetime.now(timezone.utc)
    payload = {"sub": user_id, "type": "access", "iat": now, "exp": now + timedelta(seconds=seconds)}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM), seconds


def decode_access_token(token: str, settings: Settings) -> str:
    payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    if payload.get("type") != "access" or not payload.get("sub"):
        raise jwt.InvalidTokenError("Invalid token type.")
    return str(payload["sub"])


def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
