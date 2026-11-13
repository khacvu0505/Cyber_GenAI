from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    app_name: str = "ProposalOps API"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    database_driver: str = "postgresql+asyncpg"
    db_host: str = "localhost"
    db_port: int = Field(default=5432, ge=1, le=65535)
    db_user: str = "proposal"
    db_pass: str = "proposal"
    database: str = "proposalops"
    database_path: str = "proposalops.db"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    jwt_secret: str = "change-this-secret-in-production"
    access_token_expire_minutes: int = Field(default=1440, ge=5, le=43_200)
    frontend_origin: str = "http://localhost:3000"
    max_recent_proposals: int = Field(default=50, ge=1, le=200)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]

    @property
    def sqlalchemy_url(self) -> URL | str:
        if self.database_driver.startswith("sqlite"):
            if self.database_path == ":memory:":
                return "sqlite+aiosqlite:///:memory:"
            path = Path(self.database_path).expanduser().resolve()
            return f"sqlite+aiosqlite:///{path}"
        return URL.create(
            drivername=self.database_driver,
            username=self.db_user,
            password=self.db_pass,
            host=self.db_host,
            port=self.db_port,
            database=self.database,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
