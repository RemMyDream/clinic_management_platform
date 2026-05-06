from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas import HospitalSchema, HospitalCreate, HospitalUpdate
from ..repositories import HospitalRepository
from ..dependencies import get_current_active_admin

router = APIRouter(
    tags=["Hospitals"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=HospitalSchema)
def create_hospital(hospital: HospitalCreate, db: Session = Depends(get_db)):
    return HospitalRepository.create(db, hospital)


@router.get("/", response_model=List[HospitalSchema])
def read_hospitals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return HospitalRepository.get_all(db, skip, limit)


@router.get("/{hospital_id}", response_model=HospitalSchema)
def read_hospital(hospital_id: int, db: Session = Depends(get_db)):
    hospital = HospitalRepository.get_by_id(db, hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


@router.put("/{hospital_id}", response_model=HospitalSchema, dependencies=[Depends(get_current_active_admin)])
def update_hospital(hospital_id: int, hospital_update: HospitalUpdate, db: Session = Depends(get_db)):
    updated = HospitalRepository.update(db, hospital_id, hospital_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return updated


@router.delete("/{hospital_id}", response_model=HospitalSchema, dependencies=[Depends(get_current_active_admin)])
def delete_hospital(hospital_id: int, db: Session = Depends(get_db)):
    deleted = HospitalRepository.delete(db, hospital_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return deleted
