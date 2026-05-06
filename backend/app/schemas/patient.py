from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import date


class PatientBase(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    ethnic_group: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    health_insurance_card_no: Optional[str] = None
    identification_id: Optional[str] = None
    job: Optional[str] = None
    class_role: Optional[str] = None
    emr_summary: Optional[str] = None


class PatientCreate(PatientBase):
    patient_id: int


class PatientUpdate(PatientBase):
    full_name: Optional[str] = None
    emr_summary: Optional[str] = None


class PatientSchema(PatientBase):
    patient_id: int
    model_config = ConfigDict(from_attributes=True)


class PatientEMRUpdate(BaseModel):
    emr_summary: Optional[str] = None


class PatientSearchQuery(BaseModel):
    query: Optional[str] = None
    patient_id: Optional[int] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    identification_id: Optional[str] = None
    health_insurance_card_no: Optional[str] = None
    gender: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    skip: int = 0
    limit: int = 100
    sort_by: Optional[str] = "full_name"
    sort_order: Optional[str] = "asc"


class PatientSearchResult(BaseModel):
    patient_id: int
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    identification_id: Optional[str] = None
    health_insurance_card_no: Optional[str] = None
    age: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class PatientSearchResponse(BaseModel):
    patients: List[PatientSearchResult]
    total_count: int
    page: int
    per_page: int
    total_pages: int
