from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..database import UserRole
from ..models import User, Doctor
from ..repositories import DoctorRepository
from ..schemas import DoctorCreate, DoctorUpdate


class DoctorService:

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Doctor]:
        return DoctorRepository.get_all(db, skip, limit)

    @staticmethod
    def get_by_specialty(db: Session, specialty: str, skip: int = 0, limit: int = 100) -> List[Doctor]:
        return DoctorRepository.get_by_specialty(db, specialty, skip, limit)

    @staticmethod
    def get_doctor(db: Session, doctor_id: int) -> Doctor:
        doctor = DoctorRepository.get_by_id(db, doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        return doctor

    @staticmethod
    def create_doctor(db: Session, doctor_in: DoctorCreate) -> Doctor:
        return DoctorRepository.create(db, doctor_in)

    @staticmethod
    def update_doctor(db: Session, doctor_id: int, doctor_update: DoctorUpdate, current_user: User) -> Doctor:
        doctor = DoctorService.get_doctor(db, doctor_id)
        if current_user.role.value != UserRole.ADMIN.value and current_user.user_id != doctor_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return DoctorRepository.update(db, doctor_id, doctor_update)

    @staticmethod
    def delete_doctor(db: Session, doctor_id: int) -> Doctor:
        doctor = DoctorService.get_doctor(db, doctor_id)
        return DoctorRepository.delete(db, doctor_id)
