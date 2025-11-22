# app/routes/prediction_routes.py
import pickle
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.database import db
from datetime import datetime
from joblib import load

prediction_bp = Blueprint("prediction", __name__)

# --------- Encoding helpers (assuming frontend sends human-readable values) ---------

def _to_bool01(v):
    s = str(v).strip().lower()
    if s in ("yes", "true", "1"): return 1
    if s in ("no", "false", "0"): return 0
    raise ValueError("must be Yes/No or true/false")

def _cat3_to_idx(v, name):
    s = str(v).strip().lower()
    mapping = {"low": 0, "normal": 1, "high": 2}
    if s not in mapping:
        raise ValueError(f"{name} must be one of Low, Normal, High")
    return mapping[s]

def _gender_to_idx(v):
    s = str(v).strip().lower()
    mapping = {"male": 0, "female": 1}
    return mapping.get(s, 0)  # default to 'male'

# Explicit model feature order (Adjust later if ML specifies a different order)
FEATURE_ORDER = [
    'Age', 'Fever_and_Cough', 'Fever_and_Fatigue', 'Fatigue_and_Cough', 
    'Fever_and_Fatigue_and_Cough', 'Disease_Frequency', 'Risk_Score', 'Age_Squared', 
    'Fever_Yes', 'Cough_Yes', 'Fatigue_Yes', 'Difficulty Breathing_Yes', 
    'Blood Pressure_Low', 'Blood Pressure_Normal', 'Cholesterol Level_Low', 
    'Cholesterol Level_Normal', 'Gender_Male', 'Age_Group_Adult', 'Age_Group_Elderly'
]

def _encode_input(profile: dict) -> dict:
    """
    Validate + normalize frontend values into all 19 numeric features the model expects.
    """
    out = {}

    # required booleans
    for k in ["fever", "cough", "fatigue", "difficulty_breathing"]:
        if k not in profile:
            raise ValueError(f"{k} is required (Yes/No)")
        out[k] = _to_bool01(profile[k])

    # required categories
    if "blood_pressure" not in profile:
        raise ValueError("blood_pressure is required (Low/Normal/High)")
    bp = _cat3_to_idx(profile["blood_pressure"], "blood_pressure")

    if "cholesterol_level" not in profile:
        raise ValueError("cholesterol_level is required (Low/Normal/High)")
    chol = _cat3_to_idx(profile["cholesterol_level"], "cholesterol_level")

    # required age
    if "age" not in profile:
        raise ValueError("age is required")
    try:
        age = int(profile["age"])
    except:
        raise ValueError("age must be an integer")

    # optional gender
    gender = _gender_to_idx(profile.get("gender", "male"))

    # Now compute all 19 features
    fever = out["fever"]
    cough = out["cough"]
    fatigue = out["fatigue"]
    difficulty_breathing = out["difficulty_breathing"]

    out["Age"] = age
    out["Fever_and_Cough"] = fever * cough
    out["Fever_and_Fatigue"] = fever * fatigue
    out["Fatigue_and_Cough"] = fatigue * cough
    out["Fever_and_Fatigue_and_Cough"] = fever * fatigue * cough
    out["Disease_Frequency"] = fever + cough + fatigue + difficulty_breathing
    out["Risk_Score"] = (fever * 0.3 + cough * 0.2 + fatigue * 0.2 + difficulty_breathing * 0.3)
    out["Age_Squared"] = age * age
    out["Fever_Yes"] = fever
    out["Cough_Yes"] = cough
    out["Fatigue_Yes"] = fatigue
    out["Difficulty Breathing_Yes"] = difficulty_breathing
    out["Blood Pressure_Low"] = 1 if bp == 0 else 0
    out["Blood Pressure_Normal"] = 1 if bp == 1 else 0
    out["Cholesterol Level_Low"] = 1 if chol == 0 else 0
    out["Cholesterol Level_Normal"] = 1 if chol == 1 else 0
    out["Gender_Male"] = 1 if gender == 0 else 0
    out["Age_Group_Adult"] = 1 if 18 <= age < 65 else 0
    out["Age_Group_Elderly"] = 1 if age >= 65 else 0

    return out

def _to_vector(encoded: dict):
    """Return a list in the FEATURE_ORDER ready for model.predict/predict_proba."""
    return [encoded[k] for k in FEATURE_ORDER]

# --------- Model loader---------

_model = None
def get_model():
    global _model
    if _model is None:
        model_path = os.path.join(
            os.path.dirname(__file__),
            "..", "ml_model", "catboost_model.pkl"
        )
        if os.path.exists(model_path):
            _model = load(model_path)
            print(f"✓ Model loaded from {model_path}")
        else:
            raise FileNotFoundError(
                f"Model not found at {model_path}. "
                "Place catboost_model.pkl in backend/app/ml_model/."
            )
    return _model

# --------- Route: /api/predict ---------

@prediction_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    """
    Uses the patient's saved profile from db.patients (by email from JWT).
    Allows request JSON to override any fields ad-hoc.
    Validates & encodes inputs, calls the model, returns label + probability.
    """
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Access denied"}), 403

    email = get_jwt_identity()

    # 1) Load stored profile (may be empty if not set yet)
    stored = db.patients.find_one({"email": email}, {"_id": 0}) or {}

    # 2) Merge request overrides (optional) onto stored profile
    overrides = request.get_json() or {}
    profile = {**stored, **overrides}

    # 3) Validate + encode
    try:
        encoded = _encode_input(profile)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    vector = _to_vector(encoded)

    # 4) Predict
    model = get_model()
    proba = model.predict_proba([vector])[0]  # [p0, p1]
    label = int(proba[1] >= 0.5) #1 = positive, 0 = negative

     # Save prediction
    pred_doc = {
        "patient_email": email,
        "features": encoded,
        "feature_order": FEATURE_ORDER,
        "result": {"label": label, "probability": float(proba[1])},
        "created_at": datetime.utcnow()
    }
    inserted = db.predictions.insert_one(pred_doc)

    # 5) Respond
    return jsonify({
        "input_used": encoded,
        "vector_order": FEATURE_ORDER,
        "result": {"label": label, "probability": float(proba[1])},
        "prediction_id": str(inserted.inserted_id)
    }), 200
