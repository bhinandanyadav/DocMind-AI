# Product Requirements Document (PRD)

## DocMind AI — Intelligent Document Analysis & RAG Platform

> **Tagline:** Turn Documents Into Intelligence.

**Project Type:** Full-Stack AI/ML Web Application
**Architecture:** React + FastAPI + PostgreSQL + Qdrant + LLM + RAG
**Primary Technology:** Python, TypeScript, Generative AI, NLP, Vector Search

---

## 1. What to Build

### 1.1 Problem Statement

Modern users store huge amounts of information inside PDFs, research papers, textbooks, policies, reports, manuals and business documents. Finding specific information manually is slow and inefficient.

Generic AI chatbots can answer questions, but they may:

- Hallucinate information
- Provide answers without reliable sources
- Fail to understand private documents
- Make it difficult to verify answers
- Lose context across multiple documents

DocMind AI solves this by transforming uploaded documents into an intelligent, searchable and conversational knowledge base.

The system must allow users to:

1. Upload documents
2. Extract their content
3. Understand document structure
4. Split documents into meaningful chunks
5. Generate embeddings
6. Store embeddings in a vector database
7. Search documents semantically
8. Retrieve relevant information
9. Generate grounded AI answers
10. Display document/page/section citations
11. Open the original source page
12. Generate summaries
13. Extract important information
14. Search across multiple documents
15. Compare documents
16. Generate study/research material
17. Analyze documents intelligently
18. Provide a professional and scalable document intelligence platform

---

### 1.2 Core RAG Flow

The main system must follow this pipeline. This is NOT optional:

```
DOCUMENT → UPLOAD → VALIDATION → TEXT EXTRACTION → PAGE DETECTION
    → STRUCTURE DETECTION → TEXT CLEANING → INTELLIGENT CHUNKING
    → EMBEDDING GENERATION → VECTOR DATABASE → SEMANTIC RETRIEVAL
    → RELEVANT CONTEXT → LLM → GROUNDED ANSWER → CITATIONS → SOURCE DOCUMENT/PAGE
```

The application must implement a **real RAG pipeline**. Do NOT build a generic chatbot where documents are uploaded but never actually retrieved.

---

### 1.3 Document Processing Pipeline

```
File Upload
→ File Validation
→ Secure File Storage
→ File Type Detection
→ Text Extraction
→ Page Extraction
→ Metadata Extraction
→ Structure Detection
→ Text Cleaning
→ Intelligent Chunking
→ Chunk Metadata Creation
→ Embedding Generation
→ Vector Storage
→ Document Status = READY
```

---

### 1.4 Question Answering Pipeline

```
User Question
→ Question Validation
→ Question Embedding
→ Vector Search
→ Top-K Relevant Chunks
→ Optional Reranking
→ Context Construction
→ LLM Prompt
→ LLM Response
→ Citation Extraction
→ Citation Validation
→ Final Answer
→ Source Cards
```

---

### 1.5 18 Primary Goals

1. Build secure user authentication
2. Allow PDF/DOCX/TXT document uploads
3. Validate uploaded files
4. Extract document text accurately
5. Preserve page and section information
6. Implement intelligent document chunking
7. Generate semantic embeddings
8. Store embeddings in a vector database
9. Implement semantic document retrieval
10. Implement real Retrieval-Augmented Generation
11. Prevent hallucinated document information
12. Provide document/page/section citations
13. Provide an interactive AI chat interface
14. Provide document summaries
15. Support multi-document search
16. Support document comparison
17. Provide research/study-oriented AI tools
18. Deliver a polished, scalable and hackathon-ready product

---

## 2. Target Users

### 2.1 Students

**Problems:** textbooks, lecture notes, PDFs, research papers, assignments, university regulations, examination material. Spend significant time searching manually.

**Example queries:**
- "What is the definition of normalization?"
- "Explain this chapter in simple language."
- "Generate 20 MCQs from this PDF."
- "What are the important topics for the exam?"
- "Create revision notes from these pages."

