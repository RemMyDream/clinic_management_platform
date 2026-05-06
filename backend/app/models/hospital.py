from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_name = Column(String(100))
    address = Column(String(255))
    governed_by = Column(String(160))

    doctors = relationship("Doctor", back_populates="hospital", cascade="all, delete-orphan")
