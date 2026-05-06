from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    prescription_id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("medical_reports.record_id", ondelete="CASCADE"), nullable=False)
    medication_name = Column(String(255), nullable=False)
    dosage = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)

    medical_report = relationship("MedicalReport", back_populates="prescriptions")
