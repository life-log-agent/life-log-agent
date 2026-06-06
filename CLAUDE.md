# CLAUDE.md

이 문서는 Claude Code(claude.ai/code)와 Sub Agent가 `life_log` 저장소에서 작업할 때 따르는 **프로젝트 작업 안내**다.
운영 규칙은 `AGENTS.md`, 확정 설계는 `docs/superpowers/specs/2026-05-31-life-log-platform-design.md`를 함께 따른다.

> 상태: **신규(greenfield) — 문서 단계.** 소스 코드는 아직 없고 거버넌스 문서와 OMC 툴링(`.omc/`)만 있다. 아래 스택·구조·파이프라인은 **확정된 설계 기준선**이다. 첫 코드를 스캐폴딩할 때 이 컨벤션을 따르고, 구현이 생기면 이 문서를 갱신한다.

---

## 1. 프로젝트 한 줄 설명

`life_log`는 사진·스크린샷·캡처처럼 갤러리에 흩어진 **이미지 기록**을 한 곳에 모아 **AI가 자동으로 내용을 추출·분류하고 자연어로 검색·질의(RAG)** 하게 해 주는 **반응형 PWA + FastAPI 라이프로그 서비스**다.

---

## 2. 대상 사용자와 핵심 기능

**대상 사용자:** 자신의 기록을 여기저기 저장만 하고 다시 찾지 못하는 개인 사용자. 폰은 **업로드 기기**(갤러리 다중 선택), PC는 **조회·검색 기기**이며 같은 Supabase 계정을 공유한다.

**핵심 기능**

1. **이미지 업로드 & 자동 처리** — 사진·스크린샷·캡처를 받아 HCX-005 비전으로 OCR·설명 → 공통 텍스트 표현으로 정규화.
2. **자동 분류 + 임베딩 인덱싱** — 카테고리·태그·엔티티(장소/인물/음식)·시점(`captured_at`) 추출 후 청크 임베딩을 pgvector에 저장.
3. **자연어 검색 / RAG 질의응답** — 시간·장소·카테고리 필터 + 벡터 유사도 검색으로 후보를 찾고, LLM으로 재랭크/답변 합성.

대표 질의: *"지난달 제주도 여행 때 먹었던 흑돼지 식당 뭐였지?"* → 시간·장소·카테고리 필터 + 벡터 유사도로 해당 기록을 찾아 답한다.

---

## 3. 기술 스택과 실행 명령

| 영역 | 선택 | 비고 |
|------|------|------|
| 백엔드 | Python 3.12+ / FastAPI (순수 JSON API) | SSR 없음. React PWA가 클라이언트 |
| 프론트엔드 | React PWA (Vite + TypeScript) | 반응형·설치형. 데스크톱·iOS·안드로이드 공용. `frontend/` |
| 데이터 플랫폼 | Supabase (Postgres + pgvector + Storage + Auth) | 한 곳에서 DB·벡터·파일·인증 |
| ORM / 마이그레이션 | SQLModel / Alembic | pgvector 컬럼 포함 |
| 비동기 처리 | FastAPI BackgroundTasks → arq/Celery(확장 시) | 무거운 처리는 업로드 응답과 분리 |
| 환경/패키지 | `uv`(백) / `pnpm`·`npm`(프론트) | |
| 테스트 | pytest + httpx `AsyncClient`(백) / Vitest·RTL(프론트) | |
| 린트/타입 | ruff + mypy(백) / ESLint + tsc(프론트) | |

AI/임베딩 제공자는 **4번 항목** 참조. 스택 변경(특히 LLM/임베딩 제공자나 Supabase 사용 범위)은 **코드 작성 전에 이 표를 먼저 갱신**한다.

**실행 명령** (스캐폴딩 이후 적용. `uv` 없으면 `uv run X`→`python -m X`, `uv sync`→`pip install -e ".[dev]"`)

