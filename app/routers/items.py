"""아이템 목록 조회 / 상세 / 삭제."""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import current_user_id
from app.db import get_session
from app.models.item import Item, ItemRead
from app.integrations.storage import create_signed_url, delete_image

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=list[ItemRead])
async def list_items(
    item_status: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    user_id: str = Depends(current_user_id),
    session: AsyncSession = Depends(get_session),
) -> list[Item]:
    stmt = select(Item).where(Item.user_id == user_id).order_by(Item.created_at.desc())
    if item_status:
        stmt = stmt.where(Item.status == item_status)
    if category:
        stmt = stmt.where(Item.category == category)
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.get("/{item_id}", response_model=ItemRead)
async def get_item(
    item_id: uuid.UUID,
    user_id: str = Depends(current_user_id),
    session: AsyncSession = Depends(get_session),
) -> Item:
    item = await session.get(Item, item_id)
    if not item or item.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return item


@router.get("/{item_id}/signed-url")
async def signed_url(
    item_id: uuid.UUID,
    user_id: str = Depends(current_user_id),
    session: AsyncSession = Depends(get_session),
) -> dict:
    item = await session.get(Item, item_id)
    if not item or item.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    url = await create_signed_url(item.storage_path)
    return {"signed_url": url}


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: uuid.UUID,
    user_id: str = Depends(current_user_id),
    session: AsyncSession = Depends(get_session),
) -> None:
    # ORM 객체를 세션에 올리지 않고 raw SQL로 소유권 확인 + 삭제
    row = (await session.execute(
        text("SELECT storage_path FROM items WHERE id = :id AND user_id = :uid"),
        {"id": str(item_id), "uid": user_id},
    )).fetchone()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    storage_path: str = row.storage_path
    await session.execute(text("DELETE FROM chunks WHERE item_id = :id"), {"id": str(item_id)})
    await session.execute(text("DELETE FROM items WHERE id = :id"), {"id": str(item_id)})
    await session.commit()
    try:
        await delete_image(storage_path)
    except Exception:
        pass
