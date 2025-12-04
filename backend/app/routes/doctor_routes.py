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
    email = get_jwt_identity()
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Access denied"}), 403
    return jsonify({"message": f"Welcome doctor {email}!"})


# add a note 
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

    # validate prediction belongs to patient
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
        "prediction_id": prediction_id, # may be None
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


# delete a note
@doctor_bp.route("/notes/<note_id>", methods=["DELETE"])
@jwt_required() #Any attempt to access that route without a valid JWT in the request will be blocked
def delete_note(note_id):
    """Delete a note by ID. Only the doctor who created it can delete it."""
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Access denied"}), 403
    
    doctor_email = get_jwt_identity()

    try:
        note_object_id = ObjectId(note_id)
    except Exception:
        return jsonify({"error": "Invalid note ID"}), 400

    # Find the note
    note = db.notes.find_one({"_id": note_object_id})

    if not note:
        return jsonify({"error": "Note not found"}), 404

    # Check if doctor owns/wrote this note
    if note.get("doctor_email") != doctor_email:
        return jsonify({"error": "You can only delete your own notes"}), 403

    # Delete the note
    result = db.notes.delete_one({"_id": note_object_id})

    if result.deleted_count == 0:
        return jsonify({"error": "Failed to delete note"}), 500
    
    return jsonify({
        "message": "Note deleted successfully",
        "deleted_id": note_id
    }), 200


# -------------------------
# DOCTOR: list my patients
# -------------------------
@doctor_bp.get("/patients")
@jwt_required()
def my_patients():
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Access denied"}), 403

    doc_email = get_jwt_identity()
    # Distinct patient emails who requested appointments with this doctor
    emails = db.appointments.distinct("patient_email", {"doctor_email": doc_email})
    if not emails:
        return jsonify({"items": []})

    # Pull basic profile info from patients + names from users
    profiles = {p.get("email"): p for p in db.patients.find({"email": {"$in": emails}}, {"_id": 0})}
    users = {u.get("email"): u for u in db.users.find({"email": {"$in": emails}}, {"_id": 0, "password": 0})}

    items = []
    for e in emails:
        u = users.get(e, {})
        p = profiles.get(e, {})
        items.append({
            "email": e,
            "first_name": u.get("first_name"),
            "last_name": u.get("last_name"),
            "gender": p.get("gender"),
            "age": p.get("age"),
        })
    return jsonify({"items": items})


# -------------------------
# DOCTOR: view a patient's profile
# -------------------------
@doctor_bp.get("/patient-profile")
@jwt_required()
def patient_profile_by_email():
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Access denied"}), 403

    target = request.args.get("email")
    if not target:
        return jsonify({"error": "email query param required"}), 400

    # Merge user + patient (hide password)
    user = db.users.find_one({"email": target}, {"_id": 0, "password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    profile = db.patients.find_one({"email": target}, {"_id": 0}) or {}

    return jsonify({
        "user": user, # first_name, last_name, email, role
        "profile": profile # gender, age, symptoms, etc.
    })