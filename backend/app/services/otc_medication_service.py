from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..database import UserRole
from ..models import User, OTCMedicationRecord
from ..repositories import OTCMedicationRepository, PatientRepository
from ..schemas import OTCMedicationCreate, OTCMedicationUpdate


class OTCMedicationService:

    @staticmethod
    def create(db: Session, otc_in: OTCMedicationCreate, current_user: User) -> OTCMedicationRecord:
        if current_user.role.value not in [UserRole.CLINIC_STAFF.value, UserRole.ADMIN.value]:
            raise HTTPException(status_code=403, detail="Only staff can record OTC medications.")
        patient = PatientRepository.get_by_id(db, otc_in.patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found.")
        return OTCMedicationRepository.create(db, otc_in)

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[OTCMedicationRecord]:
        return OTCMedicationRepository.get_all(db, skip, limit)

    @staticmethod
    def get_by_patient(db: Session, patient_id: int) -> List[OTCMedicationRecord]:
        return OTCMedicationRepository.get_by_patient(db, patient_id)

    @staticmethod
    def update(db: Session, otc_id: int, update: OTCMedicationUpdate, current_user: User) -> OTCMedicationRecord:
        if current_user.role.value not in [UserRole.CLINIC_STAFF.value, UserRole.ADMIN.value]:
            raise HTTPException(status_code=403, detail="Only staff can update OTC records.")
        record = OTCMedicationRepository.get_by_id(db, otc_id)
        if not record:
            raise HTTPException(status_code=404, detail="OTC medication record not found.")
        updated = OTCMedicationRepository.update(db, otc_id, update)
        if not updated:
            raise HTTPException(status_code=404, detail="OTC medication record not found.")
        return updated

    @staticmethod
    def delete(db: Session, otc_id: int, current_user: User) -> OTCMedicationRecord:
        if current_user.role.value not in [UserRole.CLINIC_STAFF.value, UserRole.ADMIN.value]:
            raise HTTPException(status_code=403, detail="Only staff can delete OTC records.")
        record = OTCMedicationRepository.get_by_id(db, otc_id)
        if not record:
            raise HTTPException(status_code=404, detail="OTC medication record not found.")
        deleted = OTCMedicationRepository.delete(db, otc_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="OTC medication record not found.")
        return deleted
