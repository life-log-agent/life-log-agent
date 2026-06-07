"""업로드 → OCR/설명 → 분류 → 임베딩 파이프라인.

Item.status 전이: pending → processing → ready | failed
"""
import json
import logging
from datetime import datetime

from app.db import AsyncSessionLocal
from app.integrations import llm, storage
from app.models.item import Item
from app.services import classify as classify_svc
from app.services import index as index_svc

log = logging.getLogger(__name__)


def _extract_exif_datetime(image_bytes: bytes) -> datetime | None:
    try:
        import piexif
        exif = piexif.load(image_bytes)
        dt_str: bytes | None = (
            exif.get("Exif", {}).get(piexif.ExifIFD.DateTimeOriginal)
            or exif.get("0th", {}).get(piexif.ImageIFD.DateTime)
        )
        if dt_str:
            # EXIF DateTimeOriginal은 타임존 없는 카메라 로컬 시각이고,
            # captured_at 컬럼도 TIMESTAMP WITHOUT TIME ZONE(naive)이므로
            # aware datetime을 만들지 않는다(asyncpg가 naive 컬럼에 aware 값을 거부).
            return datetime.strptime(dt_str.decode(), "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    return None


def _guess_mime(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    return {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(
        ext, "image/jpeg"
    )


async def process_item(item_id: str) -> None:
    """백그라운드 태스크로 호출되는 메인 파이프라인."""
    async with AsyncSessionLocal() as session:
        item = await session.get(Item, item_id)
        if not item:
            log.error("item %s not found", item_id)
            return

        item.status = "processing"
        item.updated_at = datetime.utcnow()
        await session.commit()

        try:
            # 1. EXIF captured_at 추출 (bytes 필요; 실패해도 계속)
            if not item.captured_at:
                try:
                    image_bytes = await storage.download_image(item.storage_path)
                    item.captured_at = _extract_exif_datetime(image_bytes)
                except Exception:
                    pass

            # 2. HCX-005 비전: Supabase signed URL로 OCR + 설명
            signed_url = await storage.create_signed_url(item.storage_path, expires_in=300)
            description = await llm.describe_image(signed_url)
            item.ocr_text = description

            # 4. 분류 (카테고리·태그·장소·요약)
            result = await classify_svc.classify(description)
            item.category = result["category"]
            item.tags = json.dumps(result["tags"], ensure_ascii=False)
            item.place = result["place"]
            item.summary = result["summary"]

            # 5. 임베딩 → pgvector
            await index_svc.index_item(
                session,
                item.id,
                ocr_text=item.ocr_text,
                summary=item.summary,
                tags=result["tags"],
                place=item.place,
                category=item.category,
            )

            item.status = "ready"
            item.error_message = None
            item.updated_at = datetime.utcnow()
            await session.commit()

        except Exception as exc:
            # 파이프라인 또는 commit 중 어떤 예외든 여기서 failed로 수렴시킨다.
            # rollback 없이 다시 commit하면 깨진 트랜잭션 때문에 또 실패해
            # status가 processing에 영구히 갇힌다.
            log.exception("pipeline failed for item %s", item_id)
            await session.rollback()
            item = await session.get(Item, item_id)
            if item:
                item.status = "failed"
                item.error_message = str(exc)[:500]
                item.updated_at = datetime.utcnow()
                await session.commit()
