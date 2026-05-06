from .token import Token, TokenData
from .user import UserBase, UserCreate, UserCreateInternal, UserUpdate, UserInDBBase, UserSchema
from .password import ForgotPasswordRequest, ResetPasswordRequest
from .patient import (
    PatientBase, PatientCreate, PatientUpdate, PatientSchema,
    PatientEMRUpdate, PatientSearchQuery, PatientSearchResult, PatientSearchResponse,
)
from .doctor import DoctorBase, DoctorCreate, DoctorUpdate, DoctorSchema
from .staff import StaffBase, StaffCreate, StaffUpdate, StaffSchema
from .hospital import HospitalBase, HospitalCreate, HospitalUpdate, HospitalSchema
from .appointment import (
    AppointmentBase, AppointmentCreate, AppointmentUpdate, AppointmentSchema,
    AppointmentCancelRequest, AvailableDoctor, AvailableSlot,
)
from .medical_report import MedicalReportBase, MedicalReportCreate, MedicalReportUpdate, MedicalReportSchema
from .prescription import PrescriptionBase, PrescriptionCreate, PrescriptionUpdate, PrescriptionSchema
from .otc_medication import OTCMedicationBase, OTCMedicationCreate, OTCMedicationUpdate, OTCMedicationSchema
from .chat import ChatMessageBase, ChatMessageCreate, ChatMessageSchema

from ..database import UserRole

__all__ = [
    "Token", "TokenData",
    "UserBase", "UserCreate", "UserCreateInternal", "UserUpdate", "UserInDBBase", "UserSchema",
    "ForgotPasswordRequest", "ResetPasswordRequest",
    "PatientBase", "PatientCreate", "PatientUpdate", "PatientSchema",
    "PatientEMRUpdate", "PatientSearchQuery", "PatientSearchResult", "PatientSearchResponse",
    "DoctorBase", "DoctorCreate", "DoctorUpdate", "DoctorSchema",
    "StaffBase", "StaffCreate", "StaffUpdate", "StaffSchema",
    "HospitalBase", "HospitalCreate", "HospitalUpdate", "HospitalSchema",
    "AppointmentBase", "AppointmentCreate", "AppointmentUpdate", "AppointmentSchema",
    "AppointmentCancelRequest", "AvailableDoctor", "AvailableSlot",
    "MedicalReportBase", "MedicalReportCreate", "MedicalReportUpdate", "MedicalReportSchema",
    "PrescriptionBase", "PrescriptionCreate", "PrescriptionUpdate", "PrescriptionSchema",
    "OTCMedicationBase", "OTCMedicationCreate", "OTCMedicationUpdate", "OTCMedicationSchema",
    "ChatMessageBase", "ChatMessageCreate", "ChatMessageSchema",
    "UserRole",
]
