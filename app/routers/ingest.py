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
    item = Item(
        user_id=user_id,
        storage_path=body.storage_path,
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