---

### 2.2 Researchers

**Problems:** research papers, journals, technical reports, datasets, methodologies, experimental results. Reading and comparing many papers is time-consuming.

**Example queries:**
- "What problem does this paper solve?"
- "What methodology was used?"
- "What dataset was used?"
- "What are the limitations?"
- "Compare the methodologies of these two papers."
- "What research gap is identified?"

---

### 2.3 Professionals

**Problems:** company policies, SOPs, technical documentation, business reports, manuals, compliance documents.

**Example queries:**
- "What is the company's leave policy?"
- "What are the project requirements?"
- "What changed between the 2025 and 2026 policy?"
- "What are the important deadlines?"
- "Summarize this technical document."
- "Find all financial figures."

---

## 3. Features

### P0 — Must Have (All mandatory for MVP)

---

#### P0-01 Authentication

- User registration, login, logout
- Password hashing (bcrypt or argon2)
- JWT authentication
- Protected routes
- User-specific documents and conversations

---

#### P0-02 Dashboard

Display:
- Total documents, total pages, total questions asked
- Recent documents list
- Processing status indicators
- Recent conversations
- Upload Document button
- Quick Actions

---

#### P0-03 Document Upload

**Supported formats:** PDF, DOCX, TXT

Features:
- Drag-and-drop + file picker
- File type and size validation
- Upload progress indicator
- Processing progress indicator
- Success and error states
- Auto-trigger document processing after upload

---

#### P0-04 Document Processing

Processing must be a **separate backend service/module** — not embedded inside an API route.

Stages:
1. Validate file
2. Extract text
3. Detect pages
4. Detect sections
5. Clean text
6. Chunk text
7. Generate embeddings
8. Store vectors
9. Store metadata
10. Mark document `READY`

---

#### P0-05 PDF Processing

Use: **PyMuPDF**

Must preserve:
- Document name
- Page number
- Page text
- Section
- Metadata

Example chunk metadata:
```json
{
  "document_name": "research.pdf",
  "page_number": 7,
  "text": "The proposed methodology..."
}
```

---

#### P0-06 DOCX Processing

Use: **python-docx**

Extract: paragraphs, headings, tables, metadata, sections.

---

#### P0-07 Intelligent Chunking

Default configuration:
- Chunk size: ~500–1000 tokens (configurable)
- Chunk overlap: ~100–150 tokens (configurable)

Chunking should attempt to preserve: paragraphs, headings, sections, page boundaries, semantic meaning.

Every chunk must have:
```json
{
  "document_id": "doc_123",
  "chunk_id": "chunk_15",
  "chunk_index": 15,
  "text": "Example text...",
  "page_number": 7,
  "section": "Methodology"
}
```

---

#### P0-08 Embeddings

- Implement configurable embedding providers
- Provider controlled through environment configuration
- Do NOT hardcode API keys or providers

---

#### P0-09 Vector Database

**Preferred: Qdrant** | Alternatives: ChromaDB, FAISS

Store per vector: `vector`, `document_id`, `chunk_id`, `page_number`, `section`, `chunk_index`, `text`, `metadata`

Required operations: Insert, Search, Filter, Delete, Document isolation, Collection management

---

#### P0-10 RAG Retrieval

Default **Top-K = 5** (configurable)

```
Question → Embedding → Vector Search → Top-K chunks → Optional reranking → Context construction
```

---

#### P0-11 AI Question Answering

The AI must:
- Answer from retrieved context only
- Be concise but useful
- Avoid unsupported claims
- Provide citations
- Admit when information isn't available

---

#### P0-12 Anti-Hallucination (Critical)

If information does not exist in uploaded documents:
> "I couldn't find sufficient information about this in the uploaded documents."

The AI must **NEVER** fabricate: facts, numbers, dates, names, page numbers, sources, or citations.

---

#### P0-13 Citations

Every grounded answer must provide:
- Document name
- Page number
- Section
- Relevant source text

