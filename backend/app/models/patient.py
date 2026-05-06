from sqlalchemy import Column, Integer, String, Date, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base, Gender, Class


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    ethnic_group = Column(String(100))
    address = Column(String(255))
    phone_number = Column(String(20), unique=True)
    health_insurance_card_no = Column(String(20), unique=True)
    identification_id = Column(String(20), unique=True)
    job = Column(String(100))
    class_role = Column(Enum(Class), nullable=False)
    emr_summary = Column(Text)

    user = relationship("User", back_populates="patient_profile", foreign_keys=[patient_id])
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    medical_reports = relationship("MedicalReport", back_populates="patient", cascade="all, delete-orphan")
    otc_medication_records = relationship("OTCMedicationRecord", back_populates="patient", cascade="all, delete-orphan")
