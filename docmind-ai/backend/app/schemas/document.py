from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    file_type: str
    file_size: int
    page_count: Optional[int] = None
    status: str
    summary: Optional[str] = None
    error_msg: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    page: int
    page_size: int


class DocumentUpdateRequest(BaseModel):
    filename: str


class WebDocumentUploadRequest(BaseModel):
    url: str


class DocumentStatusResponse(BaseModel):
    id: UUID
    status: str
    page_count: Optional[int] = None
    error_msg: Optional[str] = None


class DashboardStats(BaseModel):
    document_count: int
    total_pages: int
    question_count: int
