#!/usr/bin/env python
"""
Test new patient structure
"""
import requests
import json
import datetime

BASE_URL = "http://127.0.0.1:5000"

print("\n" + "="*60)
print("NEW PATIENT STRUCTURE TEST")
print("="*60 + "\n")

# 1. Login
print("1. LOGIN...")
login_res = requests.post(f"{BASE_URL}/api/auth/login", 
    json={"username": "admin", "password": "adminpass"})
if login_res.status_code != 200:
    print(f"❌ Login failed: {login_res.text}")
    exit(1)

token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Logged in")

# 2. Create new patient with all details
print("\n2. CREATE PATIENT with full details...")

import time
unique_name = f"Patient{int(time.time() % 10000)}"

patient_data = {
    "full_name": unique_name,
    "age": 45,
    "gender": "Male",
    "whatsapp": f"+9187654321{int(time.time() % 100):02d}",
    "email": "patient@example.com",
    "medical_history": "Hypertension, Allergies to Penicillin",
    "current_issues": "Lower back pain, Tension headaches",
    "date_of_visit": datetime.datetime.now().isoformat(),
    "doctor_notes": "Initial consultation. Patient reports chronic back pain for 2 months.",
    "doctor_advice": "Head wash by RO water, Derma roller sessions, advised yoga and diet",
    "treatment": "Cupping",
    "photos": []
}

res = requests.post(f"{BASE_URL}/api/patients", json=patient_data, headers=headers)
print(f"Status: {res.status_code}")

if res.status_code == 201:
    result = res.json()
    patient_id = result["patient_id"]
    print(f"✅ Patient created: {patient_id}")
    print(f"   Format: NAME(3 letters) + PHONE(last 4 digits)")
    print(f"   Example: {patient_id}")
else:
    print(f"❌ Error: {res.text}")
    exit(1)

# 3. Retrieve and display the created patient
print(f"\n3. GET PATIENT {patient_id}...")
res = requests.get(f"{BASE_URL}/api/patients/{patient_id}", headers=headers)

if res.status_code == 200:
    patient = res.json()
    print("✅ Patient retrieved successfully")
    print("\nPatient Document:")
    print(json.dumps(patient, indent=2, default=str)[:800] + "...")
else:
    print(f"❌ Error: {res.text}")

# 4. Create another patient
print("\n4. CREATE SECOND PATIENT...")

patient_data2 = {
    "full_name": "SecondPatient",
    "age": 32,
    "gender": "Female",
    "whatsapp": f"+9198765432{int(time.time() % 100):02d}",
    "email": "second@example.com",
    "medical_history": "None",
    "current_issues": "Neck stiffness, Stress",
    "date_of_visit": datetime.datetime.now().isoformat(),
    "doctor_notes": "New patient. Complains of neck stiffness and work-related stress.",
    "doctor_advice": "Massage therapy recommended. Derma roller for face care.",
    "treatment": "Massage",
    "photos": []
}

res = requests.post(f"{BASE_URL}/api/patients", json=patient_data2, headers=headers)
if res.status_code == 201:
    patient_id2 = res.json()["patient_id"]
    print(f"✅ Patient created: {patient_id2}")
else:
    print(f"⚠️  {res.status_code}: {res.text[:100]}")

# 5. List all patients
print("\n5. LIST ALL PATIENTS...")
res = requests.get(f"{BASE_URL}/api/patients", headers=headers)

if res.status_code == 200:
    patients = res.json().get("items", [])
    print(f"✅ Found {len(patients)} patients:")
    for p in patients:
        print(f"   • {p['full_name']} ({p['patient_id']}) - {p['whatsapp']}")
else:
    print(f"❌ Error: {res.text}")

print("\n" + "="*60)
print("✅ NEW STRUCTURE TEST COMPLETE")
print("="*60)
print("\nNew Patient Structure:")
print("  • Patient ID: NAME + PHONE (not random)")
print("  • Visits: Embedded in patient document")
print("  • All details in one record\n")
