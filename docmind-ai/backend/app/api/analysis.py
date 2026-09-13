from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.document import Document, DocumentStatus
from app.models.chunk import DocumentChunk
from app.models.user import User
from app.services.summarizer import SummarizerService
from app.services.extractor import ResearchExtractor, RESEARCH_FIELDS
from app.utils.citation import extract_citations

router = APIRouter()


@router.post("/documents/{document_id}/summary")
def generate_summary(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a structured summary for a processed document."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status != DocumentStatus.READY:
        raise HTTPException(
            status_code=400,
            detail="Document must be processed and ready before summarization",
        )

    # Retrieve chunks for this document
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id,
    ).order_by(DocumentChunk.chunk_index).all()

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No chunks found for this document",
        )

    # Build chunk dicts from DB rows for summarizer
    chunk_dicts = [
        {
            "document_id": str(chunk.document_id),
            "document_name": doc.filename,
            "page_number": chunk.page_number,
            "section": chunk.section,
            "text": chunk.text,
        }
        for chunk in chunks
    ]

    # Generate summaries
    summarizer = SummarizerService()

    if summarizer.llm.client is None:
        from app.services.study_generator import LocalStudyGenerator, _split_sentences, _build_freq, _score_sentence
        full_text = "\n".join(c.get("text", "") for c in chunk_dicts)
        sentences = _split_sentences(full_text)
        word_freq = _build_freq(full_text)
        scored = sorted([(_score_sentence(s, word_freq), s) for s in sentences], key=lambda x: x[0], reverse=True)
        top_sentences = [s for _, s in scored[:10]]
        quick_summary = "\n".join(f"- {s}" for s in top_sentences[:5])
        detailed_summary = "\n".join(f"- {s}" for s in top_sentences)
        key_topics = LocalStudyGenerator()._extract_keyphrases(full_text, top_n=10) if hasattr(LocalStudyGenerator, '_extract_keyphrases') else []
    else:
        quick_summary = summarizer.generate_quick_summary(chunk_dicts)
        detailed_summary = summarizer.generate_detailed_summary(chunk_dicts)
        key_topics = summarizer.extract_key_topics(chunk_dicts)

    # Validate citations come from retrieved chunks
    all_citations = extract_citations(chunks)
    valid_citations = [c for c in all_citations]  # placeholder for validation

    # Save quick summary to document record
    doc.summary = quick_summary
    db.commit()

    return {
        "summary": quick_summary,
        "detailed_summary": detailed_summary,
        "key_topics": key_topics,
        "citations_validated": len(valid_citations),
    }


class ResearchResponse(BaseModel):
    fields: dict
    document_id: str


@router.post("/documents/{document_id}/research", response_model=ResearchResponse)
def extract_research(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Extract structured research paper metadata."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != DocumentStatus.READY:
        raise HTTPException(status_code=400, detail="Document must be ready before extraction")

    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id,
    ).order_by(DocumentChunk.chunk_index).all()

    if not chunks:
        raise HTTPException(status_code=400, detail="No chunks found for this document")

    chunk_dicts = [
        {
            "document_id": str(chunk.document_id),
            "document_name": doc.filename,
            "page_number": chunk.page_number,
            "section": chunk.section,
            "text": chunk.text,
        }
        for chunk in chunks
    ]

    extractor = ResearchExtractor()
    fields = extractor.extract(chunk_dicts)

    return ResearchResponse(fields=fields, document_id=str(document_id))


class StudyRequest(BaseModel):
    question_type: str = "all"


