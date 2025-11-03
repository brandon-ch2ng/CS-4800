from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def init_indexes():
    """
    Create helpful indexes (MongoDB will auto-skip if they already exist).
    This ensures:
    - No two users can have the same email.
    - Quick lookups by email in the patients collection.
    """
    try:
        db.users.create_index("email", unique=True)
        db.patients.create_index("email")
        
        # Predictions (list by patient, newest first)
        db.predictions.create_index([("patient_email", 1), ("created_at", -1)])

        # Notes (list by patient, newest first; and by prediction)
        db.notes.create_index([("patient_email", 1), ("created_at", -1)])
        db.notes.create_index([("prediction_id", 1)])

        print("Indexes ensured for 'users', 'patients', 'predictions', and 'notes'.")
    except Exception as e:
        print("Error creating indexes:", e)