# life-log-agent

**AI 라이프로그 서비스** — 갤러리에 흩어진 **사진·스크린샷·캡처**를 한곳에 모으면, AI가 내용을 자동으로 추출·분류하고, 나중에 **자연어로 검색·질의(RAG)** 할 수 있다.

> "여기저기 저장만 하고 다시 못 찾는" 개인 기록을, 찾을 수 있는 기록으로.

대표 사용 시나리오:
- "사고 싶었던 화장품 캡처만 모아줘"
- "지난달 제주도 여행 때 갔던 흑돼지 식당 어디였지?"

폰은 **업로드 기기**(갤러리 다중 선택), PC는 **조회·검색 기기**이며 같은 Supabase 계정을 공유한다.

---

## ✨ 핵심 기능

1. **이미지 업로드 & 자동 처리** — 사진·스크린샷·캡처를 받아 HCX-005 비전으로 OCR·설명 후 공통 텍스트 표현으로 정규화. 업로드는 즉시 응답(202)하고 무거운 처리는 백그라운드로 분리.
2. **자동 분류 + 임베딩 인덱싱** — 카테고리(`화장품·여행지·맛집·기타`)·태그·장소·시점을 추출하고, 청크 임베딩을 pgvector에 저장.
3. **자연어 검색 / RAG 질의응답** — 벡터 유사도 + 시간·장소·카테고리 필터로 후보를 찾고, HCX-005가 **등록된 기록만 근거로** 답변을 합성(출처 없는 답변은 내지 않음).

---

## 🧱 기술 스택

| 영역 | 선택 |
|------|------|
| 프론트엔드 | React PWA (Vite + TypeScript) — 반응형·설치형, 데스크톱·iOS·안드로이드 공용 |
| 백엔드 | Python 3.12+ / FastAPI (순수 JSON API) |
| 데이터·저장·인증 | Supabase (Postgres + pgvector · Storage · Auth) |
| ORM / 마이그레이션 | SQLModel / Alembic |
| 멀티모달 LLM / 임베딩 | Clova Studio HCX-005(비전) · Clova Embedding |
| 패키지/환경 | `uv`(백엔드) · `pnpm`/`npm`(프론트엔드) |

---

## 🏗️ 아키텍처

### 인제스천 파이프라인 (핵심)

업로드와 처리를 분리하고, 모든 입력을 **공통 텍스트 표현**으로 정규화한 뒤 임베딩한다.

```
1. 업로드   PWA가 원본을 Supabase Storage에 직행 업로드 → 경로+메타만 /ingest 로 전달
            → Item(status=pending) 생성, 즉시 202 응답, 처리는 백그라운드 위임
2. 처리     이미지 → HCX-005 비전 (OCR 텍스트 + 설명)  ─┐
3. 분류     HCX-005가 카테고리·태그·장소·시점 추출        ├─ 공통 텍스트 표현으로 정규화
4. 인덱싱   청크 임베딩 → pgvector 저장, status=ready    ─┘
5. 검색     질의 임베딩 → 벡터 유사도 + 메타 필터 → HCX-005 재랭크/답변 합성
```

`Item.status`(`pending → processing → ready / failed`)가 진행의 단일 진실원이며, `failed`는 재시도 가능하다.

### 레이어 경계

```
Routers (HTTP·JWT 검증)  →  Services (도메인 로직)  →  Integrations (외부 의존 래퍼)  →  Models / DB
```

모든 외부 호출(HCX-005·Embedding·Storage)은 `app/integrations/` 래퍼를 경유한다. 신뢰 경계는 **Supabase JWT**이며, 보호 엔드포인트는 JWT 검증 후에만 `user_id`를 사용한다.

---

## 📁 저장소 구성

```
app/                 FastAPI 백엔드
  main.py            앱 생성·라우터 등록·CORS
  config.py          pydantic-settings (Supabase / Clova 키·엔드포인트)
  db.py  auth.py     DB 세션·pgvector / Supabase JWT 검증
  routers/           ingest · items · search (HTTP 엔드포인트)
  services/          pipeline · classify · index · search (도메인 로직)
  integrations/      llm(HCX-005) · embeddings · storage (외부 의존 래퍼)
  models/            SQLModel 테이블 + Pydantic 스키마
migrations/          Alembic 마이그레이션
tests/               app/ 미러링 — integrations 경계에서 모킹
frontend/            React PWA (Vite + TS)
  src/screens/       온보딩·업로드·처리상태·타임라인·검색·상세
  src/lib/           api · auth · supabase 클라이언트
docs/                설계 스펙·계획   ·   DESIGN_*.md  디자인 산출물
CLAUDE.md AGENTS.md  작업 안내 · 에이전트 운영 규칙
```

---

## 🔌 API 개요

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/ingest` | 업로드 수신 → 파이프라인 백그라운드 시작 (202) |
| `POST` | `/ingest/{id}/retry` | `failed` 아이템 재처리 |
| `GET`  | `/items` | 내 기록 목록 (status·category 필터) |
| `GET`  | `/items/{id}` | 기록 상세 |
| `GET`  | `/items/{id}/signed-url` | 원본 이미지 Signed URL |
| `DELETE` | `/items/{id}` | 기록 삭제 |
| `POST` | `/search` | 자연어 검색 + RAG 질의응답 |
| `GET`  | `/health` | 헬스 체크 |

모든 데이터 엔드포인트는 `Authorization: Bearer <Supabase JWT>` 가 필요하다.

---

## 🚀 시작하기

### 사전 준비
- Python 3.12+, [`uv`](https://docs.astral.sh/uv/), Node 18+ / `pnpm`
- Supabase 프로젝트(Postgres + pgvector 확장 · Storage 버킷 · Auth)
- Clova Studio API 키

### 환경변수
시크릿은 코드/문서에 하드코딩하지 않고 환경변수로만 주입한다. (`.env`는 커밋하지 않음)

**백엔드 (`.env`)**
```
SUPABASE_URL=                 SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    SUPABASE_JWT_SECRET=
SUPABASE_STORAGE_BUCKET=life-log-images
DATABASE_URL=postgresql+asyncpg://...
CLOVA_API_KEY=                CLOVA_API_SECRET=
BACKEND_CORS_ORIGINS=http://localhost:5173
EMBEDDING_DIM=1024
```
> service role 키는 **백엔드 전용**, 프론트엔드에는 **anon 키만** 노출한다.

**프론트엔드 (`frontend/.env`)**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 실행
```bash
# 백엔드
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload      # http://localhost:8000  (docs: /docs)

# 프론트엔드 (frontend/)
pnpm install
pnpm dev                                    # http://localhost:5173
```

### 점검
```bash
uv run pytest                               # 백엔드 테스트 (integrations 모킹)
uv run ruff check . && uv run mypy app
pnpm --dir frontend lint
```

---

## 🔒 보안 원칙

- API 키·토큰은 환경변수로만 읽고 코드/문서/로그에 남기지 않는다.
- 원본 내용·OCR 텍스트·사용자 식별자 등 **PII를 로그·테스트 픽스처에 넣지 않는다**.
- 클라이언트가 보낸 `user_id`를 신뢰하지 않고 항상 JWT에서 도출한다.
- 테스트는 `integrations/` 경계에서 모킹하며 실제 외부 API를 호출하지 않는다.

자세한 아키텍처·컨벤션은 [`CLAUDE.md`](./CLAUDE.md), 운영 규칙은 [`AGENTS.md`](./AGENTS.md)를 참고한다.
