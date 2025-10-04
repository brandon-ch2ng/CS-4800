from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

doctor_bp = Blueprint("doctors", __name__)

@doctor_bp.route("/", methods=["GET"])
@jwt_required()
def doctor_dashboard():
    username = get_jwt_identity()
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return jsonify({"error": "Access denied"}), 403
    return jsonify({"message": f"Welcome doctor {username}!"})
