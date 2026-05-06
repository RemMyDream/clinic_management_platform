import enum

from sqlalchemy import Column, Integer, String, Date, Time, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    COMPLETED = "Completed"
    CANCELED = "Canceled"
    NO_SHOW = "No Show"


class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False)
    service = Column(String(255), default="General Consultation")
    appointment_day = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, nullable=False)
    reason = Column(Text)
    re_examination_date = Column(Date)
    re_examination_time = Column(Time)
    issue = Column(Text)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    medical_reports = relationship("MedicalReport", back_populates="appointment")
