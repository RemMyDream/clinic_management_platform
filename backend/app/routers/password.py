from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..schemas import ForgotPasswordRequest, ResetPasswordRequest
from ..repositories import UserRepository
from .utils import send_password_reset_email

router = APIRouter(
    tags=["Password"],
    responses={404: {"description": "Not found"}},
)


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = UserRepository.get_by_email(db, email=request_data.email)
    if not user:
        return {"message": "If an account with that email exists, a password reset link has been sent."}

    token = UserRepository.create_password_reset_token(db, user=user)
    user_email = str(user.email) if user.email else ""
    if user_email:
        send_password_reset_email(email=user_email, token=token)

    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password_route(
    request_data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = UserRepository.get_by_reset_token(db, token=request_data.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    token_expires_at = getattr(user, "reset_password_token_expires_at", None)
    if not isinstance(token_expires_at, datetime):
        raise HTTPException(status_code=500, detail="Invalid token expiration data.")

    if token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired.",
        )

    UserRepository.reset_password(db, user=user, new_password=request_data.new_password)
    return {"message": "Password has been reset successfully."}
