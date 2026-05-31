# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

`life_log`는 **AI 라이프로그 에이전트**다. 사람들이 여기저기 흩어 저장하는 기록(사진·음성메모·스크린샷·PDF)을 한 곳에 모아, AI가 자동으로 내용을 추출·분류하고, 나중에 **자연어로 검색**할 수 있게 한다.

핵심 사용자 흐름:

```
업로드(사진 / 음성메모 / 캡처 / PDF)
  → AI 자동 처리 (OCR · STT · 멀티모달 LLM)
  → 자동 분류 + 텍스트 추출 + 임베딩
  → Supabase 저장 (메타데이터 + 벡터 + 원본 파일)
  → 자연어 검색 / 질의응답 (RAG)
```

대표 질의 예시: *"지난달 제주도 여행 때 먹었던 흑돼지 식당 뭐였지?"* → 시간·장소·카테고리 필터 + 벡터 유사도 검색으로 해당 기록을 찾아 답한다.

> 상태: **신규(greenfield) 프로젝트 — 문서 단계.** 소스 코드는 아직 없고, 거버넌스 문서(`README.md`, `AGENTS.md`, `docs/superpowers/specs/2026-05-31-life-log-platform-design.md`)와 OMC 툴링(`.omc/`)만 있다. 아래 스택·구조·파이프라인은 **확정된 설계 기준선**이다. 첫 코드를 스캐폴딩할 때 이 컨벤션을 따르고, 구현이 생기면 이 문서를 갱신할 것. 프론트엔드는 **반응형 PWA**(브레인스토밍 최종 결론, 스펙 §2.1)로 데스크톱·iOS·안드로이드를 한 코드베이스로 커버한다.

## 기술 스택 (확정)

| 영역 | 선택 | 비고 |
|------|------|------|
| 백엔드 언어 | Python 3.12+ | |
| 백엔드 프레임워크 | FastAPI (ASGI) — **순수 JSON API** | SSR 없음. React PWA가 클라이언트 |
| 프론트엔드 | **React PWA** (Vite + TypeScript) | 반응형·설치형 PWA. 데스크톱·iOS·안드로이드 공용. `frontend/`에 위치 |
| 데이터 플랫폼 | **Supabase** | Postgres + **pgvector** + Storage + Auth를 한 곳에 |
| 멀티모달 LLM | **Clova Studio HCX-005** | 비전 지원: 이미지/캡처 OCR·설명, 자동 분류, RAG 답변 합성 |
| 임베딩 | Clova Studio Embedding | 한국어 품질 우선, LLM과 동일 제공자로 정렬 |
| STT (음성→텍스트) | CLOVA Speech (대안: faster-whisper) | 음성메모 전사 |
| OCR / PDF | HCX-005 비전 우선, `pypdf`로 텍스트 PDF 추출, 스캔본은 HCX-005/CLOVA OCR 폴백 | |
| 원본 파일 저장 | **Supabase Storage** | 사진/음성/PDF 원본 (별도 S3 불필요) |
| 인증 | **Supabase Auth** | PWA가 로그인, FastAPI는 Supabase JWT 검증 |
| ORM / 모델 | SQLModel (SQLAlchemy + Pydantic) | Supabase Postgres에 직접 연결 |
| 마이그레이션 | Alembic | pgvector 컬럼 포함 |
| 비동기 처리 | FastAPI BackgroundTasks(초기) → arq/Celery(확장 시) | 무거운 처리는 업로드 응답과 분리 |
| 환경/패키지 | `uv` (백엔드), `pnpm`/`npm` (프론트) | |
| 테스트 | pytest + httpx `AsyncClient` (백), Vitest/RTL (프론트) | |
| 린트/타입 | ruff + mypy (백), ESLint + tsc (프론트) | |

스택 변경(특히 LLM/임베딩/STT 제공자나 Supabase 사용 범위)이 필요하면 **코드 작성 전에 이 표를 먼저 갱신**할 것.

### Clova Studio HCX-005 통합 주의
- 모든 HCX-005 호출은 `integrations/llm.py` 래퍼를 통한다. 인증 키·엔드포인트·요청 포맷(멀티모달 메시지에 이미지 첨부 방식)은 이 한 곳에 캡슐화한다.
- HCX-005는 **비전 멀티모달**이므로 이미지/스크린샷 OCR·설명을 별도 OCR 엔진 없이 이 모델로 처리하는 것이 기본 경로다.
- API 키·엔드포인트는 `config.py`의 settings로만 읽고 코드에 하드코딩하지 않는다.