```bash
# --- 백엔드 ---
uv sync
uv run uvicorn app.main:app --reload
uv run pytest                                  # 전체
uv run pytest tests/test_pipeline.py           # 파일 단위
uv run pytest -k "ingest and not pdf"          # 패턴
uv run pytest -x -q                            # 첫 실패에서 중단
uv run ruff check . && uv run ruff format .
uv run mypy app
uv run alembic revision --autogenerate -m "메시지"   # 모델/테이블 변경 시 필수
uv run alembic upgrade head

# --- 프론트엔드 (frontend/에서) ---
pnpm install
pnpm dev          # 개발 서버
pnpm test         # Vitest
pnpm lint         # ESLint
pnpm build        # 프로덕션 빌드

# --- Supabase ---
supabase start    # 로컬 스택 (db/auth/storage)
supabase db push  # 마이그레이션 동기화
```

---

## 4. Ncloud AI / 인프라 서비스와 역할

모든 외부 호출은 **`app/integrations/` 래퍼를 경유**한다. 서비스·라우터에서 외부 SDK/REST를 직접 부르지 않는다(교체·모킹 용이성).

| 서비스 | 역할 | 래퍼 |
|--------|------|------|
| **Clova Studio HCX-005** (비전 멀티모달) | 이미지/스크린샷/캡처 OCR·설명, 자동 분류, RAG 답변 합성 | `integrations/llm.py` |
| **Clova Studio Embedding** | 한국어 우선 텍스트 임베딩 (LLM과 동일 제공자로 정렬) | `integrations/embeddings.py` |
| **Supabase Storage** | 이미지(사진·스크린샷·캡처) 원본 저장 (클라이언트 직행 업로드) | `integrations/storage.py` |
| **Supabase Auth** | PWA 로그인. FastAPI는 Supabase JWT 검증 | `app/auth.py` |
| **Supabase Postgres + pgvector** | 메타데이터 + 벡터 인덱스 | `app/db.py` |

- 입력은 **이미지/스크린샷/캡처 단일 모달리티**다. HCX-005가 비전 멀티모달이므로 OCR·설명을 **별도 OCR 엔진 없이** 이 모델로 처리한다. (음성 STT·PDF는 현재 범위 밖 — 필요 시 단계 2에 처리기 추가로 흡수)
- 인증 키·엔드포인트·요청 포맷(멀티모달 메시지 이미지 첨부 방식)은 각 래퍼 한 곳에 캡슐화한다. 키는 `config.py`의 settings로만 읽고 코드에 하드코딩하지 않는다(8번 참조).

---

## 5. 화면 목록과 디자인 톤 (Claude Design 참고)

**화면 목록**

1. **로그인 / 온보딩** — Supabase Auth 로그인, 첫 사용 안내.
2. **업로드** — 폰 갤러리 다중 선택(`<input type=file accept=image/* multiple>`). 안드로이드는 Web Share Target("공유 → life_log")을 progressive enhancement로 추가.
3. **처리 상태** — 업로드한 Item의 `pending → processing → ready / failed` 진행을 명료히 표시. 실패는 재시도 가능.
4. **분류 결과 / 타임라인** — 자동 분류(카테고리·태그·엔티티)와 시점 기준 타임라인 조회.
5. **검색 / 질의응답(RAG)** — 자연어 입력 + 시간·장소·카테고리 필터, 답변과 근거 기록 함께 표시.
6. **항목 상세** — 원본 미리보기 + 추출 텍스트·메타데이터.

**디자인 톤**

- **단계형(가이드형) 흐름** — 복잡한 칸반 보드가 아니라 업로드 → 처리 상태 → 분류 결과 → 검색을 명료한 단계로 안내한다. 한 화면에 정보를 욱여넣지 않는다.
- **모바일 우선 반응형** — 폰이 1차 사용 환경. 텍스트가 겹치거나 잘리지 않게 하고 가독성을 최우선으로 한다.
- **설치형 PWA 셸** — 서비스워커로 오프라인 셸·설치 경험 제공.

**Claude Design 참고 — 화면 설계 기준표**

