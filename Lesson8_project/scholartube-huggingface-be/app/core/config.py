from __future__ import annotations

from functools import lru_cache
from typing import Any
from urllib.parse import quote_plus

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="ScholarTube Edu — Hugging Face", alias="APP_NAME")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    backend_cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="BACKEND_CORS_ORIGINS",
    )
    secret_key: str = Field(default="dev-scholar-tube-edu-change-me", alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=10080, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    hf_token: str | None = Field(default=None, alias="HF_TOKEN")
    hf_model: str = Field(default="Qwen/Qwen2.5-7B-Instruct", alias="HF_MODEL")
    hf_inference_provider: str = Field(default="auto", alias="HF_INFERENCE_PROVIDER")
    hf_max_tokens: int = Field(default=1200, ge=128, le=8192, alias="HF_MAX_TOKENS")
    hf_timeout_seconds: float = Field(default=120, gt=0, le=600, alias="HF_TIMEOUT_SECONDS")
    hf_reduce_batch_size: int = Field(default=8, ge=2, le=20, alias="HF_REDUCE_BATCH_SIZE")

    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    db_host: str | None = Field(default=None, alias="DB_HOST")
    db_port: int = Field(default=5432, alias="DB_PORT")
    db_user: str | None = Field(default=None, alias="DB_USER")
    db_password: str | None = Field(default=None, alias="DB_PASSWORD")
    db_database: str | None = Field(default=None, alias="DB_DATABASE")
    db_ssl_mode: str | None = Field(default=None, alias="DB_SSL_MODE")
    sqlite_path: str = Field(default="./scholartube.db", alias="SQLITE_PATH")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def is_postgres_configured(self) -> bool:
        return all([self.db_host, self.db_user, self.db_password, self.db_database])

    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.database_url:
            return self.database_url

        if self.is_postgres_configured:
            user = quote_plus(self.db_user or "")
            password = quote_plus(self.db_password or "")
            database = quote_plus(self.db_database or "")
            host = self.db_host or "localhost"
            url = f"postgresql+psycopg://{user}:{password}@{host}:{self.db_port}/{database}"
            if self.db_ssl_mode:
                url = f"{url}?sslmode={quote_plus(self.db_ssl_mode)}"
            return url

        return f"sqlite:///{self.sqlite_path}"

    @property
    def public_status(self) -> dict[str, Any]:
        database_kind = "sqlite" if self.sqlalchemy_database_uri.startswith("sqlite") else "postgres"
        return {
            "environment": self.environment,
            "database": database_kind,
            "ai_provider": "huggingface",
            "hf_configured": bool(self.hf_token),
            "hf_model": self.hf_model,
            "hf_inference_provider": self.hf_inference_provider,
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()
