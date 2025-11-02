from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app.database import db

auth_bp = Blueprint("auth", __name__)

# Register
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")  # "patient" or "doctor"

    if not all([first_name, last_name, email, password, role]):
        return jsonify({"error": "Missing required fields"}), 400
    if role not in ["patient", "doctor"]:
        return jsonify({"error": "Invalid role"}), 400

    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    hashed_pw = generate_password_hash(password)
    db.users.insert_one({
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "password": hashed_pw,
        "role": role
    })

    return jsonify({"message": f"{role.capitalize()} registered successfully"}), 201

# Login
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = db.users.find_one({"email": email})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    # Use string identity + additional claims for role
    access_token = create_access_token(
        identity=email,
        additional_claims={"role": user["role"]}
    )

    return jsonify({
        "token": access_token,
        "role": user["role"],
        "first_name": user["first_name"],
        "last_name": user["last_name"]
    }), 200

#return WHO logged in (patient or doctor)
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    email = get_jwt_identity()
    claims = get_jwt()
    user = db.users.find_one({"email": email}, {"_id": 0, "password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "email": email,
        "role": claims.get("role"),
        "first_name": user.get("first_name"),
        "last_name": user.get("last_name"),
    }), 200
