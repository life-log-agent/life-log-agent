"""이미지 설명 → 카테고리·태그·장소·요약 추출."""
import logging
from typing import Any

from app.integrations import llm

log = logging.getLogger(__name__)


async def classify(description: str) -> dict[str, Any]:
    """HCX-005로 분류 결과를 반환한다.

    Returns:
        {"category": str, "tags": list[str], "place": str | None, "summary": str}
    """
    result = await llm.classify_image(description)
    # 필드 보정
    category = result.get("category", "기타")
    if category not in ("화장품", "여행지", "맛집", "기타"):
        category = "기타"
    tags: list[str] = result.get("tags") or []
    place: str | None = result.get("place")
    summary: str = result.get("summary") or description[:80]

    # PII 주의: tags·place·summary는 이미지 내용에서 추출된 값이라 로그에 남기지 않는다
    # (CLAUDE.md §8). 고정 분류값인 category와 개수만 남긴다.
    log.info("classified: category=%s tags=%d", category, len(tags))
    return {"category": category, "tags": tags, "place": place, "summary": summary}
