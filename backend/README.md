# Backend (Flask)

This folder contains a minimal Flask REST API for the Digital Patient Management System.

Quickstart (local):

1. Create a Python virtual environment and activate it.

```powershell
python -m venv venv
venv\Scripts\Activate.ps1    # PowerShell
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and edit values (MongoDB URI, JWT secret).

3. Run the app

```powershell
python app.py
```

API endpoints (HTTP):
- `POST /api/auth/register` - create user (username,password,role)
- `POST /api/auth/login` - login -> returns `access_token`
- `GET /api/auth/me` - get current user (JWT required)
- `POST /api/patients` - create patient (JWT required)
- `GET /api/patients` - list/search patients
- `GET /api/patients/<patient_id>` - get patient
- `PUT /api/patients/<patient_id>` - update patient
- `DELETE /api/patients/<patient_id>` - delete patient (Admin only)
- `POST /api/appointments` - create appointment
- `GET /api/appointments` - list appointments

Notes:
- This is an initial scaffold. For production, use a proper storage for uploads and enable HTTPS behind the host.

SMS reminders:
- Configure `SMS_PROVIDER` in your `.env` to `textlocal` or `msg91`.
- For TextLocal set `TEXTLOCAL_API_KEY` and optional `TEXTLOCAL_SENDER`.
- For MSG91 set `MSG91_AUTHKEY`, `MSG91_SENDER` and optional `MSG91_COUNTRY`.
- SMS send attempts and responses are logged to the `sms_logs` collection in MongoDB.

When a new visit is recorded (during patient creation or when pushing a visit), the backend computes a `next_visit` date based on the treatment type and attempts to send an SMS reminder to the patient's WhatsApp/mobile number (best-effort; failures do not block the request).

Scheduled reminders:
- A background scheduler periodically checks for `next_visit` dates and sends SMS reminders automatically.
- Configure the scheduler behavior with environment variables in `.env`:
	- `REMINDER_LOOKAHEAD_HOURS` (default: `24`) — how far ahead to look for upcoming `next_visit` dates
	- `REMINDER_INTERVAL_MINUTES` (default: `60`) — how often the scheduler runs
- Reminder logs are stored in the `reminder_logs` collection to avoid duplicate sends.
- You can trigger a manual run via `POST /api/reminders/run` (requires authenticated user with `Admin` or `Receptionist` role).
