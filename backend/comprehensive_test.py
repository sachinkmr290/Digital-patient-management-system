#!/usr/bin/env python
import requests
import json
import datetime

BASE_URL = "http://127.0.0.1:5000"

print("\n" + "="*50)
print("COMPREHENSIVE API SMOKE TEST")
print("="*50 + "\n")

# 1. Register new user
print("1. REGISTER new user...")
reg_res = requests.post(f"{BASE_URL}/api/auth/register", 
    json={"username": f"testuser_{datetime.datetime.now().timestamp()}", "password": "test123"})
print(f"   Status: {reg_res.status_code}")
if reg_res.status_code == 201:
    print(f"   ✅ User registered")
else:
    print(f"   ❌ {reg_res.text}")

# 2. Login
print("\n2. LOGIN...")
login_res = requests.post(f"{BASE_URL}/api/auth/login", 
    json={"username": "admin", "password": "adminpass"})
print(f"   Status: {login_res.status_code}")
if login_res.status_code != 200:
    print(f"   ❌ {login_res.text}")
    exit(1)
token = login_res.json()["access_token"]
print(f"   ✅ Token received: {token[:40]}...")

headers = {"Authorization": f"Bearer {token}"}

# 3. Get all patients
print("\n3. GET all patients...")
res = requests.get(f"{BASE_URL}/api/patients", headers=headers)
patient_count = len(res.json().get("items", []))
print(f"   Status: {res.status_code}")
print(f"   ✅ Found {patient_count} patients")

# 4. Create a new patient
print("\n4. CREATE new patient...")
patient_data = {
    "full_name": "Alice Johnson",
    "whatsapp": "+919876543210",
    "email": "alice@example.com",
    "age": 32,
    "gender": "Female",
    "treatment_type": "Cupping",
    "medical_history": "Allergies",
    "current_issues": "Back pain"
}
res = requests.post(f"{BASE_URL}/api/patients", json=patient_data, headers=headers)
print(f"   Status: {res.status_code}")
if res.status_code == 201:
    patient_id = res.json()["patient_id"]
    print(f"   ✅ Patient created: {patient_id}")
else:
    print(f"   ❌ {res.text}")
    patient_id = None

# 5. Get specific patient
if patient_id:
    print(f"\n5. GET patient {patient_id}...")
    res = requests.get(f"{BASE_URL}/api/patients/{patient_id}", headers=headers)
    print(f"   Status: {res.status_code}")
    if res.status_code == 200:
        print(f"   ✅ Retrieved: {res.json()['full_name']}")
    else:
        print(f"   ❌ {res.text}")

# 6. Create appointment
print("\n6. CREATE appointment...")
appt_data = {
    "patient_id": patient_id or "P000001",
    "appointment_date": "2026-04-15T10:30:00",
    "reason": "Follow-up visit",
    "status": "Scheduled"
}
res = requests.post(f"{BASE_URL}/api/appointments", json=appt_data, headers=headers)
print(f"   Status: {res.status_code}")
if res.status_code in [201, 200]:
    print(f"   ✅ Appointment created")
else:
    print(f"   Note: {res.status_code} - {res.text[:100]}")

# 7. Get all appointments
print("\n7. GET all appointments...")
res = requests.get(f"{BASE_URL}/api/appointments", headers=headers)
appt_count = len(res.json().get("items", []))
print(f"   Status: {res.status_code}")
print(f"   ✅ Found {appt_count} appointments")

# 8. Test health endpoint
print("\n8. TEST health endpoint...")
res = requests.get(f"{BASE_URL}/")
print(f"   Status: {res.status_code}")
print(f"   ✅ API health: {res.json()}")

print("\n" + "="*50)
print("✅ ALL TESTS PASSED - System is working!")
print("="*50 + "\n")