| 항목 | 기준 |
|------|------|
| 주요 사용자 | 자신의 기록을 모으기만 하고 다시 못 찾는 개인. 폰=업로드 기기, PC=조회·검색 기기 (같은 Supabase 계정 공유). 비전문가 기준의 단순함. |
| 첫 화면에서 바로 보여야 하는 것 | "업로드" 1차 액션 + 최근 기록 타임라인 요약 + 자연어 검색 진입점. 처리 중 항목이 있으면 진행 상태를 눈에 띄게. 비어 있으면 첫 업로드를 유도. |
| 입력(업로드) 화면 필드 | 파일 선택(갤러리 다중 선택, `image/*` 등) · 선택 파일 미리보기/개수 · (선택) 메모·태그 힌트 · 업로드 버튼. `captured_at`은 EXIF 자동 추출이라 수동 입력 불필요(없을 때만 보정). |
| 결과(검색·상세) 화면 정보 | RAG 답변 + **근거가 된 원본 기록(썸네일·날짜·카테고리·장소)** · 적용된 필터(시간/장소/카테고리) · 항목 상세는 원본 미리보기 + 추출 텍스트 + 메타데이터. 출처 없는 답변은 보여주지 않는다. |
| 로딩 / 오류 / 빈 상태 | 로딩: 단계형 진행 표시(`pending→processing→ready`), 스피너만 띄우지 않기. 오류: `failed` 사유 + **재시도 버튼**(파이프라인은 재시도 가능). 빈 상태: 검색 결과 0건·기록 0건일 때 다음 행동(업로드/필터 변경)을 안내. |
| 모바일에서 가장 중요한 버튼 | **업로드 버튼**(폰의 1차 역할). 엄지 닿는 위치(하단 고정)에 크고 명확하게. 다음 우선순위는 검색 진입. |
| 피해야 할 디자인 | ① 과한 장식(불필요한 그라데이션·애니메이션·정보 욱여넣기). ② 읽기 어려운 대비(저대비 텍스트, 작은 폰트 — 가독성 우선, WCAG 대비 확보). ③ **실제 데이터처럼 보이는 더미 개인정보**(실명·전화·주소·계좌 등) — 예시·목업은 명백한 합성 데이터만 사용(8번 금지사항). |

> UI 작업은 `designer` / `frontend-design` 에이전트에 위임한다(6번 참조).

---

## 6. Sub Agent 호출 규칙

**직접 처리:** trivial 작업, 단일 명령, 작은 설명, 단일 파일 소규모 수정.
**위임:** 멀티파일 변경·리팩터·디버깅·리뷰·계획·리서치·검증.

| 상황 | 에이전트 | 비고 |
|------|----------|------|
| 코드베이스 탐색·파일 찾기 | `explore` / `Explore` | 결론만 회수 |
| 요구사항이 모호 | `superpowers:brainstorming` | 추측 구현 금지. 결과는 `specs/`에 |
| 다단계 작업 계획 | `planner` / `writing-plans` | 계획은 `docs/superpowers/plans/`에 |
| 구현 | `executor` | 복잡하면 `model=opus` |
| 외부 SDK/API 사용법 | `document-specialist` | 레포 문서 우선, 필요 시 Context Hub/웹 |
| UI/UX 구현 | `designer` / `frontend-design` | 5번 화면·톤 기준 |
| 디버깅·근본원인 | `debugger` / `systematic-debugging` | |
| 코드 리뷰 | `code-reviewer` | 작성과 별도 패스 |
| 보안 검토(PII·JWT·키·RLS) | `security-reviewer` | 라이프로그는 민감정보 多 |
| 완료 검증 | `verifier` / `verification-before-completion` | 증거 수집 후 완료 주장 |

**규칙**

- 2개 이상 독립 작업은 **병렬**로 띄운다. 빌드·테스트 등 긴 작업은 `run_in_background`.
- **작성과 검토는 분리한다.** 같은 컨텍스트에서 자기 작업을 self-approve하지 않고, `code-reviewer`/`verifier`로 별도 검토 패스를 둔다.
- 레이어 경계(부록 B 참조)를 넘는 변경은 `architect`/`planner`로 설계를 먼저 정리한다.
- 여러 관점·역할 분담이 필요하면 OMC `/team`을 쓴다.

