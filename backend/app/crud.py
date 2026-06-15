"""
Backward-compatible CRUD facade.

Delegates all operations to the new repository layer so existing routers
continue to work without changes during the incremental migration.
"""

from datetime import date
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from .models import User, Patient, Doctor, Hospital, Appointment, MedicalReport, ChatMessage
from . import schemas
from .repositories import (
    UserRepository,
    PatientRepository,
    DoctorRepository,
    HospitalRepository,
    AppointmentRepository,
    MedicalReportRepository,
    ChatRepository,
    StaffRepository,
)
from .database import pwd_context, UserRole, Class, Gender

# ── User ─────────────────────────────────────────────────────────────

def get_user(db: Session, user_id: int):
    return UserRepository.get_by_id(db, user_id)

def get_user_by_email(db: Session, email: str):
    return UserRepository.get_by_email(db, email)

def get_user_by_username(db: Session, username: str):
    return UserRepository.get_by_username(db, username)

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return UserRepository.get_all(db, skip, limit)

def create_user(db: Session, user: schemas.UserCreate):
    try:
        db_user = UserRepository.create(db, user)

        user_id_value = db_user.user_id
        full_name_value = db_user.full_name

        if user.role.value == "PATIENT":
            patient_in = schemas.PatientCreate(
                patient_id=user_id_value,
                full_name=full_name_value,
            )
            create_patient(db=db, patient_in=patient_in, creator_id=user_id_value)

        elif user.role.value == "DOCTOR":
            doctor_in = schemas.DoctorCreate(
                doctor_id=user_id_value,
                doctor_name=full_name_value,
                hospital_id=1,
            )
            create_doctor(db=db, doctor_in=doctor_in, creator_id=user_id_value)

        elif user.role.value == "CLINIC_STAFF":
            from .repositories import StaffRepository
            staff_in = schemas.StaffCreate(staff_id=user_id_value)
            StaffRepository.create(db, staff_in)

        db.commit()
        db.refresh(db_user)
        return db_user

    except Exception:
        db.rollback()
        raise

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    return UserRepository.update(db, user_id, user_update)

def delete_user(db: Session, user_id: int):
    return UserRepository.delete(db, user_id)

def create_password_reset_token(db: Session, user):
    return UserRepository.create_password_reset_token(db, user)

def get_user_by_reset_token(db: Session, token: str):
    return UserRepository.get_by_reset_token(db, token)

def reset_password(db: Session, user, new_password: str):
    return UserRepository.reset_password(db, user, new_password)

# ── Patient ──────────────────────────────────────────────────────────

def get_patient(db: Session, patient_id: int):
    return PatientRepository.get_by_id(db, patient_id)

def get_patients(db: Session, skip: int = 0, limit: int = 100):
    return PatientRepository.get_all(db, skip, limit)

def get_patient_by_user_id(db: Session, user_id: int):
    return PatientRepository.get_by_user_id(db, user_id)

def create_patient(db: Session, patient_in: schemas.PatientCreate, creator_id: int):
    return PatientRepository.create(db, patient_in, creator_id)

def update_patient(db: Session, patient_id: int, patient_update: schemas.PatientUpdate):
    return PatientRepository.update(db, patient_id, patient_update)

def update_patient_emr(db: Session, patient_id: int, emr_summary: str):
    return PatientRepository.update_emr(db, patient_id, emr_summary)

def delete_patient(db: Session, patient_id: int):
    return PatientRepository.delete(db, patient_id)

def search_patients(db, search_params, current_user_role, current_user_id):
    return PatientRepository.search(db, search_params, current_user_role, current_user_id)

def get_patient_search_result(db: Session, patient: Patient):
    from datetime import date as date_type

    age = None
    if patient.date_of_birth is not None:
        today = date_type.today()
        birth_date = patient.date_of_birth
        age = today.year - birth_date.year
        if today.month < birth_date.month or (
            today.month == birth_date.month and today.day < birth_date.day
        ):
            age -= 1

    user = get_user(db, patient.patient_id)
    email = user.email if user else None

    gender_value = None
    if patient.gender is not None:
        gender_value = patient.gender.value if hasattr(patient.gender, "value") else str(patient.gender)

    return schemas.PatientSearchResult(
        patient_id=patient.patient_id,
        full_name=patient.full_name,
        date_of_birth=patient.date_of_birth,
        gender=gender_value,
        phone_number=patient.phone_number,
        email=email,
        identification_id=patient.identification_id,
        health_insurance_card_no=patient.health_insurance_card_no,
        age=age,
    )

