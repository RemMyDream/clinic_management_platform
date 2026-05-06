from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class Staff(Base):
    __tablename__ = "staff"

    staff_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    position = Column(String(100), nullable=False, default="General")

    user = relationship("User", back_populates="staff_profile", foreign_keys=[staff_id])
    otc_medication_records = relationship("OTCMedicationRecord", back_populates="staff", cascade="all, delete-orphan")
