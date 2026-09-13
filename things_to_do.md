# Things To Do

## DocMind AI — Master Task Checklist

> Check off every task as you complete it.
> Do NOT move to the next phase until the current phase is done and tested.

---

## PHASE 1 — Project Setup

### Repository & Structure
- [ ] Create root folder `docmind-ai/`
- [ ] Initialize git repository (`git init`)
- [ ] Create `.gitignore` (node_modules, .env, __pycache__, data/uploads, .venv)
- [ ] Create `README.md` with project description
- [ ] Create folder structure: `frontend/`, `backend/`, `data/`, `tests/`

### Backend Setup
- [ ] Create `backend/` directory
- [ ] Create Python virtual environment: `python -m venv .venv`
- [ ] Create `requirements.txt` with:
  - `fastapi`, `uvicorn[standard]`, `pydantic[email]`, `pydantic-settings`
  - `sqlalchemy`, `alembic`, `asyncpg`, `psycopg2-binary`
  - `python-jose[cryptography]`, `passlib[bcrypt]`
  - `python-multipart`, `httpx`, `python-dotenv`
  - `pymupdf`, `python-docx`, `tiktoken`
  - `qdrant-client`, `openai`, `langchain`
- [ ] Install all dependencies: `pip install -r requirements.txt`
- [ ] Create `backend/app/main.py` — basic FastAPI app with health check
- [ ] Create `backend/app/config.py` — Pydantic `BaseSettings` loading from `.env`
- [ ] Create `.env` file with all required keys
- [ ] Create `.env.example` with all keys but no values
- [ ] Verify: `uvicorn app.main:app --reload` runs without errors
- [ ] Verify: `GET /` returns `{ "status": "ok", "service": "DocMind AI" }`

### Frontend Setup
- [ ] Scaffold with Vite: `npm create vite@latest frontend -- --template react-ts`
- [ ] `cd frontend && npm install`
- [ ] Install dependencies:
  - `tailwindcss postcss autoprefixer`
  - `@shadcn/ui` (initialize: `npx shadcn-ui@latest init`)
  - `lucide-react`
  - `react-router-dom`
  - `axios`
  - `react-markdown`
  - `@tanstack/react-query`
  - `react-pdf` or `pdfjs-dist`
- [ ] Configure `tailwind.config.ts`
- [ ] Add Inter font to `index.html`
- [ ] Create `src/services/api.ts` — Axios instance with base URL from env
- [ ] Create `src/router/index.tsx` — basic router with placeholder route
- [ ] Create `src/types/` folder with placeholder files
- [ ] Verify: `npm run dev` runs without errors at `localhost:5173`

### Docker
- [ ] Create `docker-compose.yml` with:
  - `postgres:15` (port 5432, db: docmind, user: docmind, password: docmind)
  - `qdrant/qdrant:latest` (port 6333, persistent volume)
- [ ] Verify: `docker compose up -d` starts both services
- [ ] Verify: PostgreSQL accessible at `localhost:5432`
- [ ] Verify: Qdrant dashboard at `http://localhost:6333/dashboard`

**✅ Phase 1 complete when:** Frontend at 5173, backend at 8000, Postgres + Qdrant running via Docker.

---

## PHASE 2 — Database

### SQLAlchemy Setup
- [ ] Create `backend/app/database/session.py`:
  - SQLAlchemy engine with `DATABASE_URL` from config
  - `SessionLocal` factory
  - `get_db()` dependency function
  - `Base` declarative base
- [ ] Create `backend/app/database/__init__.py`

### ORM Models
- [ ] Create `backend/app/models/user.py` — User model (id UUID, name, email, password_hash, created_at)
- [ ] Create `backend/app/models/document.py` — Document model (id, user_id FK, filename, file_type, file_size, file_path, page_count, status, summary, error_msg, created_at, updated_at)
- [ ] Create `backend/app/models/chunk.py` — DocumentChunk model (id, document_id FK, chunk_index, text, page_number, section, vector_id, metadata JSONB)
- [ ] Create `backend/app/models/conversation.py` — Conversation model (id, user_id FK, title, created_at, updated_at)
- [ ] Create `backend/app/models/message.py` — Message model (id, conversation_id FK, role, content, sources JSONB, created_at)
- [ ] Create `backend/app/models/feedback.py` — Feedback model (id, message_id FK, user_id FK, rating, feedback_text, created_at)
- [ ] Create `backend/app/models/__init__.py` importing all models

### Alembic Migrations
- [ ] Initialize Alembic: `alembic init app/database/migrations`
- [ ] Configure `alembic.ini` and `env.py` to use `DATABASE_URL` from config
- [ ] Create initial migration: `alembic revision --autogenerate -m "initial tables"`
- [ ] Run migration: `alembic upgrade head`
- [ ] Verify: all 6 tables exist in PostgreSQL
- [ ] Verify: foreign keys and cascades are correct
- [ ] Verify: indexes exist on user_id, document_id, conversation_id columns

**✅ Phase 2 complete when:** All 6 tables exist in Postgres and are queryable.

---

## PHASE 3 — Authentication Backend

### Utilities
- [ ] Create `backend/app/utils/security.py`:
  - `hash_password(password: str) -> str` using bcrypt
  - `verify_password(plain: str, hashed: str) -> bool`
  - `create_access_token(user_id: str, email: str) -> str`
  - `decode_access_token(token: str) -> dict`
- [ ] Create `backend/app/middleware/auth.py`:
  - `get_current_user(token, db)` — FastAPI dependency
  - Decodes JWT, fetches user from DB, raises 401 if invalid

### Schemas
- [ ] Create `backend/app/schemas/auth.py`:
  - `RegisterRequest` (name, email, password with validators)
  - `LoginRequest` (email, password)
  - `TokenResponse` (access_token, token_type, user)
  - `UserResponse` (id, name, email, created_at)

