# Vertical Slice (Walking Skeleton) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미지 1장 업로드 → 스텁 분류·임베딩 → SQLite 저장 → 자연어 코사인 검색이 화면에서 end-to-end로 도는 최소 골격을 만든다.

**Architecture:** FastAPI 백엔드(routers→services→integrations→models 레이어)와 최소 React(Vite) 프론트. 외부 AI/Storage는 `integrations/` 래퍼 뒤에 스텁으로 두어, 다음 사이클에서 구현만 Clova/Supabase로 교체한다. 데이터는 SQLite, 원본 파일은 로컬 디렉터리, 인증은 고정 `dev` 사용자.

**Tech Stack:** Python 3.12, FastAPI, SQLModel(SQLite), python-multipart, pytest, React + Vite + TypeScript. 외부 키·계정·추가 라이브러리 없음(코사인은 순수 파이썬).

---

## 파일 구조

```
pyproject.toml                  # 백엔드 의존성·도구 설정
app/
  __init__.py
  config.py                     # settings (db_path, data_dir) — 시크릿 없음
  db.py                         # SQLite 엔진, init_db, get_session
  models.py                     # Item (SQLModel 테이블)
  integrations/
    __init__.py
    embeddings.py               # embed(text) -> list[float]  [스텁]
    llm.py                      # classify_and_describe(bytes, filename) -> dict  [스텁]
    storage.py                  # save(bytes, filename) -> path / load(path) -> bytes  [로컬]
  services/
    __init__.py
    search.py                   # cosine(), search_items()
    pipeline.py                 # process_upload()
  routers/
    __init__.py
    ingest.py                   # POST /ingest
    items.py                    # GET /items
    search.py                   # POST /search
  main.py                       # FastAPI 앱, CORS, 라우터 등록, lifespan(init_db)
tests/
  conftest.py                   # session/client fixture (인메모리 SQLite)
  test_integrations.py
  test_services.py
  test_e2e.py
frontend/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  src/main.tsx
  src/api.ts
  src/App.tsx
VERIFY.md                       # 검증 결과 기록 (마지막 단계)
```

---

## Task 1: 백엔드 스캐폴드 (의존성 + 설정)

**Files:**
- Create: `pyproject.toml`
- Create: `app/__init__.py` (빈 파일)
- Create: `app/config.py`

- [ ] **Step 1: `pyproject.toml` 작성**

```toml
[project]
name = "life-log-agent"
version = "0.1.0"
description = "AI life-log agent — vertical slice"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "sqlmodel>=0.0.22",
    "python-multipart>=0.0.9",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "httpx>=0.27",
]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
```

- [ ] **Step 2: 빈 패키지 파일 생성**

`app/__init__.py` — 빈 파일로 생성.

- [ ] **Step 3: `app/config.py` 작성**

```python
import os
from pathlib import Path


class Settings:
    """환경변수로 덮어쓸 수 있는 단순 설정. 시크릿 없음."""
    db_path: Path = Path(os.environ.get("LIFELOG_DB_PATH", "lifelog.db"))
    data_dir: Path = Path(os.environ.get("LIFELOG_DATA_DIR", "_data"))


settings = Settings()
```

- [ ] **Step 4: 의존성 설치 확인**

Run: `uv sync --extra dev`
Expected: 가상환경 생성, 위 패키지 설치 성공.

- [ ] **Step 5: Commit**

```bash
git add pyproject.toml app/__init__.py app/config.py
git commit -m "chore: 백엔드 스캐폴드 (의존성 + 설정)"
```

---

## Task 2: Item 모델 + DB + 테스트 픽스처

**Files:**
- Create: `app/models.py`
- Create: `app/db.py`
- Create: `tests/conftest.py`
- Test: `tests/test_services.py` (모델 왕복 테스트로 시작)

- [ ] **Step 1: `app/models.py` 작성**

```python
from datetime import datetime, timezone

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Item(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = "dev"
    filename: str
    local_path: str
    status: str = "pending"  # pending | processing | ready | failed
    extracted_text: str = ""
    category: str = ""
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    embedding: list[float] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=_utcnow)
```

