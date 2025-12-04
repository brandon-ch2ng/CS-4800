# app/routes/prediction_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.database import db
from datetime import datetime
import os
import json
import pandas as pd
import numpy as np
from joblib import load

prediction_bp = Blueprint("prediction", __name__)

# -------------------- Input normalization helpers --------------------

def _yn_str(v):
    """Normalize Yes/No-ish to canonical 'Yes' or 'No' (string)."""
    s = str(v).strip().lower()
    if s in ("yes", "true", "1"):  return "Yes"
    if s in ("no", "false", "0"):  return "No"
    raise ValueError("must be Yes/No or true/false")

def _cat_low_normal_high(v, name):
    s = str(v).strip().lower()
    mapping = {"low": "Low", "normal": "Normal", "high": "High"}
    if s not in mapping:
        raise ValueError(f"{name} must be one of Low, Normal, High")
    return mapping[s]

def _gender_str(v):
    if v is None:
        return "Male"  # preserve earlier default
    s = str(v).strip().lower()
    if s in ("male", "m"): return "Male"
    if s in ("female", "f"): return "Female"
    return "Male"  # default

# -------------------- Paths, model, and optional artifacts --------------------

_model = None
_feature_cols = None
_scaler = None
_scaler_cols = None

def _model_dir():
    # model/scaler are one folder up, in ml_model/
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(here, "..", "ml_model"))

def get_model():
    global _model
    if _model is None:
        path = os.path.join(_model_dir(), "catboost_model.pkl")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found at {path}")
        _model = load(path)
    return _model

def get_feature_columns():
    """Optionally enforce training column order from feature_columns.json."""
    global _feature_cols
    if _feature_cols is None:
        jpath = os.path.join(_model_dir(), "feature_columns.json")
        if os.path.exists(jpath):
            with open(jpath, "r") as f:
                cols = json.load(f)
            if not isinstance(cols, list):
                raise ValueError("feature_columns.json must be a JSON list of column names")
            _feature_cols = cols
        else:
            _feature_cols = None
    return _feature_cols

def get_scaler():
    """Optionally load a fitted scaler saved during training as scaler.pkl."""
    global _scaler
    if _scaler is None:
        spath = os.path.join(_model_dir(), "scaler.pkl")
        if os.path.exists(spath):
            _scaler = load(spath)
        else:
            _scaler = None
    return _scaler

def get_scaler_columns():
    """
    Optionally load explicit column order used to fit the scaler
    (recommended). If scaler_columns.json is absent, we fall back to
    the common set: ["Age","Age_Squared","Disease_Frequency","Risk_Score"].
    """
    global _scaler_cols
    if _scaler_cols is None:
        cpath = os.path.join(_model_dir(), "scaler_columns.json")
        if os.path.exists(cpath):
            with open(cpath, "r") as f:
                cols = json.load(f)
            if not isinstance(cols, list):
                raise ValueError("scaler_columns.json must be a JSON list of column names")
            _scaler_cols = cols
        else:
            _scaler_cols = ["Age", "Age_Squared", "Disease_Frequency", "Risk_Score"]
    return _scaler_cols

# -------------------- Build raw single-row DataFrame --------------------

def _build_input_df(profile: dict) -> pd.DataFrame:
    """
    Build a single-row DataFrame with raw, human-readable fields named
    to match the preprocessing spec.
    """
    required_yn = ["fever", "cough", "fatigue", "difficulty_breathing"]
    for k in required_yn:
        if k not in profile:
            raise ValueError(f"{k} is required (Yes/No)")
    if "blood_pressure" not in profile:
        raise ValueError("blood_pressure is required (Low/Normal/High)")
    if "cholesterol_level" not in profile:
        raise ValueError("cholesterol_level is required (Low/Normal/High)")
    if "age" not in profile:
        raise ValueError("age is required")

    try:
        age = int(profile["age"])
    except Exception:
        raise ValueError("age must be an integer")

    Fever = _yn_str(profile["fever"])
    Cough = _yn_str(profile["cough"])
    Fatigue = _yn_str(profile["fatigue"])
    Difficulty_Breathing = _yn_str(profile["difficulty_breathing"])
    Blood_Pressure = _cat_low_normal_high(profile["blood_pressure"], "blood_pressure")
    Cholesterol_Level = _cat_low_normal_high(profile["cholesterol_level"], "cholesterol_level")
    Gender = _gender_str(profile.get("gender"))

    df = pd.DataFrame([{
        "Fever": Fever,
        "Cough": Cough,
        "Fatigue": Fatigue,
        "Difficulty Breathing": Difficulty_Breathing,
        "Blood Pressure": Blood_Pressure,
        "Cholesterol Level": Cholesterol_Level,
        "Age": age,
        "Gender": Gender
    }])

    return df

