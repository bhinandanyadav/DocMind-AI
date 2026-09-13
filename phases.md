# Build Phases

## DocMind AI — Intelligent Document Analysis & RAG Platform

> Build in this exact order. Do not skip phases.
> Every phase must be working before the next one starts.

---

## Phase Overview

| Phase | Name | Type |
|-------|------|------|
| Phase 1 | Project Setup | Setup |
| Phase 2 | Database | Backend |
| Phase 3 | Authentication — Backend | Backend |
| Phase 4 | Authentication — Frontend | Frontend |
| Phase 5 | Landing Page | Frontend |
| Phase 6 | Document Upload — Backend | Backend |
| Phase 7 | Document Upload — Frontend | Frontend |
| Phase 8 | Document Processing Pipeline | Backend |
| Phase 9 | Embeddings & Vector Database | Backend |
| Phase 10 | RAG Pipeline | Backend |
| Phase 11 | Dashboard | Frontend |
| Phase 12 | Documents Page | Frontend |
| Phase 13 | AI Chat — Backend | Backend |
| Phase 14 | AI Chat — Frontend | Frontend |
| Phase 15 | Citations & Source Cards | Full Stack |
| Phase 16 | Document Viewer | Frontend |
| Phase 17 | Document Summary | Full Stack |
| Phase 18 | Document Details Page | Frontend |
| Phase 19 | Conversation History | Full Stack |
| Phase 20 | Document Management | Frontend |
| Phase 21 | Search Page | Full Stack |
| Phase 22 | Multi-Document RAG | Backend |
| Phase 23 | Document Comparison | Full Stack |
| Phase 24 | Research Mode | Full Stack |
| Phase 25 | Study Mode | Full Stack |
| Phase 26 | Settings Page | Frontend |
| Phase 27 | UI Polish & Responsiveness | Frontend |
| Phase 28 | Testing | Testing |
| Phase 29 | Deployment | DevOps |

---

## Phase 1 — Project Setup

**Goal:** Working project skeleton with frontend, backend, and local services running.

### Backend
- [ ] Create `docmind-ai/` root folder
- [ ] Create `backend/` directory
- [ ] Set up Python virtual environment (`.venv`)
- [ ] Create `requirements.txt` with core dependencies:
  - `fastapi`, `uvicorn`, `pydantic`, `sqlalchemy`, `alembic`
  - `python-jose`, `passlib[bcrypt]`, `python-multipart`
  - `httpx`, `python-dotenv`
- [ ] Create `backend/app/main.py` — basic FastAPI app
- [ ] Create `backend/app/config.py` — Pydantic `BaseSettings`
- [ ] Create `.env` and `.env.example`
- [ ] Verify: `uvicorn app.main:app --reload` runs without errors
- [ ] Verify: `GET /` returns `{ "status": "ok" }`

### Frontend
- [ ] Create `frontend/` with Vite + React + TypeScript
  ```bash
  npm create vite@latest frontend -- --template react-ts
  ```
- [ ] Install dependencies:
  - `tailwindcss`, `@shadcn/ui`, `lucide-react`
  - `react-router-dom`, `axios`, `react-markdown`
  - `@tanstack/react-query`
- [ ] Configure Tailwind CSS
- [ ] Initialize shadcn/ui
- [ ] Create `src/router/index.tsx` — basic router with a placeholder home route
- [ ] Create `src/services/api.ts` — Axios instance pointing to backend
- [ ] Verify: `npm run dev` runs without errors

### Docker
- [ ] Create `docker-compose.yml` with:
  - `postgres:15` service (port 5432)
  - `qdrant/qdrant` service (port 6333)
- [ ] Verify: `docker compose up` starts both services
- [ ] Verify: PostgreSQL is reachable on `localhost:5432`
- [ ] Verify: Qdrant UI is accessible at `http://localhost:6333/dashboard`

### Project Files
- [ ] Create `README.md` with setup instructions
- [ ] Create `.gitignore` (includes `.env`, `node_modules/`, `__pycache__/`, `data/uploads/`)
- [ ] Initialize git repository

**Phase 1 done when:** Frontend runs, backend runs, PostgreSQL and Qdrant are up via Docker.

---

## Phase 2 — Database

**Goal:** All PostgreSQL tables created and accessible from the backend.

### Backend
- [ ] Create `backend/app/database/session.py`:
  - SQLAlchemy engine
  - `SessionLocal` factory
  - `get_db()` dependency
- [ ] Create SQLAlchemy models:
  - `models/user.py` — `User` table
  - `models/document.py` — `Document` table (status field: UPLOADED / PROCESSING / READY / FAILED)
  - `models/chunk.py` — `DocumentChunk` table
  - `models/conversation.py` — `Conversation` table
  - `models/message.py` — `Message` table (role, content, sources JSONB)
  - `models/feedback.py` — `Feedback` table
