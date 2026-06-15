from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class PrescriptionBase(BaseModel):
    report_id: int
    medication_name: str
    dosage: str
    quantity: int = Field(..., ge=0)


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionUpdate(BaseModel):
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    quantity: Optional[int] = None


class PrescriptionSchema(PrescriptionBase):
    prescription_id: int
    model_config = ConfigDict(from_attributes=True)
