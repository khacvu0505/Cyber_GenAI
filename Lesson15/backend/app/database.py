from collections.abc import AsyncIterator

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.sqlalchemy_url, pool_pre_ping=True)
SessionFactory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


async def init_database() -> None:
    from . import models  # noqa: F401

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        columns = await connection.run_sync(
            lambda sync_connection: {
                column["name"] for column in inspect(sync_connection).get_columns("proposals")
            }
        )
        if "user_id" not in columns:
            column_type = "UUID" if engine.dialect.name == "postgresql" else "CHAR(32)"
            await connection.execute(text(f"ALTER TABLE proposals ADD COLUMN user_id {column_type}"))
        await connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_proposals_user_id ON proposals (user_id)")
        )


async def close_database() -> None:
    await engine.dispose()
