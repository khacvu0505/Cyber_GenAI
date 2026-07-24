from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


Role = Literal["student", "teacher", "admin"]


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["student", "teacher"] = "student"
    grade: int | None = Field(default=None, ge=6, le=12)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    name: str
    role: Role
    grade: int | None
    created_at: datetime


class AuthRead(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    user: UserRead


class MessageRead(BaseModel):
    message: str
