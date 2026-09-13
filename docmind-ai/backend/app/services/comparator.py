from difflib import SequenceMatcher
import math
import re
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.chunk import DocumentChunk
from app.models.document import Document, DocumentStatus


def _item(document: Document, chunk: DocumentChunk, text: str | None = None) -> dict[str, Any]:
    return {
        "text": text if text is not None else chunk.text,
        "document_id": document.id,
        "document_name": document.filename,
        "page_number": chunk.page_number or 1,
        "section": chunk.section,
    }


def _sentences(text: str) -> list[str]:
    return [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+|\n+", text) if sentence.strip()]


def _question_sentences(
    question: str,
    document_id: UUID,
    user_id: UUID,
    db: Session,
) -> list[tuple[DocumentChunk, str]]:
    from app.services.retriever import retrieve

    matches = retrieve(question, str(user_id), [str(document_id)], db=db, top_k=8)
    indexes = {int(match.get("chunk_index", -1)) for match in matches}
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id,
        DocumentChunk.chunk_index.in_(indexes),
    ).order_by(DocumentChunk.chunk_index).all()
    candidates = [
        (chunk, sentence)
        for chunk in chunks
        for sentence in _sentences(chunk.text)
        if len(sentence.split()) >= 4
    ]
    if not candidates:
        return []

    from app.services.embeddings import EmbeddingService

    service = EmbeddingService()
    question_vector = service.embed(question)
    sentence_vectors = service.embed_batch([sentence for _, sentence in candidates])
    question_norm = math.sqrt(sum(value * value for value in question_vector)) or 1
    ranked = []
    for candidate, vector in zip(candidates, sentence_vectors):
        vector_norm = math.sqrt(sum(value * value for value in vector)) or 1
        score = sum(a * b for a, b in zip(question_vector, vector)) / (question_norm * vector_norm)
        ranked.append((score, candidate))
    ranked.sort(key=lambda item: item[0], reverse=True)
    return [candidate for _, candidate in ranked[:20]]


def compare_documents(
    document_id_a: UUID,
    document_id_b: UUID,
    user_id: UUID,
    db: Session,
    question: str | None = None,
) -> dict[str, Any]:
    """Compare owned ready-document chunks without inventing document content."""
    documents = db.query(Document).filter(
        Document.id.in_([document_id_a, document_id_b]),
        Document.user_id == user_id,
        Document.status == DocumentStatus.READY,
    ).all()
    by_id = {document.id: document for document in documents}
    if len(by_id) != 2:
        raise ValueError("Both documents must exist, belong to you, and be ready")

    sentence_a = _question_sentences(question, document_id_a, user_id, db) if question else None
    sentence_b = _question_sentences(question, document_id_b, user_id, db) if question else None
    chunks_a = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id_a,
    ).order_by(DocumentChunk.chunk_index).all()
    chunks_b = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id_b,
    ).order_by(DocumentChunk.chunk_index).all()
    if not question:
        sentence_a = [(chunk, sentence) for chunk in chunks_a for sentence in _sentences(chunk.text)]
        sentence_b = [(chunk, sentence) for chunk in chunks_b for sentence in _sentences(chunk.text)]
    texts_a = [sentence for _, sentence in sentence_a]
    texts_b = [sentence for _, sentence in sentence_b]
    matcher = SequenceMatcher(a=texts_a, b=texts_b, autojunk=False)
    added: list[dict[str, Any]] = []
    removed: list[dict[str, Any]] = []
    modified: list[dict[str, Any]] = []

    for tag, start_a, end_a, start_b, end_b in matcher.get_opcodes():
        if tag == "delete":
            removed.extend(_item(by_id[document_id_a], chunk, text) for (chunk, text) in sentence_a[start_a:end_a])
        elif tag == "insert":
            added.extend(_item(by_id[document_id_b], chunk, text) for (chunk, text) in sentence_b[start_b:end_b])
        elif tag == "replace":
            old_items = sentence_a[start_a:end_a]
            new_items = sentence_b[start_b:end_b]
            pair_count = min(len(old_items), len(new_items))
            for index in range(pair_count):
                old_chunk, old_text = old_items[index]
                new_chunk, new_text = new_items[index]
                item = _item(by_id[document_id_b], new_chunk, new_text)
                item["before_text"] = old_text
                item["after_text"] = new_text
                modified.append(item)
            removed.extend(_item(by_id[document_id_a], chunk, text) for chunk, text in old_items[pair_count:])
            added.extend(_item(by_id[document_id_b], chunk, text) for chunk, text in new_items[pair_count:])

    if not added and not removed and not modified:
        summary = "No significant differences were found between these documents."
    else:
        scope = " for the requested question" if question else ""
        summary = f"Found {len(added)} added, {len(removed)} removed, and {len(modified)} modified sentence(s){scope}."
    return {"summary": summary, "added": added, "removed": removed, "modified": modified}