"""Document summarization services."""

from collections.abc import Sequence
from typing import Any

from app.config import settings
from app.services.llm import LLMService, SYSTEM_PROMPT, NOT_FOUND_ANSWER


class SummarizerService:
    """Service for generating document summaries."""

    def __init__(self) -> None:
        self.llm = LLMService()

    def _build_context(self, chunks: Sequence[dict[str, Any]], max_chunks: int = 20) -> str:
        """Build context string from chunks for LLM prompt."""
        sample_chunks = list(chunks)[:max_chunks]
        if not sample_chunks:
            return ""

        return "\n\n".join(
            f"Source {idx}:\n"
            f"Document: {chunk.get('document_name', 'Unknown')}\n"
            f"Page: {chunk.get('page_number', 'Unknown')}\n"
            f"Section: {chunk.get('section') or 'Unknown'}\n"
            f"Text: {chunk.get('text', '')}"
            for idx, chunk in enumerate(sample_chunks, start=1)
        )

    def generate_quick_summary(self, chunks: Sequence[dict[str, Any]]) -> str:
        """Generate a 5-10 bullet point quick summary."""
        context = self._build_context(chunks)
        if not context:
            return "Unable to generate summary - no content available."

        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Context:\n{context}\n\n"
            f"Question: Provide a quick summary of this document in 5-10 bullet points. "
            f"Each bullet should be concise and cover a key point. "
            f"If the document is too short to summarize meaningfully, say so."
        )

        response = self.llm.client.chat.completions.create(
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content or "Unable to generate summary."

    def generate_detailed_summary(self, chunks: Sequence[dict[str, Any]]) -> str:
        """Generate a section-by-section detailed summary."""
        context = self._build_context(chunks)
        if not context:
            return "Unable to generate summary - no content available."

        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Context:\n{context}\n\n"
            f"Question: Provide a detailed section-by-section summary of this document. "
            f"For each section, describe the key content covered. "
            f"Structure the answer with clear section headers. "
            f"If information is insufficient, state that explicitly."
        )

        response = self.llm.client.chat.completions.create(
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content or "Unable to generate summary."

    def extract_key_topics(self, chunks: Sequence[dict[str, Any]]) -> list[str]:
        """Extract key topics/concepts from document chunks."""
        context = self._build_context(chunks, max_chunks=15)
        if not context:
            return []

        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Context:\n{context}\n\n"
            f"Question: Extract the most important topics, concepts, or key terms from this document. "
            f"Return exactly 8-10 items as a JSON array of strings, e.g., ['topic1', 'topic2', ...]."
        )

        response = self.llm.client.chat.completions.create(
            model=settings.LLM_MODEL,
            temperature=0.3,
            max_tokens=500,
            messages=[
                {"role": "system", "content": "You are a document analysis assistant."},
                {"role": "user", "content": prompt},
            ],
        )

        import json
        try:
            content = response.choices[0].message.content or "[]"
            topics = json.loads(content)
            if isinstance(topics, list):
                return [str(t) for t in topics[:10]]
        except (json.JSONDecodeError, TypeError):
            pass

        return []