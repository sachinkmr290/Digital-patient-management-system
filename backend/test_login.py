#!/usr/bin/env python
import requests

BASE_URL = "http://127.0.0.1:5000"

print("\nTesting login with admin@123...\n")

login_res = requests.post(f"{BASE_URL}/api/auth/login", 
    json={"username": "admin", "password": "admin@123"})

print(f"Status: {login_res.status_code}")
if login_res.status_code == 200:
    token = login_res.json()["access_token"]
    print("✅ LOGIN SUCCESSFUL!")
    print(f"Token: {token[:50]}...")
else:
    print(f"❌ {login_res.text}")
