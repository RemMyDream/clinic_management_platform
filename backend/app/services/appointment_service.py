from datetime import date, timedelta
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..database import UserRole
from ..models import User, Appointment, AppointmentStatus
from ..repositories import AppointmentRepository
from ..schemas import (
    AppointmentCreate, AppointmentUpdate, AppointmentSchema, AvailableSlot,
)


class AppointmentService:

    @staticmethod
    def create(db: Session, appointment: AppointmentCreate, current_user: User) -> Appointment:
        if current_user.role.value in [UserRole.CLINIC_STAFF.value, UserRole.ADMIN.value]:
            return AppointmentRepository.create(db, appointment, appointment.patient_id, AppointmentStatus.CONFIRMED)
        return AppointmentRepository.create(db, appointment, current_user.user_id, AppointmentStatus.PENDING)

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Appointment]:
        return AppointmentRepository.get_all(db, skip, limit)

    @staticmethod
    def get_my_appointments(db: Session, current_user: User) -> List[Appointment]:
        if current_user.role.value == UserRole.PATIENT.value:
            return AppointmentRepository.get_for_patient(db, current_user.user_id)
        elif current_user.role.value == UserRole.DOCTOR.value:
            return AppointmentRepository.get_for_doctor(db, current_user.user_id)
        return AppointmentRepository.get_all(db)

    @staticmethod
    def get_appointment(db: Session, appointment_id: int, current_user: User) -> Appointment:
        appt = AppointmentRepository.get_by_id(db, appointment_id)
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")

        is_admin = current_user.role.value == UserRole.ADMIN.value
        is_owner = current_user.user_id in (appt.patient_id, appt.doctor_id)
        is_staff = current_user.role.value == UserRole.CLINIC_STAFF.value
        if not (is_admin or is_owner or is_staff):
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return appt

    @staticmethod
    def update(db: Session, appointment_id: int, update: AppointmentUpdate, current_user: User) -> Appointment:
        appt = AppointmentService.get_appointment(db, appointment_id, current_user)
        updated = AppointmentRepository.update(db, appointment_id, update)
        if not updated:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return updated

    @staticmethod
    def cancel(db: Session, appointment_id: int, current_user: User) -> Appointment:
        appt = AppointmentService.get_appointment(db, appointment_id, current_user)
        canceled = AppointmentRepository.cancel(db, appointment_id)
        if not canceled:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return canceled

    @staticmethod
    def complete(db: Session, appointment_id: int, current_user: User) -> Appointment:
        appt = AppointmentService.get_appointment(db, appointment_id, current_user)
        if current_user.role.value not in [UserRole.DOCTOR.value, UserRole.CLINIC_STAFF.value, UserRole.ADMIN.value]:
            raise HTTPException(status_code=403, detail="Only doctors/staff can complete appointments")
        completed = AppointmentRepository.complete(db, appointment_id)
        if not completed:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return completed

    @staticmethod
    def confirm(db: Session, appointment_id: int, current_user: User) -> Appointment:
        AppointmentService.get_appointment(db, appointment_id, current_user)
        if current_user.role.value not in [UserRole.CLINIC_STAFF.value, UserRole.ADMIN.value]:
            raise HTTPException(status_code=403, detail="Only staff/admin can confirm appointments")
        confirmed = AppointmentRepository.confirm(db, appointment_id)
        if not confirmed:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return confirmed

    @staticmethod
    def accept(db: Session, appointment_id: int, current_user: User) -> Appointment:
        AppointmentService.get_appointment(db, appointment_id, current_user)
        if current_user.role.value not in [UserRole.DOCTOR.value, UserRole.CLINIC_STAFF.value, UserRole.ADMIN.value]:
            raise HTTPException(status_code=403, detail="Only doctors/staff/admin can accept appointments")
        accepted = AppointmentRepository.accept(db, appointment_id)
        if not accepted:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return accepted

    @staticmethod
    def delete(db: Session, appointment_id: int, current_user: User) -> Appointment:
        appt = AppointmentService.get_appointment(db, appointment_id, current_user)
        deleted = AppointmentRepository.delete(db, appointment_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return deleted

    @staticmethod
    def get_available_slots(db: Session, day: date) -> List[AvailableSlot]:
        return AppointmentRepository.get_available_slots_in_a_day(db, day)

    @staticmethod
    def get_available_slots_range(db: Session, start_date: date, end_date: date) -> List[AvailableSlot]:
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date")
        slots = []
        current = start_date
        while current <= end_date:
            slots.extend(AppointmentRepository.get_available_slots_in_a_day(db, current))
            current += timedelta(days=1)
        return slots
