from pymongo import MongoClient

MONGO_URI = "mongodb+srv://............"

client = MongoClient(MONGO_URI)
db = client["patientDB"]

print("Collections:", db.list_collection_names())
