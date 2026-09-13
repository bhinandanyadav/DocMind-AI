import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.schemas.search import SearchRequest, SearchResponse
from app.services.retriever import retrieve

router = APIRouter()


def _excerpt(text: str, query: str, limit: int = 320) -> str:
    """Return a compact, sentence-complete excerpt for search cards."""
    sentences = [
        part.strip()
        for part in re.split(r"(?<=[.!?])\s+|\n+", text.replace("\n", " "))
        if part.strip()
    ]
    terms = {term.lower() for term in re.findall(r"[\w'-]{3,}", query)}
    ranked = sorted(
        enumerate(sentences),
        key=lambda item: (-len(terms & set(re.findall(r"[\w'-]{3,}", item[1].lower()))), item[0]),
    )
    selected = sorted(ranked[:3], key=lambda item: item[0])
    excerpt = " ".join(sentence for _, sentence in selected)
    if len(excerpt) < 80 and len(text) > len(excerpt):
        excerpt = text[:limit].rsplit(" ", 1)[0]
    if len(excerpt) > limit:
        excerpt = excerpt[:limit].rsplit(" ", 1)[0] + "..."
    return excerpt


@router.post("", response_model=SearchResponse)
def search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search ready documents with semantic vector retrieval."""
    query = db.query(Document.id).filter(
        Document.user_id == current_user.id,
        Document.status == DocumentStatus.READY,
    )
    if request.document_ids:
        selected = db.query(Document.id).filter(
            Document.id.in_(request.document_ids),
            Document.user_id == current_user.id,
            Document.status == DocumentStatus.READY,
        ).all()
        document_ids = [str(document_id) for (document_id,) in selected]
        if len(document_ids) != len(request.document_ids):
            raise HTTPException(status_code=404, detail="One or more documents were not found")
    else:
        document_ids = [str(document_id) for (document_id,) in query.all()]

    if not document_ids:
        return SearchResponse(results=[])

    results = retrieve(request.query, str(current_user.id), document_ids, db=db)
    return SearchResponse(results=[
        {
            "document_id": result["document_id"],
            "document_name": result.get("document_name", "Unknown"),
            "page_number": int(result["page_number"]),
            "section": result.get("section"),
            "text": _excerpt(result.get("text", ""), request.query),
            "score": float(result["score"]),
        }
        for result in results
    ])
