from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import Doctor
from ..schemas import DoctorCreate, DoctorUpdate


class DoctorRepository:

    @staticmethod
    def get_by_id(db: Session, doctor_id: int) -> Optional[Doctor]:
        return db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Doctor]:
        return db.query(Doctor).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_specialty(db: Session, specialty: str, skip: int = 0, limit: int = 100) -> List[Doctor]:
        return (
            db.query(Doctor)
            .filter(Doctor.major.ilike(f"%{specialty}%"))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def create(db: Session, doctor_in: DoctorCreate, creator_id: int = 0) -> Doctor:
        db_doctor = Doctor(
            doctor_id=doctor_in.doctor_id,
            doctor_name=doctor_in.doctor_name,
            major=doctor_in.major or "General Medicine",
            description=doctor_in.description,
            hospital_id=doctor_in.hospital_id,
        )
        db.add(db_doctor)
        db.commit()
        db.refresh(db_doctor)
        return db_doctor

    @staticmethod
    def update(db: Session, doctor_id: int, doctor_update: DoctorUpdate) -> Optional[Doctor]:
        db_doctor = DoctorRepository.get_by_id(db, doctor_id)
        if not db_doctor:
            return None
        update_data = doctor_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_doctor, key, value)
        db.commit()
        db.refresh(db_doctor)
        return db_doctor

    @staticmethod
    def delete(db: Session, doctor_id: int) -> Optional[Doctor]:
        db_doctor = DoctorRepository.get_by_id(db, doctor_id)
        if not db_doctor:
            return None
        db.delete(db_doctor)
        db.commit()
        return db_doctor
