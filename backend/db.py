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


def ensure_indexes():
    """Create indexes for fast queries — called once at startup.
    Safe to call multiple times (MongoDB ignores existing indexes).
    """
    # ── Patients ──────────────────────────────────────────────────
    db.patients.create_index("patient_id", unique=True, background=True)
    db.patients.create_index("full_name", background=True)
    db.patients.create_index("whatsapp", background=True)
    db.patients.create_index("next_visit", background=True)      # critical for reminder scheduler
    db.patients.create_index("patient_type", background=True)
    db.patients.create_index("created_at", background=True)

    # ── Reminder deduplication ────────────────────────────────────
    # Prevents sending duplicate reminders for the same appointment
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

    print("✅ MongoDB indexes ensured.")


try:
    ensure_indexes()
except Exception:
    traceback.print_exc()
    print("⚠️  Warning: Could not create indexes — queries may be slow.")
