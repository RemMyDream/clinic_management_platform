from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..schemas import OTCMedicationSchema, OTCMedicationCreate, OTCMedicationUpdate
from ..services import OTCMedicationService
from ..dependencies import get_current_active_user, get_current_clinic_staff_or_admin

router = APIRouter(
    tags=["OTC Medications"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=OTCMedicationSchema, status_code=status.HTTP_201_CREATED)
def create_otc_medication(
    otc_in: OTCMedicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinic_staff_or_admin),
):
    return OTCMedicationService.create(db, otc_in, current_user)


@router.get("/", response_model=List[OTCMedicationSchema],
            dependencies=[Depends(get_current_clinic_staff_or_admin)])
def list_otc_medications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return OTCMedicationService.get_all(db, skip, limit)


@router.get("/by-patient/{patient_id}", response_model=List[OTCMedicationSchema])
def get_otc_by_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return OTCMedicationService.get_by_patient(db, patient_id)


@router.put("/{otc_id}", response_model=OTCMedicationSchema)
def update_otc_medication(
    otc_id: int,
    update: OTCMedicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinic_staff_or_admin),
):
    return OTCMedicationService.update(db, otc_id, update, current_user)


@router.delete("/{otc_id}", response_model=OTCMedicationSchema)
def delete_otc_medication(
    otc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinic_staff_or_admin),
):
    return OTCMedicationService.delete(db, otc_id, current_user)
