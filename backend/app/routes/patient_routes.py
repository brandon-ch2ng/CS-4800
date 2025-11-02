from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.database import db

patient_bp = Blueprint("patients", __name__)

# -------------------------------
# Dashboard
# -------------------------------
@patient_bp.route("/", methods=["GET"])
@jwt_required()
def patient_dashboard():
    email = get_jwt_identity()  # use email as identity
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Access denied"}), 403
    return jsonify({"message": f"Welcome patient {email}!"})


# -------------------------------
# Get patient profile
# -------------------------------
@patient_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Access denied"}), 403

    email = get_jwt_identity()
    profile = db.patients.find_one({"email": email}, {"_id": 0})
    if not profile:
        return jsonify({"message": "No profile found"}), 404

    return jsonify(profile), 200


# -------------------------------
# Create or update patient profile
# -------------------------------
@patient_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Access denied"}), 403

    email = get_jwt_identity()
    data = request.get_json() or {}

    # allowed fields for the profile
    allowed_fields = {
        "gender", "age",
        "fever", "cough", "fatigue",
        "difficulty_breathing",
        "blood_pressure", "cholesterol_level",
        "survey_completed" # if patient alr filled survey
    }
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        return jsonify({"error": "No valid fields provided"}), 400

    # MongoDB will automatically create 'patients' collection if it doesn’t exist
    db.patients.update_one(
        {"email": email},
        {"$set": {"email": email, **update_data}},
        upsert=True  # create if not exists
    )

    return jsonify({"message": "Profile saved successfully"}), 200
