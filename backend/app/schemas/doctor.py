from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional


class DoctorBase(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    doctor_name: str
    major: Optional[str] = None
    description: Optional[str] = None
    hospital_id: int


class DoctorCreate(DoctorBase):
    doctor_id: int


class DoctorUpdate(BaseModel):
    doctor_name: Optional[str] = None
    major: Optional[str] = None
    description: Optional[str] = None
    hospital_id: Optional[int] = None


class DoctorSchema(DoctorBase):
    doctor_id: int
    model_config = ConfigDict(from_attributes=True)
