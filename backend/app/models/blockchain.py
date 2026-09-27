from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.core.database import Base

class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(66), unique=True, index=True, nullable=False)  # 0x...
    block_number = Column(Integer, nullable=False, index=True)
    block_hash = Column(String(66), nullable=False)
    previous_hash = Column(String(66), nullable=False)
    incident_id = Column(String(50), nullable=False, index=True)
    evidence_id = Column(String(50), nullable=False)
    evidence_hash = Column(String(64), nullable=False)  # SHA-256
    merkle_root = Column(String(66), nullable=False)
    model_version = Column(String(50), default="IBVAP-YOLO-v3.2")
    model_hash = Column(String(64), default="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    provider = Column(String(30), default="LOCAL_LEDGER")  # LOCAL_LEDGER, HYPERLEDGER_FABRIC
    status = Column(String(30), default="CONFIRMED")  # PENDING, REGISTERED, CONFIRMED, FAILED
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class LocalLedgerBlock(Base):
    __tablename__ = "local_ledger_blocks"

    block_number = Column(Integer, primary_key=True)
    block_hash = Column(String(66), unique=True, nullable=False)
    previous_hash = Column(String(66), nullable=False)
    merkle_root = Column(String(66), nullable=False)
    tx_count = Column(Integer, default=1)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
