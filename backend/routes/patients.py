from flask import Blueprint, request, jsonify
from db import db
from utils import role_required, compute_next_visit_date, generate_patient_id
from flask_jwt_extended import jwt_required
from utils_sms import send_sms
from utils_email import send_email
import datetime
import threading

patients_bp = Blueprint("patients", __name__)


def send_booking_confirmation(patient):
    """Send immediate booking confirmation via email and SMS"""
    patient_id = patient.get("patient_id")
    name = patient.get("full_name")
    phone = patient.get("whatsapp")
    email = patient.get("email")
    visits = patient.get("visits", [])
    
    if visits and len(visits) > 0:
        visit = visits[0]
        treatment = visit.get("treatment", "")
        next_visit = visit.get("next_visit", "")
        
        try:
            # Format next visit date
            if next_visit:
                ndt = datetime.datetime.fromisoformat(next_visit)
                date_str = ndt.strftime("%d %b %Y, %I:%M %p")
            else:
                date_str = "TBD"
            
            # SMS/WhatsApp message (Professional format)
            sms_message = f"🌟 Hello {name}!\n\n✅ Thank you for visiting our clinic today!\n\n📌 Treatment: {treatment}\n📅 Your Next Appointment: {date_str}\n\n⏰ Please arrive 5 minutes early\n📄 Bring any relevant medical documents\n\nFor any queries, contact us!\n\nBest Regards,\nOur Medical Team"
            
            # Email message - Plain text format
            email_subject = "Appointment Confirmation"
            email_body = f"""Dear {name},

Thank you for visiting us today for {treatment}.

Your next appointment is scheduled on {date_str}.

Please arrive 5 minutes early. If you need to reschedule, kindly inform us in advance.

Regards,
Medical Team"""
            
            # Send SMS
            if phone:
                try:
                    ok, resp = send_sms(phone, sms_message)
                    db.sms_logs.insert_one({
                        "patient_id": patient_id,
                        "type": "booking_confirmation",
                        "phone": phone,
                        "message": sms_message,
                        "sent_at": datetime.datetime.utcnow(),
                        "ok": bool(ok),
                        "response": resp,
                    })
                    print(f"✅ SMS sent to {phone}: {ok}")
                except Exception as e:
                    print(f"❌ SMS failed for {phone}: {str(e)}")
                    db.sms_logs.insert_one({
                        "patient_id": patient_id,
                        "type": "booking_confirmation",
                        "phone": phone,
                        "sent_at": datetime.datetime.utcnow(),
                        "ok": False,
                        "error": str(e),
                    })
            
            # Send Email
            if email:
                try:
                    send_email(email, email_subject, email_body)
                    db.sms_logs.insert_one({
                        "patient_id": patient_id,
                        "type": "booking_confirmation_email",
                        "email": email,
                        "subject": email_subject,
                        "sent_at": datetime.datetime.utcnow(),
                        "ok": True,
                    })
                except Exception as e:
                    db.sms_logs.insert_one({
                        "patient_id": patient_id,
                        "type": "booking_confirmation_email",
                        "email": email,
                        "sent_at": datetime.datetime.utcnow(),
                        "ok": False,
                        "error": str(e),
                    })
        except Exception as e:
            import traceback
            traceback.print_exc()


