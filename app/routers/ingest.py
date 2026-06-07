"""업로드 수신 + 재시도 엔드포인트."""
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import current_user_id
from app.db import get_session
from app.models.item import IngestRequest, IngestResponse, Item
from app.services.pipeline import process_item

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest(
    body: IngestRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(current_user_id),
    session: AsyncSession = Depends(get_session),
) -> IngestResponse:
    """이미지 경로를 받아 처리 파이프라인을 백그라운드로 시작한다."""
    # 보안: storage_path는 반드시 인증된 사용자 본인 경로(`{user_id}/...`)여야 한다.
    # 백엔드는 service_role 키로 Storage에 접근(RLS 우회)하므로, 검증이 없으면
    # 임의 경로를 넘겨 다른 사용자의 객체에 대한 서명 URL/다운로드를 유발할 수 있다.
    normalized_path = body.storage_path.lstrip("/")
    if ".." in normalized_path or not normalized_path.startswith(f"{user_id}/"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="storage_path must be under your own user prefix",
        )

    item = Item(
        user_id=user_id,
        storage_path=normalized_path,
        original_filename=body.original_filename,
        status="pending",
        tags=json.dumps(body.tags or [], ensure_ascii=False),
        ocr_text=body.memo,  # 메모를 초기 ocr_text로 저장
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)

    background_tasks.add_task(process_item, str(item.id))
    return IngestResponse(item_id=item.id, status=item.status)


@router.post("/{item_id}/retry", response_model=IngestResponse)
async def retry(
    item_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(current_user_id),
    session: AsyncSession = Depends(get_session),
) -> IngestResponse:
    """failed 상태 아이템을 재처리한다."""
    item = await session.get(Item, item_id)
    if not item or item.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    if item.status not in ("failed", "pending"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot retry item in status '{item.status}'",
        )

    item.status = "pending"
    item.error_message = None
    item.updated_at = datetime.utcnow()
    await session.commit()

    background_tasks.add_task(process_item, str(item.id))
    return IngestResponse(item_id=item.id, status=item.status)