### API Routes
- [ ] Create `backend/app/api/auth.py`:
  - `POST /auth/register` — validate → check duplicate email → hash → save → return 201
  - `POST /auth/login` — lookup → verify password → generate JWT → return token
  - `POST /auth/logout` — return 200 success (stateless JWT)
  - `GET /auth/me` — protected, return current user data
- [ ] Register auth router in `main.py` with prefix `/auth`

### Tests
- [ ] `POST /auth/register` valid data → 201 + user
- [ ] `POST /auth/register` duplicate email → 400
- [ ] `POST /auth/login` correct credentials → JWT
- [ ] `POST /auth/login` wrong password → 401
- [ ] `GET /auth/me` with valid JWT → user data
- [ ] `GET /auth/me` without token → 401
- [ ] `GET /auth/me` with expired token → 401

**✅ Phase 3 complete when:** Register, login return correct responses. JWT protects routes.

---

## PHASE 4 — Authentication Frontend

### Services & Hooks
- [ ] Create `src/services/authService.ts` (register, login, logout, getMe)
- [ ] Update `src/services/api.ts`:
  - Attach JWT token to every request via interceptor
  - On 401 response → clear token → redirect to /login
- [ ] Create `src/contexts/AuthContext.tsx` — user state, isAuthenticated, isLoading
- [ ] Create `src/hooks/useAuth.ts` — login(), logout(), register() actions

### Components & Layouts
- [ ] Create `src/layouts/AuthLayout.tsx` — centered card layout
- [ ] Create `src/router/ProtectedRoute.tsx` — redirect to /login if not authenticated

### Pages
- [ ] Create `src/pages/Login.tsx`:
  - Email + password inputs
  - Login button with loading state
  - Error message display
  - Link to /register
- [ ] Create `src/pages/Register.tsx`:
  - Name + email + password + confirm password
  - Register button with loading state
  - Password mismatch validation
  - Email already taken error display
  - Link to /login

### Routing
- [ ] Add routes in `router/index.tsx`:
  - `/` → redirect to /dashboard (if auth) or /login
  - `/login` → Login (public)
  - `/register` → Register (public)
  - `/dashboard` → placeholder (protected)

### Tests
- [ ] Register with valid data → redirects to /dashboard
- [ ] Register with taken email → shows inline error
- [ ] Login with correct credentials → JWT stored, redirects
- [ ] Login with wrong password → shows error
- [ ] Reload page → remains logged in (token persisted)
- [ ] Visit /dashboard without auth → redirects to /login

**✅ Phase 4 complete when:** Login and Register pages work, JWT persists, protected routes redirect.

---

## PHASE 5 — Landing Page

### Page
- [ ] Create `src/pages/Landing.tsx` with sections:
  - Navbar (logo + Login + Get Started buttons)
  - Hero (headline, subtext, 2 CTA buttons, app preview image)
  - Problem section (3 pain point cards)
  - How It Works (3-step flow with icons)
  - Features (6 cards in grid)
  - CTA section ("Start for Free" → /register)
  - Footer (name + tagline)
- [ ] Create `src/components/common/Navbar.tsx` (public version)
- [ ] Apply gradient background to hero section
- [ ] Make fully responsive (mobile stacks to single column)

### Routing
- [ ] `/` → Landing (public, no auth check)

**✅ Phase 5 complete when:** Landing page loads, looks professional, CTA links work.

---

## PHASE 6 — Document Upload Backend

### Utilities
- [ ] Create `backend/app/utils/file_utils.py`:
  - `validate_file(file)` — check extension whitelist + MIME type + size limit
  - `sanitize_filename(filename)` — remove unsafe characters
  - `save_upload(file, upload_dir)` — write to `data/uploads/{uuid}/{filename}`
  - `delete_file(file_path)` — remove from disk

### Schemas
- [ ] Create `backend/app/schemas/document.py`:
  - `DocumentResponse` (id, filename, file_type, file_size, page_count, status, created_at)
  - `DocumentListResponse` (items, total, page, page_size)
  - `DocumentUpdateRequest` (filename)

### API Routes
- [ ] Create `backend/app/api/documents.py`:
  - `POST /documents/upload` — validate → save → create DB record → return 202
  - `GET /documents` — list user docs (paginated, sorted by created_at desc)
  - `GET /documents/{id}` — get single doc (ownership check → 404 if not owned)
  - `PATCH /documents/{id}` — rename (ownership check)
  - `DELETE /documents/{id}` — delete record + file (ownership check)
  - `GET /documents/{id}/status` — return status + error_msg if FAILED
- [ ] Register documents router in `main.py`

### Tests
- [ ] Upload valid PDF → 202, record in DB with status UPLOADED
- [ ] Upload `.exe` → 415
- [ ] Upload oversized file → 413
- [ ] `GET /documents` returns only current user's docs
- [ ] User A cannot access User B's document → 404
- [ ] `DELETE /documents/{id}` removes file and record

**✅ Phase 6 complete when:** Files upload, validate, save to disk, appear in DB.

---

## PHASE 7 — Document Upload Frontend

### Components
- [ ] Create `src/components/documents/UploadZone.tsx`:
  - Drag-and-drop with visual drag-over state
  - File picker button
  - File preview (name + size + type icon)
  - Upload progress bar (0–100%)
  - Success / error state
- [ ] Create `src/components/documents/ProcessingStatus.tsx`:
  - Status badge with correct color per status
  - Auto-polls `GET /documents/{id}/status` every 3s while PROCESSING
  - Stops polling on READY or FAILED
- [ ] Create `src/components/documents/UploadModal.tsx`:
  - Dialog wrapping UploadZone
  - Opens from "Upload Document" button

