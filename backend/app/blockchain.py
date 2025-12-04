import hashlib
import json
import time
from typing import Any, Dict, List
from app.database import db


class Block:
    """
    A single block in the blockchain.

    data: a dictionary containing the payload (e.g., prediction info)
    """

    def __init__(
        self,
        index: int,
        timestamp: str,
        data: Dict[str, Any],
        previous_hash: str,
        hash_value=None
    ):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.hash = hash_value or self.calculate_hash()

    def calculate_hash(self) -> str:
        """
        Calculate a SHA-256 hash of this block's contents.
        """
        block_string = json.dumps(
            {
                "index": self.index,
                "timestamp": self.timestamp,
                "data": self.data,
                "previous_hash": self.previous_hash,
            },
            sort_keys=True,
        ).encode("utf-8")

        return hashlib.sha256(block_string).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert block to a dictionary for JSON responses.
        """
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
        }


class Blockchain:
    """
    Simple in-memory blockchain implementation.

    - Starts with a genesis block
    - Supports adding new blocks
    - Supports viewing the full chain
    - Supports basic validation
    """

    def __init__(self):
        self.chain: List[Block] = []
        # self.create_genesis_block() included in load_chain
        self.load_chain()

    def load_chain(self):
        """
        Pull blockchain ledger from MongoDB and reconstruct Block objects
        """
        docs = list(db.blockchain.find().sort("index", 1))

        if not docs:
            self.create_genesis_block()
            return
        
        # reconstruct each Block from MongoDB
        self.chain = []
        for d in docs:
            block = Block(index=d["index"], timestamp=d["timestamp"], data=d["data"], previous_hash=d["previous_hash"], hash_value=d["hash"])
            self.chain.append(block)

    def save_block(self, block: Block):
        """
        Save/update a block in MongoDB using its index as the unique identifier
        """
        db.blockchain.update_one({"index": block.index}, {"$set": block.to_dict()}, upsert=True)

    def create_genesis_block(self) -> None:
        """
        Create the first block in the chain with fixed data.
        """
        genesis_block = Block(
            index=0,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            data={"message": "Genesis Block"},
            previous_hash="0",
        )
        self.chain.append(genesis_block)
        self.save_block(genesis_block)

    def get_latest_block(self) -> Block:
        return self.chain[-1]

    def add_block(self, data: Dict[str, Any]) -> Block:
        """
        Add a new block containing `data` to the chain.

        data might include things like:
        {
            "patient_email": "...",
            "prediction": "...",
            "model_confidence": 0.87,
            "created_at": "2025-11-17T21:00:00Z"
        }
        """
        latest = self.get_latest_block()
        new_block = Block(
            index=latest.index + 1,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            data=data,
            previous_hash=latest.hash,
        )
        self.chain.append(new_block)
        self.save_block(new_block)
        return new_block

    def is_valid(self) -> bool:
        """
        Basic chain validation:
        - each hash matches its contents
        - each previous_hash matches the previous block's hash
        """
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]

            if current.hash != current.calculate_hash():
                return False

            if current.previous_hash != previous.hash:
                return False

        return True

    def to_list(self) -> List[Dict[str, Any]]:
        """
        Return the whole chain as a list of dicts (for JSON responses / viewing).
        """
        return [block.to_dict() for block in self.chain]


# Create a single global blockchain instance that the app can import/use.
blockchain = Blockchain()