from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db, UserRole
from ..schemas import Token, UserSchema, UserCreate
from ..services import AuthService

router = APIRouter()


@router.post("/token", response_model=Token, tags=["authentication"])
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    return AuthService.login(db, email=form_data.username, password=form_data.password)


@router.post("/register", response_model=UserSchema, tags=["authentication"])
async def register_user(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    if not body:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Do not receive user data")

    user_data = UserCreate(
        username=body["username"],
        email=body["email"],
        full_name=body["full_name"],
        password=body["password"],
        role=UserRole.PATIENT,
    )
    return AuthService.register(db, user_data)
