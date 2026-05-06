from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime


class MedicalReportBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    in_day: Optional[date] = None
    out_day: Optional[date] = None
    in_diagnosis: Optional[str] = None
    out_diagnosis: Optional[str] = None
    reason_in: Optional[str] = None
    treatment_process: Optional[str] = None
    pulse_rate: Optional[str] = None
    temperature: Optional[str] = None
    blood_pressure: Optional[str] = None
    respiratory_rate: Optional[str] = None
    weight: Optional[str] = None
    pathological_process: Optional[str] = None
    personal_history: Optional[str] = None
    family_history: Optional[str] = None
    diagnose_from_recommender: Optional[str] = None
    prescription: Optional[str] = None
    doctor_notes: Optional[str] = None


class MedicalReportCreate(MedicalReportBase):
    pass


class MedicalReportUpdate(BaseModel):
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    appointment_id: Optional[int] = None
    in_day: Optional[date] = None
    out_day: Optional[date] = None
    in_diagnosis: Optional[str] = None
    out_diagnosis: Optional[str] = None
    reason_in: Optional[str] = None
    treatment_process: Optional[str] = None
    pulse_rate: Optional[str] = None
    temperature: Optional[str] = None
    blood_pressure: Optional[str] = None
    respiratory_rate: Optional[str] = None
    weight: Optional[str] = None
    pathological_process: Optional[str] = None
    personal_history: Optional[str] = None
    family_history: Optional[str] = None
    diagnose_from_recommender: Optional[str] = None
    prescription: Optional[str] = None
    doctor_notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class MedicalReportSchema(MedicalReportBase):
    record_id: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
