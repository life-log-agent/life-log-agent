# PPT_EVIDENCE.md — Day8 발표 자료 정리

> 발표 슬라이드에 넣을 **사실 근거 모음**. 코드/문서를 직접 읽고 정리했으며, 각 항목 끝에 출처 파일을 적었다.
> 정리일: 2026-06-07 · 기준 커밋: `7c09115` (브랜치 `deploy/prod-server-prep`, **실서버 반영 완료**)
> ⚠️ 이 문서 자체에는 실제 키·토큰·개인정보를 넣지 않았다. 발표 전 9번(민감정보) 항목을 반드시 확인할 것.

---

## 1. 프로젝트 한 줄 설명

**갤러리에 흩어진 사진·스크린샷·캡처를 한곳에 모으면, AI가 내용을 자동으로 추출·분류하고 나중에 자연어로 검색·질의(RAG)할 수 있는 반응형 PWA + FastAPI 라이프로그 서비스.**

> "여기저기 저장만 하고 다시 못 찾는" 개인 기록을, 찾을 수 있는 기록으로.

출처: `README.md:1-11`, `CLAUDE.md §1`

---

## 2. 대상 사용자와 문제

| 구분 | 내용 |
|------|------|
| **대상 사용자** | 자신의 기록을 여기저기 저장만 하고 다시 찾지 못하는 개인 사용자 |
| **문제** | 스크린샷·사진·캡처가 갤러리에 쌓이지만, 나중에 "그거 어디 저장했더라"로 다시 못 찾음 |
| **사용 형태** | 폰 = **업로드 기기**(갤러리 다중 선택), PC = **조회·검색 기기**. 같은 Supabase 계정 공유 |

**대표 시나리오**
- "사고 싶었던 화장품 캡처만 모아줘"
- "지난달 제주도 여행 때 갔던 흑돼지 식당 어디였지?"

출처: `README.md:5-11`, `CLAUDE.md §2`

---

## 3. 실제 동작하는 MVP 주요 기능 흐름

**인제스천 파이프라인 (업로드와 처리를 분리, 공통 텍스트 표현으로 정규화 후 임베딩)**

```
1. 업로드   PWA가 원본을 Supabase Storage에 직행 업로드 → 경로+메타만 POST /ingest
            → Item(status=pending) 생성, 즉시 202 응답, 처리는 백그라운드 위임
2. 처리     이미지 → HCX-005 비전 (OCR 텍스트 + 설명)        ─┐
3. 분류     HCX-005가 카테고리·태그·장소·요약 추출            ├ 공통 텍스트 표현
4. 인덱싱   청크 텍스트 → Clova 임베딩(1024차원) → pgvector   ─┘  status=ready
5. 검색     질의 임베딩 → 벡터 유사도 + 메타 필터 → HCX-005 답변 합성
```

- 상태 머신: `Item.status = pending → processing → ready / failed` (진행의 단일 진실원, `failed`는 재시도 가능)
- 업로드는 무거운 작업을 동기 수행하지 않고 **FastAPI BackgroundTasks**로 분리 (`ingest.py:47`)
- 큰 파일을 백엔드로 프록시하지 않음 — **클라이언트 → Storage 직행**, 백엔드는 경로만 수신
- EXIF에서 `captured_at`(촬영 시각) 자동 추출, 없으면 보정 (`pipeline.py:18`)

