from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Union
import enum

from ..database import get_db, UserRole, Gender, Class
from ..models import User
from ..schemas import UserSchema, UserCreate, UserUpdate, PatientSchema, DoctorSchema, PatientUpdate, DoctorUpdate
from ..services import UserService, PatientService, DoctorService
from ..repositories import PatientRepository, DoctorRepository
from ..dependencies import get_current_active_user, get_current_active_admin

router = APIRouter(
    tags=["Users"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=UserSchema, dependencies=[Depends(get_current_active_admin)])
def create_user_by_admin(user: UserCreate, db: Session = Depends(get_db)):
    return UserService.create_user(db, user)


@router.get("/me", response_model=Union[UserSchema, PatientSchema, DoctorSchema])
async def read_users_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    role = current_user.role
    if role == UserRole.PATIENT:
        patient = PatientRepository.get_by_id(db, current_user.user_id)
        if patient:
            patient_dict = patient.__dict__.copy()
            patient_dict["username"] = current_user.username
            patient_dict["email"] = current_user.email
            return PatientSchema.model_validate(patient_dict)
        raise HTTPException(status_code=404, detail="Patient profile not found")
    elif role == UserRole.DOCTOR:
        doctor = DoctorRepository.get_by_id(db, current_user.user_id)
        if doctor:
            doctor_dict = doctor.__dict__.copy()
            doctor_dict["username"] = current_user.username
            doctor_dict["email"] = current_user.email
            return DoctorSchema.model_validate(doctor_dict)
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return UserSchema.model_validate(current_user)


@router.put("/me")
async def update_user_me(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    body = await request.json()
    if not body:
        raise HTTPException(status_code=400, detail="No user data provided")

    role = current_user.role

    user_update = UserUpdate(
        username=body.get("username", current_user.username),
        email=body.get("email", current_user.email),
        full_name=body.get("full_name", current_user.full_name),
        role=role,
        password=body.get("password", None),
    )
    UserService.update_user(db, current_user.user_id, user_update, current_user)

    if role == UserRole.PATIENT:
        current_patient = PatientRepository.get_by_id(db, current_user.user_id)
        gender_str = body.get("gender", current_patient.gender)
        gender = None
        if isinstance(gender_str, str):
            gender_map = {g.value.lower(): g for g in Gender}
            gender = gender_map.get(gender_str.lower(), current_patient.gender)
        else:
            gender = current_patient.gender
        class_role_str = body.get("class_role", current_patient.class_role)
        class_role = None
        if isinstance(class_role_str, str):
            class_map = {c.value.lower(): c for c in Class}
            class_role = class_map.get(class_role_str.lower(), current_patient.class_role)
        else:
            class_role = current_patient.class_role
        if isinstance(gender, enum.Enum):
            gender = gender.value
        if isinstance(class_role, enum.Enum):
            class_role = class_role.value
        patient_update = PatientUpdate(
            username=current_user.username,
            email=current_user.email,
            full_name=body.get("full_name", current_patient.full_name),
            date_of_birth=body.get("date_of_birth", current_patient.date_of_birth),
            gender=gender,
            ethnic_group=body.get("ethnic_group", current_patient.ethnic_group),
            address=body.get("address", current_patient.address),
            phone_number=body.get("phone_number", current_patient.phone_number),
            health_insurance_card_no=body.get("health_insurance_card_no", current_patient.health_insurance_card_no),
            identification_id=body.get("identification_id", current_patient.identification_id),
            job=body.get("job", current_patient.job),
            class_role=class_role,
        )
        return PatientRepository.update(db, current_patient.patient_id, patient_update)
    elif role == UserRole.DOCTOR:
        current_doctor = DoctorRepository.get_by_id(db, current_user.user_id)
        doctor_update = DoctorUpdate(
            doctor_name=body.get("full_name", current_doctor.doctor_name),
            major=body.get("major", current_doctor.major),
        )
        return DoctorRepository.update(db, current_doctor.doctor_id, doctor_update)

    return {"message": "Error: update in users table successful, but cannot update patient or doctor profile"}


@router.get("/", response_model=List[UserSchema], dependencies=[Depends(get_current_active_admin)])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return UserService.get_all_users(db, skip, limit)


@router.get("/{user_id}", response_model=UserSchema)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    is_admin = current_user.role.value == UserRole.ADMIN.value
    is_self = current_user.user_id == user_id
    if not is_admin and not is_self:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return UserService.get_user(db, user_id)


@router.put("/{user_id}", response_model=UserSchema)
def update_user_details(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return UserService.update_user(db, user_id, user_update, current_user)


@router.delete("/{user_id}", response_model=UserSchema)
def delete_user_by_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    return UserService.delete_user(db, user_id, current_user)