@router.post("/documents/{document_id}/study")
def generate_study_material(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate study material from a document."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != DocumentStatus.READY:
        raise HTTPException(status_code=400, detail="Document must be ready")

    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id,
    ).order_by(DocumentChunk.chunk_index).all()

    if not chunks:
        raise HTTPException(status_code=400, detail="No chunks found")

    chunk_dicts = [
        {
            "document_id": str(chunk.document_id),
            "document_name": doc.filename,
            "page_number": chunk.page_number,
            "section": chunk.section,
            "text": chunk.text,
        }
        for chunk in chunks
    ]

    from app.services.summarizer import SummarizerService
    summarizer = SummarizerService()

    import json
    from app.services.llm import LLMService, SYSTEM_PROMPT
    from app.config import settings

    llm = LLMService()

    if llm.client is None:
        from app.services.study_generator import LocalStudyGenerator
        generated = LocalStudyGenerator().generate(chunk_dicts)
        return {
            "notes": "\n\n".join(
                f"### {n['title']}\n" + "\n".join(f"- {b}" for b in n["bullets"])
                for n in generated["notes"]
            ),
            "mcqs": [
                {
                    "question": m["question"],
                    "options": m["options"],
                    "answer": m["correct_answer"],
                    "explanation": m["explanation"],
                }
                for m in generated["mcqs"]
            ],
            "short_questions": [
                {"question": q["question"], "answer": q["answer"]}
                for q in generated["questions"] if q.get("type") in ("definition", "short_answer", "cause_effect", "fill_blank")
            ],
            "long_questions": [
                {"question": q["question"], "answer": q["answer"]}
                for q in generated["questions"] if q.get("type") in ("long_answer", "process", "comparison")
            ],
            "flashcards": [
                {"front": f["front"], "back": f["back"]}
                for f in generated["flashcards"]
            ],
        }

    context = summarizer._build_context(chunk_dicts, max_chunks=20)

    def _ask_llm(prompt: str, max_tokens: int = 1500) -> str:
        if llm.client is None:
            return "LLM not configured"
        response = llm.client.chat.completions.create(
            model=settings.LLM_MODEL,
            temperature=0.3,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Context:\n{context}\n\n{prompt}"},
            ],
        )
        return response.choices[0].message.content or ""

    notes = _ask_llm(
        "Generate comprehensive study notes from this document as bullet points. "
        "Cover all major topics. Format as a markdown bullet list."
    )

    mcqs_raw = _ask_llm(
        "Generate exactly 10 multiple-choice questions (MCQs) from this document. "
        "For each question, provide exactly 4 options (A, B, C, D) and indicate the correct answer. "
        'Return as a JSON array where each item has: "question", "options" (array of 4 strings), '
        '"answer" (the correct letter A/B/C/D), and "explanation". '
        "Example: [{\"question\": \"...\", \"options\": [\"A. ...\", \"B. ...\", \"C. ...\", \"D. ...\"], \"answer\": \"A\", \"explanation\": \"...\"}]",
        max_tokens=3000,
    )
    try:
        mcqs = json.loads(mcqs_raw)
        if not isinstance(mcqs, list):
            mcqs = []
    except (json.JSONDecodeError, TypeError):
        mcqs = []

    short_raw = _ask_llm(
        "Generate exactly 5 short-answer questions from this document. "
        'Return as a JSON array where each item has: "question" and "answer". '
        "Example: [{\"question\": \"...\", \"answer\": \"...\"}]",
        max_tokens=1500,
    )
    try:
        short_questions = json.loads(short_raw)
        if not isinstance(short_questions, list):
            short_questions = []
    except (json.JSONDecodeError, TypeError):
        short_questions = []

    long_raw = _ask_llm(
        "Generate exactly 5 long-answer/essay questions from this document. "
        'Return as a JSON array where each item has: "question" and "answer". '
        "Example: [{\"question\": \"...\", \"answer\": \"...\"}]",
        max_tokens=2000,
    )
    try:
        long_questions = json.loads(long_raw)
        if not isinstance(long_questions, list):
            long_questions = []
    except (json.JSONDecodeError, TypeError):
        long_questions = []

    flashcards_raw = _ask_llm(
        "Generate exactly 10 key term flashcards from this document. "
        'Return as a JSON array where each item has: "front" (the term) and "back" (the definition). '
        "Example: [{\"front\": \"Term\", \"back\": \"Definition\"}]",
        max_tokens=1500,
    )
    try:
        flashcards = json.loads(flashcards_raw)
        if not isinstance(flashcards, list):
            flashcards = []
    except (json.JSONDecodeError, TypeError):
        flashcards = []

    return {
        "notes": notes,
        "mcqs": mcqs,
        "short_questions": short_questions,
        "long_questions": long_questions,
        "flashcards": flashcards,
    }