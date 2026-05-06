from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import ChatMessage
from ..repositories import ChatRepository
from ..schemas import ChatMessageCreate


class ChatService:

    @staticmethod
    def create_message(db: Session, message: ChatMessageCreate, user_id: Optional[int] = None) -> ChatMessage:
        return ChatRepository.create(db, message, user_id)

    @staticmethod
    def get_history(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[ChatMessage]:
        return ChatRepository.get_for_user(db, user_id, skip, limit)
