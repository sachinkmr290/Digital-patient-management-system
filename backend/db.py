from pymongo import MongoClient
import os
from dotenv import load_dotenv
import certifi
import traceback

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "dpms")

# Try a secure connection first using certifi's CA bundle. If that fails
# (common on some Windows/OpenSSL setups), attempt a development-only
# insecure fallback that allows invalid TLS certificates so the app can
# run locally while we troubleshoot Atlas TLS issues.
def _make_client(opts=None):
	opts = opts or {}
	return MongoClient(
		MONGO_URI,
		tlsCAFile=certifi.where(),
		serverSelectionTimeoutMS=10000,
		maxPoolSize=10,       # max concurrent connections (Atlas free tier safe)
		minPoolSize=1,        # keep 1 alive to avoid cold-start latency
		connectTimeoutMS=5000,
		socketTimeoutMS=10000,
		**opts
	)

_client = None
try:
	_client = _make_client()
	# quick ping to validate connection
	_client.admin.command("ping")
except Exception:
	traceback.print_exc()
	try:
		# INSECURE FALLBACK — only for local development when TLS fails.
		# If this succeeds, you should not use it in production.
		_client = _make_client({"tlsAllowInvalidCertificates": True})
		_client.admin.command("ping")
		print("Warning: connected to MongoDB with tlsAllowInvalidCertificates=True (insecure).")
	except Exception:
		traceback.print_exc()
		raise

_db = _client[DB_NAME]

# Exported handle
db = _db


def _deduplicate_reminder_logs():
    """Remove duplicate reminder_logs documents that would block unique index creation."""
    try:
        pipeline = [
            {"$group": {
                "_id": {"patient_id": "$patient_id", "appointment_date": "$appointment_date", "type": "$type"},
                "ids": {"$push": "$_id"},
                "count": {"$sum": 1}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        duplicates = list(db.reminder_logs.aggregate(pipeline))
        for dup in duplicates:
            ids_to_remove = dup["ids"][1:]  # keep first, remove rest
            db.reminder_logs.delete_many({"_id": {"$in": ids_to_remove}})
        if duplicates:
            print(f"[DB] Removed {sum(len(d['ids'])-1 for d in duplicates)} duplicate reminder_log entries.")
    except Exception:
        traceback.print_exc()


def ensure_indexes():
    """Create indexes for fast queries -- called once at startup.
    Safe to call multiple times (MongoDB ignores existing indexes).
    """
    # -- Patients --
    db.patients.create_index("patient_id", unique=True, background=True)
    db.patients.create_index("full_name", background=True)
    db.patients.create_index("whatsapp", background=True)
    db.patients.create_index("next_visit", background=True)      # critical for reminder scheduler
    db.patients.create_index("patient_type", background=True)
    db.patients.create_index("created_at", background=True)

    # -- Reminder deduplication --
    # Prevents sending duplicate reminders for the same appointment
    # First clean up any existing duplicates so the unique index can be created
    _deduplicate_reminder_logs()
    db.reminder_logs.create_index(
        [("patient_id", 1), ("appointment_date", 1), ("type", 1)],
        unique=True,
        background=True
    )

    # ── SMS / Email logs: auto-expire after 90 days ───────────────
    # Saves significant MongoDB Atlas storage over time
    db.sms_logs.create_index(
        "sent_at",
        expireAfterSeconds=7_776_000,  # 90 days
        background=True
    )

    # ── Appointments ──────────────────────────────────────────────
    db.appointments.create_index("patient_id", background=True)
    db.appointments.create_index("date_time", background=True)

    # ── Visit archive ─────────────────────────────────────────────
    db.visit_archive.create_index("patient_id", background=True)
    db.visit_archive.create_index("archived_at", background=True)

    print("[DB] MongoDB indexes ensured.")


try:
    ensure_indexes()
except Exception:
    traceback.print_exc()
    print("[DB] Warning: Could not create indexes - queries may be slow.")
