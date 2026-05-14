"""Shared pytest fixtures.

The test suite uses an in-memory SQLite database so it can run without any
external services. The production engine and ``get_db`` dependency are both
overridden for the duration of the test session.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app import database, main
from app.database import get_db
from app.models import Base


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def test_session_factory(test_engine):
    return async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True)
async def _reset_db(test_engine):
    """Drop & recreate tables between tests for isolation."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
def client(test_session_factory) -> AsyncClient:
    """Async HTTP client wired to the FastAPI app + the test DB."""

    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with test_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    main.app.dependency_overrides[get_db] = _override_get_db
    # Prevent the production engine from being used inside readiness checks.
    database.async_session = test_session_factory

    transport = ASGITransport(app=main.app)
    return AsyncClient(transport=transport, base_url="http://test")
