from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import Prescription
from ..schemas import PrescriptionCreate, PrescriptionUpdate


class PrescriptionRepository:

    @staticmethod
    def get_by_id(db: Session, prescription_id: int) -> Optional[Prescription]:
        return db.query(Prescription).filter(Prescription.prescription_id == prescription_id).first()

    @staticmethod
    def get_by_report(db: Session, report_id: int) -> List[Prescription]:
        return db.query(Prescription).filter(Prescription.report_id == report_id).all()

    @staticmethod
    def get_by_patient(db: Session, patient_id: int) -> List[Prescription]:
        from ..models import MedicalReport
        return (
            db.query(Prescription)
            .join(MedicalReport, Prescription.report_id == MedicalReport.record_id)
            .filter(MedicalReport.patient_id == patient_id)
            .all()
        )

    @staticmethod
    def create(db: Session, prescription_in: PrescriptionCreate) -> Prescription:
        db_prescription = Prescription(**prescription_in.model_dump())
        db.add(db_prescription)
        db.commit()
        db.refresh(db_prescription)
        return db_prescription

    @staticmethod
    def update(db: Session, prescription_id: int, prescription_update: PrescriptionUpdate) -> Optional[Prescription]:
        db_prescription = PrescriptionRepository.get_by_id(db, prescription_id)
        if not db_prescription:
            return None
        update_data = prescription_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_prescription, key, value)
        db.commit()
        db.refresh(db_prescription)
        return db_prescription

    @staticmethod
    def delete(db: Session, prescription_id: int) -> Optional[Prescription]:
        db_prescription = PrescriptionRepository.get_by_id(db, prescription_id)
        if not db_prescription:
            return None
        db.delete(db_prescription)
        db.commit()
        return db_prescription