---

## 7. SSH 서버 반영 규칙

원격 서버(SSH) 배포·반영은 외부에 영향을 주는 행위이므로 다음을 지킨다.

- **계획부터 시작한다.** SSH 또는 배포 관련 요청은 곧장 명령을 실행하지 않고 반드시 계획을 먼저 세운다.
- **접속 정보를 CLAUDE.md에 쓰지 않는다.** 서버 주소·계정명·키 경로·비밀번호·API 키를 이 문서에 직접 적지 않는다(8번 참조).
- **`SERVER_RUNBOOK.md`를 먼저 정리한다.** 실제 반영 전에 저장소 루트의 `SERVER_RUNBOOK.md`에 실행 위치·포트·환경변수·실행 명령·롤백 방법을 정리한다. (비밀값은 변수명만, 실제 값은 시크릿 스토어/환경변수)
- **반영 전 사전 확인.** 실제 서버 반영 전에 ① 로컬 실행, ② 비밀값 노출 검사, ③ 발표 데모 흐름을 확인한다.
- **명령 실행 전 설명.** 서버에서 명령을 실행하기 전에 **어떤 명령을 왜 실행하는지** 사용자에게 설명하고 승인받는다. 한 번의 승인이 다음 작업까지 연장되지 않는다.

보완 규칙:
- **개인키는 절대 커밋·하드코딩 금지.** SSH 개인키·`known_hosts`·접속 정보는 로컬/시크릿 매니저에만 두고 저장소에 넣지 않는다.
- **prod 직접 편집 금지.** 서버에서 코드를 직접 수정하지 않는다. 변경은 저장소 → 배포 절차를 거쳐 반영하고, 서버는 배포 산출물만 받는다.
- **마이그레이션은 분리 단계로.** Alembic 마이그레이션(`alembic upgrade head`)은 배포와 별도로 명시적으로 실행하고, 실행 전 백업·롤백 경로를 확인한다(롤백 방법은 `SERVER_RUNBOOK.md`에).
- **시크릿은 서버 환경변수로.** 서버의 Clova·Supabase 키는 환경변수/시크릿 스토어로 주입하고, `.env`를 서버에 평문으로 올리지 않는다.

---

## 8. 금지사항

- **API 키·토큰을 코드/문서에 하드코딩하지 않는다.** Clova API 키·Supabase 키는 `config.py` settings(환경변수)로만 읽는다. `.env`는 커밋하지 않고 `.env.example`만 제공한다. Supabase **service role 키는 백엔드 전용**, React에는 **anon 키만** 노출한다.
- **SSH 개인키를 저장소에 넣지 않는다.** 키·접속정보는 로컬/시크릿 매니저에만 둔다.
- **실제 개인정보(PII)를 하드코딩하거나 로그에 출력하지 않는다.** 이미지 원본 내용, OCR로 추출한 텍스트, 사용자 식별자를 로그·코드·테스트 픽스처에 넣지 않는다. 예시는 합성 데이터를 쓴다.
- **실제 금융 데이터를 하드코딩하지 않는다.** 카드·계좌·결제 정보 등은 코드/테스트에 넣지 않는다.
- **테스트에서 실제 외부 API를 호출하지 않는다.** `integrations/` 경계에서 모킹한다.

---

## 부록 A. 아키텍처 — 인제스천 파이프라인이 핵심

시스템의 본질은 **모달리티별 처리 파이프라인**이다. 업로드와 처리를 분리하고, 모든 모달리티를 공통 텍스트 표현으로 정규화한 뒤 임베딩한다.