- [ ] **Step 2: `app/db.py` 작성**

```python
from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

engine = create_engine(
    f"sqlite:///{settings.db_path}",
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
```

- [ ] **Step 3: `tests/conftest.py` 작성 (인메모리 SQLite 세션 픽스처)**

```python
import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import app.models  # noqa: F401  (테이블 등록)


@pytest.fixture
def engine():
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(eng)
    return eng


@pytest.fixture
def session(engine):
    with Session(engine) as s:
        yield s
```

- [ ] **Step 4: 모델 왕복 테스트 작성 (`tests/test_services.py`)**

```python
from app.models import Item


def test_item_roundtrip(session):
    item = Item(filename="a.png", local_path="_data/a.png",
                tags=["x"], embedding=[1.0, 0.0], status="ready")
    session.add(item)
    session.commit()
    session.refresh(item)
    assert item.id is not None
    assert item.tags == ["x"]
    assert item.embedding == [1.0, 0.0]
    assert item.user_id == "dev"
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

Run: `uv run pytest tests/test_services.py::test_item_roundtrip -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/models.py app/db.py tests/conftest.py tests/test_services.py
git commit -m "feat: Item 모델 + SQLite + 테스트 픽스처"
```

---

## Task 3: integrations 스텁 (embeddings, llm, storage)

**Files:**
- Create: `app/integrations/__init__.py` (빈 파일)
- Create: `app/integrations/embeddings.py`
- Create: `app/integrations/llm.py`
- Create: `app/integrations/storage.py`
- Test: `tests/test_integrations.py`

- [ ] **Step 1: embeddings 실패 테스트 작성 (`tests/test_integrations.py`)**

```python
from app.integrations.embeddings import DIM, embed


def test_embed_is_deterministic():
    assert embed("hello world") == embed("hello world")


def test_embed_dimension_and_empty():
    v = embed("hello world")
    assert len(v) == DIM
    assert embed("") == [0.0] * DIM


def test_embed_shares_signal_for_shared_token():
    # 같은 토큰을 포함하면 같은 인덱스가 증가한다
    a = embed("lipstick")
    b = embed("cosmetic lipstick")
    shared = [i for i, (x, y) in enumerate(zip(a, b)) if x > 0 and y > 0]
    assert shared, "공유 토큰이 같은 인덱스에 반영되어야 한다"
```

- [ ] **Step 2: 실행하여 실패 확인**

Run: `uv run pytest tests/test_integrations.py -v`
Expected: FAIL (`ModuleNotFoundError: app.integrations.embeddings`).

- [ ] **Step 3: `app/integrations/__init__.py` 빈 파일 + `embeddings.py` 작성**

```python
import hashlib
import re

DIM = 64


def _tokenize(text: str) -> list[str]:
    return [t for t in re.split(r"[\W_]+", text.lower()) if t]


def embed(text: str) -> list[float]:
    """결정적 해시 기반 bag-of-tokens 벡터 (스텁). 같은 입력 → 같은 벡터."""
    vec = [0.0] * DIM
    for tok in _tokenize(text):
        idx = int(hashlib.md5(tok.encode("utf-8")).hexdigest(), 16) % DIM
        vec[idx] += 1.0
    return vec
```

- [ ] **Step 4: 실행하여 통과 확인**

Run: `uv run pytest tests/test_integrations.py -v`
Expected: 3개 PASS.

- [ ] **Step 5: llm 스텁 테스트 추가 (`tests/test_integrations.py`에 append)**

```python
from app.integrations.llm import classify_and_describe


def test_llm_classifies_known_keyword():
    out = classify_and_describe(b"fakebytes", "cosmetic_lipstick.png")
    assert out["category"] == "화장품"
    assert "lipstick" in out["tags"]
    assert "lipstick" in out["text"]


def test_llm_unknown_keyword_is_etc():
    out = classify_and_describe(b"x", "IMG_1234.png")
    assert out["category"] == "기타"
