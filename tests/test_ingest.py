"""POST /ingest + POST /ingest/{id}/retry 기본 흐름 테스트."""
import uuid

from fastapi.testclient import TestClient


def test_ingest_returns_202(client: TestClient, mock_pipeline) -> None:
    resp = client.post(
        "/ingest",
        json={
            "storage_path": "uploads/test.png",
            "original_filename": "test.png",
        },
    )
    assert resp.status_code == 202
    data = resp.json()
    assert data["status"] == "pending"
    assert uuid.UUID(data["item_id"])


def test_ingest_queues_pipeline(client: TestClient, mock_pipeline) -> None:
    client.post(
        "/ingest",
        json={"storage_path": "uploads/test.png", "original_filename": "test.png"},
    )
    mock_pipeline.assert_called_once()


def test_retry_not_found(client: TestClient, mock_pipeline) -> None:
    resp = client.post(f"/ingest/{uuid.uuid4()}/retry")
    assert resp.status_code == 404


def test_retry_resets_status(client: TestClient, mock_pipeline) -> None:
    # 1. ingest
    resp = client.post(
        "/ingest",
        json={"storage_path": "uploads/err.png", "original_filename": "err.png"},
    )
    item_id = resp.json()["item_id"]

    # 2. 수동으로 failed 상태 만들기
    from tests.conftest import _TestSession
    import asyncio
    from app.models.item import Item

    async def _set_failed() -> None:
        async with _TestSession() as s:
            item = await s.get(Item, item_id)
            assert item is not None
            item.status = "failed"
            await s.commit()

    asyncio.get_event_loop().run_until_complete(_set_failed())

    # 3. retry
    resp2 = client.post(f"/ingest/{item_id}/retry")
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "pending"
