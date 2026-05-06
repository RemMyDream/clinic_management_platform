from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    chat_id = Column(Integer, primary_key=True, autoincrement=True)
    chat_message = Column(Text)
    role = Column(String(50), default="user")
    user_id = Column(Integer, ForeignKey("users.user_id"))
    time_stamp = Column(TIMESTAMP(timezone=True), server_default="now()", nullable=False)

    user = relationship("User", back_populates="chat_messages")