### Services & Hooks
- [ ] Update `src/services/documentService.ts`:
  - `upload(file, onProgress)` with Axios upload progress
  - `list(page, pageSize)`, `get(id)`, `rename(id, name)`, `remove(id)`, `getStatus(id)`
- [ ] Create `src/hooks/useUpload.ts` — upload state, progress, error

### Tests
- [ ] Drag + drop PDF → upload starts, progress bar fills
- [ ] Upload completes → status shows PROCESSING
- [ ] Status auto-updates to READY after backend finishes
- [ ] Upload invalid file type → shows error message
- [ ] Upload too-large file → shows error message

**✅ Phase 7 complete when:** Upload UI works with progress and status polling.

---

## PHASE 8 — Document Processing Pipeline

### Parser Service
- [ ] Create `backend/app/services/parser.py`:
  - `ParsedPage` dataclass (page_number, text, section)
  - `ParsedDocument` dataclass (document_id, document_name, pages)
  - `parse_pdf(file_path)` using PyMuPDF — extract text per page, detect sections
  - `parse_docx(file_path)` using python-docx — extract paragraphs, headings as sections
  - `parse_txt(file_path)` — read text, assign virtual page numbers (every 3000 chars)
  - OCR fallback: if PDF text is empty → use pytesseract

### Chunker Service
- [ ] Create `backend/app/services/chunker.py`:
  - `Chunk` dataclass (document_id, document_name, chunk_id, chunk_index, text, page_number, section)
  - `chunk_document(parsed_doc, chunk_size=800, overlap=150)` → `list[Chunk]`
  - Use `tiktoken` for token counting
  - Apply sliding window with overlap
  - Preserve page_number and section from source page

### Processor Orchestrator
- [ ] Create `backend/app/services/processor.py`:
  - `process_document(document_id, db)` — full pipeline function
  - Step 1: Update status → PROCESSING
  - Step 2: Get file path from DB
  - Step 3: Parse document (router by file_type)
  - Step 4: Chunk document
  - Step 5: Save chunks to `document_chunks` table
  - Step 6: Update `page_count` on document record
  - Step 7: Trigger embedding (Phase 9)
  - On any exception → update status → FAILED, save error_msg

- [ ] Update `POST /documents/upload` to launch `processor.process_document()` as `BackgroundTask`

### Tests
- [ ] Upload test.pdf → chunks created in document_chunks table
- [ ] Each chunk has page_number, section, chunk_index, text
- [ ] Upload test.docx → chunks created with heading-based sections
- [ ] Upload test.txt → chunks created with virtual page numbers
- [ ] Document status → READY after processing
- [ ] Upload empty PDF → status → FAILED, error_msg stored
- [ ] Chunk overlap is applied (last N tokens of chunk N appear at start of chunk N+1)

**✅ Phase 8 complete when:** Any supported file is parsed and chunked with full metadata in the DB.

---

## PHASE 9 — Embeddings & Vector Database

### Embeddings Service
- [ ] Create `backend/app/services/embeddings.py`:
  - `EmbeddingService` abstract base class with `embed()` and `embed_batch()`
  - `OpenAIEmbeddingService` — uses `openai` SDK, model from config
  - `HuggingFaceEmbeddingService` — uses `sentence-transformers`
  - `get_embedding_service()` factory — reads `EMBEDDING_PROVIDER` from config
  - Batch embed with rate limiting / retry on 429

### Vector Store Service
- [ ] Create `backend/app/services/vector_store.py`:
  - `QdrantVectorStore` class
  - `ensure_collection_exists()` — create `document_chunks` collection if missing
  - `insert_chunks(chunks, embeddings)` — upsert PointStruct list with full payload
  - `search(query_vector, document_ids, user_id, top_k)` → scored results
  - `delete_by_document(document_id)` — delete all vectors by document_id filter
  - `get_qdrant_client()` — dependency factory from config
- [ ] Call `ensure_collection_exists()` in `main.py` startup event

### Update Processor
- [ ] Update `backend/app/services/processor.py`:
  - After chunking → call `embeddings.embed_batch(chunk_texts)`
  - Call `vector_store.insert_chunks(chunks, vectors)`
  - Store `vector_id` back to each `document_chunks` record in DB
  - After all vectors stored → update document status → READY

### Update Delete
- [ ] Update `DELETE /documents/{id}` to also call `vector_store.delete_by_document(id)`

### Tests
- [ ] After processing → vectors appear in Qdrant dashboard
- [ ] Each point payload has: document_id, user_id, page_number, section, text
- [ ] `vector_store.search(...)` returns relevant chunks for test query
- [ ] Delete document → vectors removed from Qdrant
- [ ] Collection created automatically on first startup

**✅ Phase 9 complete when:** Documents are fully embedded and searchable in Qdrant.

---

## PHASE 10 — RAG Pipeline

### Retriever Service
- [ ] Create `backend/app/services/retriever.py`:
  - `retrieve(question, document_ids, user_id, top_k)` → `list[ScoredChunk]`
  - Embed question using EmbeddingService
  - Search Qdrant with user_id + document_ids filter
  - Return chunks with metadata preserved

### Reranker Service
- [ ] Create `backend/app/services/reranker.py`:
  - `rerank(question, chunks)` → sorted `list[ScoredChunk]`
  - For MVP: keyword overlap scoring fallback
  - Future: cross-encoder model support

### LLM Service
- [ ] Create `backend/app/services/llm.py`:
  - `LLMService` abstract base
  - `OpenAILLMService` — uses openai SDK, model from config
  - `GroqLLMService` — uses Groq SDK
  - `get_llm_service()` factory from config
  - `build_context(chunks)` → labeled context string (Source 1, Source 2...)
  - `build_prompt(question, context)` → system prompt + context + question
  - `generate(question, context)` → answer string
  - System prompt must include all anti-hallucination rules

