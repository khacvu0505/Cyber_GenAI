from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException

from .catalog import USERS
from .config import JWT_ALGORITHM, JWT_SECRET
from .schemas import User


def encode_token(user: User) -> str:
    return jwt.encode({"sub": user.user_id, "exp": datetime.now(UTC) + timedelta(hours=2)}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def authenticated_user(token: str) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return USERS[payload["sub"]]
    except (jwt.PyJWTError, KeyError) as error:
        raise HTTPException(401, "Token không hợp lệ hoặc đã hết hạn") from error
