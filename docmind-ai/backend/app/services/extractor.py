"""Research paper structure extraction service."""

from collections.abc import Sequence
from typing import Any

from app.config import settings
from app.services.llm import LLMService, SYSTEM_PROMPT, NOT_FOUND_ANSWER


RESEARCH_FIELDS = [
    "problem",
    "objective",
    "methodology",
    "dataset",
    "models",
    "metrics",
    "results",
    "limitations",
    "future_work",
    "authors",
    "year",
    "key_findings",
]

FIELD_DESCRIPTIONS = {
    "problem": "What problem does this research address?",
    "objective": "What is the main objective or goal of this work?",
    "methodology": "What methodology, approach, or technique was used?",
    "dataset": "What dataset(s) were used for evaluation?",
    "models": "What models or architectures were proposed or compared?",
    "metrics": "What evaluation metrics were reported?",
    "results": "What were the main results and performance numbers?",
    "limitations": "What limitations were acknowledged by the authors?",
    "future_work": "What future work was suggested?",
    "authors": "Who are the authors of this paper?",
    "year": "What year was this paper published?",
    "key_findings": "What are the key findings or contributions?",
}


class ResearchExtractor:
    """Extract structured research paper metadata using RAG + LLM."""

    def __init__(self) -> None:
        self.llm = LLMService()

    def _build_context(self, chunks: Sequence[dict[str, Any]], max_chunks: int = 25) -> str:
        sample = list(chunks)[:max_chunks]
        if not sample:
            return ""
        return "\n\n".join(
            f"Source {idx}:\n"
            f"Document: {c.get('document_name', 'Unknown')}\n"
            f"Page: {c.get('page_number', 'Unknown')}\n"
            f"Section: {c.get('section') or 'Unknown'}\n"
            f"Text: {c.get('text', '')}"
            for idx, c in enumerate(sample, start=1)
        )

    def _extract_field(
        self,
        field: str,
        question: str,
        context: str,
    ) -> dict[str, Any]:
        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {question}\n\n"
            f"Answer with a concise, factual response based ONLY on the provided context. "
            f"If the information is not found in the context, respond with exactly: NOT_FOUND"
        )

        if self.llm.client is None:
            return {"value": "LLM not configured", "found": False}

        response = self.llm.client.chat.completions.create(
            model=settings.LLM_MODEL,
            temperature=0.2,
            max_tokens=512,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        content = (response.choices[0].message.content or "").strip()
        found = content != "NOT_FOUND" and content != NOT_FOUND_ANSWER
        return {"value": content if found else "Not found in document", "found": found}

    def extract(
        self,
        chunks: Sequence[dict[str, Any]],
        fields: list[str] | None = None,
    ) -> dict[str, Any]:
        target_fields = fields or RESEARCH_FIELDS
        context = self._build_context(chunks)
        if not context:
            return {field: {"value": "No content available", "found": False} for field in target_fields}

        results: dict[str, Any] = {}
        for field in target_fields:
            if field not in FIELD_DESCRIPTIONS:
                results[field] = {"value": "Unknown field", "found": False}
                continue
            results[field] = self._extract_field(field, FIELD_DESCRIPTIONS[field], context)

        return results
