import hashlib
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.blockchain import BlockchainRecord, LocalLedgerBlock
from app.core.config import settings

class LocalLedgerProvider:
    """
    Append-only permissioned cryptographic ledger provider for IBVAP.
    Computes cryptographic block hashes and Merkle roots for registered evidence items.
    """
    @staticmethod
    def calculate_merkle_root(hashes: List[str]) -> str:
        if not hashes:
            return "0x" + hashlib.sha256(b"empty_block").hexdigest()
        current_level = hashes
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                h1 = current_level[i]
                h2 = current_level[i+1] if i+1 < len(current_level) else h1
                combined = hashlib.sha256((h1 + h2).encode('utf-8')).hexdigest()
                next_level.append(combined)
            current_level = next_level
        return "0x" + current_level[0]

    @staticmethod
    async def get_latest_block(db: AsyncSession) -> Optional[LocalLedgerBlock]:
        stmt = select(LocalLedgerBlock).order_by(LocalLedgerBlock.block_number.desc()).limit(1)
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def register_evidence_transaction(
        db: AsyncSession,
        incident_id: str,
        evidence_id: str,
        evidence_hash: str,
        model_version: str = "IBVAP-YOLO-v3.2",
        model_hash: str = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    ) -> BlockchainRecord:
        """Appends a new evidence verification record to the local ledger block."""
        latest_block = await LocalLedgerProvider.get_latest_block(db)
        if not latest_block:
            # Genesis block #12840 (matching C4ISR baseline)
            prev_hash = "0x" + hashlib.sha256(b"IBVAP_GENESIS_BLOCK_2026").hexdigest()
            block_number = 12841
        else:
            prev_hash = latest_block.block_hash
            block_number = latest_block.block_number + 1

        tx_payload = f"{incident_id}:{evidence_id}:{evidence_hash}:{datetime.now(timezone.utc).isoformat()}"
        tx_id = "0x" + hashlib.sha256(tx_payload.encode('utf-8')).hexdigest()
        merkle_root = LocalLedgerProvider.calculate_merkle_root([evidence_hash, tx_id])
        
        block_header = f"{block_number}:{prev_hash}:{merkle_root}"
        block_hash = "0x" + hashlib.sha256(block_header.encode('utf-8')).hexdigest()

        # Create Block
        block = LocalLedgerBlock(
            block_number=block_number,
            block_hash=block_hash,
            previous_hash=prev_hash,
            merkle_root=merkle_root,
            tx_count=1,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(block)

        # Create Transaction Record
        record = BlockchainRecord(
            transaction_id=tx_id,
            block_number=block_number,
            block_hash=block_hash,
            previous_hash=prev_hash,
            incident_id=incident_id,
            evidence_id=evidence_id,
            evidence_hash=evidence_hash,
            merkle_root=merkle_root,
            model_version=model_version,
            model_hash=model_hash,
            provider="LOCAL_LEDGER" if settings.BLOCKCHAIN_MODE == "LOCAL_LEDGER" else "HYPERLEDGER_FABRIC",
            status="CONFIRMED",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record
