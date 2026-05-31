# life-log-agent

**AI 라이프로그 서비스** — 갤러리 캡처·사진·음성메모·PDF를 업로드하면 AI가 내용을 추출·자동 분류하고, 나중에 **자연어로 검색·질의(RAG)** 할 수 있다.

대표 사용 시나리오:
- "사고 싶었던 화장품 캡처만 모아줘"
- "지난달 제주도 여행 때 갔던 흑돼지 식당 어디였지?"

폰은 업로드 기기, PC는 조회·검색 기기이며 같은 클라우드 계정을 공유한다.

## 기술 스택

- **프론트엔드:** React PWA (Vite + TypeScript) — 반응형·설치형, 데스크톱·iOS·안드로이드 공용
- **백엔드:** FastAPI (순수 JSON API)
- **데이터/저장/인증:** Supabase (Postgres + pgvector · Storage · Auth)
- **멀티모달 LLM/임베딩/STT:** Clova Studio HCX-005 · Clova Embedding · CLOVA Speech

## 동작 방식

```
업로드(사진 / 음성메모 / 캡처 / PDF)
  → AI 자동 처리 (OCR · STT · 멀티모달 LLM)
  → 자동 분류 + 텍스트 추출 + 임베딩
  → Supabase 저장 (메타데이터 + 벡터 + 원본 파일)
  → 자연어 검색 / 질의응답 (RAG)
```

## 저장소 구성

- `CLAUDE.md` — 아키텍처·개발 명령어·컨벤션
- `AGENTS.md` — 에이전트 운영 규칙(기술·하네스·금지)
- `docs/superpowers/specs/` — 설계 스펙
- `docs/superpowers/plans/` — 구현 계획
- `app/` — FastAPI 백엔드 *(구현 예정)*
- `frontend/` — React PWA *(구현 예정)*

## 상태

문서·설계 단계 완료. 구현은 `docs/superpowers/plans/`의 계획에 따라 단계적으로 진행한다. 첫 구현 단계는 외부 의존(Clova·Supabase)을 스텁으로 둔 **수직 슬라이스**(업로드 → 분류 → 검색 end-to-end)이며, 이후 사이클에서 실제 Clova/Supabase 연동으로 교체한다.