- [ ] Set up Alembic:
  ```bash
  alembic init database/migrations
  ```
- [ ] Create and run initial migration:
  ```bash
  alembic revision --autogenerate -m "initial tables"
  alembic upgrade head
  ```
- [ ] Verify: all 6 tables exist in PostgreSQL
- [ ] Verify: foreign keys and indexes are created

**Phase 2 done when:** All tables exist in the database and are queryable.

---

## Phase 3 — Authentication Backend

**Goal:** Working register, login, logout APIs with JWT.

### Backend
- [ ] Create `schemas/auth.py`:
  - `RegisterRequest` — name, email, password
  - `LoginRequest` — email, password
  - `TokenResponse` — access_token, token_type, user
  - `UserResponse` — id, name, email
- [ ] Create `utils/security.py`:
  - `hash_password(password)` using bcrypt
  - `verify_password(plain, hashed)`
  - `create_access_token(user_id, email)`
  - `decode_access_token(token)` → user_id
- [ ] Create `middleware/auth.py`:
  - `get_current_user(token)` — FastAPI dependency
  - Validates JWT, returns `User` object
  - Raises `401` if invalid or expired
- [ ] Create `api/auth.py`:
  - `POST /auth/register` — validate → hash → save → return user
  - `POST /auth/login` — lookup → verify → generate JWT → return token
  - `POST /auth/logout` — return success (JWT is stateless)
  - `GET /auth/me` — return current user (protected)
- [ ] Register auth router in `main.py`

### Test (manual or automated)
- [ ] `POST /auth/register` with valid data → `201` + user object
- [ ] `POST /auth/register` with duplicate email → `400`
- [ ] `POST /auth/login` with correct credentials → JWT token
- [ ] `POST /auth/login` with wrong password → `401`
- [ ] `GET /auth/me` with valid token → user data
- [ ] `GET /auth/me` without token → `401`

**Phase 3 done when:** Register and login return correct responses, JWT protects routes.

---

## Phase 4 — Authentication Frontend

**Goal:** Working Login and Register pages connected to the backend.

### Pages
- [ ] **`pages/Login.tsx`**
  - Email input
  - Password input
  - Login button
  - "Don't have an account? Register" link
  - Error message display (wrong credentials)
  - Loading state on button

- [ ] **`pages/Register.tsx`**
  - Name input
  - Email input
  - Password input
  - Confirm password input
  - Register button
  - "Already have an account? Login" link
  - Error message display (email taken, password mismatch)
  - Loading state on button

### Services & Hooks
- [ ] Create `services/authService.ts`:
  - `register(name, email, password)` → calls `POST /auth/register`
  - `login(email, password)` → calls `POST /auth/login` → stores JWT
  - `logout()` → clears JWT
  - `getMe()` → calls `GET /auth/me`
- [ ] Create `hooks/useAuth.ts`:
  - Auth state: `user`, `isAuthenticated`, `isLoading`
  - Actions: `login()`, `logout()`, `register()`
- [ ] Create `contexts/AuthContext.tsx` — wraps app with auth state
- [ ] Create `router/ProtectedRoute.tsx`:
  - If not authenticated → redirect to `/login`
  - If authenticated → render children

### Layouts
- [ ] Create `layouts/AuthLayout.tsx` — centered card layout for login/register

### Routing
- [ ] Add routes: `/login` → `Login`, `/register` → `Register`
- [ ] Redirect `/` to `/login` if not authenticated, `/dashboard` if authenticated

### Test
- [ ] Register with valid data → redirects to dashboard (placeholder)
- [ ] Register with taken email → shows error
- [ ] Login with correct credentials → JWT stored, redirects to dashboard
- [ ] Login with wrong password → shows error
- [ ] Reload page → stays logged in (token persisted)
- [ ] Visit protected route without login → redirected to `/login`

**Phase 4 done when:** Login and Register pages work, JWT persists across reload, protected routes redirect correctly.

---

## Phase 5 — Landing Page

**Goal:** Public-facing landing page that explains DocMind AI.

### Page
- [ ] **`pages/Landing.tsx`**

  Sections:
  - **Hero** — product name, tagline, CTA buttons (Get Started, Login)
  - **Problem** — "Reading 200-page documents manually is slow"
  - **Solution** — "DocMind AI lets you ask questions and get cited answers"
  - **How It Works** — 3-step flow: Upload → Ask → Get Answer with Source
  - **Features** — 6 feature cards (AI Chat, RAG, Citations, Viewer, Summary, Multi-doc)
  - **Demo Preview** — screenshot or mockup of the chat interface
  - **CTA** — "Start for free" button → `/register`
  - **Footer** — project name, tagline

### Components
- [ ] `components/common/Navbar.tsx` — logo + Login / Get Started buttons (public version)

### Routing
- [ ] `/` → `Landing` (public, no auth required)

