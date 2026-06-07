from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
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
@jwt_required()   # FIX 4: Protect upload endpoint — prevents anonymous quota drain
def upload_file():
    if cloudinary is None:
        return jsonify({"msg": "cloudinary library not installed"}), 500
    if "file" not in request.files:
        return jsonify({"msg": "file required"}), 400
    f = request.files["file"]
    resource_type = "auto"
    transformation = None

    # Apply image optimisations only for image uploads
    if f.content_type and f.content_type.startswith("image/"):
        # FIX 4: Compress + convert to WebP + cap width — saves 50-70% storage
        transformation = [
            {"quality": "auto:good"},          # auto compression
            {"fetch_format": "auto"},           # serve as WebP in supporting browsers
            {"width": 1200, "crop": "limit"},   # cap max dimension
        ]

    try:
        upload_opts = {
            "folder": "dpms",
            "resource_type": resource_type,
            "tags": ["dpms", "patient-record"],
        }
        if transformation:
            upload_opts["transformation"] = transformation

        res = cloudinary.uploader.upload(f, **upload_opts)
        return jsonify({
            "url": res.get("secure_url"),
            "public_id": res.get("public_id"),
            "resource_type": res.get("resource_type"),
        })
    except Exception as e:
        return jsonify({"msg": "upload failed", "error": str(e)}), 500
