"""자연어 검색 / RAG 질의응답 엔드포인트."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import current_user_id
from app.db import get_session
from app.models.item import SearchRequest, SearchResponse
from app.services import search as search_svc

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search(
    body: SearchRequest,
    user_id: str = Depends(current_user_id),
    session: AsyncSession = Depends(get_session),
) -> SearchResponse:
    """자연어 질의 + 필터로 기록을 검색하고 RAG 답변을 반환한다."""
    return await search_svc.search(
        session=session,
        user_id=user_id,
        query=body.query,
        category=body.category,
        date_from=body.date_from,
        date_to=body.date_to,
        place=body.place,
        top_k=body.top_k,
    )
