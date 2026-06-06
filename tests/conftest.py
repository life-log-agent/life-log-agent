"""pytest fixtures — integrations/를 모킹해 외부 API 호출 없이 테스트."""
import uuid
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.main import app
from app.db import get_session
from app.auth import current_user_id

# ── 인메모리 SQLite (pgvector 미지원 — 기능 테스트용) ─────────
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
_engine = create_async_engine(TEST_DB_URL)
_TestSession = async_sessionmaker(_engine, expire_on_commit=False)

TEST_USER_ID = str(uuid.uuid4())


@pytest_asyncio.fixture(autouse=True)
async def setup_db() -> AsyncGenerator[None, None]:
    async with _engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with _engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest_asyncio.fixture
async def session() -> AsyncGenerator[AsyncSession, None]:
    async with _TestSession() as s:
        yield s


@pytest.fixture
def client(session: AsyncSession) -> TestClient:
    app.dependency_overrides[get_session] = lambda: session
    app.dependency_overrides[current_user_id] = lambda: TEST_USER_ID
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def mock_pipeline() -> AsyncMock:
    """pipeline.process_item을 모킹해 백그라운드 처리 없이 테스트."""
    with patch("app.routers.ingest.process_item", new_callable=AsyncMock) as m:
        yield m


@pytest.fixture
def mock_search_svc() -> AsyncMock:
    with patch("app.routers.search.search_svc.search", new_callable=AsyncMock) as m:
        yield m
