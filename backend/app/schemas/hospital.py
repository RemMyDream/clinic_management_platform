from pydantic import BaseModel, ConfigDict
from typing import Optional


class HospitalBase(BaseModel):
    hospital_name: str
    address: Optional[str] = None
    governed_by: Optional[str] = None


class HospitalCreate(HospitalBase):
    pass


class HospitalUpdate(BaseModel):
    hospital_name: Optional[str] = None
    address: Optional[str] = None
    governed_by: Optional[str] = None


class HospitalSchema(HospitalBase):
    hospital_id: int
    model_config = ConfigDict(from_attributes=True)
