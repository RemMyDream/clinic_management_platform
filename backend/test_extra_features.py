import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def print_result(step, response):
    status = "✅" if response.status_code < 400 else "❌"
    print(f"{status} {step} (Status: {response.status_code})")
    if response.status_code >= 400:
        print(f"   Error: {response.text}")
    return response.status_code < 400

def login(email, password):
    res = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    if res.status_code == 200:
        return res.json().get("access_token")
    return None

print("Starting Extra Features API Tests...")

# ==========================================
# 1. PUBLIC / REGISTRATION TESTS
# ==========================================
print("\n--- Testing Public / Registration ---")
# Generate a unique email and username
unique_id = int(time.time())
unique_email = f"new.patient.{unique_id}@email.com"
unique_username = f"newpatient_{unique_id}"

register_data = {
    "username": unique_username,
    "email": unique_email,
    "full_name": "New Patient",
    "password": "patient123",
    "role": "PATIENT"
}
res = requests.post(f"{BASE_URL}/auth/register", json=register_data)
print_result("Register New Patient", res)

# ==========================================
# 2. PATIENT EXTRA TESTS
# ==========================================
print("\n--- Testing PATIENT Extra ---")
patient_id = None
patient_token = login(unique_email, "patient123")
if not patient_token:
    print("❌ New patient login failed!")
else:
    headers = {"Authorization": f"Bearer {patient_token}"}
    
    # Get Patient Profile to get patient_id
    res = requests.get(f"{BASE_URL}/users/me", headers=headers)
    patient_id = res.json().get("patient_id")
    
    # Book an appointment to cancel
    booking_data = {
        "patient_id": patient_id,
        "doctor_id": 2, 
        "appointment_day": "2026-12-12",
        "appointment_time": "14:00:00",
        "reason": "To be canceled"
    }
    res = requests.post(f"{BASE_URL}/appointments/book", headers=headers, json=booking_data)
    appt_id_to_cancel = None
    if res.status_code == 201:
        appt_id_to_cancel = res.json().get("appointment_id")
    
    if appt_id_to_cancel:
        res = requests.post(f"{BASE_URL}/appointments/{appt_id_to_cancel}/cancel", headers=headers)
        print_result("Patient Cancel Appointment", res)

# ==========================================
# 3. DOCTOR EXTRA TESTS
# ==========================================
print("\n--- Testing DOCTOR Extra ---")
doctor_token = login("dr.smith@clinic.com", "doctor123")
if doctor_token:
    doc_headers = {"Authorization": f"Bearer {doctor_token}"}
    
    # Get doctor's reports to add a prescription
    res = requests.get(f"{BASE_URL}/medical_reports/", headers=doc_headers)
    reports = res.json()
    if reports:
        report_id = reports[0].get("record_id")
        
        # Create prescription
        prescription_data = {
            "report_id": report_id,
            "medication_name": "Paracetamol 500mg",
            "dosage": "1 viên/lần x 2 lần/ngày",
            "quantity": 10
        }
        res = requests.post(f"{BASE_URL}/prescriptions/", headers=doc_headers, json=prescription_data)
        print_result("Doctor Create Prescription", res)
        
        # Edit EMR
        update_data = {
            "diagnosis": "Updated diagnosis - recovery"
        }
        res = requests.put(f"{BASE_URL}/medical_reports/{report_id}", headers=doc_headers, json=update_data)
        print_result("Doctor Update EMR", res)

# ==========================================
# 4. CLINIC STAFF EXTRA TESTS
# ==========================================
print("\n--- Testing CLINIC STAFF Extra ---")
staff_token = login("mary.nurse@clinic.com", "staff123")
if staff_token:
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    
    res = requests.get(f"{BASE_URL}/users/me", headers=staff_headers)
    staff_id = res.json().get("user_id")
    
    # Staff books appointment for patient
    if patient_id:
        booking_data = {
            "patient_id": patient_id,
            "doctor_id": 3, 
            "appointment_day": "2026-12-15",
            "appointment_time": "10:00:00",
            "reason": "Staff booking for patient"
        }
        res = requests.post(f"{BASE_URL}/appointments/book", headers=staff_headers, json=booking_data)
        print_result("Staff Book Appointment for Patient", res)
    
    # Record OTC
    if staff_id and patient_id:
        otc_data = {
            "patient_id": patient_id,
            "staff_id": staff_id,
            "medication_name": "Vitamin C",
            "quantity": 2
        }
        res = requests.post(f"{BASE_URL}/otc_medications/", headers=staff_headers, json=otc_data)
        print_result("Staff Record OTC Medication", res)

# ==========================================
# 5. ADMIN TESTS
# ==========================================
print("\n--- Testing ADMIN Extra ---")
admin_token = login("chienbk@gmail.com", "Fcchien@12")
if not admin_token:
    print("❌ Admin login failed!")
else:
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    res = requests.get(f"{BASE_URL}/users/", headers=admin_headers)
    print_result("Admin List Users", res)

print("\n--- Extra Tests Completed ---")
