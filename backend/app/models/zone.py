from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from app.core.database import Base

class Zone(Base):
    __tablename__ = "zones"

    id = Column(String(50), primary_key=True, index=True)  # e.g. ZONE-RESTRICTED-B, BORDER-LINE-DELTA
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=True)
    name = Column(String(100), nullable=False)
    zone_type = Column(String(50), default="RESTRICTED")  # RESTRICTED, BORDER_LINE, ENTRY, EXIT, PATROL, OBSERVATION
    coordinates_json = Column(Text, nullable=False)  # JSON array of points [[x, y], ...]
    severity = Column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    allowed_classes_json = Column(String(255), default="[]")  # JSON array of allowed object classes (e.g. ["patrol_vehicle"])
    loitering_seconds_threshold = Column(Integer, default=120)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