```
Source:
  Employee Handbook.pdf
  Page 24
  Section: Leave Policy

  [View Source]
```

Clicking the citation opens the relevant page in the document viewer.

---

#### P0-14 AI Chat Interface

Must support:
- User and AI messages
- Markdown rendering
- Code blocks
- Loading and error states
- Source cards (visually distinct)
- New conversation, clear conversation, conversation history

---

#### P0-15 Document Viewer

- PDF viewer with page navigation
- Zoom controls
- In-viewer search
- Citation click → navigate directly to cited page

---

#### P0-16 Summarization

Three levels:

1. **Quick Summary** — 5–10 bullet points
2. **Detailed Summary** — section-by-section breakdown
3. **Key Topics** — major concepts identified automatically

---

#### P0-17 Document Management

Users can: view, search, sort, filter, rename, delete, open documents.

Document cards show: filename, type, size, upload date, page count, processing status.

---

#### P0-18 Conversation History

- Store conversations with titles
- Users can: create new, reopen, rename, delete conversations
- Full message history with sources persisted per conversation

---

### P1 — Should Have

Implement after P0 is stable and fully tested.

| # | Feature | Description |
|---|---------|-------------|
| 1 | Multi-Document RAG | Ask questions across multiple selected documents |
| 2 | Document Comparison | Compare two docs; show Added / Removed / Modified |
| 3 | Key Information Extraction | Auto-extract names, dates, organizations, amounts, deadlines |
| 4 | Important Date Detection | Detect deadlines, events, start/end dates |
| 5 | Table Understanding | Extract and query data from tables inside documents |
| 6 | OCR | Process scanned PDFs via Tesseract or equivalent |
| 7 | Semantic Document Search | Search across all documents by concept, not just keywords |
| 8 | Question Generation | Generate MCQs, short-answer, long-answer, interview questions |
| 9 | Study Mode | Notes, flashcards, quizzes, revision material from documents |
| 10 | Research Assistant Mode | Auto-extract: problem, objective, methodology, dataset, results, limitations |
| 11 | AI Report Generation | Generate structured reports across multiple documents |
| 12 | Document Classification | Auto-classify: Research Paper, Policy, Contract, etc. |
| 13 | Document Analytics | Pages, words, sections, topics, processing time, Q&A stats |

---

### P2 — Nice to Have

| # | Feature | Description |
|---|---------|-------------|
| 1 | Voice Assistant | Voice → Speech-to-Text → RAG → LLM → Answer |
| 2 | Multilingual AI | English / Hindi / Bengali support |
| 3 | Knowledge Graph | Extract and visualize entity relationships |
| 4 | Risk / Clause Detection | Detect penalty, termination, renewal clauses (AI-assisted, not legal advice) |
| 5 | Sensitive Info Detection | Detect emails, IDs, phone numbers; optional redaction |
| 6 | Auto Tagging | Auto-generate document tags |
| 7 | Agentic Analysis | Multi-step autonomous document analysis |
| 8 | Calendar Integration | Extract deadlines; export to calendar |
| 9 | Team Workspaces | Shared documents with members and permissions |
| 10 | AI Feedback | Thumbs up/down; store for evaluation |

---

### Out of Scope

NOT part of the initial product:

- Full legal advice or medical diagnosis
- Autonomous high-impact decisions (hiring, financial, contract signing)
- Training or fine-tuning a custom LLM / foundation model
- Building a custom vector database from scratch
- Social media features
- Complex enterprise IAM (SSO, SAML, LDAP)
- Unlimited file storage

---

## 4. Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide Icons, React Router, React Markdown |
| **Backend** | Python, FastAPI, Pydantic, Uvicorn |
| **AI / RAG** | Configurable LLM API, Embedding model, LangChain or LlamaIndex, optional reranker |
| **Document Processing** | PyMuPDF (PDF), python-docx (DOCX), Tesseract (OCR) |
| **Vector Database** | Qdrant (preferred), ChromaDB or FAISS (alternatives) |
| **Relational Database** | PostgreSQL |
| **Auth** | JWT + password hashing |
| **Deployment** | Frontend: Vercel / Backend: Render/Railway/Fly.io / DB: Managed PostgreSQL / VectorDB: Qdrant Cloud |

