import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "True").lower() in ("1", "true", "yes")


def send_email(to_address: str, subject: str, body: str, html: str | None = None) -> None:
    """Send a simple email using configured SMTP server.

    Raises RuntimeError if SMTP is not configured.
    """
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP not configured. Set SMTP_* env variables.")

    # Ensure subject and body are strings
    if not isinstance(subject, str) or not subject:
        raise ValueError("subject must be a non-empty string")
    if not isinstance(to_address, str) or not to_address:
        raise ValueError("to_address must be a non-empty string")
    if not isinstance(body, str):
        body = str(body) if body is not None else ""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_address
    if html:
        msg.set_content(body)
        msg.add_alternative(html, subtype="html")
    else:
        msg.set_content(body)

    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
    try:
        if SMTP_USE_TLS:
            server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
    finally:
        server.quit()
