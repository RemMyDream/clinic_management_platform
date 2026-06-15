import requests
import json

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

print("Starting API Integration Tests based on tutorial.md...")

# ==========================================
# 7. PATIENT ROLE TESTS
# ==========================================
print("\n--- Testing PATIENT Role ---")
patient_token = login("alice.wilson@email.com", "patient123")
if not patient_token:
    print("❌ Patient login failed!")
else:
    headers = {"Authorization": f"Bearer {patient_token}"}
    
    # Get Patient Profile
    res = requests.get(f"{BASE_URL}/users/me", headers=headers)
    print_result("Patient Login & Get Profile", res)
    # The user model usually has 'patient_id'
    patient_id = res.json().get("patient_id")

    # Book Appointment
    booking_data = {
        "patient_id": patient_id,
        "doctor_id": 2, # Dr. Smith
        "appointment_day": "2026-10-10",
        "appointment_time": "10:00:00",
        "reason": "Test booking"
    }
    res = requests.post(f"{BASE_URL}/appointments/book", headers=headers, json=booking_data)
    print_result("Patient Book Appointment", res)

    # View Appointments
    res = requests.get(f"{BASE_URL}/appointments/me", headers=headers)
    print_result("Patient View Appointments", res)
    
    # View Prescriptions
    if patient_id:
        res = requests.get(f"{BASE_URL}/prescriptions/by-patient/{patient_id}", headers=headers)
        print_result("Patient View Prescriptions", res)

    # View Medical History
    res = requests.get(f"{BASE_URL}/medical_reports/", headers=headers)
    print_result("Patient View Medical History", res)

# ==========================================
# 8. DOCTOR ROLE TESTS
# ==========================================
print("\n--- Testing DOCTOR Role ---")
doctor_token = login("dr.smith@clinic.com", "doctor123")
if not doctor_token:
    print("❌ Doctor login failed!")
else:
    doc_headers = {"Authorization": f"Bearer {doctor_token}"}
    
    # Get Doctor Profile
    res = requests.get(f"{BASE_URL}/users/me", headers=doc_headers)
    doctor_id = res.json().get("doctor_id")

    # Search Patients
    res = requests.post(f"{BASE_URL}/patients/search", headers=doc_headers, json={"name": "Alice"})
    print_result("Doctor Search Patients", res)

    # View Appointments
    res = requests.get(f"{BASE_URL}/appointments/me", headers=doc_headers)
    print_result("Doctor View Appointments", res)
    
    appointment_id = None
    if res.status_code == 200 and len(res.json()) > 0:
        appointment_id = res.json()[-1]["appointment_id"]

    # Create Medical Report
    if appointment_id and patient_id and doctor_id:
        report_data = {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_id": appointment_id,
            "diagnosis": "Healthy",
            "treatment_process": "Rest",
            "pulse": 75,
            "blood_pressure": "120/80"
        }
        res = requests.post(f"{BASE_URL}/medical_reports/", headers=doc_headers, json=report_data)
        print_result("Doctor Create Medical Report", res)

# ==========================================
# 9. CLINIC_STAFF ROLE TESTS
# ==========================================
print("\n--- Testing CLINIC_STAFF Role ---")
staff_token = login("mary.nurse@clinic.com", "staff123")
if not staff_token:
    print("❌ Staff login failed!")
else:
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # Search Patients
    res = requests.post(f"{BASE_URL}/patients/search", headers=staff_headers, json={})
    print_result("Staff Search Patients", res)

    # View All Appointments
    res = requests.get(f"{BASE_URL}/appointments/", headers=staff_headers)
    print_result("Staff View Appointments", res)

    # Check-in / Complete Appointment
    if appointment_id:
        res = requests.post(f"{BASE_URL}/appointments/{appointment_id}/complete", headers=staff_headers)
        print_result("Staff Complete Appointment", res)

print("\n--- Tests Completed ---")
