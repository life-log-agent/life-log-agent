"""텍스트 → Clova Embedding → pgvector 저장."""
import logging
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations import embeddings
from app.models.item import Chunk

log = logging.getLogger(__name__)


def _build_chunk_text(
    ocr_text: str | None,
    summary: str | None,
    tags: list[str],
    place: str | None,
    category: str | None,
) -> str:
    parts = []
    if summary:
        parts.append(summary)
    if ocr_text:
        parts.append(ocr_text)
    if tags:
        parts.append(" ".join(tags))
    if place:
        parts.append(place)
    if category:
        parts.append(category)
    return " ".join(parts)


async def index_item(
    session: AsyncSession,
    item_id: uuid.UUID,
    ocr_text: str | None,
    summary: str | None,
    tags: list[str],
    place: str | None,
    category: str | None,
) -> None:
    """기존 청크를 삭제하고 새 임베딩을 저장한다 (멱등 보장)."""
    # 기존 청크 삭제
    await session.execute(text("DELETE FROM chunks WHERE item_id = :id"), {"id": item_id})

    chunk_text = _build_chunk_text(ocr_text, summary, tags, place, category)
    if not chunk_text.strip():
        log.warning("item %s has no text to embed, skipping", item_id)
        return

    vector = await embeddings.embed_text(chunk_text)
    chunk = Chunk(item_id=item_id, text=chunk_text, embedding=vector)
    session.add(chunk)
    await session.commit()
    log.info("indexed item %s (%d dims)", item_id, len(vector))
