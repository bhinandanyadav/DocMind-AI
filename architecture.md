# Architecture Document

## DocMind AI — Intelligent Document Analysis & RAG Platform

> **Tagline:** Turn Documents Into Intelligence.

**Document Type:** System Architecture
**Stack:** React + FastAPI + PostgreSQL + Qdrant + LLM + RAG
**Version:** 1.0

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [RAG Pipeline Architecture](#4-rag-pipeline-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Vector Database Architecture](#6-vector-database-architecture)
7. [Authentication Architecture](#7-authentication-architecture)
8. [Document Processing Architecture](#8-document-processing-architecture)
9. [API Design](#9-api-design)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Security Architecture](#11-security-architecture)
12. [Scalability Considerations](#12-scalability-considerations)

---

## 1. System Overview

### 1.1 What DocMind AI Is

DocMind AI is a full-stack AI-powered document intelligence platform. It is not a generic chatbot. It is a Retrieval-Augmented Generation (RAG) system where:

- Every answer comes from retrieved document chunks
- Every answer is grounded in source context
- Every citation points to a real document, page, and section
- Users can verify any AI answer in the original document

### 1.2 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                                                                 │
│    ┌──────────────────────────────────────────────────────┐     │
│    │              React Frontend (TypeScript)             │     │
│    │         Vite + Tailwind CSS + shadcn/ui              │     │
│    └────────────────────────┬─────────────────────────────┘     │
└─────────────────────────────┼───────────────────────────────────┘
                              │  HTTPS / REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (Python)                    │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  auth.py │  │documents │  │ chat.py  │  │  analysis.py  │  │
│  │          │  │  .py     │  │          │  │  search.py    │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Services Layer                      │   │
│  │  parser │ chunker │ embeddings │ vector_store │ llm     │   │
│  │  retriever │ reranker │ summarizer │ comparator         │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────┬──────────────────────┬──────────────────┬─────────────┘
         │                      │                  │
         ▼                      ▼                  ▼
┌──────────────┐     ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL  │     │   File Storage   │  │  Qdrant          │
│              │     │   (local/cloud)  │  │  Vector DB       │
│  Users       │     │                 │  │                  │
│  Documents   │     │  uploads/        │  │  document_chunks │
│  Chunks      │     │  processed/      │  │  collection      │
│  Convos      │     │                 │  │                  │
│  Messages    │     └──────────────────┘  └────────┬─────────┘
│  Feedback    │                                    │
└──────────────┘                                    ▼
                                          ┌──────────────────┐
                                          │  Embedding Model │
                                          │  (configurable)  │
                                          └────────┬─────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │   LLM API        │
                                          │  (configurable)  │
                                          └──────────────────┘
```

### 1.3 Core Data Flow Summary

```
DOCUMENT UPLOAD FLOW:
User → Upload File → FastAPI → Validate → Store → Parse → Chunk → Embed → Qdrant → READY

QUESTION ANSWERING FLOW:
User → Ask Question → FastAPI → Embed Question → Search Qdrant → Top-K Chunks
    → Build Context → LLM Prompt → LLM Response → Format Citations → Return to UI

CITATION FLOW:
User Clicks Citation → Document Viewer Opens → Navigate to Cited Page
```

### 1.4 System Boundaries

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| Frontend | React + TypeScript | UI, user interaction, API calls |
| Backend API | FastAPI + Python | Business logic, orchestration |
| Document Processor | Python services | Parse, chunk, embed documents |
| Relational DB | PostgreSQL | Users, documents, conversations, messages |
| Vector DB | Qdrant | Embeddings, semantic search |
| File Storage | Local disk / Object storage | Raw uploaded files |
| Embedding Model | Configurable (OpenAI/local) | Convert text to vectors |
| LLM | Configurable (OpenAI/Groq/Ollama) | Generate grounded answers |

---

## 2. Frontend Architecture

### 2.1 Technology Stack

```
React 18
TypeScript
Vite (build tool)
Tailwind CSS (styling)
shadcn/ui (component library)
Lucide Icons
React Router v6 (routing)
React Markdown (markdown rendering)
```

### 2.2 Directory Structure

```
frontend/
└── src/
    ├── components/
    │   ├── ui/                  # shadcn/ui base components
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   ├── toast.tsx
    │   │   ├── skeleton.tsx
    │   │   └── badge.tsx
    │   │
    │   ├── chat/                # Chat-specific components
    │   │   ├── ChatWindow.tsx
    │   │   ├── MessageBubble.tsx
    │   │   ├── SourceCard.tsx
    │   │   ├── ChatInput.tsx
    │   │   └── ConversationList.tsx
    │   │
    │   ├── documents/           # Document-specific components
    │   │   ├── DocumentCard.tsx
    │   │   ├── DocumentTable.tsx
    │   │   ├── UploadZone.tsx
    │   │   ├── ProcessingStatus.tsx
    │   │   └── DocumentSearch.tsx
    │   │
    │   ├── viewer/              # Document viewer components
    │   │   ├── PDFViewer.tsx
    │   │   ├── PageControls.tsx
    │   │   └── ViewerSearch.tsx
    │   │
    │   ├── dashboard/           # Dashboard-specific components
    │   │   ├── StatsCard.tsx
    │   │   ├── RecentDocuments.tsx
    │   │   └── RecentConversations.tsx
    │   │
    │   └── common/              # Shared components
    │       ├── Sidebar.tsx
    │       ├── Header.tsx
    │       ├── LoadingSpinner.tsx
    │       ├── EmptyState.tsx
    │       └── ErrorBoundary.tsx
    │
    ├── pages/
    │   ├── Landing.tsx
    │   ├── Login.tsx
    │   ├── Register.tsx
    │   ├── Dashboard.tsx
    │   ├── Documents.tsx
    │   ├── DocumentDetails.tsx
    │   ├── DocumentViewer.tsx
    │   ├── Chat.tsx
    │   ├── Search.tsx
    │   ├── Compare.tsx
    │   ├── Summary.tsx
    │   ├── ResearchMode.tsx
    │   ├── StudyMode.tsx
    │   └── Settings.tsx
    │
    ├── layouts/
    │   ├── AppLayout.tsx        # Authenticated layout with sidebar
    │   └── AuthLayout.tsx       # Login/Register layout
    │
    ├── hooks/
    │   ├── useAuth.ts           # Auth state and actions
    │   ├── useDocuments.ts      # Document list and CRUD
    │   ├── useChat.ts           # Chat state and messaging
    │   ├── useUpload.ts         # File upload with progress
    │   └── useViewer.ts         # PDF viewer state
    │
    ├── services/                # All API calls — NO business logic in components
    │   ├── api.ts               # Axios instance + interceptors
    │   ├── authService.ts       # register, login, logout
    │   ├── documentService.ts   # upload, list, get, delete, rename
    │   ├── chatService.ts       # sendMessage, getConversations
    │   ├── searchService.ts     # semanticSearch
    │   └── analysisService.ts   # summary, compare, generateQuestions
    │
    ├── utils/
    │   ├── formatters.ts        # Date, size, text formatters
    │   ├── validators.ts        # File type/size validation
    │   └── constants.ts         # App-wide constants
    │
    ├── types/
    │   ├── document.ts          # Document, Chunk, ProcessingStatus types
    │   ├── chat.ts              # Message, Conversation, Source types
    │   ├── auth.ts              # User, AuthState types
    │   └── api.ts               # API response envelope types
    │
    ├── router/
    │   └── index.tsx            # Route definitions + protected route wrapper
    │
    └── main.tsx
```

### 2.3 Routing Architecture

```
/                    → Landing (public)
/login               → Login (public)
/register            → Register (public)

/dashboard           → Dashboard (protected)
/documents           → Documents list (protected)
/documents/:id       → Document details (protected)
/documents/:id/view  → Document viewer (protected)
/chat                → AI Chat (protected)
/chat/:conversationId → Specific conversation (protected)
/search              → Semantic search (protected)
/compare             → Document comparison (protected)
/documents/:id/summary → Summary page (protected)
/research            → Research mode (protected)
/study               → Study mode (protected)
/settings            → Settings (protected)
```

**Protected Route Guard:**
```
ProtectedRoute
    ↓
Check JWT in localStorage / memory
    ↓
Valid → Render page
Invalid → Redirect to /login
```

### 2.4 State Management

State is managed at three levels — no global state management library required for MVP:

| Level | Tool | Used For |
|-------|------|---------|
| Server state | React Query (TanStack Query) | API data, caching, loading/error states |
| Local component state | useState / useReducer | UI state, form values |
| Auth state | Context + useReducer | Current user, JWT token |

### 2.5 API Service Layer

All backend communication goes through `services/`. Components never call `fetch` directly.

```typescript
// services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) redirectToLogin();
  return Promise.reject(error);
});
```

### 2.6 Component Communication Pattern

```
Page (owns data fetching via hooks)
    ↓
Layout Component (sidebar, header)
    ↓
Feature Component (ChatWindow, DocumentCard)
    ↓
UI Primitive (Button, Card, Badge)

Data flows DOWN via props.
Events flow UP via callbacks.
```

---

## 3. Backend Architecture

### 3.1 Technology Stack

```
Python 3.11+
FastAPI
Pydantic v2
Uvicorn (ASGI server)
SQLAlchemy (ORM)
Alembic (migrations)
python-jose (JWT)
passlib (password hashing)
python-multipart (file uploads)
httpx (async HTTP client)
```

### 3.2 Directory Structure

```
backend/
└── app/
    ├── main.py              # FastAPI app init, router registration, middleware
    ├── config.py            # Settings from environment variables (Pydantic BaseSettings)
    │
    ├── api/                 # Route handlers (thin — delegate to services)
    │   ├── auth.py
    │   ├── documents.py
    │   ├── chat.py
    │   ├── search.py
    │   └── analysis.py
    │
    ├── services/            # All business logic lives here
    │   ├── parser.py
    │   ├── chunker.py
    │   ├── embeddings.py
    │   ├── vector_store.py
    │   ├── retriever.py
    │   ├── reranker.py
    │   ├── llm.py
    │   ├── summarizer.py
    │   ├── comparator.py
    │   └── extractor.py
    │
    ├── models/              # SQLAlchemy ORM models
    │   ├── user.py
    │   ├── document.py
    │   ├── chunk.py
    │   ├── conversation.py
    │   ├── message.py
    │   └── feedback.py
    │
    ├── schemas/             # Pydantic request/response schemas
    │   ├── auth.py
    │   ├── document.py
    │   ├── chat.py
    │   └── search.py
    │
    ├── database/
    │   ├── session.py       # SQLAlchemy engine + session factory
    │   └── migrations/      # Alembic migration files
    │
    ├── middleware/
    │   ├── auth.py          # JWT validation middleware
    │   └── rate_limit.py    # Basic rate limiting
    │
    └── utils/
        ├── file_utils.py    # File handling, validation, sanitization
        ├── text_utils.py    # Text cleaning helpers
        └── citation.py      # Citation formatting
```

### 3.3 Application Layers

```
REQUEST
    ↓
FastAPI Router (api/)
    ↓  validates input via Pydantic schema
Service Layer (services/)
    ↓  executes business logic
Repository / DB Layer (models/ + database/)
    ↓  reads/writes PostgreSQL
Vector Layer (services/vector_store.py)
    ↓  reads/writes Qdrant
External APIs (embeddings, LLM)
    ↓
RESPONSE
    ↓  serialized via Pydantic schema
Client
```

### 3.4 Dependency Injection

FastAPI's `Depends()` is used throughout:

```python
# Reusable dependencies
def get_db() -> Session:          # PostgreSQL session
def get_current_user() -> User:   # JWT → current user
def get_vector_store():           # Qdrant client
def get_embedder():               # Embedding service
def get_llm():                    # LLM service
```

Route handlers receive only what they need:

```python
@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    retriever: RetrieverService = Depends(get_retriever),
    llm: LLMService = Depends(get_llm),
):
    ...
```

### 3.5 Configuration Management

All secrets and settings are loaded from environment variables via `config.py`:

```python
class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Vector DB
    QDRANT_URL: str
    QDRANT_API_KEY: str

    # JWT
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Embeddings
    EMBEDDING_PROVIDER: str        # openai | huggingface | local
    EMBEDDING_MODEL: str
    EMBEDDING_API_KEY: str

    # LLM
    LLM_PROVIDER: str              # openai | groq | ollama
    LLM_MODEL: str
    LLM_API_KEY: str

    # File Storage
    UPLOAD_DIR: str = "data/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # RAG
    TOP_K: int = 5
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150

    class Config:
        env_file = ".env"

settings = Settings()
```

### 3.6 API Route Responsibility

Route handlers must be **thin**. They:
- Accept and validate input (Pydantic)
- Call one or more services
- Return structured output (Pydantic)
- Handle and format errors

They must NOT contain: chunking logic, embedding logic, LLM calls, or SQL queries.

---

## 4. RAG Pipeline Architecture

### 4.1 Overview

The RAG pipeline is the core of DocMind AI. It is split into two sub-pipelines:

1. **Ingestion Pipeline** — runs when a document is uploaded
2. **Retrieval Pipeline** — runs when a user asks a question

### 4.2 Ingestion Pipeline (Detail)

```
                    ┌─────────────────┐
                    │  Uploaded File  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  File Validator │  file_utils.py
                    │                 │  - type check
                    │                 │  - size check
                    │                 │  - corruption check
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Document       │  parser.py
                    │  Parser         │  - PyMuPDF (PDF)
                    │                 │  - python-docx (DOCX)
                    │                 │  - plain read (TXT)
                    │                 │  - OCR fallback
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Text Cleaner   │  text_utils.py
                    │                 │  - normalize whitespace
                    │                 │  - remove artifacts
                    │                 │  - preserve structure
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Chunker        │  chunker.py
                    │                 │  - split by tokens
                    │                 │  - add overlap
                    │                 │  - attach metadata
                    │                 │    (doc_id, page, section)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Embedder       │  embeddings.py
                    │                 │  - batch embed chunks
                    │                 │  - configurable provider
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Vector Store   │  vector_store.py
                    │                 │  - upsert to Qdrant
                    │                 │  - store with metadata
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  DB Update      │  document model
                    │                 │  - status = READY
                    │                 │  - page_count stored
                    └─────────────────┘
```

### 4.3 Retrieval Pipeline (Detail)

```
                    ┌─────────────────┐
                    │  User Question  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Question       │  embeddings.py
                    │  Embedder       │  - embed the question
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Vector Search  │  vector_store.py
                    │                 │  - similarity search
                    │                 │  - filter by document_id(s)
                    │                 │  - filter by user_id
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Top-K Chunks   │  retriever.py
                    │                 │  - retrieve top 5 (default)
                    │                 │  - includes metadata
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Reranker       │  reranker.py
                    │  (optional)     │  - cross-encoder reranking
                    │                 │  - improves relevance
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Context        │  llm.py
                    │  Builder        │  - format chunks into context
                    │                 │  - number the sources
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Prompt         │  llm.py
                    │  Constructor    │  - system prompt
                    │                 │  - context block
                    │                 │  - user question
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  LLM API Call   │  llm.py
                    │                 │  - configurable provider
                    │                 │  - streaming optional
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Citation       │  citation.py
                    │  Formatter      │  - extract source metadata
                    │                 │  - validate page numbers
                    │                 │  - build source cards
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Final Response │
                    │                 │  {
                    │                 │    answer: "...",
                    │                 │    sources: [
                    │                 │      { doc, page, section, text }
                    │                 │    ]
                    │                 │  }
                    └─────────────────┘
```

### 4.4 Context Construction Format

The prompt sent to the LLM is structured as:

```
[SYSTEM PROMPT]
You are DocMind AI...

[DOCUMENT CONTEXT]
Source 1:
Document: research_paper.pdf
Page: 7
Section: Methodology
Text: The proposed method uses a transformer-based architecture...

Source 2:
Document: research_paper.pdf
Page: 8
Section: Methodology
Text: The model was evaluated on three benchmark datasets...

[USER QUESTION]
What methodology was used in this research?
```

### 4.5 Anti-Hallucination Strategy

| Strategy | Implementation |
|----------|---------------|
| Grounded prompt | System prompt explicitly forbids fabrication |
| Context-only answers | LLM instructed to use only provided context |
| Missing info handling | Explicit "not found" instruction in system prompt |
| Citation validation | Citations only from retrieved chunk metadata |
| No fake page numbers | System never generates page numbers not in metadata |

### 4.6 Multi-Document RAG

When a user selects multiple documents:

```python
# retriever.py
def retrieve(question: str, document_ids: list[str], top_k: int = 5):
    embedding = embedder.embed(question)
    results = qdrant.search(
        collection="document_chunks",
        query_vector=embedding,
        query_filter=Filter(
            must=[FieldCondition(key="document_id", match=MatchAny(any=document_ids))]
        ),
        limit=top_k
    )
    return results
```

The context builder labels each chunk with its source document so the LLM can attribute claims correctly.

---

## 5. Database Architecture

### 5.1 PostgreSQL Schema

```sql
-- Users
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename    VARCHAR(500) NOT NULL,
    file_type   VARCHAR(10) NOT NULL,           -- pdf | docx | txt
    file_size   BIGINT NOT NULL,                -- bytes
    file_path   VARCHAR(1000) NOT NULL,
    page_count  INTEGER,
    status      VARCHAR(20) DEFAULT 'UPLOADED', -- UPLOADED | PROCESSING | READY | FAILED
    summary     TEXT,
    error_msg   TEXT,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Document Chunks (for metadata + source lookup)
CREATE TABLE document_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    text        TEXT NOT NULL,
    page_number INTEGER,
    section     VARCHAR(500),
    vector_id   VARCHAR(255),                   -- Qdrant point ID
    metadata    JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(500) DEFAULT 'New Conversation',
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role              VARCHAR(20) NOT NULL,      -- user | assistant | system
    content           TEXT NOT NULL,
    sources           JSONB,                     -- array of citation objects
    created_at        TIMESTAMP DEFAULT NOW()
);

-- Feedback
CREATE TABLE feedback (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id    UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating        SMALLINT,                      -- 1 (thumbs up) | -1 (thumbs down)
    feedback_text TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);
```

### 5.2 Entity Relationship Diagram

```
USER
 │
 ├──< DOCUMENT (one user → many documents)
 │        │
 │        └──< DOCUMENT_CHUNK (one document → many chunks)
 │
 ├──< CONVERSATION (one user → many conversations)
 │        │
 │        └──< MESSAGE (one conversation → many messages)
 │                  │
 │                  └──< FEEDBACK (one message → one feedback)
 │
 └──< FEEDBACK (direct user reference)
```

### 5.3 Key Indexes

```sql
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_feedback_message_id ON feedback(message_id);
```

### 5.4 Sources JSON Structure (stored in messages.sources)

```json
[
  {
    "document_id": "doc_123",
    "document_name": "research_paper.pdf",
    "page_number": 7,
    "section": "Methodology",
    "chunk_id": "chunk_15",
    "text": "The proposed method..."
  }
]
```

---

## 6. Vector Database Architecture

### 6.1 Qdrant Overview

Qdrant stores document chunk embeddings with full metadata for semantic search and filtered retrieval.

### 6.2 Collection Design

**Collection name:** `document_chunks`

```python
# vector_store.py — collection creation
client.create_collection(
    collection_name="document_chunks",
    vectors_config=VectorParams(
        size=1536,          # dimension — matches embedding model output
        distance=Distance.COSINE
    )
)
```

### 6.3 Point Schema (per vector)

```python
PointStruct(
    id=str(uuid4()),        # Qdrant point ID (stored as vector_id in PostgreSQL)
    vector=[...],           # float list — embedding vector
    payload={
        "document_id":   "doc_123",
        "user_id":       "user_456",   # for user-level isolation
        "chunk_id":      "chunk_15",
        "chunk_index":   15,
        "document_name": "research_paper.pdf",
        "page_number":   7,
        "section":       "Methodology",
        "text":          "The proposed method...",
    }
)
```

### 6.4 Search with Filtering

```python
# retriever.py
results = client.search(
    collection_name="document_chunks",
    query_vector=question_embedding,
    query_filter=Filter(
        must=[
            FieldCondition(key="user_id", match=MatchValue(value=user_id)),
            FieldCondition(key="document_id", match=MatchAny(any=document_ids)),
        ]
    ),
    limit=top_k,
    with_payload=True,
)
```

### 6.5 Document Deletion

When a document is deleted, all its vectors are removed:

```python
client.delete(
    collection_name="document_chunks",
    points_selector=FilterSelector(
        filter=Filter(
            must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
        )
    )
)
```

### 6.6 Embedding Dimensions by Provider

| Provider | Model | Dimensions |
|----------|-------|-----------|
| OpenAI | text-embedding-3-small | 1536 |
| OpenAI | text-embedding-3-large | 3072 |
| HuggingFace | all-MiniLM-L6-v2 | 384 |
| HuggingFace | all-mpnet-base-v2 | 768 |
| Ollama (local) | nomic-embed-text | 768 |

The collection `size` must match the embedding model output dimension. Set via environment variable.

---

## 7. Authentication Architecture

### 7.1 Auth Flow

```
REGISTRATION:
User → POST /auth/register
    → Validate input
    → Check email uniqueness
    → Hash password (bcrypt)
    → Save user to PostgreSQL
    → Return success

LOGIN:
User → POST /auth/login
    → Validate input
    → Lookup user by email
    → Verify password hash
    → Generate JWT (access token)
    → Return token

AUTHENTICATED REQUEST:
Client → HTTP Request + Authorization: Bearer <token>
    → JWT Middleware
    → Decode token
    → Validate signature + expiry
    → Extract user_id
    → Inject current_user into route
    → Execute route logic
```

### 7.2 JWT Structure

```json
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "user_id_here",
  "email": "user@example.com",
  "exp": 1234567890
}

