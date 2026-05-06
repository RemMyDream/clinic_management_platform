from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..schemas import PrescriptionSchema, PrescriptionCreate, PrescriptionUpdate
from ..services import PrescriptionService
from ..dependencies import get_current_active_user

router = APIRouter(
    tags=["Prescriptions"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=PrescriptionSchema, status_code=status.HTTP_201_CREATED)
def create_prescription(
    prescription_in: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return PrescriptionService.create(db, prescription_in, current_user)


@router.get("/by-report/{report_id}", response_model=List[PrescriptionSchema])
def get_prescriptions_by_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return PrescriptionService.get_by_report(db, report_id)


@router.get("/by-patient/{patient_id}", response_model=List[PrescriptionSchema])
def get_prescriptions_by_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return PrescriptionService.get_by_patient(db, patient_id)


@router.get("/{prescription_id}", response_model=PrescriptionSchema)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return PrescriptionService.get_prescription(db, prescription_id)


@router.put("/{prescription_id}", response_model=PrescriptionSchema)
def update_prescription(
    prescription_id: int,
    update: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return PrescriptionService.update(db, prescription_id, update, current_user)


@router.delete("/{prescription_id}", response_model=PrescriptionSchema)
def delete_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return PrescriptionService.delete(db, prescription_id, current_user)