```

- [ ] **Step 6: 실행하여 실패 확인**

Run: `uv run pytest tests/test_integrations.py -k llm -v`
Expected: FAIL (`ModuleNotFoundError: app.integrations.llm`).

- [ ] **Step 7: `app/integrations/llm.py` 작성**

```python
import re

# 파일명 토큰 → 카테고리 매핑 (스텁용 소규모 사전)
CATEGORY_MAP = {
    "cosmetic": "화장품", "cosmetics": "화장품", "lipstick": "화장품", "skincare": "화장품",
    "travel": "여행지", "jeju": "여행지", "trip": "여행지",
    "food": "맛집", "restaurant": "맛집", "pork": "맛집",
}


def _tokens(filename: str) -> list[str]:
    stem = filename.rsplit(".", 1)[0]
    return [t for t in re.split(r"[\W_]+", stem.lower()) if t]


def classify_and_describe(image_bytes: bytes, filename: str) -> dict:
    """이미지 분석 스텁: 파일명에서 텍스트·카테고리·태그를 만든다.

    다음 사이클에서 실제 HCX-005 비전 호출로 교체된다 (시그니처 동일).
    """
    tokens = _tokens(filename)
    text = " ".join(tokens) if tokens else "image"
    category = "기타"
    for t in tokens:
        if t in CATEGORY_MAP:
            category = CATEGORY_MAP[t]
            break
    return {"text": text, "category": category, "tags": tokens}
```

- [ ] **Step 8: 실행하여 통과 확인**

Run: `uv run pytest tests/test_integrations.py -k llm -v`
Expected: 2개 PASS.

- [ ] **Step 9: storage 테스트 추가 (`tests/test_integrations.py`에 append)**

```python
from app.integrations import storage


def test_storage_save_and_load(tmp_path, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "data_dir", tmp_path)
    path = storage.save(b"hello-bytes", "note.png")
    assert storage.load(path) == b"hello-bytes"
    assert path.endswith("note.png")
```

- [ ] **Step 10: 실행하여 실패 확인**

Run: `uv run pytest tests/test_integrations.py -k storage -v`
Expected: FAIL (`AttributeError`/`ModuleNotFoundError`).

- [ ] **Step 11: `app/integrations/storage.py` 작성**

```python
import uuid

from app.config import settings


def save(content: bytes, filename: str) -> str:
    """원본 파일을 로컬 디렉터리에 저장하고 경로(str)를 반환한다.

    다음 사이클에서 Supabase Storage 업로드로 교체된다 (시그니처 동일).
    """
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    dest = settings.data_dir / f"{uuid.uuid4().hex}_{filename}"
    dest.write_bytes(content)
    return str(dest)


def load(path: str) -> bytes:
    from pathlib import Path
    return Path(path).read_bytes()
```

- [ ] **Step 12: 전체 integrations 테스트 통과 확인**

Run: `uv run pytest tests/test_integrations.py -v`
Expected: 모두 PASS.

- [ ] **Step 13: Commit**

```bash
git add app/integrations tests/test_integrations.py
git commit -m "feat: integrations 스텁 (embeddings/llm/storage)"
```

---

## Task 4: services (검색 코사인 + 인제스천 파이프라인)

**Files:**
- Create: `app/services/__init__.py` (빈 파일)
- Create: `app/services/search.py`
- Create: `app/services/pipeline.py`
- Test: `tests/test_services.py` (append)

- [ ] **Step 1: cosine + search 실패 테스트 작성 (`tests/test_services.py`에 append)**

```python
from app.integrations.embeddings import embed
from app.services.search import cosine, search_items


def test_cosine_basic():
    assert cosine([1.0, 0.0], [1.0, 0.0]) == 1.0
    assert cosine([1.0, 0.0], [0.0, 1.0]) == 0.0
    assert cosine([0.0, 0.0], [1.0, 1.0]) == 0.0  # 0 벡터 안전


def _ready_item(text: str) -> Item:
    return Item(filename=text, local_path=f"_data/{text}",
                extracted_text=text, embedding=embed(text), status="ready")