**Phase 5 done when:** Landing page is accessible, looks professional, links to login/register work.

---

## Phase 6 — Document Upload Backend

**Goal:** Working upload API that validates files and stores them.

### Backend
- [ ] Create `utils/file_utils.py`:
  - `validate_file(file)` — check extension + MIME type + size
  - `sanitize_filename(filename)` — safe name for filesystem
  - `save_file(file, dest_path)` — write to `data/uploads/`
- [ ] Create `schemas/document.py`:
  - `DocumentResponse` — id, filename, file_type, file_size, status, created_at
  - `DocumentListResponse` — paginated list
- [ ] Create `api/documents.py`:
  - `POST /documents/upload` — validate → save file → create DB record → return `202`
  - `GET /documents` — list user's documents (paginated)
  - `GET /documents/{id}` — get single document (ownership check)
  - `PATCH /documents/{id}` — rename document
  - `DELETE /documents/{id}` — delete document + file
  - `GET /documents/{id}/status` — return current processing status

### Test
- [ ] Upload a valid PDF → `202`, document record created with status `UPLOADED`
- [ ] Upload `.exe` file → `415`
- [ ] Upload file over 50MB → `413`
- [ ] `GET /documents` returns only current user's documents
- [ ] `DELETE /documents/{id}` removes record and file

**Phase 6 done when:** Files upload, validate, save to disk, and appear in the database.

---

## Phase 7 — Document Upload Frontend

**Goal:** Working upload UI connected to the backend.

### Pages & Components
- [ ] **`components/documents/UploadZone.tsx`**
  - Drag-and-drop area
  - File picker button
  - Accepted types label (PDF, DOCX, TXT)
  - Max size label (50MB)
  - Preview of selected file (name, size, type icon)
  - Upload button
  - Upload progress bar (0–100%)
  - Success state (checkmark + "Processing...")
  - Error state (red message)

- [ ] **`components/documents/ProcessingStatus.tsx`**
  - Shows current status badge: UPLOADED / PROCESSING / READY / FAILED
  - Auto-polls `GET /documents/{id}/status` every 3 seconds while PROCESSING
  - Stops polling when READY or FAILED

### Services
- [ ] `services/documentService.ts`:
  - `upload(file, onProgress)` → `POST /documents/upload` with progress callback
  - `list(page, pageSize)` → `GET /documents`
  - `get(id)` → `GET /documents/{id}`
  - `rename(id, name)` → `PATCH /documents/{id}`
  - `remove(id)` → `DELETE /documents/{id}`
  - `getStatus(id)` → `GET /documents/{id}/status`

### Test
- [ ] Drag and drop a PDF → upload starts, progress bar fills
- [ ] Upload succeeds → status shows "Processing..."
- [ ] Status auto-updates to READY after processing completes
- [ ] Upload invalid file → shows error message
- [ ] Upload too-large file → shows error message

**Phase 7 done when:** Upload UI works end-to-end with progress and status polling.

---

## Phase 8 — Document Processing Pipeline

**Goal:** Uploaded documents are parsed, chunked, and stored in the database.

### Backend Services
- [ ] **`services/parser.py`**
  - `parse_pdf(file_path)` → `ParsedDocument` using PyMuPDF
    - Extract text per page
    - Preserve page number
    - Detect section headings (ALL CAPS / Title Case lines)
  - `parse_docx(file_path)` → `ParsedDocument` using python-docx
    - Extract paragraphs and headings
    - Use heading styles as section names
  - `parse_txt(file_path)` → `ParsedDocument`
    - Read full text
    - Assign virtual page numbers (every N characters = 1 page)
  - OCR fallback: if PDF has no extractable text → use Tesseract

- [ ] **`services/chunker.py`**
  - `chunk_document(parsed_doc, chunk_size=800, overlap=150)` → `list[Chunk]`
  - Split by token count using `tiktoken` or character estimate
  - Apply overlap between consecutive chunks
  - Attach metadata to every chunk: `document_id`, `document_name`, `page_number`, `section`, `chunk_index`

- [ ] **`services/processor.py`** — orchestrates the full pipeline:
  ```
  parse → chunk → save chunks to DB → trigger embedding
  ```

- [ ] Update `api/documents.py`:
  - After upload, launch `processor.run(document_id)` as a `BackgroundTask`
  - Update document status: `UPLOADED → PROCESSING → READY` (or `FAILED`)

### Test
- [ ] Upload `test.pdf` → after processing, `document_chunks` table has records
- [ ] Each chunk has `page_number`, `section`, `chunk_index`, `text`
- [ ] Document status changes to `READY`
- [ ] Upload an empty PDF → status changes to `FAILED`, error stored
- [ ] Upload a scanned PDF → OCR fallback extracts text

**Phase 8 done when:** Any supported file can be uploaded and chunked with full metadata.

---

## Phase 9 — Embeddings & Vector Database

