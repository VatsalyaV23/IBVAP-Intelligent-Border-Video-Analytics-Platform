from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from app.core.database import Base

class DetectionEvent(Base):
    __tablename__ = "events"

    id = Column(String(50), primary_key=True, index=True)  # EVT-2026-XXXX
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # PERSON_DETECTED, VEHICLE_DETECTED, ZONE_ENTRY, LOITERING, UNEXPECTED_DIRECTION, etc.
    object_id = Column(String(50), nullable=True)
    track_id = Column(String(50), nullable=True, index=True)  # e.g. P-042, V-017
    confidence = Column(Float, default=0.0)
    zone_id = Column(String(50), ForeignKey("zones.id"), nullable=True)
    model_id = Column(String(50), nullable=True)
    model_version = Column(String(20), nullable=True)
    metadata_json = Column(Text, default="{}")  # bbox, speed, direction, etc.
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
