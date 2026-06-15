import requests

BASE_URL = "http://127.0.0.1:8000"

def login(email, password):
    res = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    return res.json().get("access_token")

patient_token = login("alice.wilson@email.com", "patient123")
headers = {"Authorization": f"Bearer {patient_token}"}
patient_id = requests.get(f"{BASE_URL}/users/me", headers=headers).json().get("patient_id")

booking_data = {
    "patient_id": patient_id,
    "doctor_id": 2, 
    "appointment_day": "2026-12-12",
    "appointment_time": "09:00:00",
    "reason": "Overlap test"
}

print("Booking first appointment...")
res1 = requests.post(f"{BASE_URL}/appointments/book", headers=headers, json=booking_data)
print(f"First appointment status: {res1.status_code}")

print("Booking second appointment at EXACT SAME TIME for SAME DOCTOR...")
res2 = requests.post(f"{BASE_URL}/appointments/book", headers=headers, json=booking_data)
print(f"Second appointment status: {res2.status_code}")

if res1.status_code == 201 and res2.status_code == 201:
    print("❌ OVERLAP DETECTED! The system allowed double booking!")
else:
    print("✅ System successfully prevented double booking.")
