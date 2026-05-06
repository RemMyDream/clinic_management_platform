from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ChatMessageBase(BaseModel):
    chat_message: str


class ChatMessageCreate(ChatMessageBase):
    user_id: Optional[int] = None


class ChatMessageSchema(ChatMessageBase):
    chat_id: int
    time_stamp: Optional[datetime] = None
    user_id: Optional[int] = None
    role: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