def test_search_ranks_relevant_first(session):
    session.add(_ready_item("cosmetic lipstick"))
    session.add(_ready_item("jeju travel pork"))
    session.commit()
    results = search_items(session, "lipstick")
    assert results[0][0].extracted_text == "cosmetic lipstick"
    assert results[0][1] > 0.0
```

- [ ] **Step 2: 실행하여 실패 확인**

Run: `uv run pytest tests/test_services.py -k "cosine or search" -v`
Expected: FAIL (`ModuleNotFoundError: app.services.search`).

- [ ] **Step 3: `app/services/__init__.py` 빈 파일 + `search.py` 작성**

```python
import math

from sqlmodel import Session, select

from app.integrations.embeddings import embed
from app.models import Item


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)


def search_items(session: Session, query: str, limit: int = 10) -> list[tuple[Item, float]]:
    qvec = embed(query)
    items = session.exec(select(Item).where(Item.status == "ready")).all()
    scored = [(it, cosine(qvec, it.embedding)) for it in items]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:limit]
```

- [ ] **Step 4: 실행하여 통과 확인**

Run: `uv run pytest tests/test_services.py -k "cosine or search" -v`
Expected: PASS.

- [ ] **Step 5: pipeline 실패 테스트 작성 (`tests/test_services.py`에 append)**

```python
from app.services.pipeline import process_upload


def test_process_upload_creates_ready_item(session, tmp_path, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "data_dir", tmp_path)
    item = process_upload(session, b"imgbytes", "cosmetic_lipstick.png")
    assert item.id is not None
    assert item.status == "ready"
    assert item.category == "화장품"
    assert "lipstick" in item.tags
    assert item.embedding and len(item.embedding) == 64
```

- [ ] **Step 6: 실행하여 실패 확인**

Run: `uv run pytest tests/test_services.py -k process_upload -v`
Expected: FAIL (`ModuleNotFoundError: app.services.pipeline`).

- [ ] **Step 7: `app/services/pipeline.py` 작성**

```python
from sqlmodel import Session

from app.integrations import storage
from app.integrations.embeddings import embed
from app.integrations.llm import classify_and_describe
from app.models import Item


def process_upload(session: Session, content: bytes, filename: str) -> Item:
    """업로드 1건을 처리: 저장 → 분류·임베딩 → Item 저장.

    스텁이라 동기 처리하지만 status 단계는 유지한다.
    """
    path = storage.save(content, filename)
    item = Item(filename=filename, local_path=path, status="processing")
    session.add(item)
    session.commit()
    session.refresh(item)

    try:
        result = classify_and_describe(content, filename)
        item.extracted_text = result["text"]
        item.category = result["category"]
        item.tags = result["tags"]
        item.embedding = embed(result["text"])
        item.status = "ready"
    except Exception:
        item.status = "failed"
    session.add(item)
    session.commit()
    session.refresh(item)
    return item
```

- [ ] **Step 8: 전체 services 테스트 통과 확인**

Run: `uv run pytest tests/test_services.py -v`
Expected: 모두 PASS.

- [ ] **Step 9: Commit**

```bash
git add app/services tests/test_services.py
git commit -m "feat: services (코사인 검색 + 인제스천 파이프라인)"
```

---

## Task 5: routers + main 앱 + CORS + e2e 테스트

**Files:**
- Create: `app/routers/__init__.py` (빈 파일)
- Create: `app/routers/ingest.py`
- Create: `app/routers/items.py`
- Create: `app/routers/search.py`
- Create: `app/main.py`
- Test: `tests/test_e2e.py`

- [ ] **Step 1: `app/routers/__init__.py` 빈 파일 + `ingest.py` 작성**

```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlmodel import Session

from app.db import get_session
from app.models import Item
from app.services.pipeline import process_upload

router = APIRouter()

MAX_BYTES = 10 * 1024 * 1024  # 10MB


@router.post("/ingest", status_code=201)
async def ingest(file: UploadFile, session: Session = Depends(get_session)) -> Item:
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 허용됩니다")
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="파일이 너무 큽니다 (최대 10MB)")
    return process_upload(session, content, file.filename or "upload")