Signature:
HMACSHA256(base64(header) + "." + base64(payload), SECRET_KEY)
```

### 7.3 Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

### 7.4 Authorization Rules

Every authenticated route must verify ownership:

```python
# Example: get document
def get_document(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == user.id    # ← ownership check
    ).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc
```

Users can only access their own: documents, conversations, messages, feedback.

### 7.5 Frontend Token Handling

```
Login → Store JWT in memory (or secure httpOnly cookie)
    → Attach to every request via Axios interceptor
    → On 401 response → clear token → redirect to /login
    → On app reload → validate token → restore session or redirect
```

---

## 8. Document Processing Architecture

### 8.1 Parser Module (`parser.py`)

Handles three file types with a unified output interface:

```python
class ParsedDocument:
    document_id: str
    document_name: str
    pages: list[ParsedPage]

class ParsedPage:
    page_number: int
    text: str
    section: str | None
```

```
PDF  → PyMuPDF  → extract text per page → ParsedDocument
DOCX → python-docx → extract paragraphs + headings → ParsedDocument
TXT  → plain read → assign virtual page numbers → ParsedDocument
```

**Scanned PDF fallback:**
```
PyMuPDF extracts text → if text is empty or minimal → trigger OCR (Tesseract)
```

### 8.2 Chunker Module (`chunker.py`)

```python
class Chunk:
    document_id: str
    document_name: str
    chunk_id: str
    chunk_index: int
    text: str
    page_number: int
    section: str | None