# -------------------- Preprocessing / Feature Engineering --------------------

def _engineer_and_encode(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply the specified preprocessing. Training-only parts that require
    columns we don't have at inference (e.g., Disease, Outcome Variable)
    are skipped; we handle column alignment later.
    """
    # Logical interactions (as booleans first)
    df["Fever_and_Cough"] = (df["Fever"] == "Yes") & (df["Cough"] == "Yes")
    df["Fever_and_Fatigue"] = (df["Fever"] == "Yes") & (df["Fatigue"] == "Yes")
    df["Fatigue_and_Cough"] = (df["Fatigue"] == "Yes") & (df["Cough"] == "Yes")
    df["Fever_and_Fatigue_and_Cough"] = (
        (df["Fever"] == "Yes") & (df["Fatigue"] == "Yes") & (df["Cough"] == "Yes")
    )

    # Disease_Frequency requires dataset counts at training time — not available here.
    # If your model expects this column, include it when aligning columns (it will be 0).
    # df["Disease_Frequency"] = np.nan  # (optional placeholder before dummies)

    # Age group binning
    bins = [0, 18, 65, float("inf")]
    labels = ["Child", "Adult", "Elderly"]
    df["Age_Group"] = pd.cut(df["Age"], bins=bins, labels=labels, right=False)

    # Risk score + Age squared
    df["Risk_Score"] = df["Age"] * 0.1 + (df["Cholesterol Level"] == "High") * 10
    df["Age_Squared"] = df["Age"] ** 2

    # One-hot encode selected categoricals with drop_first=True
    dfd = pd.get_dummies(
        df,
        columns=[
            "Fever",
            "Cough",
            "Fatigue",
            "Difficulty Breathing",
            "Blood Pressure",
            "Cholesterol Level",
            "Gender",
            "Age_Group",
        ],
        drop_first=True,
    )

    # Rename disease columns if they exist (safe no-op)
    dfd.rename(columns={
        "Disease_Alzheimer's Disease": "Disease_Alzheimers_Disease",
        "Disease_Anxiety Disorders": "Disease_Anxiety_Disorders",
        "Disease_Autism Spectrum Disorder (ASD)": "Disease_Autism_Spectrum_Disorder",
        "Disease_Bipolar Disorder": "Disease_Bipolar_Disorder",
        "Disease_Bladder Cancer": "Disease_Bladder_Cancer",
        "Disease_Brain Tumor": "Disease_Brain_Tumor",
        "Disease_Breast Cancer": "Disease_Breast_Cancer",
        "Disease_Cerebral Palsy": "Disease_Cerebral_Palsy",
        "Disease_Chronic Kidney Disease": "Disease_Chronic_Kidney_Disease",
        "Disease_Chronic Obstructive Pulmonary Disease (COPD)": "Disease_Chronic_Obstructive_Pulmonary_Disease",
        "Disease_Chronic Obstructive Pulmonary...": "Disease_Chronic_Obstructive_Pulmonary_Disease_COPD",
        "Disease_Colorectal Cancer": "Disease_Colorectal_Cancer",
        "Disease_Common Cold": "Disease_Common_Cold",
        "Disease_Conjunctivitis (Pink Eye)": "Disease_Conjunctivitis_Pink_Eye",
        "Disease_Coronary Artery Disease": "Disease_Coronary_Artery_Disease",
        "Disease_Crohn's Disease": "Disease_Crohns_Disease",
        "Disease_Cystic Fibrosis": "Disease_Cystic_Fibrosis",
        "Disease_Dengue Fever": "Disease_Dengue_Fever",
        "Disease_Down Syndrome": "Disease_Down_Syndrome",
        "Disease_Eating Disorders (Anorexia,...": "Disease_Eating_Disorders_Anorexia",
        "Disease_Ebola Virus": "Disease_Ebola_Virus",
        "Disease_Esophageal Cancer": "Disease_Esophageal_Cancer",
        "Disease_Hypertensive Heart Disease": "Disease_Hypertensive_Heart_Disease",
        "Disease_Kidney Cancer": "Disease_Kidney_Cancer",
        "Disease_Kidney Disease": "Disease_Kidney_Disease",
        "Disease_Klinefelter Syndrome": "Disease_Klinefelter_Syndrome",
        "Disease_Liver Cancer": "Disease_Liver_Cancer",
        "Disease_Liver Disease": "Disease_Liver_Disease",
        "Disease_Lung Cancer": "Disease_Lung_Cancer",
        "Disease_Lyme Disease": "Disease_Lyme_Disease",
        "Disease_Marfan Syndrome": "Disease_Marfan_Syndrome",
        "Disease_Multiple Sclerosis": "Disease_Multiple_Sclerosis",
        "Disease_Muscular Dystrophy": "Disease_Muscular_Dystrophy",
        "Disease_Myocardial Infarction (Heart...": "Disease_Myocardial_Infarction_Heart",
        "Disease_Obsessive-Compulsive Disorde...": "Disease_Obsessive_Compulsive_Disorder",
        "Disease_Otitis Media (Ear Infection)": "Disease_Otitis_Media_Ear_Infection",
        "Disease_Ovarian Cancer": "Disease_Ovarian_Cancer",
        "Disease_Pancreatic Cancer": "Disease_Pancreatic_Cancer",
        "Disease_Parkinson's Disease": "Disease_Parkinsons_Disease",
        "Disease_Pneumocystis Pneumonia (PCP)": "Disease_Pneumocystis_Pneumonia_PCP",
        "Disease_Polycystic Ovary Syndrome (PCOS)": "Disease_Polycystic_Ovary_Syndrome_PCOS",
        "Disease_Prader-Willi Syndrome": "Disease_Prader_Willi_Syndrome",
        "Disease_Prostate Cancer": "Disease_Prostate_Cancer",
        "Disease_Rheumatoid Arthritis": "Disease_Rheumatoid_Arthritis",
        "Disease_Sickle Cell Anemia": "Disease_Sickle_Cell_Anemia",
        "Disease_Sleep Apnea": "Disease_Sleep_Apnea",
        "Disease_Spina Bifida": "Disease_Spina_Bifida",
        "Disease_Systemic Lupus Erythematosus...": "Disease_Systemic_Lupus_Erythematosus",
        "Disease_Testicular Cancer": "Disease_Testicular_Cancer",
        "Disease_Thyroid Cancer": "Disease_Thyroid_Cancer",
        "Disease_Tourette Syndrome": "Disease_Tourette_Syndrome",
        "Disease_Turner Syndrome": "Disease_Turner_Syndrome",
        "Disease_Typhoid Fever": "Disease_Typhoid_Fever",
        "Disease_Ulcerative Colitis": "Disease_Ulcerative_Colitis",
        "Disease_Urinary Tract Infection": "Disease_Urinary_Tract_Infection",
        "Disease_Urinary Tract Infection (UTI)": "Disease_Urinary_Tract_Infection_UTI",
        "Disease_Williams Syndrome": "Disease_Williams_Syndrome",
        "Disease_Zika Virus": "Disease_Zika_Virus"
    }, inplace=True)

    # Encode boolean interaction flags as 0/1
    for col in ["Fever_and_Cough", "Fever_and_Fatigue", "Fatigue_and_Cough", "Fever_and_Fatigue_and_Cough"]:
        if col in dfd.columns:
            dfd[col] = dfd[col].astype(int)

    # Ensure 'Disease' is not present (training-only)
    if "Disease" in dfd.columns:
        dfd.drop("Disease", axis=1, inplace=True)

    return dfd

def _align_to_training_columns(dfd: pd.DataFrame) -> pd.DataFrame:
    """
    Align the feature frame to training-time columns if feature_columns.json is present.
    Missing columns are added (zeros); extras are dropped; order is enforced.
    """
    feature_cols = get_feature_columns()
    if feature_cols is None:
        return dfd

    for c in feature_cols:
        if c not in dfd.columns:
            dfd[c] = 0

    dfd = dfd[feature_cols]
    return dfd

def _apply_optional_scaling(dfd: pd.DataFrame) -> pd.DataFrame:
    """
    If a scaler.pkl exists (meaning you trained with scaling), apply scaler.transform
    to the configured columns (from scaler_columns.json, or default list).
    """
    scaler = get_scaler()
    if scaler is None:
        return dfd  # no scaling used during training

    cols = get_scaler_columns()
    # Only scale columns that are actually present post-alignment
    cols_to_scale = [c for c in cols if c in dfd.columns]
    if not cols_to_scale:
        return dfd

    # Ensure column order matches what scaler expects (if you saved it)
    X = dfd[cols_to_scale].values
    try:
        Xs = scaler.transform(X)
    except Exception as e:
        raise ValueError(f"scaler.transform failed on columns {cols_to_scale}: {e}")

    dfd.loc[:, cols_to_scale] = Xs
    return dfd

# -------------------- Route: /api/predict --------------------

@prediction_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    """
    Uses the patient's saved profile from db.patients (by email from JWT).
    Request JSON may override fields ad-hoc.
    Runs full preprocessing/feature engineering (+ optional scaling) and CatBoost inference.
    """
    claims = get_jwt()
    if claims.get("role") != "patient":
        return jsonify({"error": "Access denied"}), 403

    email = get_jwt_identity()

    # 1) Load stored profile (may be empty)
    stored = db.patients.find_one({"email": email}, {"_id": 0}) or {}

    # 2) Merge request overrides
    overrides = request.get_json() or {}
    profile = {**stored, **overrides}

    # 3) Validate + normalize → DataFrame → engineer → align → (optional) scale
    try:
        raw_df = _build_input_df(profile)
        feat_df = _engineer_and_encode(raw_df)
        feat_df = _align_to_training_columns(feat_df)
        feat_df = _apply_optional_scaling(feat_df)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"preprocessing failed: {e}"}), 400

    # 4) Predict with CatBoost
    try:
        model = get_model()
        proba_vec = model.predict_proba(feat_df)
        # CatBoost usually returns [ [p0, p1] ]
        if hasattr(proba_vec, "__len__") and len(proba_vec) > 0:
            proba = proba_vec[0]
            if hasattr(proba, "__len__") and len(proba) == 2:
                p1 = float(proba[1])
            else:
                p1 = float(proba)  # some APIs return only positive-class prob
        else:
            # Fallback to predict raw then map to prob if needed (here just 0/1)
            pred = model.predict(feat_df)
            p1 = float(pred[0]) if hasattr(pred, "__len__") else float(pred)

        label = int(p1 >= 0.5)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"inference failed: {e}"}), 500

    # 5) Save prediction
    pred_doc = {
        "patient_email": email,
        "raw_input": {
            "Fever": raw_df.loc[0, "Fever"],
            "Cough": raw_df.loc[0, "Cough"],
            "Fatigue": raw_df.loc[0, "Fatigue"],
            "Difficulty Breathing": raw_df.loc[0, "Difficulty Breathing"],
            "Blood Pressure": raw_df.loc[0, "Blood Pressure"],
            "Cholesterol Level": raw_df.loc[0, "Cholesterol Level"],
            "Age": int(raw_df.loc[0, "Age"]),
            "Gender": raw_df.loc[0, "Gender"],
        },
        "features_used": list(feat_df.columns),
        "feature_vector": feat_df.iloc[0].to_dict(),
        "result": {"label": label, "probability": p1},
        "created_at": datetime.utcnow(),
    }
    inserted = db.predictions.insert_one(pred_doc)

    # 6) Respond
    return jsonify({
        "input_used": pred_doc["raw_input"],
        "features_generated": pred_doc["features_used"],
        "result": {"label": label, "probability": p1},
        "prediction_id": str(inserted.inserted_id)
    }), 200
