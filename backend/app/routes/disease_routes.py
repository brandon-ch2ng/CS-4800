from flask import Blueprint, request, jsonify
from app.database import db

disease_bp = Blueprint("disease_catalog", __name__)

@disease_bp.get("/")
def list_diseases():
    q = (request.args.get("q") or "").strip()
    page = int(request.args.get("page", 1))
    limit = min(int(request.args.get("limit", 20)), 100)
    skip = (page - 1) * limit

    query = {}
    if q:
        query = {"$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"code": {"$regex": q, "$options": "i"}},
            {"tags": {"$elemMatch": {"$regex": q, "$options": "i"}}},
        ]}

    items = list(db.diseases.find(query, {"_id": 0}).skip(skip).limit(limit).sort("name", 1))
    total = db.diseases.count_documents(query)
    return jsonify({"items": items, "page": page, "limit": limit, "total": total})

@disease_bp.get("/<code>")
def get_disease(code):
    doc = db.diseases.find_one({"code": code}, {"_id": 0})
    if not doc:
        return jsonify({"error": "Not found"}), 404
    return jsonify(doc)
