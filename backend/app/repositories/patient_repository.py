from datetime import date
from typing import List, Optional, Tuple

from sqlalchemy import and_, or_, func, desc, asc
from sqlalchemy.orm import Session

from ..models import Patient, User
from ..schemas import PatientCreate, PatientUpdate, PatientSearchQuery
from ..database import UserRole, Gender, Class


class PatientRepository:

    @staticmethod
    def get_by_id(db: Session, patient_id: int) -> Optional[Patient]:
        return db.query(Patient).filter(Patient.patient_id == patient_id).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Patient]:
        return db.query(Patient).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Optional[Patient]:
        return db.query(Patient).filter(Patient.patient_id == user_id).first()

    @staticmethod
    def create(db: Session, patient_in: PatientCreate, creator_id: int) -> Patient:
        patient_data = {
            "patient_id": patient_in.patient_id,
            "full_name": patient_in.full_name,
            "date_of_birth": patient_in.date_of_birth or date(2000, 1, 1),
            "gender": patient_in.gender or Gender.MALE,
            "class_role": Class.OTHER,
        }
        db_patient = Patient(**patient_data)
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        return db_patient

    @staticmethod
    def update(db: Session, patient_id: int, patient_update: PatientUpdate) -> Optional[Patient]:
        db_patient = PatientRepository.get_by_id(db, patient_id)
        if not db_patient:
            return None
        update_data = patient_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_patient, key, value)
        db.commit()
        db.refresh(db_patient)
        return db_patient

    @staticmethod
    def update_emr(db: Session, patient_id: int, emr_summary: str) -> Optional[Patient]:
        db_patient = PatientRepository.get_by_id(db, patient_id)
        if not db_patient:
            return None
        db_patient.emr_summary = emr_summary
        db.commit()
        db.refresh(db_patient)
        return db_patient

    @staticmethod
    def delete(db: Session, patient_id: int) -> Optional[Patient]:
        db_patient = PatientRepository.get_by_id(db, patient_id)
        if not db_patient:
            return None
        db.delete(db_patient)
        db.commit()
        return db_patient

    @staticmethod
    def search(
        db: Session,
        search_params: PatientSearchQuery,
        current_user_role: str,
        current_user_id: int,
    ) -> Tuple[List[Patient], int]:
        query = db.query(Patient).join(User, Patient.patient_id == User.user_id)

        if current_user_role == UserRole.PATIENT.value:
            query = query.filter(Patient.patient_id == current_user_id)

        conditions = []

        if search_params.query:
            search_term = f"%{search_params.query}%"
            conditions.append(
                or_(
                    Patient.full_name.ilike(search_term),
                    User.email.ilike(search_term),
                    Patient.phone_number.ilike(search_term),
                    Patient.identification_id.ilike(search_term),
                    Patient.health_insurance_card_no.ilike(search_term),
                )
            )

        if search_params.patient_id:
            conditions.append(Patient.patient_id == search_params.patient_id)
        if search_params.full_name:
            conditions.append(Patient.full_name.ilike(f"%{search_params.full_name}%"))
        if search_params.phone_number:
            conditions.append(Patient.phone_number.ilike(f"%{search_params.phone_number}%"))
        if search_params.email:
            conditions.append(User.email.ilike(f"%{search_params.email}%"))
        if search_params.identification_id:
            conditions.append(Patient.identification_id.ilike(f"%{search_params.identification_id}%"))
        if search_params.health_insurance_card_no:
            conditions.append(Patient.health_insurance_card_no.ilike(f"%{search_params.health_insurance_card_no}%"))
        if search_params.gender:
            conditions.append(Patient.gender == search_params.gender)

        if search_params.age_min or search_params.age_max:
            today = date.today()
            if search_params.age_min:
                max_birth_date = date(today.year - search_params.age_min, today.month, today.day)
                conditions.append(Patient.date_of_birth <= max_birth_date)
            if search_params.age_max:
                min_birth_date = date(today.year - search_params.age_max - 1, today.month, today.day)
                conditions.append(Patient.date_of_birth > min_birth_date)

        if conditions:
            query = query.filter(and_(*conditions))

        total_count = query.count()

        sort_by = search_params.sort_by or "full_name"
        sort_field = getattr(Patient, sort_by, Patient.full_name)
        if search_params.sort_order == "desc":
            query = query.order_by(desc(sort_field))
        else:
            query = query.order_by(asc(sort_field))

        patients = query.offset(search_params.skip).limit(search_params.limit).all()
        return patients, total_count
