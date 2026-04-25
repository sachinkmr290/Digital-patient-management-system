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
	return MongoClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000, **opts)

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
