"""POST /ingest + POST /ingest/{id}/retry 기본 흐름 테스트."""
import uuid

from fastapi.testclient import TestClient

from tests.conftest import TEST_USER_ID

# 인증된 사용자 본인 경로(`{user_id}/...`)만 허용되므로 픽스처도 본인 경로를 쓴다.
_OWN_PATH = f"{TEST_USER_ID}/test.png"


def test_ingest_returns_202(client: TestClient, mock_pipeline) -> None:
    resp = client.post(
        "/ingest",
        json={
            "storage_path": _OWN_PATH,
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
        json={"storage_path": _OWN_PATH, "original_filename": "test.png"},
    )
    mock_pipeline.assert_called_once()


def test_ingest_rejects_foreign_path(client: TestClient, mock_pipeline) -> None:
    """다른 사용자 경로로 업로드 시도는 403으로 거부되고 파이프라인도 안 돈다."""
    resp = client.post(
        "/ingest",
        json={"storage_path": "some-other-user/secret.png", "original_filename": "x.png"},
    )
    assert resp.status_code == 403
    mock_pipeline.assert_not_called()


def test_ingest_rejects_path_traversal(client: TestClient, mock_pipeline) -> None:
    """본인 프리픽스로 시작해도 `..`가 있으면 거부한다."""
    resp = client.post(
        "/ingest",
        json={"storage_path": f"{TEST_USER_ID}/../victim/secret.png", "original_filename": "x.png"},
    )
    assert resp.status_code == 403
    mock_pipeline.assert_not_called()


def test_retry_not_found(client: TestClient, mock_pipeline) -> None:
    resp = client.post(f"/ingest/{uuid.uuid4()}/retry")
    assert resp.status_code == 404


def test_retry_resets_status(client: TestClient, mock_pipeline) -> None:
    # 1. ingest
    resp = client.post(
        "/ingest",
        json={"storage_path": f"{TEST_USER_ID}/err.png", "original_filename": "err.png"},
    )
    item_id = resp.json()["item_id"]

    # 2. 수동으로 failed 상태 만들기
    import asyncio

    from app.models.item import Item
    from tests.conftest import _TestSession

    async def _set_failed() -> None:
        async with _TestSession() as s:
            item = await s.get(Item, uuid.UUID(item_id))
            assert item is not None
            item.status = "failed"
            await s.commit()

    asyncio.get_event_loop().run_until_complete(_set_failed())

    # 3. retry
    resp2 = client.post(f"/ingest/{item_id}/retry")
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "pending"