**Goal:** Chunks are embedded and stored in Qdrant with full metadata.

### Backend Services
- [ ] **`services/embeddings.py`**
  - `EmbeddingService` — provider-agnostic interface
  - Reads `EMBEDDING_PROVIDER` from config
  - Supports: `openai`, `huggingface`, `local` (Ollama)
  - `embed(text: str) → list[float]`
  - `embed_batch(texts: list[str]) → list[list[float]]`

- [ ] **`services/vector_store.py`**
  - `ensure_collection_exists()` — create `document_chunks` collection if not present
  - `insert_chunks(chunks, embeddings)` — upsert vectors with payload
  - `search(query_vector, document_ids, user_id, top_k)` → list of scored results
  - `delete_by_document(document_id)` — delete all vectors for a document
  - Call `ensure_collection_exists()` on app startup in `main.py`

- [ ] Update `services/processor.py`:
  - After chunking → call `embeddings.embed_batch(chunk_texts)`
  - Call `vector_store.insert_chunks(chunks, embeddings)`
  - Store `vector_id` back in each `document_chunks` DB record

### Test
- [ ] After processing a document → vectors appear in Qdrant dashboard
- [ ] Each Qdrant point has: `document_id`, `user_id`, `page_number`, `section`, `text`
- [ ] `vector_store.search(...)` returns relevant chunks for a test query
- [ ] `DELETE /documents/{id}` removes vectors from Qdrant

**Phase 9 done when:** Documents are fully embedded and searchable in Qdrant.

---

## Phase 10 — RAG Pipeline

**Goal:** User question → semantic retrieval → LLM → grounded answer with citations.

### Backend Services
- [ ] **`services/retriever.py`**
  - `retrieve(question, document_ids, user_id, top_k)` → `list[Chunk]`
  - Embed the question using `EmbeddingService`
  - Search Qdrant filtered by `user_id` + `document_ids`
  - Return top-K chunks with metadata

- [ ] **`services/reranker.py`** (optional for MVP)
  - `rerank(question, chunks)` → `list[Chunk]` sorted by relevance
  - Use a cross-encoder or simple keyword-overlap fallback

- [ ] **`services/llm.py`**
  - `LLMService` — provider-agnostic interface
  - Reads `LLM_PROVIDER` and `LLM_MODEL` from config
  - Supports: `openai`, `groq`, `ollama`
  - `build_context(chunks)` → formatted context string with source labels
  - `build_prompt(question, context)` → system + context + user question
  - `generate(prompt)` → LLM response string

- [ ] **`utils/citation.py`**
  - `extract_citations(chunks)` → `list[Citation]`
  - Each citation: `document_id`, `document_name`, `page_number`, `section`, `text`
  - No citation without real chunk metadata

- [ ] **`api/chat.py`** (basic version):
  - `POST /chat` — takes question + document_ids → runs full RAG pipeline → returns answer + sources

### Test
- [ ] Upload a PDF, ask a question that is in the document
- [ ] Verify answer references content from the document
- [ ] Verify citations contain correct `page_number` and `section`
- [ ] Ask a question NOT in the document → AI responds "not found"
- [ ] Verify LLM is never called without context (retrieved chunks)

**Phase 10 done when:** Full RAG pipeline works. Upload → ask → get grounded answer with citations.

---

## Phase 11 — Dashboard

**Goal:** Authenticated home page with stats and quick access.

### Page
- [ ] **`pages/Dashboard.tsx`**

  Sections:
  - **Welcome header** — "Welcome back, {name}"
  - **Stats row** — 3 cards:
    - Total Documents (count from API)
    - Total Pages (sum of page_count)
    - Questions Asked (count of messages where role = user)
  - **Recent Documents** — last 5 documents, with filename, status badge, upload date
  - **Recent Conversations** — last 5 conversations, with title and date
  - **Quick Actions** — "Upload Document" button → opens upload modal

### Components
- [ ] `components/dashboard/StatsCard.tsx` — icon + label + number
- [ ] `components/dashboard/RecentDocuments.tsx` — document list with status
- [ ] `components/dashboard/RecentConversations.tsx` — conversation list
- [ ] `components/common/Sidebar.tsx` — navigation sidebar with links:
  - Dashboard
  - Documents
  - Chat
  - Search
  - Compare
  - Settings
- [ ] `layouts/AppLayout.tsx` — sidebar + main content area (for all authenticated pages)

### Services
- [ ] `GET /dashboard/stats` (or derive from existing endpoints)

**Phase 11 done when:** Dashboard loads with real stats, recent documents, and recent conversations.

---

## Phase 12 — Documents Page

**Goal:** Full document management UI.

### Page
- [ ] **`pages/Documents.tsx`**

  Features:
  - **Search bar** — filter documents by name
  - **Sort** — by date, name, size, status
  - **Filter** — by status (All, Ready, Processing, Failed), by type (PDF, DOCX, TXT)
  - **Upload button** — opens upload modal
  - **Document grid / table toggle**
  - **Empty state** — "No documents yet. Upload your first document."

