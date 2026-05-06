from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from .models import User
from .repositories import UserRepository
from .schemas import TokenData
from .database import get_db, UserRole
from .config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub")
        user_role_str: Optional[str] = payload.get("role")

        if email is None or user_role_str is None:
            raise credentials_exception

        try:
            user_role_from_token = UserRole(user_role_str)
        except ValueError:
            raise credentials_exception

        token_data = TokenData(username=email, role=user_role_from_token)
    except JWTError:
        raise credentials_exception

    user = UserRepository.get_by_email(db, email=token_data.username)

    if user is None or user.role is None or user.role.value != user_role_from_token.value:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


async def get_current_active_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role. Requires ADMIN role."
        )
    return current_user


async def get_current_active_doctor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != UserRole.DOCTOR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role. Requires DOCTOR role."
        )
    return current_user


async def get_current_active_clinic_staff(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != UserRole.CLINIC_STAFF.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role. Requires CLINIC_STAFF role."
        )
    return current_user


async def get_current_active_patient(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != UserRole.PATIENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role. Requires PATIENT role."
        )
    return current_user


async def get_current_doctor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value not in [UserRole.DOCTOR.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires DOCTOR or ADMIN role."
        )
    return current_user


async def get_staff_doctor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value not in [UserRole.CLINIC_STAFF.value, UserRole.ADMIN.value, UserRole.DOCTOR.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires CLINIC_STAFF, DOCTOR, or ADMIN role."
        )
    return current_user


async def get_current_clinic_staff_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role.value not in [UserRole.ADMIN.value, UserRole.CLINIC_STAFF.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires Admin or Clinic Staff role."
        )
    return current_user


async def get_current_patient_or_doctor_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role.value not in [UserRole.ADMIN.value, UserRole.DOCTOR.value, UserRole.PATIENT.value, UserRole.CLINIC_STAFF.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires Admin, Doctor, Clinic Staff, or Patient role."
        )
    return current_user