All AI providers must be configurable via environment variables. Do not hardcode any deployment provider.

---

## 5. Database Design

**USER**
```
id | name | email | password_hash | created_at
```

**DOCUMENT**
```
id | user_id | filename | file_type | file_size | page_count | status | summary | created_at | updated_at
```

Status values: `UPLOADED` | `PROCESSING` | `READY` | `FAILED`

**DOCUMENT_CHUNK**
```
id | document_id | chunk_index | text | page_number | section | vector_id | metadata
```

**CONVERSATION**
```
id | user_id | title | created_at | updated_at
```

**MESSAGE**
```
id | conversation_id | role (user/assistant/system) | content | sources | created_at
```

**FEEDBACK**
```
id | message_id | user_id | rating | feedback_text | created_at
```

---

## 6. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| GET | `/documents` | List user documents |
| POST | `/documents/upload` | Upload document |
| GET | `/documents/{id}` | Get document details |
| PATCH | `/documents/{id}` | Rename / update document |
| DELETE | `/documents/{id}` | Delete document |
| POST | `/documents/{id}/process` | Trigger processing |
| GET | `/documents/{id}/status` | Get processing status |
| POST | `/documents/{id}/summary` | Generate summary |
| POST | `/chat` | Ask AI question, get RAG answer |
| GET | `/conversations` | List conversations |
| GET | `/conversations/{id}` | Get conversation messages |
| DELETE | `/conversations/{id}` | Delete conversation |
| POST | `/documents/compare` | Compare two documents |
| POST | `/generate-questions` | Generate questions from document |
| POST | `/search` | Semantic search across documents |

Every endpoint must implement: authentication, request/response validation, error handling, appropriate HTTP status codes, structured JSON responses.

---

## 7. Project Structure

```
docmind-ai/
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/
│       │   ├── chat/
│       │   ├── documents/
│       │   ├── viewer/
│       │   ├── dashboard/
│       │   └── common/
│       ├── pages/
│       │   ├── Landing.tsx
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Documents.tsx
│       │   ├── DocumentDetails.tsx
│       │   ├── DocumentViewer.tsx
│       │   ├── Chat.tsx
│       │   ├── Search.tsx
│       │   ├── Compare.tsx
│       │   ├── Summary.tsx
│       │   ├── ResearchMode.tsx
│       │   ├── StudyMode.tsx
│       │   └── Settings.tsx
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── utils/
│       ├── types/
│       ├── router/
│       └── main.tsx
│
├── backend/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── api/
│       │   ├── auth.py
│       │   ├── documents.py
│       │   ├── chat.py
│       │   ├── search.py
│       │   └── analysis.py
│       ├── services/
│       │   ├── parser.py         # PDF/DOCX/TXT extraction
│       │   ├── chunker.py        # Chunking + overlap + metadata
│       │   ├── embeddings.py     # Embedding generation + provider config
│       │   ├── vector_store.py   # Qdrant insert/search/delete
│       │   ├── retriever.py      # Query embedding + Top-K retrieval
│       │   ├── reranker.py       # Optional relevance reranking
│       │   ├── llm.py            # LLM calls + prompt construction
│       │   ├── summarizer.py     # Summary generation
│       │   ├── comparator.py     # Document comparison
│       │   └── extractor.py      # Key info / date extraction
│       ├── models/
│       ├── schemas/
│       ├── database/
│       ├── middleware/
│       └── utils/
│
├── data/
│   ├── uploads/
│   └── processed/
│
├── .env.example
├── docker-compose.yml
├── README.md
└── things_to_do.md
```

---

## 8. RAG System Design

### 8.1 Ingestion Pipeline (Modular)