### Components
- [ ] `components/documents/DocumentCard.tsx`
  - File type icon
  - Filename
  - Status badge (color-coded)
  - Page count
  - File size
  - Upload date
  - Action menu: Open, Rename, Delete

- [ ] `components/documents/DocumentTable.tsx`
  - Same data in table format
  - Sortable columns

- [ ] `components/documents/UploadModal.tsx`
  - Dialog wrapping `UploadZone`
  - Opens on "Upload Document" button click

### Test
- [ ] Documents list loads from API
- [ ] Search filters the list in real time
- [ ] Rename dialog works
- [ ] Delete with confirmation dialog works
- [ ] Empty state shows when no documents exist

**Phase 12 done when:** All document management actions work from the UI.

---

## Phase 13 — AI Chat Backend

**Goal:** Full chat API with conversation persistence.

### Backend
- [ ] Create full `api/chat.py`:
  - `POST /chat` — RAG question answering, saves message to DB
  - `GET /conversations` — list user's conversations (paginated)
  - `GET /conversations/{id}` — get all messages in a conversation
  - `POST /conversations` — create new conversation
  - `PATCH /conversations/{id}` — rename conversation
  - `DELETE /conversations/{id}` — delete conversation + messages

- [ ] Update `POST /chat` to:
  - Accept `conversation_id` (create new if not provided)
  - Save user message to `messages` table
  - Run RAG pipeline
  - Save AI response + sources to `messages` table
  - Return answer + sources + conversation_id

### Test
- [ ] `POST /chat` returns answer + sources
- [ ] Message is saved to DB
- [ ] `GET /conversations/{id}` returns full message history
- [ ] Sources are stored as JSONB in message record

**Phase 13 done when:** Chat API persists conversations and returns grounded answers with sources.

---

## Phase 14 — AI Chat Frontend

**Goal:** Full chat UI connected to the backend.

### Page
- [ ] **`pages/Chat.tsx`**

  Layout (split panel):
  ```
  Left panel:   Document selector + Conversation list
  Right panel:  Chat window
  ```

### Components
- [ ] `components/chat/ConversationList.tsx`
  - List of past conversations with title + date
  - "New Conversation" button
  - Active conversation highlighted
  - Rename + Delete on hover

- [ ] `components/chat/DocumentSelector.tsx`
  - Checkbox list of user's READY documents
  - Select one or multiple for context
  - "Ask about all documents" option

- [ ] `components/chat/ChatWindow.tsx`
  - Message list (user + AI bubbles)
  - Scroll to bottom on new message
  - Empty state: "Select a document and ask a question"

- [ ] `components/chat/MessageBubble.tsx`
  - User message: right-aligned, colored
  - AI message: left-aligned, markdown rendered
  - Timestamp

- [ ] `components/chat/SourceCard.tsx`
  - Document name
  - Page number (clickable)
  - Section name
  - Text excerpt
  - "View Source" button → opens document viewer at that page

- [ ] `components/chat/ChatInput.tsx`
  - Text input
  - Send button
  - Disabled while AI is responding
  - Loading indicator ("AI is thinking...")
  - Submit on Enter key

### Hooks
- [ ] `hooks/useChat.ts`:
  - `sendMessage(question, documentIds, conversationId)`
  - `loadConversation(id)`
  - `createConversation()`
  - Optimistic message insertion

### Test
- [ ] Select a document, type a question, hit Send
- [ ] AI response appears with markdown rendered
- [ ] Source cards appear below the AI message
- [ ] Start a new conversation → chat clears
- [ ] Reopen an old conversation → history loads
- [ ] Loading state shows while waiting for response
- [ ] Error state shows if API fails

**Phase 14 done when:** Chat UI is fully functional with real RAG answers, source cards, and conversation history.

---

## Phase 15 — Citations & Source Cards

**Goal:** Citations are clickable and open the document viewer at the correct page.

### Backend
- [ ] Verify every RAG response includes:
  ```json
  "sources": [
    {
      "document_id": "...",
      "document_name": "research.pdf",
      "page_number": 7,
      "section": "Methodology",
      "text": "The proposed method..."
    }
  ]
  ```
- [ ] Ensure `page_number` is always from chunk metadata — never generated by LLM

### Frontend
- [ ] `components/chat/SourceCard.tsx` (complete version):
  - Document icon + name
  - Page badge (e.g., "Page 7")
  - Section label
  - Truncated text excerpt (expandable)
  - "View Source" button → navigates to `/documents/{id}/view?page=7`

- [ ] Update `pages/Chat.tsx`:
  - Source cards rendered below each AI message
  - Visually distinct from chat bubbles (bordered card, different background)

