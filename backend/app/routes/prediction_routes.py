# app/routes/prediction_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.database import db
from datetime import datetime
# from joblib import load  # use when ML dev provides a model file

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
    "fever", "cough", "fatigue", "difficulty_breathing",
    "blood_pressure", "cholesterol_level",
    "age", "gender"
]

def _encode_input(profile: dict) -> dict:
    """
    Validate + normalize frontend values into numeric features the model expects.
    Raises ValueError with a clear message if something is wrong.
    """
    out = {}

    # required booleans (Yes/No or true/false)
    for k in ["fever", "cough", "fatigue", "difficulty_breathing"]:
        if k not in profile:
            raise ValueError(f"{k} is required (Yes/No)")
        out[k] = _to_bool01(profile[k])

    # required categories (Low/Normal/High)
    if "blood_pressure" not in profile:
        raise ValueError("blood_pressure is required (Low/Normal/High)")
    out["blood_pressure"] = _cat3_to_idx(profile["blood_pressure"], "blood_pressure")

    if "cholesterol_level" not in profile:
        raise ValueError("cholesterol_level is required (Low/Normal/High)")
    out["cholesterol_level"] = _cat3_to_idx(profile["cholesterol_level"], "cholesterol_level")

    # required age (int)
    if "age" not in profile:
        raise ValueError("age is required")
    try:
        out["age"] = int(profile["age"])
    except Exception:
        raise ValueError("age must be an integer")

    # optional gender (Male/Female)
    out["gender"] = _gender_to_idx(profile.get("gender"))

    return out

def _to_vector(encoded: dict):
    """Return a list in the FEATURE_ORDER ready for model.predict/predict_proba."""
    return [encoded[k] for k in FEATURE_ORDER]

# --------- Model loader. REPLACE THE CODE BELOW WITH REAL ML MODEL. ---------

_model = None
def get_model():
    global _model
    if _model is None:
        # Example: replace with actual model
        # _model = load("model.pkl")
        class _Dummy:
            def predict_proba(self, X):
                # Return [[p0, p1], ...]; fake p1=0.65 for demo
                return [[0.35, 0.65] for _ in X]
            def predict(self, X):
                return [1 for _ in X]
        _model = _Dummy()
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
    label = int(proba[1] >= 0.5)

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
