from flask import Blueprint, request, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

try:
    import cloudinary
    import cloudinary.uploader
except Exception:
    cloudinary = None

if cloudinary:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    )

uploads_bp = Blueprint("uploads", __name__)


@uploads_bp.route("/", methods=["POST"])
def upload_file():
    if cloudinary is None:
        return jsonify({"msg": "cloudinary library not installed"}), 500
    if "file" not in request.files:
        return jsonify({"msg": "file required"}), 400
    f = request.files["file"]
    try:
        res = cloudinary.uploader.upload(f, folder="dpms")
        return jsonify({"url": res.get("secure_url"), "public_id": res.get("public_id")})
    except Exception as e:
        return jsonify({"msg": "upload failed", "error": str(e)}), 500