### Test
- [ ] Ask a question → source cards appear
- [ ] Source card shows correct document name, page, section
- [ ] Click "View Source" → navigates to document viewer
- [ ] No source card appears if AI says "not found"

**Phase 15 done when:** Every grounded answer shows clickable source cards with correct metadata.

---

## Phase 16 — Document Viewer

**Goal:** In-app PDF viewer that opens at a specific page.

### Frontend
- [ ] Install `react-pdf` or use `pdfjs-dist` directly

- [ ] **`pages/DocumentViewer.tsx`**
  - Full-page or split-panel layout
  - Reads `?page=N` query param → opens at page N on load

- [ ] `components/viewer/PDFViewer.tsx`
  - Renders PDF using react-pdf
  - Displays one page at a time (or continuous scroll)

- [ ] `components/viewer/PageControls.tsx`
  - Previous / Next page buttons
  - Page number input (jump to page)
  - Total pages display
  - Zoom in / Zoom out buttons

- [ ] `components/viewer/ViewerSearch.tsx`
  - Search bar for in-document keyword search
  - Highlights matching text (if supported by pdf.js)

### Routing
- [ ] `/documents/:id/view` → `DocumentViewer`
- [ ] `/documents/:id/view?page=7` → opens at page 7

### Test
- [ ] Open a PDF → first page renders
- [ ] Navigate forward/back pages
- [ ] Type page number → jumps to that page
- [ ] Open from a "View Source" citation → correct page opens
- [ ] Zoom in/out works

**Phase 16 done when:** PDF viewer opens, navigates pages, and responds to citation deep links.

---

## Phase 17 — Document Summary

**Goal:** Automatic summary generation for every processed document.

### Backend
- [ ] **`services/summarizer.py`**
  - `generate_quick_summary(document_id)` → 5–10 bullet points via LLM
  - `generate_detailed_summary(document_id)` → section-by-section breakdown
  - `extract_key_topics(document_id)` → list of main concepts

- [ ] `POST /documents/{id}/summary`
  - Retrieve top chunks from the document
  - Generate quick + detailed summary + key topics
  - Save to `documents.summary` column
  - Return all three

### Frontend
- [ ] **`pages/Summary.tsx`**
  - Quick Summary section (bullet list)
  - Detailed Summary section (expandable)
  - Key Topics section (tag pills)
  - "Regenerate" button

- [ ] Add "Summary" tab or button on `DocumentDetails.tsx`

### Test
- [ ] Click "Generate Summary" → loading state → summary appears
- [ ] Quick summary shows 5–10 bullet points
- [ ] Key topics show as tags
- [ ] Summary is saved — reopening the page shows cached summary

**Phase 17 done when:** Any document can generate a structured summary on demand.

---

## Phase 18 — Document Details Page

**Goal:** A dedicated page for a single document showing all its info.

### Page
- [ ] **`pages/DocumentDetails.tsx`**

  Sections:
  - **Header** — filename, file type badge, status badge
  - **Metadata row** — pages, size, upload date, processing time
  - **Summary panel** — quick summary (generated or placeholder)
  - **Key Topics** — tag pills
  - **Action buttons:**
    - Open Viewer
    - Ask AI (→ Chat with this document pre-selected)
    - Generate Summary
    - Rename
    - Delete
  - **Chunks preview** (optional) — number of chunks, sample chunk

**Phase 18 done when:** Document details page shows all metadata, summary, and action buttons work.

---

## Phase 19 — Conversation History

**Goal:** Users can manage and revisit past conversations.

### Frontend Updates
- [ ] `components/chat/ConversationList.tsx` (complete):
  - Shows all conversations sorted by most recent
  - Conversation title (auto-generated from first message or user-set)
  - Last message preview
  - Date
  - Rename on double-click
  - Delete with confirmation

- [ ] When a conversation is selected:
  - Full message history loads
  - Document context (which documents were selected) is shown
  - User can continue the conversation

### Backend
- [ ] `PATCH /conversations/{id}` — update title
- [ ] Ensure `GET /conversations/{id}` returns messages with sources

**Phase 19 done when:** Old conversations can be reopened, renamed, and deleted. History loads correctly.

---

## Phase 20 — Document Management (Polish)

**Goal:** Complete all remaining document management features.

### Frontend
- [ ] Rename dialog with inline input
- [ ] Delete confirmation dialog
- [ ] Sort by: name, date, size, status
- [ ] Filter by: type (PDF/DOCX/TXT), status (Ready/Processing/Failed)
- [ ] Bulk actions (optional for MVP): select multiple → delete all
- [ ] Upload date formatting (relative: "2 hours ago" / "3 days ago")
- [ ] Status auto-refresh — documents in PROCESSING state refresh status automatically

**Phase 20 done when:** All document list operations are smooth and polished.

---

## Phase 21 — Search Page

**Goal:** Semantic search across all user documents.

