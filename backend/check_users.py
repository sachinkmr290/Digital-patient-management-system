#!/usr/bin/env python
from db import db
from werkzeug.security import check_password_hash

print("\nUsers in database:")
users = db.users.find()
for user in users:
    print(f"  Username: {user['username']}")
    print(f"  Role: {user.get('role')}")
    print(f"  Has password hash: {'password' in user}")
    if user['username'] == 'admin':
        # Test password
        is_valid = check_password_hash(user['password'], 'adminpass')
        print(f"  Password 'adminpass' valid: {is_valid}")
    print()
