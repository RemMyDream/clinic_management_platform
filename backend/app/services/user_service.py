from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..database import UserRole
from ..models import User
from ..repositories import UserRepository
from ..schemas import UserCreate, UserUpdate, UserSchema


class UserService:

    @staticmethod
    def get_user(db: Session, user_id: int) -> User:
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    @staticmethod
    def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return UserRepository.get_all(db, skip, limit)

    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        if user.email:
            if UserRepository.get_by_email(db, str(user.email)):
                raise HTTPException(status_code=400, detail="Email already registered")
        if UserRepository.get_by_username(db, user.username):
            raise HTTPException(status_code=400, detail="Username already registered")
        from ..crud import create_user
        return create_user(db=db, user=user)

    @staticmethod
    def update_user(
        db: Session,
        user_id: int,
        user_update: UserUpdate,
        current_user: User,
    ) -> User:
        target_user = UserService.get_user(db, user_id)

        is_admin = current_user.role.value == UserRole.ADMIN.value
        is_self = current_user.user_id == user_id

        if not is_admin and not is_self:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        if user_update.role is not None and user_update.role.value != target_user.role.value:
            if not is_admin:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only ADMIN can change user roles.")

        updated = UserRepository.update(db, user_id, user_update)
        if not updated:
            raise HTTPException(status_code=404, detail="User not found after update attempt")
        return updated

    @staticmethod
    def delete_user(db: Session, user_id: int, current_user: User) -> User:
        if current_user.user_id == user_id:
            raise HTTPException(status_code=400, detail="Admin cannot delete themselves.")
        target_user = UserService.get_user(db, user_id)
        deleted = UserRepository.delete(db, user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="User not found")
        return deleted
