from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CompareRequest(BaseModel):
    document_id_a: UUID
    document_id_b: UUID
    question: Optional[str] = Field(default=None, max_length=4000)


class ComparisonItem(BaseModel):
    text: str
    document_id: UUID
    document_name: str
    page_number: int
    section: str | None = None
    before_text: str | None = None
    after_text: str | None = None


class ComparisonResponse(BaseModel):
    summary: str
    added: list[ComparisonItem]
    removed: list[ComparisonItem]
    modified: list[ComparisonItem]