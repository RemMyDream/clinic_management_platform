from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import Hospital
from ..schemas import HospitalCreate, HospitalUpdate


class HospitalRepository:

    @staticmethod
    def get_by_id(db: Session, hospital_id: int) -> Optional[Hospital]:
        return db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Hospital]:
        return db.query(Hospital).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, hospital_in: HospitalCreate) -> Hospital:
        db_hospital = Hospital(**hospital_in.model_dump())
        db.add(db_hospital)
        db.commit()
        db.refresh(db_hospital)
        return db_hospital

    @staticmethod
    def update(db: Session, hospital_id: int, hospital_update: HospitalUpdate) -> Optional[Hospital]:
        db_hospital = HospitalRepository.get_by_id(db, hospital_id)
        if not db_hospital:
            return None
        update_data = hospital_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_hospital, key, value)
        db.commit()
        db.refresh(db_hospital)
        return db_hospital

    @staticmethod
    def delete(db: Session, hospital_id: int) -> Optional[Hospital]:
        db_hospital = HospitalRepository.get_by_id(db, hospital_id)
        if not db_hospital:
            return None
        db.delete(db_hospital)
        db.commit()
        return db_hospital