```

Chunking strategy:
```
ParsedDocument
    ↓
For each page:
    ↓
Split text into token windows (size=800, overlap=150)
    ↓
Assign chunk_index (globally across document)
    ↓
Preserve page_number + section from page
    ↓
Return list[Chunk]
```

Section detection heuristic:
- Lines in ALL CAPS or Title Case at paragraph start → treated as section headings
- DOCX headings → extracted directly as section names

### 8.3 Embeddings Module (`embeddings.py`)

Provider-agnostic interface:

```python
class EmbeddingService:
    def embed(self, text: str) -> list[float]: ...
    def embed_batch(self, texts: list[str]) -> list[list[float]]: ...
```

Provider selection via config:

```python
if settings.EMBEDDING_PROVIDER == "openai":
    return OpenAIEmbeddingService(settings.EMBEDDING_API_KEY)
elif settings.EMBEDDING_PROVIDER == "huggingface":
    return HuggingFaceEmbeddingService(settings.EMBEDDING_MODEL)
elif settings.EMBEDDING_PROVIDER == "local":
    return OllamaEmbeddingService()
```

Batch embedding is used during ingestion to reduce API calls.

### 8.4 Processing Status Lifecycle

```
UPLOADED
    ↓ (processing starts)
PROCESSING
    ↓ (all chunks embedded and stored)
