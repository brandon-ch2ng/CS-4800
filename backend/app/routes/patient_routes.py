from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

patient_bp = Blueprint("patients", __name__)

@patient_bp.route("/", methods=["GET"])
@jwt_required()
def patient_dashboard():
    username = get_jwt_identity()   # string username
    claims = get_jwt()              # dict with role
    if claims.get("role") != "patient":
        return jsonify({"error": "Access denied"}), 403
    return jsonify({"message": f"Welcome patient {username}!"})

