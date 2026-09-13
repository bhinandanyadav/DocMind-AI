import logging
import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.models.document import Document, DocumentStatus
from app.models.chunk import DocumentChunk
from app.services.chunker import chunk_document
from app.services.embeddings import EmbeddingService
from app.services.parser import parse_document
from app.services.vector_store import QdrantVectorStore

logger = logging.getLogger(__name__)


def process_document(document_id: str, db: Session) -> None:
    """Parse and chunk one document, updating its status transactionally."""
    document = db.query(Document).filter(Document.id == uuid.UUID(document_id)).first()
    if document is None:
        logger.warning("Document %s was not found for processing", document_id)
        return

    try:
        document.status = DocumentStatus.PROCESSING
        document.error_msg = None
        db.commit()

        file_path = Path(document.file_path)
        if not file_path.is_file():
            raise FileNotFoundError("The uploaded document is no longer available")

        parsed = parse_document(str(file_path), document.file_type, str(document.id))
        if not parsed.pages:
            raise ValueError("No readable text was found in this document")

        chunks = chunk_document(parsed)
        if not chunks:
            raise ValueError("No readable text was found in this document")

        db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document.id
        ).delete(synchronize_session=False)

        for chunk in chunks:
            db.add(DocumentChunk(
                document_id=document.id,
                chunk_index=chunk.chunk_index,
                text=chunk.text,
                page_number=chunk.page_number,
                section=chunk.section,
                metadata_={
                    "document_name": chunk.document_name,
                    "document_id": chunk.document_id,
                    "page_number": chunk.page_number,
                    "line_start": chunk.line_start,
                    "line_end": chunk.line_end,
                    "section": chunk.section,
                    "chunk_index": chunk.chunk_index,
                    "text": chunk.text,
                },
            ))

        db.flush()
        if settings.EMBEDDING_PROVIDER == "local" or settings.EMBEDDING_API_KEY:
            vector_store = QdrantVectorStore()
            vector_store.ensure_collection_exists()
            vector_store.delete_by_document(str(document.id))
            embeddings = EmbeddingService().embed_batch([chunk.text for chunk in chunks])
            vector_payloads = [
                {
                    "document_id": str(document.id),
                    "user_id": str(document.user_id),
                    "chunk_id": str(chunk_row.id),
                    "document_name": chunk.document_name,
                    "page_number": chunk.page_number,
                    "line_start": chunk.line_start,
                    "line_end": chunk.line_end,
                    "section": chunk.section,
                    "chunk_index": chunk.chunk_index,
                    "text": chunk.text,
                }
                for chunk_row, chunk in zip(
                    db.query(DocumentChunk)
                    .filter(DocumentChunk.document_id == document.id)
                    .order_by(DocumentChunk.chunk_index)
                    .all(),
                    chunks,
                )
            ]
            vector_ids = vector_store.upsert_chunks(vector_payloads, embeddings)

            for chunk_row, vector_id in zip(
                db.query(DocumentChunk)
                .filter(DocumentChunk.document_id == document.id)
                .order_by(DocumentChunk.chunk_index)
                .all(),
                vector_ids,
            ):
                chunk_row.vector_id = vector_id

        document.page_count = parsed.total_pages
        document.status = DocumentStatus.READY
        db.commit()
    except Exception as exc:
        db.rollback()
        document = db.query(Document).filter(Document.id == uuid.UUID(document_id)).first()
        if document is not None:
            document.status = DocumentStatus.FAILED
            document.error_msg = str(exc)
            db.commit()
        logger.exception("Document processing failed for %s", document_id)


def process_document_task(document_id: str) -> None:
    """Open an isolated session for FastAPI's background task."""
    from app.database.session import SessionLocal

    db = SessionLocal()
    try:
        process_document(document_id, db)
    finally:
        db.close()