### Backend
- [ ] **`api/search.py`**
  - `POST /search` — takes query string + optional document_ids
  - Embeds query
  - Searches Qdrant (filtered by user_id)
  - Returns top-K results with document, page, section, text, score

### Frontend
- [ ] **`pages/Search.tsx`**
  - Search input bar (large, prominent)
  - Search button
  - Optional document filter (search all or specific docs)
  - Results list:
    - Document name + type icon
    - Page number
    - Section
    - Matching text excerpt (highlighted)
    - Relevance score (optional)
    - "Open in Viewer" button
  - Empty state: "Search across your documents..."
  - No results state: "No matching content found."

### Test
- [ ] Search "employee leave" → finds relevant chunks even if exact words differ
- [ ] Results show correct document + page + section
- [ ] Clicking "Open in Viewer" navigates to that page

**Phase 21 done when:** Semantic search returns relevant chunks across all documents.

---

## Phase 22 — Multi-Document RAG

**Goal:** Chat can answer questions using context from multiple selected documents.

### Backend
- [ ] Update `POST /chat`:
  - Accept `document_ids: list[str]` (can be more than one)
  - Filter Qdrant search by all selected document IDs
  - Context builder labels each chunk with its source document
  - Citations identify which document each claim came from

### Frontend
- [ ] `components/chat/DocumentSelector.tsx`:
  - Multi-select checkboxes
  - "Select All" toggle
  - Shows count: "3 documents selected"

### Test
- [ ] Upload 2 papers, select both, ask comparison question
- [ ] Answer references both documents
- [ ] Citations show different document names

**Phase 22 done when:** Multi-document questions work with correctly attributed citations.

---

## Phase 23 — Document Comparison

**Goal:** Compare two documents and show what changed.

### Backend
- [ ] **`services/comparator.py`**
  - `compare(doc_id_a, doc_id_b)` → comparison result
  - Retrieve top chunks from both documents
  - Prompt LLM: "Compare these two documents and identify what was Added, Removed, and Modified"
  - Return structured result: `{ added: [...], removed: [...], modified: [...] }`

- [ ] `POST /documents/compare` — takes two document IDs

### Frontend
- [ ] **`pages/Compare.tsx`**
  - Document A selector (dropdown)
  - Document B selector (dropdown)
  - "Compare" button
  - Loading state
  - Results:
    - **Added** section (green)
    - **Removed** section (red)
    - **Modified** section (yellow)
    - Side-by-side diff view (optional)

### Test
- [ ] Upload Policy_2025.pdf and Policy_2026.pdf
- [ ] Run comparison → shows added/removed/modified sections
- [ ] Results include citations

**Phase 23 done when:** Two documents can be compared with structured diff output.

---

## Phase 24 — Research Mode

**Goal:** Auto-extract structured research paper metadata.

### Backend
- [ ] **`services/extractor.py`**
  - `extract_research_structure(document_id)` → structured object:
    ```json
    {
      "problem": "...",
      "objective": "...",
      "methodology": "...",
      "dataset": "...",
      "models": ["..."],
      "metrics": ["..."],
      "results": "...",
      "limitations": "...",
      "future_work": "..."
    }
    ```
  - Uses RAG to retrieve relevant sections, then LLM to extract fields

- [ ] `POST /documents/{id}/research` — returns research structure

### Frontend
- [ ] **`pages/ResearchMode.tsx`**
  - Structured card layout with each research field
  - Each field has source citation
  - "Compare Papers" button (links to Compare page)
  - Generate Questions button

**Phase 24 done when:** Research papers produce a structured analysis with citations for each field.

---

## Phase 25 — Study Mode

**Goal:** Generate study material from any document.

### Backend
- [ ] `POST /documents/{id}/study` — generates:
  - Summary notes (bullet format)
  - 10 MCQs with answers
  - 5 short-answer questions
  - 5 long-answer questions
  - Key terms / flashcards

- [ ] `POST /generate-questions` — takes document_id + question type + count

### Frontend
- [ ] **`pages/StudyMode.tsx`**

  Tabs:
  - **Notes** — bullet-point summary
  - **MCQs** — multiple choice with reveal-answer button
  - **Short Questions** — Q&A format
  - **Flashcards** — flip card interaction
  - **Quiz** — timed quiz mode (optional)

**Phase 25 done when:** Study Mode generates real questions and notes from any document.

---

## Phase 26 — Settings Page

**Goal:** User can manage profile and preferences.

### Page
- [ ] **`pages/Settings.tsx`**

  Sections:
  - **Profile** — name, email, update button
  - **Password** — change password form
  - **AI Preferences** — Top-K selector, chunk size info (read-only for MVP)
  - **Danger Zone** — Delete Account button (with confirmation)
  - **Logout** button

**Phase 26 done when:** Users can update their name and password.

---

## Phase 27 — UI Polish & Responsiveness

**Goal:** The entire app looks professional and works on all screen sizes.

