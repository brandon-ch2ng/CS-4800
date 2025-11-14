import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME")

client = MongoClient(mongo_uri)
db = client[db_name]

patient_email = "hanah0201@gmail.com"  # Replace with actual patient email
predictions = list(db.predictions.find({"patient_email": patient_email}))

print(f"Found {len(predictions)} predictions for {patient_email}:\n")
for p in predictions:
    print(f"ID: {p['_id']}")
    print(f"Label: {p['result']['label']}, Probability: {p['result']['probability']:.2f}")
    print(f"Created: {p['created_at']}\n")