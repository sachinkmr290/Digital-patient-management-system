#!/usr/bin/env python
from db import db
from werkzeug.security import generate_password_hash

admin_password = generate_password_hash("adminpass")
db.users.update_one(
    {"username": "admin"},
    {"$set": {"password": admin_password}}
)
print("✅ Admin password updated to 'adminpass'")