```
DOCUMENT
    ↓
File Validation
    ↓
Document Parser (parser.py)
    ↓
Text Extraction
    ↓
Page / Section Detection
    ↓
Text Cleaner
    ↓
Intelligent Chunker (chunker.py)
    ↓
Embedding Model (embeddings.py)
    ↓
Qdrant DB (vector_store.py)
    ↓
Document READY
```

### 8.2 QA Pipeline (Modular)

```
USER QUESTION
    ↓
Question Embedding (embeddings.py)
    ↓
Vector Search (vector_store.py)
    ↓
Top-K Chunks (retriever.py)
    ↓
Reranking (reranker.py)
    ↓
Context Construction
    ↓
LLM Prompt (llm.py)
    ↓
LLM Response
    ↓
Citation Validation
    ↓
FINAL ANSWER + SOURCE + PAGE + SECTION
```

### 8.3 Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `parser.py` | PDF, DOCX, TXT extraction |
| `chunker.py` | Chunk size, overlap, section boundaries, metadata |
| `embeddings.py` | Embedding generation, provider config |
| `vector_store.py` | Qdrant insert, search, delete, filtering |
| `retriever.py` | Query embedding, Top-K, document filtering |
| `reranker.py` | Optional relevance reranking |
| `llm.py` | Model calls, prompt construction, response handling |
| Citation formatter | Document source, page, section, source text, validation |

Do NOT combine these into one function. Modular = testable and scalable.

---

## 9. Chunk Metadata

Every chunk must retain:

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

Metadata is the foundation of the citation system — do not drop it at any stage.

---

## 10. LLM System Prompt

```
You are DocMind AI, an intelligent document analysis assistant.

Your primary task is to answer user questions using the provided document context.

IMPORTANT RULES:

1. The uploaded documents are the primary source of truth.

2. Answer questions using the retrieved document context whenever the question
   relates to uploaded documents.

3. Do not invent facts.

4. Do not fabricate numbers, dates, names, statistics, quotations, sources or citations.

5. Never fabricate page numbers.

6. Never claim that a document contains information unless the provided context
   supports that claim.

7. If the retrieved context does not contain sufficient information, clearly state:
   "I couldn't find sufficient information about this in the uploaded documents."

8. Do not pretend to have searched a document when no relevant context was retrieved.

9. When possible, cite the document name, page number and section.

10. Citations must correspond to actual retrieved metadata.

11. Do not create fake citations.

12. Clearly distinguish between information found in documents and general explanations.

13. If the user asks for a calculation, perform it carefully using provided document data.

14. If multiple documents are provided, identify which document supports each claim.

15. Keep answers concise but useful.

16. Use Markdown where it improves readability.

17. If evidence is insufficient or conflicting, explain the uncertainty rather than guessing.

Your objective: provide accurate, traceable and document-grounded answers.
```

---

## 11. Security Requirements

### Authentication & Authorization
- Password hashing (bcrypt or argon2)
- JWT with expiry
- Protected API routes (auth middleware)
- Users can only access their own documents, conversations, and messages

### File Security
- File type validation (whitelist: PDF, DOCX, TXT)
- File size limits
- Secure filename sanitization
- Safe upload directories
- Corrupt file detection

### API Security
- Input validation on all endpoints
- Output validation
- Basic rate limiting on auth and upload endpoints
- Error handling (no sensitive info in error responses)
- CORS configuration

### Secret Management
- All secrets via environment variables — never hardcoded
- API keys never exposed to the frontend
- `.env` never committed; provide `.env.example`

---

## 12. Performance Requirements

| Operation | Target |
|-----------|--------|
| Document processing | 30–60 seconds for normal-sized documents |
| Question → Answer | Under 5–8 seconds |
| Processing success rate | 95%+ for supported, readable documents |
| Answer grounding rate | 90%+ answers supported by retrieved context |
| Citation accuracy | 90%+ point to correct document/page/section |

Use: async processing, background jobs, loading states, progress indicators, efficient DB queries, caching where useful. Do not block the UI during document processing.

---

## 13. Error Handling

