from collections.abc import Sequence

from app.config import settings

NOT_FOUND_ANSWER = "I couldn't find sufficient information about this in the uploaded documents."

SYSTEM_PROMPT = """You are DocMind AI, a document analysis assistant.
Answer only from the provided document context. Do not invent facts, numbers,
dates, names, quotations, page numbers, or citations. If the context is not
enough to answer, say exactly: "I couldn't find sufficient information about
this in the uploaded documents." Keep the answer concise and useful."""


class LLMService:
    def __init__(self) -> None:
        if settings.LLM_PROVIDER != "openai":
            raise ValueError(f"Unsupported LLM provider: {settings.LLM_PROVIDER}")
        self.client = None
        if not settings.LLM_API_KEY:
            return

        from openai import OpenAI

        self.client = OpenAI(api_key=settings.LLM_API_KEY)

    def answer(self, question: str, chunks: Sequence[dict]) -> str:
        if self.client is None:
            if not chunks:
                return NOT_FOUND_ANSWER
            return "Relevant information found. See the source citation below."

        context = "\n\n".join(
            f"Source {index}:\n"
            f"Document: {chunk.get('document_name', 'Unknown')}\n"
            f"Page: {chunk.get('page_number', 'Unknown')}\n"
            f"Section: {chunk.get('section') or 'Unknown'}\n"
            f"Text: {chunk.get('text', '')}"
            for index, chunk in enumerate(chunks, start=1)
        )
        response = self.client.chat.completions.create(
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
            ],
        )
        return response.choices[0].message.content or NOT_FOUND_ANSWER