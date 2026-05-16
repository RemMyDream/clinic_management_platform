from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from ..database import get_db
from ..models import VnProvince, VnDistrict

router = APIRouter(tags=["Provinces"])


class DistrictOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ProvinceOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ProvinceWithDistricts(ProvinceOut):
    districts: List[DistrictOut] = []


@router.get("/", response_model=List[ProvinceOut])
def list_provinces(db: Session = Depends(get_db)):
    return db.query(VnProvince).order_by(VnProvince.name).all()


@router.get("/{province_id}/districts", response_model=List[DistrictOut])
def list_districts(province_id: int, db: Session = Depends(get_db)):
    return (
        db.query(VnDistrict)
        .filter(VnDistrict.province_id == province_id)
        .order_by(VnDistrict.name)
        .all()
    )