### Tasks
- [ ] Sidebar collapses on mobile (hamburger menu)
- [ ] All pages are fully responsive on mobile (320px+)
- [ ] Consistent spacing, typography, and color throughout
- [ ] All buttons have hover + active states
- [ ] All interactive elements have focus states (accessibility)
- [ ] Toast notifications for all success/error actions:
  - Upload success
  - Document deleted
  - Rename success
  - Copy text
  - AI error
- [ ] Skeleton loaders on all data-loading states:
  - Dashboard stats
  - Document list
  - Conversation list
  - Chat history
- [ ] Page transitions (subtle fade-in)
- [ ] Chat auto-scroll to latest message
- [ ] Empty states on all list pages
- [ ] 404 page for unknown routes
- [ ] Loading spinner on app initialization (auth check)

**Phase 27 done when:** App looks like a polished AI SaaS product at all screen sizes.

---

## Phase 28 — Testing

**Goal:** All critical paths are tested and the evaluation dataset benchmark passes.

### Backend Tests (`backend/tests/`)
- [ ] `test_auth.py` — register, login, JWT, protected routes, ownership
- [ ] `test_documents.py` — upload, list, get, delete, authorization
- [ ] `test_processing.py` — PDF/DOCX/TXT parsing, chunking, chunk metadata
- [ ] `test_embeddings.py` — embeddings generated, correct dimensions
- [ ] `test_vector_store.py` — insert, search, filter, delete from Qdrant
- [ ] `test_rag.py` — full pipeline: ask question → get grounded answer → citations match metadata
- [ ] `test_anti_hallucination.py` — unanswerable questions return "not found" response
- [ ] `test_citations.py` — citations always come from retrieved chunk metadata
- [ ] `test_search.py` — semantic search returns relevant chunks

### Evaluation Dataset
- [ ] Add 5–10 sample documents to `data/eval/documents/`
- [ ] Create `data/eval/questions.json` with 30–50 benchmark questions
- [ ] Run benchmark:
  - Direct questions → correct answers
  - Semantic questions → conceptually correct answers
  - Unanswerable questions → "not found" responses
- [ ] Document results: retrieval recall, grounding rate, citation accuracy

### Manual Test Checklist
- [ ] Full hackathon demo flow runs without errors
- [ ] Multi-document comparison works
- [ ] Conversation history persists across sessions
- [ ] Document viewer opens at correct citation page
- [ ] App works on mobile

**Phase 28 done when:** All tests pass, evaluation benchmark meets targets, demo flow works.

---

## Phase 29 — Deployment

**Goal:** Application is live and accessible via a public URL.

### Frontend (Vercel)
- [ ] Connect `frontend/` to Vercel
- [ ] Set environment variable: `VITE_API_URL=https://your-backend.onrender.com`
- [ ] Verify build succeeds
- [ ] Verify frontend is accessible at `https://docmind-ai.vercel.app`

### Backend (Render / Railway / Fly.io)
- [ ] Create `Dockerfile` for backend
- [ ] Deploy to Render/Railway
- [ ] Set all environment variables via platform dashboard (never in code)
- [ ] Verify `GET /` returns `{ "status": "ok" }`
- [ ] Verify `POST /auth/login` works from production frontend

### PostgreSQL
- [ ] Provision managed PostgreSQL (Render / Railway / Supabase)
- [ ] Set `DATABASE_URL` in backend environment
- [ ] Run `alembic upgrade head` against production DB
- [ ] Verify tables are created

### Qdrant
- [ ] Create account at `cloud.qdrant.io`
- [ ] Create a cluster
- [ ] Set `QDRANT_URL` and `QDRANT_API_KEY` in backend environment
- [ ] Verify collection is created on first startup

### Final Checks
- [ ] Register a new account on production
- [ ] Upload a real PDF
- [ ] Ask a question → receive grounded answer with citation
- [ ] Click citation → viewer opens at correct page
- [ ] Generate a summary
- [ ] CORS is correctly configured (only allow frontend origin)
- [ ] No API keys visible in browser network tab
- [ ] README has full setup instructions for local development

**Phase 29 done when:** DocMind AI is live, publicly accessible, and the full RAG demo works on production.

---

## Summary

```
Phases 1–2:   Foundation (setup + database)
Phases 3–5:   Auth + Landing Page
Phases 6–10:  Core Backend (upload + processing + RAG pipeline)
Phases 11–14: Core Frontend (dashboard + documents + chat)
Phases 15–20: Features (citations + viewer + summary + history + management)
Phases 21–25: Advanced Features (search + multi-doc + comparison + research + study)
Phases 26–27: Settings + UI Polish
Phase 28:     Testing
Phase 29:     Deployment
```

**The non-negotiable rule:**

> Phases 8–10 (processing, embeddings, RAG) must be fully working before any chat UI is built.
> The pipeline comes before the interface.
