import json
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from pgvector.sqlalchemy import Vector
from pydantic import field_validator
from sqlalchemy import Column
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    pass

ItemStatus = str  # "pending" | "processing" | "ready" | "failed"
CategoryKey = str  # "cosmetic" | "travel" | "food" | "etc"


class Item(SQLModel, table=True):
    __tablename__ = "items"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(index=True)
    storage_path: str
    original_filename: str
    status: ItemStatus = Field(default="pending", index=True)
    error_message: Optional[str] = None

    # AI-extracted
    category: Optional[CategoryKey] = None
    tags: Optional[str] = None       # JSON array stored as text
    ocr_text: Optional[str] = None
    summary: Optional[str] = None
    place: Optional[str] = None
    captured_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    chunks: list["Chunk"] = Relationship(back_populates="item")


class Chunk(SQLModel, table=True):
    __tablename__ = "chunks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    item_id: uuid.UUID = Field(foreign_key="items.id", index=True)
    text: str
    # pgvector column — dimension set by Alembic migration
    embedding: Optional[list[float]] = Field(default=None, sa_column=Column(Vector(1024)))

    created_at: datetime = Field(default_factory=datetime.utcnow)

    item: Optional[Item] = Relationship(back_populates="chunks")


# ── Pydantic schemas (request / response) ────────────────────

class IngestRequest(SQLModel):
    storage_path: str
    original_filename: str
    memo: Optional[str] = None
    tags: Optional[list[str]] = None


class IngestResponse(SQLModel):
    item_id: uuid.UUID
    status: ItemStatus


class ItemRead(SQLModel):
    id: uuid.UUID
    storage_path: str
    original_filename: str
    status: ItemStatus
    error_message: Optional[str]
    category: Optional[str]
    tags: Optional[list[str]] = None
    ocr_text: Optional[str]
    summary: Optional[str]
    place: Optional[str]
    captured_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v: object) -> list[str] | None:
        if v is None:
            return None
        if isinstance(v, list):
            return v
        try:
            parsed = json.loads(v)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []


class SearchRequest(SQLModel):
    query: str
    category: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    place: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=20)


class EvidenceItem(SQLModel):
    id: uuid.UUID
    storage_path: str
    original_filename: str
    category: Optional[str]
    summary: Optional[str]
    place: Optional[str]
    captured_at: Optional[datetime]
    score: float


class SearchResponse(SQLModel):
    answer: str
    evidence: list[EvidenceItem]
    query: str
