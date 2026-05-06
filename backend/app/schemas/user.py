from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

from ..database import UserRole


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: UserRole


class UserCreate(UserBase):
    password: str


class UserCreateInternal(UserCreate):
    pass


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None


class UserInDBBase(UserBase):
    user_id: int
    model_config = ConfigDict(from_attributes=True)


class UserSchema(UserBase):
    user_id: int
    model_config = ConfigDict(from_attributes=True)
