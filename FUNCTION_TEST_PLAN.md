# FUNCTION_TEST_PLAN.md — 기능 검증 계획 (초안)

- 작성: 기능 검증팀장 관점
- 작성일: 2026-06-06
- 상태: **초안 (리뷰 대기).** 프로젝트 코드는 아직 없음(greenfield, 문서 단계).
- 근거 문서:
  - `docs/superpowers/specs/2026-05-31-life-log-platform-design.md` (상위 설계)
  - `docs/superpowers/plans/2026-05-31-vertical-slice.md` (사이클 1 구현 계획 — **실제 빌드 대상**)
  - `docs/superpowers/specs/2026-05-31-vertical-slice-design.md` (사이클 1 설계)
  - `docs/superpowers/specs/2026-05-31-categorized-organization-and-search-design.md` (사이클 2+ 기능)
  - `CLAUDE.md`, `AGENTS.md`, `README.md`

> **시크릿 표기 규칙:** API 키·토큰·쿠키·개인키처럼 보이는 값은 원문으로 적지 않고 `<redacted>`로 표시한다. 테스트 픽스처·로그·이 문서 어디에도 실제 PII(실명·전화·주소·계좌)나 추출 텍스트 원문을 넣지 않는다(합성 데이터만 사용).

---

## 0. 현재 코드 상태 (검증 전 사실 확인)

- 저장소에 **소스 코드 없음.** 추적 파일은 거버넌스 문서(`CLAUDE.md`/`AGENTS.md`/`README.md`), 설계·계획 문서(`docs/superpowers/**`), 서브에이전트 정의(`.claude/agents/**`), OMC 상태(`.omc/**`)뿐.
- `package.json`·`pyproject.toml`·`requirements.txt`·`app/`·`frontend/` **모두 부재.**
- 따라서 본 계획은 **사이클 1(수직 슬라이스)이 구현되면 즉시 적용할 테스트 시나리오**다. 구현 전에는 "미구현"으로 표기하고 통과로 적지 않는다(AGENTS.md 규칙).

---

## 1. 실제 기능 목록 (문서 기준)

### 1-A. 사이클 1 — 수직 슬라이스 (지금 빌드되는 것)

