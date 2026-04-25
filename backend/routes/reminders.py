from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from utils import role_required
from reminders import find_and_send_reminders

reminders_bp = Blueprint("reminders", __name__)


@reminders_bp.route("/run", methods=["POST"])
@jwt_required()
@role_required(["Admin", "Receptionist"])  # allow admin and receptionists to trigger
def run_reminders():
    res = find_and_send_reminders()
    return jsonify(res)
