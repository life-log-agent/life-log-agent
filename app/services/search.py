"""벡터 유사도 검색 + HCX-005 재랭크/답변 합성."""
import uuid
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations import embeddings as embed_svc
from app.integrations import llm
from app.models.item import EvidenceItem, SearchResponse

# 이 값 미만의 유사도 청크는 질문과 무관한 것으로 판단해 LLM에 넘기지 않는다.
# 등록된 사진 기반으로만 답변해야 하므로, 낮은 점수 결과로 환각을 방지한다.
_MIN_SCORE = 0.30


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

    _NO_RESULT_MSG = "등록된 사진 기반으로는 알 수 없는 정보입니다. 관련 사진을 업로드하면 답변할 수 있어요."

    if not rows:
        return SearchResponse(answer=_NO_RESULT_MSG, evidence=[], query=query)

    # 3. 유사도 임계값 필터 — 관련 없는 청크로 환각 답변 방지
    relevant = [r for r in rows if float(r.score) >= _MIN_SCORE]
    if not relevant:
        return SearchResponse(answer=_NO_RESULT_MSG, evidence=[], query=query)

    # 4. HCX-005로 답변 합성 (점수 포함해 LLM이 관련성 판단 가능하게)
    contexts = [
        f"[관련도: {r.score:.2f}] 파일: {r.original_filename}\n"
        f"카테고리: {r.category}\n장소: {r.place}\n요약: {r.summary}\n내용: {r.text}"
        for r in relevant
    ]
    result = await llm.synthesize_answer(query, contexts)
    answered: bool = result.get("answered", False)
    answer_text: str = result.get("text", _NO_RESULT_MSG)

    # answered=False면 관련 없는 기록을 근거로 보이지 않음
    if not answered:
        return SearchResponse(answer=answer_text, evidence=[], query=query)

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
        for r in relevant
    ]

    return SearchResponse(answer=answer_text, evidence=evidence, query=query)
