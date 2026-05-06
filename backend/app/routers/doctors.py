from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import User
from ..schemas import DoctorSchema, DoctorCreate, DoctorUpdate
from ..services import DoctorService
from ..dependencies import get_current_active_user, get_current_active_admin

router = APIRouter(
    tags=["Doctors"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=DoctorSchema, dependencies=[Depends(get_current_active_admin)])
def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    return DoctorService.create_doctor(db, doctor)


@router.get("/", response_model=List[DoctorSchema])
def get_doctors(
    skip: int = 0,
    limit: int = 100,
    specialty: Optional[str] = Query(None, description="Filter by specialty/major"),
    db: Session = Depends(get_db),
):
    if specialty:
        return DoctorService.get_by_specialty(db, specialty, skip, limit)
    return DoctorService.get_all(db, skip, limit)


@router.get("/{doctor_id}", response_model=DoctorSchema)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return DoctorService.get_doctor(db, doctor_id)


@router.put("/{doctor_id}", response_model=DoctorSchema)
def update_doctor(
    doctor_id: int,
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return DoctorService.update_doctor(db, doctor_id, doctor_update, current_user)


@router.delete("/{doctor_id}", response_model=DoctorSchema, dependencies=[Depends(get_current_active_admin)])
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return DoctorService.delete_doctor(db, doctor_id)
