from collections.abc import Sequence
from uuid import uuid4

from app.config import settings


class QdrantVectorStore:
    """Small Qdrant adapter that keeps vector operations out of route handlers."""

    def __init__(self) -> None:
        from qdrant_client import QdrantClient

        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY or None,
        )

    def ensure_collection_exists(self) -> None:
        from qdrant_client.models import Distance, VectorParams

        collections = self.client.get_collections().collections
        if any(item.name == settings.QDRANT_COLLECTION for item in collections):
            return
        self.client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=settings.EMBEDDING_DIMENSION,
                distance=Distance.COSINE,
            ),
        )

    def upsert_chunks(
        self,
        chunks: Sequence[dict],
        vectors: Sequence[Sequence[float]],
    ) -> list[str]:
        from qdrant_client.models import PointStruct

        if len(chunks) != len(vectors):
            raise ValueError("Every document chunk must have one embedding")

        point_ids = [str(uuid4()) for _ in chunks]
        points = [
            PointStruct(
                id=point_id,
                vector=list(vector),
                payload=chunk,
            )
            for point_id, vector, chunk in zip(point_ids, vectors, chunks)
        ]
        self.client.upsert(collection_name=settings.QDRANT_COLLECTION, points=points)
        return point_ids

    def delete_by_document(self, document_id: str) -> None:
        from qdrant_client.models import FieldCondition, Filter, FilterSelector, MatchValue

        self.client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )]
                )
            ),
        )