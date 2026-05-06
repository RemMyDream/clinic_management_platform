from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..database import UserRole
from ..models import User, Prescription
from ..repositories import PrescriptionRepository, MedicalReportRepository
from ..schemas import PrescriptionCreate, PrescriptionUpdate


class PrescriptionService:

    @staticmethod
    def create(db: Session, prescription_in: PrescriptionCreate, current_user: User) -> Prescription:
        if current_user.role.value != UserRole.DOCTOR.value:
            raise HTTPException(status_code=403, detail="Only doctors can create prescriptions.")
        report = MedicalReportRepository.get_by_id(db, prescription_in.report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Medical report not found.")
        return PrescriptionRepository.create(db, prescription_in)

    @staticmethod
    def get_by_report(db: Session, report_id: int) -> List[Prescription]:
        return PrescriptionRepository.get_by_report(db, report_id)

    @staticmethod
    def get_by_patient(db: Session, patient_id: int) -> List[Prescription]:
        return PrescriptionRepository.get_by_patient(db, patient_id)

    @staticmethod
    def get_prescription(db: Session, prescription_id: int) -> Prescription:
        p = PrescriptionRepository.get_by_id(db, prescription_id)
        if not p:
            raise HTTPException(status_code=404, detail="Prescription not found.")
        return p

    @staticmethod
    def update(db: Session, prescription_id: int, update: PrescriptionUpdate, current_user: User) -> Prescription:
        if current_user.role.value != UserRole.DOCTOR.value:
            raise HTTPException(status_code=403, detail="Only doctors can update prescriptions.")
        PrescriptionService.get_prescription(db, prescription_id)
        updated = PrescriptionRepository.update(db, prescription_id, update)
        if not updated:
            raise HTTPException(status_code=404, detail="Prescription not found.")
        return updated

    @staticmethod
    def delete(db: Session, prescription_id: int, current_user: User) -> Prescription:
        if current_user.role.value != UserRole.DOCTOR.value:
            raise HTTPException(status_code=403, detail="Only doctors can delete prescriptions.")
        PrescriptionService.get_prescription(db, prescription_id)
        deleted = PrescriptionRepository.delete(db, prescription_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Prescription not found.")
        return deleted
