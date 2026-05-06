from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..models import User
from ..schemas import MedicalReportSchema, MedicalReportCreate, MedicalReportUpdate
from ..services import MedicalReportService
from ..dependencies import get_current_active_user

router = APIRouter(
    tags=["Medical Reports"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=MedicalReportSchema, status_code=status.HTTP_201_CREATED)
def create_medical_report(
    medical_report: MedicalReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return MedicalReportService.create(db, medical_report, current_user)


@router.get("/", response_model=List[MedicalReportSchema])
def get_medical_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return MedicalReportService.get_reports(db, current_user)


@router.get("/search", response_model=List[MedicalReportSchema])
def search_medical_reports(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    in_day: Optional[date] = None,
    out_day: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return MedicalReportService.search(db, current_user, patient_id, doctor_id, in_day, out_day)


@router.get("/{record_id}", response_model=MedicalReportSchema)
def get_medical_report(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return MedicalReportService.get_report(db, record_id, current_user)


@router.put("/{record_id}", response_model=MedicalReportSchema)
def update_medical_report(
    record_id: int,
    medical_report: MedicalReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return MedicalReportService.update(db, record_id, medical_report, current_user)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medical_report(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    MedicalReportService.delete(db, record_id, current_user)