### Citation Formatter
- [ ] Create `backend/app/utils/citation.py`:
  - `Citation` dataclass (document_id, document_name, page_number, section, text)
  - `extract_citations(chunks)` → `list[Citation]`
  - Only creates citations from actual retrieved chunk metadata
  - Never generates page numbers not present in metadata

### Chat API (basic)
- [ ] Create `backend/app/api/chat.py`:
  - `POST /chat` — receives question + document_ids
  - Calls retriever → reranker → llm → citation formatter
  - Returns `{ answer, sources }` (no DB persistence yet — added in Phase 13)
- [ ] Register chat router in `main.py`

### Tests
- [ ] Upload PDF with known content, ask a direct question → answer contains document content
- [ ] Answer sources contain correct page_number and section
- [ ] Ask question NOT in document → AI responds with "not found" message
- [ ] Two users each upload docs → User A's query only retrieves User A's chunks
- [ ] `extract_citations` never produces a citation without metadata

**✅ Phase 10 complete when:** Full RAG pipeline works end-to-end. Upload → ask → grounded answer + citations.

---

## PHASE 11 — Dashboard

### Components
- [ ] Create `src/components/common/Sidebar.tsx`:
  - Logo + wordmark at top
  - Nav items: Dashboard, Documents, Chat, Search, Compare, Research, Study
  - Active state highlighting
  - Bottom: Settings + user avatar + name + logout
  - Collapse to icon-only on tablet
- [ ] Create `src/layouts/AppLayout.tsx` — sidebar + main content area
- [ ] Create `src/components/dashboard/StatsCard.tsx` — icon + number + label
- [ ] Create `src/components/dashboard/RecentDocuments.tsx` — last 5 docs list
- [ ] Create `src/components/dashboard/RecentConversations.tsx` — last 5 convos list

### Page
- [ ] Create `src/pages/Dashboard.tsx`:
  - "Welcome back, {name}" header
  - Upload Document button (top right)
  - 3 stats cards (Documents, Pages, Questions)
  - Recent Documents section (with status badges)
  - Recent Conversations section
  - Empty states for each section

### Backend
- [ ] Add `GET /dashboard/stats` endpoint:
  - document_count, total_pages, question_count for current user

### Tests
- [ ] Dashboard loads with real stats from API
- [ ] Recent documents show correct status badges
- [ ] Empty state shows when no documents exist
- [ ] Stats update after uploading a document

**✅ Phase 11 complete when:** Dashboard shows real stats, recent docs, recent convos.

---

## PHASE 12 — Documents Page

### Components
- [ ] Create `src/components/documents/DocumentCard.tsx`:
  - File type icon (colored by type)
  - Filename (truncated)
  - Status badge (with animated pulse for PROCESSING)
  - Page count + file size + upload date
  - 3-dot action menu (Open, Chat, Rename, Delete)
- [ ] Create `src/components/documents/DocumentTable.tsx` — table view alternative
- [ ] Create `src/components/documents/DocumentSearch.tsx` — search + filter + sort bar

### Page
- [ ] Create `src/pages/Documents.tsx`:
  - Page header with title + Upload button
  - Search bar (filter by filename)
  - Filter dropdown (by status, by type)
  - Sort dropdown (by date, name, size)
  - Grid view (default) / table view toggle
  - Document cards with auto-refresh for PROCESSING items
  - Rename dialog (inline input + save)
  - Delete confirmation dialog
  - Empty state when no documents
  - Skeleton loaders while fetching

### Hooks
- [ ] Create `src/hooks/useDocuments.ts` — list, refetch, optimistic delete/rename

### Tests
- [ ] Documents list loads from API
- [ ] PROCESSING status badge animates
- [ ] Search filters list in real time
- [ ] Rename dialog updates document name
- [ ] Delete confirmation then removes from list
- [ ] Empty state visible when no documents

**✅ Phase 12 complete when:** All document management actions work from the UI.

---

## PHASE 13 — AI Chat Backend

### Update Chat API
- [ ] Update `backend/app/api/chat.py`:
  - `POST /chat` — now also saves user message + AI response + sources to DB
  - Accept `conversation_id` (optional — create new conversation if not provided)
  - Auto-generate conversation title from first message (first 50 chars)
  - Return answer + sources + conversation_id + message_id
  - `GET /conversations` — list user's conversations (paginated)
  - `GET /conversations/{id}` — return all messages with sources
  - `POST /conversations` — create empty conversation
  - `PATCH /conversations/{id}` — rename conversation
  - `DELETE /conversations/{id}` — delete conversation + all messages

### Schemas
- [ ] Create `backend/app/schemas/chat.py`:
  - `ChatRequest` (question, document_ids, conversation_id optional)
  - `ChatResponse` (answer, sources, conversation_id, message_id)
  - `MessageResponse` (id, role, content, sources, created_at)
  - `ConversationResponse` (id, title, created_at, updated_at)
  - `SourceResponse` (document_id, document_name, page_number, section, text)

### Tests
- [ ] `POST /chat` returns answer + sources, saves to DB
- [ ] New conversation auto-created when conversation_id not provided
- [ ] `GET /conversations/{id}` returns full message history with sources
- [ ] `DELETE /conversations/{id}` removes conversation + messages
- [ ] User A cannot access User B's conversation → 404

**✅ Phase 13 complete when:** Chat persists conversations, history retrievable, ownership enforced.

---

## PHASE 14 — AI Chat Frontend

### Components
- [ ] Create `src/components/chat/ConversationList.tsx`:
  - List of conversations (title + date)
  - New Conversation button
  - Active conversation highlighted
  - Hover: rename + delete buttons
  - Rename inline on double-click
