from flask import Blueprint, jsonify
from app.blockchain import blockchain  # import the global instance

blockchain_bp = Blueprint("blockchain", __name__, url_prefix="/blockchain")


@blockchain_bp.get("/")
def get_blockchain():
    """
    View the entire blockchain.
    """
    return jsonify(blockchain.to_list()), 200


@blockchain_bp.get("/valid")
def validate_blockchain():
    """
    Check if the chain is still valid (no tampering).
    """
    return jsonify({"valid": blockchain.is_valid()}), 200