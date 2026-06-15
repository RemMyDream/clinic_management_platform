import sys
import os
import asyncio
from datetime import date
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DOTENV_PATH = os.path.join(BACKEND_DIR, '.env')
load_dotenv(DOTENV_PATH)

sys.path.insert(0, BACKEND_DIR)

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, UserRole, create_db_and_tables
from app import crud, schemas, models

async def create_initial_users():
    db: Session = SessionLocal()
    try:
        print("Creating initial users for the clinic management system...")

        print("\n1. Creating Admin User...")
        admin_username = "chienbk"
        admin_email = "chienbk@gmail.com"
        admin_password = "Fcchien@12"
        admin_full_name = "Super Administrator"

        existing_admin = crud.get_user_by_email(db, email=admin_email)
        if not existing_admin:
            admin_user_in = schemas.UserCreate(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                full_name=admin_full_name,
                role=UserRole.ADMIN
            )
            admin_user = crud.create_user(db=db, user=admin_user_in)
            print(f"✅ Admin user created: {admin_user.username} (ID: {admin_user.user_id})")
        else:
            print(f"⚠️  Admin user already exists: {admin_email}")

        # --- 2. CREATE DEFAULT HOSPITAL ---
        print("\n2. Creating Default Hospital...")
        
        # Check if default hospital already exists
        existing_hospital = crud.get_hospital(db, hospital_id=1)
        if not existing_hospital:
            hospital_in = schemas.HospitalCreate(
                hospital_name="Default Medical Center",
                address="123 Main Street, City, State",
                governed_by="Department of Health"
            )
            hospital = crud.create_hospital(db=db, hospital_in=hospital_in)
            print(f"✅ Default hospital created: {hospital.hospital_name} (ID: {hospital.hospital_id})")
        else:
            print(f"⚠️  Default hospital already exists: {existing_hospital.hospital_name}")

        # --- 3. CREATE DOCTOR USERS ---
        print("\n3. Creating Doctor Users...")
        doctors_data = [
            {
                "username": "dr_smith",
                "email": "dr.smith@clinic.com",
                "password": "doctor123",
                "full_name": "Dr. John Smith",
                "major": "Cardiology"
            },
            {
                "username": "dr_johnson",
                "email": "dr.johnson@clinic.com",
                "password": "doctor123",
                "full_name": "Dr. Sarah Johnson",
                "major": "Pediatrics"
            }
        ]

        doctor_users = []
        for doctor_data in doctors_data:
            existing_doctor = crud.get_user_by_email(db, email=doctor_data["email"])
            if not existing_doctor:
                doctor_user_in = schemas.UserCreate(
                    username=doctor_data["username"],
                    email=doctor_data["email"],
                    password=doctor_data["password"],
                    full_name=doctor_data["full_name"],
                    role=UserRole.DOCTOR
                )
                doctor_user = crud.create_user(db=db, user=doctor_user_in)
                doctor_users.append(doctor_user)
                print(f"✅ Doctor created: {doctor_user.full_name} (ID: {doctor_user.user_id})")
            else:
                doctor_users.append(existing_doctor)
                print(f"⚠️  Doctor already exists: {doctor_data['email']}")

        # --- 4. CREATE CLINIC STAFF USERS ---
        print("\n4. Creating Clinic Staff Users...")
        staff_data = [
            {
                "username": "staff_mary",
                "email": "mary.nurse@clinic.com",
                "password": "staff123",
                "full_name": "Mary Williams (Head Nurse)"
            },
            {
                "username": "staff_james",
                "email": "james.reception@clinic.com",
                "password": "staff123", 
                "full_name": "James Brown (Receptionist)"
            }
        ]

        for staff_info in staff_data:
            existing_staff = crud.get_user_by_email(db, email=staff_info["email"])
            if not existing_staff:
                staff_user_in = schemas.UserCreate(
                    username=staff_info["username"],
                    email=staff_info["email"],
                    password=staff_info["password"],
                    full_name=staff_info["full_name"],
                    role=UserRole.CLINIC_STAFF
                )
                staff_user = crud.create_user(db=db, user=staff_user_in)
                print(f"✅ Staff created: {staff_user.full_name} (ID: {staff_user.user_id})")
            else:
                print(f"⚠️  Staff already exists: {staff_info['email']}")

        # --- 5. CREATE PATIENT USERS ---
        print("\n5. Creating Patient Users...")
        patients_data = [
            {"username": "patient_alice", "email": "alice.wilson@email.com", "full_name": "Alice Wilson", "gender": "Female", "age": 28},
            {"username": "patient_bob", "email": "bob.martinez@email.com", "full_name": "Bob Martinez", "gender": "Male", "age": 35},
            {"username": "patient_carol", "email": "carol.davis@email.com", "full_name": "Carol Davis", "gender": "Female", "age": 42},
            {"username": "patient_david", "email": "david.garcia@email.com", "full_name": "David Garcia", "gender": "Male", "age": 19},
            {"username": "patient_emma", "email": "emma.rodriguez@email.com", "full_name": "Emma Rodriguez", "gender": "Female", "age": 31},
            {"username": "patient_frank", "email": "frank.lopez@email.com", "full_name": "Frank Lopez", "gender": "Male", "age": 67},
            {"username": "patient_grace", "email": "grace.lee@email.com", "full_name": "Grace Lee", "gender": "Female", "age": 24},
            {"username": "patient_henry", "email": "henry.walker@email.com", "full_name": "Henry Walker", "gender": "Male", "age": 53},
            {"username": "patient_iris", "email": "iris.hall@email.com", "full_name": "Iris Hall", "gender": "Female", "age": 29},
            {"username": "patient_jack", "email": "jack.allen@email.com", "full_name": "Jack Allen", "gender": "Male", "age": 45}
        ]

        patient_users = []
        for i, patient_data in enumerate(patients_data):
            existing_patient = crud.get_user_by_email(db, email=patient_data["email"])
            if not existing_patient:
                patient_user_in = schemas.UserCreate(
                    username=patient_data["username"],
                    email=patient_data["email"],
                    password="patient123",
                    full_name=patient_data["full_name"],
                    role=UserRole.PATIENT
                )
                patient_user = crud.create_user(db=db, user=patient_user_in)
                patient_users.append(patient_user)
                
                patient_user_id = getattr(patient_user, 'user_id')
                print(f"✅ Patient created: {patient_user.full_name} (ID: {patient_user_id})")
            else:
                patient_users.append(existing_patient)
                print(f"⚠️  Patient already exists: {patient_data['email']}")

        print(f"\n🎉 Initial user creation completed!")
        print(f"📊 Summary:")
        print(f"   - 1 Admin user")
        print(f"   - 1 Default hospital")
        print(f"   - {len(doctors_data)} Doctor users")
        print(f"   - {len(staff_data)} Clinic staff users") 
        print(f"   - {len(patients_data)} Patient users")
        print(f"   - Total: {1 + len(doctors_data) + len(staff_data) + len(patients_data)} users")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

async def main():
    create_db_and_tables()
    await create_initial_users()

if __name__ == "__main__":
    asyncio.run(main())
