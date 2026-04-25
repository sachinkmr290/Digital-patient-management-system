from pymongo import ReturnDocument
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from functools import wraps
from db import db
from flask import jsonify
import datetime


def get_next_sequence(name: str) -> int:
    """Atomic counter in `counters` collection. Returns next integer."""
    seq = db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(seq["seq"])


def role_required(roles):
    if isinstance(roles, str):
        roles = [roles]

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")
            if role not in roles:
                return jsonify({"msg": "forbidden"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def compute_next_visit_date(treatment_type: str, base_date: str | None = None) -> str:
    """Compute next visit ISO datetime string based on treatment type.

    Rules:
    - Cupping: +15 days
    - PRP or GFC: +30 days
    - default: +30 days
    """
    if base_date:
        try:
            # support ISO strings
            base = datetime.datetime.fromisoformat(base_date)
        except Exception:
            base = datetime.datetime.utcnow()
    else:
        base = datetime.datetime.utcnow()

    t = (treatment_type or "").lower()
    if "cupping" in t:
        days = 15
    elif "prp" in t or "gfc" in t:
        days = 30
    else:
        days = 30

    next_dt = base + datetime.timedelta(days=days)
    return next_dt.isoformat()


def generate_patient_id(full_name: str, whatsapp: str) -> str:
    """
    Generate unique patient ID from name and phone number.
    Format: First 3 letters of name (uppercase) + last 4 digits of phone
    Example: John Doe + 9876543210 => JOH3210
    """
    # Extract first 3 letters of name (uppercase)
    name_prefix = full_name.strip().split()[0][:3].upper() if full_name else "PAT"
    
    # Extract last 4 digits from phone
    phone_digits = ''.join(filter(str.isdigit, whatsapp))[-4:] if whatsapp else "0000"
    
    patient_id = f"{name_prefix}{phone_digits}"
    return patient_id
