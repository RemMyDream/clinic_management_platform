from math import ceil
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..database import UserRole
from ..models import User, Patient
from ..repositories import PatientRepository, UserRepository
from ..schemas import (
    PatientCreate, PatientUpdate, PatientEMRUpdate,
    PatientSearchQuery, PatientSearchResponse, PatientSearchResult,
)
from ..crud import get_patient_search_result


class PatientService:

    @staticmethod
    def create_patient(db: Session, patient_in: PatientCreate, current_user: User) -> Patient:
        user_for_patient = UserRepository.get_by_id(db, patient_in.patient_id)
        if not user_for_patient:
            raise HTTPException(status_code=404, detail=f"User with id {patient_in.patient_id} not found.")
        if user_for_patient.role.value != UserRole.PATIENT.value:
            raise HTTPException(status_code=400, detail=f"User with id {patient_in.patient_id} is not a Patient.")
        existing = PatientRepository.get_by_user_id(db, patient_in.patient_id)
        if existing:
            raise HTTPException(status_code=409, detail=f"Patient profile already exists for user id {patient_in.patient_id}")
        return PatientRepository.create(db, patient_in, current_user.user_id)

    @staticmethod
    def get_all_patients(db: Session, current_user: User, skip: int = 0, limit: int = 100) -> List[Patient]:
        if current_user.role.value in [UserRole.ADMIN.value, UserRole.CLINIC_STAFF.value, UserRole.DOCTOR.value]:
            return PatientRepository.get_all(db, skip, limit)
        raise HTTPException(status_code=403, detail="Not enough permissions to view all patients")

    @staticmethod
    def get_patient(db: Session, patient_id: int, current_user: User) -> Patient:
        patient = PatientRepository.get_by_id(db, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        role = current_user.role.value
        if role in [UserRole.ADMIN.value, UserRole.CLINIC_STAFF.value, UserRole.DOCTOR.value]:
            return patient
        if role == UserRole.PATIENT.value and patient.patient_id == current_user.user_id:
            return patient

        raise HTTPException(status_code=403, detail="Not enough permissions")

    @staticmethod
    def update_patient(db: Session, patient_id: int, patient_update: PatientUpdate, current_user: User) -> Patient:
        patient = PatientRepository.get_by_id(db, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        role = current_user.role.value
        if role not in [UserRole.ADMIN.value, UserRole.CLINIC_STAFF.value, UserRole.DOCTOR.value]:
            raise HTTPException(status_code=403, detail="Not enough permissions")

        if role == UserRole.CLINIC_STAFF.value:
            if patient_update.emr_summary is not None and patient_update.emr_summary != (patient.emr_summary or ""):
                raise HTTPException(status_code=403, detail="Clinic staff cannot update EMR summary via this endpoint.")

        return PatientRepository.update(db, patient_id, patient_update)

    @staticmethod
    def update_emr(db: Session, patient_id: int, emr_update: PatientEMRUpdate, current_user: User) -> Patient:
        patient = PatientRepository.get_by_id(db, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        role = current_user.role.value
        if role not in [UserRole.ADMIN.value, UserRole.DOCTOR.value]:
            raise HTTPException(status_code=403, detail="Not enough permissions to update EMR")

        if emr_update.emr_summary is None:
            return patient

        return PatientRepository.update_emr(db, patient_id, emr_update.emr_summary)

    @staticmethod
    def delete_patient(db: Session, patient_id: int) -> Patient:
        patient = PatientRepository.get_by_id(db, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return PatientRepository.delete(db, patient_id)

    @staticmethod
    def search_patients(db: Session, search_params: PatientSearchQuery, current_user: User) -> PatientSearchResponse:
        patients, total_count = PatientRepository.search(
            db, search_params, current_user.role.value, current_user.user_id,
        )
        patient_results = [get_patient_search_result(db, p) for p in patients]

        per_page = search_params.limit
        current_page = (search_params.skip // per_page) + 1
        total_pages = ceil(total_count / per_page) if per_page > 0 else 1

        return PatientSearchResponse(
            patients=patient_results,
            total_count=total_count,
            page=current_page,
            per_page=per_page,
            total_pages=total_pages,
        )