READY
    ↓ (on any unrecoverable error)
FAILED
```

The frontend polls `GET /documents/{id}/status` until status is `READY` or `FAILED`.

### 8.5 Async Processing

Document processing should not block the upload API response:

```
POST /documents/upload
    → Save file
    → Create DB record (status=UPLOADED)
    → Return 202 Accepted immediately
    → Background task starts processing
        → Parse → Chunk → Embed → Store
        → Update status to READY or FAILED
```

Use FastAPI `BackgroundTasks` for MVP. Move to a task queue (Celery + Redis) at scale.

---

## 9. API Design

### 9.1 Request / Response Conventions

All responses follow a consistent envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "The requested document was not found."
  }
}
```

### 9.2 HTTP Status Codes

| Code | Used For |
|------|---------|
| 200 | Successful GET, PATCH, DELETE |
| 201 | Successful POST (resource created) |
| 202 | Accepted (async processing started) |
| 400 | Validation error, bad input |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 413 | File too large |
| 415 | Unsupported file type |
| 422 | Pydantic validation failed |
| 500 | Unexpected server error |

### 9.3 Key Request / Response Schemas

**POST /auth/login**
```json
Request:  { "email": "...", "password": "..." }
Response: { "access_token": "...", "token_type": "bearer", "user": { "id": "...", "name": "...", "email": "..." } }
```

