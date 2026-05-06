from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from ..database import get_db
from ..models import User
from ..schemas import AppointmentSchema, AppointmentCreate, AppointmentUpdate, AvailableSlot
from ..services import AppointmentService
from ..dependencies import get_current_active_user

router = APIRouter(
    tags=["Appointments"],
    responses={404: {"description": "Not found"}},
)


@router.post("/book", response_model=AppointmentSchema, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return AppointmentService.create(db, appointment, current_user)


@router.get("/", response_model=List[AppointmentSchema])
def get_all_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return AppointmentService.get_all(db, skip, limit)


@router.get("/available", response_model=List[AvailableSlot])
def get_available_slots_in_a_given_day(
    day: date = Query(..., description="Date to check for available slots (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    return AppointmentService.get_available_slots(db, day)


@router.get("/available-range", response_model=List[AvailableSlot])
def get_available_slots_in_date_range(
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    return AppointmentService.get_available_slots_range(db, start_date, end_date)


@router.get("/me", response_model=List[AppointmentSchema])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return AppointmentService.get_my_appointments(db, current_user)


@router.get("/{appointment_id}", response_model=AppointmentSchema)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return AppointmentService.get_appointment(db, appointment_id, current_user)


@router.put("/{appointment_id}", response_model=AppointmentSchema)
def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return AppointmentService.update(db, appointment_id, appointment_update, current_user)


@router.post("/{appointment_id}/cancel", response_model=AppointmentSchema)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return AppointmentService.cancel(db, appointment_id, current_user)


@router.post("/{appointment_id}/complete", response_model=AppointmentSchema)
def complete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return AppointmentService.complete(db, appointment_id, current_user)


@router.delete("/{appointment_id}", response_model=AppointmentSchema)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return AppointmentService.delete(db, appointment_id, current_user)
