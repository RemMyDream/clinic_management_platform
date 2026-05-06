from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import ChatMessage
from ..schemas import ChatMessageCreate


class ChatRepository:

    @staticmethod
    def get_by_id(db: Session, message_id: int) -> Optional[ChatMessage]:
        return db.query(ChatMessage).filter(ChatMessage.chat_id == message_id).first()

    @staticmethod
    def get_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[ChatMessage]:
        return (
            db.query(ChatMessage)
            .filter(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.time_stamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def create(db: Session, message: ChatMessageCreate, user_id: Optional[int] = None) -> ChatMessage:
        db_message = ChatMessage(**message.model_dump(), user_id=user_id)
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        return db_message