- [ ] Create `src/components/chat/DocumentSelector.tsx`:
  - Checkbox list of READY documents
  - Select all toggle
  - Count of selected: "2 documents selected"
- [ ] Create `src/components/chat/ChatWindow.tsx`:
  - Message list with auto-scroll to bottom
  - Empty state when no messages
- [ ] Create `src/components/chat/MessageBubble.tsx`:
  - User message (right, indigo background)
  - AI message (left, light purple background, markdown rendered)
  - Timestamp below each message
  - AI typing indicator (3 bouncing dots)
- [ ] Create `src/components/chat/SourceCard.tsx`:
  - Left accent border (primary color)
  - Document name + page badge + section
  - Text excerpt (3 lines, truncated)
  - "View Source" button
- [ ] Create `src/components/chat/ChatInput.tsx`:
  - Textarea input (auto-resize)
  - Send button (disabled while loading)
  - Submit on Enter (Shift+Enter for newline)
  - Loading state text: "DocMind AI is thinking..."

### Page
- [ ] Create `src/pages/Chat.tsx`:
  - Split panel layout (left: doc selector + convos, right: chat)
  - Load conversation from URL param if provided
  - Scroll to bottom on new message

### Hooks
- [ ] Create `src/hooks/useChat.ts`:
  - `sendMessage(question, documentIds, conversationId)`
  - `loadConversation(id)` — fetch messages
  - `createConversation()` — create new
  - Optimistic user message insertion before API responds

### Tests
- [ ] Select document, type question, send → AI response appears
- [ ] AI response renders markdown correctly
- [ ] Source cards appear below AI message
- [ ] New Conversation clears chat
- [ ] Reopen old conversation → full history loads
- [ ] Loading/typing indicator shows while waiting
- [ ] Error toast shows if API fails

**✅ Phase 14 complete when:** Chat UI works with real RAG answers, source cards, conversation history.

---

## PHASE 15 — Citations & Source Cards

### Backend
- [ ] Verify every `POST /chat` response includes sources array with:
  - document_id, document_name, page_number, section, text
- [ ] Verify page_number always comes from chunk metadata (never from LLM)
- [ ] Add source deduplication (same page cited twice → show once)

### Frontend
- [ ] Polish `SourceCard.tsx`:
  - Primary color left border accent (3px)
  - Document icon + name (bold)
  - Page badge (small pill: "Page 7")
  - Section label in muted text
  - Text excerpt with "show more" if > 3 lines
  - "View Source" button → `/documents/{id}/view?page=7`
- [ ] Ensure source cards are visually distinct from AI message bubble
- [ ] Add source card animation (fade in slightly after AI message)
- [ ] No source cards shown when AI responds "not found"

### Tests
- [ ] Ask grounded question → source cards appear with correct data
- [ ] Page number in source card matches actual document page
- [ ] "View Source" navigates to correct page in viewer
- [ ] Unanswerable question → no source cards shown

**✅ Phase 15 complete when:** Every grounded answer has accurate, clickable source cards.

---

## PHASE 16 — Document Viewer

### Frontend
- [ ] Install `react-pdf`: `npm install react-pdf`
- [ ] Configure PDF.js worker in `main.tsx`
- [ ] Create `src/components/viewer/PDFViewer.tsx`:
  - Renders PDF using `react-pdf` `Document` + `Page` components
  - Handles loading state (skeleton)
  - Handles error state (corrupt/missing file)
- [ ] Create `src/components/viewer/PageControls.tsx`:
  - Previous / Next page buttons
  - Page number input (jump to page on Enter)
  - Total pages display: "7 / 248"
  - Zoom in / out buttons (50% to 200%)
- [ ] Create `src/components/viewer/ViewerSearch.tsx` (basic keyword highlight)
- [ ] Create `src/pages/DocumentViewer.tsx`:
  - Read `?page=N` query param → open at that page on mount
  - Side panel (desktop): shows citations for this document
  - "Ask AI" button → opens chat with this doc pre-selected
  - Back button → return to previous page

### Backend
- [ ] Add `GET /documents/{id}/file` endpoint to serve the raw file
  - Ownership check
  - Return file as streaming response

### Routing
- [ ] `/documents/:id/view` → DocumentViewer
- [ ] `/documents/:id/view?page=7` → opens at page 7

### Tests
- [ ] PDF renders on first open
- [ ] Navigate next/previous pages
- [ ] Type page number → jumps to that page
- [ ] Open from "View Source" citation → correct page shown
- [ ] Zoom in/out changes scale

**✅ Phase 16 complete when:** PDF viewer renders, navigates pages, opens at cited page.

---

## PHASE 17 — Document Summary

### Backend
- [ ] Create `backend/app/services/summarizer.py`:
  - `generate_quick_summary(document_id, db)` → 5–10 bullet points
  - `generate_detailed_summary(document_id, db)` → section-by-section
  - `extract_key_topics(document_id, db)` → list of topic strings
  - Uses retriever to get top chunks from the document
  - Calls LLM with summarization-specific prompt
- [ ] Update `POST /documents/{id}/summary`:
  - Call all three summarizer functions
  - Save result to `documents.summary` (JSON)
  - Return `{ quick_summary, detailed_summary, key_topics }`

### Frontend
- [ ] Create `src/pages/Summary.tsx`:
  - Quick Summary card (bullet list)
  - Key Topics (pill tags)
  - Detailed Summary (expandable sections per heading)
  - Regenerate button (re-calls API)
  - Skeleton loader while generating
  - Show cached summary if already generated
- [ ] Add "Summary" tab / button to DocumentDetails page