```

- [ ] **Step 2: `app/routers/items.py` 작성**

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.models import Item

router = APIRouter()


@router.get("/items")
def list_items(session: Session = Depends(get_session)) -> list[Item]:
    return session.exec(select(Item).order_by(Item.created_at.desc())).all()
```

- [ ] **Step 3: `app/routers/search.py` 작성**

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.db import get_session
from app.services.search import search_items

router = APIRouter()


class SearchRequest(BaseModel):
    query: str


class SearchHit(BaseModel):
    id: int
    filename: str
    category: str
    tags: list[str]
    extracted_text: str
    score: float


@router.post("/search")
def search(body: SearchRequest, session: Session = Depends(get_session)) -> list[SearchHit]:
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="query is empty")
    results = search_items(session, body.query)
    return [
        SearchHit(
            id=it.id, filename=it.filename, category=it.category,
            tags=it.tags, extracted_text=it.extracted_text, score=score,
        )
        for it, score in results
    ]
```

- [ ] **Step 4: `app/main.py` 작성**

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.routers import ingest, items, search


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="life-log-agent (vertical slice)", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(items.router)
app.include_router(search.router)
```

- [ ] **Step 5: e2e 테스트 작성 (`tests/test_e2e.py`)**

```python
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.db import get_session
from app.main import app


@pytest.fixture
def client(engine, tmp_path, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "data_dir", tmp_path)

    def override_get_session():
        with Session(engine) as s:
            yield s

    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_ingest_then_search(client):
    files = {"file": ("cosmetic_lipstick.png", b"imgbytes", "image/png")}
    r = client.post("/ingest", files=files)
    assert r.status_code == 201
    assert r.json()["category"] == "화장품"

    r = client.get("/items")
    assert len(r.json()) == 1

    r = client.post("/search", json={"query": "lipstick"})
    assert r.status_code == 200
    hits = r.json()
    assert hits and hits[0]["filename"] == "cosmetic_lipstick.png"
    assert hits[0]["score"] > 0.0


def test_empty_query_is_400(client):
    r = client.post("/search", json={"query": "   "})
    assert r.status_code == 400


def test_non_image_upload_is_400(client):
    files = {"file": ("note.txt", b"hello", "text/plain")}
    r = client.post("/ingest", files=files)
    assert r.status_code == 400
```

- [ ] **Step 6: 전체 백엔드 테스트 통과 확인**

Run: `uv run pytest -v`
Expected: 모든 테스트 PASS.

- [ ] **Step 7: 개발 서버 수동 기동 확인**

Run: `uv run uvicorn app.main:app --reload`
Expected: 기동 후 `http://localhost:8000/docs`에서 `/ingest`, `/items`, `/search` 노출. 확인 후 Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add app/routers app/main.py tests/test_e2e.py
git commit -m "feat: routers + FastAPI 앱 + CORS + e2e 테스트"
```

---

## Task 6: 최소 React 프론트 (업로드 + 검색 2화면)

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/index.html`
- Create: `frontend/src/main.tsx`, `frontend/src/api.ts`, `frontend/src/App.tsx`

> 프론트는 스펙대로 **수동 검증**(테스트 자동화는 다음 사이클). 모바일에서 텍스트가 겹치지 않도록 단순 세로 흐름 레이아웃을 쓴다(AGENTS.md UI 규칙).

- [ ] **Step 1: `frontend/package.json`**

```json
{
  "name": "life-log-agent-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: `frontend/vite.config.ts`**

```typescript
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
```

- [ ] **Step 4: `frontend/index.html`**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>life-log-agent</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: `frontend/src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: `frontend/src/api.ts`**

```typescript
const BASE = "http://localhost:8000";

export interface Hit {
  id: number;
  filename: string;
  category: string;
  tags: string[];
  extracted_text: string;
  score: number;
}

export async function ingest(file: File): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/ingest`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`ingest 실패: ${res.status}`);
}