def _send_visit_notification(patient_id, visit, next_visit_iso):
    try:
        from db import db
        from utils_sms import send_sms
        from utils_email import send_email
        import datetime
        p = db.patients.find_one({"patient_id": patient_id})
        if p and visit:
            name = p.get("full_name")
            phone = p.get("whatsapp")
            email = p.get("email")
            treatment = visit.get("treatment_type") or visit.get("treatment", "")
            
            if next_visit_iso:
                ndt = datetime.datetime.fromisoformat(next_visit_iso)
                date_str = ndt.strftime("%d %b %Y, %I:%M %p")
            else:
                date_str = "TBD"
            
            sms_message = f"🌟 Hello {name}!\n\n✅ Thank you for visiting our clinic today!\n\n📌 Treatment: {treatment}\n📅 Your Next Appointment: {date_str}\n\n⏰ Please arrive 5 minutes early\n📄 Bring any relevant medical documents\n\nFor any queries, contact us!\n\nBest Regards,\nOur Medical Team"
            
            email_subject = "Appointment Confirmation"
            email_body = f"Dear {name},\n\nThank you for visiting us today for {treatment}.\n\nYour next appointment is scheduled on {date_str}.\n\nPlease arrive 5 minutes early. If you need to reschedule, kindly inform us in advance.\n\nRegards,\nMedical Team"

            if phone:
                try:
                    ok, resp = send_sms(phone, sms_message)
                    db.sms_logs.insert_one({
                        "patient_id": patient_id,
                        "type": "visit_confirmation",
                        "phone": phone,
                        "message": sms_message,
                        "sent_at": datetime.datetime.utcnow(),
                        "ok": bool(ok),
                        "response": resp,
                    })
                except Exception as e:
                    db.sms_logs.insert_one({
                        "patient_id": patient_id,
                        "type": "visit_confirmation",
                        "phone": phone,
                        "sent_at": datetime.datetime.utcnow(),
                        "ok": False,
                        "error": str(e),
                    })
            
            if email:
                try:
                    send_email(email, email_subject, email_body)
                    db.sms_logs.insert_one({
                        "patient_id": patient_id,
                        "type": "visit_confirmation_email",
                        "email": email,
                        "subject": email_subject,
                        "sent_at": datetime.datetime.utcnow(),
                        "ok": True,
                    })
                except Exception as e:
                    db.sms_logs.insert_one({
                        "patient_id": patient_id,
                        "type": "visit_confirmation_email",
                        "email": email,
                        "sent_at": datetime.datetime.utcnow(),
                        "ok": False,
                        "error": str(e),
                    })
    except Exception as e:
        import traceback
        traceback.print_exc()


@patients_bp.route("/", methods=["POST"], strict_slashes=False)
@jwt_required()
def create_patient():
    try:
        data = request.get_json() or {}
        
        # Required fields
        full_name = data.get("full_name")
        whatsapp = data.get("whatsapp")
        
        if not full_name or not whatsapp:
            return jsonify({"msg": "full_name and whatsapp are required"}), 400
        
        # Generate patient ID from name and phone
        patient_id = generate_patient_id(full_name, whatsapp)
        
        # Check if patient already exists
        existing = db.patients.find_one({"patient_id": patient_id})
        if existing:
            return jsonify({
                "msg": "patient with this name and phone already exists",
                "duplicate": True,
                "patient_id": patient_id
            }), 409
        
        # Date of visit
        date_of_visit = data.get("date_of_visit") or datetime.datetime.utcnow().isoformat()
        
        # Extract treatment for next visit calculation (check both field names)
        treatment = data.get("treatment") or data.get("treatment_type") or ""
        next_visit_iso = None
        if treatment:
            next_visit_iso = compute_next_visit_date(treatment, date_of_visit)
        
        # Create visit record
        initial_visit = {
            "date_of_visit": date_of_visit,
            "doctor_notes": data.get("doctor_notes", ""),
            "doctor_advice": data.get("doctor_advice", ""),
            "treatment": data.get("treatment", ""),
            "photos": data.get("photos", []),
            "medicines": data.get("medicines", []),
            "next_visit": next_visit_iso,
            "created_at": datetime.datetime.utcnow().isoformat(),
        }
        
        # Create patient document
        patient = {
            "patient_id": patient_id,
            "full_name": full_name,
            "age": data.get("age"),
            "gender": data.get("gender"),
            "whatsapp": whatsapp,
            "email": data.get("email"),
            "medical_history": data.get("medical_history", ""),
            "current_issues": data.get("current_issues", ""),
            "visits": [initial_visit],
            "created_at": datetime.datetime.utcnow().isoformat(),
            "updated_at": datetime.datetime.utcnow().isoformat(),
        }
        
        db.patients.insert_one(patient)
        
        # Send immediate booking confirmation
        threading.Thread(target=send_booking_confirmation, args=(patient,)).start()
        
        return jsonify({"msg": "patient created", "patient_id": patient_id}), 201
        
    except Exception as e:
        import traceback
        print(f"Error in create_patient: {e}")
        traceback.print_exc()
        return jsonify({"msg": f"error: {str(e)}"}), 500


