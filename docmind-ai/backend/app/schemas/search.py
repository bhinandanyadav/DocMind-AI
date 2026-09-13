from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4000)
    document_ids: Optional[list[UUID]] = Field(default=None, max_length=50)


class SearchResult(BaseModel):
    document_id: UUID
    document_name: str
    page_number: int
    section: Optional[str] = None
    text: str
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResult]