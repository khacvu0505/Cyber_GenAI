from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="STEM Reasoning Lab", alias="APP_NAME")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    cors_origins_raw: str = Field(
        default="http://localhost:3001,http://127.0.0.1:3001",
        alias="BACKEND_CORS_ORIGINS",
    )

    hf_execution_mode: str = Field(default="inference", alias="HF_EXECUTION_MODE")
    hf_token: str | None = Field(default=None, alias="HF_TOKEN")
    hf_model_id: str = Field(
        default="Qwen/Qwen2.5-7B-Instruct",
        alias="HF_MODEL_ID",
    )
    hf_inference_provider: str = Field(default="auto", alias="HF_INFERENCE_PROVIDER")
    hf_max_new_tokens: int = Field(default=1400, ge=128, le=8192, alias="HF_MAX_NEW_TOKENS")
    hf_temperature: float = Field(default=0.35, ge=0.0, le=1.5, alias="HF_TEMPERATURE")
    hf_timeout_seconds: float = Field(default=120, gt=0, le=600, alias="HF_TIMEOUT_SECONDS")
    self_consistency_samples: int = Field(default=5, ge=3, le=9, alias="SELF_CONSISTENCY_SAMPLES")
    database_url: str = Field(default="sqlite:///./stemlab.db", alias="DATABASE_URL")
    secret_key: str = Field(default="development-only-secret-change-me-123", alias="SECRET_KEY")
    access_token_minutes: int = Field(default=15, ge=5, le=1440, alias="ACCESS_TOKEN_MINUTES")
    refresh_token_days: int = Field(default=14, ge=1, le=90, alias="REFRESH_TOKEN_DAYS")
    cookie_secure: bool = Field(default=False, alias="COOKIE_SECURE")

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins_raw.split(",") if item.strip()]

    @property
    def hf_configured(self) -> bool:
        if self.hf_execution_mode == "local":
            return True
        return bool(self.hf_token)


@lru_cache
def get_settings() -> Settings:
    return Settings()