## 두 개의 런타임: React PWA 프론트 + FastAPI 백

- **React PWA (`frontend/`)** — 반응형·설치형 PWA. 폰은 **업로드 기기**(갤러리 다중 선택), PC는 **조회·검색 기기**이며 같은 Supabase 계정을 공유한다. Supabase JS 클라이언트로 **직접 로그인(Auth)** 하고, 원본 파일을 **Supabase Storage에 직접 업로드**한 뒤 저장 경로를 담아 FastAPI `/ingest`를 호출(JWT 포함)한다. 검색 UI도 FastAPI `/search`를 호출한다. 서비스워커로 설치형·오프라인 셸을 제공한다.
- **FastAPI** — 무거운 처리(STT·HCX-005·임베딩)와 벡터 검색을 담당하는 JSON API. 모든 보호 엔드포인트는 **Supabase JWT를 검증**한 뒤 `user_id`를 신뢰한다. CORS는 프론트 오리진만 허용.

큰 파일을 백엔드로 프록시하지 않는다 — 업로드는 클라이언트→Supabase Storage 직행, 백엔드는 경로만 받아 처리한다.

**플랫폼 제약(스펙 §2):** 브라우저 보안상 갤러리 **자동 백그라운드 수집은 불가** → "폰에서 갤러리 골라 업로드"가 1차 경로다. Web Share Target("공유 → 앱")은 **안드로이드만** 지원(iOS Safari 미지원)하므로 progressive enhancement로만 쓴다. iOS는 갤러리 업로드·설치·푸시(16.4+)가 되며 맥·앱스토어 불필요.

## 아키텍처: 핵심은 인제스천 파이프라인

이 시스템의 본질은 **모달리티별 처리 파이프라인**이다. 업로드와 처리를 분리하고, 모든 모달리티를 공통 텍스트 표현으로 정규화한 뒤 임베딩한다.

