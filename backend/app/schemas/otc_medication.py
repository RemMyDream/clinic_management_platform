from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class OTCMedicationBase(BaseModel):
    patient_id: int
    staff_id: int
    medication_name: str
    quantity: int


class OTCMedicationCreate(OTCMedicationBase):
    pass


class OTCMedicationUpdate(BaseModel):
    medication_name: Optional[str] = None
    quantity: Optional[int] = None


class OTCMedicationSchema(OTCMedicationBase):
    otc_id: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
