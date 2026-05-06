import secrets
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import User
from ..schemas import UserCreate, UserUpdate
from ..database import pwd_context


class UserRepository:

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.user_id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, user: UserCreate) -> User:
        hashed_password = pwd_context.hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            role=user.role,
            full_name=user.full_name,
        )
        db.add(db_user)
        db.flush()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        db_user = UserRepository.get_by_id(db, user_id)
        if not db_user:
            return None

        update_data = user_update.model_dump(exclude_unset=True)

        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = pwd_context.hash(update_data["password"])
            del update_data["password"]
        elif "password" in update_data:
            del update_data["password"]

        for key, value in update_data.items():
            setattr(db_user, key, value)

        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete(db: Session, user_id: int) -> Optional[User]:
        db_user = db.query(User).filter(User.user_id == user_id).first()
        if not db_user:
            return None
        db.delete(db_user)
        db.commit()
        return db_user

    @staticmethod
    def create_password_reset_token(db: Session, user: User) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        user.reset_password_token = token
        user.reset_password_token_expires_at = expires_at
        db.commit()
        db.refresh(user)
        return token

    @staticmethod
    def get_by_reset_token(db: Session, token: str) -> Optional[User]:
        return db.query(User).filter(User.reset_password_token == token).first()

    @staticmethod
    def reset_password(db: Session, user: User, new_password: str) -> bool:
        user.hashed_password = pwd_context.hash(new_password)
        user.reset_password_token = None
        user.reset_password_token_expires_at = None
        db.commit()
        return True