**POST /documents/upload**
```
Request:  multipart/form-data — file field
Response: { "document_id": "...", "filename": "...", "status": "UPLOADED" }
```

**POST /chat**
```json
Request:
{
  "conversation_id": "...",
  "question": "What methodology was used?",
  "document_ids": ["doc_123", "doc_456"]
}

Response:
{
  "answer": "The research uses a transformer-based architecture...",
  "sources": [
    {
      "document_id": "doc_123",
      "document_name": "research_paper.pdf",
      "page_number": 7,
      "section": "Methodology",
      "text": "The proposed method..."
    }
  ],
  "conversation_id": "...",
  "message_id": "..."
}
```

**POST /search**
```json
Request:  { "query": "employee leave policy", "document_ids": ["..."] }
Response: { "results": [ { "document_name": "...", "page_number": 24, "section": "...", "text": "...", "score": 0.91 } ] }
```

### 9.4 Pagination

List endpoints support cursor or offset pagination:

```
GET /documents?page=1&page_size=20
GET /conversations?page=1&page_size=20
```

Response includes:
```json
{
  "items": [...],
  "total": 45,
  "page": 1,
  "page_size": 20
}
```

---

## 10. Deployment Architecture

### 10.1 Local Development

```
docker-compose up
```

Services started by Docker Compose:

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["5173:5173"]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: .env
    depends_on: [postgres, qdrant]

  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: docmind
      POSTGRES_USER: docmind
      POSTGRES_PASSWORD: docmind

  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333"]
    volumes:
      - qdrant_data:/qdrant/storage