| Scenario | User Message |
|----------|-------------|
| Invalid file type | "This file type is not supported." |
| Corrupted file | "We couldn't process this document." |
| Empty document | "No readable text was found in this document." |
| AI service failure | "The AI service is temporarily unavailable." |
| No relevant context | "I couldn't find enough information in the selected documents." |
| Vector DB failure | "Document search is temporarily unavailable." |

Errors must be: user-friendly, structured, logged internally, free from sensitive information.

---

## 14. UI Pages

| Priority | Page | Key Elements |
|----------|------|-------------|
| MVP | Landing | Product name, tagline, features, how it works, CTA, login/register |
| MVP | Login | Email, password, login button, register link |
| MVP | Register | Name, email, password, confirm password |
| MVP | Dashboard | Stats (docs, pages, questions), recent docs, recent conversations, upload button |
| MVP | Documents | Search, filter, sort, upload, document cards/table with status |
| MVP | Document Details | Filename, type, pages, size, summary, topics, upload date, actions |
| MVP | Document Viewer | PDF, page controls, zoom, search, citation navigation |
| MVP | AI Chat | Split layout: document list + chat + source cards |
| Later | Search | Semantic search across all documents |
| Later | Compare | Document A vs Document B — added/removed/modified |
| Later | Summary | Quick, detailed, key topics |
| Later | Research Mode | Problem, objective, methodology, dataset, results, limitations |
| Later | Study Mode | Notes, MCQs, flashcards, quizzes, revision |
| Later | Settings | Profile, AI settings, preferences, security, logout |

### Chat UI Layout

```
────────────────────────────────────────────────────
│ Documents  │           AI Chat                   │
│            │                                     │
│ PDF 1      │  USER: What is the leave policy?    │
│ PDF 2      │                                     │
│ PDF 3      │  AI: Employees are entitled to 18   │
│            │  paid leaves per calendar year.      │
│            │                                     │
│            │  SOURCES                            │
│            │  📄 Employee_Handbook.pdf           │
│            │     Page 24 · Section: Leave Policy │
│            │     [View Source]                   │
│            │                                     │
│            │  ─────────────────────────────────  │
│            │  Ask about this document...  [Send] │
────────────────────────────────────────────────────
```

---

## 15. UI Design Requirements

The application must look like a modern AI SaaS product:

- Clean, professional, minimal, modern
- Fully responsive and mobile-friendly
- Consistent typography and clear visual hierarchy
- Good spacing, fast perceived performance, accessible

Required components:
- Sidebar navigation
- Cards and Tabs
- Drag-and-drop upload area
- Chat interface with source cards
- PDF viewer
- Skeleton loaders
- Upload/processing progress indicators
- Toast notifications
- Empty states
- Error states

---

## 16. Development Phases

| Phase | Focus |
|-------|-------|
| 1 | Project setup: repo, frontend, backend, environment, README, Git |
| 2 | Authentication: register, login, logout, JWT, password hashing, protected routes |
| 3 | Database: PostgreSQL, all 6 tables |
| 4 | Document upload: API, validation, storage, document record |
| 5 | Document processing: PDF/DOCX/TXT parser, text + metadata + page extraction |
| 6 | Chunking: chunk size, overlap, section awareness, metadata preservation |
| 7 | Embeddings: service, provider config, batch embedding |
| 8 | Vector DB: Qdrant, collection creation, insert, search, delete, filtering |
| 9 | Retrieval: query embedding, Top-K, filtering, context ranking |
| 10 | RAG: question → retrieval → context → prompt → LLM → answer |
| 11 | Chat: UI, message persistence, conversation history, source cards, streaming |
| 12 | Citations: source metadata, formatter, cards, viewer navigation |
| 13 | Document viewer: PDF viewer, page nav, zoom, citation jumping |
| 14 | Summarization: quick, detailed, key topics |
| 15 | Multi-document: selection, cross-document retrieval, comparison |
| 16 | Advanced P1: Research Mode, Study Mode, Question Gen, OCR, table analysis |
| 17 | Testing + UI polish: auth, upload, RAG, retrieval, citations, responsiveness, accessibility |
| 18 | Deployment: frontend, backend, PostgreSQL, Qdrant, env vars, CORS, demo data |