# ── Doctor ───────────────────────────────────────────────────────────

def get_doctor(db: Session, doctor_id: int):
    return DoctorRepository.get_by_id(db, doctor_id)

def get_doctors(db: Session, skip: int = 0, limit: int = 100):
    return DoctorRepository.get_all(db, skip, limit)

def create_doctor(db: Session, doctor_in: schemas.DoctorCreate, creator_id: int = 0):
    return DoctorRepository.create(db, doctor_in, creator_id)

def update_doctor(db: Session, doctor_id: int, doctor_update: schemas.DoctorUpdate):
    return DoctorRepository.update(db, doctor_id, doctor_update)

def delete_doctor(db: Session, doctor_id: int):
    return DoctorRepository.delete(db, doctor_id)

# ── Hospital ─────────────────────────────────────────────────────────

def get_hospital(db: Session, hospital_id: int):
    return HospitalRepository.get_by_id(db, hospital_id)

def get_hospitals(db: Session, skip: int = 0, limit: int = 100):
    return HospitalRepository.get_all(db, skip, limit)

def create_hospital(db: Session, hospital_in: schemas.HospitalCreate):
    return HospitalRepository.create(db, hospital_in)

def update_hospital(db: Session, hospital_id: int, hospital_update: schemas.HospitalUpdate):
    return HospitalRepository.update(db, hospital_id, hospital_update)

def delete_hospital(db: Session, hospital_id: int):
    return HospitalRepository.delete(db, hospital_id)

# ── Appointment ──────────────────────────────────────────────────────

def create_appointment(db: Session, appointment: schemas.AppointmentCreate, creator_id: int):
    return AppointmentRepository.create(db, appointment, creator_id)

def get_appointment(db: Session, appointment_id: int):
    return AppointmentRepository.get_by_id(db, appointment_id)

def get_all_appointments(db: Session, skip: int = 0, limit: int = 100):
    return AppointmentRepository.get_all(db, skip, limit)

def get_appointments_for_patient(db: Session, patient_id: int, skip: int = 0, limit: int = 100):
    return AppointmentRepository.get_for_patient(db, patient_id, skip, limit)

def get_appointments_for_doctor(db: Session, doctor_id: int, skip: int = 0, limit: int = 100):
    return AppointmentRepository.get_for_doctor(db, doctor_id, skip, limit)

def get_available_slots_in_a_day(db: Session, day: date):
    return AppointmentRepository.get_available_slots_in_a_day(db, day)

def update_appointment(db: Session, appointment_id: int, appointment_update: schemas.AppointmentUpdate):
    return AppointmentRepository.update(db, appointment_id, appointment_update)

def delete_appointment(db: Session, appointment_id: int):
    return AppointmentRepository.delete(db, appointment_id)

# ── Medical Report ───────────────────────────────────────────────────

def create_medical_report(db: Session, report: schemas.MedicalReportCreate):
    return MedicalReportRepository.create(db, report)

def get_medical_report(db: Session, record_id: int):
    return MedicalReportRepository.get_by_id(db, record_id)

def get_medical_reports_by_doctor(db: Session, doctor_id: int, skip: int = 0, limit: int = 100):
    return MedicalReportRepository.get_by_doctor(db, doctor_id, skip, limit)

def get_medical_reports_for_patient(db: Session, patient_id: int, skip: int = 0, limit: int = 100):
    return MedicalReportRepository.get_for_patient(db, patient_id, skip, limit)

def update_medical_report(db: Session, record_id: int, report_update: schemas.MedicalReportUpdate):
    return MedicalReportRepository.update(db, record_id, report_update)

def delete_medical_report(db: Session, record_id: int):
    return MedicalReportRepository.delete(db, record_id)

def search_medical_reports(db: Session, patient_id=None, doctor_id=None, in_day=None, out_day=None):
    return MedicalReportRepository.search(db, patient_id, doctor_id, in_day, out_day)

# ── Chat ─────────────────────────────────────────────────────────────

def create_chat_message(db: Session, message: schemas.ChatMessageCreate, user_id=None):
    return ChatRepository.create(db, message, user_id)

def get_chat_message(db: Session, message_id: int):
    return ChatRepository.get_by_id(db, message_id)

def get_chat_messages_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return ChatRepository.get_for_user(db, user_id, skip, limit)
