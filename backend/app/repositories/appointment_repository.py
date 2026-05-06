from datetime import datetime, timedelta, time, date
from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import Appointment, AppointmentStatus, Doctor
from ..schemas import AppointmentCreate, AppointmentUpdate, AvailableDoctor, AvailableSlot


class AppointmentRepository:

    @staticmethod
    def get_by_id(db: Session, appointment_id: int) -> Optional[Appointment]:
        return db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Appointment]:
        return db.query(Appointment).offset(skip).limit(limit).all()

    @staticmethod
    def get_for_patient(db: Session, patient_id: int, skip: int = 0, limit: int = 100) -> List[Appointment]:
        return (
            db.query(Appointment)
            .filter(Appointment.patient_id == patient_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_for_doctor(db: Session, doctor_id: int, skip: int = 0, limit: int = 100) -> List[Appointment]:
        return (
            db.query(Appointment)
            .filter(Appointment.doctor_id == doctor_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def create(db: Session, appointment: AppointmentCreate, creator_id: int) -> Appointment:
        appointment_data = appointment.model_dump()
        appointment_data["patient_id"] = creator_id
        appointment_data["status"] = AppointmentStatus.SCHEDULED
        db_appointment = Appointment(**appointment_data)
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)
        return db_appointment

    @staticmethod
    def update(db: Session, appointment_id: int, appointment_update: AppointmentUpdate) -> Optional[Appointment]:
        db_appointment = AppointmentRepository.get_by_id(db, appointment_id)
        if not db_appointment:
            return None
        update_data = appointment_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_appointment, key, value)
        db.commit()
        db.refresh(db_appointment)
        return db_appointment

    @staticmethod
    def cancel(db: Session, appointment_id: int) -> Optional[Appointment]:
        db_appointment = AppointmentRepository.get_by_id(db, appointment_id)
        if not db_appointment:
            return None
        db_appointment.status = AppointmentStatus.CANCELED
        db.commit()
        db.refresh(db_appointment)
        return db_appointment

    @staticmethod
    def complete(db: Session, appointment_id: int) -> Optional[Appointment]:
        db_appointment = AppointmentRepository.get_by_id(db, appointment_id)
        if not db_appointment:
            return None
        db_appointment.status = AppointmentStatus.COMPLETED
        db.commit()
        db.refresh(db_appointment)
        return db_appointment

    @staticmethod
    def delete(db: Session, appointment_id: int) -> Optional[Appointment]:
        db_appointment = AppointmentRepository.get_by_id(db, appointment_id)
        if not db_appointment:
            return None
        db.delete(db_appointment)
        db.commit()
        return db_appointment

    @staticmethod
    def get_available_slots_in_a_day(db: Session, day: date) -> List[AvailableSlot]:
        start_of_day = datetime.combine(day, time(8, 30))
        end_of_day = datetime.combine(day, time(17, 30))
        lunch_start = time(11, 30)
        lunch_end = time(13, 30)
        slot_duration = timedelta(hours=1)

        doctors = db.query(Doctor).all()
        appointments = db.query(Appointment).filter(Appointment.appointment_day == day).all()
        taken_slots = set((appt.doctor_id, appt.appointment_time) for appt in appointments)

        available_slots: List[AvailableSlot] = []
        current_time = start_of_day

        while current_time + slot_duration <= end_of_day:
            if lunch_start <= current_time.time() < lunch_end:
                current_time += slot_duration
                continue

            free_doctors = [
                AvailableDoctor(
                    doctor_id=doctor.doctor_id,
                    doctor_name=doctor.doctor_name or "",
                )
                for doctor in doctors
                if (doctor.doctor_id, current_time.time()) not in taken_slots
            ]

            if free_doctors:
                available_slots.append(
                    AvailableSlot(datetime=current_time, available_doctors=free_doctors)
                )

            current_time += slot_duration

        return available_slots
