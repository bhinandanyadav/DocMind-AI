import logging
import os
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.message import Message, MessageRole
from app.schemas.document import (
    DocumentResponse,
    DocumentListResponse,
    DocumentUpdateRequest,
    DocumentStatusResponse,
    DashboardStats,
    WebDocumentUploadRequest,
)
from app.utils.file_utils import validate_file, save_upload, delete_file, get_file_extension
from app.config import settings
from app.services.processor import process_document_task
from app.services.vector_store import QdrantVectorStore
from app.schemas.compare import CompareRequest, ComparisonResponse
from app.services.comparator import compare_documents
from app.services.web_scraper import fetch_url_content, save_web_content_as_document

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/compare", response_model=ComparisonResponse)
def compare_documents_endpoint(
    request: CompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compare two ready documents owned by the current user."""
    if request.document_id_a == request.document_id_b:
        raise HTTPException(status_code=400, detail="Choose two different documents")
    try:
        return compare_documents(
            request.document_id_a,
            request.document_id_b,
            current_user.id,
            db,
            request.question,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get dashboard statistics for current user."""
    document_count = db.query(func.count(Document.id)).filter(
        Document.user_id == current_user.id
    ).scalar() or 0

    total_pages = db.query(func.sum(Document.page_count)).filter(
        Document.user_id == current_user.id,
        Document.status == DocumentStatus.READY,
    ).scalar() or 0

    question_count = db.query(func.count(Message.id)).join(
        Message.conversation
    ).filter(
        Message.conversation.has(user_id=current_user.id),
        Message.role == MessageRole.USER,
    ).scalar() or 0

    return DashboardStats(
        document_count=document_count,
        total_pages=int(total_pages),
        question_count=question_count,
    )


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a document. Processing starts automatically in the background."""
    # Validate file
    validate_file(file)

    # Save to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path, file_size = await save_upload(file, settings.UPLOAD_DIR)
    file_ext = get_file_extension(file.filename or "")

    # Create database record
    document = Document(
        user_id=current_user.id,
        filename=file.filename or "document",
        file_type=file_ext,
        file_size=file_size,
        file_path=file_path,
        status=DocumentStatus.UPLOADED,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Start background processing
    background_tasks.add_task(process_document_task, str(document.id))

    return document


@router.post("/upload-web", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_web_document(
    request: WebDocumentUploadRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch a web page or PDF and ingest it as a document."""
    try:
        title, text, _authors = fetch_url_content(request.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not text.strip():
        raise HTTPException(status_code=400, detail="No readable text was found at this URL")

    file_path, file_type = save_web_content_as_document(title, text, request.url)
    file_size = os.path.getsize(file_path)

    document = Document(
        user_id=current_user.id,
        filename=(title or "web_document")[:500],
        file_type=file_type,
        file_size=file_size,
        file_path=file_path,
        status=DocumentStatus.UPLOADED,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    background_tasks.add_task(process_document_task, str(document.id))
    return document


@router.get("", response_model=DocumentListResponse)
def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all documents for current user."""
    query = db.query(Document).filter(Document.user_id == current_user.id)
    total = query.count()
    items = query.order_by(Document.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return DocumentListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single document by ID."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get processing status of a document."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{document_id}/file")
def get_document_file(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stream an owned document file to the authenticated client."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc or not os.path.isfile(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found")

    media_types = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "txt": "text/plain",
    }
    return FileResponse(
        doc.file_path,
        media_type=media_types.get(doc.file_type, "application/octet-stream"),
        filename=doc.filename,
    )


@router.patch("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: UUID,
    request: DocumentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rename a document."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.filename = request.filename.strip()
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a document and its file."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from disk
    delete_file(doc.file_path)

    # Vector cleanup must not prevent deletion of a locally processed document.
    # Local processing can create DB chunks without creating Qdrant vectors.
    if settings.QDRANT_URL and (
        settings.EMBEDDING_PROVIDER == "local" or settings.EMBEDDING_API_KEY
    ):
        try:
            QdrantVectorStore().delete_by_document(str(doc.id))
        except Exception:
            logger.exception("Unable to remove vectors for document %s", doc.id)

    # Delete DB record (cascades to chunks)
    db.delete(doc)
    db.commit()


@router.post("/{document_id}/process")
def reprocess_document(
    document_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually trigger document reprocessing."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.status = DocumentStatus.UPLOADED
    doc.error_msg = None
    db.commit()
    background_tasks.add_task(process_document_task, str(document_id))
    return {"success": True, "message": "Processing started"}
