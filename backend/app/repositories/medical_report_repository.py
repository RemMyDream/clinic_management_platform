from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import MedicalReport
from ..schemas import MedicalReportCreate, MedicalReportUpdate


class MedicalReportRepository:

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[MedicalReport]:
        return (
            db.query(MedicalReport)
            .order_by(MedicalReport.in_day.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, record_id: int) -> Optional[MedicalReport]:
        return db.query(MedicalReport).filter(MedicalReport.record_id == record_id).first()

    @staticmethod
    def get_by_doctor(db: Session, doctor_id: int, skip: int = 0, limit: int = 100) -> List[MedicalReport]:
        return (
            db.query(MedicalReport)
            .filter(MedicalReport.doctor_id == doctor_id)
            .order_by(MedicalReport.in_day.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_for_patient(db: Session, patient_id: int, skip: int = 0, limit: int = 100) -> List[MedicalReport]:
        return (
            db.query(MedicalReport)
            .filter(MedicalReport.patient_id == patient_id)
            .order_by(MedicalReport.in_day.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def create(db: Session, report: MedicalReportCreate) -> MedicalReport:
        db_report = MedicalReport(**report.model_dump())
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report

    @staticmethod
    def update(db: Session, record_id: int, report_update: MedicalReportUpdate) -> Optional[MedicalReport]:
        db_report = MedicalReportRepository.get_by_id(db, record_id)
        if not db_report:
            return None
        update_data = report_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_report, field, value)
        db.commit()
        db.refresh(db_report)
        return db_report

    @staticmethod
    def delete(db: Session, record_id: int) -> Optional[MedicalReport]:
        db_report = MedicalReportRepository.get_by_id(db, record_id)
        if not db_report:
            return None
        db.delete(db_report)
        db.commit()
        return db_report

    @staticmethod
    def search(
        db: Session,
        patient_id: Optional[int] = None,
        doctor_id: Optional[int] = None,
        in_day: Optional[date] = None,
        out_day: Optional[date] = None,
    ) -> List[MedicalReport]:
        query = db.query(MedicalReport)
        if patient_id:
            query = query.filter(MedicalReport.patient_id == patient_id)
        if doctor_id:
            query = query.filter(MedicalReport.doctor_id == doctor_id)
        if in_day:
            query = query.filter(MedicalReport.in_day == in_day)
        if out_day:
            query = query.filter(MedicalReport.out_day == out_day)
        return query.all()
