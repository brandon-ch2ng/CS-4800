import os
from dotenv import load_dotenv
from pymongo import MongoClient
from joblib import load
from datetime import datetime

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME")

client = MongoClient(mongo_uri)
db = client[db_name]

# Load model to get disease class names
model_path = os.path.join(
    os.path.dirname(__file__),
    "app", "ml_model", "catboost_model.pkl"
)
model = load(model_path)
disease_classes = dict(enumerate(model.classes_))

patient_email = "hanah0201@gmail.com"
predictions = list(db.predictions.find({"patient_email": patient_email}).sort("created_at", -1))

print(f"=== Prediction History for {patient_email} ===\n")
for p in predictions:
    disease_idx = p['result']['label']
    disease_name = disease_classes.get(disease_idx, "Unknown")
    prob = p['result']['probability']
    timestamp = p['created_at'].strftime("%B %d, %Y at %I:%M %p") if isinstance(p['created_at'], datetime) else p['created_at']
    
    print(f"Date: {timestamp}")
    print(f"Disease: {disease_name}")
    print(f"Confidence: {prob*100:.1f}%")
    print("---\n")