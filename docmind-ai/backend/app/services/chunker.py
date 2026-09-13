from dataclasses import dataclass
from typing import Optional

from app.config import settings
from app.services.parser import ParsedDocument, ParsedPage


@dataclass
class Chunk:
    document_id: str
    document_name: str
    chunk_index: int
    text: str
    page_number: int
    section: Optional[str] = None
    line_start: int = 1
    line_end: int = 1


def _word_windows(text: str, size: int, overlap: int) -> list[str]:
    words = text.split()
    if not words:
        return []
    if overlap >= size:
        raise ValueError("Chunk overlap must be smaller than chunk size")

    windows: list[str] = []
    start = 0
    step = size - overlap
    while start < len(words):
        windows.append(" ".join(words[start:start + size]))
        start += step
    return windows


def chunk_page(
    page: ParsedPage,
    document_id: str,
    document_name: str,
    chunk_size: int = settings.CHUNK_SIZE,
    chunk_overlap: int = settings.CHUNK_OVERLAP,
    start_index: int = 0,
) -> list[Chunk]:
    """Split one parsed page while retaining its page and section metadata."""
    windows = _word_windows(page.text, chunk_size, chunk_overlap)
    words_per_line = 12
    return [
        Chunk(
            document_id=document_id,
            document_name=document_name,
            chunk_index=start_index + offset,
            text=text,
            page_number=page.page_number,
            section=page.section,
            line_start=max(1, (offset * (chunk_size - chunk_overlap)) // words_per_line + 1),
            line_end=max(1, (offset * (chunk_size - chunk_overlap) + len(text.split())) // words_per_line + 1),
        )
        for offset, text in enumerate(windows)
    ]


def chunk_document(
    parsed_document: ParsedDocument,
    chunk_size: int = settings.CHUNK_SIZE,
    chunk_overlap: int = settings.CHUNK_OVERLAP,
) -> list[Chunk]:
    """Chunk a parsed document page by page to preserve citation boundaries."""
    chunks: list[Chunk] = []
    for page in parsed_document.pages:
        chunks.extend(
            chunk_page(
                page,
                parsed_document.document_id,
                parsed_document.document_name,
                chunk_size,
                chunk_overlap,
                len(chunks),
            )
        )
    return chunks