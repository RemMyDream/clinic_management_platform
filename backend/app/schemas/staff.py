from pydantic import BaseModel, ConfigDict
from typing import Optional


class StaffBase(BaseModel):
    position: str = "General"


class StaffCreate(StaffBase):
    staff_id: int


class StaffUpdate(BaseModel):
    position: Optional[str] = None


class StaffSchema(StaffBase):
    staff_id: int
    model_config = ConfigDict(from_attributes=True)