```
1. 업로드 (routers/ingest)
   - PWA가 갤러리 다중 선택(`<input type=file accept=image/* multiple>`)으로 받은 원본을 Supabase Storage에 직접 저장 → 경로 + 메타를 /ingest로 전달
   - (안드로이드) Web Share Target로 "공유 → life_log" 업로드도 동일 경로로 수렴
   - Item 레코드 생성(status=pending), 즉시 202 응답, 처리는 백그라운드 위임

2. 처리 (services/pipeline) — 모달리티별 분기
   - 이미지/캡처 → HCX-005 비전: 설명 + OCR 텍스트
   - 음성메모   → STT: 전사 텍스트
   - PDF        → pypdf 텍스트 추출 (실패 시 비전/OCR 폴백)
   ↓ 공통 텍스트 표현으로 정규화

3. 이해/분류 (services/classify)
   - HCX-005가 카테고리·태그·엔티티(장소/인물/음식 등)·시점(captured_at) 추출
   - 구조화 결과를 Item 메타데이터에 기록

4. 인덱싱 (services/index)
   - 정규화 텍스트를 청크로 나눠 임베딩 → Supabase pgvector 저장
   - Item status=ready

5. 검색 (routers/search + services/search)
   - 질의 임베딩 → 벡터 유사도 + 메타데이터 필터(시간/장소/카테고리)
   - 상위 결과를 HCX-005로 재랭크/답변 합성 (RAG)
```

**불변 규칙:**
- 업로드 엔드포인트는 무거운 작업(LLM/STT/임베딩 호출)을 **동기적으로 수행하지 않는다.** 항상 백그라운드 파이프라인에 위임한다.
- 모든 모달리티는 단계 2에서 **공통 텍스트 표현**으로 수렴한다. 새 모달리티 추가 = 단계 2에 처리기 하나 추가 (이후 단계는 모달리티를 모른다).
- `Item.status`(`pending → processing → ready / failed`)가 파이프라인 진행의 단일 진실원이다. 실패는 재시도 가능해야 한다.

## 레이어 경계

1. **Routers (`app/routers/`)** — HTTP 엔드포인트. 파싱/검증/응답 + JWT 검증만. 비즈니스 로직·외부 API 호출 금지.
2. **Services (`app/services/`)** — 파이프라인·분류·검색 등 도메인 로직. 라우터가 호출.
3. **Integrations (`app/integrations/`)** — 외부 의존(HCX-005, Clova Embedding, STT, Supabase Storage) 래퍼. 서비스는 이 래퍼를 통해서만 외부에 접근한다. **외부 SDK/REST를 서비스/라우터에서 직접 호출하지 말 것** — 교체·모킹이 어려워진다.
4. **Models (`app/models/`)** — SQLModel 테이블 + Pydantic 스키마. 입력 스키마 ≠ 테이블 스키마로 분리.
5. **DB (`app/db.py`)** — Supabase Postgres 엔진/세션. 세션은 `Depends`로 주입, pgvector 등록.

## 예상 디렉터리 구조

```
app/                 # FastAPI 백엔드
  main.py            # 앱 생성, 라우터 등록, CORS
  config.py          # pydantic-settings (Supabase URL/키, Clova 키/엔드포인트)
  db.py              # Supabase Postgres 엔진 + 세션, pgvector 등록
  auth.py            # Supabase JWT 검증 의존성
  models/            # Item, Chunk(embedding), ...
  routers/           # ingest, search, items
  services/          # pipeline, classify, index, search
  integrations/      # llm(hcx005), embeddings, stt, storage(supabase)
migrations/          # Alembic
tests/               # app/ 미러링; integrations 모킹
pyproject.toml

frontend/            # React PWA (Vite + TS)
  public/
    manifest.webmanifest  # PWA 매니페스트 (설치형, 아이콘, share_target[안드로이드])
  src/
    sw.ts            # 서비스워커 (오프라인 셸, 설치)
    lib/supabase.ts  # Supabase 클라이언트 (auth + storage)
    api/             # FastAPI 호출 (JWT 첨부)
    pages/ components/
  package.json
```

## 개발 명령어

> 스캐폴딩 이후 적용. `uv` 없으면 `uv run X`→`python -m X`, `uv sync`→`pip install -e ".[dev]"`.

```bash
# --- 백엔드 ---
uv sync
uv run uvicorn app.main:app --reload

uv run pytest                                  # 전체
uv run pytest tests/test_pipeline.py           # 파일 단위
uv run pytest tests/test_search.py::test_rag   # 단일 테스트
uv run pytest -k "ingest and not pdf"          # 패턴
uv run pytest -x -q                            # 첫 실패에서 중단

uv run ruff check . && uv run ruff format .
uv run mypy app

# 마이그레이션 (모델/테이블 변경 시 필수)
uv run alembic revision --autogenerate -m "메시지"
uv run alembic upgrade head

# --- 프론트엔드 (frontend/에서) ---
pnpm install
pnpm dev                  # 개발 서버
pnpm test                 # Vitest
pnpm lint                 # ESLint
pnpm build                # 프로덕션 빌드

# --- Supabase ---
supabase start            # 로컬 스택 (db/auth/storage)
supabase db push          # 마이그레이션 동기화
```

## 컨벤션

- **외부 호출은 `integrations/` 래퍼 경유.** HCX-005·Clova Embedding·STT·Supabase Storage를 서비스에서 직접 호출하지 않는다. 테스트는 이 경계에서 모킹하고, 실제 외부 API를 호출하지 않는다.
- **신뢰 경계는 Supabase JWT.** 보호 엔드포인트는 `auth.py`로 JWT를 검증한 뒤에만 `user_id`를 사용한다. 클라이언트가 보낸 `user_id`를 그대로 믿지 않는다. 가능하면 Supabase RLS도 함께 건다.
- **DB 접근은 주입된 세션으로.** 모듈 전역 세션 금지. pgvector 컬럼 변경도 Alembic 리비전을 동반한다.
- **시간은 UTC(timezone-aware)로 저장**, 표시 단계에서만 변환. 라이프로그는 시점 정확성이 검색 품질의 핵심이다. 파일 메타데이터(EXIF 등)에서 `captured_at`을 우선 추출하고, 없으면 업로드 시각을 쓴다.
- **설정·시크릿은 `config.py`의 settings 일원화.** Supabase service key·Clova API 키를 코드에 박지 않고, `.env`는 커밋하지 않는다(`.env.example` 제공). Supabase service role 키는 **백엔드에만**, React에는 anon 키만 노출한다.
- **처리는 멱등(idempotent)하게.** 같은 Item을 재처리해도 청크/임베딩이 중복 생성되지 않도록 (item_id 기준 upsert/삭제 후 재삽입).
- **PII 주의:** 사진·음성·문서에는 민감정보가 많다. 로그에 원본 내용/전사 텍스트/사용자 식별자를 출력하지 않는다.
