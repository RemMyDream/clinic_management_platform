from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..schemas import (
    PatientSchema, PatientCreate, PatientUpdate, PatientEMRUpdate,
    PatientSearchQuery, PatientSearchResponse,
)
from ..services import PatientService
from ..dependencies import (
    get_current_active_user,
    get_current_active_admin,
    get_current_clinic_staff_or_admin,
    get_current_patient_or_doctor_or_admin,
)

router = APIRouter(tags=["Patients"])


@router.post("/", response_model=PatientSchema, status_code=status.HTTP_201_CREATED)
def create_new_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinic_staff_or_admin),
):
    return PatientService.create_patient(db, patient_in, current_user)


@router.get("/", response_model=List[PatientSchema])
def list_all_patients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return PatientService.get_all_patients(db, current_user, skip, limit)


@router.get("/{patient_id}", response_model=PatientSchema)
def get_patient_details(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient_or_doctor_or_admin),
):
    return PatientService.get_patient(db, patient_id, current_user)


@router.put("/{patient_id}", response_model=PatientSchema)
def update_patient_details(
    patient_id: int,
    patient_update_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return PatientService.update_patient(db, patient_id, patient_update_data, current_user)


@router.delete("/{patient_id}", response_model=PatientSchema)
def remove_patient_record(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    return PatientService.delete_patient(db, patient_id)


@router.put("/{patient_id}/emr", response_model=PatientSchema)
def update_patient_emr_summary(
    patient_id: int,
    emr_update: PatientEMRUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return PatientService.update_emr(db, patient_id, emr_update, current_user)


@router.post("/search", response_model=PatientSearchResponse)
def search_patients(
    search_params: PatientSearchQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return PatientService.search_patients(db, search_params, current_user)
