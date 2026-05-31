# life-log-agent — 수직 슬라이스(Walking Skeleton) 설계

- 작성일: 2026-05-31
- 상태: 확정 (브레인스토밍 승인)
- 브랜치: `spec/vertical-slice`
- 상위 설계: `docs/superpowers/specs/2026-05-31-life-log-platform-design.md`
- 범위: **사이클 1** — 전체 서비스의 첫 수직 슬라이스. 이후 사이클(Supabase, 실제 Clova, 멀티모달, 갤러리 수집)은 별도 spec→plan.

## 1. 목표

*사진 1장 업로드 → (스텁) 분류·임베딩 → SQLite 저장 → 자연어 검색으로 다시 찾기* 가 **화면에서 end-to-end로 한 번 도는** 최소 골격을 만든다.

성공 기준 (이게 되면 슬라이스 완료):
1. 사용자가 React 화면에서 이미지를 업로드하면 항목이 저장되고 목록에 나타난다.
2. 사용자가 검색창에 자연어로 입력하면, 관련 항목이 유사도 순으로 반환된다.
3. 외부 API 키·계정 없이 `clone → 설치 → 실행`만으로 위 흐름이 동작한다.

## 2. 핵심 결정 (브레인스토밍 결과)

| 항목 | 결정 | 근거 |
|------|------|------|
| 외부 AI(HCX-005/임베딩) | **스텁** — `integrations` 래퍼 뒤 고정 로직 | 키 없이 골격 검증, 다음 사이클에서 실제 Clova로 교체 |
| 데이터/저장 | **SQLite + 로컬 파일 디렉터리** | 외부 계정 0개 |
| 인증 | **생략** — 고정 `dev` 사용자 | 슬라이스 범위 최소화 |
| 벡터 검색 | **파이썬 코사인 유사도**(브루트포스) | 스텁 임베딩이면 pgvector 불필요 |
| 프론트 | **최소 React (Vite + TS)**, 2화면 | 실제 스택·재사용 가능 |
| 모달리티 | **이미지만** | STT·PDF는 다음 사이클 |

## 3. 아키텍처 (얇지만 실제 레이어 유지)

레이어 경계는 상위 설계(§3.4)와 **동일**하게 두되, 외부 의존 구현만 스텁이다. 이렇게 해야 다음 사이클에서 `integrations` 구현만 교체하고 `services`/`routers`는 그대로 둘 수 있다.

```
frontend/ (React + Vite)
  업로드 화면, 검색 화면 → 백엔드 REST 호출

app/ (FastAPI)
  routers/    ingest, items, search   # HTTP 파싱/응답만
  services/   pipeline, search        # 도메인 로직 (스텁/실제 무관)
  integrations/
    llm.py        # classify_and_describe(image_bytes) -> {text, category, tags}  [스텁]
    embeddings.py # embed(text) -> list[float]                                    [스텁]
    storage.py    # save(file) -> local_path / load(path)                         [로컬 FS]
  models/     Item (SQLModel)
  db.py       SQLite 엔진 + 세션 (Depends 주입)
  config.py   설정 (저장 경로 등; 시크릿 없음)
```

**계약(다음 사이클이 의존하는 인터페이스):**
- `integrations.llm.classify_and_describe(image_bytes) -> {text, category, tags}` — 스텁은 파일명/고정 규칙으로 그럴듯한 값 반환.
- `integrations.embeddings.embed(text) -> list[float]` — 스텁은 결정적(deterministic) 해시 기반 고정 차원 벡터 반환(같은 입력 → 같은 벡터).
- `integrations.storage` — 로컬 디렉터리 read/write.

## 4. 데이터 모델 — `Item`

| 필드 | 타입 | 비고 |
|------|------|------|
| id | int PK | |
| user_id | str | 슬라이스에선 항상 `"dev"` |
| filename | str | 원본 파일명 |
| local_path | str | 저장된 파일 경로 |
| status | str | `pending`/`processing`/`ready`/`failed` (구조 유지) |
| extracted_text | str | 스텁 설명/OCR 텍스트 |
| category | str | 스텁 분류 (예: 화장품/여행지/맛집/기타) |
| tags | JSON(list[str]) | 스텁 태그 |
| embedding | JSON(list[float]) | 스텁 임베딩 |
| created_at | datetime(UTC) | timezone-aware |

## 5. 엔드포인트 & 데이터 흐름

- `POST /ingest` (multipart 이미지)
  → `storage.save` → Item(status=pending) 생성
  → `services.pipeline`: `llm.classify_and_describe` + `embeddings.embed`
  → Item 갱신(text/category/tags/embedding, status=ready) → 201 반환
  스텁이라 빠르므로 **동기 처리**. 단 `status` 필드·파이프라인 단계 구조는 유지(다음 사이클 백그라운드화 대비).
- `GET /items` → 최신순 목록 (타임라인/카테고리 확인용)
- `POST /search` `{query}`
  → `embeddings.embed(query)` → 전체 Item과 **코사인 유사도** 계산 → 상위 10개 반환(점수 포함)

## 6. 에러 처리 & 엣지

- 업로드: 이미지 확장자/크기 검증, 실패 시 4xx + 메시지.
- 처리 실패: Item `status=failed`로 남기고 목록에 표시(증거 남김). 재업로드로 재처리.
- 빈 검색어: 4xx. 결과 없음: 빈 배열 + "결과 없음" UI.
- 멱등: 같은 파일 재업로드는 새 Item으로 취급(슬라이스 단순화), dedup은 범위 밖.

## 7. 테스트 전략

- pytest: `/ingest`→`/search` 해피패스(업로드한 항목이 관련 질의에서 상위로 반환되는지), 빈 검색어/잘못된 파일 4xx.
- 스텁 임베딩이 결정적이므로 유사도 결과가 재현 가능 → 안정적 단위 테스트.
- 프론트: 수동 확인(업로드→목록→검색) + 결과를 `VERIFY.md`에 기록.

## 8. 실행 (목표 UX)

```bash
# 백엔드
uv sync && uv run uvicorn app.main:app --reload
# 프론트
cd frontend && pnpm install && pnpm dev
```
키·계정 설정 단계 없음.

## 9. 명시적 제외 (다음 사이클들)

실제 Clova(HCX-005/임베딩), Supabase(Postgres/pgvector/Storage/Auth), 멀티모달(STT·PDF), 백그라운드 큐, 갤러리 다중 선택/Web Share Target, dedup, PWA 설치/오프라인 셸. — 모두 후속 사이클에서 `integrations` 교체 또는 기능 추가로 흡수.
