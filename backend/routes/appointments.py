from flask import Blueprint, request, jsonify
from db import db
from flask_jwt_extended import jwt_required
import datetime
from bson.objectid import ObjectId
from utils_email import send_email

appointments_bp = Blueprint("appointments", __name__)


@appointments_bp.route("/", methods=["POST"])
@jwt_required()
def create_appointment():
    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    date_time = data.get("date_time")
    therapist = data.get("therapist")
    if not patient_id or not date_time:
        return jsonify({"msg": "patient_id and date_time required"}), 400
    appt = {
        "patient_id": patient_id,
        "date_time": date_time,
        "therapist": therapist,
        "status": data.get("status", "scheduled"),
        "created_at": datetime.datetime.utcnow(),
    }
    res = db.appointments.insert_one(appt)
    appt_id = str(res.inserted_id)

    email_sent = False
    if data.get("send_email"):
        patient = db.patients.find_one({"patient_id": patient_id})
        email = patient.get("email") if patient else None
        if email:
            try:
                subject = data.get("email_subject") or "Appointment Reminder"
                body = data.get("email_body") or f"Your appointment is scheduled at {date_time}"
                if subject and body:  # only send if both subject and body are provided
                    send_email(email, subject, body)
                    email_sent = True
            except Exception as e:
                print("send_email error:", e)

    return jsonify({"msg": "appointment created", "id": appt_id, "email_sent": email_sent}), 201


@appointments_bp.route("/", methods=["GET"])
@jwt_required()
def list_appointments():
    q = {}
    patient_id = request.args.get("patient_id")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    if patient_id:
        q["patient_id"] = patient_id
    # TODO: filter by date range when date format known
    cursor = db.appointments.find(q).sort("date_time", 1)
    items = []
    for a in cursor:
        a["_id"] = str(a.get("_id"))
        items.append(a)
    return jsonify({"items": items})


@appointments_bp.route("/<id>", methods=["PUT"])
@jwt_required()
def update_appointment(id):
    data = request.get_json() or {}
    try:
        oid = ObjectId(id)
    except Exception:
        return jsonify({"msg": "invalid id"}), 400
    res = db.appointments.update_one({"_id": oid}, {"$set": data})
    if res.matched_count == 0:
        return jsonify({"msg": "not found"}), 404
    return jsonify({"msg": "updated"})


@appointments_bp.route("/<id>", methods=["DELETE"])
@jwt_required()
def delete_appointment(id):
    try:
        oid = ObjectId(id)
    except Exception:
        return jsonify({"msg": "invalid id"}), 400
    res = db.appointments.delete_one({"_id": oid})
    if res.deleted_count == 0:
        return jsonify({"msg": "not found"}), 404
    return jsonify({"msg": "deleted"})


@appointments_bp.route("/<id>/send_reminder", methods=["POST"])
@jwt_required()
def send_reminder(id):
    try:
        oid = ObjectId(id)
    except Exception:
        return jsonify({"msg": "invalid id"}), 400
    appt = db.appointments.find_one({"_id": oid})
    if not appt:
        return jsonify({"msg": "not found"}), 404
    patient_id = appt.get("patient_id")
    patient = db.patients.find_one({"patient_id": patient_id})
    email = patient.get("email") if patient else None
    if not email:
        return jsonify({"msg": "no email for patient"}), 400
    body = request.json.get("body") if request.json else None
    subject = request.json.get("subject") if request.json else "Appointment Reminder"
    try:
        send_email(email, subject, body or f"Your appointment is at {appt.get('date_time')}")
        return jsonify({"msg": "sent"})
    except Exception as e:
        return jsonify({"msg": "error sending", "error": str(e)}), 500