### Tests
- [ ] Generate summary → quick bullets appear
- [ ] Key topics appear as tags
- [ ] Detailed summary has expandable sections
- [ ] Regenerate replaces old summary
- [ ] Summary cached — reopening page shows saved summary without re-generating

**✅ Phase 17 complete when:** Any document generates a structured, cached summary.

---

## PHASE 18 — Document Details Page

### Frontend
- [ ] Create `src/pages/DocumentDetails.tsx`:
  - Breadcrumb: Documents → filename
  - Header: filename + file type badge + status badge
  - Metadata row: pages, size, upload date, processing time
  - Action buttons: Open Viewer, Ask AI (chat with this doc), Generate Summary, Rename, Delete
  - Quick Summary panel (if generated, show; if not, show "Generate Summary" prompt)
  - Key Topics row
  - Chunks info: total chunks, sample chunk preview (collapsible)
- [ ] Routing: `/documents/:id` → DocumentDetails

### Tests
- [ ] All metadata shows correctly
- [ ] "Open Viewer" → navigates to viewer
- [ ] "Ask AI" → navigates to chat with doc pre-selected
- [ ] "Generate Summary" → shows summary inline
- [ ] Rename → updates filename in header

**✅ Phase 18 complete when:** Document details page shows all info with working action buttons.

---

## PHASE 19 — Conversation History

### Frontend
- [ ] Polish `ConversationList.tsx`:
  - All conversations listed (not just recent 5)
  - Sorted by updated_at desc
  - Last message preview (first 40 chars)
  - Relative date: "2h ago", "3 days ago"
  - Rename: double-click title → inline edit
  - Delete: button → confirmation → removes from list
- [ ] When conversation selected:
  - Full message history loads with sources
  - Scroll to bottom
  - Document context shown (which docs were used)
  - User can continue sending messages

### Backend
- [ ] Ensure `PATCH /conversations/{id}` updates title
- [ ] Ensure `GET /conversations` includes last_message_preview and updated_at

### Tests
- [ ] Old conversation reopened → full history visible
- [ ] Can continue old conversation → new messages append
- [ ] Rename conversation → updates in list
- [ ] Delete conversation → removed from list
- [ ] History persists across browser reload

**✅ Phase 19 complete when:** Conversation history is browsable, continuable, manageable.

---

## PHASE 20 — Document Management Polish

### Frontend
- [ ] Sort by: date (default), name A-Z, size, status
- [ ] Filter by status: All, Ready, Processing, Failed
- [ ] Filter by type: All, PDF, DOCX, TXT
- [ ] Combined filter + sort (both active simultaneously)
- [ ] Relative upload dates: "2 hours ago", "Yesterday", "3 days ago"
- [ ] PROCESSING documents auto-refresh status every 5 seconds
- [ ] Grid view toggle → Table view
- [ ] Select all / bulk delete (with confirmation)

### Tests
- [ ] Sort by name → alphabetical order
- [ ] Filter by READY → only ready docs shown
- [ ] Processing doc auto-updates to READY without page refresh
- [ ] Bulk delete removes all selected docs

**✅ Phase 20 complete when:** Document list is fully sortable, filterable, manageable.

---

## PHASE 21 — Search Page

### Backend
- [ ] Create `backend/app/api/search.py`:
  - `POST /search` — query + optional document_ids
  - Embeds query via EmbeddingService
  - Searches Qdrant (filtered by user_id, optionally by document_ids)
  - Returns top-K results with document_name, page_number, section, text, score
- [ ] Register search router in `main.py`

### Frontend
- [ ] Create `src/pages/Search.tsx`:
  - Large search input (centered when empty)
  - "Search in" dropdown (All Documents / specific docs)
  - Search results list:
    - Document icon + name
    - Page + section badge
    - Matching text excerpt
    - Relevance score bar (optional)
    - "Open in Viewer" button
  - Empty state (no query): "Search across your documents..."
  - No results state: "No matching content found."
  - Loading skeleton while searching
- [ ] Add Search to sidebar nav

### Tests
- [ ] Search "employee leave" → finds chunks about leave policy
- [ ] Results include correct document + page + section
- [ ] "Open in Viewer" navigates to correct page
- [ ] Search returns no results gracefully
- [ ] User B's documents never appear in User A's search

**✅ Phase 21 complete when:** Semantic search returns relevant results across all user documents.

---

## PHASE 22 — Multi-Document RAG

### Backend
- [ ] Update `POST /chat` to handle `document_ids` with 2+ items
- [ ] Update context builder in `llm.py` to label each chunk with its source document
- [ ] Update citation formatter to identify which document each citation comes from

### Frontend
- [ ] Update `DocumentSelector.tsx`:
  - Multi-select checkboxes (not radio buttons)
  - "Select All" / "Deselect All" toggle
  - Counter: "3 documents selected"
  - Visual indication of selected docs (highlighted)

### Tests
- [ ] Select 2 papers → ask a comparison question → answer references both
- [ ] Citations correctly attribute each claim to its source document
- [ ] Deselect all docs → ask question → shows "please select a document" message

**✅ Phase 22 complete when:** Multi-document RAG works with correctly attributed citations.

---

## PHASE 23 — Document Comparison

### Backend
- [ ] Create `backend/app/services/comparator.py`:
  - `compare_documents(doc_id_a, doc_id_b, db)` → comparison result
  - Retrieve top chunks from both documents
  - Build comparison prompt (Added / Removed / Modified)
  - Call LLM → parse structured response
  - Return `{ added: [], removed: [], modified: [], summary: "" }`
- [ ] Add `POST /documents/compare` endpoint (takes doc_id_a, doc_id_b)