export async function search(query: string): Promise<Hit[]> {
  const res = await fetch(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`search 실패: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 7: `frontend/src/App.tsx`**

```tsx
import { useState } from "react";
import { Hit, ingest, search } from "./api";

const wrap: React.CSSProperties = {
  maxWidth: 560,
  margin: "0 auto",
  padding: 16,
  fontFamily: "system-ui, sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: 24,
  wordBreak: "break-word",
};

export default function App() {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("업로드 중...");
    try {
      await ingest(file);
      setStatus(`업로드 완료: ${file.name}`);
    } catch (err) {
      setStatus(String(err));
    }
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setHits(await search(query));
  }

  return (
    <main style={wrap}>
      <section>
        <h1>life-log-agent</h1>
        <h2>1. 업로드</h2>
        <input type="file" accept="image/*" onChange={onUpload} />
        <p>{status}</p>
      </section>

      <section>
        <h2>2. 검색</h2>
        <form onSubmit={onSearch} style={{ display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1, minWidth: 0 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: lipstick"
          />
          <button type="submit">검색</button>
        </form>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {hits.map((h) => (
            <li key={h.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}>
              <strong>[{h.category}]</strong> {h.filename}
              <br />
              <small>{h.extracted_text} · score {h.score.toFixed(3)}</small>
            </li>
          ))}
          {hits.length === 0 && <li><small>결과 없음</small></li>}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 8: 설치 + 기동 확인**

Run (별도 터미널, 백엔드 기동 상태에서):
```bash
cd frontend && pnpm install && pnpm dev
```
Expected: `http://localhost:5173` 접속 → 이미지 업로드 → "업로드 완료" → "lipstick" 검색 시 해당 항목이 결과에 표시.

- [ ] **Step 9: Commit**

```bash
git add frontend
git commit -m "feat: 최소 React 프론트 (업로드 + 검색)"
```

---

## Task 7: 검증 기록 (VERIFY.md)

**Files:**
- Create: `VERIFY.md`

- [ ] **Step 1: 백엔드 테스트 결과 캡처**

Run: `uv run pytest -v`
출력 전체를 복사해 둔다(아래 VERIFY.md에 붙여넣음).

- [ ] **Step 2: 수동 e2e 결과 기록 (`VERIFY.md`)**

아래 템플릿에 **실제** 실행 결과를 채운다. 확인하지 못한 항목은 빈칸/"미확인"으로 두고 통과로 적지 않는다(AGENTS.md 규칙).

```markdown
# VERIFY — 수직 슬라이스 (사이클 1)

검증일: 2026-05-31

## 자동 테스트
- 명령: `uv run pytest -v`
- 결과: <PASS N / FAIL M — pytest 출력 요약 붙여넣기>

## 수동 e2e (UI)
- [ ] 백엔드 기동: `uv run uvicorn app.main:app --reload` → <관찰 결과>
- [ ] 프론트 기동: `cd frontend && pnpm dev` → <관찰 결과>
- [ ] 이미지 업로드 → "업로드 완료" 표시 → <관찰 결과>
- [ ] `GET /items`에 항목 존재 → <관찰 결과>
- [ ] "lipstick" 검색 → 업로드 항목이 결과 상단 → <관찰 결과>

## 성공 기준 (스펙 §1) 충족 여부
1. 업로드→목록 표시: <O/X>
2. 자연어 검색→유사도 결과: <O/X>
3. 키·계정 없이 clone→run: <O/X>

## 미해결/다음 사이클
- <발견된 이슈, 또는 "없음">
```

- [ ] **Step 3: Commit**

```bash
git add VERIFY.md
git commit -m "docs: 수직 슬라이스 검증 결과 (VERIFY.md)"
```

---

## 완료 기준

- `uv run pytest -v` 전부 통과.
- 브라우저에서 업로드 → 검색이 실제로 동작(VERIFY.md에 증거 기록).
- 외부 키·계정 없이 재현 가능.
- `spec/vertical-slice` 브랜치에 위 커밋들이 쌓이면 PR 생성 → 팀 리뷰.
