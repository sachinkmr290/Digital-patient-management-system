#!/usr/bin/env python
from db import db
from werkzeug.security import generate_password_hash

# Update admin password to admin@123
admin_password_hash = generate_password_hash("admin@123")
result = db.users.update_one(
    {"username": "admin"},
    {"$set": {"password": admin_password_hash}}
)

if result.modified_count > 0:
    print("✅ Admin password updated to 'admin@123'")
else:
    print("⚠️  No changes made")
