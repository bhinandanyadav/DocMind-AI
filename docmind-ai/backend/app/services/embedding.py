"""OpenAI embedding service and command-line smoke test.

Usage from backend:
    python -m app.services.embedding "Text to embed"

The command requires EMBEDDING_API_KEY in backend/.env and never prints the
embedding values unless --print-vector is explicitly supplied.
"""

from __future__ import annotations

import argparse
from collections.abc import Sequence
from functools import lru_cache

from app.config import settings


class EmbeddingService:
    """Create embeddings with the provider configured by the application."""

    def __init__(self) -> None:
        if settings.EMBEDDING_PROVIDER not in {"openai", "local"}:
            raise ValueError(
                f"Unsupported embedding provider: {settings.EMBEDDING_PROVIDER}"
            )
        self.client = None
        if settings.EMBEDDING_PROVIDER == "openai":
            if not settings.EMBEDDING_API_KEY:
                raise RuntimeError("EMBEDDING_API_KEY is not configured")
            from openai import OpenAI
            self.client = OpenAI(api_key=settings.EMBEDDING_API_KEY)

    def embed(self, text: str) -> list[float]:
        """Create one embedding vector for non-empty text."""
        if not text.strip():
            raise ValueError("Text to embed cannot be empty")

        if settings.EMBEDDING_PROVIDER == "local":
            vector = list(_local_model().encode(text, normalize_embeddings=True))
        else:
            response = self.client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=text,
            )
            vector = response.data[0].embedding
        self._validate_dimension(vector)
        return vector

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        """Create vectors in input order for a batch of texts."""
        if not texts:
            return []
        if any(not text.strip() for text in texts):
            raise ValueError("Text to embed cannot be empty")

        if settings.EMBEDDING_PROVIDER == "local":
            vectors = [
                list(vector)
                for vector in _local_model().encode(
                    list(texts), normalize_embeddings=True
                )
            ]
        else:
            response = self.client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=list(texts),
            )
            vectors = [
                item.embedding
                for item in sorted(response.data, key=lambda item: item.index)
            ]
        for vector in vectors:
            self._validate_dimension(vector)
        return vectors

    @staticmethod
    def _validate_dimension(vector: Sequence[float]) -> None:
        if len(vector) != settings.EMBEDDING_DIMENSION:
            raise ValueError(
                f"Embedding dimension mismatch: expected "
                f"{settings.EMBEDDING_DIMENSION}, got {len(vector)}"
            )


@lru_cache(maxsize=1)
def _local_model():
    """Load the local model once per worker and cache it in memory."""
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.EMBEDDING_MODEL)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate an OpenAI embedding")
    parser.add_argument("text", nargs="?", help="Text to embed")
    parser.add_argument(
        "--print-vector",
        action="store_true",
        help="Print the complete vector; otherwise print only its dimension",
    )
    args = parser.parse_args()
    text = args.text or input("Text to embed: ").strip()
    vector = EmbeddingService().embed(text)
    print(vector if args.print_vector else f"Generated {len(vector)} dimensions")


if __name__ == "__main__":
    main()
