from typing import List, Optional, Dict, Any

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

    @staticmethod
    def save_message(db: Session, user_id: int, role: str, text: str) -> ChatMessage:
        """Save a single chat message (user or AI) to the database.
        `role` should be 'user' or 'model' (Gemini convention)."""
        return ChatRepository.save_message(db, user_id, role, text)

    @staticmethod
    def get_conversation_history(db: Session, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """Return recent messages formatted for Gemini ChatSession's `history` parameter.

        Gemini expects: [{"role": "user"|"model", "parts": ["text"]}, ...]
        """
        messages = ChatRepository.get_recent_for_user(db, user_id, limit)
        history = []
        for msg in messages:
            # Map stored role to Gemini role names
            gemini_role = msg.role if msg.role in ("user", "model") else "user"
            history.append({
                "role": gemini_role,
                "parts": [msg.chat_message],
            })
        return history
