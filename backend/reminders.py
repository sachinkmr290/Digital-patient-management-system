import os
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler

load_dotenv()

from db import db
from utils_sms import send_sms
from utils_email import send_email

# Configuration
REMINDER_LOOKAHEAD_HOURS = int(os.getenv("REMINDER_LOOKAHEAD_HOURS", "24"))
REMINDER_INTERVAL_MINUTES = int(os.getenv("REMINDER_INTERVAL_MINUTES", "60"))

scheduler = BackgroundScheduler()


def find_and_send_reminders(lookahead_hours: int = REMINDER_LOOKAHEAD_HOURS):
    """Find patients with `next_visit` between now and now+lookahead_hours and send WhatsApp + Email reminders.

    Returns a summary dict.
    """
    now = datetime.utcnow()
    until = now + timedelta(hours=lookahead_hours)
    now_iso = now.isoformat()
    until_iso = until.isoformat()

    q = {"next_visit": {"$gte": now_iso, "$lte": until_iso}}
    candidates = list(db.patients.find(q))
    summary = {"checked": len(candidates), "sent": 0, "skipped": 0, "errors": 0, "details": []}

    for p in candidates:
        patient_id = p.get("patient_id")
        next_visit = p.get("next_visit")
        phone = p.get("whatsapp")
        email = p.get("email")
        name = p.get("full_name") or "Patient"
        
        # Get latest treatment info
        visits = p.get("visits", [])
        latest_treatment = ""
        if visits and len(visits) > 0:
            latest_treatment = visits[0].get("treatment", "")

        if not phone and not email:
            summary["skipped"] += 1
            summary["details"].append({"patient_id": patient_id, "reason": "no_contact_info"})
            continue

        # avoid duplicate reminder sends for same appointment
        already = db.reminder_logs.find_one({"patient_id": patient_id, "appointment_date": next_visit, "type": "pre_visit"})
        if already:
            summary["skipped"] += 1
            summary["details"].append({"patient_id": patient_id, "reason": "already_sent"})
            continue

        # format date
        try:
            ndt = datetime.fromisoformat(next_visit)
            date_str = ndt.strftime("%d %b %Y, %I:%M %p")
        except Exception:
            date_str = next_visit

        # Prepare message
        message = f"Dear {name}, this is a reminder for your upcoming appointment tomorrow on {date_str}"
        if latest_treatment:
            message += f" for {latest_treatment}"
        message += "."

        email_subject = f"Appointment Reminder - {date_str}"
        email_body = f"""
        <p>Dear {name},</p>
        <p>This is a reminder for your upcoming appointment tomorrow on <strong>{date_str}</strong></p>
        {"<p>Treatment: <strong>" + latest_treatment + "</strong></p>" if latest_treatment else ""}
        <p>Please arrive 5 minutes early and bring any relevant medical documents.</p>
        <p>If you need to reschedule, please contact us as soon as possible.</p>
        <p>Thank you!</p>
        """

        sent_count = 0
        errors = []

        # Send WhatsApp/SMS
        if phone:
            try:
                ok, resp = send_sms(phone, message)
                db.sms_logs.insert_one({
                    "patient_id": patient_id,
                    "type": "pre_visit_reminder",
                    "phone": phone,
                    "message": message,
                    "sent_at": datetime.utcnow(),
                    "ok": bool(ok),
                    "response": resp,
                })
                if ok:
                    sent_count += 1
                else:
                    errors.append(f"SMS failed: {resp}")
            except Exception as e:
                logging.exception(f"Error sending SMS reminder for {patient_id}")
                db.sms_logs.insert_one({
                    "patient_id": patient_id,
                    "type": "pre_visit_reminder",
                    "phone": phone,
                    "message": message,
                    "sent_at": datetime.utcnow(),
                    "ok": False,
                    "error": str(e),
                })
                errors.append(str(e))

        # Send Email
        if email:
            try:
                send_email(email, email_subject, email_body)
                db.sms_logs.insert_one({
                    "patient_id": patient_id,
                    "type": "pre_visit_reminder_email",
                    "email": email,
                    "subject": email_subject,
                    "sent_at": datetime.utcnow(),
                    "ok": True,
                })
                sent_count += 1
            except Exception as e:
                logging.exception(f"Error sending email reminder for {patient_id}")
                db.sms_logs.insert_one({
                    "patient_id": patient_id,
                    "type": "pre_visit_reminder_email",
                    "email": email,
                    "subject": email_subject,
                    "sent_at": datetime.utcnow(),
                    "ok": False,
                    "error": str(e),
                })
                errors.append(f"Email failed: {str(e)}")

        # Log reminder
        db.reminder_logs.insert_one({
            "patient_id": patient_id,
            "appointment_date": next_visit,
            "type": "pre_visit",
            "sent_at": datetime.utcnow(),
            "messages_sent": sent_count,
            "channels": ["sms" if phone else "", "email" if email else ""],
            "errors": errors if errors else None,
        })

        if sent_count > 0:
            summary["sent"] += 1
            summary["details"].append({"patient_id": patient_id, "channels_sent": sent_count})
        else:
            summary["errors"] += 1
            summary["details"].append({"patient_id": patient_id, "errors": errors})

    return summary


def _job():
    logging.getLogger(__name__).info("Running scheduled reminder job")
    try:
        res = find_and_send_reminders()
        logging.getLogger(__name__).info("Reminder job summary: %s", res)
    except Exception:
        logging.exception("Scheduled reminder job failed")


def init_scheduler(app=None):
    """Start the background scheduler to run reminder job periodically."""
    if scheduler.get_jobs():
        # already started
        return
    scheduler.add_job(_job, "interval", minutes=REMINDER_INTERVAL_MINUTES, id="reminder_job", replace_existing=True)
    scheduler.start()
    if app:
        app.logger.info(f"Reminder scheduler started: every {REMINDER_INTERVAL_MINUTES} minutes, lookahead {REMINDER_LOOKAHEAD_HOURS} hours")
    else:
        logging.getLogger(__name__).info(f"Reminder scheduler started: every {REMINDER_INTERVAL_MINUTES} minutes, lookahead {REMINDER_LOOKAHEAD_HOURS} hours")


# allow direct run for quick testing
if __name__ == "__main__":
    print(find_and_send_reminders())
