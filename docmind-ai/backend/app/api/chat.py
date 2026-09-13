from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.conversation import Conversation
from app.models.document import Document, DocumentStatus
from app.models.message import Message, MessageRole
from app.models.user import User
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationListResponse,
    ConversationResponse,
    ConversationUpdateRequest,
)
from app.services.llm import LLMService, NOT_FOUND_ANSWER
from app.services.retriever import retrieve

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Answer a question using retrieved chunks from selected documents."""
    owned_documents = db.query(Document).filter(
        Document.id.in_(request.document_ids),
        Document.user_id == current_user.id,
        Document.status == DocumentStatus.READY,
    ).all()
    if {document.id for document in owned_documents} != set(request.document_ids):
        raise HTTPException(status_code=404, detail="One or more documents were not found")

    conversation = None
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id,
        ).first()
        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(user_id=current_user.id, title=request.question[:100])
        db.add(conversation)
        db.flush()

    chunks = retrieve(
        request.question,
        str(current_user.id),
        [str(document_id) for document_id in request.document_ids],
        db=db,
    )
    answer = NOT_FOUND_ANSWER if not chunks else LLMService().answer(request.question, chunks)
    sources = [
        {
            "document_id": str(chunk["document_id"]),
            "document_name": chunk.get("document_name", "Unknown"),
            "page_number": int(chunk["page_number"]),
            "line_start": int(chunk.get("line_start", 1)),
            "line_end": int(chunk.get("line_end", 1)),
            "section": chunk.get("section"),
            "text": chunk.get("text", ""),
            "score": float(chunk["score"]),
        }
        for chunk in chunks
    ]
    persisted_sources = jsonable_encoder(sources)

    db.add(Message(conversation_id=conversation.id, role=MessageRole.USER, content=request.question))
    assistant_message = Message(
        conversation_id=conversation.id,
        role=MessageRole.ASSISTANT,
        content=answer,
        sources=persisted_sources,
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    return ChatResponse(
        answer=answer,
        sources=sources,
        conversation_id=conversation.id,
        message_id=assistant_message.id,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a conversation and its messages for the current user."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.get("/conversations", response_model=ConversationListResponse)
def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the current user's conversations, newest first."""
    query = db.query(Conversation).filter(Conversation.user_id == current_user.id)
    total = query.count()
    items = query.order_by(Conversation.updated_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return ConversationListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create an empty conversation for the current user."""
    conversation = Conversation(user_id=current_user.id, title="New Conversation")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: UUID,
    request: ConversationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rename a conversation owned by the current user."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conversation.title = request.title.strip()
    db.commit()
    db.refresh(conversation)
    return conversation


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a conversation and its messages."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conversation)
    db.commit()
