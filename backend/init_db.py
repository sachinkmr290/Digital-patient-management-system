#!/usr/bin/env python
"""
Simple MongoDB Atlas Database Initialization Script
Creates a single collection with all patient details in one place
"""

from pymongo import MongoClient, ASCENDING
import os
from dotenv import load_dotenv
import certifi
import traceback

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "dpms")

print("\n" + "="*60)
print("SIMPLE DATABASE INITIALIZATION")
print("="*60)
print(f"MongoDB URI: {MONGO_URI[:50]}...")
print(f"Database: {DB_NAME}\n")

# Connect to MongoDB
def get_client():
    try:
        client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)
        client.admin.command("ping")
        print("✅ Connected to MongoDB Atlas (secure TLS)")
        return client
    except Exception as e:
        print(f"⚠️  Secure connection failed: {e}")
        try:
            client = MongoClient(MONGO_URI, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=10000)
            client.admin.command("ping")
            print("⚠️  Connected with tlsAllowInvalidCertificates=True (dev environment only)")
            return client
        except Exception as e2:
            print(f"❌ Failed to connect: {e2}")
            traceback.print_exc()
            exit(1)

client = get_client()
db = client[DB_NAME]

# Drop old collections if they exist (to simplify)
print("\n🗑️  Cleaning up old collections...\n")
old_collections = ["appointments", "visits", "sequences"]
for coll in old_collections:
    if coll in db.list_collection_names():
        db[coll].drop()
        print(f"   Dropped '{coll}'")

# Create single patients collection
print("\n📦 Creating patients collection...\n")

try:
    if "patients" in db.list_collection_names():
        print("⏭️  Collection 'patients' already exists")
    else:
        db.create_collection("patients")
        print("✅ Collection 'patients' created")
    
    # Create indexes
    patients_coll = db["patients"]
    
    indexes = [
        ("patient_id", ASCENDING, {"unique": True}),
        ("full_name", ASCENDING, {}),
        ("whatsapp", ASCENDING, {}),
        ("email", ASCENDING, {}),
    ]
    
    for field_name, direction, options in indexes:
        try:
            patients_coll.create_index([(field_name, direction)], **options)
            index_type = "unique" if options.get("unique") else "regular"
            print(f"   📌 Index on '{field_name}' ({index_type})")
        except Exception as e:
            print(f"   ⚠️  Index '{field_name}': {str(e)[:60]}")

except Exception as e:
    print(f"❌ Error creating collection: {e}")
    traceback.print_exc()
    exit(1)

# Create users collection (for authentication only)
print("\n👤 Creating users collection...\n")

try:
    if "users" not in db.list_collection_names():
        db.create_collection("users")
        print("✅ Collection 'users' created")
    else:
        print("⏭️  Collection 'users' already exists")
    
    users_coll = db["users"]
    users_coll.create_index([("username", ASCENDING)], unique=True)
    print("   📌 Index on 'username' (unique)")

except Exception as e:
    print(f"❌ Error creating users collection: {e}")

# Add sample admin
print("\n")
try:
    from werkzeug.security import generate_password_hash
    
    admin = {
        "username": "admin",
        "email": "admin@example.com",
        "password": generate_password_hash("adminpass"),
        "role": "Admin"
    }
    
    existing = db.users.find_one({"username": "admin"})
    if existing:
        print("⏭️  Admin user already exists")
    else:
        db.users.insert_one(admin)
        print("✅ Admin user created (admin / adminpass)")

except ImportError:
    print("⚠️  werkzeug not available for password hashing")
except Exception as e:
    print(f"⚠️  Could not create admin user: {e}")

# Display summary
print("\n" + "="*60)
print("📊 DATABASE SUMMARY")
print("="*60)

try:
    print("\n📁 patients collection")
    count = db.patients.count_documents({})
    print(f"   Documents: {count}")
    print("   Sample Document Structure:")
    print("   {")
    print("     patient_id: 'JOH3210'  (derived from name + phone)")
    print("     full_name: 'John Doe'")
    print("     age: 45")
    print("     gender: 'Male'")
    print("     whatsapp: '+919876543210'")
    print("     email: 'john@example.com'")
    print("     medical_history: 'Hypertension, Allergies'")
    print("     current_issues: 'Lower back pain'")
    print("     visits: [")
    print("       {")
    print("         date_of_visit: '2026-04-09T10:30:00'")
    print("         doctor_notes: 'Initial consultation'")
    print("         doctor_advice: 'Head wash by RO water, Derma roller'")
    print("         treatment: 'Cupping'")
    print("         photos: []")
    print("         next_visit: '2026-04-24T10:30:00'")
    print("         created_at: '2026-04-09T10:30:00'")
    print("       }")
    print("     ]")
    print("     created_at: '2026-04-09T10:30:00'")
    print("     updated_at: '2026-04-09T10:30:00'")
    print("   }")
    
    print("\n📁 users collection")
    count = db.users.count_documents({})
    print(f"   Documents: {count}")
    print("   Structure: username, password, role, email")
except Exception as e:
    print(f"⚠️  Error: {e}")

print("\n" + "="*60)
print("✅ DATABASE INITIALIZATION COMPLETE")
print("="*60)
print("\nSimple Collection Schema:")
print("  • patients: All patient data (visits & appointments embedded)")
print("             Patient ID: NAME(3 letters) + PHONE(last 4 digits)")
print("             Example: John Doe + 9876543210 => JOH3210")
print("  • users: Authentication only\n")

client.close()
