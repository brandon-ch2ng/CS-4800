# scripts/seed_diseases.py
# Run this once: python -m scripts.seed_diseases
from app.database import db

DISEASES = [
    {
        "code": "HTN",
        "name": "Hypertension",
        "description": "Chronically elevated blood pressure.",
        "symptoms": ["Headache", "Dizziness", "Often asymptomatic"],
        "risk_factors": ["Obesity", "Smoking", "Family history"],
        "treatments": ["Lifestyle modification", "ACE inhibitors"],
        "tags": ["cardio", "bp"]
    },
    {
        "code": "DM2",
        "name": "Type 2 Diabetes Mellitus",
        "description": "Insulin resistance with hyperglycemia.",
        "symptoms": ["Polyuria", "Polydipsia", "Blurred vision"],
        "risk_factors": ["Obesity", "Sedentary lifestyle", "Age"],
        "treatments": ["Diet", "Exercise", "Metformin"],
        "tags": ["endocrine", "glucose"]
    },
    {
        "code": "ASTH",
        "name": "Asthma",
        "description": "Chronic airway inflammation with reversible obstruction.",
        "symptoms": ["Wheezing", "Cough", "Shortness of breath"],
        "risk_factors": ["Allergens", "Family history", "Smoking"],
        "treatments": ["Inhaled corticosteroids", "SABAs"],
        "tags": ["respiratory"]
    },
]

def seed():
    for d in DISEASES:
        db.diseases.update_one({"code": d["code"]}, {"$set": d}, upsert=True)
    print(f"Seeded {len(DISEASES)} diseases.")

if __name__ == "__main__":
    seed()