@patients_bp.route("/", methods=["GET"], strict_slashes=False)
@jwt_required()
def list_patients():
    q = {}
    name = request.args.get("name")
    whatsapp = request.args.get("whatsapp")
    patient_id = request.args.get("patient_id")
    treatment_type = request.args.get("treatment_type")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    if name:
        q["full_name"] = {"$regex": name, "$options": "i"}
    if whatsapp:
        q["whatsapp"] = whatsapp
    if patient_id:
        q["patient_id"] = patient_id
    if treatment_type:
        q["visits.treatment_type"] = treatment_type

    # TODO: date range filter can be implemented on visits.date_of_visit

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    skip = (page - 1) * per_page

    cursor = db.patients.find(q).skip(skip).limit(per_page)
    results = []
    for p in cursor:
        p["_id"] = str(p.get("_id"))
        results.append(p)

    total = db.patients.count_documents(q)
    return jsonify({"items": results, "total": total, "page": page, "per_page": per_page})


@patients_bp.route("/<patient_id>", methods=["GET"], strict_slashes=False)
@jwt_required()
def get_patient(patient_id):
    p = db.patients.find_one({"patient_id": patient_id})
    if not p:
        return jsonify({"msg": "not found"}), 404
    p["_id"] = str(p.get("_id"))
    return jsonify(p)


@patients_bp.route("/<patient_id>", methods=["PUT"], strict_slashes=False)
@jwt_required()
def update_patient(patient_id):
    data = request.get_json() or {}
    update = {"$set": {}, "$push": {}}
    # allowed to push a new visit
    next_visit_iso = None
    visit = None
    if "visit" in data:
        visit = data.get("visit")
        treatment = visit.get("treatment_type") or visit.get("treatment", "")
        date_of_visit = visit.get("date_of_visit") or datetime.datetime.utcnow().isoformat()
        if treatment:
            next_visit_iso = compute_next_visit_date(treatment, date_of_visit)
            visit["next_visit"] = next_visit_iso
            update["$set"]["next_visit"] = next_visit_iso
        update["$push"]["visits"] = visit
    # update top-level fields
    for k in ["full_name", "age", "gender", "whatsapp", "email", "medical_history", "current_issues"]:
        if k in data:
            update["$set"][k] = data[k]
    update["$set"]["updated_at"] = datetime.datetime.utcnow()

    # clean empty keys
    if not update["$push"]:
        update.pop("$push")
    if not update["$set"]:
        update.pop("$set")

    if not update:
        return jsonify({"msg": "nothing to update"}), 400

    res = db.patients.update_one({"patient_id": patient_id}, update)
    if res.matched_count == 0:
        return jsonify({"msg": "not found"}), 404

    # Send booking confirmation for new visit
    notification_sent = False
    if visit:
        threading.Thread(target=_send_visit_notification, args=(patient_id, visit, next_visit_iso)).start()
        notification_sent = True

    return jsonify({"msg": "updated", "notification_sent": notification_sent})


@patients_bp.route("/<patient_id>", methods=["DELETE"], strict_slashes=False)
@role_required(["Admin"])  # only Admin can delete
def delete_patient(patient_id):
    res = db.patients.delete_one({"patient_id": patient_id})
    if res.deleted_count == 0:
        return jsonify({"msg": "not found"}), 404
    return jsonify({"msg": "deleted"})
