from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from app.core.database import Base

class EvidenceItem(Base):
    __tablename__ = "evidence"

    id = Column(String(50), primary_key=True, index=True)  # EV-2026-00421-03
    incident_id = Column(String(50), ForeignKey("incidents.id"), index=True, nullable=False)
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    evidence_type = Column(String(50), nullable=False)  # PRE_EVENT_FRAME, EVENT_FRAME, POST_EVENT_FRAME, CROP_OBJECT, INCIDENT_CLIP, MANIFEST
    file_path = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(50), default="image/jpeg")
    sha256_hash = Column(String(64), nullable=False, index=True)
    status = Column(String(20), default="CAPTURED")  # CAPTURED, HASHED, REGISTERED, VERIFIED, MISMATCH, ARCHIVED
    owner_username = Column(String(50), default="operator", index=True, nullable=True)
    is_deleted_by_user = Column(Integer, default=0, index=True)
    deleted_by_username = Column(String(50), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    model_version = Column(String(50), default="IBVAP-YOLO-v3.2")
    captured_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