### Frontend
- [ ] Create `src/pages/Compare.tsx`:
  - Two document selectors (dropdown, only READY docs)
  - Compare button
  - Loading state
  - Results with 3 colored sections:
    - ✅ Added (green border)
    - ❌ Removed (red border)
    - ✏️ Modified (yellow border)
  - Each item has citation (page + document)
  - Empty state: "Select two documents to compare"

### Tests
- [ ] Upload two versions of a policy document → comparison shows meaningful diff
- [ ] Added, Removed, Modified sections all populate
- [ ] Compare same document with itself → shows "No significant differences"

**✅ Phase 23 complete when:** Two documents can be compared with structured diff output + citations.

---

## PHASE 24 — Research Mode

### Backend
- [ ] Create `backend/app/services/extractor.py`:
  - `extract_research_structure(document_id, db)` → structured dict
  - Fields: problem, objective, methodology, dataset, models, metrics, results, limitations, future_work
  - Uses targeted RAG queries for each field
  - Each field includes source citation
- [ ] Add `POST /documents/{id}/research` endpoint

### Frontend
- [ ] Create `src/pages/ResearchMode.tsx`:
  - Grid of field cards (Problem, Objective, Methodology, etc.)
  - Each card: field name + extracted content + source citation
  - "Generate" button to trigger extraction
  - Loading skeleton while generating
  - "Compare Papers" button (links to Compare page)
  - "Generate Questions" button

### Tests
- [ ] Upload research paper → extract all 9 fields
- [ ] Each field has content + source citation
- [ ] Missing fields show "Not found in document" gracefully

**✅ Phase 24 complete when:** Research papers produce a structured analysis with citations.

---

## PHASE 25 — Study Mode

### Backend
- [ ] Create `POST /documents/{id}/study` endpoint:
  - Generate study notes (bullet format)
  - Generate 10 MCQs with correct answers
  - Generate 5 short-answer questions
  - Generate 5 long-answer questions
  - Generate 10 key term flashcards
- [ ] Create `POST /generate-questions` endpoint:
  - Accepts: document_id, question_type (mcq/short/long), count
  - Returns generated questions with answers

### Frontend
- [ ] Create `src/pages/StudyMode.tsx` with tabs:
  - **Notes tab** — bullet-point summary
  - **MCQs tab** — question + 4 options + reveal answer button + Next
  - **Questions tab** — short + long Q&A
  - **Flashcards tab** — flip card interaction (front: term, back: definition)
- [ ] Generate button for each tab
- [ ] Progress bar for MCQs (question X of Y)

### Tests
- [ ] Generate MCQs → 10 questions with 4 options each
- [ ] Reveal answer works
- [ ] Flashcard flip animation works
- [ ] Notes generate as bullet list

**✅ Phase 25 complete when:** Study Mode generates real questions, notes, flashcards from any document.

---

## PHASE 26 — Settings Page

### Frontend
- [ ] Create `src/pages/Settings.tsx` with sub-navigation:
  - **Profile tab**: name field, email (read-only), Save Changes button
  - **Password tab**: current password, new password, confirm new password
  - **AI Preferences tab**: Top-K info, chunk size info (read-only display)
  - **Danger Zone tab**: Delete Account (red section, confirmation dialog)
- [ ] Add Settings to sidebar nav

### Backend
- [ ] Add `PATCH /auth/me` — update name
- [ ] Add `POST /auth/change-password` — verify old password → hash new → save

### Tests
- [ ] Update name → saved and reflected in sidebar
- [ ] Change password → can login with new password, old fails

**✅ Phase 26 complete when:** Users can update profile and password.

---

## PHASE 27 — UI Polish & Responsiveness

### Responsiveness
- [ ] Sidebar collapses to icon-only on tablet (768px–1023px)
- [ ] Sidebar becomes hamburger drawer on mobile (< 768px)
- [ ] Dashboard stats stack vertically on mobile
- [ ] Documents grid → 1 column on mobile, 2 on tablet
- [ ] Chat split panel → single panel on mobile (conversation list is modal)
- [ ] Document viewer → full screen on mobile, controls at bottom
- [ ] All form inputs are full-width on mobile

### Component Polish
- [ ] All buttons have correct hover + active + focus states
- [ ] All inputs have focus ring (primary color)
- [ ] All interactive elements keyboard accessible
- [ ] Toast notifications for all key actions:
  - Upload success, Delete success, Rename success
  - Copy to clipboard, Error messages
- [ ] Skeleton loaders on all loading states:
  - Dashboard stats, Document list, Chat history, Conversation list
- [ ] Page transitions: subtle fade-in (200ms)
- [ ] Chat auto-scrolls to latest message
- [ ] 404 page for unknown routes
- [ ] App loading spinner on auth check

### Accessibility
- [ ] All images / icons have aria-label or alt text
- [ ] All form fields have associated `<label>` elements
- [ ] Error messages linked to fields via `aria-describedby`
- [ ] Modal dialogs trap focus and close on Escape
- [ ] Color contrast passes WCAG 2.1 AA throughout

### Tests
- [ ] All pages work on mobile (320px width)
- [ ] Sidebar opens/closes correctly on mobile
- [ ] Tab key navigates all interactive elements
- [ ] No broken layout at any viewport size

**✅ Phase 27 complete when:** App looks polished and works correctly at all screen sizes.

---

## PHASE 28 — Testing

### Backend Unit Tests (`backend/tests/`)
- [ ] `test_auth.py`:
  - Register valid → 201
  - Register duplicate email → 400
  - Login correct → JWT
  - Login wrong password → 401
  - Protected route no token → 401
  - User A cannot access User B's doc → 404
- [ ] `test_documents.py`:
  - Upload PDF → 202 + record in DB
  - Upload .exe → 415
  - Upload oversized → 413
  - GET /documents only returns own docs
  - DELETE removes file + record + vectors
