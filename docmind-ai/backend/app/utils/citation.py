"""Citation formatting and validation utilities."""

from typing import Optional
from uuid import UUID

from app.models.chunk import DocumentChunk
from app.models.document import Document


def extract_citations(chunks: list[DocumentChunk]) -> list[dict]:
    """Extract citation data from DocumentChunk objects.

    Args:
        chunks: List of DocumentChunk objects

    Returns:
        List of citation dictionaries with document_id, document_name,
        page_number, section, text
    """
    citations = []
    for chunk in chunks:
        citations.append({
            "document_id": str(chunk.document_id),
            "document_name": chunk.document.filename,
            "page_number": chunk.page_number,
            "section": chunk.section,
            "text": chunk.text,
        })
    return citations


def validate_citation(citation: dict) -> bool:
    """Validate that a citation has required fields from actual chunk data.

    Args:
        citation: Citation dictionary to validate

    Returns:
        True if citation is valid, False otherwise
    """
    required_fields = ["document_id", "document_name", "page_number", "text"]

    # Check required fields exist and are not None/empty
    for field in required_fields:
        if field not in citation or citation[field] is None:
            return False
        if isinstance(citation[field], str) and not citation[field].strip():
            return False

    # document_id should be a valid UUID string
    try:
        UUID(citation["document_id"])
    except (ValueError, TypeError):
        return False

    # page_number should be integer if present
    if "page_number" in citation and citation["page_number"] is not None:
        if not isinstance(citation["page_number"], int):
            return False

    return True


def format_citation_for_display(citation: dict) -> str:
    """Format citation for display in UI.

    Args:
        citation: Citation dictionary

    Returns:
        Formatted citation string (e.g., "Document.pdf, Page 7, Section: Methodology")
    """
    parts = [citation["document_name"]]

    if citation.get("page_number") is not None:
        parts.append(f"Page {citation['page_number']}")

    if citation.get("section"):
        parts.append(f"Section: {citation['section']}")

    return ", ".join(parts)