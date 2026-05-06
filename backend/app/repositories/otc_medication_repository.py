from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import OTCMedicationRecord
from ..schemas import OTCMedicationCreate, OTCMedicationUpdate


class OTCMedicationRepository:

    @staticmethod
    def get_by_id(db: Session, otc_id: int) -> Optional[OTCMedicationRecord]:
        return db.query(OTCMedicationRecord).filter(OTCMedicationRecord.otc_id == otc_id).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[OTCMedicationRecord]:
        return db.query(OTCMedicationRecord).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_patient(db: Session, patient_id: int) -> List[OTCMedicationRecord]:
        return db.query(OTCMedicationRecord).filter(OTCMedicationRecord.patient_id == patient_id).all()

    @staticmethod
    def create(db: Session, otc_in: OTCMedicationCreate) -> OTCMedicationRecord:
        db_otc = OTCMedicationRecord(**otc_in.model_dump())
        db.add(db_otc)
        db.commit()
        db.refresh(db_otc)
        return db_otc

    @staticmethod
    def update(db: Session, otc_id: int, otc_update: OTCMedicationUpdate) -> Optional[OTCMedicationRecord]:
        db_otc = OTCMedicationRepository.get_by_id(db, otc_id)
        if not db_otc:
            return None
        update_data = otc_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_otc, key, value)
        db.commit()
        db.refresh(db_otc)
        return db_otc

    @staticmethod
    def delete(db: Session, otc_id: int) -> Optional[OTCMedicationRecord]:
        db_otc = OTCMedicationRepository.get_by_id(db, otc_id)
        if not db_otc:
            return None
        db.delete(db_otc)
        db.commit()
        return db_otc
