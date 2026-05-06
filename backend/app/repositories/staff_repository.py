from typing import List, Optional

from sqlalchemy.orm import Session

from ..models import Staff
from ..schemas import StaffCreate, StaffUpdate


class StaffRepository:

    @staticmethod
    def get_by_id(db: Session, staff_id: int) -> Optional[Staff]:
        return db.query(Staff).filter(Staff.staff_id == staff_id).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Staff]:
        return db.query(Staff).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, staff_in: StaffCreate) -> Staff:
        db_staff = Staff(
            staff_id=staff_in.staff_id,
            position=staff_in.position,
        )
        db.add(db_staff)
        db.commit()
        db.refresh(db_staff)
        return db_staff

    @staticmethod
    def update(db: Session, staff_id: int, staff_update: StaffUpdate) -> Optional[Staff]:
        db_staff = StaffRepository.get_by_id(db, staff_id)
        if not db_staff:
            return None
        update_data = staff_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_staff, key, value)
        db.commit()
        db.refresh(db_staff)
        return db_staff

    @staticmethod
    def delete(db: Session, staff_id: int) -> Optional[Staff]:
        db_staff = StaffRepository.get_by_id(db, staff_id)
        if not db_staff:
            return None
        db.delete(db_staff)
        db.commit()
        return db_staff