```
1. 업로드 (routers/ingest)
   - PWA가 갤러리 다중 선택 원본을 Supabase Storage에 직접 저장 → 경로+메타를 /ingest로 전달
   - (안드로이드) Web Share Target도 동일 경로로 수렴
   - Item 생성(status=pending), 즉시 202 응답, 처리는 백그라운드 위임
2. 처리 (services/pipeline)
   - 이미지/스크린샷/캡처 → HCX-005 비전(설명 + OCR 텍스트)
   ↓ 공통 텍스트 표현으로 정규화
3. 이해/분류 (services/classify) — HCX-005가 카테고리·태그·엔티티·captured_at 추출
4. 인덱싱 (services/index) — 청크 임베딩 → pgvector, status=ready
5. 검색 (routers/search + services/search) — 질의 임베딩 → 벡터 유사도 + 메타 필터 → HCX-005 재랭크/답변
```

**불변 규칙**

- 업로드 엔드포인트는 무거운 작업(LLM/임베딩)을 **동기 수행하지 않고** 항상 백그라운드 파이프라인에 위임한다.
- 처리 결과는 단계 2에서 **공통 텍스트 표현**으로 수렴한다. 새 모달리티를 추가하더라도 단계 2에 처리기 하나만 추가하면 되고, 이후 단계(분류/인덱싱/검색)는 모달리티를 모른다.
- `Item.status`(`pending → processing → ready / failed`)가 진행의 단일 진실원이다. 실패는 재시도 가능해야 한다.
- 큰 파일을 백엔드로 프록시하지 않는다 — 업로드는 클라이언트→Storage 직행, 백엔드는 경로만 받는다.

**플랫폼 제약(스펙 §2):** 브라우저 보안상 갤러리 자동 백그라운드 수집은 불가 → "폰에서 골라 업로드"가 1차 경로. Web Share Target은 안드로이드만 지원(iOS Safari 미지원). iOS도 갤러리 업로드·설치·푸시(16.4+) 가능.

---

## 부록 B. 레이어 경계

1. **Routers (`app/routers/`)** — HTTP 엔드포인트. 파싱/검증/응답 + JWT 검증만. 비즈니스 로직·외부 API 호출 금지.
2. **Services (`app/services/`)** — 파이프라인·분류·검색 등 도메인 로직.
3. **Integrations (`app/integrations/`)** — 외부 의존(HCX-005, Embedding, Storage) 래퍼. 서비스는 이 래퍼로만 외부 접근.
4. **Models (`app/models/`)** — SQLModel 테이블 + Pydantic 스키마. 입력 스키마 ≠ 테이블 스키마.
5. **DB (`app/db.py`)** — Supabase Postgres 엔진/세션. 세션은 `Depends` 주입, pgvector 등록.

**예상 디렉터리 구조**

```
app/                 # FastAPI 백엔드
  main.py            # 앱 생성, 라우터 등록, CORS
  config.py          # pydantic-settings (Supabase URL/키, Clova 키/엔드포인트)
  db.py  auth.py     # DB 세션·pgvector / Supabase JWT 검증
  models/  routers/  services/  integrations/
migrations/          # Alembic
tests/               # app/ 미러링; integrations 모킹
frontend/            # React PWA (Vite + TS)
  public/manifest.webmanifest   # 설치형, 아이콘, share_target(안드로이드)
  src/sw.ts  lib/supabase.ts  api/  pages/  components/
```

---

## 부록 C. 컨벤션

- **외부 호출은 `integrations/` 래퍼 경유.** 테스트는 이 경계에서 모킹, 실제 외부 API 호출 금지.
- **신뢰 경계는 Supabase JWT.** 보호 엔드포인트는 `auth.py`로 JWT 검증 후에만 `user_id` 사용. 클라이언트가 보낸 `user_id`를 그대로 믿지 않는다. 가능하면 RLS도 함께.
- **DB 접근은 주입된 세션으로.** 모듈 전역 세션 금지. pgvector 변경도 Alembic 리비전 동반.
- **시간은 UTC(timezone-aware)로 저장**, 표시 단계에서만 변환. `captured_at`은 EXIF 등 메타 우선, 없으면 업로드 시각.
- **처리는 멱등(idempotent)하게.** 같은 Item 재처리 시 청크/임베딩 중복 금지(item_id 기준 upsert/삭제 후 재삽입).
- **PII 주의.** 원본 내용·전사 텍스트·사용자 식별자를 로그에 출력하지 않는다(8번 참조).
