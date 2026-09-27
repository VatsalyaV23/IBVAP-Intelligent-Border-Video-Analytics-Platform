from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.core.database import Base

class AuditLogEntry(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    user_id = Column(String(50), default="SYSTEM")
    username = Column(String(50), default="system")
    action = Column(String(100), nullable=False, index=True)  # USER_LOGIN, INCIDENT_ACKNOWLEDGED, EVIDENCE_VERIFIED, HASH_MISMATCH, etc.
    resource_type = Column(String(50), nullable=False)  # incident, evidence, camera, blockchain, user
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, default="{}")
    ip_address = Column(String(50), default="127.0.0.1")