---

## 17. MVP Checklist

### Authentication
- [ ] Registration
- [ ] Login / Logout
- [ ] Password hashing
- [ ] JWT + protected routes

### Documents
- [ ] PDF / DOCX / TXT upload
- [ ] File type and size validation
- [ ] Processing status tracking
- [ ] Document listing, rename, delete

### Processing
- [ ] PDF extraction (PyMuPDF)
- [ ] DOCX extraction (python-docx)
- [ ] TXT extraction
- [ ] Page + section detection
- [ ] Text cleaning + chunking + metadata

### AI / RAG
- [ ] Embeddings (configurable provider)
- [ ] Qdrant vector storage
- [ ] Semantic search
- [ ] Top-K retrieval
- [ ] Context construction
- [ ] LLM integration (configurable provider)
- [ ] Grounded responses
- [ ] Anti-hallucination behavior
- [ ] Source citations

### Chat
- [ ] Chat interface
- [ ] Message history
- [ ] Conversation persistence
- [ ] Source cards
- [ ] Loading + error states

### Viewer
- [ ] PDF viewer
- [ ] Page navigation + zoom + search
- [ ] Citation click → navigate to correct page

### Analysis
- [ ] Quick summary
- [ ] Detailed summary
- [ ] Key topics

### UI
- [ ] Responsive design
- [ ] Sidebar, cards, empty states, skeleton loaders, toasts

### Security
- [ ] Password hashing, JWT, authorization
- [ ] File validation, API validation, secret protection, rate limiting

### Deployment
- [ ] Frontend + backend deployed
- [ ] PostgreSQL + Qdrant configured
- [ ] Environment variables set
- [ ] README with setup instructions
- [ ] Demo documents included

---

## 18. Hackathon Demo Flow

### Step 1 — Open DocMind AI
Show the landing page: *"DocMind AI — Turn Documents Into Intelligence."*

### Step 2 — Upload Documents
Upload `Research_Paper_1.pdf` and `Research_Paper_2.pdf`. Show real-time status:
`Uploading → Extracting → Chunking → Generating embeddings → Indexing → READY`

### Step 3 — Ask a Basic Question
Ask: *"What problem does this research address?"*
Show: AI answer + source document + page number + section + relevant text.

### Step 4 — Ask a Methodology Question
Ask: *"What methodology was used in this research?"*
Click **View Source** — document viewer opens the cited page. This proves grounding.

### Step 5 — Generate Summary
Click **Generate Summary** → show problem, objective, methodology, results, limitations, key findings.

### Step 6 — Generate Questions
Click **Generate Questions** → show MCQs, short questions, long questions.

### Step 7 — Multi-Document RAG
Select both papers. Ask: *"Compare the methodologies and results of these two papers."*
Show a comparison table with citations for each major claim.

### Step 8 — Show Semantic Search
Search: *"What limitations were identified?"*
Show semantically relevant results even where exact query words don't appear in the document.

### Step 9 — Demonstrate Anti-Hallucination
Ask: *"What was the company's revenue in 2030?"*
Expected response: *"I couldn't find sufficient information about this in the uploaded documents."*
Explain: "The system does not invent an answer when evidence is insufficient."

---

## 19. Advanced Demo Option

Upload `Policy_2025.pdf` and `Policy_2026.pdf`, then:

- Ask: *"What changed between the 2025 and 2026 policies?"*
  → Show: **Added** / **Removed** / **Modified** sections

- Ask: *"What are the important deadlines?"*
  → Show extracted dates with document, page, and source

- Ask: *"Summarize the complete policy in 10 points."*

Demonstrates: RAG + multi-document analysis + comparison + information extraction + date detection + citations.

---

## 20. Success Metrics

