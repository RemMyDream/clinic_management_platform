from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    doctor_name = Column(String(100))
    major = Column(String(160))
    description = Column(Text)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="doctor_profile", foreign_keys=[doctor_id])
    hospital = relationship("Hospital", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    medical_reports = relationship("MedicalReport", back_populates="doctor", cascade="all, delete-orphan")