**핵심 API**

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/ingest` | 업로드 수신 → 파이프라인 백그라운드 시작 (202). **storage_path 본인 경로 검증** |
| `POST` | `/ingest/{id}/retry` | `failed`/`pending` 아이템 재처리 |
| `GET`  | `/items` | 내 기록 목록 (status·category 필터, 최신순) |
| `GET`  | `/items/{id}` | 기록 상세 |
| `GET`  | `/items/{id}/signed-url` | 원본 이미지 Signed URL |
| `DELETE` | `/items/{id}` | 기록 삭제 (청크 먼저 정리 후 삭제) |
| `POST` | `/search` | 자연어 검색 + RAG 질의응답 |
| `GET`  | `/health` | 헬스 체크 |

> 모든 데이터 엔드포인트는 `Authorization: Bearer <Supabase JWT>` 필요.

출처: `app/services/pipeline.py`, `app/routers/{ingest,items,search}.py`, `app/services/index.py`, `README.md:38-98`

---

## 4. AI 기능의 입력과 출력

모든 외부 AI 호출은 `app/integrations/` 래퍼를 경유한다 (교체·모킹 용이성).

| AI 기능 | 모델 | 입력 | 출력 | 위치 |
|---------|------|------|------|------|
| **OCR + 이미지 설명** | HCX-005 (비전) | 이미지 Signed URL | `OCR: <추출 텍스트>` + `설명: <한국어 설명>` 텍스트 | `integrations/llm.py:71 describe_image` |
| **자동 분류** | HCX-005 | 이미지 설명 텍스트 | JSON `{category, tags(≤5), place, summary}` · category는 **화장품/여행지/맛집/기타** 중 하나로 보정 | `integrations/llm.py:92 classify_image` + `services/classify.py` |
| **텍스트 임베딩** | Clova Embedding v2 | 청크 텍스트(요약+OCR+태그+장소+카테고리, ≤2000자) | **1024차원** 부동소수 벡터 → pgvector | `integrations/embeddings.py:15 embed_text` |
| **RAG 답변 합성** | HCX-005 | 질의 + 관련 기록 컨텍스트(점수 포함) | JSON `{answered: bool, text}` | `integrations/llm.py:126 synthesize_answer` |

**환각 방지 설계 (발표 강조 포인트)**
- 유사도 `_MIN_SCORE = 0.30` 미만 청크는 LLM에 넘기지 않음 (`services/search.py:14`)
- 시스템 프롬프트로 **"오직 등록된 기록만 근거로, 기록 밖 일반 지식 사용 금지"** 강제, `answered=false`면 근거 없는 답변을 화면에 내지 않음 (`llm.py:140-148`, `search.py:84-86`)
- 결과 없음/근거 없음일 때: "등록된 사진 기반으로는 알 수 없는 정보입니다…" 안내
- 통신 방식: HCX-005는 **SSE 스트리밍**으로 응답 수신 (`llm.py:42-68`)

출처: `app/integrations/llm.py`, `app/integrations/embeddings.py`, `app/services/{classify,search,index}.py`

---

## 5. 사용한 Ncloud 서비스와 이유

| 서비스 | 역할 | 선택 이유 |
|--------|------|-----------|
| **Clova Studio HCX-005** (비전 멀티모달) | 이미지 OCR·설명, 자동 분류, RAG 답변 합성 | 비전 멀티모달이라 **별도 OCR 엔진 없이** 한 모델로 OCR·이해·생성을 처리. 한국어 품질 우수. SSE 스트리밍 응답 |
| **Clova Studio Embedding (v2)** | 한국어 우선 텍스트 임베딩 (1024차원) | LLM과 **동일 제공자로 정렬**, 한국어 검색 품질 확보. pgvector에 그대로 저장 |
| **NCloud 컴퓨트 서버 (Ubuntu)** | 백엔드(FastAPI) + 프론트(정적 빌드) 셀프 호스팅 | 단일 공인 IP 서버에 systemd로 상시 구동, Nginx 리버스 프록시 + Let's Encrypt HTTPS |

> 데이터 플랫폼(Postgres·pgvector·Storage·Auth)은 **Supabase 매니지드 클라우드**를 사용 — 서버는 앱만 호스팅.

출처: `CLAUDE.md §4`, `app/integrations/llm.py:14`, `app/config.py:18-26`, `SERVER_RUNBOOK.md §0`

---

## 6. 데모 화면 목록

React PWA, 모바일 우선 반응형, 단계형(가이드형) 흐름. 라우트 정의: `frontend/src/App.tsx`

| 그룹 | 화면 | 라우트 | 비고 |
|------|------|--------|------|
| 진입 | 로그인 / 온보딩 | `/onboarding` | Supabase Auth |
| 진입 | 홈 — 기록 있음 / 빈 상태 | `/home`, `/home-empty` | 최근 타임라인 요약 + 업로드 진입 |
| 입력→처리 | 업로드 | `/upload` | 갤러리 다중 선택 (`image/*`) |
| 입력→처리 | 처리 상태 / 실패·재시도 | `/processing`, `/processing-failed` | `pending→processing→ready/failed` 표시, 실패 시 재시도 |
| 결과→검색 | 분류 결과 / 타임라인 | `/timeline` | 카테고리·태그·시점 기준 |
| 결과→검색 | 검색 / 질의응답(RAG) / 결과 0건 | `/search`, `/search-empty` | 답변 + 근거 기록 함께 표시 |
| 결과→검색 | 항목 상세 | `/detail/:id` | 원본 미리보기 + 추출 텍스트·메타데이터 |

> 화면 파일: `frontend/src/screens/` — Onboarding · Home · HomeEmpty · Upload · Processing · ProcessingFailed · Timeline · Search · SearchEmpty · Detail (10개)
> 보호 라우트는 미로그인 시 `/onboarding`으로 리다이렉트.

출처: `frontend/src/App.tsx`, `frontend/src/screens/*`, `CLAUDE.md §5`

---

## 7. 테스트 결과와 오류 수정 기록

### 7-A. 자동 테스트 결과 (실측)

```
uv run pytest -q  →  15 passed (0.32s)
uv run ruff check .  →  All checks passed!
```
- 외부 API는 `integrations/` 경계에서 **모킹**, 실제 호출 없음 (`tests/conftest.py`)

| 파일 | 검증 내용 | 개수 |
|------|-----------|------|
| `tests/test_auth.py` | JWT(ES256) 검증 회귀 — 유효 토큰 통과, **위조 서명·sub 누락·잘못된 audience·만료·HS256 혼동 거부**, 에러 메시지 내부정보 미노출 | 7 |
| `tests/test_ingest.py` | `POST /ingest` 202·pending, 파이프라인 큐잉, **타인 경로 403 거부**, **경로 traversal(`..`) 403 거부**, retry 404, retry 상태 리셋 | 6 |
| `tests/test_search.py` | `POST /search` 답변 반환, 필터(category·place) 서비스 전달 | 2 |

> ⚠️ 발표 주의: `FUNCTION_TEST_PLAN.md`는 **greenfield 시절 초안**(스텁 64차원·코드 없음 가정)이라 현재 구현과 불일치. 발표엔 위 실측 결과(**15 passed**)를 쓸 것.

### 7-B. 오류 수정 기록 (git 커밋 근거)

| 커밋 | 수정 내용 | 의미 |
|------|-----------|------|
| `7c09115` | **보안: storage_path 인가 검증(IDOR 차단) + PII 로그 제거 + 운영정보 마스킹** | 클라이언트가 보낸 경로를 검증 없이 쓰던 IDOR(타인 이미지 접근 가능)를 **본인 프리픽스 강제**로 차단. 분류 로그에서 PII 제거. **실서버 반영 완료** |
| `7d606dd` | **captured_at naive/aware 불일치로 처리 영구 정지 수정** | EXIF aware datetime을 naive 컬럼에 넣다 asyncpg 거부 → `processing`에 갇히던 버그. 예외 시 rollback 후 `failed` 저장으로 재시도 가능하게. **실서버 반영 완료** |
| `625f0d5` | **Supabase 비대칭(ES256/JWKS) JWT 검증으로 교체** | 과거 `verify_signature=False` 보안 결함 해결 |
| `28a0948` | alembic용 `psycopg2-binary` 의존성 추가 | 마이그레이션 실행 가능 |
| `b56ff1d` | RAG 답변을 등록된 사진 기반으로만 제한 | 환각 방지 |
| `91ef13e` | 분류 카테고리 한국어 통일 (화장품·여행지·맛집·기타) | 일관성 |
| `8a9a308` | 기록 삭제 시 FK 위반·async lazy-load 오류 해결 | 삭제 안정화 |
| `87b4eec` | 검색 결과 카드 클릭→상세 이동, 이미지 미리보기 | UX |
| `e4ffb5e` | 상세 페이지 스크롤·이미지 로드 실패 폴백 | UX |

> 발표 스토리 추천: "**실배포 중 발견한 captured_at 버그(7d606dd)를 근본 원인까지 추적 → 수정 → 서버 반영**, 이어 **배포 전 보안 점검에서 IDOR를 직접 발견·차단(7c09115)**" — 디버깅 + 보안 역량을 함께 보여줌.

출처: `git log`, `app/services/pipeline.py`, `app/routers/ingest.py`, `app/auth.py`, `tests/*`

---

## 8. README / 사용 방법 문서 상태

| 문서 | 상태 | 비고 |
|------|------|------|
| `README.md` | ✅ **현행화됨** (실제 구현 기준, `1b7b005`) | 기능·스택·아키텍처·API·환경변수·실행/점검 명령 포함 |
| `SERVER_RUNBOOK.md` | ✅ 실배포 기록 + RLS 부록 포함 | 서버 준비~Nginx/HTTPS~검증 단계. 실 IP는 `<SERVER_IP>`로 마스킹됨 |
| `CLAUDE.md` / `AGENTS.md` | ✅ 거버넌스·작업 규칙 | 아키텍처·레이어 경계·컨벤션 |
| `DESIGN_BRIEF/HANDOFF/QA.md` | ✅ 디자인 산출물 | 화면·톤 기준 |
| `FUNCTION_TEST_PLAN.md` | ⚠️ **stale (초안)** | greenfield 가정 — 실제 구현과 불일치. 발표 인용 시 주의 |

> README만으로 환경변수·실행(`uv sync` → `uvicorn`, `pnpm dev`)·점검(`pytest`/`ruff`/`mypy`/`lint`) 흐름이 모두 안내됨.

출처: `README.md:100-159`

---

## 9. 발표에서 빼야 할 민감정보 ⚠️

발표 슬라이드·화면 공유·공개 저장소에서 **반드시 가리거나 제외**할 것.

### 9-A. 서버 접속 정보
- 공인 IP, 호스트네임 `…nip.io`, 계정 `root@data-server-01` — 실제 값은 슬라이드/공유에서 가릴 것
- SSH 키 경로, ed25519 접속 방식
- → `SERVER_RUNBOOK.md`는 이미 `<SERVER_IP>`로 마스킹됨. 슬라이드에도 동일하게 마스킹. (터미널/`hostname -I` 등 실 IP가 보이는 화면 공유 주의)

### 9-B. 키·시크릿 (변수명만 노출 OK, 실제 값 절대 금지)
- `SUPABASE_SERVICE_ROLE_KEY`(백엔드 전용), `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, `DATABASE_URL`
- `CLOVA_API_KEY`, `CLOVA_API_SECRET`
- → 코드/문서는 환경변수로만 읽도록 되어 있어 값 자체는 저장소에 없음(`.env`는 `.gitignore`). **데모 중 `.env`·터미널 env·`/docs` 인증 토큰 노출 금지**

### 9-C. 개인정보(PII)
- **데모 로그인 이메일** — 온보딩/홈 화면에 `session.user.email`이 표시됨. 데모용 계정 사용 권장
- **JWT 토큰** — 브라우저 개발자도구/네트워크 탭에 `Authorization: Bearer …`로 노출됨. 화면 공유 시 개발자도구 닫기
- **업로드 사진의 실제 내용** — 실제 개인 사진을 올리면 OCR 추출 텍스트·메타가 화면에 노출됨. **데모는 합성/비민감 이미지만** 사용
- 원본 내용·OCR 텍스트·사용자 식별자는 **로그에 출력하지 않도록 설계**됨 (`classify.py:27`은 category·개수만 로깅, `CLAUDE.md §8`)

출처: `SERVER_RUNBOOK.md` 부록, `app/config.py`, `frontend/src/App.tsx`, `app/services/classify.py`, `CLAUDE.md §8`

---

### 부록 — 한 장 요약 (슬라이드 표지용)

> **life_log** — 사진·스크린샷을 올리면 AI(Clova HCX-005)가 OCR·분류하고, 자연어로 검색·질의(RAG)하는 PWA.
> FastAPI + Supabase(pgvector) + Clova Studio. 백엔드 테스트 **15 passed** · ruff clean. 실서버(NCloud) 배포 완료 + 배포 전 보안 점검(IDOR 차단·PII 로그 제거) 반영.
