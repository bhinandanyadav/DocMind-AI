from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import create_tables
from app.api import auth, documents, chat, search, analysis
from app.services.vector_store import QdrantVectorStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.APP_NAME}...")
    create_tables()
    print("Database tables ready")
    if settings.EMBEDDING_API_KEY:
        QdrantVectorStore().ensure_collection_exists()
        print("Vector collection ready")
    yield
    print("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent Document Analysis & RAG Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(search.router, prefix="/search", tags=["Search"])
app.include_router(analysis.router, tags=["Analysis"])


@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": "1.0.0",
    }
