import uuid
from sqlalchemy import Column, SmallInteger, DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(Uuid(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(SmallInteger, nullable=True)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    message = relationship("Message", back_populates="feedback")
