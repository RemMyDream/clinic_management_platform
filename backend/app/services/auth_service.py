from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session

from ..config import settings
from ..database import pwd_context, UserRole
from ..models import User
from ..repositories import UserRepository
from ..schemas import UserCreate, Token


class AuthService:

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        user = UserRepository.get_by_email(db, email)
        if not user or not pwd_context.verify(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def login(db: Session, email: str, password: str) -> dict:
        user = AuthService.authenticate_user(db, email, password)
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = AuthService.create_access_token(
            data={"sub": user.email, "role": user.role.value},
            expires_delta=access_token_expires,
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role.value,
            "user_id": user.user_id,
        }

    @staticmethod
    def register(db: Session, user_data: UserCreate) -> User:
        if user_data.email and UserRepository.get_by_email(db, str(user_data.email)):
            raise HTTPException(status_code=400, detail="Email already registered")
        if UserRepository.get_by_username(db, user_data.username):
            raise HTTPException(status_code=400, detail="Username already registered")

        from ..crud import create_user
        return create_user(db=db, user=user_data)
