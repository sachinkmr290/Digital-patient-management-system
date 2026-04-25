from flask import Blueprint, request, jsonify
from db import db
from utils import role_required
from flask_jwt_extended import jwt_required
from bson.objectid import ObjectId
import datetime

medicines_bp = Blueprint("medicines", __name__)


@medicines_bp.route("/", methods=["GET"], strict_slashes=False)
def get_medicines():
    """Get all medicines"""
    try:
        medicines = list(db.medicines.find({}, {"_id": 1, "name": 1, "price": 1, "description": 1, "active": 1}))
        for m in medicines:
            m["_id"] = str(m.get("_id"))
        return jsonify({"medicines": medicines})
    except Exception as e:
        return jsonify({"msg": str(e)}), 500


@medicines_bp.route("/", methods=["POST"], strict_slashes=False)
@jwt_required()
@role_required(["Admin"])
def create_medicine():
    """Add a new medicine (Admin only)"""
    try:
        data = request.get_json() or {}
        
        # Validate required fields
        name = data.get("name", "").strip()
        price = data.get("price", 0)
        description = data.get("description", "").strip()
        
        if not name:
            return jsonify({"msg": "Medicine name is required"}), 400
        
        if price <= 0:
            return jsonify({"msg": "Price must be greater than 0"}), 400
        
        # Check if medicine already exists
        existing = db.medicines.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
        if existing:
            return jsonify({"msg": "Medicine already exists"}), 409
        
        medicine = {
            "name": name,
            "price": float(price),
            "description": description,
            "active": True,
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow(),
        }
        
        result = db.medicines.insert_one(medicine)
        medicine["_id"] = str(result.inserted_id)
        
        return jsonify({"msg": "Medicine created", "medicine": medicine}), 201
    
    except Exception as e:
        return jsonify({"msg": str(e)}), 500


@medicines_bp.route("/<medicine_id>", methods=["PUT"], strict_slashes=False)
@jwt_required()
@role_required(["Admin"])
def update_medicine(medicine_id):
    """Update a medicine (Admin only)"""
    try:
        data = request.get_json() or {}
        
        # Find the medicine
        medicine = db.medicines.find_one({"_id": ObjectId(medicine_id)})
        if not medicine:
            return jsonify({"msg": "Medicine not found"}), 404
        
        # Update fields
        update_fields = {}
        
        if "name" in data and data["name"].strip():
            # Check if new name already exists
            existing = db.medicines.find_one({
                "name": {"$regex": f"^{data['name'].strip()}$", "$options": "i"},
                "_id": {"$ne": ObjectId(medicine_id)}
            })
            if existing:
                return jsonify({"msg": "Medicine name already exists"}), 409
            update_fields["name"] = data["name"].strip()
        
        if "price" in data:
            if data["price"] <= 0:
                return jsonify({"msg": "Price must be greater than 0"}), 400
            update_fields["price"] = float(data["price"])
        
        if "description" in data:
            update_fields["description"] = data["description"].strip()
        
        if "active" in data:
            update_fields["active"] = bool(data["active"])
        
        if not update_fields:
            return jsonify({"msg": "Nothing to update"}), 400
        
        update_fields["updated_at"] = datetime.datetime.utcnow()
        
        result = db.medicines.update_one(
            {"_id": ObjectId(medicine_id)},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({"msg": "Medicine not found"}), 404
        
        # Fetch updated medicine
        updated = db.medicines.find_one({"_id": ObjectId(medicine_id)})
        updated["_id"] = str(updated.get("_id"))
        
        return jsonify({"msg": "Medicine updated", "medicine": updated})
    
    except Exception as e:
        return jsonify({"msg": str(e)}), 500


@medicines_bp.route("/<medicine_id>", methods=["DELETE"], strict_slashes=False)
@jwt_required()
@role_required(["Admin"])
def delete_medicine(medicine_id):
    """Delete a medicine (Admin only)"""
    try:
        result = db.medicines.delete_one({"_id": ObjectId(medicine_id)})
        
        if result.deleted_count == 0:
            return jsonify({"msg": "Medicine not found"}), 404
        
        return jsonify({"msg": "Medicine deleted"})
    
    except Exception as e:
        return jsonify({"msg": str(e)}), 500
