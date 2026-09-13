from collections.abc import Sequence
from typing import Any

from app.config import settings
from app.models.chunk import DocumentChunk
from app.services.embeddings import EmbeddingService
from app.services.vector_store import QdrantVectorStore


def _lexical_retrieve(
    question: str,
    user_id: str,
    document_ids: Sequence[str],
    db,
    top_k: int,
) -> list[dict[str, Any]]:
    """Use persisted chunks when an embedding provider is not configured."""
    terms = {term.lower() for term in question.split() if len(term) > 2}
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id.in_(document_ids),
        DocumentChunk.document.has(user_id=user_id),
    ).all()
    ranked = []
    for chunk in chunks:
        words = set(chunk.text.lower().split())
        overlap = len(terms & words)
        if overlap:
            ranked.append((overlap, chunk))
    ranked.sort(key=lambda item: (-item[0], item[1].chunk_index))
    return [
        {
            "score": overlap / max(len(terms), 1),
            "document_id": str(chunk.document_id),
            "document_name": chunk.document.filename,
            "page_number": chunk.page_number or 1,
            "section": chunk.section,
            "text": chunk.text,
        }
        for overlap, chunk in ranked[:top_k]
    ]


def retrieve(
    question: str,
    user_id: str,
    document_ids: Sequence[str],
    db=None,
    top_k: int = settings.TOP_K,
) -> list[dict[str, Any]]:
    """Retrieve only selected chunks belonging to the authenticated user."""
    if settings.EMBEDDING_PROVIDER == "local":
        vector = EmbeddingService().embed(question)
    elif not settings.EMBEDDING_API_KEY:
        if db is None:
            raise RuntimeError("A database session is required for local retrieval")
        return _lexical_retrieve(question, user_id, document_ids, db, top_k)
    else:
        vector = EmbeddingService().embed(question)
    store = QdrantVectorStore()
    store.ensure_collection_exists()

    from qdrant_client.models import FieldCondition, Filter, MatchAny, MatchValue

    results = store.client.search(
        collection_name=settings.QDRANT_COLLECTION,
        query_vector=vector,
        query_filter=Filter(must=[
            FieldCondition(key="user_id", match=MatchValue(value=user_id)),
            FieldCondition(key="document_id", match=MatchAny(any=list(document_ids))),
        ]),
        limit=top_k,
        with_payload=True,
    )
    return [{"score": result.score, **(result.payload or {})} for result in results]