```

### 10.2 Production Architecture

```
┌─────────────────────────────────────────┐
│              CDN / DNS                  │
└──────────────┬──────────────────────────┘
               │
    ┌──────────▼──────────┐
    │  Vercel              │  ← React frontend
    │  (Static + Edge)    │
    └──────────┬──────────┘
               │  HTTPS API calls
    ┌──────────▼──────────┐
    │  Render / Railway   │  ← FastAPI backend
    │  (Docker container) │
    └────┬──────────┬─────┘
         │          │
    ┌────▼────┐  ┌──▼────────────┐
    │Managed  │  │ Qdrant Cloud  │
    │Postgres │  │               │
    └─────────┘  └───────────────┘
```

### 10.3 Environment Variables

All configuration via `.env` (never committed):

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/docmind

# Vector DB
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key

# Authentication
SECRET_KEY=your-very-long-random-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Embedding
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_API_KEY=sk-...

# LLM
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=sk-...

# File Storage
UPLOAD_DIR=data/uploads
MAX_FILE_SIZE_MB=50

# RAG Configuration
TOP_K=5
CHUNK_SIZE=800
CHUNK_OVERLAP=150

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
```

Provide `.env.example` with all keys but no values.

---

## 11. Security Architecture

### 11.1 Security Layers

```
Layer 1: HTTPS (transport encryption)
    ↓
Layer 2: CORS (restrict allowed origins)
    ↓
Layer 3: Rate Limiting (prevent abuse on auth + upload)
    ↓
Layer 4: JWT Authentication (identity verification)
    ↓
Layer 5: Authorization (ownership checks on every resource)
    ↓
Layer 6: Input Validation (Pydantic schemas + file validation)
    ↓
Layer 7: File Security (type whitelist, size limit, sanitized names)
    ↓
Layer 8: Secret Management (env vars, no hardcoded keys)
```

