from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    document_ids: list[UUID] = Field(min_length=1, max_length=50)
    conversation_id: Optional[UUID] = None


class SourceResponse(BaseModel):
    document_id: UUID
    document_name: str
    page_number: int
    line_start: int = 1
    line_end: int = 1
    section: Optional[str] = None
    text: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceResponse]
    conversation_id: UUID
    message_id: UUID


class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    sources: Optional[list[dict]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    items: list[ConversationResponse]
    total: int
    page: int
    page_size: int


class ConversationUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=500)