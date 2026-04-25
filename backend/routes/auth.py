from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from db import db
import datetime

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    full_name = data.get("full_name", "")
    role = data.get("role", "Receptionist")
    if not username or not password:
        return jsonify({"msg": "username and password required"}), 400
    if db.users.find_one({"username": username}):
        return jsonify({"msg": "user exists"}), 400
    hashed = generate_password_hash(password)
    user = {
        "username": username,
        "password": hashed,
        "full_name": full_name,
        "role": role,
        "created_at": datetime.datetime.utcnow()
    }
    db.users.insert_one(user)
    return jsonify({"msg": "user created"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"msg": "username and password required"}), 400
    user = db.users.find_one({"username": username})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"msg": "invalid credentials"}), 401
    # identity MUST be a string, not a dict. Use additional_claims for extra data like role
    access_token = create_access_token(
        identity=username,
        additional_claims={"role": user.get("role")},
        expires_delta=datetime.timedelta(hours=12)
    )
    return jsonify({"access_token": access_token})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    return jsonify({"user": identity})