### 11.2 File Upload Security

```python
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50MB

def validate_upload(file: UploadFile):
    # 1. Check extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(415, "Unsupported file type")

    # 2. Check MIME type (don't trust extension alone)
    if not is_valid_mime(file.content_type):
        raise HTTPException(415, "Unsupported file type")

    # 3. Check file size
    if file.size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(413, "File too large")

    # 4. Sanitize filename
    safe_name = sanitize_filename(file.filename)
    return safe_name
```

### 11.3 API Key Protection

- All LLM and embedding API keys stored in `.env`
- Backend reads keys via `settings` object
- Frontend never receives or handles API keys
- `.env` is in `.gitignore` at all times

### 11.4 SQL Injection Prevention

SQLAlchemy ORM is used throughout — parameterized queries by default. Raw SQL is avoided. Where raw SQL is needed, use `text()` with bound parameters:

```python
db.execute(text("SELECT * FROM documents WHERE id = :id"), {"id": doc_id})
```

---

## 12. Scalability Considerations

### 12.1 Current MVP Architecture (Single Server)

```
Single FastAPI process
    ↓
Handles uploads, processing, and API requests
```

Limitation: document processing blocks server resources.

### 12.2 First Scale Step — Background Task Queue

```
FastAPI
    ↓ (enqueue task)
Celery Worker
    ↓
Redis (task broker)
    ↓
Processing: parse → chunk → embed → store
    ↓
Update PostgreSQL status
```

