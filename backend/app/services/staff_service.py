from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import Staff
from ..repositories import StaffRepository, UserRepository
from ..schemas import StaffCreate, StaffUpdate
from ..database import UserRole


class StaffService:

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Staff]:
        return StaffRepository.get_all(db, skip, limit)

    @staticmethod
    def get_staff(db: Session, staff_id: int) -> Staff:
        staff = StaffRepository.get_by_id(db, staff_id)
        if not staff:
            raise HTTPException(status_code=404, detail="Staff not found")
        return staff

    @staticmethod
    def create_staff(db: Session, staff_in: StaffCreate) -> Staff:
        user = UserRepository.get_by_id(db, staff_in.staff_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"User with id {staff_in.staff_id} not found.")
        if user.role.value != UserRole.CLINIC_STAFF.value:
            raise HTTPException(status_code=400, detail=f"User with id {staff_in.staff_id} is not CLINIC_STAFF.")
        existing = StaffRepository.get_by_id(db, staff_in.staff_id)
        if existing:
            raise HTTPException(status_code=409, detail="Staff profile already exists.")
        return StaffRepository.create(db, staff_in)

    @staticmethod
    def update_staff(db: Session, staff_id: int, staff_update: StaffUpdate) -> Staff:
        StaffService.get_staff(db, staff_id)
        updated = StaffRepository.update(db, staff_id, staff_update)
        if not updated:
            raise HTTPException(status_code=404, detail="Staff not found")
        return updated

    @staticmethod
    def delete_staff(db: Session, staff_id: int) -> Staff:
        StaffService.get_staff(db, staff_id)
        deleted = StaffRepository.delete(db, staff_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Staff not found")
        return deleted
