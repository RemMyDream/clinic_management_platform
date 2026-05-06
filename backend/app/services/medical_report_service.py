from datetime import date
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..database import UserRole
from ..models import User, MedicalReport
from ..repositories import MedicalReportRepository
from ..schemas import MedicalReportCreate, MedicalReportUpdate


class MedicalReportService:

    @staticmethod
    def create(db: Session, report: MedicalReportCreate, current_user: User) -> MedicalReport:
        if current_user.role.value != UserRole.DOCTOR.value:
            raise HTTPException(status_code=403, detail="Only doctors can create medical reports.")
        return MedicalReportRepository.create(db, report)

    @staticmethod
    def get_reports(db: Session, current_user: User) -> List[MedicalReport]:
        role = current_user.role.value
        if role == UserRole.DOCTOR.value:
            return MedicalReportRepository.get_by_doctor(db, current_user.user_id)
        elif role == UserRole.PATIENT.value:
            return MedicalReportRepository.get_for_patient(db, current_user.user_id)
        elif role in [UserRole.ADMIN.value, UserRole.CLINIC_STAFF.value]:
            return MedicalReportRepository.get_by_doctor(db, 0, limit=1000)
        raise HTTPException(status_code=403, detail="Not enough permissions")

    @staticmethod
    def get_report(db: Session, record_id: int, current_user: User) -> MedicalReport:
        report = MedicalReportRepository.get_by_id(db, record_id)
        if not report:
            raise HTTPException(status_code=404, detail="Medical report not found.")
        role = current_user.role.value
        if role not in [UserRole.DOCTOR.value, UserRole.PATIENT.value, UserRole.ADMIN.value, UserRole.CLINIC_STAFF.value]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return report

    @staticmethod
    def update(db: Session, record_id: int, report_update: MedicalReportUpdate, current_user: User) -> MedicalReport:
        report = MedicalReportRepository.get_by_id(db, record_id)
        if not report:
            raise HTTPException(status_code=404, detail="Medical report not found.")
        if current_user.role.value != UserRole.DOCTOR.value and current_user.user_id != report.doctor_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        updated = MedicalReportRepository.update(db, record_id, report_update)
        if not updated:
            raise HTTPException(status_code=404, detail="Medical report not found.")
        return updated

    @staticmethod
    def delete(db: Session, record_id: int, current_user: User) -> None:
        report = MedicalReportRepository.get_by_id(db, record_id)
        if not report:
            raise HTTPException(status_code=404, detail="Medical report not found.")
        if current_user.role.value != UserRole.DOCTOR.value and current_user.user_id != report.doctor_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        MedicalReportRepository.delete(db, record_id)

    @staticmethod
    def search(
        db: Session,
        current_user: User,
        patient_id: Optional[int] = None,
        doctor_id: Optional[int] = None,
        in_day: Optional[date] = None,
        out_day: Optional[date] = None,
    ) -> List[MedicalReport]:
        return MedicalReportRepository.search(db, patient_id, doctor_id, in_day, out_day)
