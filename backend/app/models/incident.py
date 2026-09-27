from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.core.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)  # INC-2026-00421
    title = Column(String(200), nullable=False)
    incident_type = Column(String(50), default="RESTRICTED_ZONE_INTRUSION")
    priority = Column(String(20), default="CRITICAL", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), default="NEW", index=True)  # NEW, UNDER_REVIEW, ACKNOWLEDGED, ASSIGNED, INVESTIGATING, ESCALATED, RESOLVED, CLOSED, FALSE_POSITIVE
    risk_score = Column(Float, default=85.0)
    explanation = Column(Text, nullable=True)  # Transparent breakdown of why incident received this priority
    sector = Column(String(50), default="IND-PAK-SECTOR-4")
    zone_ids_json = Column(Text, default="[]")
    camera_ids_json = Column(Text, default="[]")  # e.g. ["CAM-07", "CAM-04"]
    object_ids_json = Column(Text, default="[]")  # e.g. ["P-088", "P-089"]
    blockchain_status = Column(String(30), default="REGISTERED")  # PENDING, REGISTERED, CONFIRMED, VERIFICATION_FAILED
    assigned_to = Column(String(100), nullable=True)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    first_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class IncidentTimeline(Base):
    __tablename__ = "incident_timeline"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    source = Column(String(50), default="SYSTEM")  # CAM-07, ZONE-B, CORRELATION, SHA-256 PROOF, HYPERLEDGER, OFFICER
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