- [ ] `test_processing.py`:
  - PDF parsing preserves page_number per chunk
  - DOCX parsing preserves section headings
  - Chunking applies correct overlap
  - Empty document → FAILED status
- [ ] `test_embeddings.py`:
  - Embedding output has correct dimension
  - Batch embed returns same count as input
- [ ] `test_vector_store.py`:
  - Insert chunks → points appear in Qdrant
  - Search returns relevant results
  - Filter by user_id works
  - Delete by document_id removes correct points
- [ ] `test_rag.py`:
  - Full pipeline: upload → ask → grounded answer
  - Citations contain correct page_number
  - Multi-document: answer cites both documents
- [ ] `test_anti_hallucination.py`:
  - Unanswerable question → "not found" response
  - Never fabricates page numbers
- [ ] `test_search.py`:
  - Semantic search returns relevant chunks
  - User isolation enforced

### Evaluation Dataset
- [ ] Add 5–10 sample documents to `data/eval/documents/`
- [ ] Create `data/eval/questions.json` with 30–50 benchmark questions
  - 10 direct questions
  - 10 semantic questions
  - 5 multi-hop questions
  - 5 numerical questions
  - 10 unanswerable questions
- [ ] Run full benchmark and record results:
  - Retrieval recall (Top-3, Top-5, Top-10)
  - Answer grounding rate
  - Citation accuracy
  - Hallucination rate (unanswerable → "not found")
  - Average response time

### Hackathon Demo Dry Run
- [ ] Full demo flow runs without errors:
  - Upload 2 research papers
  - Show processing → READY
  - Ask basic question → answer + source cards
  - Click View Source → viewer opens at correct page
  - Generate Summary
  - Generate Questions
  - Select both papers → ask comparison question → table + citations
  - Ask unanswerable question → "not found" response

**✅ Phase 28 complete when:** All tests pass, evaluation benchmark meets targets, demo flow runs cleanly.

---

## PHASE 29 — Deployment

### Frontend (Vercel)
- [ ] Create `frontend/.env.production` with `VITE_API_URL=https://your-backend.com`
- [ ] Connect frontend repo to Vercel
- [ ] Set environment variable in Vercel dashboard
- [ ] Trigger deploy → build succeeds
- [ ] Verify: frontend accessible at production URL
- [ ] Verify: no CORS errors in browser console

### Backend (Render / Railway)
- [ ] Create `backend/Dockerfile`:
  - Python 3.11 base image
  - Copy requirements + install
  - Copy app code
  - Run: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- [ ] Push to GitHub
- [ ] Connect repo to Render/Railway
- [ ] Set all environment variables in platform dashboard (never in code)
- [ ] Deploy → verify `GET /` returns `{ "status": "ok" }`
- [ ] Verify: `POST /auth/register` works from production frontend

### PostgreSQL (Managed)
- [ ] Provision managed PostgreSQL (Render / Railway / Supabase)
- [ ] Set `DATABASE_URL` in backend environment
- [ ] Run `alembic upgrade head` against production DB
- [ ] Verify: all 6 tables exist in production DB

### Qdrant Cloud
- [ ] Create account at `cloud.qdrant.io`
- [ ] Create a new cluster (free tier available)
- [ ] Set `QDRANT_URL` and `QDRANT_API_KEY` in backend environment
- [ ] Verify: collection created on first backend startup
- [ ] Verify: vectors are inserted and searchable in production

### Final Production Checks
- [ ] Register new account on production
- [ ] Upload a real PDF → processes to READY
- [ ] Ask a question → grounded answer + source cards
- [ ] Click View Source → viewer opens at correct page
- [ ] Generate summary → appears
- [ ] CORS only allows production frontend origin
- [ ] No API keys visible in browser network tab (F12)
- [ ] No sensitive data in any API response
- [ ] README has complete local + production setup instructions
- [ ] `.env.example` is up to date with all required keys

**✅ Phase 29 complete when:** DocMind AI is live, all features work on production, demo runs end-to-end.

---

## Master Progress Tracker

| Phase | Name | Status |
|-------|------|--------|
| 1 | Project Setup | ⬜ Not Started |
| 2 | Database | ⬜ Not Started |
| 3 | Auth Backend | ⬜ Not Started |
| 4 | Auth Frontend | ⬜ Not Started |
| 5 | Landing Page | ⬜ Not Started |
| 6 | Upload Backend | ⬜ Not Started |
| 7 | Upload Frontend | ⬜ Not Started |
| 8 | Document Processing | ⬜ Not Started |
| 9 | Embeddings & Qdrant | ⬜ Not Started |
| 10 | RAG Pipeline | ⬜ Not Started |
| 11 | Dashboard | ⬜ Not Started |
| 12 | Documents Page | ⬜ Not Started |
| 13 | Chat Backend | ⬜ Not Started |
| 14 | Chat Frontend | ⬜ Not Started |
| 15 | Citations | ⬜ Not Started |
| 16 | Document Viewer | ⬜ Not Started |
| 17 | Summary | ⬜ Not Started |
| 18 | Document Details | ⬜ Not Started |
| 19 | Conversation History | ⬜ Not Started |
| 20 | Doc Management Polish | ⬜ Not Started |
| 21 | Search Page | ⬜ Not Started |
| 22 | Multi-Document RAG | ⬜ Not Started |
| 23 | Comparison | 🟡 Partial |
| 24 | Research Mode | ✅ Done |
| 25 | Study Mode | ✅ Done |
| 26 | Settings Page | ✅ Done |
| 27 | UI Polish | ⬜ Not Started |
| 28 | Testing | ✅ Done |
| 29 | Deployment | ✅ Done |

> Update each row to 🟡 In Progress or ✅ Done as you work through phases.

---

*DocMind AI — Turn Documents Into Intelligence.*
