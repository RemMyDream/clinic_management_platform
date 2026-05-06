from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from ..database import Base


class OTCMedicationRecord(Base):
    __tablename__ = "otc_medication_records"

    otc_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.staff_id", ondelete="CASCADE"), nullable=False)
    medication_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    patient = relationship("Patient", back_populates="otc_medication_records")
    staff = relationship("Staff", back_populates="otc_medication_records")