This decouples processing from the API server.

### 12.3 Second Scale Step — Horizontal Scaling

```
Load Balancer
    ↓
FastAPI Instance 1
FastAPI Instance 2
FastAPI Instance 3
    ↓
Shared PostgreSQL (connection pool via PgBouncer)
Shared Qdrant (Qdrant Cloud or cluster)
Shared Object Storage (S3 or compatible)
```

### 12.4 Caching Strategy

| Layer | What to Cache | Tool |
|-------|--------------|------|
| Embeddings | Question embeddings for repeated queries | Redis |
| Document summaries | Pre-generated summaries | PostgreSQL (already stored) |
| API responses | List endpoints | Redis / in-memory |
| User sessions | JWT validation results | Redis |

### 12.5 Database Scaling

- Add read replicas for heavy read workloads
- Use PgBouncer for connection pooling
- Archive old conversations to cold storage
- Add partitioning on `messages` table by `created_at`

### 12.6 Vector DB Scaling

Qdrant supports:
- Horizontal sharding across nodes
- On-disk indexing for large collections
- Payload-based filtering (already implemented)

At scale, separate Qdrant collections per tenant (user) rather than filtering by `user_id` payload.

### 12.7 Performance Targets vs. Scale

| Metric | MVP | At Scale |
|--------|-----|---------|
| Concurrent users | ~10–50 | 1000+ |
| Documents stored | ~1000 | Millions |
| Vectors stored | ~500K | Billions |
| Ingestion throughput | Sequential | Parallel workers |
| API latency (p95) | <8s | <3s |

---

## Summary

DocMind AI is built on a clean, modular, layered architecture:

- **React frontend** talks to the backend through a typed API service layer
- **FastAPI backend** delegates all logic to dedicated service modules
- **RAG pipeline** is fully modular — parser, chunker, embedder, retriever, reranker, LLM, citation formatter are all separate
- **PostgreSQL** handles relational data; **Qdrant** handles vector search
- **Authentication** is JWT-based with full ownership enforcement
- **All configuration** is environment-variable driven — no hardcoded secrets
- The architecture is MVP-ready today and designed to scale horizontally

The non-negotiable architectural rule:

> **Every AI answer must flow through: retrieve → ground → cite → verify.**
> DocMind AI is not a chatbot. It is a document intelligence platform.
