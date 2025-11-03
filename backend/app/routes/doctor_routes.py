from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
from bson import ObjectId
from app.database import db

doctor_bp = Blueprint("doctors", __name__)

def _require_doctor():
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Access denied"}), 403
    return None

@doctor_bp.route("/", methods=["GET"])
@jwt_required()
def doctor_dashboard():
    username = get_jwt_identity()
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Access denied"}), 403
    return jsonify({"message": f"Welcome doctor {username}!"})

@doctor_bp.route("/notes", methods=["POST"])
@jwt_required()
def add_note():
    """
    Body:
    {
      "patient_email": "<required>",
      "note": "<required>",
      "prediction_id": "<optional ObjectId string>",
      "visible_to_patient": true/false (default true)
    }
    """
    gate = _require_doctor()
    if gate: return gate

    doctor_email = get_jwt_identity()
    data = request.get_json() or {}
    patient_email = data.get("patient_email")
    note_text = data.get("note")
    prediction_id_str = data.get("prediction_id")
    visible_to_patient = bool(data.get("visible_to_patient", True))

    if not patient_email or not note_text:
        return jsonify({"error": "patient_email and note are required"}), 400

    # Ensure patient exists
    patient = db.users.find_one({"email": patient_email, "role": "patient"})
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    # Optional: validate prediction belongs to patient
    prediction_id = None
    if prediction_id_str:
        try:
            prediction_id = ObjectId(prediction_id_str)
        except Exception:
            return jsonify({"error": "Invalid prediction_id"}), 400
        if not db.predictions.find_one({"_id": prediction_id, "patient_email": patient_email}):
            return jsonify({"error": "Prediction not found for this patient"}), 404

    doc = {
        "patient_email": patient_email,
        "prediction_id": prediction_id,     # may be None
        "note": note_text,
        "visible_to_patient": visible_to_patient,
        "doctor_email": doctor_email,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    res = db.notes.insert_one(doc)

    return jsonify({"message": "Note added", "note_id": str(res.inserted_id)}), 201

@doctor_bp.route("/patients/<patient_email>/notes", methods=["GET"])
@jwt_required()
def list_notes_for_patient(patient_email):
    """Doctor-only: list all notes for a patient. Optional ?prediction_id=..."""
    gate = _require_doctor()
    if gate: return gate

    prediction_id_str = request.args.get("prediction_id")
    query = {"patient_email": patient_email}
    if prediction_id_str:
        try:
            query["prediction_id"] = ObjectId(prediction_id_str)
        except Exception:
            return jsonify({"error": "Invalid prediction_id"}), 400

    notes = list(db.notes.find(query).sort("created_at", -1))
    for n in notes:
        n["_id"] = str(n["_id"])
        if n.get("prediction_id"):
            n["prediction_id"] = str(n["prediction_id"])
    return jsonify({"notes": notes}), 200

@doctor_bp.route("/predictions/<prediction_id>/notes", methods=["GET"])
@jwt_required()
def list_notes_for_prediction(prediction_id):
    """Doctor-only: list notes tied to a specific prediction."""
    gate = _require_doctor()
    if gate: return gate

    try:
        pid = ObjectId(prediction_id)
    except Exception:
        return jsonify({"error": "Invalid prediction_id"}), 400

    notes = list(db.notes.find({"prediction_id": pid}).sort("created_at", -1))
    for n in notes:
        n["_id"] = str(n["_id"])
        if n.get("prediction_id"):
            n["prediction_id"] = str(n["prediction_id"])
    return jsonify({"notes": notes}), 200