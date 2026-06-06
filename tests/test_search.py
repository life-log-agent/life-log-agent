"""POST /search 기본 흐름 테스트."""
import uuid
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from app.models.item import SearchResponse


def _fake_response() -> SearchResponse:
    return SearchResponse(
        answer="벨벳 틴트 12호 스크린샷이에요.",
        evidence=[],
        query="화장품 위시리스트",
    )


def test_search_returns_answer(client: TestClient, mock_search_svc: AsyncMock) -> None:
    mock_search_svc.return_value = _fake_response()
    resp = client.post("/search", json={"query": "화장품 위시리스트"})
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert data["query"] == "화장품 위시리스트"


def test_search_calls_service_with_filters(client: TestClient, mock_search_svc: AsyncMock) -> None:
    mock_search_svc.return_value = _fake_response()
    client.post(
        "/search",
        json={"query": "제주 맛집", "category": "food", "place": "제주"},
    )
    _, kwargs = mock_search_svc.call_args
    assert kwargs["category"] == "food"
    assert kwargs["place"] == "제주"
