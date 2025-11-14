from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.database import db
from datetime import datetime, timezone
from bson import ObjectId

appointment_bp = Blueprint("appointments", __name__)

def _now(): return datetime.now(timezone.utc).isoformat()

def _serialize_appt(doc):
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

# -------------------------
# PATIENT: create request
# -------------------------
@appointment_bp.post("/")
@jwt_required()
def create_appointment():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Access denied"}), 403

    patient_email = get_jwt_identity()
    body = request.get_json() or {}
    doctor_email = (body.get("doctor_email") or "").strip().lower()
    requested_time = (body.get("requested_time") or "").strip()  # ISO8601 string preferred
    reason = (body.get("reason") or "").strip()

    if not doctor_email or not requested_time:
        return jsonify({"error": "doctor_email and requested_time are required"}), 400

    doc = {
        "patient_email": patient_email,
        "doctor_email": doctor_email,
        "requested_time": requested_time, # frontend sends ISO (YYYY-MM-DD)?
        "reason": reason or None,
        "status": "pending", # pending | accepted | rejected
        "created_at": _now(),
        "updated_at": _now(),
    }
    ins = db.appointments.insert_one(doc)
    return jsonify({"message": "Appointment requested", "appointment_id": str(ins.inserted_id)}), 201


# -------------------------
# PATIENT: my requests
# -------------------------
@appointment_bp.get("/mine")
@jwt_required()
def my_appointments():
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Access denied"}), 403

    email = get_jwt_identity()
    cursor = db.appointments.find(
        {"patient_email": email},
        {"patient_email": 1, "doctor_email": 1, "requested_time": 1,
         "reason": 1, "status": 1, "created_at": 1, "updated_at": 1}
    ).sort("created_at", -1)

    items = [_serialize_appt(d) for d in cursor]
    return jsonify({"items": items})


# -------------------------
# DOCTOR: incoming requests
# -------------------------
@appointment_bp.get("/incoming")
@jwt_required()
def incoming_appointments():
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Access denied"}), 403

    email = get_jwt_identity()
    status = request.args.get("status")
    q = {"doctor_email": email}
    if status in {"pending", "accepted", "rejected"}:
        q["status"] = status

    cursor = db.appointments.find(
        q,
        {"patient_email": 1, "doctor_email": 1, "requested_time": 1,
         "reason": 1, "status": 1, "created_at": 1, "updated_at": 1}
    ).sort("created_at", -1)

    items = [_serialize_appt(d) for d in cursor]
    return jsonify({"items": items})

# -------------------------
# DOCTOR: accept / reject
# -------------------------
@appointment_bp.patch("/<appointment_id>/status")
@jwt_required()
def update_status(appointment_id):
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Access denied"}), 403

    email = get_jwt_identity()
    body = request.get_json() or {}
    new_status = (body.get("status") or "").strip().lower()  # accepted/rejected
    if new_status not in {"accepted", "rejected"}:
        return jsonify({"error": "status must be 'accepted' or 'rejected'"}), 400

    try:
        _id = ObjectId(appointment_id)
    except Exception:
        return jsonify({"error": "invalid appointment id"}), 400

    res = db.appointments.update_one(
        {"_id": _id, "doctor_email": email},
        {"$set": {"status": new_status, "updated_at": _now()}}
    )
    if res.matched_count == 0:
        return jsonify({"error": "Not found"}), 404

    return jsonify({"message": f"Appointment {new_status}"}), 200