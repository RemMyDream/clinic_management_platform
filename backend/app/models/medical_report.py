from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from ..database import Base


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    record_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"))
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"))
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id", ondelete="SET NULL"), nullable=True)
    in_day = Column(Date)
    out_day = Column(Date)
    in_diagnosis = Column(Text)
    out_diagnosis = Column(Text)
    reason_in = Column(Text)
    treatment_process = Column(Text)
    pulse_rate = Column(String(255))
    temperature = Column(String(255))
    blood_pressure = Column(String(255))
    respiratory_rate = Column(String(255))
    weight = Column(String(255))
    pathological_process = Column(Text)
    personal_history = Column(Text)
    family_history = Column(Text)
    diagnose_from_recommender = Column(Text)
    prescription = Column(Text)
    doctor_notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    patient = relationship("Patient", back_populates="medical_reports")
    doctor = relationship("Doctor", back_populates="medical_reports")
    appointment = relationship("Appointment", back_populates="medical_reports")
    prescriptions = relationship("Prescription", back_populates="medical_report", cascade="all, delete-orphan")
