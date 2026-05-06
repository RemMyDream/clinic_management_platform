from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..schemas import StaffSchema, StaffCreate, StaffUpdate
from ..services import StaffService
from ..dependencies import get_current_active_user, get_current_active_admin

router = APIRouter(
    tags=["Staff"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[StaffSchema], dependencies=[Depends(get_current_active_admin)])
def list_staff(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return StaffService.get_all(db, skip, limit)


@router.post("/", response_model=StaffSchema, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(get_current_active_admin)])
def create_staff(staff_in: StaffCreate, db: Session = Depends(get_db)):
    return StaffService.create_staff(db, staff_in)


@router.get("/{staff_id}", response_model=StaffSchema, dependencies=[Depends(get_current_active_admin)])
def get_staff(staff_id: int, db: Session = Depends(get_db)):
    return StaffService.get_staff(db, staff_id)


@router.put("/{staff_id}", response_model=StaffSchema, dependencies=[Depends(get_current_active_admin)])
def update_staff(staff_id: int, staff_update: StaffUpdate, db: Session = Depends(get_db)):
    return StaffService.update_staff(db, staff_id, staff_update)


@router.delete("/{staff_id}", response_model=StaffSchema, dependencies=[Depends(get_current_active_admin)])
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    return StaffService.delete_staff(db, staff_id)
