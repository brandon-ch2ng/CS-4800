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
        "blood_pressure", "cholesterol_level"
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


# -------------------------------
# Get Patient note list
# -------------------------------

@patient_bp.route("/notes", methods=["GET"])
@jwt_required()
def my_notes():
    """
    Patient: view doctor notes about themselves that are visible_to_patient=True
    Optional query: ?prediction_id=<ObjectId>
    """
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Access denied"}), 403

    email = get_jwt_identity()
    q = {"patient_email": email, "visible_to_patient": True}

    prediction_id_str = request.args.get("prediction_id")
    if prediction_id_str:
        try:
            q["prediction_id"] = ObjectId(prediction_id_str)
        except Exception:
            return jsonify({"error": "Invalid prediction_id"}), 400

    notes = list(db.notes.find(q).sort("created_at", -1))
    for n in notes:
        n["_id"] = str(n["_id"])
        if n.get("prediction_id"):
            n["prediction_id"] = str(n["prediction_id"])
    return jsonify({"notes": notes}), 200


# -------------------------------
# Get a single note
# -------------------------------

@patient_bp.route("/notes/<note_id>", methods=["GET"])
@jwt_required()
def my_single_note(note_id):
    """Patient: view a single visible note by id."""
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Access denied"}), 403

    email = get_jwt_identity()
    try:
        _id = ObjectId(note_id)
    except Exception:
        return jsonify({"error": "Invalid note_id"}), 400

    note = db.notes.find_one({"_id": _id, "patient_email": email, "visible_to_patient": True})
    if not note:
        return jsonify({"error": "Note not found"}), 404

    note["_id"] = str(note["_id"])
    if note.get("prediction_id"):
        note["prediction_id"] = str(note["prediction_id"])
    return jsonify({"note": note}), 200