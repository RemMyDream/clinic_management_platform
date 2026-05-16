from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class VnProvince(Base):
    __tablename__ = "vn_provinces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)

    districts = relationship("VnDistrict", back_populates="province", cascade="all, delete-orphan")


class VnDistrict(Base):
    __tablename__ = "vn_districts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    province_id = Column(Integer, ForeignKey("vn_provinces.id", ondelete="CASCADE"), nullable=False)

    province = relationship("VnProvince", back_populates="districts")
