from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, time, datetime


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    service: Optional[str] = "General Consultation"
    appointment_time: time
    appointment_day: date
    reason: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    appointment_time: Optional[time] = None
    appointment_day: Optional[date] = None
    service: Optional[str] = None
    reason: Optional[str] = None
    status: Optional[str] = None


class AppointmentCancelRequest(BaseModel):
    reason: Optional[str] = None


class AppointmentSchema(AppointmentBase):
    appointment_id: int
    patient_id: int
    doctor_id: int
    status: Optional[str] = "Scheduled"
    re_examination_date: Optional[date] = None
    re_examination_time: Optional[time] = None
    issue: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class AvailableDoctor(BaseModel):
    doctor_id: int
    doctor_name: str


class AvailableSlot(BaseModel):
    datetime: datetime
    available_doctors: List[AvailableDoctor]
