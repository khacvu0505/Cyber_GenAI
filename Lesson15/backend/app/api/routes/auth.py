from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_session
from ...models import User
from ...repositories.users import UserRepository
from ...schemas import TokenResponse, UserLogin, UserRead, UserRegister
from ...security import create_access_token, hash_password, verify_password
from ..dependencies import get_current_user


router = APIRouter(prefix="/auth", tags=["authentication"])


def token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=UserRead.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegister, session: AsyncSession = Depends(get_session)
) -> TokenResponse:
    repository = UserRepository(session)
    if await repository.get_by_email(payload.email):
        raise HTTPException(status_code=409, detail="Email này đã được đăng ký.")
    try:
        user = await repository.create(
            email=payload.email,
            full_name=payload.full_name,
            password_hash=hash_password(payload.password),
        )
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Email này đã được đăng ký.") from None
    return token_response(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLogin, session: AsyncSession = Depends(get_session)
) -> TokenResponse:
    user = await UserRepository(session).get_by_email(payload.email.strip().lower())
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác.")
    return token_response(user)


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)
