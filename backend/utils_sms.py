import os
from dotenv import load_dotenv
import requests
from datetime import datetime
from db import db

load_dotenv()

SMS_PROVIDER = os.getenv("SMS_PROVIDER", "").lower()


def _log_sms(provider, phone, message, response, ok):
    try:
        db.sms_logs.insert_one({
            "provider": provider,
            "phone": phone,
            "message": message,
            "response": response,
            "ok": bool(ok),
            "created_at": datetime.utcnow(),
        })
    except Exception:
        # best-effort logging - don't raise further
        pass


def send_sms(phone: str, message: str) -> tuple[bool, object]:
    """Send an SMS using configured provider.

    Returns tuple (ok: bool, response_object)
    """
    provider = SMS_PROVIDER
    if not provider:
        raise RuntimeError("SMS_PROVIDER not configured in environment")

    phone = (phone or "").strip()
    if not phone:
        raise RuntimeError("Phone number is empty")

    if provider == "textlocal":
        # TextLocal API: https://api.textlocal.in/send/
        api_key = os.getenv("TEXTLOCAL_API_KEY")
        sender = os.getenv("TEXTLOCAL_SENDER") or "TXTLCL"
        if not api_key:
            raise RuntimeError("TEXTLOCAL_API_KEY not configured")
        url = "https://api.textlocal.in/send/"
        payload = {
            "apikey": api_key,
            "numbers": phone,
            "message": message,
            "sender": sender,
        }
        try:
            r = requests.post(url, data=payload, timeout=10)
            try:
                res = r.json()
            except Exception:
                res = {"raw": r.text}
            ok = False
            if isinstance(res, dict) and res.get("status") == "success":
                ok = True
            elif r.status_code == 200:
                ok = True
            _log_sms("textlocal", phone, message, res, ok)
            return ok, res
        except Exception as e:
            _log_sms("textlocal", phone, message, str(e), False)
            raise

    if provider == "msg91":
        # MSG91 sendhttp.php endpoint (common legacy endpoint)
        authkey = os.getenv("MSG91_AUTHKEY")
        sender = os.getenv("MSG91_SENDER") or "MSGIND"
        country = os.getenv("MSG91_COUNTRY", "91")
        if not authkey:
            raise RuntimeError("MSG91_AUTHKEY not configured")
        url = "https://control.msg91.com/api/sendhttp.php"
        payload = {
            "authkey": authkey,
            "mobiles": phone,
            "message": message,
            "sender": sender,
            "route": "4",
            "country": country,
        }
        try:
            r = requests.post(url, data=payload, timeout=10)
            res_text = r.text
            ok = (r.status_code == 200 and ("success" in res_text.lower() or res_text.strip().isdigit()))
            _log_sms("msg91", phone, message, res_text, ok)
            return ok, res_text
        except Exception as e:
            _log_sms("msg91", phone, message, str(e), False)
            raise

    # Unknown provider
    _log_sms(provider or "unknown", phone, message, "no-provider-configured", False)
    raise RuntimeError("Unsupported SMS provider: %r" % provider)
