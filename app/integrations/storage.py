"""Supabase Storage 래퍼.

프론트엔드가 직접 Storage에 업로드하므로, 백엔드는 경로를 받아
이미지를 다운로드하거나 서명된 URL을 생성한다.
"""
import httpx

from app.config import settings

_BASE = f"{settings.supabase_url}/storage/v1"
_BUCKET = settings.supabase_storage_bucket
_HEADERS = {"Authorization": f"Bearer {settings.supabase_service_role_key}"}
_TIMEOUT = 30.0


async def download_image(storage_path: str) -> bytes:
    """storage_path로 이미지 원본 bytes를 다운로드한다."""
    url = f"{_BASE}/object/{_BUCKET}/{storage_path.lstrip('/')}"
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(url, headers=_HEADERS)
        resp.raise_for_status()
    return resp.content


async def create_signed_url(storage_path: str, expires_in: int = 3600) -> str:
    """storage_path에 대한 서명된 URL을 생성한다 (expires_in 초)."""
    url = f"{_BASE}/object/sign/{_BUCKET}/{storage_path.lstrip('/')}"
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(
            url,
            headers={**_HEADERS, "Content-Type": "application/json"},
            json={"expiresIn": expires_in},
        )
        resp.raise_for_status()
    data = resp.json()
    return f"{settings.supabase_url}/storage/v1{data['signedURL']}"


async def delete_image(storage_path: str) -> None:
    """Supabase Storage에서 파일을 삭제한다."""
    url = f"{_BASE}/object/{_BUCKET}/{storage_path.lstrip('/')}"
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.delete(url, headers=_HEADERS)
        resp.raise_for_status()
