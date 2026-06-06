"""Clova Studio HCX-005 비전 멀티모달 래퍼 (SSE 스트리밍).

모든 외부 Clova API 호출은 이 모듈을 경유한다.
테스트에서는 이 모듈만 모킹하면 된다.
"""
import json
import uuid
from typing import Any

import httpx

from app.config import settings

_CHAT_URL = f"{settings.clova_base_url}/chat-completions/HCX-005"
_TIMEOUT = 60.0


def _make_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.clova_api_key}",
        "X-NCP-CLOVASTUDIO-REQUEST-ID": uuid.uuid4().hex,
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }


async def _chat(messages: list[dict[str, Any]], max_tokens: int = 1500) -> str:
    """SSE 스트리밍으로 HCX-005 응답을 수신해 전체 텍스트를 반환한다."""
    payload = {
        "messages": messages,
        "maxTokens": max_tokens,
        "temperature": 0.5,
        "topP": 0.8,
        "topK": 0,
        "repetitionPenalty": 1.1,
        "stop": [],
        "seed": 0,
        "includeAiFilters": True,
    }

    last_content: str = ""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        async with client.stream(
            "POST", _CHAT_URL, headers=_make_headers(), json=payload
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data_str = line[5:].strip()
                if not data_str or data_str == "[DONE]":
                    continue
                try:
                    event = json.loads(data_str)
                    # v3 응답: event["message"]["content"] 또는 event["result"]["message"]["content"]
                    msg = event.get("message") or (event.get("result") or {}).get("message") or {}
                    content = msg.get("content", "")
                    if isinstance(content, str) and content:
                        last_content = content
                    elif isinstance(content, list):
                        text_parts = [p.get("text", "") for p in content if p.get("type") == "text"]
                        joined = "".join(text_parts)
                        if joined:
                            last_content = joined
                except (json.JSONDecodeError, AttributeError):
                    continue

    return last_content


async def describe_image(image_url: str) -> str:
    """Supabase signed URL로 이미지를 받아 OCR 텍스트 + 설명을 반환한다."""
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image_url", "imageUrl": {"url": image_url}},
                {
                    "type": "text",
                    "text": (
                        "이 이미지에서 보이는 모든 텍스트를 OCR로 추출하고, "
                        "이미지 내용을 한국어로 간결하게 설명해줘. "
                        "형식: OCR: <추출 텍스트>\\n설명: <이미지 설명>"
                    ),
                },
            ],
        }
    ]
    return await _chat(messages, max_tokens=800)


async def classify_image(description: str) -> dict[str, Any]:
    """텍스트 설명으로 카테고리·태그·장소·촬영시각을 추출한다."""
    messages = [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "너는 이미지 내용을 분석해 JSON 형태로 분류하는 AI야. "
                        "category는 반드시 화장품·여행지·맛집·기타 중 하나, "
                        "tags는 최대 5개 한국어 키워드 배열, "
                        "place는 장소명(없으면 null), "
                        "summary는 한 줄 요약이야. "
                        "JSON만 출력해. 다른 텍스트 없이."
                    ),
                }
            ],
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"다음 이미지 설명을 분류해줘:\n{description}"}
            ],
        },
    ]

    raw = await _chat(messages, max_tokens=300)
    try:
        return json.loads(raw.strip().strip("```json").strip("```").strip())
    except (json.JSONDecodeError, ValueError):
        return {"category": "기타", "tags": [], "place": None, "summary": description[:80]}


async def synthesize_answer(query: str, contexts: list[str]) -> dict[str, Any]:
    """RAG 컨텍스트로 답변을 생성한다.

    반환: {"answered": bool, "text": str}
    - answered=True: 기록에서 근거를 찾아 답변함
    - answered=False: 등록된 사진 기반으로 알 수 없는 정보
    """
    context_text = "\n\n".join(f"[기록 {i+1}]\n{c}" for i, c in enumerate(contexts))
    messages = [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "너는 사용자가 직접 업로드한 사진 기록만을 기반으로 답변하는 AI 비서야.\n"
                        "아래 규칙을 반드시 지켜:\n"
                        "1. 오직 '관련 기록'에 명시된 내용만 사용해 답변해. 기록 밖의 일반 지식은 절대 사용하지 마.\n"
                        "2. 질문이 기록과 관련 없거나 기록만으로 답할 수 없으면 answered를 false로 해.\n"
                        "3. 관련도가 낮은 기록(0.4 미만)은 근거로 삼지 마.\n"
                        "4. 반드시 아래 JSON 형식만 출력해. 다른 텍스트 없이.\n"
                        '{"answered": true/false, "text": "답변 또는 알 수 없는 이유"}'
                    ),
                }
            ],
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"질문: {query}\n\n관련 기록:\n{context_text}"}
            ],
        },
    ]
    raw = await _chat(messages, max_tokens=400)
    try:
        cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        return {"answered": False, "text": "등록된 사진 기반으로는 알 수 없는 정보입니다."}