| Metric | Target |
|--------|--------|
| Document processing success | 95%+ of supported, readable documents |
| Answer grounding | 90%+ benchmark answers supported by retrieved context |
| Citation accuracy | 90%+ citations point to correct document/page/section |
| Top-5 retrieval recall | High recall on evaluation dataset |
| Question → Answer latency | 5–8 seconds or less under normal infrastructure |

**User experience tracking:**
- Upload success rate
- Processing success rate
- Average processing time / response time
- Questions per document
- Citation click rate
- Thumbs-up / thumbs-down rate

---

## 21. Evaluation Dataset

Build a benchmark with **5–10 sample documents** and **30–50 questions** covering:

| Type | Example | Expected Behavior |
|------|---------|-------------------|
| Direct | "What is the author's name?" | Exact answer from document |
| Semantic | "What approach was used to solve the problem?" | Conceptual match |
| Multi-hop | "Which model performed better and why?" | Cross-section reasoning |
| Numerical | "What was the revenue growth?" | Accurate figure from document |
| Unanswerable | "What was revenue in 2030?" | "Not found in documents" |

Use this dataset to evaluate: retrieval quality, answer grounding, citation accuracy, hallucination rate, and response time.

---

## 22. Product Architecture

```
┌──────────────────────┐
│      React UI        │
│      TypeScript      │
└──────────┬───────────┘
           │ REST API
           ▼
┌──────────────────────┐
│      FastAPI         │
│      Backend         │
└──────────┬───────────┘
           │
    ┌──────┼──────────────┐
    ▼      ▼              ▼
┌────────┐ ┌───────────┐ ┌─────────┐
│Postgres│ │ Document  │ │ Qdrant  │
│        │ │ Processing│ │ Vector  │
└────────┘ └─────┬─────┘ └────┬────┘
                 │             │
                 ▼             │
          ┌────────────┐       │
          │ Embeddings │◄──────┘
          └─────┬──────┘
                ▼
          ┌────────────┐
          │    LLM     │
          └─────┬──────┘
                ▼
        Grounded Answer
                ▼
        Citations + Sources
```

---

## 23. Critical Implementation Rules

| Rule | Requirement |
|------|-------------|
| 1 | Do NOT build a generic chatbot. AI must retrieve from uploaded documents. |
| 2 | RAG must be real: Upload → Process → Chunk → Embed → Store → Retrieve → Generate → Cite → View Source |
| 3 | Never fabricate citations. No page number = no citation. |
| 4 | Never fabricate document information. Missing info → explicit "not found" message. |
| 5 | Keep RAG components modular — not one monolithic function. |
| 6 | Never expose API keys. Use environment variables only. |
| 7 | Build P0 first. No advanced features before P0 pipeline is fully working. |
| 8 | Application must run locally with documented setup instructions. |
| 9 | Every major AI answer must be traceable to the original document. |
| 10 | Frontend communicates with backend via clean API services, not business logic in UI components. |

---

## 24. Final MVP

The minimum successful version must contain all of the following:

```
Authentication + Dashboard + PDF/DOCX/TXT Upload + Document Processing
    + Text Extraction + Page Metadata + Intelligent Chunking
    + Embeddings + Qdrant + Semantic Search + RAG + LLM
    + AI Chat + Citations + Document Viewer + Page Navigation
    + Summary + Conversation History + Document Management
    + Error Handling + Responsive UI
```

---

## 25. Product Vision

> **"An AI-powered second brain for documents."**

The central differentiator:

> **Every important AI answer must be traceable back to the original document.**

Instead of:
```
AI says this...
```

DocMind AI says:
```
AI says this...

Supported by:
  Research_Paper.pdf · Page 7 · Section: Methodology
  [View Source]
```

This creates: **AI + RAG + Trust + Traceability + Document Intelligence** — not another generic chatbot.

The complete user workflow:
```
DOCUMENTS → UNDERSTAND → INDEX → SEARCH → RETRIEVE → REASON → ANSWER → CITE → VERIFY
```
