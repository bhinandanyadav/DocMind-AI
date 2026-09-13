# Rules & Developer Guidelines

## DocMind AI — Intelligent Document Analysis & RAG Platform

> **These rules are non-negotiable.**
> Every developer and every AI coding agent working on this project must follow them.
> Breaking these rules produces a broken product, not just bad code.

---

## Table of Contents

1. [Core Philosophy](#1-core-philosophy)
2. [RAG Rules](#2-rag-rules)
3. [Anti-Hallucination Rules](#3-anti-hallucination-rules)
4. [Backend Rules](#4-backend-rules)
5. [Frontend Rules](#5-frontend-rules)
6. [Database Rules](#6-database-rules)
7. [Vector Database Rules](#7-vector-database-rules)
8. [Security Rules](#8-security-rules)
9. [API Rules](#9-api-rules)
10. [Error Handling Rules](#10-error-handling-rules)
11. [Development Order Rules](#11-development-order-rules)
12. [Code Quality Rules](#12-code-quality-rules)
13. [Git Rules](#13-git-rules)
14. [Testing Rules](#14-testing-rules)

---

## 1. Core Philosophy

### Rule 1.1 — DocMind AI Is NOT a Chatbot

DocMind AI is a **document intelligence platform**.

The AI answers questions using retrieved content from uploaded documents.

It is NOT:
- A wrapper around ChatGPT
- A generic conversational assistant
- A search engine that returns links
- A system where the LLM answers from its own training data

It IS:
- A RAG system where answers come from real document chunks
- A citation platform where every answer points to a source
- A verification tool where users can check AI answers in the original document

If anyone builds a feature that makes DocMind AI behave like a generic chatbot, that feature is wrong.

---

### Rule 1.2 — Every Answer Must Be Traceable

The central product promise is:

> **Every important AI answer must be traceable back to the original document.**

This means:
- Every answer has a source citation
- Every citation has a document name, page number, and section
- Every citation is clickable and opens the original page
- No answer is fabricated from the LLM's general knowledge when document evidence exists

If an answer cannot be traced to a document, the system must say so explicitly.

---

### Rule 1.3 — P0 Before Everything

Do not build P1 features while P0 is broken.

Do not build P2 features while P1 is incomplete.

The complete P0 pipeline must work end-to-end before any advanced feature is added:

```
Upload → Process → Chunk → Embed → Store → Retrieve → Answer → Cite → View Source
```

---

### Rule 1.4 — Real Data Only

No mock AI responses in the final product.
No hardcoded sample answers.
No fake embeddings.
No simulated vector search.

The system must process real documents, generate real embeddings, perform real retrieval, and call a real LLM.

---

## 2. RAG Rules

### Rule 2.1 — The Pipeline Must Be Real

The RAG pipeline is not optional and cannot be simplified or bypassed.

The full pipeline is:

```
UPLOAD
→ VALIDATE
→ PARSE (text extraction)
→ CHUNK (with overlap and metadata)
→ EMBED (vector generation)
→ STORE (Qdrant)
→ RETRIEVE (semantic search on question)
→ CONTEXT (top-K chunks assembled)
→ PROMPT (system + context + question)
→ LLM (generate answer)
→ CITE (extract and validate sources)
→ RETURN (answer + source cards)
```

Every single step must be implemented. No step can be skipped in the production build.

---

### Rule 2.2 — Keep the RAG Modules Separate

The RAG system must NOT be one big function or one big file.

Each responsibility must have its own module:

| Module | Single Responsibility |
|--------|----------------------|
| `parser.py` | Extract text from PDF/DOCX/TXT |
| `chunker.py` | Split text into chunks with metadata |
| `embeddings.py` | Generate embeddings (provider-agnostic) |
| `vector_store.py` | All Qdrant operations |
| `retriever.py` | Embed question + search + return top-K |
| `reranker.py` | Optional relevance reranking |
| `llm.py` | Prompt construction + LLM API call |
| `citation.py` | Format and validate source citations |

Mixing responsibilities across modules is not allowed.

---

### Rule 2.3 — Chunk Metadata Must Never Be Dropped

Every chunk must carry its full metadata from creation through to the final citation:

```json
{
  "document_id": "doc_123",
  "document_name": "research_paper.pdf",
  "page_number": 7,
  "section": "Methodology",
  "chunk_index": 15,
  "text": "The proposed method..."
}
```

If metadata is missing at any stage, citations become impossible. Treat missing metadata as a critical bug.

---

### Rule 2.4 — Top-K Must Be Configurable

The default Top-K is `5`. It must be settable via environment variable.

Do NOT hardcode `top_k = 5` throughout the codebase. Use `settings.TOP_K`.

---

### Rule 2.5 — Document Filtering Is Mandatory

Vector search must always be filtered by:
1. `user_id` — users cannot retrieve chunks from other users' documents
2. `document_id(s)` — retrieval is scoped to the documents the user selected

A search that returns chunks from documents not selected by the user is a bug.

---

### Rule 2.6 — Context Must Be Clearly Structured

When building the LLM prompt, the context block must be clearly labeled:

```
Source 1:
Document: research_paper.pdf
Page: 7
Section: Methodology
Text: The proposed method uses...

Source 2:
Document: research_paper.pdf
Page: 8
Section: Results
Text: The model achieved 94.3% accuracy...
```

Do not dump raw text into the prompt without labeling which source it came from.

---

### Rule 2.7 — Retrieval Must Use Semantic Search

Do NOT use keyword search or full-text search as the primary retrieval method. The entire value of the system is semantic retrieval via vector similarity.

Keyword search may be offered as a secondary UI feature but never replaces vector retrieval in the RAG pipeline.

---

## 3. Anti-Hallucination Rules

### Rule 3.1 — The LLM Must Never Invent Facts

The LLM must never fabricate:
- Facts or claims
- Numbers or statistics
- Names or organizations
- Dates or deadlines
- Page numbers
- Section names
- Quotations
- Citations

If the retrieved context does not contain the answer, the LLM must say:

> "I couldn't find sufficient information about this in the uploaded documents."

This response is a **success**, not a failure. It means the system is working correctly.

---

### Rule 3.2 — The System Prompt Must Enforce Grounding

Every LLM call must include the anti-hallucination system prompt. It must NOT be optional or skippable.

The system prompt must explicitly:
- Instruct the LLM to use only retrieved document context
- Forbid fabrication of any kind
- Require explicit uncertainty statements when context is insufficient
- Require citations from actual retrieved metadata only

---

### Rule 3.3 — Citations Must Come From Metadata, Not From the LLM

The LLM must NOT be asked to generate page numbers or document names.

Citations must be extracted from the `payload` of retrieved Qdrant points — the actual chunk metadata.

```
CORRECT:
Citations come from chunk.payload.page_number

WRONG:
LLM generates "Page 7" in its response text and that is used as the citation
```

---

### Rule 3.4 — Never Validate a Citation the System Didn't Retrieve

If a chunk for page 42 was not retrieved, the system must not show a citation for page 42.

Only chunks that were actually returned by the vector search can appear as citations.

---

### Rule 3.5 — When in Doubt, Say Nothing

If the retrieval returns low-confidence results and the LLM cannot construct a well-grounded answer, it is better to respond:

> "I couldn't find enough information in the selected documents to answer this confidently."

Than to generate a plausible-sounding but unsupported answer.

---

## 4. Backend Rules

### Rule 4.1 — Routes Must Be Thin

API route handlers do one thing: receive input, call a service, return output.

**Correct:**
```python
@router.post("/chat")
async def chat(request: ChatRequest, user=Depends(get_current_user)):
    result = await chat_service.answer(request, user)
    return result
```

**Wrong:**
```python
@router.post("/chat")
async def chat(request: ChatRequest):
    # 200 lines of embedding, search, LLM, formatting logic here
    ...
```

Business logic belongs in `services/`, not in `api/`.

---

### Rule 4.2 — All Configuration Via Environment Variables

No value that changes between environments (dev, staging, production) may be hardcoded.

This includes:
- Database URLs
- API keys (LLM, embedding, Qdrant)
- Secret keys
- File paths
- Model names
- Top-K values
- Chunk sizes

All config must be read through `settings` (Pydantic `BaseSettings`).

---

### Rule 4.3 — Never Commit Secrets

`.env` is in `.gitignore`. Always.

Provide `.env.example` with all required keys listed but no real values.

If a secret is accidentally committed, treat it as compromised and rotate it immediately.

---

### Rule 4.4 — Use Async Where It Matters

FastAPI is async. Use `async def` for:
- Route handlers
- Database queries (with async SQLAlchemy)
- External API calls (LLM, embedding APIs)
- File I/O

Blocking sync operations inside async routes stall the entire server.

---

### Rule 4.5 — Document Processing Must Be Async / Background

Processing a document (parse → chunk → embed → store) must NOT block the upload API response.

The upload endpoint returns `202 Accepted` immediately. Processing happens in a background task.

The frontend polls `GET /documents/{id}/status` for progress.

---

### Rule 4.6 — Every Service Must Have a Single Responsibility

`parser.py` parses. It does not chunk.
`chunker.py` chunks. It does not embed.
`embeddings.py` embeds. It does not store.
`vector_store.py` stores and searches. It does not embed or retrieve business logic.
`retriever.py` retrieves. It does not call the LLM.
`llm.py` calls the LLM. It does not search vectors.

Cross-service calls go in one direction only. No circular dependencies.

---

### Rule 4.7 — Dependency Injection for All External Services

All services (database session, vector store, embedder, LLM) must be injected via FastAPI `Depends()`.

Never instantiate a database connection or API client directly inside a route handler or service function.

---

### Rule 4.8 — Ownership Check on Every Resource Access

Every endpoint that accesses a document, conversation, or message must verify the resource belongs to the authenticated user.

```python
# Always include user_id in the query filter
doc = db.query(Document).filter(
    Document.id == doc_id,
    Document.user_id == current_user.id
).first()
```

Returning a 404 (not 403) when ownership fails is acceptable — do not reveal that the resource exists.

---

## 5. Frontend Rules

### Rule 5.1 — No Business Logic in Components

React components handle rendering and user interaction only.

They do NOT:
- Call `fetch` or `axios` directly
- Contain document processing logic
- Contain embedding or search logic
- Contain authentication token management

All API calls go through `services/`. All token logic goes in `hooks/useAuth.ts`.

---

### Rule 5.2 — All API Calls Go Through the Service Layer

```
CORRECT:
const documents = await documentService.list();

WRONG:
const res = await axios.get('/documents', { headers: { Authorization: `Bearer ${token}` } });
```

The API base URL, token attachment, and error handling are centralized in `services/api.ts`.

---

### Rule 5.3 — TypeScript Is Not Optional

All files must be `.ts` or `.tsx`. No `.js` files in the frontend.

All API response shapes must have corresponding TypeScript types in `types/`.

No `any` type unless absolutely unavoidable, and must be commented explaining why.

---

### Rule 5.4 — Every Loading State Must Be Handled

No component renders empty content while data is loading.

Every async operation must show one of:
- Skeleton loader (for content areas)
- Spinner (for actions like upload, send)
- Progress bar (for document processing)

The user must always know the system is working.

---

### Rule 5.5 — Every Error State Must Be Handled

No unhandled promise rejections. No silent failures.

Every API call must have a `.catch()` or `try/catch` that:
- Shows a toast notification or inline error message
- Logs the error to the console in development
- Does NOT show raw error messages or stack traces to users

---

### Rule 5.6 — Source Cards Must Be Visually Distinct

Citations are the product's most important differentiator. They must stand out visually.

Source cards must display:
- Document name
- Page number
- Section name
- Relevant text excerpt
- "View Source" button

They must NOT blend in with the AI message text.

---

### Rule 5.7 — No API Keys on the Frontend

The frontend must never contain or handle:
- LLM API keys
- Embedding API keys
- Qdrant API keys
- Any other secret

All AI operations go through the backend. The frontend only talks to the DocMind AI FastAPI backend.

---

### Rule 5.8 — Responsive Design Is Required

Every page must work correctly on:
- Desktop (1280px+)
- Tablet (768px–1279px)
- Mobile (320px–767px)

The chat interface, document viewer, and upload area must be usable on mobile.

---

### Rule 5.9 — Empty States Must Be Designed

Every list or content area must have a designed empty state — not a blank screen.

Examples:
- No documents uploaded yet → show upload prompt
- No conversations yet → show "Ask your first question"
- No search results → show "No results found for this query"

---

## 6. Database Rules

### Rule 6.1 — Use the ORM, Not Raw SQL

All database operations must use SQLAlchemy ORM models.

Raw SQL is only allowed where the ORM cannot express the query, and must use bound parameters:

```python
# Correct raw SQL (parameterized)
db.execute(text("SELECT id FROM documents WHERE user_id = :uid"), {"uid": user_id})

# Wrong (SQL injection risk)
db.execute(f"SELECT id FROM documents WHERE user_id = '{user_id}'")
```

---

### Rule 6.2 — Always Filter by user_id

Every query that retrieves user-owned data must include `user_id` in the filter.

This rule applies to: documents, conversations, messages, chunks, feedback.

---

### Rule 6.3 — Use Migrations for Schema Changes

Never modify the database schema by running raw `ALTER TABLE` commands manually.

All schema changes go through Alembic migrations:

```bash
alembic revision --autogenerate -m "add section column to chunks"
alembic upgrade head
```

Migration files must be committed to the repository.

---

### Rule 6.4 — Use UUID Primary Keys

All tables use UUID primary keys generated by the database (`gen_random_uuid()`).

Never use sequential integer IDs for user-facing resources — they expose enumeration attack surface.

---

### Rule 6.5 — Soft Delete Is Not Required for MVP

For MVP, hard delete is acceptable. When a document is deleted:
1. Delete the PostgreSQL record (cascades to chunks)
2. Delete all vectors from Qdrant filtered by `document_id`
3. Delete the file from storage

All three steps must succeed. If any fails, log the error and mark for cleanup.

---

### Rule 6.6 — Store Sources as JSONB in Messages

The `sources` field on the `messages` table is `JSONB`. This stores the full citation array per message.

Do not create a separate `citations` table for MVP — JSONB is sufficient and faster to query.

---

## 7. Vector Database Rules

### Rule 7.1 — Qdrant Is the Primary Vector Store

Use Qdrant. Do not swap to ChromaDB or FAISS without explicit team decision.

The `vector_store.py` service abstracts Qdrant. If the provider changes, only that file changes.

---

### Rule 7.2 — Always Include user_id in Payload

Every Qdrant point must include `user_id` in its payload.

This enables user-level isolation in all searches. A search without a `user_id` filter is a security bug.

---

### Rule 7.3 — Collection Must Be Created Before Insertion

On application startup, check if the `document_chunks` collection exists. If not, create it.

Do not assume the collection exists. Do not crash on startup if it doesn't.

```python
# vector_store.py
def ensure_collection_exists():
    collections = client.get_collections().collections
    names = [c.name for c in collections]
    if "document_chunks" not in names:
        client.create_collection(...)
```

---

### Rule 7.4 — Sync vector_id Back to PostgreSQL

After inserting a chunk's vector into Qdrant, store the Qdrant point ID in `document_chunks.vector_id`.

This allows lookup from DB record → Qdrant point for updates and deletions.

---

### Rule 7.5 — Delete Vectors When Document Is Deleted

When `DELETE /documents/{id}` is called, all Qdrant vectors for that document must be deleted.

Use `FilterSelector` with `document_id` match. Do not leave orphaned vectors.

---

### Rule 7.6 — Vector Dimension Must Match Embedding Model

The Qdrant collection `size` must match the output dimension of the embedding model configured in `.env`.

If the embedding model changes, a new collection must be created (or re-indexed). Do not insert 1536-dim vectors into a 768-dim collection.

---

## 8. Security Rules

### Rule 8.1 — Hash Every Password With bcrypt

Never store plaintext passwords. Never use MD5 or SHA-256 for passwords.

Use `passlib` with `bcrypt`:

```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

---

### Rule 8.2 — JWT Secret Must Be Strong and From Environment

The `SECRET_KEY` for JWT signing must be:
- At least 32 random characters
- Loaded from environment variable only
- Never hardcoded

A weak or hardcoded secret key means all user sessions can be forged.

---

### Rule 8.3 — Validate File Type by MIME and Extension

Never trust the file extension alone. Check both the MIME type and the extension.

Whitelist only: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`.

Reject everything else with HTTP `415 Unsupported Media Type`.

---

### Rule 8.4 — Sanitize Uploaded Filenames

Never use the original filename from the upload directly as a filesystem path.

Sanitize it:
```python
import re
from pathlib import Path

def sanitize_filename(filename: str) -> str:
    name = Path(filename).stem
    ext = Path(filename).suffix.lower()
    safe = re.sub(r"[^\w\-]", "_", name)
    return f"{safe}{ext}"
```

Store files under a UUID-named path, not the original name.

---

### Rule 8.5 — Enforce File Size Limits

Reject files exceeding `MAX_FILE_SIZE_MB` (default 50MB) before processing begins.

Return HTTP `413 Request Entity Too Large`.

---

### Rule 8.6 — Rate Limit Auth and Upload Endpoints

Apply basic rate limiting to:
- `POST /auth/register` — prevent account spam
- `POST /auth/login` — prevent brute force
- `POST /documents/upload` — prevent abuse

For MVP, a simple in-memory rate limiter is acceptable. Use Redis at scale.

---

### Rule 8.7 — CORS Must Be Configured Explicitly

Do NOT use `allow_origins=["*"]` in production.

List allowed origins explicitly via environment variable:

```python
origins = settings.ALLOWED_ORIGINS.split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins, ...)
```

---

### Rule 8.8 — Never Log Sensitive Data

Never log:
- Passwords (plaintext or hashed)
- JWT tokens
- API keys
- Full file contents
- User PII beyond user ID

Logs are for debugging system behavior, not storing secrets.

---

## 9. API Rules

### Rule 9.1 — All Responses Must Follow the Envelope Format

Every API response must be structured consistently:

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

No raw strings, no inconsistent shapes.

---

### Rule 9.2 — Use Correct HTTP Status Codes

| Situation | Code |
|-----------|------|
| Resource created | 201 |
| Async task accepted | 202 |
| Bad user input | 400 |
| Not authenticated | 401 |
| Authenticated, not authorized | 403 |
| Resource not found | 404 |
| File too large | 413 |
| Unsupported file type | 415 |
| Validation error | 422 |
| Server error | 500 |

Never return `200 OK` for an error. Never return `500` for user input problems.

---

### Rule 9.3 — Validate All Input With Pydantic

Every request body must have a Pydantic schema.

Do not access `request.json()` directly and parse manually.

Pydantic provides: type coercion, validation errors, and auto-generated OpenAPI docs.

---

### Rule 9.4 — Never Return Sensitive Data in Responses

API responses must never include:
- `password_hash`
- JWT tokens (except the login endpoint)
- Internal file paths
- API keys
- Stack traces
- Raw database error messages

---

### Rule 9.5 — Paginate All List Endpoints

Any endpoint returning a list of resources must support pagination.

Minimum: `?page=1&page_size=20`

Never return unbounded lists. A user with 10,000 documents should not receive all 10,000 in one response.

---

### Rule 9.6 — Document All Endpoints in OpenAPI

FastAPI generates OpenAPI docs automatically from Pydantic schemas and route definitions.

Every route must have:
- A docstring describing what it does
- A proper response model
- Proper error response annotations

Access at `GET /docs` (Swagger UI) and `GET /redoc`.

---

## 10. Error Handling Rules

### Rule 10.1 — User-Facing Errors Must Be Human-Readable

Users never see:
- Python tracebacks
- SQL error messages
- Internal exception class names
- Stack traces

They see only friendly, actionable messages:

| Scenario | Message Shown |
|----------|--------------|
| Unsupported file | "This file type is not supported. Please upload a PDF, DOCX, or TXT file." |
| File too large | "This file exceeds the 50MB limit. Please upload a smaller file." |
| Corrupt file | "We couldn't process this document. The file may be corrupt." |
| Empty document | "No readable text was found in this document." |
| AI unavailable | "The AI service is temporarily unavailable. Please try again shortly." |
| No context found | "I couldn't find enough information in the selected documents." |
| Vector DB down | "Document search is temporarily unavailable. Please try again shortly." |
| Auth failure | "Your session has expired. Please log in again." |
| Server error | "Something went wrong on our end. Please try again." |

---

### Rule 10.2 — Log All Errors Internally With Context

Every caught exception must be logged with:
- Timestamp
- User ID (if authenticated)
- Document ID (if relevant)
- Error type and message
- Relevant context

Do NOT silently swallow exceptions with empty `except: pass` blocks.

---

### Rule 10.3 — Processing Failures Must Update Document Status

If document processing fails at any stage, the document status must be updated to `FAILED`.

The error message must be stored in `documents.error_msg` for debugging.

The user must be shown a clear failure indicator on the document card.

---

### Rule 10.4 — The AI "Not Found" Response Is Not an Error

When the AI responds:

> "I couldn't find sufficient information about this in the uploaded documents."

This is the system behaving **correctly**. Do not log this as an error. Do not show an error state in the UI.

Display it as a normal AI message.

---

### Rule 10.5 — Handle Network Errors Gracefully on the Frontend

If the backend is unreachable, show:

> "Unable to connect. Please check your connection and try again."

Do not show `Network Error`, `ERR_CONNECTION_REFUSED`, or any raw browser error.

---

## 11. Development Order Rules

### Rule 11.1 — P0 Comes First, Always

The development order is fixed:

```
Phase 1:  Project Setup
Phase 2:  Authentication
Phase 3:  Database
Phase 4:  Document Upload
Phase 5:  Document Processing
Phase 6:  Chunking
Phase 7:  Embeddings
Phase 8:  Vector Database
Phase 9:  Retrieval
Phase 10: RAG Pipeline
Phase 11: Chat Interface
Phase 12: Citations
Phase 13: Document Viewer
Phase 14: Summarization
Phase 15: Multi-Document + Comparison
Phase 16: Advanced P1 Features
Phase 17: Testing + UI Polish
Phase 18: Deployment
```

Do not jump to Phase 11 (Chat) before Phase 10 (RAG) works.
Do not jump to Phase 15 before the full Phase 10–14 pipeline is tested.

---

### Rule 11.2 — Each Phase Must Be Tested Before the Next Begins

Before moving to the next phase, verify the current phase works:

- Phase 5 (Processing): run a real PDF through the pipeline and confirm chunks are created in the DB
- Phase 8 (Vector DB): confirm vectors are stored and searchable in Qdrant
- Phase 10 (RAG): ask a question and confirm the answer comes from retrieved document context
- Phase 12 (Citations): confirm citations match actual chunk metadata

If a phase is incomplete or broken, fix it before proceeding.

---

### Rule 11.3 — Do Not Build the UI Before the API Works

Do not build the full chat UI before the chat API works.
Do not build the upload UI before the upload API works.
Do not build the document viewer before the viewer API works.

Frontend development should follow backend completion by one phase, not lead it.

---

### Rule 11.4 — P2 Features Are Only for After the Hackathon MVP

P2 features (voice assistant, knowledge graph, multilingual, agentic analysis) are not to be worked on until:
- All P0 features are complete and tested
- All P1 features are at least 70% complete
- The hackathon demo flow works end-to-end

---

## 12. Code Quality Rules

### Rule 12.1 — One File, One Responsibility

Every Python file and every TypeScript file must have a single, clear responsibility.

File names must describe what the file does:
- `parser.py` — parses documents
- `chunker.py` — chunks text
- `DocumentCard.tsx` — renders a document card

Files named `utils.py`, `helpers.py`, or `misc.tsx` that contain unrelated logic are not acceptable beyond genuine shared utilities.

---

### Rule 12.2 — No God Functions

A function longer than ~50 lines is a sign it should be split.

A function that does more than one thing (e.g., both parses AND chunks) must be split.

Name functions clearly with verbs:
- `extract_text_from_pdf()`
- `split_into_chunks()`
- `generate_embedding()`
- `search_similar_chunks()`
- `format_citation()`

---

### Rule 12.3 — Name Things Clearly

No single-letter variable names outside of loop counters.
No abbreviations that aren't universally understood (`doc` is fine, `d` is not).
No vague names like `data`, `result`, `obj`, `thing`.

```python
# Wrong
def proc(d, k):
    r = vs.s(d, k)
    return r

# Correct
def retrieve_chunks(document_ids: list[str], top_k: int) -> list[Chunk]:
    results = vector_store.search(document_ids, top_k)
    return results
```

---

### Rule 12.4 — Type Everything in Python

Use Python type hints on all function signatures:

```python
# Wrong
def chunk_text(text, chunk_size, overlap):
    ...

# Correct
def chunk_text(text: str, chunk_size: int, overlap: int) -> list[Chunk]:
    ...
```

Use Pydantic models for all structured data passed between services.

---

### Rule 12.5 — No Commented-Out Code in Commits

If code is not needed, delete it. Git history preserves old versions.

Commented-out code in a commit is noise.

---

### Rule 12.6 — Environment-Specific Logic Must Use Config

Do not write:

```python
if os.getenv("ENV") == "production":
    db_url = "prod-db-url"
else:
    db_url = "localhost"
```

Use `settings.DATABASE_URL` which is set per environment via `.env`.

---

### Rule 12.7 — DRY — Do Not Repeat Yourself

If the same logic appears in two places, extract it into a shared function or utility.

The exception is when two pieces of code look similar but serve different domains — do not force abstraction where it creates confusion.

---

## 13. Git Rules

### Rule 13.1 — Never Commit Directly to `main`

All work happens on feature branches.

Branch naming:
```
feature/document-upload
feature/rag-pipeline
feature/chat-interface
fix/citation-page-number-bug
chore/update-dependencies
```

`main` branch must always be deployable.

---

### Rule 13.2 — Never Commit `.env`

`.env` is always in `.gitignore`.

Verify before every commit:
```bash
git status
```

If `.env` appears in the staged files, remove it immediately:
```bash
git reset HEAD .env
```

---

### Rule 13.3 — Commit Messages Must Describe What Changed

```
# Wrong
git commit -m "fix"
git commit -m "update"
git commit -m "stuff"

# Correct
git commit -m "feat: add PDF text extraction with page metadata"
git commit -m "fix: correct citation page number from chunk metadata"
git commit -m "chore: add Qdrant collection initialization on startup"
```

Format: `type: short description`

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`

---

### Rule 13.4 — Do Not Force Push to Shared Branches

`git push --force` on `main` or shared branches is forbidden.

If a commit needs to be undone, use `git revert`.

---

### Rule 13.5 — Review Before Merging

Every pull request to `main` requires:
- The feature works as described
- No secrets are included
- Tests pass
- No obvious broken imports or syntax errors

---

### Rule 13.6 — Keep .gitignore Complete

At minimum, `.gitignore` must include:

```
.env
__pycache__/
*.pyc
*.pyo
node_modules/
dist/
.venv/
venv/
data/uploads/
data/processed/
*.log
.DS_Store
```

---

## 14. Testing Rules

### Rule 14.1 — Test the Full RAG Pipeline

The most critical test is end-to-end:

```
Upload a known PDF
→ Verify chunks are created in PostgreSQL
→ Verify vectors are stored in Qdrant
→ Ask a question whose answer is in the PDF
→ Verify the answer contains content from the PDF
→ Verify the citation points to the correct page
```

This test must pass before the product is considered working.

---

### Rule 14.2 — Test Anti-Hallucination

Always include this test:

```
Upload a document about Topic A.
Ask a question about Topic B (which does not appear in the document).
Expected response: "I couldn't find sufficient information about this in the uploaded documents."
```

If the system answers with fabricated information, this is a critical failure.

---

### Rule 14.3 — Test Authentication and Authorization

Must test:
- Registration creates a user with hashed password
- Login with correct credentials returns a JWT
- Login with wrong password returns `401`
- Protected routes return `401` without a token
- User A cannot access User B's documents (returns `404`)

---

### Rule 14.4 — Test Document Processing

For each supported file type (PDF, DOCX, TXT):

- Upload the file → status becomes `PROCESSING`
- Wait for processing → status becomes `READY`
- Verify `document_chunks` records exist in PostgreSQL
- Verify vectors exist in Qdrant
- Verify chunk metadata includes page_number and section

---

### Rule 14.5 — Test Error Scenarios

Must test:
- Upload an unsupported file type (e.g., `.exe`) → `415`
- Upload a file over the size limit → `413`
- Upload a corrupt PDF → document status becomes `FAILED`
- Upload an empty TXT file → appropriate error message
- Ask a question with no documents selected → appropriate error

---

### Rule 14.6 — Write Tests Alongside Features

Tests are written in the same phase as the feature, not after all features are done.

Test files live in `backend/tests/`:

```
tests/
├── test_auth.py
├── test_documents.py
├── test_processing.py
├── test_rag.py
├── test_citations.py
└── test_search.py
```

Use `pytest` with `httpx.AsyncClient` for FastAPI route testing.

---

### Rule 14.7 — Maintain an Evaluation Dataset

Keep a set of sample documents and benchmark questions in `data/eval/`:

```
data/
└── eval/
    ├── documents/
    │   ├── research_paper_1.pdf
    │   └── employee_handbook.pdf
    └── questions.json
```

`questions.json` format:
```json
[
  {
    "document": "research_paper_1.pdf",
    "question": "What methodology was used?",
    "type": "semantic",
    "expected_page": 7,
    "expected_section": "Methodology"
  },
  {
    "document": "employee_handbook.pdf",
    "question": "What was the stock price in 1985?",
    "type": "unanswerable",
    "expected_response": "not_found"
  }
]
```

Run this benchmark before every major release.

---

## Summary

These rules exist for one reason:

> **DocMind AI is only as good as the trust users place in its answers.**

If the RAG pipeline is bypassed, trust is broken.
If citations are fabricated, trust is broken.
If security is weak, trust is broken.
If the code is a mess, the pipeline breaks and trust is broken.

Follow the rules. Build the pipeline correctly. Deliver a product where every answer can be verified.

---

*DocMind AI — Turn Documents Into Intelligence.*
