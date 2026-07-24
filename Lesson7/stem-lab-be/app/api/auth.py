from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import Settings, get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    token_digest,
    verify_password,
)
from app.db.session import get_db
from app.models import RefreshToken, User
from app.schemas.auth import AuthRead, LoginRequest, MessageRead, RegisterRequest, UserRead


router = APIRouter(prefix="/auth", tags=["auth"])
REFRESH_COOKIE = "stemlab_refresh"


def _issue_session(user: User, response: Response, db: Session, settings: Settings) -> AuthRead:
    raw_refresh = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days)
    db.add(RefreshToken(user_id=user.id, token_hash=token_digest(raw_refresh), expires_at=expires_at))
    db.commit()
    response.set_cookie(
        REFRESH_COOKIE,
        raw_refresh,
        max_age=settings.refresh_token_days * 86400,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/api/auth",
    )
    access_token, expires_in = create_access_token(user.id, settings)
    return AuthRead(access_token=access_token, expires_in=expires_in, user=UserRead.model_validate(user))


@router.post("/register", response_model=AuthRead, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthRead:
    email = payload.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email này đã được sử dụng.")
    if payload.role == "student" and payload.grade is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Học sinh cần chọn khối lớp.")
    user = User(
        email=email,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        grade=payload.grade if payload.role == "student" else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_session(user, response, db, settings)


@router.post("/login", response_model=AuthRead)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthRead:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email hoặc mật khẩu không đúng.")
    return _issue_session(user, response, db, settings)


@router.post("/refresh", response_model=AuthRead)
def refresh(
    response: Response,
    refresh_cookie: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthRead:
    if not refresh_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Không tìm thấy phiên đăng nhập.")
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_digest(refresh_cookie)))
    now = datetime.now(timezone.utc)
    stored_expiry = stored.expires_at if stored is not None else None
    if stored_expiry is not None and stored_expiry.tzinfo is None:
        stored_expiry = stored_expiry.replace(tzinfo=timezone.utc)
    if stored is None or stored.revoked_at is not None or stored_expiry is None or stored_expiry < now:
        response.delete_cookie(REFRESH_COOKIE, path="/api/auth")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập đã hết hạn.")
    user = db.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tài khoản không khả dụng.")
    stored.revoked_at = now
    db.commit()
    return _issue_session(user, response, db, settings)


@router.post("/logout", response_model=MessageRead)
def logout(
    response: Response,
    refresh_cookie: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    db: Session = Depends(get_db),
) -> MessageRead:
    if refresh_cookie:
        stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_digest(refresh_cookie)))
        if stored is not None and stored.revoked_at is None:
            stored.revoked_at = datetime.now(timezone.utc)
            db.commit()
    response.delete_cookie(REFRESH_COOKIE, path="/api/auth")
    return MessageRead(message="Đã đăng xuất.")


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(user)
