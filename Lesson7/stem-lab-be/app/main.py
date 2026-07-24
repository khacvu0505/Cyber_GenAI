from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.api.auth import router as auth_router
from app.core.config import get_settings


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Hugging Face-powered STEM reasoning tutor with self-consistency and verification.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")
app.include_router(auth_router, prefix="/api")
