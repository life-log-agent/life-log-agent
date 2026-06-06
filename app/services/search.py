"""벡터 유사도 검색 + HCX-005 재랭크/답변 합성."""
import json
import uuid
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations import embeddings as embed_svc
from app.integrations import llm
from app.models.item import EvidenceItem, SearchResponse


async def search(
    session: AsyncSession,
    user_id: str,
    query: str,
    category: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    place: str | None = None,
    top_k: int = 5,
) -> SearchResponse:
    # 1. 쿼리 임베딩
    query_vec = await embed_svc.embed_text(query)
    vec_str = "[" + ",".join(str(v) for v in query_vec) + "]"

    # 2. pgvector 유사도 검색 + 메타 필터
    conditions = ["i.user_id = :user_id", "i.status = 'ready'"]
    params: dict = {"user_id": user_id, "top_k": top_k}

    if category:
        conditions.append("i.category = :category")
        params["category"] = category
    if date_from:
        conditions.append("i.captured_at >= :date_from")
        params["date_from"] = date_from
    if date_to:
        conditions.append("i.captured_at <= :date_to")
        params["date_to"] = date_to
    if place:
        conditions.append("i.place ILIKE :place")
        params["place"] = f"%{place}%"

    where = " AND ".join(conditions)
    # vec_str은 float 배열이므로 SQL 인젝션 위험 없이 인라인 가능
    sql = text(f"""
        SELECT
            i.id, i.storage_path, i.original_filename,
            i.category, i.summary, i.place, i.captured_at,
            c.text,
            1 - (c.embedding <=> '{vec_str}'::vector) AS score
        FROM chunks c
        JOIN items i ON i.id = c.item_id
        WHERE {where}
        ORDER BY c.embedding <=> '{vec_str}'::vector
        LIMIT :top_k
    """)
    rows = (await session.execute(sql, params)).fetchall()

    if not rows:
        return SearchResponse(
            answer="관련 기록을 찾지 못했어요. 필터를 바꾸거나 더 많은 기록을 업로드해보세요.",
            evidence=[],
            query=query,
        )

    # 3. HCX-005로 답변 합성
    contexts = [
        f"파일: {r.original_filename}\n카테고리: {r.category}\n장소: {r.place}\n요약: {r.summary}\n내용: {r.text}"
        for r in rows
    ]
    answer = await llm.synthesize_answer(query, contexts)

    evidence = [
        EvidenceItem(
            id=uuid.UUID(str(r.id)),
            storage_path=r.storage_path,
            original_filename=r.original_filename,
            category=r.category,
            summary=r.summary,
            place=r.place,
            captured_at=r.captured_at,
            score=float(r.score),
        )
        for r in rows
    ]

    return SearchResponse(answer=answer, evidence=evidence, query=query)
