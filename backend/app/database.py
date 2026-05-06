from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from passlib.context import CryptContext
import enum
import secrets # Add secrets for token generation
from datetime import datetime, timedelta # Add datetime and timedelta
from .config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRole(str, enum.Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    CLINIC_STAFF = "CLINIC_STAFF"
    ADMIN = "ADMIN"

class Gender(str, enum.Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class Class(str, enum.Enum):
    # 'Assisted', 'Normal', 'Free', 'Other'
    ASSISTED = "Assisted"
    NORMAL = "Normal"
    FREE = "Free"
    OTHER = "Other"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_db_and_tables():
    from . import models  # noqa: F401 — import to register all models with Base.metadata
    Base.metadata.create_all(bind=engine, checkfirst=True)