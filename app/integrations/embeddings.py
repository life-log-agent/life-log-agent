"""Clova Studio Embedding 래퍼."""
import httpx

from app.config import settings

_HEADERS = {
    "Authorization": f"Bearer {settings.clova_api_key}",
    "Content-Type": "application/json",
}

_EMBED_URL = f"{settings.clova_api_url.rstrip('/')}/v1/api-tools/embedding/v2"
_TIMEOUT = 30.0


async def embed_text(text: str) -> list[float]:
    """텍스트를 임베딩 벡터로 변환한다. 차원: settings.embedding_dim."""
    payload = {"text": text[:2000]}  # Clova 입력 길이 제한 대비 truncate
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(_EMBED_URL, headers=_HEADERS, json=payload)
        resp.raise_for_status()
    data = resp.json()
    return data["result"]["embedding"]