| # | 기능 | 엔드포인트/화면 | 비고 |
|---|------|------------------|------|
| F1 | 이미지 업로드 | `POST /ingest` (multipart) / 업로드 화면 | image/* 검증, 10MB 상한 |
| F2 | 자동 처리(스텁) | `services/pipeline.process_upload` | 저장→분류·임베딩→`status=ready`, 동기(스텁) |
| F3 | 분류(스텁) | `integrations/llm.classify_and_describe` | 파일명 토큰→카테고리(화장품/여행지/맛집/기타)+태그 |
| F4 | 임베딩(스텁) | `integrations/embeddings.embed` | 결정적 해시 64차원 |
| F5 | 목록 조회 | `GET /items` / 결과 영역 | 최신순 |
| F6 | 자연어 검색 | `POST /search {query}` / 검색 화면 | 코사인 유사도 상위 10, 점수 포함 |
| F7 | 로컬 저장 | `integrations/storage.save/load` | 로컬 디렉터리(외부 계정 0) |

상태 모델: `Item.status = pending → processing → ready / failed`.

### 1-B. 사이클 2+ — 후속 (이번 검증 범위 밖, 별도 표기)

실제 Clova HCX-005(비전·임베딩), Supabase(Postgres/pgvector/Storage/Auth + JWT/RLS), 백그라운드 처리, 갤러리 다중 선택, 안드로이드 Web Share Target, dedup, PWA 설치/오프라인 셸, 하이브리드 분류(장소 딥링크·쇼핑 카드·`captured_at`·`category_data`). — 구현되면 본 문서에 섹션 추가.

---

## 2. 기능별 테스트 시나리오 (사이클 1)

각 시나리오: **입력 → 처리 중 → 결과 → 재시도 → 오류/빈 상태**. 자동 테스트는 `pytest`(백)·수동(프론트) 기준.

### F1 + F2 + F3 + F4 + F7 — 업로드 & 자동 처리

| 단계 | 기대 동작 | 검증 방법 |
|------|-----------|-----------|
| 입력 | image/* 1장 선택 → `POST /ingest` | 합성 이미지 바이트(`b"imgbytes"`), 파일명 `cosmetic_lipstick.png` |
| 처리 중 | Item `processing` 단계 경유 후 분류·임베딩 | 스텁이라 동기 — 구조만 확인 |
| 결과 | `201` + Item `status=ready`, `category=화장품`, `tags`에 `lipstick`, `embedding` 64차원 | 응답 JSON 단언 |
| 재시도 | 같은 파일 재업로드 → 새 Item(슬라이스는 dedup 범위 밖) | `GET /items` 개수 증가 확인 |
| 오류 | 비이미지(`text/plain`) → `400` "이미지 파일만 허용됩니다" | `POST /ingest` with txt |
| 오류 | 10MB 초과 → `400` "파일이 너무 큽니다" | 경계 바이트 |
| 처리 실패 | 분류 중 예외 → `status=failed`로 남고 목록에 표시(증거) | 의존성 모킹으로 예외 유발 |
| 빈 상태 | 업로드 0건 → `GET /items` 빈 배열 | 초기 상태 |

### F5 — 목록 조회

| 단계 | 기대 동작 |
|------|-----------|
| 결과 | `GET /items` → 최신순 배열, 각 항목에 status/category/tags |
| 빈 상태 | 항목 0건 → `[]`, 프론트 "결과 없음/첫 업로드 유도" |

### F6 — 자연어 검색

| 단계 | 기대 동작 | 검증 |
|------|-----------|------|
| 입력 | `POST /search {"query":"lipstick"}` | |
| 결과 | `200` + 유사도 내림차순, 관련 항목 1위, `score>0` | 결정적 임베딩이라 재현 가능 |
| 재시도 | 다른 질의로 재검색 | 순위 변동 확인 |
| 오류 | 빈/공백 질의 → `400` "query is empty" | `{"query":"   "}` |
| 빈 상태 | 매칭 0 → 빈 배열, 프론트 "결과 없음 + 필터/업로드 안내" | |

### 프론트 2화면 (수동 — Vitest 자동화는 다음 사이클)

| 화면 | 입력 | 처리 중 | 결과 | 오류/빈 |
|------|------|---------|------|---------|
| 업로드 | `<input accept="image/*">` 선택 | "업로드 중..." | "업로드 완료: {파일명}" | 실패 메시지 표시 |
| 검색 | 질의 입력 → 검색 | (즉시) | 카테고리·파일명·텍스트·score 리스트 | "결과 없음" |

모바일: 세로 단순 흐름, 텍스트 줄바꿈(`word-break`)으로 겹침 방지(AGENTS.md UI 규칙).

---

## 3. 발표 데모 경로 (Happy Path, 재현 가능)

> 외부 키·계정 0개. `clone → 설치 → 실행`만으로 동작해야 함(슬라이스 성공 기준 3).

1. 백엔드 기동: `uv sync && uv run uvicorn app.main:app --reload`
2. 프론트 기동: `cd frontend && pnpm install && pnpm dev` → `http://localhost:5173`
3. **업로드:** 합성 이미지(`cosmetic_lipstick.png`) 선택 → "업로드 완료" 표시
4. **목록 확인:** 항목이 `[화장품]`으로 분류되어 나타남
5. **검색:** `lipstick` 입력 → 해당 항목이 결과 상단(`score>0`)
6. (대비) **오류 데모:** 빈 검색어 → "결과 없음/오류" / 비이미지 업로드 → 400 안내
7. 자동 테스트 증거: `uv run pytest -v` 전부 PASS 캡처 → `VERIFY.md`에 첨부

**데모 안전장치:**
- 데모용 합성 이미지만 사용(실제 PII 없는 이미지). 파일명도 합성(`cosmetic_lipstick.png`, `jeju_travel.png`).
- 네트워크/외부 API 의존 없음(스텁) → 오프라인에서도 데모 가능.
- 시크릿 입력 단계 없음. 화면·콘솔·로그에 `<redacted>` 대상 값이 절대 등장하지 않음을 사전 확인.

---

## 4. 검증 게이트 (완료로 적기 전 충족)

- [ ] `uv run pytest -v` 전부 PASS (출력 캡처 보관)
- [ ] 수동 e2e(업로드→목록→검색) 실제 동작 — `VERIFY.md`에 관찰 결과 기록
- [ ] 빈 검색어·비이미지 업로드 4xx 확인
- [ ] 키·계정 없이 clone→run 재현
- [ ] 로그/응답/화면에 PII·시크릿 미노출 확인(`<redacted>` 규칙 준수)
- 확인 못 한 항목은 "미확인"으로 남기고 통과로 적지 않는다.

---

## 5. 보안·프라이버시 검증 체크(슬라이스 한정)

- 시크릿 없음이 슬라이스 전제 → 코드/문서/로그에 키·토큰 부재 확인(있으면 `<redacted>`).
- 추출 텍스트·파일 내용·사용자 식별자를 로그로 출력하지 않음(스텁도 동일 규칙).
- 고정 `dev` 사용자/무인증은 **슬라이스 한정** — 사이클 2(Supabase Auth/JWT/RLS) 전까지 외부 노출 금지.

---

## 6. 사이클 2+ 진입 시 추가될 테스트(미리 식별)

- 실제 Clova 응답 모킹 경계(`integrations/`)에서 단위 테스트, **실제 API 미호출**.
- 임베딩 차원 변경(스텁 64 → 실제 Clova 차원) 시 pgvector 컬럼·마이그레이션 검증.
- JWT 검증·RLS·service role/anon 키 분리 테스트.
- 백그라운드 처리 전환 시 `pending→processing→ready/failed` 비동기 상태 전이 검증.
- 하이브리드 분류(장소 딥링크 URL 형식, 쇼핑 카드 필드, `captured_at` EXIF 우선) 검증.
