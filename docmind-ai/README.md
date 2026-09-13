# DocMind AI

> Turn Documents Into Intelligence.

DocMind AI is an intelligent document analysis platform powered by RAG (Retrieval-Augmented Generation). Upload PDFs, DOCX, and TXT files and ask questions — every answer is grounded in your documents with source citations.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Python + FastAPI + PostgreSQL + Qdrant
- **AI:** Configurable LLM + Embedding models via environment variables

## Quick Start (Local)

### 1. Start Services
```bash
docker compose up -d
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your API keys

uvicorn app.main:app --reload
```

On Windows, the backend can also be started from `backend` with:
```powershell
npm run dev
```
This uses `backend/.venv` and starts Uvicorn on port `8001`. If port `8001`
is already serving DocMind, do not start a second backend; use the existing
server or stop it before running the command again.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Run Migrations
```bash
cd backend
alembic upgrade head
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:
- `LLM_API_KEY` — Your OpenAI / Groq API key
- `EMBEDDING_API_KEY` — Your OpenAI API key for `text-embedding-3-small`
- `SECRET_KEY` — A long random string for JWT signing

The Python embedding integration is implemented in
`backend/app/services/embeddings.py`. It sends document chunks to
`text-embedding-3-small` and stores the resulting 1536-dimensional vectors in
Qdrant. After adding the key to `backend/.env`, restart the backend and upload
or retry documents so they are embedded and indexed.

## API Documentation

Once running, visit: `http://localhost:8000/docs`

## Project Structure

```
docmind-ai/
├── frontend/          React + TypeScript frontend
├── backend/           FastAPI backend
│   └── app/
│       ├── api/       Route handlers
│       ├── services/  Business logic (RAG, parsing, etc.)
│       ├── models/    SQLAlchemy ORM models
│       ├── schemas/   Pydantic request/response schemas
│       └── database/  DB session + migrations
├── data/              Uploaded files (gitignored)
├── docker-compose.yml PostgreSQL + Qdrant
└── .env.example       Environment variable template
```
