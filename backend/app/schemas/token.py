from pydantic import BaseModel
from typing import Optional

from ..database import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None
    user_id: int


class TokenData(BaseModel):
    username: str
    role: Optional[UserRole] = None
